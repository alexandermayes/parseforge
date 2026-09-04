<!-- refreshed: 2026-09-04 -->
# Architecture

**Analysis Date:** 2026-09-04

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend (React 19 + SSR)                  │
├──────────────┬─────────────────────┬──────────────┬─────────────────────┤
│   Landing    │   Analyze Page      │  Guides      │   OG Image          │
│   `page.tsx` │  `[reportCode]/`    │   `/guides`  │   Generation        │
└──────┬───────┴──────────┬──────────┴──────┬───────┴─────────┬───────────┘
       │                  │                  │                 │
       │                  ▼                  │                 │
       │        ┌──────────────────────┐    │                 │
       │        │  Client-Side Hydration   │    │                 │
       │        │  (React hooks + SWR)     │    │                 │
       │        │  `AnalyzeClient.tsx`     │    │                 │
       │        └──────────┬───────────┘    │                 │
       │                  │                 │                 │
       ▼                  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Routes Layer                                 │
│  `/api/report/[code]` | `/api/analyze` | `/api/raid-overview` | `/api/cla` │
│            `app/api/*/*.ts`                                              │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│          Business Logic Engines (`lib/`)                 │
│  analysis-engine.ts | raid-overview-engine.ts            │
│  cla-engine.ts | wcl-client.ts | wcl-fetchers.ts         │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│          Caching Layer                                   │
│  Query Cache (in-process)  →  Shared Cache (Redis)       │
│  kv-cache.ts | wcl-client.ts                             │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│          External Services                               │
│  Warcraft Logs GraphQL API  |  Upstash Redis             │
│  PostHog Analytics          |  Wowhead Integration       │
└──────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Landing Page** | ISR homepage; renders featured reports; links to guides for SEO | `app/page.tsx` |
| **Analyze Page** | SSR report loading; metadata generation; canonical URLs; noindex private/error reports | `app/analyze/[reportCode]/page.tsx` |
| **AnalyzeClient** | Client-side state management; tab switching; fight/player selection; loads analysis views | `app/analyze/[reportCode]/AnalyzeClient.tsx` |
| **Analysis Views** | Three tabs: raid-wide metrics (RaidOverview), player DPS/HPS comparison (AnalysisView), class audit (CLAView) | `app/components/RaidOverview.tsx`, `AnalysisView.tsx`, `CLAView.tsx` |
| **WCL Client** | OAuth token management; GraphQL query execution; query cache; retries; error classification | `lib/wcl-client.ts` |
| **Caching Layer** | Two-tier: query-level (5-min in-process), result-level (shared Redis when provisioned, per-instance Map fallback) | `lib/kv-cache.ts` |
| **Analysis Engine** | Converts WCL player data into DPS percentiles, gear audits, talent analysis, improvement suggestions | `lib/analysis-engine.ts` |
| **Raid Overview Engine** | Raid-wide metrics: deaths, consumables, buff coverage, role assignments, throughput distribution | `lib/raid-overview-engine.ts` |
| **CLA Engine** | Class Loadout Audit: gear, enchants, gems, consumables, buff tracking, best-in-slot comparisons | `lib/cla-engine.ts` |
| **Report Metadata** | Fetches and caches report meta (title, zone, fights, players) for SSR and API; records public reports for sitemap | `lib/report-meta.ts` |
| **Rate Limiting** | Per-IP, per-route limits; backed by Upstash Ratelimit; protects WCL quota | `lib/rate-limit.ts` |
| **API Utils** | Cached API handler (single-flight); error mapping; body parsing; validation | `lib/api-utils.ts` |

## Pattern Overview

**Overall:** Server-Side Rendering (SSR) + Incremental Static Regeneration (ISR) with client-side hydration and lazy API loading

**Key Characteristics:**
- **Dual caching strategy**: Query-level (GraphQL deduplication) + result-level (analysis output), both with fallback to per-instance cache
- **Single-flight protection**: When shared Redis is available, only the first request for a cache miss fans out to WCL; others wait
- **Error as data**: Not thrown but returned discriminated unions (`status: "ok" | "not_found" | "private" | "error"`), so pages can choose response (index, noindex, 404)
- **Client-side lazy loading**: Report metadata loads via SSR; analysis, raid overview, CLA all fetch on-demand via client hooks
- **Spec detection**: Healer specs trigger automatic role detection and re-query with healing instead of DPS table

## Layers

**Presentation (`app/page.tsx`, `app/analyze/`, `app/components/`):**
- Purpose: Render pages and components; handle routing, metadata generation, SEO invariants (canonical URLs, noindex rules)
- Location: `app/`
- Contains: Page components, client components, hooks, layout
- Depends on: API routes, client-side fetcher (SWR), PostHog analytics
- Used by: Next.js App Router

**Client Hydration (`app/analyze/[reportCode]/AnalyzeClient.tsx`, `hooks/`):**
- Purpose: Interactive state management; tab switching; fight/player selection; load analysis on demand
- Location: `app/analyze/[reportCode]/`
- Contains: React hooks (useReportMeta, useRaidOverview, usePlayerAnalysis, useCLA) wrapped with SWR fetcher
- Depends on: API routes for data fetching
- Used by: Analyze page; drives three distinct analysis modes (raid, player, CLA)

**API Routes (`app/api/`):**
- Purpose: Validate requests; check rate limits; call business logic; handle errors; cache results
- Location: `app/api/`
- Contains: `report/[code]/route.ts` (fetch report meta), `analyze` (player DPS/HPS analysis), `raid-overview` (raid metrics), `cla` (class audit)
- Depends on: Business logic engines, WCL client, caching layer, rate limiting
- Used by: Client-side hooks via SWR fetcher

**Business Logic Engines (`lib/analysis-engine.ts`, `lib/raid-overview-engine.ts`, `lib/cla-engine.ts`):**
- Purpose: Convert raw WCL data into actionable analysis results
- Location: `lib/`
- Contains: Percentile calculations, gear/talent/buff comparison logic, consumable detection, improvement suggestions, death tracking
- Depends on: WCL types, constants, CLA constants (item/enchant/gem databases)
- Used by: API routes; produces cacheable JSON results

**WCL Integration (`lib/wcl-client.ts`, `lib/wcl-queries.ts`, `lib/wcl-fetchers.ts`):**
- Purpose: GraphQL client, query execution, token management, retry/timeout handling
- Location: `lib/`
- Contains: OAuth token cache (module + Redis), retry backoff (3 attempts), query-level cache (5-min, 500-entry LRU), error classification
- Depends on: Caching layer (for token cache), constants (URLs, timeouts)
- Used by: API routes for all WCL data fetches

**Caching Layer (`lib/kv-cache.ts`):**
- Purpose: Shared result cache across Vercel instances via Upstash Redis when provisioned; per-instance Map fallback
- Location: `lib/kv-cache.ts`
- Contains: Redis REST adapter, dual-layer get/set (Redis + memory), single-flight locks, recent reports sorted set (for sitemap)
- Depends on: Environment variables (KV_REST_API_URL, KV_REST_API_TOKEN)
- Used by: WCL client (query cache), API routes (result cache), report-meta (recent reports)

**Server-Side Utilities:**
- **report-meta.ts:** Wraps WCL report fetch in React `cache()` so generateMetadata and page both use one call; records public reports
- **api-utils.ts:** Cached API handler with single-flight wait, error mapping, body validation
- **rate-limit.ts:** Per-IP, per-route limiting via Upstash Ratelimit
- **constants.ts:** Gear slots, spec icons, class colors, WoW item/buff/encounter database mappings
- **cla-constants.ts:** Gem, enchant, consumable, talent ID database maps (regened from wago.tools)

## Data Flow

### Primary Request Path (Report Analysis)

1. User lands on `/analyze/[reportCode]` → **Page renders** (`app/analyze/[reportCode]/page.tsx`)
   - Calls `getReportMeta(code)` (wrapped in React `cache()` so shared with generateMetadata)
   - Returns report metadata (fights, players) or error/not_found/private status
   - If `not_found`, returns 404; if error, renders error UI with noindex; if ok, renders AnalyzeClient

2. **AnalyzeClient hydrates** on browser
   - useState for selectedFight, selectedSource, activeTab (restored from URL params via searchParams)
   - useReportMeta hook fetches `/api/report/[code]` → lists fights and players
   - Auto-selects first kill fight (or first fight if no kills)

3. User selects fight & player, then selects **Player Analysis tab** → `usePlayerAnalysis` hook fires
   - POST `/api/analyze` { reportCode, fightId, sourceId, encounterID?, encounterName?, zoneName?, zoneExpansionId? }
   - Server validates request, checks rate limit, hits cache key `analyze-{reportCode}-{fightId}-{sourceId}`
   - If cached, returns result immediately; if miss, runs `buildAnalysisResult`:
     a. Fetches player full data (DPS or healing table depending on role)
     b. Extracts gear, talents, damage/healing/buffs/casts
     c. Fetches encounter rankings for player class/spec (scoped to report partition)
     d. Fetches top 3 players' full data for comparison
     e. Builds percentile, gear audit, talent analysis, improvement suggestions
   - Result cached for 1 hour; returned to client

4. **Browser renders AnalysisView** with DPS percentile, gear audit, talent comparison, cast efficiency, etc.

### Raid Overview Path

1. User selects **Raid tab** → `useRaidOverview` hook fires
   - GET `/api/raid-overview?reportCode=X&fightId=Y`
   - Server calls `buildRaidOverviewResult`:
     a. Fetches damage, healing, deaths, damage-taken, combatant-info tables
     b. Builds per-player metrics: DPS/HPS, death status, consumables, buff coverage
     c. Groups by role (tank, heal, dps); calculates raid-wide stats
   - Result cached 1 hour, returned

2. **Browser renders RaidOverview** with player grid, deaths, consumables, buff uptime summary

### Class Loadout Audit (CLA) Path

1. User selects **CLA tab** → `useCLA` hook fires
   - GET `/api/cla?reportCode=X&fightId=Y`
   - Server calls `buildCLAResult`:
     a. Fetches all players' gear, talents, buffs
     b. For each player, audits against class-specific best-in-slot, enchant/gem completeness, consumables, buff coverage
     c. Detects missing world/raid buffs per player
   - Result cached 1 hour, returned

2. **Browser renders CLAView** with per-player audit (gear issues, missing buffs, recommendations)

### Metadata & Indexing

1. Report page mounts → `generateMetadata` calls `getReportMeta(code)` (React `cache()` dedupes with page)
2. If public report: indexable=true, canonical URL set, og:image generated at `/og?report=code&fight=X&source=Y`
3. Report marked as public → server calls `recordRecentReport(code, ts)` → writes to Redis sorted set `pf:recent_reports`
4. Sitemap builder queries `getRecentReports()` → includes recent public reports so crawlers find them organically

## Key Abstractions

**WCLError:**
- Purpose: Classifies upstream failures (not_found, private, rate_limited, timeout, upstream) with correct HTTP status + user-facing message
- Examples: `lib/wcl-client.ts` throws WCLError; `lib/api-utils.ts` catches and maps to NextResponse
- Pattern: All WCL failures map to typed errors; routes then convert to clean JSON responses

**ReportMetaResult:**
- Purpose: Discriminated union (ok | not_found | private | error) so pages choose rendering strategy without throwing
- Examples: `lib/report-meta.ts` returns result; page renders 404 on not_found, noindex on error
- Pattern: Errors as data, not exceptions

**AnalysisResult / RaidOverviewResult / CLAResult:**
- Purpose: Typed JSON outputs from business logic engines, fully cacheable and serializable
- Pattern: Engine returns result object; API handler caches and returns as JSON; client receives via fetch

**Single-Flight Cache Lock:**
- Purpose: Under load, only one request computes; others wait for cache to fill, collapsing the stampede
- Pattern: `cachedApiHandler` tries `cacheLock(key)`; if acquired, computes and releases; if not, `waitForCache()` polls
- File: `lib/api-utils.ts`, `lib/kv-cache.ts`

**Fallback Caching:**
- Purpose: Upstash Redis when available; per-instance Map otherwise. Errors in Redis → fall back transparently
- Pattern: All cache operations try Redis first; on error, use Map; never throw
- File: `lib/kv-cache.ts`

## Entry Points

**Landing Page:**
- Location: `app/page.tsx`
- Triggers: User visits parseforge.gg/
- Responsibilities: Render hero, featured reports, guides, FAQ; ISR every 1 hour so report links refresh without redeploy

**Analyze Page:**
- Location: `app/analyze/[reportCode]/page.tsx`
- Triggers: User visits /analyze/{reportCode} (usually via form submission on landing)
- Responsibilities: SSR report metadata; set canonical URL; indexing rules (noindex if error/private); render AnalyzeClient for hydration

**AnalyzeClient (Hydration Boundary):**
- Location: `app/analyze/[reportCode]/AnalyzeClient.tsx`
- Triggers: Browser receives HTML from SSR; hydrates React
- Responsibilities: Interactive state (tab, fight, player selection); lazy-load analysis via SWR hooks

**Guides:**
- Location: `app/guides/*/page.tsx` (static + ISR)
- Triggers: User clicks guide link or directly visits /guides/
- Responsibilities: SEO-rich content pages for organic search traffic

**API Routes:**
- Location: `app/api/*/route.ts`
- Triggers: SWR hooks in client call fetch(); server-side metadata generation calls them indirectly
- Responsibilities: Validate, rate-limit, cache, compute, return JSON

## Architectural Constraints

- **Threading:** Single-threaded event loop (serverless Node.js functions). Concurrency handled by Vercel's instance pool.
- **Global state:** Module-level caches (`wcl-client.ts` token cache, `wcl-client.ts` query cache, `kv-cache.ts` mem cache) are per-instance and ephemeral; shared state lives in Redis.
- **Circular imports:** None detected; `lib/` and `app/` maintain clear dependency direction (pages → hooks → API → lib).
- **Request deduplication:** React `cache()` wraps `getReportMeta()` so both `generateMetadata` and page use one WCL call per SSR.
- **Cache stampede protection:** Single-flight locks in `cachedApiHandler` + `cacheLock` so only lock holder computes; others wait or fallback.
- **Rate limiting:** Per-IP, per-route (Upstash Ratelimit); shared across Vercel instances via Redis.
- **Partition scoping:** Rankings queries explicitly scope to report's raid phase partition to avoid inflated cross-phase comparisons.

## Anti-Patterns

### Cache Without Fallback

**What happens:** If Redis is unavailable, some operations might fail entirely instead of degrading to per-instance cache.

**Why it's wrong:** Availability is reduced; a Redis outage brings down the site instead of degrading gracefully.

**Do this instead:** All cache operations in `lib/kv-cache.ts` try Redis first, catch errors, and fall back to `memGet`/`memSet`. This is already implemented.

### Exception-Based Error Handling

**What happens:** Early implementations threw errors for all failures (not_found, private, rate_limited), forcing pages to catch or bubble.

**Why it's wrong:** Pages can't distinguish error types (e.g., 404 vs 503), so they can't render correct responses (404 vs noindex shell).

**Do this instead:** Return discriminated unions (`ReportMetaResult`, `AnalysisResult` with `status` field). Pages then pattern-match on status. `lib/report-meta.ts` and `lib/api-utils.ts` already follow this.

### Hard-coded Encounter Metadata

**What happens:** Page would fall back to a static encounter ID/name if WCL didn't return it, risking analysis against wrong encounter.

**Why it's wrong:** Silent failures are dangerous; a wrong encounter ID produces meaningless rankings.

**Do this instead:** Client provides `encounterID`, `encounterName`, `zoneName`, `zoneExpansionId` from WCL report metadata. API uses those if present; falls back to fetch only if needed. `app/api/analyze/route.ts` already does this.

### Partition-Unaware Ranking Queries

**What happens:** Earlier versions queried encounter rankings without scoping to the report's phase partition, causing cross-phase comparisons (e.g., P1 logs vs P4 geared top parses).

**Why it's wrong:** DPS percentiles become meaningless when comparing across gear phases.

**Do this instead:** Extract `partition` from `report.rankings.data[*].partition`, pass to `ENCOUNTER_RANKINGS_QUERY`. Already implemented in PR #12.

## Error Handling

**Strategy:** Classify errors early (at WCL boundary); return discriminated unions so callers decide response.

**WCL Errors:**
- `not_found`: Report doesn't exist → 404 page, or API returns `{ status: "not_found" }`
- `private`: Report is private → noindex shell or API returns `{ status: "private" }`
- `rate_limited`: WCL rate limit hit → 429, user told to retry; single-flight wait mechanism doesn't trigger on this
- `timeout`: WCL took >30s → 504, retry recommended
- `upstream`: Network or other failure → 502, generic transient error

**API Errors:**
- Invalid request (bad code, missing fields, bad JSON) → 400 with `{ error: "message" }`
- Rate limit (local) → 429 with message
- WCL error → mapped via `errorResponse(error, context)` to correct status + user message
- Unexpected error → 500, generic "something went wrong"

**Page Errors:**
- `generateMetadata` catches via `getReportMeta` result union; returns generic metadata for error/not_found cases
- Page component checks `result.status`; calls `notFound()` if not_found, renders error shell if error
- SSR never throws; all errors are discriminated data

## Cross-Cutting Concerns

**Logging:** `observability.ts` exports `logEvent(eventName, data)` for structured metrics (cache hits/misses, WCL retries, API request stats). Consumed by WCL client and API utils. Sends to PostHog in production.

**Validation:** Input validation happens at API boundary (request code format check, field presence). Type-level validation via TypeScript; no runtime schema validators (keep deps light).

**Authentication:** OAuth handled transparently by `wcl-client.ts` token management. Client ID/Secret from environment variables. No user authentication; rate limiting is per-IP.

**Rate Limiting:** `rate-limit.ts` wraps Upstash Ratelimit SDK; called at start of every API route. Per-IP, per-route. Shared across instances via Redis.

**Analytics:** PostHog injected via `PostHogProvider` in layout; tracks tab switches, report analysis starts, completion; ingest endpoint rewritten to same-origin via next.config rewrites.

---

*Architecture analysis: 2026-09-04*
