# Phase 2: Accuracy & Analysis Depth - Research

**Researched:** 2026-09-07
**Domain:** WCL GraphQL data modeling (events pagination, healing tables), Next.js App Router client/server data flow, generated-data pipelines, Vitest engine testing
**Confidence:** MEDIUM-HIGH (codebase claims are file/line VERIFIED; WCL API shape claims outside the existing codebase are CITED/ASSUMED — this project has no direct WCL API access in a research session, since credentials are Vercel-only per CLAUDE.md)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cast timeline (ACC-03)**
- **D-01:** The timeline is a new **"Timeline" tab in the player analysis view** (`AnalysisView`), alongside DPS/HPS · Casts · Gear. It loads lazily on tab open (no WCL events fetch unless someone opens it) and the canonical URL stays param-free — no new route, no new indexable surface. — **Reversibility:** reversible — a tab can later be promoted to a route without changing the data path.
- **D-02:** Form is a **vertical cast log**: chronological rows of `timestamp (relative to fight start) · ability icon · ability name · target`. Not a horizontal track chart. Mobile-first readable.
- **D-03:** Log content this phase = **the player's casts + a marker where the player died + highlighted idle gaps** (gap between consecutive casts longer than ~1 GCD, threshold relative not hard-coded per class). No buff/cooldown windows overlay this phase (would need a per-spec "which buffs matter" map — accuracy risk).
- **D-04:** Long fights: **render the full log, virtualised, with per-ability filter chips** to hide filler. Nothing hidden by default; junk spell IDs already excluded via `JUNK_SPELL_IDS` stay excluded. No pagination-by-minute collapse.

**Healer metrics (ACC-04)**
- **D-05:** Healers are judged on **effective HPS (healing that landed), overheal %, and healing uptime / active time**. Spell mix vs top healers and cooldown/mana usage were considered and **not selected** for this phase.
- **D-06:** Comparison population stays **top-ranked healers of the same spec** (existing rankings path, partition-scoped per the PR #12 fix). The **percentile stays** but the headline number and ranking basis is **effective HPS**, with the healer's overheal % and uptime shown next to the top players' values. — **Reversibility:** costly — the percentile is the number healers screenshot/share; Phase 3's per-player OG image will bake this definition in.
- **D-07:** Suggestions for healers are **healer-specific rules driven by the new metrics**, with thresholds **relative to top-healer values** (no fixed magic constants): overheal well above top healers → sniping/pre-casting on full targets; uptime well below → idle/late reactions; effective-HPS gap with normal overheal → gear/consumables path. The DPS-shaped rules ("keep your GCD rolling", CPM comparisons) are **not shown to healers**.
- **D-08:** The raid overview's **Healer Breakdown panel picks up the same metrics** (effective HPS + uptime added). One **shared engine helper** computes healer metrics for both `raid-overview-engine` and the `/api/analyze` healer path so the raid table and player page never disagree.

**Game-data regeneration (ACC-01)**
- **D-09:** A **committed script** (`scripts/regen-game-data.mjs`, same family as `token-audit.mjs` / `theme-parity.mjs`) fetches era-pinned CSVs from wago.tools and **generates** the ENCHANT_NAME_DB / GEM_NAME_DB / GEM_STAT_DB / CONSUMABLE_DB data with a header stamping build + generation date. Re-running it produces a git diff; that diff is the review artifact. — **Reversibility:** costly — once engines import generated files, hand-editing them is the anti-pattern this phase exists to end.
- **D-10:** Eras in scope: **Classic Anniversary / TBC Fresh (product `wow_anniversary`), WotLK, and Cata (product `wow_classic`)** — the three builds currently pinned in `lib/cla-constants.test.ts` (2.5.6.69546 / 3.4.5.63697 / 4.4.2.60895), each refreshed to the current wago.tools build for its product. MoP is out. Eras remain separate sections — later clients rewrite older items, never merge into a superset.
- **D-11:** IDs that cannot be derived from client dumps (WotLK/Cata food buff friendly names — all "Well Fed" in game data; TBC food buff IDs 33254–33268 community-standard; engineering tinkers) live in **one explicit overrides file** the script merges in. Every override carries a source note and the generated output **marks them unverified** so the audit can list exactly which IDs are not wago-verified. No hand-typed rows inside generated files.
- **D-12:** Proof of "diff reviewed": the script also emits **`docs/GAME-DATA-AUDIT.md`** (build per era, row counts per map, list of unverified overrides, IDs whose name/stat changed since the last run). The regen lands in **its own PR** the owner reviews; the doc is the standing artifact, same pattern as `docs/TOKEN-AUDIT.md`.

**Engine tests (ACC-02)**
- **D-13:** Fixtures are **recorded real WCL GraphQL responses** for 1–2 fights of the **public demo report** (the exact shapes the engines consume: combatant info, buff tables, damage/healing tables, deaths, casts events), stored as JSON under `lib/__fixtures__/`. Public report → no privacy concern. The same fixtures feed timeline and healer tests.
- **D-14:** Assertion style: **behavioural named assertions** on the things that matter (this player flagged for missing enchant X, overheal % = Y, deaths = Z) **plus one full-output `toMatchSnapshot` per engine per fixture** so any unintended change trips. Snapshots update only deliberately (`vitest -u`) with the diff reviewed.
- **D-15:** `wcl-client` tests **stub global `fetch`** (`vi.stubGlobal('fetch', vi.fn())`) with scripted response sequences — 401 → token refresh → 200; 429 → `rate_limited`; timeout via fake timers → `timeout`; error classification for not_found / private / upstream — and stub the kv-cache token cache so no Redis env is required. **No refactor of wcl-client's signature, no new dependency (no MSW).**
- **D-16:** `npm test` stays in CI (`.github/workflows/ci.yml`) and is **added to the OPS-01 ship-gate checklist** so a red suite blocks a prod deploy. Coverage reach = the three named engines + the new timeline builder + the shared healer helper; **new code ships with tests; no coverage-% threshold**.

### Claude's Discretion
- Exact WCL `events(dataType: Casts)` pagination strategy (`nextPageTimestamp` loop), the page cap for very long fights, the cache key/TTL, and the new rate-limit bucket name for the timeline endpoint (add it to `RATE_LIMITS` explicitly — never rely on the 30/60s default).
- Whether the timeline is served by a new `/api/timeline` route or an extension of `/api/analyze` (prefer a separate lazily-called route so the analyze payload doesn't grow).
- Virtualisation approach for the log (a small hand-rolled windowed list is fine; avoid a heavy dependency).
- The precise idle-gap threshold and how "effective HPS" is derived from WCL's Healing table (`total` vs `overheal` fields) — align with how WCL itself ranks HPS so the percentile is consistent with WCL's number.
- Healer-suggestion threshold multipliers (relative to top-healer medians) and copy.
- Generated-file layout (e.g. `lib/generated/game-data.<era>.ts` imported by `cla-constants.ts`, vs regenerating sections in place) and the overrides file format.
- PostHog event names/props for the timeline and healer surfaces — follow the existing snake_case `posthog.capture` conventions; include `report_code`, `fight_id`, role/spec where the existing events do.
- Fixture recording mechanism (one-off script hitting WCL with prod creds pulled to the scratchpad and deleted after, per the CLAUDE.md secrets rule).

### Deferred Ideas (OUT OF SCOPE)
- Healer **spell mix vs top healers** and **cooldown / mana usage** metrics (needs a per-spec cooldown map through the wago workflow) — candidate for a later accuracy phase or v2 ADV work.
- Timeline **buff/cooldown windows overlay** and a **horizontal track-chart** view — later iteration once the log ships.
- Deep-linkable timeline route — only if Phase 3 share work wants a per-fight timeline permalink.
- A drift-detecting CI test that re-derives maps from vendored CSV slices (considered for D-09, not chosen) — revisit if a regen ever diverges silently.
- MoP (5.5.4) era data — when an engine path consumes it.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACC-01 | Game-data accuracy re-audit via the wago.tools regeneration workflow (no hand-typed ID maps) | "Game-data regeneration" architecture section, Pitfall 5, Sources memory citation; reuses PR #11's proven workflow, extends `token-audit.mjs`-family script pattern |
| ACC-02 | Test coverage added for the untested engines (`cla-engine`, `raid-overview-engine`, `wcl-client`) | Validation Architecture section (framework, fixture plan, test map); Pitfall 4; demo report code/fight/source identified for fixture recording |
| ACC-03 | User can view a per-fight cast timeline | Architecture Patterns Pattern 1 (paginated events query), Pitfall 3 (relative timestamps), recommended route/hook/component structure |
| ACC-04 | Healer-specific analysis improved (healer metrics beyond raw HPS) | Architecture Patterns Pattern 2 (shared healer-metrics helper), Pitfalls 1-2 (query-shape risks), Assumptions A3/A5 flagging what needs live-query confirmation |
| OPS-01 | Every user-facing change ships WITH PostHog instrumentation and GSC verification (standing gate) | PostHog naming conventions documented (Code Examples / hook patterns); confirmed `npm test` already in CI and ship-gate checklist (Pitfall 4, Project Constraints) |
</phase_requirements>

## Summary

This phase adds depth (cast timeline, healer metrics) and rigor (game-data regen, engine tests) to an already-working analysis pipeline. The good news from reading the actual code: most of the hard architecture already exists and only needs *extending*, not building from scratch. The raid-wide healing table (`app/api/raid-overview/route.ts` L36-50) already returns `total` (effective healing), `overheal`, and `activeTime` per player — this is the exact shape D-05's "effective HPS + overheal% + uptime" needs, and `raid-overview-engine.ts` (L354-384) already computes it for the Healer Breakdown panel. The gap is that the single-player `/api/analyze` healer path (`PLAYER_FULL_DATA_QUERY_HEALING`) only fetches a per-ability breakdown table (no player-level overheal/activeTime aggregate), so it needs the same no-`sourceID` table shape added as a second field in the same request — not a new round-trip, not a new capability.

The cast timeline is genuinely new: nothing in this codebase queries `events(dataType: Casts)` today (only aggregated `table(dataType: Casts)` for CPM comparisons). The pagination contract (`nextPageTimestamp` / `truncated`) is well-documented by WCL and mirrors the `events(dataType: Deaths)` / `events(dataType: CombatantInfo)` calls already in `lib/wcl-queries.ts` — same query shape, different `dataType` and a page loop.

The game-data regeneration (ACC-01) has a fully reusable precedent: PR #11 already ran this exact wago.tools workflow once (by hand) to fix a shifted-ID bug, and the era builds are already pinned as constants with a code comment (`lib/cla-constants.ts:274-275,739`). This phase's job is to turn that one-off manual fix into `scripts/regen-game-data.mjs`, following the `scripts/token-audit.mjs` / `scripts/theme-parity.mjs` convention (gate + `--report` + `--markdown` modes).

Engine tests (ACC-02) start from zero fixtures/mocks but a clean slate: `vitest.config.ts` and colocated `*.test.ts` conventions are established, `npm test` already runs in CI (`.github/workflows/ci.yml` L18) and is already listed in `docs/OPS-01-SHIP-GATE.md`'s local-gate step 1 (L33) — D-16 is largely already true, this phase just has to prove it stays true with real coverage.

**Primary recommendation:** Extend existing query/engine shapes rather than introduce new data-fetch patterns — add fields to existing GraphQL query bodies (single extra `table`/`events` field per query, no new round-trips) and route new UI through the existing tab/hook architecture (`AnalysisView`'s `ptab` URL state, `useCLA`/`useRaidOverview`-style hooks) rather than a new page or route pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cast timeline data fetch (WCL events, pagination) | API / Backend (`app/api/timeline`) | — | New WCL query + pagination loop belongs server-side; client never talks to WCL directly |
| Cast timeline rendering (vertical log, virtualisation, filter chips) | Browser / Client | Frontend Server (SSR shell) | `AnalysisView.tsx` is already `"use client"`; timeline tab is client-rendered like every other sub-tab |
| Idle-gap / death-marker computation | API / Backend (engine function) | — | Pure data transform on event timestamps — belongs in a `lib/` engine function, testable in isolation, not duplicated in the client |
| Healer effective-HPS/overheal/uptime | API / Backend (shared engine helper) | — | Must be computed once and reused by both `raid-overview-engine.ts` and `/api/analyze`'s healer path (D-08) — a client-side computation would let the two disagree |
| Healer Breakdown panel + player HPS tab display | Browser / Client | — | Pure rendering of already-computed metrics; `RaidOverview.tsx` `HealerPanel` and `DpsComparison.tsx` |
| Game-data regeneration (wago.tools fetch + generate) | Build tooling (Node script, not runtime) | — | `scripts/regen-game-data.mjs` runs at authoring time, never at request time — mirrors `token-audit.mjs` |
| Generated game-data consumption | API / Backend (`lib/` engines) | — | `cla-constants.ts` re-exports feed `analysis-engine.ts`, `raid-overview-engine.ts`, `app/api/analyze/route.ts` — all server-side |
| Engine test fixtures (recorded WCL responses) | Build tooling / Test | — | `lib/__fixtures__/*.json`, consumed only by `*.test.ts`, never shipped to a runtime bundle |
| Rate limiting for new timeline route | API / Backend | — | `lib/rate-limit.ts` + `RATE_LIMITS` in `lib/constants.ts`, per-IP via Upstash — server-only concern |

## Standard Stack

### Core

No new runtime dependencies are needed for this phase. Everything is buildable on the existing stack:

| Library | Version | Purpose | Why Standard (already in this repo) |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 [VERIFIED: package.json:22] | App Router, API routes | Existing framework, no migration |
| React | 19.2.3 [VERIFIED: package.json:24] | Client components | Existing |
| Vitest | ^4.1.10 [VERIFIED: package.json:37] | Engine + wcl-client unit tests | Already the only test runner; `npm test` = `vitest run` [VERIFIED: package.json:9] |
| @upstash/ratelimit | ^2.0.8 [VERIFIED: package.json:16] | New timeline rate-limit bucket | Existing pattern in `lib/rate-limit.ts`, just add a bucket entry |
| radix-ui / shadcn Tabs | ^1.4.3 / ^3.8.5 [VERIFIED: package.json:26,34] | Timeline tab in `AnalysisView` | `Tabs`/`TabsTrigger`/`TabsContent` already used for the 6 existing sub-tabs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new library for virtualisation | — | Cast log windowing for long fights | See "Don't Hand-Roll" below — recommend a small hand-rolled windowed list, not a new dependency (D-04, Claude's Discretion) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled windowed list for the cast log | `react-window` / `@tanstack/react-virtual` | A real virtualisation library handles variable row heights and scroll-restoration edge cases better, but adds a dependency for a single list that (per D-04) shows every cast with filter chips, not infinite/dynamic data — a fixed-row-height manual window (render only rows within N px of viewport + a spacer div) is simpler and matches "avoid a heavy dependency" in Claude's Discretion |
| New `/api/timeline` route | Extend `/api/analyze` payload | Context explicitly prefers a separate route (Claude's Discretion) so the analyze payload doesn't grow when the timeline isn't opened — matches D-01's "no WCL events fetch unless someone opens it" |

**Installation:** None required — no `npm install` for this phase's stack. If a virtualisation library is later judged necessary, verify via `npm view <package> version` first per the Package Legitimacy Gate below (none is currently recommended, so no audit row is needed).

## Package Legitimacy Audit

No new external packages are being introduced by this phase's recommended approach (see Standard Stack — virtualisation is hand-rolled, no new libraries). If the planner or an executor later decides a virtualisation library is worth the dependency after all, run `gsd_run query package-legitimacy check --ecosystem npm <package>` before adding it and insert a Package Legitimacy Audit table at that time; the phase should not assume it in the current plan.

**Packages removed due to [SLOP] verdict:** none — none proposed
**Packages flagged as suspicious [SUS]:** none — none proposed

## Architecture Patterns

### System Architecture Diagram

```
Browser (AnalysisView.tsx tab bar: DPS/HPS · Abilities · Gear · Talents · Buffs · Casts · [NEW] Timeline)
   │  tab="timeline" (ptab URL param, useUrlTabState)
   ▼
New client hook (useTimeline, pattern-matches useCLA/useRaidOverview)
   │  fetch POST /api/timeline { reportCode, fightId, sourceId }  ── lazy, only on tab open (D-01)
   ▼
app/api/timeline/route.ts (NEW)
   │  checkRateLimit(request, "timeline")  ── new RATE_LIMITS bucket, explicit (not the 30/60s default)
   │  cachedApiHandler(`timeline-${code}-${fight}-${source}`, ...)
   ▼
wclQuery(TIMELINE_CASTS_QUERY, { code, fightIDs, sourceID, startTime })
   │  events(dataType: Casts, sourceID, fightIDs, startTime, limit) { data, nextPageTimestamp }
   │  loop while nextPageTimestamp present → accumulate pages (page cap, Claude's Discretion)
   │  events(dataType: Deaths, sourceID, fightIDs) { data }  ── reuse RAID_DEATH_EVENTS_QUERY shape, scoped to sourceID
   ▼
buildCastTimeline() (NEW lib/timeline-engine.ts, pure function — same "engine" pattern as analysis-engine.ts)
   │  filter JUNK_SPELL_IDS, sort chronologically, mark idle gaps (relative threshold), mark death row
   ▼
JSON result → cached in Redis (kv-cache.ts, same TTL pattern as analyze/raid-overview) → returned to client
   ▼
Timeline tab renders vertical cast log (virtualised, filter chips) — Browser tier only, no further fetch


Healer metrics (D-05/D-08) — no new route, two existing call sites extended:

app/api/analyze/route.ts (healer branch)          lib/raid-overview-engine.ts (buildRaidOverview)
   │ PLAYER_FULL_DATA_QUERY_HEALING                    │ RAID_OVERVIEW_QUERY
   │  + healingByPlayer: table(Healing, no sourceID)    │  healing: table(Healing, no sourceID)  [already has this]
   ▼                                                    ▼
        both call the SAME new shared helper: computeHealerMetrics(playerRow) → { effectiveHps, overhealPercent, activityPercent }
        lib/healer-metrics.ts (NEW) — single source of truth so raid table and player page never disagree (D-08)
```

### Recommended Project Structure

```
lib/
├── timeline-engine.ts          # NEW — pure fn: cast events + death events -> ordered log with idle-gap flags
├── timeline-engine.test.ts     # NEW
├── healer-metrics.ts           # NEW — shared computeHealerMetrics() helper (D-08)
├── healer-metrics.test.ts      # NEW
├── wcl-queries.ts              # MODIFIED — add TIMELINE_CASTS_QUERY, TIMELINE_DEATHS_QUERY (or reuse RAID_DEATH_EVENTS_QUERY scoped down), extend PLAYER_FULL_DATA_QUERY_HEALING / TOP_PLAYER_DATA_QUERY_HEALING with a no-sourceID healing row field
├── cla-constants.ts            # MODIFIED — becomes thin re-export of generated files + overrides (D-09/D-11)
├── generated/                  # NEW — regen script output (naming: Claude's Discretion, e.g. game-data.<era>.ts)
│   └── game-data-overrides.ts  # NEW — explicit, clearly-marked hand source-noted overrides (D-11)
├── __fixtures__/                # NEW — recorded WCL responses from the demo report (D-13)
│   ├── demo-report-fight23-player.json
│   └── demo-report-fight23-raid.json
├── cla-engine.test.ts          # NEW
├── raid-overview-engine.test.ts # NEW
├── wcl-client.test.ts          # NEW
scripts/
└── regen-game-data.mjs         # NEW — token-audit.mjs-family script
docs/
└── GAME-DATA-AUDIT.md          # NEW — generated audit doc, mirrors docs/TOKEN-AUDIT.md
app/
├── api/
│   └── timeline/route.ts       # NEW
└── components/
    ├── AnalysisView.tsx        # MODIFIED — add "timeline" TabsTrigger/TabsContent + allowed ptab value
    ├── CastTimeline.tsx         # NEW — vertical log component
    └── RaidOverview.tsx        # MODIFIED — HealerPanel picks up effectiveHps/uptime from shared helper
```

### Pattern 1: Paginated WCL events query (new to this codebase)

**What:** WCL's `events` field returns at most one page per call; a `truncated: true` response includes `nextPageTimestamp`, which must be passed back as the next call's `startTime` until `truncated` is false (no `nextPageTimestamp` field on the final page).
**When to use:** Any `dataType` that can exceed one page for a single fight — Casts is exactly this case for a long fight with a high-CPM caster.
**Example (query shape confirmed via WCL community/API documentation search — see Sources; NOT directly verified against a live response in this session since WCL creds are Vercel-only per CLAUDE.md):**
```graphql
query PlayerCastTimeline($code: String!, $fightIDs: [Int!]!, $sourceID: Int!, $startTime: Float) {
  reportData {
    report(code: $code) {
      events(
        fightIDs: $fightIDs
        sourceID: $sourceID
        dataType: Casts
        startTime: $startTime
        limit: 300
      ) {
        data
        nextPageTimestamp
      }
    }
  }
}
```
Existing precedent for the *shape* of this call (same `events(... dataType: X, fightIDs, sourceID, limit)` pattern, just without a pagination loop because Deaths/CombatantInfo rarely exceed one page) is [VERIFIED: lib/wcl-queries.ts:190-204,207-221] (`RAID_DEATH_EVENTS_QUERY`, `RAID_COMBATANT_INFO_QUERY`).

Server-side loop (new — no precedent in this codebase, `nextPageTimestamp` does not appear anywhere in `lib/` or `app/` today) [VERIFIED: grep found zero matches in lib/ and app/]:
```typescript
async function fetchAllCastEvents(code: string, fightIds: number[], sourceId: number) {
  const allEvents: unknown[] = [];
  let startTime: number | undefined = undefined;
  let pages = 0;
  const MAX_PAGES = 20; // page cap for very long fights — Claude's Discretion, tune after a real long-fight test
  do {
    const res = await wclQuery<TimelineEventsResponse>(TIMELINE_CASTS_QUERY, {
      code, fightIDs: fightIds, sourceID: sourceId, startTime,
    });
    const page = res.reportData.report.events;
    allEvents.push(...page.data);
    startTime = page.nextPageTimestamp;
    pages++;
  } while (startTime !== undefined && pages < MAX_PAGES);
  return allEvents;
}
```

### Pattern 2: Shared healer-metrics helper (D-08)

**What:** A single function both engines call so the raid table and player page can never disagree.
**When to use:** Any per-player Healing-table row (the no-`sourceID` shape).
**Example — grounded in the exact fields already read off this row shape** [VERIFIED: app/api/raid-overview/route.ts:36-50, quoting the actual type]:
```typescript
// app/api/raid-overview/route.ts:36-50 (verbatim, confirms the row shape)
healing: {
  data: {
    entries: Array<{
      id: number;
      name: string;
      type: string;
      icon: string;
      total: number;
      overheal?: number;
      activeTime: number;
      activeTimeReduced: number;
    }>;
  };
};
```
```typescript
// lib/healer-metrics.ts (NEW)
export interface HealerRow {
  id: number;
  total: number;        // effective healing (WCL's `total` field already excludes overheal)
  overheal?: number;
  activeTime: number;
}

export function computeHealerMetrics(row: HealerRow, fightDuration: number) {
  const durationSec = fightDuration / 1000;
  const effectiveHps = durationSec > 0 ? row.total / durationSec : 0;
  const overhealPercent = row.total > 0 && row.overheal
    ? (row.overheal / (row.total + row.overheal)) * 100
    : 0;
  const activityPercent = fightDuration > 0
    ? Math.min(100, (row.activeTime / fightDuration) * 100)
    : 0;
  return { effectiveHps, overhealPercent, activityPercent };
}
```
This is a straight extraction of logic already proven correct in [VERIFIED: lib/raid-overview-engine.ts:360-380] — no new business logic, just deduplication so `/api/analyze`'s healer path can call the identical function once it gains the same row shape.

### Anti-Patterns to Avoid

- **Recomputing healer metrics differently in two places:** This is exactly what D-08 exists to prevent. Do not let the player-page healer view derive its own overheal-% formula independently of `raid-overview-engine.ts`'s — extract `computeHealerMetrics` first, then have both call sites use it.
- **Hand-typing any regenerated ID map row:** The entire premise of ACC-01 is that PR #11's hand-typed-map bug (rows shifted by one, "systematically shifted/rotated" per project memory `game-data-id-verification.md`) must never recur. Every row in `ENCHANT_NAME_DB`/`GEM_NAME_DB`/`GEM_STAT_DB`/`CONSUMABLE_DB` must trace to the regen script's output or the explicit overrides file — never a manual edit inside a generated file.
- **New raw hex or Tailwind palette classes in the Timeline tab or HealerPanel:** Phase 1's `npm run token-audit` gate (D-11/D-12 from [VERIFIED: .planning/phases/01-foundation-themes-consent/01-CONTEXT.md:35-36]) is a standing CI-adjacent gate over `app/`, `components/`, `lib/`. Any new UI must use `classColor()`, `roleColor()`, or `--status-*`/`--tier-*` tokens exclusively.
- **Adding a new WCL round-trip for a capability that's one field away:** Both the timeline-vs-analyze route split and the healer-metrics extension are deliberately designed to avoid new round-trips where an existing query can gain one field instead (see the two "extend, don't add" notes above).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCL OAuth token caching / retry / 401 handling | A second token-cache implementation for the timeline route | `wclQuery()` from `lib/wcl-client.ts` — already handles token refresh, retry backoff, and error classification [VERIFIED: lib/wcl-client.ts:193-277] | The timeline route needs zero new HTTP/auth plumbing — it's a new query string through the same `wclQuery` function |
| Rate limiting | A bespoke limiter for `/api/timeline` | `checkRateLimit(request, "timeline")` + a new `RATE_LIMITS.timeline` entry | Same Upstash-backed sliding window every other route uses; explicit bucket avoids the "unknown bucket defaults to 30/60s" footgun flagged in `.planning/codebase/CONCERNS.md` §"Rate Limit: Unknown Buckets Default" |
| Single-flight cache stampede protection | Custom locking for the new route | `cachedApiHandler()` from `lib/api-utils.ts` [VERIFIED: lib/api-utils.ts:65-137] | Already handles the lock/wait/fallback dance; the timeline route just needs a cache key and a handler function |
| Game-data ID→name lookups | Any new hand-typed map, even a "just this one exception" table | The `scripts/regen-game-data.mjs` pipeline + one explicit overrides file (D-11) | This is the exact anti-pattern ACC-01 exists to retire — see PR #11 root cause in project memory |
| WCL response type guards for nested/optional fields | New ad-hoc `as unknown as X` casts | Existing pattern in `flattenPlayerDetails`/`parsePlayerSpec` (`lib/wcl-helpers.ts`) — extend this file for any new WCL shape helpers | `.planning/codebase/CONCERNS.md` §"Loose Type Casting" already flags this as a known area; don't add more surface without a typed helper |

**Key insight:** Every piece of new server-side logic this phase needs (auth, retry, caching, rate limiting, error classification) already has exactly one implementation in `lib/`. The work is almost entirely: (1) new query strings, (2) new pure engine functions consuming those query results, (3) new thin UI components rendering engine output. Resist the temptation to special-case anything for "just the timeline" or "just healers."

## Common Pitfalls

### Pitfall 1: Treating `total` on a per-ability Healing row the same as a per-player row

**What goes wrong:** The player's own healer analyze path (`PLAYER_FULL_DATA_QUERY_HEALING`) queries `healing: table(dataType: Healing, sourceID: $sourceID)`, which — like the equivalent DamageDone query already in this codebase — returns a **per-ability breakdown**, not a single aggregate row [VERIFIED: this is the established pattern for `table(..., sourceID:)` confirmed by `analysis-engine.ts`'s `analyzeAbilities`/`analyzeCastsAgainstAverage` consuming `throughputEntries`/`playerCastTable` as arrays of named abilities, e.g. lib/analysis-engine.ts:450-499]. Summing `.total` across that array gives total effective healing (fine, already done), but there is **no player-level `overheal`/`activeTime` aggregate in that response shape** — those only appear on the no-`sourceID` per-player row (the `RAID_OVERVIEW_QUERY` shape). Building D-05's overheal%/uptime straight off the per-ability array will silently produce wrong or missing numbers.
**Why it happens:** The two query shapes ("per-ability breakdown when `sourceID` given" vs. "per-player aggregate when `sourceID` omitted") look similar in GraphQL but return structurally different JSON, and WCL's `table` field is untyped JSON (`data: JSON`) so TypeScript won't catch the mismatch.
**How to avoid:** Add the no-`sourceID` healing table as a **second, separately-aliased field** in `PLAYER_FULL_DATA_QUERY_HEALING` and `TOP_PLAYER_DATA_QUERY_HEALING` (e.g. `healingByPlayer: table(dataType: Healing, fightIDs: $fightIDs)`), then pick out the row matching the target `sourceID`/actor id — exactly how `raid-overview-engine.ts` already consumes it, just narrowed to one player.
**Warning signs:** `overhealPercent` always 0, or `activityPercent` always 0/100, for the single-player healer view while the raid overview shows sane values for the same player in the same fight.

### Pitfall 2: WCL rankings do not carry overheal/uptime for top healers

**What goes wrong:** Assuming `characterRankings`' ranking objects (`WCLRanking`) expose overheal%/uptime for the comparison population, so D-06's "healer's overheal % and uptime shown next to the top players' values" could be read straight off the rankings response.
**Why it happens:** `WCLRanking` [VERIFIED: lib/wcl-types.ts:149-163] only has `amount`, `duration`, `talents`, `gear` — no overheal/activeTime fields exist on this type or (per this session's schema research) on the rankings query at all.
**How to avoid:** This data must come from the **existing per-top-player fetch** (`fetchTopPlayers()` in `lib/wcl-fetchers.ts`, already fetching each of the top N ranked players' own full report data). Add the same `healingByPlayer` no-`sourceID` field to `TOP_PLAYER_DATA_QUERY_HEALING`, extract the top player's own row by their resolved actor id (already resolved via `REPORT_ACTORS_QUERY` in the same function), and average across `topPlayersData` the same way `analyzeBuffsAgainstAverage`/`analyzeCastsAgainstAverage` already average across top players. **This does not require an extra round-trip** — it's one more field on a query that already runs per top player.
**Warning signs:** If a plan proposes fetching overheal/uptime "from rankings," that's the wrong data source — flag it in review.

### Pitfall 3: Cast/damage timestamps are relative to *report* start, not fight start

**What goes wrong:** WCL event timestamps in `events()` responses are milliseconds since the **report's** `startTime`, not the individual fight's `startTime`. D-02 requires the timeline to show time "relative to fight start."
**Why it happens:** This is WCL's universal convention across the API (the existing `fights { startTime endTime }` shape [VERIFIED: lib/wcl-queries.ts:73-77,113-117] returns fight boundaries as offsets from report start for exactly this reason — code elsewhere in this repo already does `fightDuration = fight.endTime - fight.startTime` [VERIFIED: app/api/analyze/route.ts:89], the same subtraction pattern needed for a per-event relative time).
**How to avoid:** Every timeline row's displayed timestamp must be `event.timestamp - fight.startTime`, using the same `fight.startTime` already fetched for duration math — do not display `event.timestamp` raw.
**Warning signs:** Cast timestamps that don't start near `0:00` for the first cast of the fight.

### Pitfall 4: `npm test` already passes in CI — a "make it pass" mindset instead of "make it fail on regression"

**What goes wrong:** Since `npm test` already runs in CI [VERIFIED: .github/workflows/ci.yml:18] and is already in the OPS-01 ship-gate checklist [VERIFIED: docs/OPS-01-SHIP-GATE.md:33], it's tempting to treat ACC-02 as "add any passing tests" rather than "add tests that would have caught PR #11's bug." D-14's behavioural-assertion requirement exists specifically to avoid tests that pass trivially without exercising the ID-mapping/healer-branch/error-classification logic that has actually broken in production before (PR #11 game-data IDs, PR #12 rankings partition).
**Why it happens:** Coverage percentage isn't gated (D-16: "no coverage-% threshold"), so a shallow test suite technically satisfies the letter of ACC-02.
**How to avoid:** Anchor each new test file's assertions to a real historical bug or a real branch: healer vs. DPS query selection, missing-enchant detection, the partition-scoping fix (PR #12), 401→refresh→200, rate-limited classification. D-14 already specifies this ("this player flagged for missing enchant X, overheal % = Y, deaths = Z").
**Warning signs:** A test file with only `expect(result).toBeDefined()`-style assertions, or one that only exercises the empty/happy path.

### Pitfall 5: Regenerating game data without an era-appropriate build breaks a *different* era

**What goes wrong:** wago.tools client dumps are per-build snapshots, and later game clients **rewrite** old item/spell IDs (recorded precedent: "MoP client renames wrath gems" per project memory). Running the regen script against the wrong build for an era silently produces a new wrong mapping instead of fixing the old one.
**Why it happens:** The three pinned builds (`2.5.6.69546` TBC Anniversary / `3.4.5.63697` WotLK / `4.4.2.60895` Cata) [VERIFIED: lib/cla-constants.ts:274-275,739 — quoting: "Classic+TBC = 2.5.6.69546 (TBC Anniversary), WotLK = 3.4.5.63697, Cata = 4.4.2.60895, MoP = 5.5.4.69585."] are the ones the *existing* data was verified against; D-10 says refresh each to "the current wago.tools build for its product," which means looking up the current build via `https://wago.tools/api/builds` per product (`wow_anniversary` for Classic+TBC, `wow_classic` for WotLK/Cata) — not reusing last session's exact build string if wago.tools has since bumped it, and not accidentally pointing all three eras at one product's latest build.
**How to avoid:** The regen script should resolve each era's build from `https://wago.tools/api/builds` at run time (or accept a pinned override), keep eras in **separate sections** (D-10 explicitly: "later clients rewrite older items, never merge into a superset"), and the generated header must stamp which build+product produced each section.
**Warning signs:** A regen diff where a previously-TBC-only ID range suddenly resolves to a Cata item name, or vice versa.

## Code Examples

### Existing paginated-events precedent to copy (Deaths/CombatantInfo)

```typescript
// Source: lib/wcl-queries.ts:190-204 (VERIFIED, quoted verbatim)
export const RAID_DEATH_EVENTS_QUERY = `
  query RaidDeathEvents($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        deathEvents: events(
          fightIDs: $fightIDs
          dataType: Deaths
          limit: 100
        ) {
          data
        }
      }
    }
  }
`;
```
The Casts timeline query is the same shape with `dataType: Casts`, a `sourceID` filter, a `startTime` variable, and (unlike Deaths, which fits in one page) a client-side loop over `nextPageTimestamp`.

### Existing healer-metrics computation to extract into the shared helper

```typescript
// Source: lib/raid-overview-engine.ts:360-380 (VERIFIED, quoted verbatim)
const hps = durationSec > 0 ? healEntry.total / durationSec : 0;
const overhealPct = healEntry.total > 0 && healEntry.overheal
  ? (healEntry.overheal / (healEntry.total + healEntry.overheal)) * 100
  : 0;
const activity = fightDuration > 0
  ? Math.min(100, (healEntry.activeTime / fightDuration) * 100)
  : 0;
```

### Existing tab-state pattern the Timeline tab reuses

```typescript
// Source: app/components/AnalysisView.tsx:50-57 (VERIFIED, quoted verbatim)
const [tab, setTab] = useUrlTabState("ptab", "dps", [
  "dps",
  "abilities",
  "gear",
  "talents",
  "buffs",
  "casts",
]);
```
Add `"timeline"` to this allow-list array and a matching `TabsTrigger value="timeline"` / `TabsContent value="timeline"` pair — `useUrlTabState` [VERIFIED: lib/use-url-tab-state.ts:12-34] already omits the default from the URL and validates against the allow-list, so this requires no new URL-state code.

### Existing per-route hook pattern the Timeline tab's fetch hook should copy

```typescript
// Source: app/analyze/[reportCode]/hooks/useCLA.ts (VERIFIED, structure quoted)
// shouldAutoRun = activeTab === "cla" && !!report && !result && !loading && !error;
// useEffect(() => { if (shouldAutoRun) run(); }, [shouldAutoRun, run]);
```
A `useTimeline(reportCode, selectedFight, selectedSource, ptab)` hook should auto-run only when `ptab === "timeline"` (mirroring `useCLA`'s `activeTab === "cla"` guard), satisfying D-01's "loads lazily on tab open."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Hand-typed `ENCHANT_NAME_DB`/`GEM_NAME_DB`/`GEM_STAT_DB` rows | Generated from wago.tools client dumps, verified against era-pinned builds | PR #11 (this session's history, ~this week per project memory) | This phase (ACC-01) turns that one-off fix into a repeatable script so it can't silently regress again |
| DPS-shaped healer suggestions ("keep your GCD rolling", CPM gap) | Healer-specific suggestion rules driven by overheal/uptime/effective-HPS gap, relative to top-healer medians | This phase (D-07) | `generateSuggestions()` in `lib/analysis-engine.ts` (L523-608) currently applies the same `casts.topActiveTime` "ABC" suggestion to both roles [VERIFIED: lib/analysis-engine.ts:591-600 shows no role branch on this specific suggestion] — needs a healer-only branch |
| No automated test for `wcl-client`'s token refresh / retry / error classification | `vi.stubGlobal('fetch', ...)` scripted-sequence tests | This phase (D-15) | Closes the gap flagged in `.planning/codebase/CONCERNS.md` §"Business Logic Untested" |

**Deprecated/outdated:** None — this phase adds capability and rigor to a live system, it does not replace a deprecated approach.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | WCL's `events(dataType: Casts, ...)` query accepts `startTime`/`limit`/`sourceID`/`fightIDs` arguments and returns `{ data, nextPageTimestamp }`, with pagination via re-passing `nextPageTimestamp` as the next call's `startTime` | Architecture Patterns, Pattern 1 | If the actual argument names or pagination contract differ, the timeline route's first implementation attempt will fail at the WCL API call — recommend a Wave 0 spike task that runs one real query against the demo report (`ZjKgNYxVcAqR8pGJ`, fight 23) with prod WCL creds pulled to scratchpad per CLAUDE.md's secrets rule, before building the full pagination loop |
| A2 | Individual cast events carry `abilityGameID`, `sourceID`, `targetID`, `timestamp`, `type: "cast"` fields | Architecture Patterns | If field names differ (e.g. `ability` object instead of `abilityGameID`), the timeline engine's parsing needs adjustment — same Wave 0 spike as A1 covers this |
| A3 | A per-ability Healing-table entry (queried with `sourceID` set) does **not** carry a per-ability `overheal` field, so player-level overheal/uptime require the separate no-`sourceID` query shape (recommended in Pitfall 1) | Common Pitfalls, Pitfall 1 | If per-ability `overheal` **is** actually present, the no-`sourceID` second query becomes optional (could sum per-ability overheal instead) — lower-risk direction to be wrong in (the recommended approach still works either way, just may be one field more than strictly necessary); verify with the same Wave 0 spike |
| A4 | WCL's events `limit` argument accepts a value like 300 per page for Casts without erroring; the exact server-side max is undocumented in sources reachable this session | Architecture Patterns, Pattern 1 | If the real max is lower, the pagination loop still works correctly (more pages, more round-trips) — this only affects efficiency, not correctness |
| A5 | The current per-player healer HPS calculation (`throughputEntries.reduce((s,e)=>s+e.total,0)` in `app/api/analyze/route.ts`) already yields *effective* HPS because WCL's `total` field on Healing-table entries excludes overheal — inferred from the raid-overview code's identical field usage, not independently confirmed against a live query in this session | Summary; Common Pitfalls Pitfall 1 | If `total` on the per-ability breakdown actually includes overheal (unlike the no-sourceID row), the existing headline HPS number for healers has been subtly wrong pre-dating this phase — worth a specific behavioural test assertion during ACC-02 that compares the two computation paths against the same fixture |

**If this table is empty:** N/A — see rows above. All five center on the exact shape of live WCL API responses, which this research session could not query directly (WCL credentials are Vercel-only per CLAUDE.md, and pulling them for a one-off local spike is explicitly the kind of thing that should happen with developer awareness, not silently during research). Recommend resolving A1/A2/A3/A4 together in a single Wave 0 spike task early in this phase's plan, before the timeline/healer engine code is written against unverified assumptions.

## Open Questions

1. **Exact shape of the `events(dataType: Casts)` response for this codebase's actual fixtures**
   - What we know: The GraphQL argument/pagination contract (Pattern 1) and the general community-documented event field names (`abilityGameID`, `sourceID`, `targetID`, `timestamp`)
   - What's unclear: Whether ParseForge's specific eras (Classic/TBC/WotLK/Cata) return any era-specific quirks (e.g., pet casts attributed to the pet's own `sourceID` vs. the owner's — relevant since the timeline is scoped to one player's `sourceID`)
   - Recommendation: Resolve during the Wave 0 spike (A1/A2 above); record the actual response as the first entry in `lib/__fixtures__/` since it's needed for both the timeline engine test and the live route

2. **Whether `total` on a per-ability Healing entry (sourceID-scoped) includes or excludes overheal**
   - What we know: The no-sourceID per-player row's `total` field excludes overheal (confirmed by the raid-overview-engine's overheal% formula, which would be nonsensical if `total` included overheal — `overheal / (total + overheal)` assumes `total` is the non-overheal portion)
   - What's unclear: Whether the identical `total` field name on the sourceID-scoped ability-breakdown response follows the same convention
   - Recommendation: Verify in the same Wave 0 spike; this determines whether Pitfall 1's second query is strictly required or merely the safer/simpler option

3. **wago.tools current build numbers for `wow_anniversary` and `wow_classic` products, as of this phase's execution**
   - What we know: The three builds pinned in this codebase today (`2.5.6.69546`/`3.4.5.63697`/`4.4.2.60895`) and the discovery endpoint (`https://wago.tools/api/builds`)
   - What's unclear: The current builds as of whenever this phase is actually executed — these will have moved on since the codebase's last regen
   - Recommendation: The regen script itself should query `https://wago.tools/api/builds` at run time rather than hardcode a fresh guess in the plan — this is inherently a runtime lookup, not a plannable constant

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20 | All tooling (tsc, vitest, npm scripts) | ✓ (at `~/.local/node20/bin`, not on default PATH per CLAUDE.md) | 20.x | — |
| `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` | Live WCL queries (route testing, fixture recording) | ✗ locally (Vercel-only secret per CLAUDE.md) | — | `vercel env pull` to scratchpad + delete after, exactly as done for the PR #12 investigation (project memory) — required once for fixture recording (D-13) and the Wave 0 spike above |
| Upstash Redis (`KV_REST_API_*`) | Shared cache, rate limiting for the new timeline route | ✗ locally, ✓ in Vercel | — | `usingSharedCache`/`enabled` gates already fail open to per-instance Map / no-op rate limiting locally — no code change needed, this is existing graceful degradation |
| wago.tools (`https://wago.tools/db2/<Table>/csv`, `https://wago.tools/api/builds`) | `scripts/regen-game-data.mjs` | Not probed this session (external network dependency, no auth required per prior PR #11 workflow) | — | None needed — public CSV export, same as PR #11's manual workflow |
| Vitest / `npm test` | ACC-02 | ✓ | ^4.1.10 [VERIFIED: package.json:37] | — |

**Missing dependencies with no fallback:**
- WCL live credentials for the Wave 0 spike and fixture recording — this is a one-time manual step (`vercel env pull`), not a blocker, but must happen before the timeline/healer engine code is finalized against real response shapes.

**Missing dependencies with fallback:**
- Redis locally — existing graceful-degradation pattern already covers the new timeline route with zero additional code.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.10 [VERIFIED: package.json:37] |
| Config file | `vitest.config.ts` [VERIFIED: vitest.config.ts:1-16] — `environment: "node"`, `include: ["lib/**/*.test.ts", "app/**/*.test.ts"]` |
| Quick run command | `npx vitest run lib/cla-engine.test.ts` (single file) |
| Full suite command | `npm test` (= `vitest run`) [VERIFIED: package.json:9] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACC-01 | Regenerated ID maps still pass the existing regression pairs (era builds, no shifted rows) | unit | `npx vitest run lib/cla-constants.test.ts` | ✅ exists, must keep passing post-regen |
| ACC-01 | `docs/GAME-DATA-AUDIT.md` generated with build+row-count+unverified-override list | script output review | `node scripts/regen-game-data.mjs --markdown docs/GAME-DATA-AUDIT.md` | ❌ Wave 0 (script doesn't exist yet) |
| ACC-02 | `cla-engine.ts` consumable/gear/buff audit logic behaves correctly on recorded fixtures | unit + snapshot | `npx vitest run lib/cla-engine.test.ts` | ❌ Wave 0 |
| ACC-02 | `raid-overview-engine.ts` healer metrics, death timeline, buff coverage on recorded fixtures | unit + snapshot | `npx vitest run lib/raid-overview-engine.test.ts` | ❌ Wave 0 |
| ACC-02 | `wcl-client.ts` token refresh (401→refresh→200), 429→`rate_limited`, timeout, not_found/private/upstream classification | unit (`vi.stubGlobal('fetch', ...)`) | `npx vitest run lib/wcl-client.test.ts` | ❌ Wave 0 |
| ACC-03 | Timeline engine orders casts chronologically, flags idle gaps, marks death row, excludes `JUNK_SPELL_IDS` | unit | `npx vitest run lib/timeline-engine.test.ts` | ❌ Wave 0 |
| ACC-04 | Shared healer-metrics helper computes effective HPS/overheal%/uptime identically for both call sites | unit | `npx vitest run lib/healer-metrics.test.ts` | ❌ Wave 0 |
| ACC-04 | Healer suggestion rules fire relative to top-healer medians, not fixed constants; DPS-shaped suggestions suppressed for healers | unit | `npx vitest run lib/analysis-engine.test.ts` (extend existing file) | Existing file, extend |

### Sampling Rate
- **Per task commit:** `npx vitest run <changed-file>.test.ts` (fast, single-file)
- **Per wave merge:** `npm test` (full suite, currently 7 files / 59 tests, will grow)
- **Phase gate:** Full suite green before `/gsd-verify-work`, and before the OPS-01 ship-gate local-gate step (already lists `npm test` [VERIFIED: docs/OPS-01-SHIP-GATE.md:33])

### Wave 0 Gaps
- [ ] `lib/__fixtures__/` directory + at least 2 recorded WCL responses for the demo report (`ZjKgNYxVcAqR8pGJ`, fight 23, source 12 [VERIFIED: lib/demo-report.ts:7-11]) — covers ACC-02, ACC-03, ACC-04 fixture needs
- [ ] A one-time WCL live-query spike (resolves Assumptions A1-A4 / Open Questions 1-2) — must happen before the timeline route and healer query changes are finalized, not just before their tests
- [ ] `lib/cla-engine.test.ts`, `lib/raid-overview-engine.test.ts`, `lib/wcl-client.test.ts`, `lib/timeline-engine.test.ts`, `lib/healer-metrics.test.ts` — none exist yet
- [ ] `scripts/regen-game-data.mjs` — does not exist yet (D-09)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth in this product; WCL OAuth is server-to-server, already handled by `wcl-client.ts` |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No per-user resources |
| V5 Input Validation | Yes | `isValidReportCode()` [VERIFIED: lib/api-utils.ts:50-53] already validates report codes; new `/api/timeline` route must reuse it plus `Number.isInteger` checks on `fightId`/`sourceId`, exactly matching `/api/analyze`'s existing validation [VERIFIED: app/api/analyze/route.ts:70-73] |
| V6 Cryptography | No | No new crypto surface |
| V13 API/Web Service | Yes | New `/api/timeline` route must go through `checkRateLimit()` + `cachedApiHandler()` like every existing route — no bespoke handling |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cache-key injection via unvalidated `reportCode`/`fightId`/`sourceId` polluting the shared Redis keyspace | Tampering | `isValidReportCode()` regex + `Number.isInteger` checks before building any cache key — same pattern already used in `/api/analyze` and required for `/api/timeline` |
| Unbounded WCL fan-out via an unbounded pagination loop (a malicious or pathological fight with an enormous cast count) | Denial of Service (cost amplification against WCL API quota) | The page cap (`MAX_PAGES`) in the pagination loop (Pattern 1) is a required safety bound, not just a nicety — without it, a crafted `fightId` claim could force unbounded WCL query volume per request |
| New rate-limit bucket silently defaulting to 30 req/60s if forgotten in `RATE_LIMITS` | Tampering / resource exhaustion | Explicit `RATE_LIMITS.timeline` entry (D's discretion already calls this out); `.planning/codebase/CONCERNS.md` §"Rate Limit: Unknown Buckets Default" flags this exact class of bug |
| wago.tools CSV data trusted without validation in the regen script | Tampering (supply chain, low likelihood — wago.tools is a well-established community tool the project already trusts per PR #11 precedent) | The regen script should sanity-check row counts against expected ranges (e.g., "found 0 enchant rows" should hard-fail, not silently produce an empty map) before overwriting generated files — this is what `docs/GAME-DATA-AUDIT.md`'s row-count column is for |

## Project Constraints (from CLAUDE.md)

- **Runtime PATH:** `node`/`npm`/`npx`/`vercel` are not on default PATH — prepend `export PATH="$HOME/.local/node20/bin:$PATH"` before any node tooling. `.claude/CLAUDE.md` additionally notes hooks pin nvm node 24 for GSD tooling itself — these are two different node installs for two different purposes (project runtime vs. GSD harness).
- **`node_modules` may be absent** — run `npm ci` first for any local work.
- **Typecheck before "done":** `npx tsc --noEmit` must be run and pass.
- **Lint:** `npm run lint`; pre-existing debt in `components/ui/meteors.tsx` and `lib/analysis-engine.ts` — leave it, don't add new findings to it (this phase does touch `lib/analysis-engine.ts` for the healer suggestion branch — be careful not to trigger new lint findings while editing a file with pre-existing debt).
- **Vitest is the test runner** — `npm test`. No new test framework.
- **Game-data IDs verified via wago.tools regeneration, never hand-typed** — this is literally ACC-01's requirement, restated as a standing CLAUDE.md rule.
- **Full build (`npm run build`) is best left to Vercel** — prerenders `/` and `/sitemap.xml` against live WCL+Redis; don't rely on a local `npm run build` as the completion signal for this phase, use `npx tsc --noEmit` + `npm test` instead, matching the OPS-01 gate's own local-gate step ordering.
- **Deploys are manual CLI, require explicit confirmation** — no plan step should assume auto-deploy or self-authorize `vercel deploy --prod`.
- **Branch + PR workflow, `main` currently unpushed** (per STATE.md: "`git push origin main` — main is a full phase ahead of origin, which forces sequential (non-worktree) execution") — the planner should account for sequential (not worktree-parallel) execution unless this is resolved before Phase 2 starts.
- **Reuse before adding** — checked and reflected throughout this research (no new dependency recommended).
- **Secrets** — `.env*` and `CLAUDE.md` gitignored; live credentials never committed/printed; a one-off `vercel env pull` for the Wave 0 spike/fixture recording must delete the pulled file after use.

## Sources

### Primary (HIGH confidence — direct codebase reads this session)
- `lib/wcl-queries.ts`, `lib/wcl-types.ts`, `lib/wcl-client.ts`, `lib/wcl-fetchers.ts`, `lib/wcl-helpers.ts` — all read in full this session
- `lib/raid-overview-engine.ts`, `lib/analysis-engine.ts` — read in full this session
- `app/api/analyze/route.ts`, `app/api/raid-overview/route.ts` (partial), `app/api/cla/route.ts` (partial) — read this session
- `app/components/AnalysisView.tsx`, `app/components/RaidOverview.tsx`, `lib/use-url-tab-state.ts`, `app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts`, `useCLA.ts`, `AnalyzeClient.tsx` (partial) — read this session
- `lib/constants.ts`, `lib/rate-limit.ts`, `lib/api-utils.ts`, `lib/cla-constants.ts` (partial + grep), `lib/cla-constants.test.ts`, `lib/demo-report.ts`, `vitest.config.ts`, `lib/api-utils.test.ts`, `.github/workflows/ci.yml`, `docs/OPS-01-SHIP-GATE.md`, `package.json` — read this session
- `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `.planning/phases/01-foundation-themes-consent/01-CONTEXT.md` (grep), `docs/TOKEN-AUDIT.md` (partial) — read this session
- Project memory `game-data-id-verification.md` — read this session (dated 3 days old per memory-tool's own staleness warning; cross-checked against live `lib/cla-constants.ts` header comment and found consistent)

### Secondary (MEDIUM confidence — CITED, official docs referenced but not directly fetched due to 403 on warcraftlogs.com's doc pages)
- WCL v2 API docs index (`https://www.warcraftlogs.com/v2-api-docs/warcraft/`), `EventDataType` doc page, `Report` doc page — direct `WebFetch` returned HTTP 403; findings sourced via `WebSearch` summaries that explicitly cite these URLs as their origin (`EventDataType` enum values including `Casts`; `events` field arguments `startTime`/`endTime`/`fightIDs`/`dataType`/`sourceID`/`targetID`/`abilityID`/`limit`; pagination contract via `truncated`/`nextPageTimestamp`)
- Community forum threads (combatlogforums.com) on WCL API v2 event/table usage patterns — corroborating, not primary

### Tertiary (LOW confidence — flagged in Assumptions Log, needs a live-query spike)
- Exact field names on individual cast event objects (`abilityGameID`, `targetID`) — plausible from general WCL/community knowledge but not confirmed against this project's actual eras/data this session
- Whether per-ability Healing-table entries (sourceID-scoped) carry a per-ability `overheal` field — not confirmed either way

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all existing and version-verified via `package.json`
- Architecture (existing-code extension points): HIGH — every claim about current code has a file/line citation and a quoted excerpt
- Architecture (new WCL query shapes): MEDIUM — grounded in documented pagination contract and existing same-shape precedent, but not verified against a live response this session
- Pitfalls: MEDIUM-HIGH — five of five pitfalls are grounded in either verified code or documented project history (PR #11, PR #12); two (Pitfall 1, Pitfall 2) rest partly on the unverified assumption in A3
- Validation architecture: HIGH — test framework, conventions, and demo-report fixture target are all file-verified

**Research date:** 2026-09-07
**Valid until:** ~14 days for the WCL-API-shape claims (external, unverified this session — re-verify at plan time or Wave 0 rather than trusting past the spike); ~30 days for the codebase-architecture claims (stable unless another phase touches these files first)
