import { NextResponse } from "next/server";
import { getCached, setCache } from "./wcl-client";
import { ANALYSIS_CACHE_TTL } from "./constants";

/**
 * Wraps an API route handler with cache check and error handling.
 * Returns cached result if available, otherwise runs the handler,
 * caches the result, and returns it. Catches errors and returns 500.
 */
export async function cachedApiHandler<T>(
  cacheKey: string,
  handler: () => Promise<T | NextResponse>,
): Promise<NextResponse> {
  const cached = getCached<T>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await handler();

    // If handler returned a NextResponse directly (e.g. 404), pass it through
    if (result instanceof NextResponse) {
      return result;
    }

    setCache(cacheKey, result, ANALYSIS_CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`API error [${cacheKey}]:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
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
    if (!body[field]) {
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
