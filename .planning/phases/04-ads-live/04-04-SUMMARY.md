---
phase: 04-ads-live
plan: 04
subsystem: testing
tags: [wcl-api, rankings, redis, typescript, vitest]

# Dependency graph
requires:
  - phase: 04-ads-live (04-02)
    provides: Six committed lib/__fixtures__/rankings-*.json fixtures, especially rankings-report.json and rankings-ratelimit.json
provides:
  - "New per-report rankings-blob types in lib/wcl-types.ts (ReportRankingsBlob, ReportRankingEntry, RankingsCharacterEntry, RankingsRoleGroup, RankingsRoles, RankingsSpeedExecution, RankingsCharacterServer), distinct from the existing WCLRanking/WCLRankingsData boss-leaderboard shape"
  - "lib/rankings/parse-lens.ts — a pure, non-throwing lens (toParseRows, toFightBadges, visibleParseRows) turning a recorded rankings blob into per-player rows and per-fight badges"
  - "lib/rankings/budget.ts — a Redis-backed WCL rate-budget gate (parseRateLimitData, recordRateLimit, readBudgetState, hasBudget) that refuses at 90% of a runtime-read hourly limit"
affects: [rankings-lens-phases, R1-tracer-your-parse-explained]

# Actuals (#2632)
actuals:
  tokens: 7433
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-lens-over-untrusted-third-party-blob pattern (lib/rankings/parse-lens.ts), matching lib/analysis-engine.ts's typed/pure/non-throwing discipline"
    - "Runtime-validate-then-fail-closed budget gate reusing lib/kv-cache.ts's Redis-with-Map-fallback helpers rather than a new transport (lib/rankings/budget.ts)"

key-files:
  created:
    - lib/rankings/parse-lens.ts
    - lib/rankings/parse-lens.test.ts
    - lib/rankings/budget.ts
    - lib/rankings/budget.test.ts
  modified:
    - lib/wcl-types.ts

key-decisions:
  - "New rankings-blob types added as a wholly separate section in lib/wcl-types.ts rather than extending WCLRanking/WCLRankingsData — the two describe different WCL queries (characterRankings boss-leaderboard vs. report.rankings(fightIDs:)) and share no fields (04-RESEARCH.md Pitfall 1, verified against lib/__fixtures__/rankings-report.json)."
  - "rankPercent typed as `number | null` (not just `number`) even though every character row in the one recorded fixture carries a number — the behavior spec requires nulls be preserved, never coerced to 0, so the type and the `?? null` read path both anticipate a value the current recording happens not to exercise."
  - "hidden marked optional on RankingsCharacterEntry per 04-02's explicit finding that no character row in the 2026-09-20 recording carried the key at all — the lens honours it when present rather than assuming it always/never appears."
  - "toFightBadges reads only the blob's first entry (`data[0]`) — the query this blob comes from (`rankings(fightIDs:)`) is scoped to a single fight per 04-02's fixture and the task's own framing (\"turns one recorded entry into ... one per-fight badge object\"); toParseRows still flattens across every entry in `data` for robustness even though the recorded fixture has exactly one."
  - "budget.ts's TTL for a persisted state is derived from the payload's own `pointsResetIn` (seconds until the hourly window resets), not a fixed duration — an elapsed window is detected two ways (Redis TTL expiry, and an explicit `recordedAt`-vs-`pointsResetIn` check in readBudgetState) so a stale state can never masquerade as current even if Redis is unavailable and the in-memory Map fallback is used."

patterns-established:
  - "Pattern 1: cite the exact fixture file and recording date in a type's module-header comment when the type came from an API response rather than a document — makes a later re-verification (or drift) traceable without re-reading the spec."

requirements-completed: [R0-3]

coverage:
  - id: D1
    description: "lib/wcl-types.ts declares new rankings-blob types verified against lib/__fixtures__/rankings-report.json, distinct from WCLRanking/WCLRankingsData; lib/rankings/parse-lens.ts turns a recorded blob into per-player parse rows and per-fight badges as a pure, non-throwing function honouring hidden/blacklisted characters and inventing nothing"
    requirement: "R0-3"
    verification:
      - kind: unit
        ref: "lib/rankings/parse-lens.test.ts (13 tests, all pass)"
        status: pass
      - kind: other
        ref: "Task 1 acceptance-criteria gate script (WCLRanking-reference count, app/ import count, existing-export preservation, fixture citation) — all GATE checks passed, ended parse-lens-wiring-ok"
        status: pass
    human_judgment: false
  - id: D2
    description: "lib/rankings/budget.ts runtime-validates the three WCL rate-limit numbers, persists them through lib/kv-cache.ts's existing Redis-with-Map-fallback helpers, and refuses inclusively at 90% of a runtime-read (never hard-coded) hourly limit, failing closed on unknown/elapsed state"
    requirement: "R0-3"
    verification:
      - kind: unit
        ref: "lib/rankings/budget.test.ts (17 tests, all pass)"
        status: pass
      - kind: other
        ref: "Task 2 acceptance-criteria gate script (no own fetch(), exactly one kv-cache import, exactly one 0.9 literal, zero hard-coded hourly-limit literals, zero app/ imports) — all GATE checks passed, ended budget-wiring-ok"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nothing in this plan is imported by any route, page, component or API handler; npm run protected-elements and npm run seo-invariants stay unchanged because no user-facing surface moved (D-13)"
    requirement: "R0-3"
    verification:
      - kind: other
        ref: "grep -rl lib/rankings app --include='*.ts' --include='*.tsx' -> 0 files (checked after both tasks); npm run protected-elements -> 10/10 PASS; npm run seo-invariants -- --report -> suite-ok (all diffs non-failing/pre-existing)"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-09-20
status: complete
---

# Phase 4 Plan 04: Rankings Blob Types + Pure Parse Lens + WCL Rate-Budget Gate Summary

R0-3 ships as tested, unwired engine code: `lib/wcl-types.ts` gets a per-report rankings-blob type family verified field-by-field against 04-02's recorded fixture (never against the spec document), `lib/rankings/parse-lens.ts` turns that blob into per-player parse rows and per-fight badges without inventing a single field, and `lib/rankings/budget.ts` gates future rankings queries on a runtime-read 90%-of-hourly-limit Redis budget — all three imported by nothing yet (D-13).

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-20T17:55Z (approximate)
- **Completed:** 2026-09-20T18:02Z
- **Tasks:** 2 completed (4 commits: RED/GREEN per task)
- **Files modified:** 5 (4 new files, 1 modified)

## Accomplishments
- Added a new, clearly separated rankings-blob type family to `lib/wcl-types.ts` (`ReportRankingsBlob`, `ReportRankingEntry`, `RankingsRoles`, `RankingsRoleGroup`, `RankingsCharacterEntry`, `RankingsCharacterServer`, `RankingsSpeedExecution`) — every field name checked against the real recorded `lib/__fixtures__/rankings-report.json`, not the spec document, per 04-RESEARCH.md Pitfall 1. `WCLRanking`/`WCLRankingsData` (the boss-leaderboard shape) are untouched.
- Shipped `lib/rankings/parse-lens.ts` (`toParseRows`, `toFightBadges`, `visibleParseRows`) — a pure, non-throwing engine in `lib/analysis-engine.ts`'s style that flattens the roles container into rows, preserves `null` `rankPercent` values (never coerces to 0), honours `hidden` and per-entry-blacklisted characters with an include-but-mark rule, and never invents a bracket percentile.
- Shipped `lib/rankings/budget.ts` (`parseRateLimitData`, `recordRateLimit`, `readBudgetState`, `hasBudget`) — validates the three WCL rate-limit numbers at runtime before trusting them, persists state through `lib/kv-cache.ts`'s existing `cacheGet`/`cacheSet` (no new Redis transport), and refuses inclusively at `BUDGET_GATE_FRACTION` (0.9) of a runtime-read hourly limit, failing closed to `reason: "unknown"` on missing or elapsed-window state.
- Both TDD cycles followed RED → GREEN exactly: `parse-lens.test.ts` (13 tests) and `budget.test.ts` (17 tests) were committed failing against the absent module before any implementation code existed.
- Full project regression stayed green throughout: `npm test` 267/267, `npx tsc --noEmit` clean, `npm run lint` no new findings, `npm run protected-elements` 10/10, `npm run seo-invariants -- --report` ended `suite-ok` with only pre-existing/non-failing diffs.

## Task Commits

Each task followed its `tdd="true"` RED/GREEN split:

1. **Task 1 RED: failing parse-lens tests** - `8168c45` (test)
2. **Task 1 GREEN: rankings-blob types + parse-lens engine** - `3239b43` (feat)
3. **Task 2 RED: failing budget-gate tests** - `9323d6d` (test)
4. **Task 2 GREEN: WCL rate-budget gate** - `1439f37` (feat)

**Plan metadata:** committed alongside this summary.

_Note: Task 1 is `type="tracer"` — its full `<verify>` (vitest + tsc + eslint + the acceptance-criteria gate script) was re-run end-to-end immediately after its GREEN commit, per the tracer feedback gate, before Task 2 began. It passed cleanly, so expansion proceeded without a checkpoint._

## Files Created/Modified
- `lib/wcl-types.ts` - new "Report Rankings Blob Types (R0-3)" section: `RankingsCharacterServer`, `RankingsCharacterEntry`, `RankingsRoleGroup`, `RankingsRoles`, `RankingsSpeedExecution`, `ReportRankingEntry`, `ReportRankingsBlob` — all pre-existing exports (including `WCLRanking`/`WCLRankingsData`) unchanged
- `lib/rankings/parse-lens.ts` - pure lens: `toParseRows`, `toFightBadges`, `visibleParseRows`, plus the `ParseRow`/`FightBadges`/`ParseRole` types
- `lib/rankings/parse-lens.test.ts` - 13 tests against the real `rankings-report.json` fixture (with structured-clone mutations for the `hidden`/blacklist edge cases the recording doesn't exercise)
- `lib/rankings/budget.ts` - `parseRateLimitData`, `recordRateLimit`, `readBudgetState`, `hasBudget`, `WclRateLimitData`, `WclBudgetState`, `BUDGET_KEY`, `BUDGET_GATE_FRACTION`
- `lib/rankings/budget.test.ts` - 17 tests against the real `rankings-ratelimit.json` fixture samples, with `lib/kv-cache.ts`'s `cacheGet`/`cacheSet` stubbed via `vi.mock`

## Decisions Made
See `key-decisions` in frontmatter — most notably: the new types are a wholly separate family from `WCLRanking`/`WCLRankingsData` (no extension, per Pitfall 1); `rankPercent` is typed and handled as `number | null` even though the one recorded fixture never shows a null; `hidden` stays optional per 04-02's explicit "absent in this recording" finding; the budget gate's TTL is derived from the payload's own `pointsResetIn`, never a fixed duration.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' RED/GREEN cycles, acceptance criteria, and verify blocks passed without needing any Rule 1-3 auto-fixes, and no architectural question arose that would trigger Rule 4.

## Issues Encountered

`gsd-tools requirements mark-complete R0-3` reported `not_found` — `.planning/REQUIREMENTS.md`'s traceability table does not carry the R0-x requirement family at all (confirmed via grep: zero R0-1/R0-2/R0-3 matches in the file). This is a pre-existing gap predating this plan (04-02's own `requirements-completed: [R0-2]` hit the same untracked family) and out of this plan's `files_modified` scope to fix — noted here rather than silently worked around.

## User Setup Required

None - no external service configuration required. The one runtime dependency (Upstash Redis via `lib/kv-cache.ts`) already exists from prior phases; `lib/rankings/budget.ts` only reuses it, it does not provision anything new. Local `npm test` needs no live credentials — `budget.test.ts` stubs the cache helpers entirely.

## Next Phase Readiness

R1 ("your parse, explained") can be written directly against `toParseRows`/`visibleParseRows`/`toFightBadges` and `hasBudget()` without re-deriving a single WCL field name — every field on `ParseRow`/`FightBadges` traces to a name verified in `lib/__fixtures__/rankings-report.json`, and the budget gate is ready to protect any future live rankings query the moment R1 is approved and wired in. No blockers. Zero user-facing surface moved this plan (`npm run protected-elements` and `npm run seo-invariants` both confirmed unchanged), consistent with D-13's "R0-3 ships unwired" requirement.

## Self-Check: PASSED

- `[ -f lib/wcl-types.ts ]` → FOUND (modified, pre-existing exports intact)
- `[ -f lib/rankings/parse-lens.ts ]` → FOUND
- `[ -f lib/rankings/parse-lens.test.ts ]` → FOUND
- `[ -f lib/rankings/budget.ts ]` → FOUND
- `[ -f lib/rankings/budget.test.ts ]` → FOUND
- `git log --oneline --all | grep 8168c45` → FOUND
- `git log --oneline --all | grep 3239b43` → FOUND
- `git log --oneline --all | grep 9323d6d` → FOUND
- `git log --oneline --all | grep 1439f37` → FOUND
- `npm test` → 267/267 passed
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors, 1 pre-existing warning (unrelated file: `app/components/CastTimeline.tsx`)
- `npm run protected-elements` → 10/10 passed
- `npm run seo-invariants -- --report` (against local dev server) → `suite-ok`, all diffs non-failing/pre-existing
- `grep -rl "lib/rankings" app --include='*.ts' --include='*.tsx'` → 0 files (confirmed unwired, D-13)

---
*Phase: 04-ads-live*
*Completed: 2026-09-20*
