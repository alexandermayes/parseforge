import { WCL_API_URL, WCL_TOKEN_URL, TOKEN_EXPIRY_BUFFER } from "./constants";
import { logEvent } from "./observability";
import { cacheGet, cacheSet, cacheDelete } from "./kv-cache";

// ─── Typed errors ────────────────────────────────────────────────────
// wclQuery throws WCLError so routes can map failures to clean, actionable
// messages + correct HTTP status instead of leaking raw WCL/GraphQL strings
// in a 500. `detail` is for server logs only — never send it to the client.

export type WCLErrorKind =
  | "not_found"
  | "private"
  | "rate_limited"
  | "timeout"
  | "upstream";

const WCL_ERROR_INFO: Record<WCLErrorKind, { status: number; message: string }> = {
  not_found: {
    status: 404,
    message: "That report doesn't exist. Double-check the Warcraft Logs URL.",
  },
  private: {
    status: 403,
    message:
      "This log looks private. Open the report on Warcraft Logs, set its visibility to Public or Unlisted, then try again.",
  },
  rate_limited: {
    status: 429,
    message: "Warcraft Logs is rate-limiting requests right now — please try again in a moment.",
  },
  timeout: {
    status: 504,
    message: "Warcraft Logs took too long to respond. Please try again.",
  },
  upstream: {
    status: 502,
    message: "Couldn't reach Warcraft Logs. Please try again shortly.",
  },
};

export class WCLError extends Error {
  readonly kind: WCLErrorKind;
  readonly status: number;
  readonly userMessage: string;
  constructor(kind: WCLErrorKind, detail?: string) {
    const info = WCL_ERROR_INFO[kind];
    super(detail ?? info.message);
    this.name = "WCLError";
    this.kind = kind;
    this.status = info.status;
    this.userMessage = info.message;
  }
}

function classifyGraphQLError(message: string): WCLErrorKind {
  const m = message.toLowerCase();
  if (m.includes("does not exist") || m.includes("not found") || m.includes("no such report"))
    return "not_found";
  if (
    m.includes("permission") ||
    m.includes("private") ||
    m.includes("not authorized") ||
    m.includes("do not have") ||
    m.includes("access")
  )
    return "private";
  return "upstream";
}

// The WCL OAuth token is cached at two levels: module scope (fastest, per
// serverless instance) and shared Redis (so a cold instance reuses a token
// another instance already minted instead of spending a fresh token request —
// every mint counts against the same client). Without Redis, only the module
// cache is used, exactly as before.
const TOKEN_CACHE_KEY = "wcl:token";
interface CachedWclToken {
  token: string;
  expiresAt: number; // epoch seconds
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/** Drop the cached token from BOTH module scope and Redis (used on a 401). */
async function clearAccessToken(): Promise<void> {
  cachedToken = null;
  tokenExpiresAt = 0;
  await cacheDelete(TOKEN_CACHE_KEY);
}

async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

  // 1. Module scope — fastest, no network.
  if (cachedToken && tokenExpiresAt > now + TOKEN_EXPIRY_BUFFER) {
    return cachedToken;
  }

  // 2. Shared Redis — reuse a token another instance already minted if valid.
  const shared = await cacheGet<CachedWclToken>(TOKEN_CACHE_KEY);
  if (shared && shared.expiresAt > now + TOKEN_EXPIRY_BUFFER) {
    cachedToken = shared.token;
    tokenExpiresAt = shared.expiresAt;
    return shared.token;
  }

  // 3. Mint a fresh token from WCL and write it back to both layers.
  const clientId = process.env.WCL_CLIENT_ID;
  const clientSecret = process.env.WCL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing WCL_CLIENT_ID or WCL_CLIENT_SECRET in environment variables. " +
        "Register at https://www.warcraftlogs.com/api/clients"
    );
  }

  const res = await fetch(WCL_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WCL OAuth token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const token: string = data.access_token;
  cachedToken = token;
  tokenExpiresAt = now + data.expires_in;

  // Cache in Redis just short of expiry (minus the refresh buffer) so it's never
  // served stale. Best-effort — cacheSet never throws.
  const ttlMs = Math.max(0, data.expires_in - TOKEN_EXPIRY_BUFFER) * 1000;
  if (ttlMs > 0) {
    await cacheSet(
      TOKEN_CACHE_KEY,
      { token, expiresAt: tokenExpiresAt } satisfies CachedWclToken,
      ttlMs,
    );
  }

  return token;
}

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];
const REQUEST_TIMEOUT_MS = 30_000;
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const QUERY_CACHE_MAX_SIZE = 500;

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

// Query-level cache: deduplicates identical WCL queries across routes
const queryCache = new Map<string, { data: unknown; expiresAt: number }>();

function queryCacheKey(query: string, variables: Record<string, unknown>): string {
  // Simple fast hash — djb2 on the combined string
  const str = query + JSON.stringify(variables);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return `qc_${hash >>> 0}`;
}

function getQueryCache<T>(key: string): T | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setQueryCache(key: string, data: unknown): void {
  // Evict oldest entries if at capacity
  if (queryCache.size >= QUERY_CACHE_MAX_SIZE) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey !== undefined) queryCache.delete(firstKey);
  }
  queryCache.set(key, { data, expiresAt: Date.now() + QUERY_CACHE_TTL_MS });
}

export async function wclQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  // Check query-level cache first
  const cacheKey = queryCacheKey(query, variables);
  const cached = getQueryCache<T>(cacheKey);
  if (cached !== undefined) return cached;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const token = await getAccessToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(WCL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // 401 = token expired between cache check and use — clear BOTH the module
      // and Redis copies so the next attempt mints a fresh one, then retry.
      if (res.status === 401) {
        await clearAccessToken();
        lastError = new Error("WCL token expired, retrying");
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        if (isRetryable(res.status) && attempt < MAX_RETRIES - 1) {
          // Rare by design — a spike here signals WCL rate-limit/budget pressure.
          logEvent("wcl_retry", { status: res.status, attempt: attempt + 1 });
          lastError = new Error(`WCL ${res.status}`);
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
          continue;
        }
        throw new WCLError(
          res.status === 429 ? "rate_limited" : "upstream",
          `HTTP ${res.status}: ${text}`,
        );
      }

      const json = await res.json();

      if (json.errors && json.errors.length > 0) {
        const detail = json.errors.map((e: { message: string }) => e.message).join(", ");
        throw new WCLError(classifyGraphQLError(detail), `GraphQL: ${detail}`);
      }

      const result = json.data as T;
      setQueryCache(cacheKey, result);
      return result;
    } catch (err) {
      clearTimeout(timeout);

      // AbortController timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt < MAX_RETRIES - 1) {
          logEvent("wcl_retry", { status: "timeout", attempt: attempt + 1 });
          lastError = new Error("WCL timeout");
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
          continue;
        }
        throw new WCLError("timeout", `timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
      }

      // Already-classified (GraphQL/HTTP) errors pass through; wrap the rest
      // (network failures, etc.) so nothing raw escapes to the client.
      if (err instanceof WCLError) throw err;
      throw new WCLError("upstream", err instanceof Error ? err.message : String(err));
    }
  }

  throw new WCLError("upstream", lastError?.message ?? "failed after retries");
}

// Result-level cache (analysis results, raid overviews, CLA results).
// Backed by a shared store (Upstash Redis on Vercel) when configured, falling
// back to a per-instance Map otherwise — see lib/kv-cache.ts.
export { cacheGet as getCached, cacheSet as setCache } from "./kv-cache";
