---
phase: 03-share-loop
plan: 02
subsystem: api
tags: [awards-engine, vitest]

requires:
  - phase: 03-share-loop plan 01
    provides: "lib/awards-engine.ts pure computeAwards(overview, fight) over RaidOverviewResult, 5-rule seed pool at priorities 1-5"
provides:
  - "AWARD_POOL filled to the full 15-rule pool D-02 specifies (priorities 1-15), each rule reading only RaidOverviewResult fields"
  - "Pool-wide invariant tests (uniqueness, contiguous priorities, non-empty title/icon, allowed tone, no-unconditional-firing, stat/winner shape, cap, stable sort, non-mutation) that any future 16th rule must also satisfy"
  - "The exact 15-row award pool recorded below for the developer's D-04 tone review at the 03-06 preview gate"
affects: [03-04, 03-06]

actuals:
  tokens: 8867
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Pool-wide invariant tests over AWARD_POOL (not per-rule assertions) — the contract (unique id, contiguous 1..N priority, non-empty title/icon, tone in {praise,jab}, no unconditional firing) is enforced once, by iteration, so a future 16th rule is safe to add without re-deriving these checks"

key-files:
  created: []
  modified:
    - lib/awards-engine.ts
    - lib/awards-engine.test.ts

key-decisions:
  - "graveyard-shift/naked-slots/skipped-breakfast/dull-blade name every qualifying player (not just one), matching the flaskless pattern from 03-01, since D-01's tone bar forbids singling out one worst player when several people share the same measurable fact."
  - "fire-dancer and punching-up both threshold against a median (not a mean) computed with a small shared median() helper, so one outlier reporting player cannot single-handedly swing the trigger for the whole raid."
  - "iron-man requires overview.deathTimeline to be non-empty (a raid-wide 'someone died' fact), not that the specific zero-death winner personally avoided every hit — this matches the D-02 spec text exactly and keeps the rule's trigger independent of which player it ultimately praises."
  - "The pre-existing 03-01 'ordering and cap' test fixture was adjusted (all players given deaths:1 instead of 0, BestPrepared's avgItemLevel left at the shared default of 60) so the newly-added iron-man and punching-up rules cannot fire and bleed into a test that is scoped to the original 5-rule tracer's own priority ordering — documented inline in the test file."

patterns-established:
  - "AWARD_POOL pool-wide invariant suite: iterate the array once per invariant (uniqueness, priority range, non-empty fields, allowed tone, no-unconditional-firing via an explicit allowlist, per-row stat/winner shape across a fixture set, cap, stable sort, non-mutation) rather than asserting per-rule — the pattern any future rule addition should extend, not re-derive."

requirements-completed: [SHARE-01]

coverage:
  - id: D1
    description: "AWARD_POOL holds the full 15 award rules at priorities 1-15 (5 tracer rules unchanged at 1-5, 10 new rules at 6-15), each firing only when its own trigger condition holds against RaidOverviewResult, reading no data outside that type (D-02/D-03)"
    requirement: SHARE-01
    verification:
      - kind: unit
        ref: "lib/awards-engine.test.ts — AWARD_POOL shape + one fires/does-not-fire describe block per new rule + full fifteen-rule-pool fixture (37 tests added by Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pool-wide contract is enforced by tests, not convention: unique ids, contiguous 1-15 priorities, non-empty title/icon, tone restricted to praise|jab, no rule fires unconditionally on a minimal all-zero fight, every fired row has a non-empty stat and 1..MAX_WINNER_NAMES winners across a representative fixture set, the card never exceeds MAX_AWARDS_SHOWN, sorting is stable, and computeAwards never mutates its input"
    requirement: SHARE-01
    verification:
      - kind: unit
        ref: "lib/awards-engine.test.ts — 'AWARD_POOL — pool-wide invariants' describe block (8 tests added by Task 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The exact fifteen-row pool (id, title, icon, tone, trigger, stat) is recorded verbatim below for the developer's D-04 tone review — confirming every jab is about a measurable fact, nothing is insulting about a named real raider, and no rule designates a single worst player"
    requirement: SHARE-01
    verification: []
    human_judgment: true
    rationale: "D-01/D-04's tone bar ('fun to be on, not embarrassing') is an editorial judgment call the plan itself defers to the developer at the 03-06 preview gate before any production deploy — it is explicitly not this task's own gate. This SUMMARY records the shipped pool so that review has a fixed, complete artifact to check against."

duration: 12min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 2: Fill the Award Pool to Fifteen Rules Summary

**`AWARD_POOL` grows from the 5-rule tracer to the full 15-rule D-02 pool (10 new conditionally-triggered rules at priorities 6-15) with a pool-wide invariant test suite that makes the contract — unique ids, contiguous priorities, no unconditional firing, stat-backed rows, a fixed display cap — enforceable by tests rather than convention.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-16T05:39:42Z
- **Completed:** 2026-09-16T05:51:34Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Ten new rules appended to `AWARD_POOL` at priorities 6-15 (graveyard-shift, gcd-tourist, fire-dancer, naked-slots, skipped-breakfast, dull-blade, iron-man, watering-the-garden, kept-them-breathing, punching-up), each reading only `RaidOverviewResult` fields — no new fetch, no `/api/analyze` fan-out (D-03)
- A shared `median()` helper backs fire-dancer's and punching-up's threshold checks
- One fires-case and one does-not-fire-case test per new rule, plus a fifteen-rule fixture proving every rule in the pool fires simultaneously and the card still caps at the six lowest priorities
- A pool-wide invariants describe block: id uniqueness, contiguous 1-15 priorities, non-empty title/icon, tone restricted to `praise|jab`, a no-unconditional-firing loop test against a minimal all-zero fixture (with an explicit two-id allowlist), per-row stat/winner shape across a representative fixture set, the `MAX_AWARDS_SHOWN` cap, stable sort, and non-mutation of the input

## Task Commits

Each task was committed atomically:

1. **Task 1: Fill the award pool to fifteen rules** - `cf0092e` (feat)
2. **Task 2: Lock the pool-wide invariants and clear the tone review** - `05b11c7` (test)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `lib/awards-engine.ts` - `AWARD_POOL` filled to 15 entries; added a `median()` helper
- `lib/awards-engine.test.ts` - Per-rule fires/does-not-fire tests for all 10 new rules, a full fifteen-rule fixture test, an adjusted pre-existing ordering/cap fixture, and a pool-wide invariants describe block

## Decisions Made
- graveyard-shift, naked-slots, skipped-breakfast and dull-blade each name every qualifying player (not a single worst one), matching the 03-01 flaskless pattern — required by D-01's "no single worst-player headline" rule whenever several raiders share the same measurable fact.
- fire-dancer and punching-up threshold against a median, not a mean, via a small shared `median()` helper, so a single outlier can't swing either trigger for the whole raid.
- iron-man's trigger is "the raid had at least one death anywhere" (non-empty `deathTimeline`) rather than anything about the specific zero-death winner — this matches the D-02 spec text and keeps the trigger condition independent from which zero-death player ends up praised.
- The pre-existing 03-01 "ordering and cap" test fixture needed a small adjustment (all three players given `deaths: 1` instead of the implicit `0`, and `BestPrepared` left at the shared default `avgItemLevel: 60` instead of `90`) so the new iron-man and punching-up rules — which now legitimately fire on any fixture with a zero-death player or an ilvl spread — cannot bleed into a test that is specifically scoped to the original 5-rule tracer's own priority ordering. Documented inline in the test file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing "ordering and cap" test fixture would have failed after the pool grew**
- **Found during:** Task 1 (writing the full fifteen-rule fixture surfaced that the existing test's fixture also satisfies iron-man's and punching-up's new triggers)
- **Issue:** The 03-01 "sorts fired awards ascending by priority and never exceeds MAX_AWARDS_SHOWN" test used three all-zero-death players and a `BestPrepared` with `avgItemLevel: 90` vs. two peers at the default `60` — both conditions now also satisfy iron-man (a zero-death player exists) and punching-up (a >=10 ilvl spread with the low-ilvl player's throughput at/above median), which would silently add unexpected ids to that test's exact-equality assertion.
- **Fix:** Set `deaths: 1` on all three synthetic players (disabling iron-man, and incidentally graveyard-shift, without affecting the flaskless/best-prepared/top-dps assertions this test exists to check) and removed the `avgItemLevel: 90` override on `BestPrepared` (best-prepared's own candidate set already has only one member on this fixture, so this doesn't change what that rule picks) so punching-up's ilvl-spread trigger cannot fire either.
- **Files modified:** lib/awards-engine.test.ts
- **Verification:** `npx vitest run lib/awards-engine.test.ts` — the test still asserts the original 5-id order and passes.
- **Committed in:** cf0092e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in a pre-existing test fixture, surfaced by pool growth)
**Impact on plan:** Necessary to keep the pre-existing test's own assertion true and specific to what it tests; no scope creep — the fix only edits test data, not the rules under test.

## Issues Encountered

The task's own automated verify gate `P=$(grep -c "priority:" lib/awards-engine.ts); [ "$P" -eq 15 ]` returns `17`, not `15`, and therefore fails as literally written. This is a structural property of the file, not a defect in the pool: the literal substring `"priority:"` also matches the `AwardRule` interface's own field declaration (`priority: number;`, line 44) and `computeAwards`'s output-mapping line (`priority: rule.priority,`, now line 382) — both of which existed unchanged since 03-01 and are unrelated to how many rules are in the pool. With 5 rules the same script would have returned 7, not 5; with 15 rules it returns 17, not 15 — a fixed +2 offset baked into the script regardless of pool size. The actual invariant this gate exists to prove — `AWARD_POOL` has exactly 15 entries at exactly the contiguous priorities 1-15 — is asserted far more precisely by `AWARD_POOL shape` (`expect(AWARD_POOL.map(r => r.priority)).toEqual([1,2,...,15])`) and by the new pool-wide "contiguous priority range" invariant test, both of which pass. Recorded as a known limitation of this one grep-based gate rather than silently reported as passing, and not worked around by renaming or reformatting the interface/mapping code to dodge the substring match.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`AWARD_POOL` is complete at 15 rules and its contract is test-enforced; 03-04 (awards panel in `RaidOverview.tsx`) and 03-06 (preview gate) can build on it directly. No blockers.

**The full fifteen-row pool, recorded verbatim for the developer's D-04 tone review at the 03-06 preview gate:**

| priority | id | title | icon | tone | fires when | stat shown |
|---|---|---|---|---|---|---|
| 1 | first-to-die | First to Die | 💀 | jab | someone died this fight | "{time} in" |
| 2 | top-dps | Meter Lord | ⚔️ | praise | highest-throughput non-healer | "{n} dps" |
| 3 | top-hps | Triage Master | ✨ | praise | highest-hps healer | "{n} hps" |
| 4 | flaskless | Flaskless Wonder | 🧪 | jab | any player without a flask | "no flask" |
| 5 | best-prepared | Best Prepared | 🛡️ | praise | fully flasked/fed/enchanted/weapon-enhanced, highest ilvl among them | "flask + food + weapon + full enchants" |
| 6 | graveyard-shift | Graveyard Shift | ⚰️ | jab | someone died 2+ times (names everyone tied at the max) | "{n} deaths" |
| 7 | gcd-tourist | GCD Tourist | 🕰️ | jab | lowest-activity non-healer with throughput is below 80% active | "{pct} active" |
| 8 | fire-dancer | Standing in the Fire | 🔥 | jab | max avoidable damage taken is >=1.5x the raid's median | "{n} taken" |
| 9 | naked-slots | Enchants? Never Heard of Her | 🔧 | jab | someone is missing 3+ enchants (names everyone, ranked by count) | "{n} missing enchants" |
| 10 | skipped-breakfast | Skipped Breakfast | 🍖 | jab | someone has no food buff (names everyone) | "no food buff" |
| 11 | dull-blade | Dull Blade | 🗡️ | jab | a melee/tank has no weapon enhancement (casters never qualify) | "no weapon enhancement" |
| 12 | iron-man | Iron Man | 🪨 | praise | the raid had a death but this player had zero, highest damage-taken among survivors | "0 deaths · {n} taken" |
| 13 | watering-the-garden | Watering the Garden | 💧 | jab | a healer overhealed 50%+ | "{pct}% overheal" |
| 14 | kept-them-breathing | Kept Them Breathing | 💚 | praise | a healer was 85%+ active | "{pct}% healing uptime" |
| 15 | punching-up | Punching Up | 🎯 | praise | the lowest-ilvl non-healer (in a 10+ ilvl spread) kept pace at/above the raid's median throughput | "ilvl {n} · {n} dps" |

## Self-Check: PASSED

- `lib/awards-engine.ts` confirmed on disk with all 15 `AWARD_POOL` entries (`grep -c` sanity re-checked manually against source, not the flawed literal gate — see Issues Encountered).
- `lib/awards-engine.test.ts` confirmed on disk with the new describe blocks.
- Both task commit hashes (`cf0092e`, `05b11c7`) confirmed in `git log --oneline --all`.
- `npx vitest run lib/awards-engine.test.ts` → 45 tests passed (Task 1 required >=28, Task 2 required >=34).
- `npx vitest run` (full suite) → 18 files, 226 tests passed, no regressions.
- `npx tsc --noEmit` clean.
- `npx eslint lib/awards-engine.ts lib/awards-engine.test.ts` → no findings (`gates-ok`).
- Re-ran all task-level `<acceptance_criteria>` and the plan-level `<verification>`: all pass except the literal `grep -c "priority:"` pool-size gate (see Issues Encountered for why it structurally over-counts by 2, and the two unit tests that assert the same invariant precisely).

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*
