---
phase: 02-accuracy-analysis-depth
plan: 02
subsystem: api
tags: [wcl, graphql, timeline, cast-log, posthog, vitest]

# Dependency graph
requires:
  - phase: 02-accuracy-analysis-depth
    provides: "TIMELINE_CASTS_QUERY/_PAGE_QUERY, WCLCastEvent/TimelineRow/CastTimelineResult type contracts, RATE_LIMITS.timeline, formatFightTime, exported isJunkSpell — all from 02-01"
provides:
  - "buildCastTimeline() — pure engine transforming recorded WCL cast events into an ordered, JSON-serialisable cast timeline"
  - "POST /api/timeline — validated, rate-limited, single-flight-cached, page-capped (MAX_TIMELINE_PAGES=20) cast-events fetch"
  - "useTimeline() lazy-fetch hook and CastTimeline vertical log component, wired as a seventh 'Timeline' sub-tab on the player analysis view"
  - "timeline_viewed / timeline_error PostHog events"
affects: [02-05, 02-07, 02-08]

# Actuals (#2632)
actuals:
  tokens: 6994
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Pure engine mirrors buildRaidOverview's shape (typed input bag in, typed JSON-serialisable result out, no I/O) — lib/timeline-engine.ts"
    - "A pure helper needed by a server-consumed lib file is re-implemented locally rather than imported from a \"use client\" component module, to avoid a Next.js client-reference-proxy risk at build time"
    - "Lazy per-sub-tab fetch hook (useTimeline) mirrors useCLA's auto-run/clear-on-change/clear-error-on-reopen shape, extended to a sub-tab value instead of a top-level tab"

key-files:
  created:
    - lib/timeline-engine.ts
    - lib/timeline-engine.test.ts
    - app/api/timeline/route.ts
    - app/analyze/[reportCode]/hooks/useTimeline.ts
    - app/components/CastTimeline.tsx
  modified:
    - app/components/AnalysisView.tsx
    - app/analyze/[reportCode]/AnalyzeClient.tsx

key-decisions:
  - "Only WCL events with type === \"cast\" are treated as completed casts. The recorded events also include \"begincast\" probes for any cast-time ability, sharing the same abilityGameID as the completion event moments later; including both would double-log every cast-time spell (Auto Shot showed 66 real completions vs 68 begincast probes in the same page of the fixture). Not explicitly specified in the plan's action text, but required for ACC-03's own success bar (\"read what that player actually cast\") and for the plan's own abilityCounts-sums-to-castCount test to mean anything — treated as a Rule 1 correctness requirement."
  - "WCL's -1 targetID sentinel (a cast with no real target, e.g. a self-buff) is treated identically to a missing targetID — both resolve to an undefined targetName (rendered as an em dash), not to the 'Environment' actor -1 otherwise maps to in the actor list."
  - "buildRankedNames's ranking algorithm is duplicated as a local, private function inside lib/timeline-engine.ts rather than imported from app/components/SpellLink.tsx. SpellLink.tsx is a \"use client\" module; this engine is consumed by a server-only API route, and pulling a client-boundary export into server code risks resolving to a client-reference proxy instead of the real function under Next.js's RSC build — a risk none of tsc/eslint/vitest would surface, only next build would. No existing precedent in this codebase imports a client-component export into lib/ or app/api/, so the safer, self-contained duplication was chosen."
  - "The plan's Task 1 acceptance-criteria prose (\"allow-list array has seven entries including timeline\") and its machine <verify> script (a comma-split character count hardcoded to \"8\") disagree: a correct 7-entry array, plus the pre-existing duplicated \"ptab\"/default-\"dps\" positional arguments, counts to 9 not 8. Implemented per the prose (7 entries — dps, abilities, gear, talents, buffs, casts, timeline), which is also the only reading consistent with the codebase's established useUrlTabState(key, default, allowed[]) convention. See Deviations."

patterns-established:
  - "Cast-timeline engine only emits kind: \"cast\" rows this plan; the TimelineRowKind discriminator and idleMs/idleThresholdMs fields already exist in the shared contract so plan 02-05 can add idle-gap and death rows with no shape change to the engine, route, hook or component."

requirements-completed: [ACC-03]

coverage:
  - id: D1
    description: "A raider can open a Timeline tab beside DPS/HPS · Abilities · Gear · Talents · Buffs · Casts on a player's analysis and read that player's non-junk casts for that fight in chronological order, with fight-relative timestamps, ability icons, Wowhead-linked names and resolved targets"
    requirement: "ACC-03"
    verification:
      - kind: unit
        ref: "lib/timeline-engine.test.ts#buildCastTimeline (8 assertions: ascending order, fight-relative timing, non-empty names, junk exclusion, Self target, undefined target, abilityCounts sum, abilityCounts order)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "npx eslint lib/timeline-engine.ts lib/timeline-engine.test.ts app/api/timeline/route.ts 'app/analyze/[reportCode]/hooks/useTimeline.ts' app/components/CastTimeline.tsx app/components/AnalysisView.tsx 'app/analyze/[reportCode]/AnalyzeClient.tsx'"
        status: pass
      - kind: other
        ref: "npm run token-audit"
        status: pass
      - kind: other
        ref: "npm run theme-parity"
        status: pass
    human_judgment: true
    rationale: "The engine, route contract and grep-verifiable wiring are all proven by the automated checks above, but whether the rendered log genuinely reads well in a real browser (row alignment, icon loading, hover tooltips, scroll behavior) is a visual/UX judgment no unit test asserts — no dev server was started this session to capture a screenshot for human review."
  - id: D2
    description: "No WCL cast-events request is issued until the Timeline tab is opened for the first time; the route is rate-limited (timeline bucket), input-validated before any cache key or WCL query, single-flight cached, and bounded to MAX_TIMELINE_PAGES=20 pages so a pathological fight cannot force unbounded WCL query volume"
    requirement: "ACC-03"
    verification:
      - kind: other
        ref: "grep checks: shouldAutoRun tests subTab === \"timeline\"; route calls checkRateLimit(request, \"timeline\"), isValidReportCode, Number.isInteger, cachedApiHandler, declares MAX_TIMELINE_PAGES"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 73/73 passing, no regressions)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Timeline tab emits exactly one PostHog event on a successful load (timeline_viewed) and exactly one on a failure (timeline_error), both carrying report_code/fight_id/source_id"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "grep -c 'posthog.capture' app/analyze/[reportCode]/hooks/useTimeline.ts == 2, plus event-name and property-name greps"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 2: Cast Timeline (Tracer) Summary

**A tracer-quality, production-ready Timeline tab — pure `buildCastTimeline()` engine, rate-limited/page-capped `/api/timeline` route, lazy `useTimeline` hook, and `CastTimeline` log component — wired end-to-end onto the player analysis view's seventh sub-tab, instrumented with `timeline_viewed`/`timeline_error` PostHog events.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-09-08
- **Tasks:** 2
- **Files modified:** 7 (5 created, 2 modified)

## Accomplishments

- `lib/timeline-engine.ts` — `buildCastTimeline()`, a pure, synchronous, JSON-serialisable transform (no I/O) mirroring `buildRaidOverview`'s shape: takes recorded cast events, the aggregated casts table, the actor list and fight bounds, and returns an ordered `CastTimelineResult`. Filters to completed `"cast"` events only (drops `"begincast"` probes, which share the same ability id and would otherwise double-log every cast-time spell), drops junk spells via the shared `isJunkSpell`, resolves ranked display names (matching the existing Casts tab), and resolves target names — `"Self"` when the target is the player, `undefined` (rendered as an em dash) when WCL's `-1` "no target" sentinel or a genuinely missing target id is present.
- `lib/timeline-engine.test.ts` — 8 assertions driven entirely by the real recorded `lib/__fixtures__/demo-timeline-casts.json` fixture (plus three synthetic events layered on top to deterministically exercise the junk/self-target/no-target paths): ascending order, fight-relative timing (<10s for the first real row), non-empty ability names, junk exclusion, `Self` target resolution, undefined-not-dropped for no-target events, `abilityCounts` summing to `castCount`, and descending `abilityCounts` order.
- `app/api/timeline/route.ts` — `POST /api/timeline`, copying `app/api/analyze/route.ts`'s skeleton: `parseBody` → `checkRateLimit(request, "timeline")` → `isValidReportCode` → `Number.isInteger` on both ids → `cachedApiHandler`. Fetches `TIMELINE_CASTS_QUERY`, 404s on missing fight or missing source id in the master actor list, paginates via `TIMELINE_CASTS_PAGE_QUERY` up to a hard `MAX_TIMELINE_PAGES = 20` cap (setting `truncated: true` only when the cap — not natural pagination end — is what stopped the loop), then calls `buildCastTimeline`.
- `app/analyze/[reportCode]/hooks/useTimeline.ts` — lazy-fetch hook mirroring `useCLA.ts`'s shape: clears on fight/source change, clears the error when the timeline sub-tab is reopened, and auto-runs only when the sub-tab equals `"timeline"` — so selecting a player and staying on DPS/HPS issues zero timeline requests.
- `app/components/CastTimeline.tsx` — `Card`-shelled vertical cast log matching `CastEfficiency.tsx`'s tone: three `h-10` `Skeleton` rows while loading, a destructive `Alert` on error, the exact empty-state sentence when `castCount` is 0, and otherwise 40px rows (`w-14` mono timestamp via `formatFightTime`, 24px lazy-loaded Wowhead icon with a graceful `onError` fallback to a placeholder square, `SpellLink`-rendered ability name, right-aligned target). The three states are mutually exclusive by construction (loading / error / content), and the row list scrolls inside a `max-h-[400px] overflow-y-auto` container rather than stretching the page.
- `app/components/AnalysisView.tsx` / `AnalyzeClient.tsx` — `"timeline"` added as the seventh `ptab` allow-list value and `TabsTrigger`/`TabsContent` pair (positioned last, after Casts, so existing tab order is undisturbed); `reportCode`, `fightId` and `sourceId` threaded down from `AnalyzeClient`'s already-held selection state.
- Task 2 added exactly two `posthog.capture` call sites to `useTimeline.ts` — `timeline_viewed` (with `cast_count`, `truncated`) on success and `timeline_error` on a failed response or a thrown request, both carrying `report_code`/`fight_id`/`source_id` — satisfying the ship gate's one-event-per-interaction rule by capturing the outcome once after the try/catch/finally rather than once per branch.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "open the Timeline tab and read your casts in order" — one path, every layer** - `15e0247` (feat) — engine, route, hook, component, wiring
2. **Task 2: Instrument the Timeline tab and finish its non-happy paths** - `8e60659` (feat) — PostHog instrumentation, scroll container

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `lib/timeline-engine.ts` - Pure `buildCastTimeline()` transform
- `lib/timeline-engine.test.ts` - 8 fixture-driven assertions
- `app/api/timeline/route.ts` - Validated, rate-limited, cached, page-capped route
- `app/analyze/[reportCode]/hooks/useTimeline.ts` - Lazy-fetch hook with PostHog instrumentation
- `app/components/CastTimeline.tsx` - Vertical cast log component
- `app/components/AnalysisView.tsx` - Seventh `timeline` sub-tab wired to `useTimeline`/`CastTimeline`
- `app/analyze/[reportCode]/AnalyzeClient.tsx` - Passes `reportCode`/`fightId`/`sourceId` to `AnalysisView`

## Decisions Made

See `key-decisions` in frontmatter — most notably: filtering WCL's `"begincast"` probe events (a correctness requirement the plan's action text left implicit), treating the `-1` targetID sentinel as "no target," and duplicating `buildRankedNames`'s small algorithm locally rather than importing it from a `"use client"` component file into server-consumed code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Filtered WCL's `"begincast"` events out of the cast timeline**
- **Found during:** Task 1 (building `buildCastTimeline`, cross-checking the fixture's raw event stream against the aggregated casts table)
- **Issue:** The recorded event stream contains both `"cast"` (completion) and `"begincast"` (cast-start probe) event types sharing the same `abilityGameID`, close together in time. The plan's action text says "Sort the surviving events... Emit one TimelineRow per event" without explicitly restricting to `type === "cast"`. Including both would double-log every cast-time ability — in the fixture, Auto Shot alone produced 66 real completions and 68 begincast probes within the same 300-event page.
- **Fix:** `buildCastTimeline` now filters `event.type !== "cast"` before the junk/cast-table checks.
- **Files modified:** `lib/timeline-engine.ts`
- **Verification:** `lib/timeline-engine.test.ts`'s `abilityCounts sums to castCount` assertion passes; without the filter, doubled rows would still sum consistently (both counts inflate together) but the log itself would visibly show duplicate consecutive entries for any cast-time spell, which is a correctness failure against ACC-03's own bar ("read what that player actually cast").
- **Committed in:** `15e0247` (Task 1 commit)

**2. [Rule 1 - Bug] Treated WCL's `-1` targetID sentinel as "no target," not resolved to the `Environment` actor**
- **Found during:** Task 1 (writing the target-resolution branch)
- **Issue:** The masterData actor list includes an entry `{id: -1, name: "Environment", ...}`, and a naive `actorById.get(event.targetID)` lookup would resolve every self-buff / no-target cast's target to the literal string "Environment" — misleading, since -1 is WCL's generic "no real target" sentinel, not an actual target the cast hit.
- **Fix:** `targetID === -1` is treated identically to a missing `targetID` (both produce `undefined`, rendered as an em dash), not resolved through the actor map.
- **Files modified:** `lib/timeline-engine.ts`
- **Verification:** `lib/timeline-engine.test.ts`'s "no target" assertion explicitly uses a synthetic `targetID: -1` event and asserts `targetName` is `undefined`.
- **Committed in:** `15e0247` (Task 1 commit)

### Documented Discrepancy (not auto-fixed — plan authoring issue, not an implementation bug)

**3. Task 1's machine `<verify>` check for `AnalysisView.tsx`'s `ptab` allow-list array hardcodes a count of `"8"` that the plan's own acceptance-criteria prose ("seven entries including `timeline`") cannot produce.**
- **Found during:** Task 1 acceptance-criteria HARD GATE re-run
- **Issue:** The check counts comma-separated segments containing a `"` in `useUrlTabState("ptab", "dps", [...])`, i.e. 2 (the `"ptab"` key + the duplicated default `"dps"` positional argument) + N (array length). For the pre-existing 6-tab array this correctly equals 8 (confirmed against `git show HEAD:app/components/AnalysisView.tsx` pre-plan). A correct 7-entry array (adding `"timeline"`, matching both the acceptance-criteria prose and the codebase's established `useUrlTabState(key, default, allowed[])` convention, where the default value is always duplicated as the array's first entry) necessarily totals 9, not 8. The check's own English rationale ("the ptab key plus seven tab values") computes to 1 + 7 = 8, silently omitting the duplicated default-value segment its own formula always counts — an internal inconsistency in the plan's authored verify script, not something this implementation can satisfy without either violating the "seven entries" requirement (dropping to 6 array entries, which changes behavior for nobody since the hook already falls back to the default value regardless of array membership — but contradicts the explicit acceptance criterion) or an unrelated, regex-fragile code restructure with no guaranteed outcome.
- **Resolution:** Implemented per the acceptance-criteria prose and the established codebase convention (7-entry array, unchanged `useUrlTabState` call shape). Every other check in the same compound `<verify>` command (trigger/content presence, hook wiring, prop threading) passes.
- **Files affected:** `app/components/AnalysisView.tsx` (no code change resulted from this — documented for plan-authoring awareness only)
- **Impact:** None on shipped behavior. The array genuinely holds all seven tab values including `timeline`, verified via `TabsTrigger value="timeline"` and `TabsContent value="timeline"` presence checks (both pass) rather than the miscounted numeric check.

---

**Total deviations:** 2 auto-fixed (both Rule 1 — correctness/accuracy, left implicit by the plan but required by ACC-03's own bar), 1 documented plan-verify-script discrepancy (no code change).
**Impact on plan:** The two auto-fixes are both required for an accurate cast log — CLAUDE.md's core value states "a wrong recommendation is worse than no recommendation," and a doubled-up cast log or a target resolving to "Environment" instead of a blank dash would each be a small but real accuracy defect. No scope creep.

## Issues Encountered

None beyond the documented deviations above.

## Known Stubs

None — every rendered value in `CastTimeline.tsx` is wired to the real `/api/timeline` response; no placeholder/mock data paths exist.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02-05 (same phase, wave 3) can extend `buildCastTimeline` with `idle` and `death` row kinds and a real `idleThresholdMs` with no shape change to the engine, route, hook or component — the `TimelineRowKind` discriminator and `idleMs`/`idleThresholdMs` fields already exist in the shared contract and are populated with their wave-1 defaults (`0`, no idle/death rows emitted) this plan. Per-ability filter chips and the truncation notice (D-04, "Log truncated — showing first {N} casts") are also deferred to 02-05, per the plan's own scope note ("plan 02-05 delivers the truncation disclosure, the idle-gap and death markers and the filter chips").

No blockers for the next plan in Phase 2.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 7 key files verified present on disk (`[ -f ]`); both task commits (`15e0247`, `8e60659`) verified present in `git log --oneline --all`. `npx vitest run lib/timeline-engine.test.ts` re-confirmed 8/8 passing; `npm test` (full suite) 9 files / 73 tests passing; `npx tsc --noEmit` clean; `npm run theme-parity` PASS; `npm run token-audit` exit 0 (57 findings, all pre-existing allowlisted, none naming CastTimeline.tsx or AnalysisView.tsx).
