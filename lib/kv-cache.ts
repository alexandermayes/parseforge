// Shared result cache.
//
// On Vercel, the previous in-process Map cache was per-instance and ephemeral:
// under load each concurrent function instance had its own heap, so a report
// cached on instance A was a full miss on instance B, collapsing the hit rate
// toward ~1/N and fanning every miss out into 3–34 live WCL calls.
//
// This module uses Upstash Redis (provisioned via the Vercel Marketplace) when
// its env vars are present, giving a single cache shared across all instances
// and regions. When the vars are absent (local dev, or before provisioning) it
// transparently falls back to the same per-instance Map as before — so behavior
// is unchanged until the integration is added, and a Redis outage degrades to
// the in-memory cache rather than failing the request.
//
// Supports both the Vercel KV (`KV_REST_API_*`) and native Upstash
// (`UPSTASH_REDIS_REST_*`) env var names the Marketplace integration injects.

const REDIS_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

/** True when a shared Redis cache is configured. Exposed for diagnostics/logging. */
export const usingSharedCache = Boolean(REDIS_URL && REDIS_TOKEN);

// ─── Per-instance fallback (also the safety net if Redis errors) ─────
const MEM_MAX_SIZE = 200;
const mem = new Map<string, { value: unknown; expiresAt: number }>();

function memGet<T>(key: string): T | null {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry.value as T;
}

function memSet(key: string, value: unknown, ttlMs: number): void {
  if (mem.size >= MEM_MAX_SIZE) {
    const oldest = mem.keys().next().value;
    if (oldest !== undefined) mem.delete(oldest);
  }
  mem.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── Upstash Redis REST (command-as-JSON-array form) ─────────────────
async function redisCmd(command: (string | number)[]): Promise<{ result: unknown }> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return res.json();
}

/** Get a JSON-serializable value. Returns null on miss, expiry, or any error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (usingSharedCache) {
    try {
      const { result } = await redisCmd(["GET", key]);
      return typeof result === "string" ? (JSON.parse(result) as T) : null;
    } catch (err) {
      console.error(`[kv-cache] GET ${key} failed, using memory: ${(err as Error).message}`);
      return memGet<T>(key);
    }
  }
  return memGet<T>(key);
}

/** Set a JSON-serializable value with a TTL (milliseconds). Best-effort; never throws. */
export async function cacheSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  const ttlSec = Math.max(1, Math.round(ttlMs / 1000));
  if (usingSharedCache) {
    try {
      await redisCmd(["SET", key, JSON.stringify(value), "EX", ttlSec]);
      return;
    } catch (err) {
      console.error(`[kv-cache] SET ${key} failed, using memory: ${(err as Error).message}`);
      memSet(key, value, ttlMs);
      return;
    }
  }
  memSet(key, value, ttlMs);
}

// ─── Recently-indexed reports (feeds the sitemap) ────────────────────
// A sorted set of report codes scored by last-seen timestamp, written each
// time a public report is server-rendered. Only active when shared Redis is
// configured; without it the sitemap simply omits report URLs (local dev).
const RECENT_REPORTS_KEY = "pf:recent_reports";

/** Record a public report as recently rendered. Best-effort; never throws. */
export async function recordRecentReport(code: string, ts: number): Promise<void> {
  if (!usingSharedCache) return;
  try {
    await redisCmd(["ZADD", RECENT_REPORTS_KEY, ts, code]);
  } catch (err) {
    console.error(`[kv-cache] recordRecentReport ${code} failed: ${(err as Error).message}`);
  }
}

/** Most-recently-rendered public report codes, newest first. */
export async function getRecentReports(
  limit: number,
): Promise<{ code: string; ts: number }[]> {
  if (!usingSharedCache) return [];
  try {
    const { result } = await redisCmd([
      "ZREVRANGE",
      RECENT_REPORTS_KEY,
      0,
      limit - 1,
      "WITHSCORES",
    ]);
    if (!Array.isArray(result)) return [];
    const out: { code: string; ts: number }[] = [];
    for (let i = 0; i < result.length; i += 2) {
      out.push({ code: String(result[i]), ts: Number(result[i + 1]) });
    }
    return out;
  } catch (err) {
    console.error(`[kv-cache] getRecentReports failed: ${(err as Error).message}`);
    return [];
  }
}
