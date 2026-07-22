import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMITS, RATE_LIMIT_WINDOW } from "./constants";
import { logEvent } from "./observability";

// Per-IP sliding-window rate limiting for the API routes, backed by the same
// Upstash Redis the result cache uses.
//
// Env resolution mirrors lib/kv-cache.ts EXACTLY — Vercel KV (`KV_REST_API_*`)
// or native Upstash (`UPSTASH_REDIS_REST_*`) — so both features light up from
// the same credentials the Marketplace integration injects. When Redis is not
// configured (local dev, or before provisioning) rate limiting is a no-op that
// always allows, the same graceful-degradation contract as the cache. A Redis
// error at request time also fails OPEN (allow), so a transient Redis blip can
// never take the whole site down.

const REDIS_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

/** True when a shared Redis is configured — mirrors kv-cache's `usingSharedCache`. */
const enabled = Boolean(REDIS_URL && REDIS_TOKEN);

// Construct the client manually rather than Redis.fromEnv(): fromEnv() only
// reads the UPSTASH_* names and would miss the KV_REST_API_* names the Vercel
// Marketplace integration injects.
const redis = enabled ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

// One limiter per bucket, created lazily and reused across requests on the same
// instance (each holds its own sliding window).
const limiters = new Map<string, Ratelimit>();

function limiterFor(bucket: string): Ratelimit {
  let limiter = limiters.get(bucket);
  if (!limiter) {
    const limit = RATE_LIMITS[bucket] ?? 30; // conservative default for unknown buckets
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, RATE_LIMIT_WINDOW),
      prefix: `rl:${bucket}`,
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

/** Client identity for rate limiting: first x-forwarded-for entry, else "anon". */
function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim();
  return ip || "anon";
}

/**
 * Rate-limit gate for an API route. Returns a 429 `NextResponse` (with a
 * `Retry-After` header) when the caller is over the limit for `bucket`, or
 * `null` when the request may proceed. Returns `null` (allows) when Redis is
 * not configured, and fails open on any Redis error.
 *
 * Call it as the first thing after body/param parsing in each route.
 */
export async function checkRateLimit(
  request: Request,
  bucket: string,
): Promise<NextResponse | null> {
  if (!enabled || !redis) return null;

  try {
    const { success, reset } = await limiterFor(bucket).limit(clientKey(request));
    if (success) return null;

    logEvent("rate_limited", { route: bucket });
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  } catch (err) {
    // Fail open: a rate-limiter outage must not break the API.
    console.error(
      `[rate-limit] ${bucket} check failed, allowing request: ${(err as Error).message}`,
    );
    return null;
  }
}
