# External Integrations

**Analysis Date:** 2026-09-04

## APIs & External Services

**Warcraft Logs (WCL):**
- GraphQL API for raid log data (DPS, HPS, gear, buffs, talents, consumables, rankings)
- SDK/Client: `lib/wcl-client.ts` (custom implementation with retry/caching)
- Auth: OAuth via `WCL_CLIENT_ID` and `WCL_CLIENT_SECRET`
- Token URL: `https://www.warcraftlogs.com/oauth/token`
- API URL: `https://www.warcraftlogs.com/api/v2/client`
- Caching: 5-minute query cache (per instance) + shared Redis cache
- Retry: 3 attempts with exponential backoff (1s, 2s, 4s) on 429/5xx
- Timeout: 30 seconds per request

**Wowhead:**
- External tooltips for WoW items, spells, gems
- Script: `https://wow.zamimg.com/js/tooltips.js` (loaded after interactive)
- Config: Inline script in `app/layout.tsx` sets `whTooltips` object (colorLinks, iconizeLinks, renameLinks, small icons)
- Supported domains: classic, tbc, wrath, cata, mists (mapped in `lib/constants.ts`)

## Data Storage

**Databases:**
- None (stateless application)

**File Storage:**
- None (all analysis computed on-request from WCL)

**Caching:**
- Upstash Redis (shared across instances)
  - Connection: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Vercel KV) OR `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Client: `@upstash/redis` (REST API via fetch, not TCP)
  - Purpose: Analysis results (10-min TTL), WCL token cache, rate-limit sliding windows, recent reports sorted set
  - Fallback: Per-instance `Map` (capacity 200 entries) when Redis unavailable
  - Graceful degradation: Cache misses on Redis errors, not failures

## Authentication & Identity

**Auth Provider:**
- None (site is public, no user accounts)

**API Authentication:**
- WCL OAuth 2.0 (client credentials flow): `lib/wcl-client.ts`
  - Token cached in module scope + shared Redis (fastest → shared → mint new)
  - Automatic refresh if 401 on request
  - Cache location: `lib/kv-cache.ts` under key `wcl:token`

## Monitoring & Observability

**Error Tracking:**
- None (structured logging only)

**Logs:**
- Server-side: Structured JSON lines via `console.log` from `lib/observability.ts`
  - Format: `{ metric: "event_name", ...props }`
  - queryable in Vercel logs/log drains
  - Events: cache hits/misses, WCL retries, rate limiting, errors by kind
- Analytics: PostHog (client events + session replays)

**Metrics:**
- Vercel Analytics (Core Web Vitals: LCP, FID, CLS)
- Vercel Speed Insights (Real User Monitoring)

## CI/CD & Deployment

**Hosting:**
- Vercel (team `loot-list-plus`, project `parseforge`)
- Domain: `parseforge.gg`
- Deployment trigger: Manual CLI only (no git auto-deploy)

**CI Pipeline:**
- None (Vercel builds on each manual deploy)

## Environment Configuration

**Required env vars (Vercel Production):**
- `WCL_CLIENT_ID` - Warcraft Logs API client ID
- `WCL_CLIENT_SECRET` - Warcraft Logs API client secret (live credential)
- `KV_REST_API_URL` - Upstash Redis REST endpoint (or `UPSTASH_REDIS_REST_URL`)
- `KV_REST_API_TOKEN` - Upstash Redis token (or `UPSTASH_REDIS_REST_TOKEN`)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key (public, safe to expose)
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog ingestion host (public)

**Optional:**
- Node environment variables for feature flags/debugging (e.g., `NODE_ENV`)

**Secrets location:**
- Vercel Project Settings → Environment Variables (production slot)
- View via: `vercel env ls production --scope loot-list-plus`
- Provisioned via Vercel Marketplace: `upstash-kv-amber-bell`

**Never commit:**
- `.env*` files (gitignored)
- Credential values in code or logs
- API keys in documentation

## Webhooks & Callbacks

**Incoming:**
- None (site only fetches, no inbound integrations)

**Outgoing:**
- PostHog: Event ingestion via `api_host: "/ingest"` rewrite (masked from external)
- Vercel Analytics: Automatic Web Vitals submission
- Vercel Speed Insights: RUM data submission

## Content Delivery

**External Scripts:**
- Wowhead tooltips: `https://wow.zamimg.com/js/tooltips.js` (strategy: afterInteractive)
- PostHog: Ingest rewrite → `https://us.i.posthog.com/` (CSP allows connect-src to this domain)
- PostHog assets: Rewrite `/ingest/static/*` → `https://us-assets.i.posthog.com/*`

## Network & CSP

**Content-Security-Policy (Report-Only):**
- `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wow.zamimg.com` - Allows Wowhead + Next inline scripts + PostHog eval
- `style-src 'self' 'unsafe-inline'` - Tailwind inline styles
- `connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com` - PostHog ingestion
- `img-src 'self' data: https:` - Local + data URIs + any HTTPS
- `font-src 'self' data:` - Local fonts
- `worker-src 'self' blob:` - PostHog session replay workers

## Rate Limiting

**Per-IP, sliding window (Upstash Redis):**
- Bucket: `rl:{route}` (prefix)
- Window: 60 seconds
- Limits (env-configurable in `lib/constants.ts`):
  - `/api/analyze` - 30 req/min
  - `/api/raid-overview` - 30 req/min
  - `/api/cla` - 10 req/min (tightest; fans out most)
  - `/api/report/[code]` - 60 req/min
  - `/api/report/[code]/players` - 60 req/min
- Returns 429 with `Retry-After` header when exceeded
- Falls open gracefully (allows) when Redis unavailable or on error
- Client identity: `x-forwarded-for` header (first IP) or "anon"

## Cache Strategy

**Query-level (5-min TTL, per-instance Map):**
- WCL GraphQL queries deduped via hash of query + variables
- Capacity: 500 entries, FIFO eviction

**Result-level (10-min TTL, shared Redis):**
- Analysis results, raid overviews, CLA results
- Key pattern: `analyze-{code}`, `raid-overview-{code}`, `cla-{code}`
- Fallback to memory cache (200 entries) when Redis unavailable

**Lock-based single-flight (cache-stampede protection):**
- Short-lived locks (`lock:{key}`, 20s TTL) in Redis
- Only when shared cache enabled
- Prevents N-way thundering herd on cache miss

**Recent reports (sorted set):**
- Key: `pf:recent_reports`
- Score: unix timestamp
- Used to auto-populate sitemap (`sitemap.ts`)
- Recorded each time a public report is server-rendered

---

*Integration audit: 2026-09-04*
