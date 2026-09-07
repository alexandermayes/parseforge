# Phase 2: Accuracy & Analysis Depth - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 16 (new + modified)
**Analogs found:** 14 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/timeline-engine.ts` | service (pure engine) | transform | `lib/raid-overview-engine.ts` | role-match |
| `lib/timeline-engine.test.ts` | test | transform | `lib/cla-constants.test.ts` (structure only) | partial |
| `lib/healer-metrics.ts` | utility (shared helper) | transform | `lib/raid-overview-engine.ts` (L360-380 healer math) | exact (extraction source) |
| `lib/healer-metrics.test.ts` | test | transform | none existing — first fixture-based unit test | no analog |
| `lib/wcl-queries.ts` (MODIFIED — add `TIMELINE_CASTS_QUERY`, extend `PLAYER_FULL_DATA_QUERY_HEALING`/`TOP_PLAYER_DATA_QUERY_HEALING`) | config/query | request-response | `RAID_DEATH_EVENTS_QUERY`, `RAID_COMBATANT_INFO_QUERY` (same file) | exact |
| `app/api/timeline/route.ts` | route/controller | request-response + pagination | `app/api/analyze/route.ts` | exact |
| `app/api/analyze/route.ts` (MODIFIED — healer branch gains `healingByPlayer` field + shared helper call) | controller | request-response | itself (extend in place) | exact |
| `lib/raid-overview-engine.ts` (MODIFIED — HealerPanel metrics call shared helper) | service | CRUD/transform | itself (extend in place) | exact |
| `lib/analysis-engine.ts` (MODIFIED — healer-specific suggestion branch) | service | transform | itself, `generateSuggestions()` L523-608 | exact |
| `app/components/AnalysisView.tsx` (MODIFIED — add Timeline tab) | component | request-response (client) | itself (existing tab pattern) | exact |
| `app/components/CastTimeline.tsx` | component | streaming/render (virtualised list) | `app/components/RaidOverview.tsx` `HealerPanel` (render-only-from-props pattern) | role-match |
| `app/analyze/[reportCode]/hooks/useTimeline.ts` | hook | request-response (lazy fetch) | `app/analyze/[reportCode]/hooks/useCLA.ts` | exact |
| `app/components/RaidOverview.tsx` (MODIFIED — `HealerPanel` picks up effective HPS/uptime from shared helper) | component | render | itself (extend in place) | exact |
| `scripts/regen-game-data.mjs` | utility (build script) | batch/file-I/O | `scripts/token-audit.mjs` | exact |
| `lib/cla-constants.ts` (MODIFIED — thin re-export of generated files + overrides) | config/model | CRUD (data map) | itself (existing header-comment/Map pattern) | exact |
| `lib/generated/game-data-overrides.ts` | config | CRUD (data map) | `lib/cla-constants.ts` (Map literal pattern) | role-match |
| `docs/GAME-DATA-AUDIT.md` | doc (generated) | file-I/O | `docs/TOKEN-AUDIT.md` | exact |
| `lib/cla-engine.test.ts`, `lib/raid-overview-engine.test.ts`, `lib/wcl-client.test.ts` | test | fixture-based unit | `lib/cla-constants.test.ts`, `lib/api-utils.test.ts` | role-match |
| `lib/rate-limit.ts` / `lib/constants.ts` (MODIFIED — add `RATE_LIMITS.timeline` bucket) | config | request-response | itself (`RATE_LIMITS` map, L132-138) | exact |

## Pattern Assignments

### `lib/wcl-queries.ts` — `TIMELINE_CASTS_QUERY` (query, request-response + pagination)

**Analog:** `RAID_DEATH_EVENTS_QUERY` / `RAID_COMBATANT_INFO_QUERY` (same file, lines ~188-224)

```typescript
// Copy this exact events(...) shape, add sourceID + startTime for pagination
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
New query adds `$sourceID: Int!`, `$startTime: Float`, aliases the field, and returns `nextPageTimestamp` alongside `data` (per RESEARCH.md Pattern 1) — WCL API shape for `Casts` events is not directly verified in this codebase; treat as a Wave 0 spike per RESEARCH.md Assumptions A1/A2.

Extend `PLAYER_FULL_DATA_QUERY_HEALING`/`TOP_PLAYER_DATA_QUERY_HEALING` (defined further down this same file, following `PLAYER_FULL_DATA_QUERY` at line ~55 as the sourceID-scoped precedent) with a second, separately-aliased no-`sourceID` field: `healingByPlayer: table(dataType: Healing, fightIDs: $fightIDs)`.

---

### `app/api/timeline/route.ts` (controller, request-response + pagination)

**Analog:** `app/api/analyze/route.ts` (full file, ~200 lines)

**Imports pattern** (lines 1-16):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import { cachedApiHandler, parseBody, isValidReportCode, badRequest } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { PLAYER_FULL_DATA_QUERY, ... } from "@/lib/wcl-queries";
import { buildAnalysisResult } from "@/lib/analysis-engine";
```
Copy the same import shape: `wclQuery`, `cachedApiHandler`/`parseBody`/`isValidReportCode`/`badRequest` from `lib/api-utils`, `checkRateLimit`, the new `TIMELINE_CASTS_QUERY`, and `buildCastTimeline` from the new `lib/timeline-engine.ts`.

**Rate-limit + validation pattern** (lines 60-73 of `app/api/analyze/route.ts`):
```typescript
const limited = await checkRateLimit(request, "analyze");
if (limited) return limited;

if (!isValidReportCode(reportCode)) return badRequest("Invalid report code.");
if (!Number.isInteger(fightId) || !Number.isInteger(sourceId)) {
  return badRequest("Invalid fight or source id — expected integers.");
}
```
For the new route: `checkRateLimit(request, "timeline")` — requires a new explicit `RATE_LIMITS.timeline` entry (see below), never rely on the `?? 30` default in `lib/rate-limit.ts` L39.

**Cached-handler + WCL call pattern** (lines 75-81):
```typescript
return cachedApiHandler(`analyze-${reportCode}-${fightId}-${sourceId}`, async () => {
  const playerData = await wclQuery<PlayerFullDataResponse>(
    PLAYER_FULL_DATA_QUERY,
    { code: reportCode, fightIDs: [fightId], sourceID: sourceId }
  );
  ...
});
```
Timeline route: `cachedApiHandler(\`timeline-${reportCode}-${fightId}-${sourceId}\`, async () => { ... })`, with the body running the pagination loop from RESEARCH.md Pattern 1 (`while (startTime !== undefined && pages < MAX_PAGES)`), then `buildCastTimeline(events, deathEvents, fight)`.

**Error/not-found pattern** (line ~86):
```typescript
if (!fight) {
  return NextResponse.json({ error: "Fight not found" }, { status: 404 });
}
```
Reuse verbatim for missing fight/player in the timeline route.

---

### `lib/healer-metrics.ts` (utility/shared helper, transform)

**Analog:** `lib/raid-overview-engine.ts` lines 360-380 (extraction source, not a separate file to copy from — this *is* the dedup target)

```typescript
// lib/raid-overview-engine.ts:360-380 (verbatim) — extract this into lib/healer-metrics.ts
const hps = durationSec > 0 ? healEntry.total / durationSec : 0;
const overhealPct = healEntry.total > 0 && healEntry.overheal
  ? (healEntry.overheal / (healEntry.total + healEntry.overheal)) * 100
  : 0;
const activity = fightDuration > 0
  ? Math.min(100, (healEntry.activeTime / fightDuration) * 100)
  : 0;
```
After extraction, `lib/raid-overview-engine.ts` (`buildRaidOverview`, ~L200-390) calls `computeHealerMetrics(healEntry, fightDuration)` instead of inlining the math, and `app/api/analyze/route.ts`'s healer branch (after adding `healingByPlayer`) calls the same function on the matched player row — this is the D-08 "single source of truth" requirement; do not let either call site re-derive the formula independently.

---

### `lib/timeline-engine.ts` (service/pure engine, transform)

**Analog:** `lib/raid-overview-engine.ts` (overall shape: pure function taking a typed input bag, returning a typed result object, no I/O)

```typescript
// lib/raid-overview-engine.ts:200 (signature shape to copy)
export function buildRaidOverview(input: RaidOverviewInput): RaidOverviewResult {
```
`lib/timeline-engine.ts` should mirror this: `export function buildCastTimeline(input: TimelineInput): TimelineResult`, pure, synchronous, JSON-serialisable output (snapshot-friendly per D-14). Reuse `JUNK_SPELL_IDS` filtering (imported from wherever `lib/analysis-engine.ts` defines/imports it — grep confirms it's the existing exclusion set used by `analyzeCasts`) and compute relative timestamps as `event.timestamp - fight.startTime` per RESEARCH.md Pitfall 3 (same subtraction already done in `app/api/analyze/route.ts` for `fightDuration`).

---

### `app/analyze/[reportCode]/hooks/useTimeline.ts` (hook, lazy request-response)

**Analog:** `app/analyze/[reportCode]/hooks/useCLA.ts`

```typescript
// app/analyze/[reportCode]/hooks/useCLA.ts (structure, RESEARCH.md-quoted)
// shouldAutoRun = activeTab === "cla" && !!report && !result && !loading && !error;
// useEffect(() => { if (shouldAutoRun) run(); }, [shouldAutoRun, run]);
```
Read the full file (`app/analyze/[reportCode]/hooks/useCLA.ts`) before writing `useTimeline.ts` — copy its SWR/fetch/loading-state shape exactly, gating auto-run on `ptab === "timeline"` instead of `"cla"`.

---

### `app/components/AnalysisView.tsx` (component, MODIFIED)

**Analog:** itself — existing tab-state array, lines ~50-57

```typescript
const [tab, setTab] = useUrlTabState("ptab", "dps", [
  "dps",
  "abilities",
  "gear",
  "talents",
  "buffs",
  "casts",
]);
```
Add `"timeline"` to this array, then add a matching `<TabsTrigger value="timeline">`/`<TabsContent value="timeline">` pair (same pattern as the other five), rendering the new `CastTimeline` component and calling `useTimeline`. `useUrlTabState` (`lib/use-url-tab-state.ts`) already handles URL sync/validation — no new URL-state code needed (D-01: canonical URL stays param-free by design, since non-default tab values live in `?ptab=` already, same as today's `casts`/`gear`/etc).

---

### `app/components/CastTimeline.tsx` (component, render/virtualised list)

**Analog:** `app/components/RaidOverview.tsx` `HealerPanel` (lines ~237-275) — render-only-from-props with derived styling functions

```typescript
// app/components/RaidOverview.tsx:237-271 pattern
function HealerPanel({ healers }: { healers: HealerMetrics[] }) {
  const topHps = healers[0]?.hps ?? 1;
  return (
    <div>
      {healers.map((h) => {
        const barWidth = topHps > 0 ? (h.hps / topHps) * 100 : 0;
        return (
          <div key={h.id}>
            ...
            <span className={`font-mono text-xs tabular-nums w-12 text-right shrink-0 ${overhealColor(h.overhealPercent)}`}>
              {h.overhealPercent.toFixed(0)}% OH
            </span>
          </div>
        );
      })}
    </div>
  );
}
```
Copy the "derive a color/width via a small named helper function (`overhealColor`, `activityColor`), map rows, all classes from theme tokens" pattern. All colour classes must resolve to `@theme` tokens (`classColor()`/`roleColor()`/`--status-*`) per Phase 1's D-11/D-12 — `npm run token-audit` gates this file. Virtualisation itself has no in-repo analog (first virtualised list in this codebase) — hand-roll a windowed render per RESEARCH.md "Don't Hand-Roll" (fixed row height + spacer div), do not add a dependency.

---

### `scripts/regen-game-data.mjs` (build script, batch/file-I/O)

**Analog:** `scripts/token-audit.mjs`

```javascript
// scripts/token-audit.mjs header comment pattern (lines 1-30) — copy the doc-comment
// style, --report/--markdown mode flags, and exit-code contract:
//   node scripts/X.mjs              -> gate mode: exit 1 on finding, 0 otherwise
//   node scripts/X.mjs --report      -> inspection mode: always exits 0
//   node scripts/X.mjs --markdown <path> -> also writes markdown report
```
Read `scripts/token-audit.mjs` in full before writing the regen script — copy its shebang, mode-flag parsing (`--report`, `--markdown <path>`), exit-code contract, and the "curated allowlist requires a `reason`" pattern (here: every override in `lib/generated/game-data-overrides.ts` must carry a source note per D-11, mirroring the allowlist-reason requirement). `scripts/theme-parity.mjs` and `scripts/seo-invariants.mjs` are siblings in the same family if additional structure is needed (e.g. multi-section report generation for `docs/GAME-DATA-AUDIT.md`, which mirrors `docs/TOKEN-AUDIT.md`).

---

### `lib/*.test.ts` (new engine tests: `cla-engine`, `raid-overview-engine`, `wcl-client`, `timeline-engine`, `healer-metrics`)

**Analog:** `lib/cla-constants.test.ts` (regression-pair style), `lib/api-utils.test.ts` (structure/mocking style — read in full before writing `wcl-client.test.ts`)

Behavioural + snapshot style (D-14): named `expect` assertions on specific business facts (e.g. "player flagged for missing enchant X", "overheal % = Y") plus one `expect(result).toMatchSnapshot()` per engine per fixture. `lib/wcl-client.test.ts` uses `vi.stubGlobal('fetch', vi.fn())` with scripted sequential `mockResolvedValueOnce` responses (401→refresh→200; 429; timeout via fake timers; not_found/private/upstream classification) — no MSW, no signature changes to `wcl-client.ts` (D-15). Fixtures live in `lib/__fixtures__/*.json`, recorded from the public demo report (`lib/demo-report.ts` — code `ZjKgNYxVcAqR8pGJ`, fight 23).

---

### `lib/constants.ts` — `RATE_LIMITS` (config, MODIFIED)

**Analog:** itself, lines 132-138

```typescript
export const RATE_LIMITS: Record<string, number> = {
  analyze: 30,
  "raid-overview": 30,
  cla: 10,
  report: 60,
  "report-players": 60,
};
```
Add `timeline: <N>,` as an explicit entry (Claude's Discretion on N) — never rely on `lib/rate-limit.ts`'s `?? 30` fallback for unknown buckets (flagged in CONCERNS.md).

## Shared Patterns

### Errors as data (WCLError kinds)
**Source:** `lib/wcl-client.ts` (error classification), consumed via `errorResponse(error, context)` in `lib/api-utils.ts` line 31
**Apply to:** `app/api/timeline/route.ts`, any new engine touching WCL responses. Never throw raw errors from routes — classify to `not_found`/`private`/`rate_limited`/`timeout`/`upstream` and map via `errorResponse`.

### Single-flight cache + rate limit
**Source:** `lib/api-utils.ts` `cachedApiHandler` (line 65), `lib/rate-limit.ts` `checkRateLimit`
**Apply to:** `app/api/timeline/route.ts` — same two-call wrapper every existing route uses (`checkRateLimit` first, then `cachedApiHandler` wrapping the WCL fetch + engine call). Cache key format: `` `<route>-${reportCode}-${fightId}-${sourceId}` `` (see `analyze-...` key in `app/api/analyze/route.ts`).

### Input validation
**Source:** `lib/api-utils.ts` `isValidReportCode` (line 51), inline `Number.isInteger` checks in `app/api/analyze/route.ts` lines 69-72
**Apply to:** All new routes — validate `reportCode`/`fightId`/`sourceId` before building any cache key (prevents cache-key injection per RESEARCH.md Security Domain).

### Healer metrics single source of truth
**Source:** `lib/raid-overview-engine.ts` L360-380 → extracted to `lib/healer-metrics.ts`
**Apply to:** `app/api/analyze/route.ts` healer branch, `lib/raid-overview-engine.ts` `buildRaidOverview`, `app/components/RaidOverview.tsx` `HealerPanel`. Never recompute overheal%/effective-HPS/uptime independently in more than one place (D-08).

### Theme tokens / no raw colour literals
**Source:** `app/globals.css` `@theme`, `classColor()`/`roleColor()` in `lib/constants.ts`, gated by `scripts/token-audit.mjs`
**Apply to:** `CastTimeline.tsx`, `AnalysisView.tsx` Timeline tab, `RaidOverview.tsx` HealerPanel changes — any new className must resolve to a token, never a raw hex or Tailwind palette shade (except the pre-existing Satori/`_HEX` allowlist exception, irrelevant to this phase).

### PostHog instrumentation
**Source:** existing `posthog.capture("snake_case_event", { report_code, ... })` calls in client components (per RESEARCH.md Code Examples / OPS-01)
**Apply to:** Timeline tab open, healer suggestion view — new events should follow the same snake_case naming and include `report_code`, `fight_id`, and role/spec where existing events do.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/healer-metrics.test.ts` | test | transform | First fixture-driven unit test file in this codebase for a pure helper with no prior test; use RESEARCH.md's Pattern 2 code example directly as the implementation-under-test reference. |
| Virtualisation logic inside `CastTimeline.tsx` | component (windowed rendering) | streaming/render | No existing virtualised list anywhere in `app/components/`; RESEARCH.md's "Don't Hand-Roll" section specifies a fixed-row-height manual window (render rows within N px of viewport + spacer div) as the approach — no in-repo precedent to copy, follow the research spec instead. |

## Metadata

**Analog search scope:** `lib/`, `app/api/`, `app/components/`, `app/analyze/[reportCode]/hooks/`, `scripts/`, `docs/`
**Files scanned:** `lib/wcl-queries.ts`, `lib/wcl-client.ts`, `lib/wcl-types.ts`, `lib/api-utils.ts`, `lib/rate-limit.ts`, `lib/constants.ts`, `lib/cla-constants.ts`, `lib/cla-constants.test.ts`, `lib/raid-overview-engine.ts`, `lib/analysis-engine.ts`, `lib/use-url-tab-state.ts`, `app/api/analyze/route.ts`, `app/components/AnalysisView.tsx`, `app/components/RaidOverview.tsx`, `app/analyze/[reportCode]/hooks/useCLA.ts`, `scripts/token-audit.mjs`
**Pattern extraction date:** 2026-09-07
