import { NextResponse } from "next/server";
import { getCached, setCache, WCLError } from "./wcl-client";
import { ANALYSIS_CACHE_TTL } from "./constants";

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

/**
 * Wraps an API route handler with cache check and error handling.
 * Returns cached result if available, otherwise runs the handler,
 * caches the result, and returns it. Catches errors and returns 500.
 */
export async function cachedApiHandler<T>(
  cacheKey: string,
  handler: () => Promise<T | NextResponse>,
): Promise<NextResponse> {
  const cached = await getCached<T>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await handler();

    // If handler returned a NextResponse directly (e.g. 404), pass it through
    if (result instanceof NextResponse) {
      return result;
    }

    await setCache(cacheKey, result, ANALYSIS_CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
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
