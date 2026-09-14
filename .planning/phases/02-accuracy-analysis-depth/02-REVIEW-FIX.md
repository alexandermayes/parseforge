---
phase: 02-accuracy-analysis-depth
fixed_at: 2026-09-14T18:01:29Z
review_path: .planning/phases/02-accuracy-analysis-depth/02-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-09-14T18:01:29Z
**Source review:** .planning/phases/02-accuracy-analysis-depth/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01 critical; WR-01, WR-02, WR-03 warnings)
- Fixed: 4
- Skipped: 0

**Verification environment:** Main checkout at `/Users/alexander.mayes/Code/personal/parseforge`
on branch `growth/phase-2-review-fixes` (no isolated worktree — this run operated directly in the
working tree per explicit orchestrator instruction for this invocation). `npx tsc --noEmit` and
`npx vitest run` were both run from this same checkout after each fix, so the pass/fail numbers
below are reproducible from the tree as it stands now (all fix commits are present on
`growth/phase-2-review-fixes`).

## Fixed Issues

### CR-01: Healer suggestions fire on zero-healing data instead of respecting `hasHealing`

**Files modified:** `lib/analysis-engine.ts`, `lib/analysis-engine.test.ts`
**Commit:** `0ef3802`
**Applied fix:** Added `healer.hasHealing` to the guard on `generateSuggestions`' healer-suggestion
block (`if (playerRole === "healer" && healer && healer.hasHealing && healer.topSampleCount > 0)`),
so a healer who recorded zero healing this fight no longer gets a misleading "Low healing uptime:
0%..." recommendation. Added Test 10 to `lib/analysis-engine.test.ts` asserting a
`healerFixture({ hasHealing: false, overhealPercent: 0, activityPercent: 0 })` input yields zero
healer-category suggestions. `npx vitest run lib/analysis-engine.test.ts` — 13/13 passed. Full
suite (`npx vitest run`) — 136/136 passed at time of this commit. `npx tsc --noEmit` — clean.

### WR-01: `/api/timeline`'s "player not found in fight" check is not actually fight-scoped

**Files modified:** `app/api/timeline/route.ts`, `lib/wcl-queries.ts`
**Commit:** `af1442b`
**Applied fix:** Added `playerDetails(fightIDs: $fightIDs)` to `TIMELINE_CASTS_QUERY` (mirroring
the field `app/api/analyze/route.ts` already fetches) and replaced the report-wide
`masterData.actors` membership check with `flattenPlayerDetails(report.playerDetails).some((p) =>
p.id === sourceId)`, which is genuinely scoped to the requested fight. No fixture-based test
constructs the GraphQL query string directly, so this is a safe query-shape change. `npx tsc
--noEmit` — clean. Full suite — 136/136 passed.

### WR-02: PostHog capture invoked from inside a `setState` functional updater

**Files modified:** `app/components/CastTimeline.tsx`
**Commit:** `34488eb`
**Applied fix:** `toggleAbility` now computes the toggled `Set` from the current `hiddenAbilityIds`
state up front, calls `setHiddenAbilityIds(next)` with the concrete value, and fires
`onFilterToggle?.(...)` (the `timeline_filter_used` PostHog capture) after — outside the updater —
mirroring how `resetAbilities` already did this two lines below. This removes the impurity Strict
Mode's double-invocation of updater functions was exploiting to double-fire the event.
`hiddenAbilityIds` was added to the `useCallback` dependency array. `npx tsc --noEmit` — clean.
Full suite — 136/136 passed (no dedicated component test exists for `CastTimeline`).

### WR-03: Stale/incorrect comment in `game-data.test.ts` misdescribes production era-precedence

**Files modified:** `lib/generated/game-data.test.ts`
**Commit:** `1dfbdff`
**Applied fix:** Corrected the doc comment on the test's local `composeEras()` helper to state the
true relationship — this helper is later-era-wins, the OPPOSITE of production's
first-resolved-era-wins `composeEraPriority` in `lib/generated/index.ts` — and clarified the helper
exists only to verify Tests 7-8's internal self-consistency, not to reproduce production
precedence. Added Test 9, importing the real production `ENCHANT_NAME_DB` from
`lib/generated/index.ts` and asserting the known id 3003 collision (Classic/TBC: "Glyph of
Ferocity" vs. WotLK: "Arcanum of Ferocity") resolves to the Classic/TBC value in production,
closing the coverage gap the stale comment had papered over. `npx vitest run
lib/generated/game-data.test.ts` — 9/9 passed. `npx tsc --noEmit` — clean. Full suite — 137/137
passed (135 baseline + Test 10 from CR-01 + Test 9 from this fix).

## Skipped Issues

None — all four in-scope findings were fixed.

---

_Fixed: 2026-09-14T18:01:29Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
