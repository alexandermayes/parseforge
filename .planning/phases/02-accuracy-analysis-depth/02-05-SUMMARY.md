---
phase: 02-accuracy-analysis-depth
plan: 05
subsystem: ui
tags: [timeline, wcl, react, virtualisation, posthog, vitest]

# Dependency graph
requires:
  - phase: 02-accuracy-analysis-depth
    provides: "02-02's tracer: buildCastTimeline() shape, /api/timeline route, useTimeline hook, CastTimeline component, the TimelineRowKind/idleMs/idleThresholdMs contract fields left at their wave-1 defaults"
provides:
  - "idle and death TimelineRow kinds, merged chronologically with cast rows by buildCastTimeline()"
  - "idleThresholdMs derived from this player's own median inter-cast gap (max(2000ms, 3x median)) -- never a per-class constant"
  - "per-ability filter chips, hand-rolled fixed-row-height windowed rendering, and a truncation notice row on the Timeline tab"
  - "timeline_filter_used PostHog event"
affects: [02-07, 02-08]

# Actuals (#2632)
actuals:
  tokens: 7500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Fixed-row-height hand-rolled windowing (callback ref + ResizeObserver + scrollTop state, top/bottom spacer divs) instead of a virtualisation dependency -- CastTimeline.tsx"
    - "React's documented 'adjust state during render' pattern (conditional setState calls in the render body, guarded by a prev-value comparison) used in place of a setState-only useEffect, to satisfy this repo's newly-enforced react-hooks/set-state-in-effect rule; the one DOM-only scrollTop reset stays in a genuine useEffect since it calls no setState"

key-files:
  created: []
  modified:
    - lib/timeline-engine.ts
    - lib/timeline-engine.test.ts
    - app/api/timeline/route.ts
    - app/components/CastTimeline.tsx
    - app/analyze/[reportCode]/hooks/useTimeline.ts
    - app/components/AnalysisView.tsx

key-decisions:
  - "Idle threshold shipped as max(2000ms, round(3 x median inter-cast gap)) computed per-player per-fight from the survivor cast timestamps -- calibration signal recorded below."
  - "Death events reused a new minimal TimelineDeathEvent shape ({ timestamp, sourceID }) local to timeline-engine.ts rather than importing raid-overview-engine.ts's DeathEvent, keeping this engine's input surface self-contained and matching only the two fields it actually consumes."
  - "The truncation notice row is not part of the virtualised row array -- it always renders once, un-windowed, directly after the bottom spacer inside the same scrollable container, since D-04/UI-SPEC require it to never be hidden by a filter and there is at most one such row per result."
  - "Filter-selection and result-change resets use React's render-phase state-adjustment pattern (not useEffect) to avoid tripping the react-hooks/set-state-in-effect rule now enforced by this repo's eslint config -- see patterns-established."

requirements-completed: [ACC-03]

coverage:
  - id: D1
    description: "The engine emits idle rows only for a genuine gap between two casts, sized relative to this player's own cast rhythm (never hardcoded per class), and at most one death row per fight, both merged into a single chronological row stream"
    requirement: "ACC-03"
    verification:
      - kind: unit
        ref: "lib/timeline-engine.test.ts#buildCastTimeline — idle gaps and death marker (9 new behaviours: fixture-derived threshold math, steady-cadence zero-idle, single large-gap bracketing, death-row timing, death-row chronological insertion, duplicate-death dedup, single-cast, empty-input, castCount scoping)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "npx eslint lib/timeline-engine.ts lib/timeline-engine.test.ts app/api/timeline/route.ts 'app/analyze/[reportCode]/hooks/useTimeline.ts' app/components/CastTimeline.tsx app/components/AnalysisView.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "A raider can filter a 200-800 row cast log by ability with nothing hidden by default, scroll it without a blank flash via hand-rolled windowing, and see idle gaps and the death point at a glance -- with no new dependency and no gold accent on the multi-select chips"
    requirement: "ACC-03"
    verification:
      - kind: other
        ref: "grep checks: flex flex-wrap gap-1.5 + >All< + bg-surface-3 chip row; Pause/Skull Lucide icons (no literal glyphs); badge-bad death band; Log truncated notice copy; scrollTop-driven windowing; no tab-active-gold/progress-gradient-gold/text-primary on any non-comment line; package.json dependencies unchanged (no virtual/react-window/tanstack)"
        status: pass
      - kind: other
        ref: "npm run token-audit"
        status: pass
      - kind: other
        ref: "npm run theme-parity"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 101/101 passing, no regressions)"
        status: pass
    human_judgment: true
    rationale: "The <human-check> in Task 2's <verify> block asks for a real-browser pass (open the demo report's Timeline tab at 375px, scroll the full log, toggle chips, confirm the idle/death bands read at least as loud as a cast row). No dev server was started this session to capture that; per workflow.human_verify_mode=end-of-phase this is deferred to the phase's consolidated UAT rather than a mid-flight checkpoint."
  - id: D3
    description: "useTimeline.ts fires exactly one timeline_filter_used PostHog event per chip interaction (toggle or the All reset), carrying report_code/fight_id/ability_count/hidden_count, as the hook's third distinct posthog.capture call site"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "grep -c 'posthog.capture' app/analyze/[reportCode]/hooks/useTimeline.ts == 3, plus timeline_filter_used name grep"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 5: Cast Timeline — idle gaps, death marker, filter chips, windowing Summary

**buildCastTimeline() now emits relative-threshold idle bands and a chronologically-merged death marker (D-03), and CastTimeline.tsx adds per-ability filter chips, hand-rolled fixed-row-height windowing, and a never-hidden truncation notice (D-04) — no new dependency, no new design token.**

## Performance

- **Duration:** 55 min
- **Completed:** 2026-09-08
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `lib/timeline-engine.ts` — `buildCastTimeline()` now computes `idleThresholdMs = max(2000, round(3 x median inter-cast gap))` from the player's own surviving cast timestamps (fewer than two casts falls back to the 2000ms floor with no gap to measure), interleaves an `"idle"` row between any two consecutive cast rows whose gap exceeds that threshold (never before the first cast or after the last), and merges at most one `"death"` row — the player's earliest death event this fight — into its correct chronological position rather than appending it. `castCount` continues to count `kind: "cast"` rows only, so the new bands never inflate the truncation notice or the `timeline_viewed` PostHog event's `cast_count`.
- `lib/timeline-engine.ts` gained a local `TimelineDeathEvent` type (`{ timestamp, sourceID }`) and an optional `deathEvents` field on `TimelineEngineInput`; `app/api/timeline/route.ts` now passes the already-queried `deathEvents` (present in `TIMELINE_CASTS_QUERY` since 02-02, unused until this plan) through to the engine.
- `lib/timeline-engine.test.ts` — 9 new behaviours (17 total, up from 8): Test 1 is fixture-driven, independently re-deriving the expected threshold from the real recorded events via a duplicated (not imported) survivor-selection + median helper so the test proves the engine against an isolated computation, not against itself. Tests 2-9 use small synthetic sequences (steady cadence, one large hole, death timing/ordering/dedup, single-cast, empty-input, castCount scoping) since the real fixture's cadence can't be relied on to contain a specific gap. The tracer's pre-existing `abilityName` assertion was re-scoped to `kind === "cast"` rows, since idle/death rows are new structural markers that correctly carry no ability name.
- `app/components/CastTimeline.tsx` — per-ability filter chips (`flex flex-wrap gap-1.5`, leading `All` reset chip, `{Ability Name} ({count})` labels, neutral `bg-surface-3` selected state, never gold) built from the engine's already-sorted `abilityCounts`; all chips start selected (D-04's "nothing hidden by default"). Hand-rolled fixed-40px-row windowing — a callback ref attaches a `ResizeObserver`, a 10-row overscan buffer above/below the viewport, top/bottom spacer divs sized to the filtered row count — recomputes on scroll, on container resize, and on filter change (scroll position resets to top on a filter change, since the row count and spacer height changed underneath it). New `renderRow()` cases for `"idle"` (dashed `border-status-warn/40` divider, Lucide `Pause`, `Idle {N.N}s`) and `"death"` (`badge-bad` full-row band, Lucide `Skull`, `Died`) row kinds. The truncation notice (`Log truncated — showing first {N} casts`, `.text-caption text-status-warn`) renders once, un-windowed, after the bottom spacer inside the same scroll container — never hidden by the ability filter.
- `app/analyze/[reportCode]/hooks/useTimeline.ts` gained `captureFilterUsed(abilityCount, hiddenCount)`, firing `timeline_filter_used` with `report_code`/`fight_id`/`ability_count`/`hidden_count` — the hook's third `posthog.capture` call site (alongside 02-02's `timeline_viewed`/`timeline_error`).
- `app/components/AnalysisView.tsx` threads `timeline.captureFilterUsed` into `CastTimeline`'s new `onFilterToggle` prop — required plumbing beyond the plan's stated `files_modified` (see Deviations).
- **Calibration signal for the idle multiplier** (per the plan's `<output>` request): for the demo report's fight 23 / Samkin (the public demo player), using the real recorded fixture with no synthetic augmentation, the derived `idleThresholdMs` is **2762ms** (median inter-cast gap ≈921ms x 3), producing **9 idle rows** across **159 cast rows**. Recorded here as the baseline to retune the 3x multiplier / 2000ms floor against if a future phase revisits D-03 with more fixtures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Idle gaps and the death marker, derived from the player's own cast rhythm** - `ab9a9fe` (feat) — engine idle/death row emission, death-event plumbing through the route
2. **Task 2: Filter chips, windowed rendering, and a truncation notice a raider cannot miss** - `41579ae` (feat) — chips, hand-rolled windowing, idle/death row rendering, truncation notice, `timeline_filter_used` instrumentation

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `lib/timeline-engine.ts` - Idle-gap threshold derivation, idle/death row emission and chronological merge
- `lib/timeline-engine.test.ts` - 9 new behaviours (17 total)
- `app/api/timeline/route.ts` - Passes `deathEvents` through to `buildCastTimeline`
- `app/components/CastTimeline.tsx` - Filter chips, hand-rolled windowing, idle/death row rendering, truncation notice
- `app/analyze/[reportCode]/hooks/useTimeline.ts` - `captureFilterUsed` / `timeline_filter_used` instrumentation
- `app/components/AnalysisView.tsx` - Threads the new `onFilterToggle` prop into `CastTimeline`

## Decisions Made

See `key-decisions` in frontmatter — most notably the shipped `max(2000ms, 3x median)` idle-threshold formula and its fight-23 calibration numbers, the self-contained `TimelineDeathEvent` type, the truncation row living outside the virtualised slice, and the render-phase state-adjustment pattern used in place of a setState-only `useEffect`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Threaded the new `captureFilterUsed` callback through `app/components/AnalysisView.tsx`, a file outside the plan's stated `files_modified`**
- **Found during:** Task 2 (wiring the instrumentation callback from `useTimeline.ts` to `CastTimeline.tsx`)
- **Issue:** The plan's Task 2 action text says "In `app/analyze/[reportCode]/hooks/useTimeline.ts` add one exported callback the component calls when a chip toggles" — but `CastTimeline.tsx` never calls `useTimeline()` itself; `AnalysisView.tsx` does, and passes `useTimeline()`'s return values down as props (`result`, `loading`, `error`). Without also passing the new `captureFilterUsed` return value through as a prop, the callback the plan requires literally cannot reach the component that needs to call it.
- **Fix:** Added `onFilterToggle={timeline.captureFilterUsed}` to `AnalysisView.tsx`'s existing `<CastTimeline .../>` call — a single-line, one-file addition with no other change to that file's structure.
- **Files modified:** `app/components/AnalysisView.tsx`
- **Verification:** `grep -c 'posthog.capture' app/analyze/[reportCode]/hooks/useTimeline.ts` == 3 and `timeline_filter_used` fires with real `ability_count`/`hidden_count` values from the component's actual chip-toggle handlers, not a disconnected no-op prop.
- **Committed in:** `41579ae` (Task 2 commit)

**2. [Rule 1 - Bug] `container.scrollTop = 0` inside a `useEffect` triggered a genuine `react-hooks/set-state-in-effect` mutation error (mutating a value sourced from `useState`), and two setState-only effects tripped the same rule directly**
- **Found during:** Task 2 acceptance-criteria HARD GATE re-run (`npx eslint` on the touched files)
- **Issue:** The first implementation stored the scroll container DOM node in `useState` (via a callback ref calling `setContainer`) so a `ResizeObserver` effect could depend on it, then a second effect wrote `container.scrollTop = 0` directly — ESLint's `react-hooks/set-state-in-effect` rule (bundled with this repo's `eslint-config-next`/`eslint-plugin-react-hooks` version, part of the React Compiler lint rule set) flagged this as mutating a `useState`-sourced value, and separately flagged two effects whose entire body was a synchronous `setState` call (`setHiddenAbilityIds(new Set())` on `result` change; `setScrollTop(0)` on filter change) as exactly the "should be computed during render, not synchronized in an effect" anti-pattern the rule exists to catch.
- **Fix:** Moved the DOM node into a plain `useRef` (never `useState`) so `containerElRef.current.scrollTop = 0` is ordinary ref-based DOM access, not a state mutation. Replaced both setState-only effects with React's documented "adjusting state when a prop changes" pattern — a `prevX !== x` comparison directly in the render body that conditionally calls the setter, which bails out and re-renders before paint rather than after a committed effect. The one remaining `useEffect` (the DOM `scrollTop` reset) calls no setState at all, so it is a legitimate effect under the rule.
- **Files modified:** `app/components/CastTimeline.tsx`
- **Verification:** `npx eslint app/components/CastTimeline.tsx` (and the plan's full scoped file list) exits 0 with only the pre-existing `<img>`/LCP warning (identical to 02-02's tracer, not a new finding); `npx tsc --noEmit`, `npm run token-audit`, `npm run theme-parity` and `npm test` (101/101) all still pass after the change.
- **Committed in:** `41579ae` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 — required plumbing the plan's own instrumentation requirement implies but doesn't name the file for, 1 Rule 1 — a real lint error, not a style nit). No scope creep beyond what each fix strictly required.
**Impact on plan:** Both fixes were necessary for the plan's own acceptance criteria (`npx eslint`/`npm run lint` exit 0, `timeline_filter_used` actually reachable from a real chip click) to hold.

## Issues Encountered

`npm run lint` run unscoped over the whole working tree reports ~1100 pre-existing errors from untracked GSD tooling directories (`.codex/`, `.agents/`, etc. — present in `git status` as `??` since before this session started, not part of the ParseForge app CLAUDE.md's lint policy governs). None of these are in this plan's touched files or in the two allowlisted debt files (`components/ui/meteors.tsx`, `lib/analysis-engine.ts`). Verified this plan's own files are clean via a scoped `npx eslint <exact file list>` run (exit 0, only the pre-existing `<img>` LCP warning) rather than relying on the unscoped `npm run lint` exit code, matching 02-02's precedent for the same environmental noise.

## Known Stubs

None — every rendered value in the new chip/idle/death/truncation UI is wired to the real `/api/timeline` response; no placeholder/mock data paths exist.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The Timeline tab now fully implements D-03 and D-04 on the architecture 02-02's tracer established, closing ACC-03. The `idleThresholdMs = max(2000, 3x median)` formula and its fight-23 calibration numbers (2762ms threshold, 9 idle rows across 159 casts) are recorded above for any future phase that wants to retune the multiplier against more fixtures. `app/analyze/[reportCode]/hooks/useTimeline.ts` still holds exactly three `posthog.capture` call sites, satisfying the OPS-01 ship gate's grep step. No blockers for the next plan in Phase 2.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 6 modified files verified present on disk (`[ -f ]`); both task commits (`ab9a9fe`, `41579ae`) verified present in `git log --oneline --all`. `npx vitest run lib/timeline-engine.test.ts` re-confirmed 17/17 passing (8 original + 9 new); `npm test` (full suite) 11 files / 101 tests passing, no regressions; `npx tsc --noEmit` clean; `npm run token-audit` exit 0 (57 findings, all pre-existing allowlisted, none naming CastTimeline.tsx or timeline-engine.ts); `npm run theme-parity` PASS; scoped `npx eslint` over every plan-touched file exits 0 with only the pre-existing `<img>` LCP warning; `node -e` dependency check confirms no virtualisation-shaped package was added; all Task 1 and Task 2 grep-based acceptance criteria re-verified passing.
