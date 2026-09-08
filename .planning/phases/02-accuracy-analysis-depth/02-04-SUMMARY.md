---
phase: 02-accuracy-analysis-depth
plan: 04
subsystem: api
tags: [healer-metrics, wcl, dps-comparison, raid-overview, vitest]

# Dependency graph
requires:
  - phase: 02-accuracy-analysis-depth
    provides: "HealerTableRow/HealerMetricsComputed/HealerComparison types, TopPlayerFullData.healerRow, healingByPlayer on both healing queries, formatFightTime — all from 02-01"
provides:
  - "lib/healer-metrics.ts — computeHealerMetrics() and averageTopHealerMetrics(), the single source of truth for healer effective HPS, overheal percent and healing uptime (D-08)"
  - "app/api/analyze/route.ts now builds a HealerComparison for the healer role and passes it through AnalysisResult.healer"
  - "app/components/DpsComparison.tsx renders Overheal/Uptime comparison rows for healers, colored via shared lib/constants.ts helpers"
  - "lib/raid-overview-engine.ts's Healer Breakdown data and app/components/DpsComparison.tsx's healer rows are now provably identical for the same healer + fight (cross-surface parity test)"
affects: [02-07, 02-09]

# Actuals (#2632)
actuals:
  tokens: 7341
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Shared computation helper (lib/healer-metrics.ts) consumed by both an engine (lib/raid-overview-engine.ts) and an API route (app/api/analyze/route.ts), with a unit test asserting field-for-field parity between the two call sites — the same pattern used to prevent silent divergence elsewhere in this phase (game-data era selection, 02-03)"
    - "Display color-band helpers (overhealColor/activityColor) consolidated into lib/constants.ts beside percentileColor/percentileBg, imported by both consuming components rather than duplicated"

key-files:
  created:
    - lib/healer-metrics.ts
    - lib/healer-metrics.test.ts
  modified:
    - lib/wcl-types.ts
    - lib/constants.ts
    - lib/wcl-fetchers.ts
    - app/api/analyze/route.ts
    - lib/analysis-engine.ts
    - app/components/DpsComparison.tsx
    - app/components/AnalysisView.tsx
    - lib/raid-overview-engine.ts
    - app/components/RaidOverview.tsx

key-decisions:
  - "lib/constants.ts's overhealColor/activityColor exports were added during Task 1, not Task 2 as the plan's task split implies. Task 1's own DpsComparison.tsx import and its own npx tsc --noEmit / npm run lint / npm run token-audit gate require these exports to exist before Task 1 can pass its own verification — the plan assigns their addition to Task 2 but the tasks are not independently compilable in that order. Added them once during Task 1 (byte-for-byte per the plan's own quoted interfaces block); Task 2 found them already present and proceeded with its remaining work (engine wiring + RaidOverview.tsx cleanup) unchanged. See Deviations."
  - "HealerComparison (lib/wcl-types.ts) gained an additional hasHealing: boolean field beyond the four fields the plan's interfaces block quotes. Needed so DpsComparison.tsx can render an em dash instead of a misleading '0%' for a healer who recorded no healing (plan's own action text requires this em-dash behavior but the quoted type has no field to drive it). Purely additive — no existing field changed."
  - "A5 finding re-confirmed against the recorded fixture, not just RESEARCH.md: the player-page headline HPS (from throughputEntries.reduce, the scoped per-ability sum) and the new effectiveHps (from computeHealerMetrics on the un-scoped healingByPlayer row) are the same number for the recorded fixture — 230,867 total both ways. No code change to the headline was needed."

patterns-established:
  - "computeHealerMetrics(row, fightDurationMs) is the mandatory single entry point for healer effective HPS / overheal% / uptime% — any future surface needing these numbers must call it rather than re-deriving from a Healing table row."

requirements-completed: []  # ACC-04 also declared by 02-01 (complete), 02-07 and 02-09 (not yet run) — shared-ID gate holds it until every declaring plan finishes; see requirements.ready-ids

coverage:
  - id: D1
    description: "A healer viewing their own analysis page sees effective HPS, overheal percent and healing uptime next to the same three metrics averaged across top-ranked healers of their spec, computed by one shared helper (D-05, D-06)"
    requirement: "ACC-04"
    verification:
      - kind: unit
        ref: "lib/healer-metrics.test.ts#computeHealerMetrics (behaviour-preservation + 5 guard assertions)"
        status: pass
      - kind: other
        ref: "grep checks: computeHealerMetrics/averageTopHealerMetrics exported and called at both route and engine call sites; hps ranking metric and partition scoping unchanged"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit && npm run lint (scoped to touched files) && npm run token-audit && npm run theme-parity"
        status: pass
    human_judgment: true
    rationale: "The engine, route wiring, and rendered row markup are all proven by the automated checks above, but whether the two-row healer comparison actually reads well in a real browser (alignment, color contrast at a glance, the em-dash edge case) is a visual/UX judgment no unit test asserts — no dev server was started this session to capture a screenshot for human review."
  - id: D2
    description: "The raid overview's Healer Breakdown panel and the player page's healer comparison rows are provably identical for the same healer and fight — one computation (computeHealerMetrics), one pair of colour helpers (overhealColor/activityColor), asserted by a cross-surface equality test (D-08)"
    requirement: "ACC-04"
    verification:
      - kind: unit
        ref: "lib/healer-metrics.test.ts#buildRaidOverview / computeHealerMetrics cross-surface parity (D-08)"
        status: pass
      - kind: other
        ref: "grep: lib/raid-overview-engine.ts contains no non-comment healEntry.overheal reference; app/components/RaidOverview.tsx declares no private overhealColor/activityColor/formatFightTime"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 92/92 passing, no regressions)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A healer with zero healing events (e.g. dead at the pull) shows 0 HPS and 0% uptime rather than being silently dropped from the raid overview's healer list, and an em dash instead of a measured-looking 0% overheal, in both the raid overview panel and the player page's own comparison rows"
    requirement: "ACC-04"
    verification:
      - kind: unit
        ref: "lib/healer-metrics.test.ts#'keeps a healer with a zero-total healing row in healerMetrics with 0 HPS and 0 uptime rather than dropping the row'"
        status: pass
      - kind: unit
        ref: "lib/healer-metrics.test.ts#computeHealerMetrics guard assertions (undefined row, zero duration, zero total all return hasHealing: false, never NaN)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 4: Healer Metrics — Effective HPS, Overheal and Uptime Summary

**Extracted the healer HPS/overheal/uptime math into a single shared `lib/healer-metrics.ts` helper, wired it through both the player-page analyze route and the raid overview engine, and added two colored comparison rows (Overheal, Uptime) to a healer's own analysis card — with a unit test proving the raid table and the player page can never disagree on the same number.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-09-08
- **Tasks:** 2
- **Files modified:** 11 (2 created, 9 modified)

## Accomplishments

- `lib/healer-metrics.ts` — `computeHealerMetrics(row, fightDurationMs)` reproduces `lib/raid-overview-engine.ts`'s prior inline formulas and rounding exactly (effective HPS = total/durationSec rounded to a whole number; overheal% = overheal/(total+overheal)×100 rounded to one decimal; uptime% = min(100, activeTime/fightDuration×100) rounded to one decimal), guarding an absent row, a non-positive fight duration, and a zero total by returning all zeros with `hasHealing: false` — never NaN, never Infinity. `averageTopHealerMetrics(rows)` averages only the `hasHealing: true` rows, mirroring `analyzeBuffsAgainstAverage`/`analyzeCastsAgainstAverage`'s existing top-N averaging shape.
- `lib/healer-metrics.test.ts` — 15 assertions: a behaviour-preservation check against a known recorded fixture entry (source 32, Zulakeyah — 667 HPS, 35.6% overheal, 68.2% uptime, independently computed and cross-checked in Python before writing the test), all five guard cases, `averageTopHealerMetrics`'s filtering/empty/sample-count behaviour, and — added in Task 2 — a cross-surface parity assertion proving `buildRaidOverview` and `computeHealerMetrics` return field-for-field identical numbers for the same row and fight duration, plus a zero-total-row assertion proving a healer dead at the pull is emitted with zeroed metrics rather than dropped.
- `lib/wcl-fetchers.ts` — `fetchTopPlayers` now reads the un-scoped `healingByPlayer` table (already fetched on the healer query, no extra round trip) and stores the matched row as `TopPlayerFullData.healerRow` on the healer path only; the damage path is untouched.
- `app/api/analyze/route.ts` — the healer branch reads its own `healingByPlayer` row, builds a `HealerComparison` via `computeHealerMetrics` (player) and `averageTopHealerMetrics` over each top player's own `computeHealerMetrics` result, and passes it into `buildAnalysisResult` as a new `healerComparison` parameter. The `hps` ranking metric and the partition-scoping argument from the PR #12 fix are untouched.
- `lib/analysis-engine.ts` — `buildAnalysisResult` accepts the new optional `healerComparison` parameter and assigns it to `AnalysisResult.healer` only when `playerRole === "healer"`.
- `app/components/DpsComparison.tsx` — accepts a new optional `healer?: HealerComparison` prop; when the role is healer and the prop is present, renders two `flex justify-between text-sm` rows (`Overheal`, `Uptime`) directly beneath the existing Top bar, inside the same `CardContent`, each showing `You: {n}%` and `Top: {n}%` individually colored via the shared `overhealColor`/`activityColor` helpers, with an em dash in place of the player's own percentage when the payload reports no healing for that fight.
- `app/components/AnalysisView.tsx` — passes `healer={data.healer}` to `DpsComparison` (one line).
- `lib/constants.ts` — `overhealColor`/`activityColor` exported beside `percentileColor`/`percentileBg`, reproducing the threshold bands `app/components/RaidOverview.tsx` previously defined privately, byte-for-byte.
- `lib/raid-overview-engine.ts` — both the per-player throughput/activity branch and the `healerMetrics` list now call `computeHealerMetrics` instead of inlining the three formulas; a healer with no matching healing row is now emitted with zeroed metrics (`totalHealing: 0`) instead of being `continue`-skipped, so a healer dead at the pull still appears in the panel.
- `app/components/RaidOverview.tsx` — imports `overhealColor`/`activityColor` from `@/lib/constants` and `formatFightTime` from `@/lib/utils`, deleting the three module-private duplicates (pure import swap — identical logic, confirmed byte-for-byte before deleting). `HealerPanel` renders an em dash instead of `0% OH` when a healer's `totalHealing` is 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "a healer sees their overheal and uptime beside the top healers'"** - `955c956` (feat)
2. **Task 2: Make the raid overview read the same numbers through the same helpers** - `f1a516f` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `lib/healer-metrics.ts` - `computeHealerMetrics`/`averageTopHealerMetrics`, single source of truth for healer metrics
- `lib/healer-metrics.test.ts` - Behaviour-preservation, guard, averaging and cross-surface-parity assertions
- `lib/wcl-types.ts` - `HealerComparison` gains `hasHealing`
- `lib/constants.ts` - `overhealColor`/`activityColor` exported beside `percentileColor`/`percentileBg`
- `lib/wcl-fetchers.ts` - `fetchTopPlayers` reads `healingByPlayer`, populates `TopPlayerFullData.healerRow`
- `app/api/analyze/route.ts` - Reads its own `healingByPlayer` row, builds and passes `healerComparison`
- `lib/analysis-engine.ts` - `buildAnalysisResult` accepts `healerComparison`, assigns `AnalysisResult.healer`
- `app/components/DpsComparison.tsx` - Renders Overheal/Uptime rows for healers
- `app/components/AnalysisView.tsx` - Passes `healer={data.healer}` to `DpsComparison`
- `lib/raid-overview-engine.ts` - `buildRaidOverview` calls `computeHealerMetrics`, no longer drops zero-healing healers
- `app/components/RaidOverview.tsx` - Imports shared helpers, deletes private duplicates, em-dash on zero overheal

## Decisions Made

See `key-decisions` in frontmatter — most notably: `overhealColor`/`activityColor` were added to `lib/constants.ts` during Task 1 (not Task 2 as the plan's task split implies) because Task 1's own compile/lint/token-audit gate requires the import to resolve; `HealerComparison` gained an additive `hasHealing` field the plan's quoted interface omitted but its own em-dash requirement needs; and the A5 finding (headline HPS already equals effective HPS) was re-confirmed against the recorded fixture rather than assumed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `overhealColor`/`activityColor` to `lib/constants.ts` during Task 1, not Task 2**
- **Found during:** Task 1 (writing `app/components/DpsComparison.tsx`'s import)
- **Issue:** Task 1's action text explicitly says to `import overhealColor and activityColor from lib/constants — Task 2 puts them there`, but Task 1's own `<verify>` block requires `npx tsc --noEmit && npm run lint && npm run token-audit` to exit 0 before Task 1 is considered done. Since these exports don't exist until Task 2 runs, Task 1 as literally sequenced cannot pass its own verification — a plan-ordering inconsistency, not an implementation bug.
- **Fix:** Added `overhealColor`/`activityColor` to `lib/constants.ts` during Task 1, reproducing the threshold bands from the plan's own quoted interfaces block byte-for-byte (the same content Task 2's action text separately describes). Task 2 found them already present and correct, and proceeded with its remaining scope (raid-overview engine wiring + `RaidOverview.tsx` cleanup) with no duplicate work and no conflict.
- **Files modified:** `lib/constants.ts`
- **Verification:** Task 1's full gate (`tsc`/`lint`/`token-audit`/`theme-parity`) passed with the export present; Task 2's own acceptance criteria (`lib/constants.ts exports overhealColor and activityColor`) still passed unchanged.
- **Committed in:** `955c956` (Task 1 commit)

**2. [Rule 2 - Missing Critical] `HealerComparison` gained an additive `hasHealing: boolean` field**
- **Found during:** Task 1 (implementing the em-dash requirement in `DpsComparison.tsx`)
- **Issue:** The plan's action text requires rendering "an em dash in place of the player's percentage when the analyze payload reports no healing for that fight," but the plan's own quoted `HealerComparison` interface (six fields: `effectiveHps`, `overhealPercent`, `activityPercent`, `topOverhealPercent`, `topActivityPercent`, `topSampleCount`) has no field capable of driving that condition — `overhealPercent: 0` is ambiguous between "genuinely 0% overheal" and "no healing recorded at all."
- **Fix:** Added `hasHealing: boolean` to `HealerComparison`, populated directly from `computeHealerMetrics`'s own `hasHealing` result in the route. Purely additive — no existing field renamed or removed, no existing consumer broken (there were none; this plan is the sole producer and consumer of the type).
- **Files modified:** `lib/wcl-types.ts`, `app/api/analyze/route.ts`, `app/components/DpsComparison.tsx`
- **Verification:** `npx tsc --noEmit` clean; `DpsComparison.tsx` renders `—` for `You:` when `hasHealing` is false and a real percentage otherwise, verified by inspection of the conditional render logic (no dev server was started this session — see D1's `human_judgment` rationale).
- **Committed in:** `955c956` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking plan-ordering issue, 1 missing-critical type field). Both were necessary for the plan's own stated requirements to be satisfiable at all — no scope creep beyond what the plan's action text and acceptance criteria already required.
**Impact on plan:** None on the shipped guarantee — D-08's single-helper, single-colour-band contract holds exactly as specified; both deviations are corrections to the plan's own internal ordering/completeness, not changes to what was built.

## Issues Encountered

None beyond the documented deviations above.

## RESEARCH.md Assumption A5 — Confirmed Against the Recorded Fixture

Per the `<output>` instruction: RESEARCH.md's Assumption A5 (the existing headline healer throughput number is already effective healing, not gross healing) was already confirmed once during 02-01 against the recorded fixture data (`lib/__fixtures__/README.md`). This plan re-confirmed it independently by comparing the two code paths directly: `app/api/analyze/route.ts`'s pre-existing headline (`throughputEntries.reduce((s, e) => s + e.total, 0)`, summing the sourceID-scoped per-ability table) and this plan's new `effectiveHps` (from `computeHealerMetrics` on the un-scoped `healingByPlayer` row) both resolve to the same total (230,867 for the recorded fixture's healer) — because the scoped per-ability sum and the un-scoped row's total are the same underlying WCL figure (A3/A5 findings). **No discrepancy was found; no change was made to the headline calculation.** This means plan 02-07's suggestion thresholds and Phase 3's per-player share image can treat the existing headline HPS and this plan's `effectiveHps` as the same number for the recorded fixture — they are computed from data that WCL itself keeps consistent.

## Known Stubs

None — every rendered value in the new `DpsComparison.tsx` healer rows and the `RaidOverview.tsx` `HealerPanel` changes is wired to the real analyze/raid-overview payload; no placeholder/mock data paths exist.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02-07 (healer-specific suggestion rules) can now build directly on `AnalysisResult.healer` (effective HPS, overheal%, uptime%, top-healer averages, `hasHealing`) with no further engine work — the three metrics D-07's rules need are already computed, shared, and cross-surface-verified. Plan 02-09 can rely on the same `computeHealerMetrics`/`averageTopHealerMetrics` pair for any additional healer-facing surface without re-deriving the formulas.

ACC-04 is not yet marked complete in REQUIREMENTS.md: it is also declared by 02-01 (already complete) and by 02-07/02-09 (not yet executed) — the shared-ID gate correctly holds it open until every declaring plan finishes (confirmed via `requirements.ready-ids`: 0/1 ready).

No blockers for the next plan in Phase 2.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 11 key files verified present on disk (`[ -f ]`); both task commits (`955c956`, `f1a516f`) verified present in `git log --oneline --all`. `npx vitest run lib/healer-metrics.test.ts lib/constants.test.ts` re-confirmed 25/25 passing; `npm test` (full suite) re-confirmed 11 files / 92 tests passing (up from 81/81 pre-plan); `npx tsc --noEmit` clean; `npm run theme-parity` PASS; `npm run token-audit` exit 0 (57 findings, all pre-existing allowlisted, none naming any file this plan touched); `npx eslint` scoped to every file this plan touched exits clean with zero findings.
