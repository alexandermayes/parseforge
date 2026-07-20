import { NextResponse } from "next/server";
import { getCached, setCache, WCLError } from "./wcl-client";
import { usingSharedCache, cacheLock, cacheUnlock } from "./kv-cache";
import { ANALYSIS_CACHE_TTL } from "./constants";
import { logEvent, routeFromCacheKey } from "./observability";

// Single-flight wait tuning: a request that lost the lock polls the cache this
// long before giving up and computing itself, checking this often.
const CACHE_WAIT_MS = 15_000;
const CACHE_POLL_MS = 500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll the shared cache until it fills or we exhaust the wait budget. */
async function waitForCache<T>(cacheKey: string): Promise<T | null> {
  const deadline = Date.now() + CACHE_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(CACHE_POLL_MS);
    const cached = await getCached<T>(cacheKey);
    if (cached) return cached;
  }
  return null;
}

/**
 * Map any caught error to a clean client response. WCLError carries an
 * actionable user message + correct status; everything else becomes a generic
 * 500 so raw WCL/GraphQL/internal strings never leak to the browser. The real
 * error is always logged server-side.
 */
export function errorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof WCLError) {
    console.error(`[${context}] WCLError(${error.kind}): ${error.message}`);
    return NextResponse.json(
      { error: error.userMessage, kind: error.kind },
      { status: error.status },
    );
  }
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Unexpected error: ${detail}`);
  return NextResponse.json(
    { error: "Something went wrong analyzing this log. Please try again." },
    { status: 500 },
  );
}

/** WCL report codes are 10–20 alphanumeric chars. Shared by every route that
 * accepts a code so validation (and cache-key hygiene) stays consistent — bad
 * codes must never reach a WCL query or pollute a cache key. */
export const REPORT_CODE_RE = /^[a-zA-Z0-9]{10,20}$/;
export function isValidReportCode(code: unknown): code is string {
  return typeof code === "string" && REPORT_CODE_RE.test(code);
}

/** 400 with a clean client-facing message. */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Wraps an API route handler with cache check and error handling.
 * Returns cached result if available, otherwise runs the handler,
 * caches the result, and returns it. Catches errors and returns 500.
 */
export async function cachedApiHandler<T>(
  cacheKey: string,
  handler: () => Promise<T | NextResponse>,
): Promise<NextResponse> {
  const route = routeFromCacheKey(cacheKey);
  const start = Date.now();

  const cached = await getCached<T>(cacheKey);
  if (cached) {
    logEvent("api_request", { route, cache: "hit", outcome: "ok", ms: Date.now() - start });
    return NextResponse.json(cached);
  }

  // The original miss path — run the handler, cache the result, return it.
  // Extracted so the single-flight branch below can reuse it.
  const runAndCache = async (): Promise<NextResponse> => {
    try {
      const result = await handler();

      // If handler returned a NextResponse directly (e.g. 404), pass it through
      // (and don't cache it).
      if (result instanceof NextResponse) {
        logEvent("api_request", {
          route,
          cache: "miss",
          outcome: "early_return",
          status: result.status,
          ms: Date.now() - start,
        });
        return result;
      }

      await setCache(cacheKey, result, ANALYSIS_CACHE_TTL);
      logEvent("api_request", { route, cache: "miss", outcome: "ok", ms: Date.now() - start });
      return NextResponse.json(result);
    } catch (error) {
      logEvent("api_request", {
        route,
        cache: "miss",
        outcome: "error",
        kind: error instanceof WCLError ? error.kind : "unknown",
        ms: Date.now() - start,
      });
      return errorResponse(error, cacheKey);
    }
  };

  // Without shared Redis there's nothing to coordinate across instances — run
  // directly, exactly as before.
  if (!usingSharedCache) return runAndCache();

  // Single-flight: only the lock holder fans out to WCL for this key. Everyone
  // else waits for the cache to fill, collapsing a stampede (50 people opening
  // the same freshly-shared report at once) into one upstream computation.
  const acquired = await cacheLock(cacheKey);
  if (!acquired) {
    const waited = await waitForCache<T>(cacheKey);
    if (waited) {
      logEvent("api_request", { route, cache: "wait_hit", outcome: "ok", ms: Date.now() - start });
      return NextResponse.json(waited);
    }
    // The holder never filled the cache (slow, errored, or returned an early
    // 404). Compute ourselves rather than dead-ending the user.
    return runAndCache();
  }

  try {
    return await runAndCache();
  } finally {
    // Release promptly so waiters proceed; the lock's EX TTL backstops a crash.
    await cacheUnlock(cacheKey);
  }
}

/**
 * Parse and validate a POST request body. Returns the parsed body or a 400 response.
 */
export async function parseBody<T>(
  request: Request,
  requiredFields: (keyof T)[],
): Promise<{ body: T } | { error: NextResponse }> {
  let body: T;
  try {
    body = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid request body" }, { status: 400 }) };
  }

  for (const field of requiredFields) {
    // Reject only genuinely-missing values. A plain `!value` check wrongly
    // rejects 0, which is a valid WCL fightId/sourceId (slots are 0-indexed).
    const value = body[field];
    if (value == null || value === "") {
      return {
        error: NextResponse.json(
          { error: `Missing required field: ${String(field)}` },
          { status: 400 },
        ),
      };
    }
  }

  return { body };
}
