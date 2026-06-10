// Lightweight server-side observability.
//
// Emits one structured JSON line per event so metrics are queryable in Vercel
// logs (and any log drain) with zero added latency and no dependencies. The
// shape is intentionally flat and low-cardinality so events aggregate cleanly:
// cache hit rate, per-route latency, error rates by kind, and WCL retry/429
// pressure.
//
// Extension point: to also stream these into PostHog (project 337485) alongside
// the client events, forward from `logEvent` via posthog-node here, flushing in
// a Vercel `after()` callback so it never blocks the response.

type LogValue = string | number | boolean | null | undefined;
export type LogProps = Record<string, LogValue>;

export function logEvent(event: string, props: LogProps = {}): void {
  try {
    // The event name lives under `metric` (filter logs by `"metric":`). Props
    // are spread last but can't clobber the marker since the key differs from
    // any prop name (e.g. an error `kind` prop won't collide).
    console.log(JSON.stringify({ metric: event, ...props }));
  } catch {
    // Observability must never break a request.
  }
}

/** Derive a low-cardinality route label from a cache key like "analyze-CODE-40-23". */
export function routeFromCacheKey(cacheKey: string): string {
  const dash = cacheKey.indexOf("-");
  return dash === -1 ? cacheKey : cacheKey.slice(0, dash);
}
