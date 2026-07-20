import { NextResponse } from "next/server";
import { getCached, setCache, WCLError } from "./wcl-client";
import { ANALYSIS_CACHE_TTL } from "./constants";
import { logEvent, routeFromCacheKey } from "./observability";

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

  try {
    const result = await handler();

    // If handler returned a NextResponse directly (e.g. 404), pass it through
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
