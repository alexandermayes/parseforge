import { WCL_API_URL, WCL_TOKEN_URL, TOKEN_EXPIRY_BUFFER } from "./constants";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

  if (cachedToken && tokenExpiresAt > now + TOKEN_EXPIRY_BUFFER) {
    return cachedToken;
  }

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
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in;

  return cachedToken!;
}

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];
const REQUEST_TIMEOUT_MS = 30_000;

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function wclQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
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

      // 401 = token expired between cache check and use — refresh and retry
      if (res.status === 401) {
        cachedToken = null;
        tokenExpiresAt = 0;
        lastError = new Error("WCL token expired, retrying");
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        lastError = new Error(`WCL API request failed (${res.status}): ${text}`);
        if (isRetryable(res.status) && attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
          continue;
        }
        throw lastError;
      }

      const json = await res.json();

      if (json.errors && json.errors.length > 0) {
        throw new Error(
          `WCL GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
        );
      }

      return json.data as T;
    } catch (err) {
      clearTimeout(timeout);

      // AbortController timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new Error(`WCL API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
          continue;
        }
        throw lastError;
      }

      // Non-retryable errors (network failures, GraphQL errors) — don't retry
      throw err;
    }
  }

  throw lastError ?? new Error("WCL query failed after retries");
}

// Simple in-memory analysis cache
const analysisCache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    analysisCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  analysisCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
