---
phase: 02-accuracy-analysis-depth
plan: 01
subsystem: api
tags: [wcl, graphql, vitest, fixtures, healer-metrics, cast-timeline]

# Dependency graph
requires: []
provides:
  - Six recorded WCL GraphQL fixtures under lib/__fixtures__/ from the public demo report, with a provenance README resolving RESEARCH.md assumptions A1-A5 against the real API
  - scripts/record-wcl-fixtures.mjs, wired to npm run record-fixtures, for re-recording when the demo report or the queries change
  - TIMELINE_CASTS_QUERY / TIMELINE_CASTS_PAGE_QUERY in lib/wcl-queries.ts using the real events(dataType:Casts) argument and field names
  - healingByPlayer aliased field on both healing queries, giving player-level overheal + activeTime with no second round trip
  - Cast Timeline and Healer Metrics type contracts in lib/wcl-types.ts (WCLCastEvent, TimelineRow, CastTimelineResult, HealerTableRow, HealerMetricsComputed, HealerComparison) plus AnalysisResult.healer and TopPlayerFullData.healerRow
  - Explicit RATE_LIMITS.timeline bucket in lib/constants.ts
  - Shared formatFightTime export in lib/utils.ts
  - Newly exported JUNK_SPELL_IDS / isJunkSpell in lib/analysis-engine.ts
affects: [02-02, 02-04, 02-05, 02-07, 02-08]

# Actuals (#2632)
actuals:
  tokens: 365118
  tasks: 2
  commits: 2
  # Note: this diff is dominated by ~1.4MB of recorded WCL fixture JSON
  # (unavoidable — real API response data, not authored code). Code-only
  # files (queries/types/constants/utils/analysis-engine/recorder script)
  # total ~38.7K chars (~9.7K tokens on this scale), much closer to the
  # plan's 65000 estimate.

tech-stack:
  added: []
  patterns:
    - "Standalone .mjs recorder scripts (no lib/ TS imports) mint their own OAuth token and duplicate URL constants, following scripts/token-audit.mjs's shebang/header/argv/exit-code family"
    - "Un-scoped table(dataType: X, fightIDs: $fightIDs) aliased alongside a sourceID-scoped table() to fetch player-level fields the scoped table lacks, with no second round trip"
    - "Fixture JSON imported directly into vitest tests (resolveJsonModule) as a shape guard over real recorded API responses, not hand-built mocks"

key-files:
  created:
    - scripts/record-wcl-fixtures.mjs
    - lib/__fixtures__/README.md
    - lib/__fixtures__/demo-player-dps.json
    - lib/__fixtures__/demo-player-healer.json
    - lib/__fixtures__/demo-raid-overview.json
    - lib/__fixtures__/demo-raid-combatant-info.json
    - lib/__fixtures__/demo-raid-death-events.json
    - lib/__fixtures__/demo-timeline-casts.json
    - lib/__fixtures__/fixtures.test.ts
  modified:
    - lib/wcl-queries.ts
    - lib/wcl-types.ts
    - lib/constants.ts
    - lib/utils.ts
    - lib/analysis-engine.ts
    - package.json

key-decisions:
  - "RESEARCH.md Assumption A3 was wrong, corrected from real data: the sourceID-scoped per-ability Healing table DOES carry per-ability overheal (sum matches the un-scoped row exactly, 127,626 = 127,626). What it lacks is activeTime, which only appears on the un-scoped healingByPlayer row — so the un-scoped query is still required for player-level healer metrics, but for a different reason than RESEARCH.md guessed."
  - "healingByPlayer is a second aliased table() field on both existing healing queries (sourceID omitted) rather than a new query or route, so player-level overheal/activeTime cost zero extra round trips."
  - "TIMELINE_CASTS_QUERY and TIMELINE_CASTS_PAGE_QUERY are split so only the first page re-fetches the casts table, death-event probe, actor list and fight bounds — later pages of a long fight fetch only castEvents."
  - "RATE_LIMITS.timeline set to 20 (tighter than analyze's 30) because one timeline request can page cast-events up to 20 times."

patterns-established:
  - "A one-off .mjs recorder for capturing real third-party API responses as committed test fixtures, restricted by design to a report already confirmed publicly viewable."

requirements-completed: [ACC-02, ACC-03, ACC-04]

coverage:
  - id: D1
    description: "Six real WCL GraphQL fixtures recorded from the public demo report (ZjKgNYxVcAqR8pGJ, fight 23), with a provenance README resolving RESEARCH.md assumptions A1-A5 against the actual API"
    requirement: "ACC-02"
    verification:
      - kind: unit
        ref: "lib/__fixtures__/fixtures.test.ts#WCL fixtures shape guard"
        status: pass
      - kind: other
        ref: "grep -rq 'client_secret|access_token|authorization' lib/__fixtures__/ (must find nothing)"
        status: pass
    human_judgment: true
    rationale: "Confirming the source report is genuinely publicly viewable (not private) is inherently a human judgment call, not something a script can assert about a third party's visibility settings. This was already obtained via the tracer feedback checkpoint before these fixtures were committed (user replied \"approved\" after opening https://www.warcraftlogs.com/reports/ZjKgNYxVcAqR8pGJ in a logged-out browser) — recorded here as true so the audit trail stays intact rather than claiming an automated proof that doesn't exist."
  - id: D2
    description: "Query, type and rate-limit contracts (TIMELINE_CASTS_QUERY/_PAGE_QUERY, healingByPlayer, 8 new wcl-types.ts exports, RATE_LIMITS.timeline, shared formatFightTime and JUNK_SPELL_IDS/isJunkSpell) that plans 02-02, 02-04, 02-05 and 02-07 build against"
    requirement: "ACC-03"
    verification:
      - kind: unit
        ref: "lib/__fixtures__/fixtures.test.ts#WCL fixtures shape guard"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "npx eslint lib/wcl-queries.ts lib/wcl-types.ts lib/constants.ts lib/utils.ts lib/analysis-engine.ts lib/__fixtures__/fixtures.test.ts scripts/record-wcl-fixtures.mjs"
        status: pass
    human_judgment: false

duration: unknown (continuation from checkpoint — see Performance note)
completed: 2026-09-07
status: complete
---

# Phase 2 Plan 1: Record real WCL fixtures and derive the query/type contracts Summary

**Recorded six real WCL GraphQL responses from the public demo report, corrected a wrong RESEARCH.md assumption about healer overheal data from the recording, and turned the confirmed shapes into the timeline queries, healer/timeline type contracts, and the explicit timeline rate-limit bucket every later Phase 2 plan builds against.**

## Performance

- **Duration:** Not tracked as a single span — this plan spanned a tracer feedback checkpoint. Task 1 (recording) was executed and verified by a prior executor agent; this continuation agent verified Task 1's on-disk state, committed it, then executed and committed Task 2 in this session.
- **Completed:** 2026-09-07
- **Tasks:** 2
- **Files modified:** 15 (9 created, 6 modified)

## Accomplishments

- `scripts/record-wcl-fixtures.mjs` (in the `scripts/token-audit.mjs` family) records real WCL GraphQL responses for the public demo report `ZjKgNYxVcAqR8pGJ`, fight 23 — resolving the healer source id at run time by scanning `playerDetails` rather than hardcoding one.
- Six fixtures committed under `lib/__fixtures__/`, all non-empty, none containing credential material, with a provenance README resolving RESEARCH.md's five flagged assumptions (A1-A5) against the recorded data.
- **A3 correction:** RESEARCH.md guessed the sourceID-scoped per-ability Healing table would NOT carry `overheal`. It does — every scoped entry carries its own `overheal`, summing to the same total as the un-scoped per-player row (127,626 = 127,626). What the scoped table actually lacks is `activeTime`, which only appears on the un-scoped `healingByPlayer` row. The underlying conclusion (the un-scoped query is required for player-level healer metrics) still holds, for the corrected reason.
- `TIMELINE_CASTS_QUERY` / `TIMELINE_CASTS_PAGE_QUERY` added to `lib/wcl-queries.ts`, using the exact argument names (`fightIDs`, `sourceID`, `dataType`, `startTime`, `limit`) and cast-event field names (`abilityGameID`, `sourceID`, `targetID`, `timestamp`) the recording confirmed.
- `healingByPlayer` added as a second aliased field on `PLAYER_FULL_DATA_QUERY_HEALING` and `TOP_PLAYER_DATA_QUERY_HEALING`, giving player-level overheal and active time with zero extra round trips.
- `lib/wcl-types.ts` gains the Cast Timeline and Healer Metrics type contracts (`WCLCastEvent`, `TimelineRow`, `TimelineAbilityCount`, `CastTimelineResult`, `TimelineRequest`, `HealerTableRow`, `HealerMetricsComputed`, `HealerComparison`) plus `AnalysisResult.healer` and `TopPlayerFullData.healerRow`.
- `RATE_LIMITS.timeline: 20` added to `lib/constants.ts` so the future timeline route can never fall through to the unknown-bucket default.
- `formatFightTime` extracted to `lib/utils.ts` as a shared export, reproducing `app/components/RaidOverview.tsx`'s private helper exactly (that component itself is untouched — plan 02-04 owns the switch to the shared import).
- `JUNK_SPELL_IDS` and `isJunkSpell` in `lib/analysis-engine.ts` changed from module-private to exported, with no other change to that file (its pre-existing lint debt was not grown).
- `lib/__fixtures__/fixtures.test.ts` asserts six shape guarantees over the recorded fixtures directly (no mocks) — a re-recorded fixture whose shape changed fails loudly instead of silently drifting.

## Task Commits

Each task was committed atomically:

1. **Task 1: Record the real WCL responses for the public demo report, end to end** - `d21292f` (feat) — completed by the prior executor agent; verified on disk and committed by this continuation agent after the tracer feedback checkpoint was approved.
2. **Task 2: Turn the recorded shapes into the query, type and rate-limit contracts Phase 2 builds on** - `d77e865` (test)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `scripts/record-wcl-fixtures.mjs` - Standalone OAuth+GraphQL recorder for the public demo report
- `lib/__fixtures__/README.md` - Provenance + A1-A5 findings
- `lib/__fixtures__/demo-player-dps.json` - PLAYER_FULL_DATA_QUERY response for fight 23 / source 12
- `lib/__fixtures__/demo-player-healer.json` - PLAYER_FULL_DATA_QUERY_HEALING + un-scoped healingByPlayer response for the resolved healer source
- `lib/__fixtures__/demo-raid-overview.json` - RAID_OVERVIEW_QUERY response for fight 23
- `lib/__fixtures__/demo-raid-combatant-info.json` - RAID_COMBATANT_INFO_QUERY response for fight 23
- `lib/__fixtures__/demo-raid-death-events.json` - RAID_DEATH_EVENTS_QUERY response (fight 23 has zero deaths — genuinely empty array)
- `lib/__fixtures__/demo-timeline-casts.json` - Paginated cast-events probe, aggregated casts table, and full actor list
- `lib/__fixtures__/fixtures.test.ts` - Shape guard over all six fixtures
- `lib/wcl-queries.ts` - Timeline Queries section + healingByPlayer on both healing queries
- `lib/wcl-types.ts` - Cast Timeline + Healer Metrics type contracts, AnalysisResult.healer, TopPlayerFullData.healerRow
- `lib/constants.ts` - RATE_LIMITS.timeline
- `lib/utils.ts` - formatFightTime
- `lib/analysis-engine.ts` - JUNK_SPELL_IDS / isJunkSpell exported
- `package.json` - record-fixtures script

## Decisions Made

See `key-decisions` in frontmatter — most notably the A3 correction (scoped table DOES carry overheal; lacks activeTime instead) and the healingByPlayer aliasing approach that avoids a second round trip.

## Deviations from Plan

### Auto-fixed Issues

None — Task 1 and Task 2 were both executed per plan with no bugs, missing critical functionality, or blocking issues encountered.

### Observations (not deviations — out of scope, documented per scope boundary)

**1. `npm run lint` (full repo run) reports ~1100 errors in `.codex/hooks/**`, unrelated to this plan.**
- **Found during:** Task 2 verification (`npm run lint`)
- **Cause:** An untracked `.codex/` directory (GSD tooling scaffolding, not created by this plan, already present in `git status` before this session started) contains `require()`-style imports that trip `@typescript-eslint/no-require-imports`. It is not part of this plan's `files_modified`, was not touched by either task, and predates this session.
- **Verification it's unrelated:** `npx eslint lib/wcl-queries.ts lib/wcl-types.ts lib/constants.ts lib/utils.ts lib/analysis-engine.ts lib/__fixtures__/fixtures.test.ts scripts/record-wcl-fixtures.mjs` (every file this plan touches) exits clean with zero findings.
- **Action:** None taken — per the scope boundary rule, pre-existing findings in files this task didn't touch are out of scope. Not logged to `deferred-items.md` since it is `.codex/` tooling scaffolding, not application code, and outside this plan's concern.

**2. `lib/__fixtures__/fixtures.test.ts`'s RED phase never produced a failing test.**
- **Found during:** Task 2 (writing the fixtures shape-guard test before the type contracts)
- **Explanation:** This test asserts field names on fixture JSON data that Task 1 already recorded and committed — it does not depend on any of Task 2's new query/type/constant exports. Running it before writing any Task 2 code passed immediately (6/6), because the data it guards already conformed to what it asserts. This matches the documented TDD error-handling guidance ("test doesn't fail in RED — the feature may already exist, investigate") — investigated and confirmed legitimate: the "feature" here is Task 1's already-recorded, already-verified fixture data, not new Task 2 behavior. No test was weakened or skipped to reach this state.
- **Impact:** None on the plan's guarantees — the test still exercises real data and will still fail loudly if a fixture is ever re-recorded with a different shape, which is its stated purpose.

---

**Total deviations:** 0 auto-fixed. 2 observations documented for audit-trail completeness (neither required a fix).
**Impact on plan:** None — plan executed as written, both tasks' acceptance criteria and verification commands pass.

## Issues Encountered

None. The prior executor's Task 1 artifacts were fully verified on disk (all six fixtures non-empty, `pages` array populated, README answers A1-A5, no credential strings present, no leftover pulled env file) before being committed in this session.

## Known Stubs

None — this plan ships no UI; no stubs to track.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans 02-02 (cast timeline), 02-04 (healer metrics UI), 02-05, and 02-07 can now execute without any further live WCL query: the response shapes are recorded under `lib/__fixtures__/`, the queries producing them are exported from `lib/wcl-queries.ts`, the TypeScript contracts are declared in `lib/wcl-types.ts`, `RATE_LIMITS.timeline` exists ahead of the route that will use it, and `formatFightTime` / `JUNK_SPELL_IDS` / `isJunkSpell` are now shared exports ready for reuse instead of duplication.

No blockers for the next plan in Phase 2.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-07*

## Self-Check: PASSED

All 15 key files verified present on disk (`[ -f ]`); both task commits (`d21292f`, `d77e865`) verified present in `git log --oneline --all`. `npx vitest run lib/__fixtures__/fixtures.test.ts` re-confirmed 6/6 passing; `npx tsc --noEmit` clean; `npm test` (full suite) 8 files / 65 tests passing.
