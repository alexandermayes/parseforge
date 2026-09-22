---
phase: 04-ads-live
plan: 02
subsystem: testing
tags: [wcl-api, fixtures, vitest, graphql, rankings]

# Dependency graph
requires:
  - phase: 04-ads-live (04-01)
    provides: PARSEFORGE-RANKINGS-SPEC.md's R0-2 deliverable definition and §7 verification bar
provides:
  - Six committed lib/__fixtures__/rankings-*.json fixtures recording real WCL rankings/rate-limit/guild responses
  - A shape-guard suite (17 assertions) pinning every field 04-04's parse-lens engine will depend on
  - A measured (not assumed) per-query-type point-cost table in PARSEFORGE-RANKINGS-SPEC.md §2.2.1
  - An explicit, provenance-recorded public-guild choice for the demo report (which has no guild of its own)
affects: [04-03, 04-04, rankings-lens-phases]

# Actuals (#2632)
actuals:
  tokens: 48000
  tasks: 3
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_provenance block convention on every recorded WCL fixture ({ query, recorded, entity, api_host, [public_confirmed] })"
    - "Rate-limit sampling bracketing each new query type in the same recorder run, to measure per-query-type point cost"

key-files:
  created:
    - lib/__fixtures__/rankings-report.json
    - lib/__fixtures__/rankings-ratelimit.json
    - lib/__fixtures__/rankings-encounter.json
    - lib/__fixtures__/rankings-character.json
    - lib/__fixtures__/rankings-zones.json
    - lib/__fixtures__/rankings-guild.json
  modified:
    - scripts/record-wcl-fixtures.mjs
    - lib/__fixtures__/fixtures.test.ts
    - lib/__fixtures__/README.md
    - .planning/research/PARSEFORGE-RANKINGS-SPEC.md

key-decisions:
  - "Confirmed the demo report itself has no guild (reportData.report(code:).guild is null) — resolves 04-RESEARCH.md Open Question 1 as an explicit finding, not an oversight."
  - "Chosen fallback guild is Sage (Dreamscythe-US, id 816114), found via the demo report's own featured character's public encounterRankings on the same realm/zone — not an arbitrary pick."
  - "Public-visibility confirmation for the guild used the WCL API's own reportData.reports() visibility field, not a logged-out browser check — direct HTTP requests to warcraftlogs.com return 403 to automated readers in this environment even for the already-known-public demo report, so a browser-style check was not available and the API-native signal was used instead, recorded transparently."
  - "Confirmed the classic.warcraftlogs.com API host is required for Classic characterData.character(...) to resolve — the default www.warcraftlogs.com host returns null for identical arguments. Recorded as an explicit R0-2 deliverable in the fixture's own _provenance and in README.md."
  - "Point-cost deltas for all five new query types were measured three times (three full recorder runs) and came back bit-for-bit identical each time (3.00 / 3.01 / 7.01 / 2.00 / 20.29), so none needed an `inconclusive` marker."

patterns-established:
  - "Pattern 1: description — every new rankings-*.json fixture carries a _provenance block naming its query, record time, entity, and API host; a hand-edited fixture that drifts from a real recording fails the shape suite on the next re-record rather than persisting silently."

requirements-completed: [R0-2]

coverage:
  - id: D1
    description: "npm run record-fixtures records the WCL rate-limit budget (3 samples) and the per-report rankings blob for the demo report as committed JSON fixtures, shape-tested"
    requirement: "R0-2"
    verification:
      - kind: unit
        ref: "lib/__fixtures__/fixtures.test.ts#Test 7-10"
        status: pass
    human_judgment: false
  - id: D2
    description: "Boss-leaderboard (partition-scoped), character (classic. host) and zone-bracket fixtures recorded with provenance"
    requirement: "R0-2"
    verification:
      - kind: unit
        ref: "lib/__fixtures__/fixtures.test.ts#Test 11-15"
        status: pass
    human_judgment: false
  - id: D3
    description: "Guild fixture recorded with members/attendance/reports and a complete _provenance block"
    requirement: "R0-2"
    verification:
      - kind: unit
        ref: "lib/__fixtures__/fixtures.test.ts#Test 16-17"
        status: pass
    human_judgment: false
  - id: D4
    description: "The demo report's guild resolves publicly, or a well-known public fallback guild was chosen with the same provenance rigor (must_haves backstop item)"
    human_judgment: true
    rationale: "This is a business/product judgment call (is the fallback guild an acceptable public-entity choice, is the API-native visibility confirmation an acceptable substitute for a browser check in this automated environment) that the plan itself flags as verification: backstop — a human should glance at the recorded reasoning in README.md \"Character and guild choices\" and rankings-guild.json's _provenance before this is considered fully closed."
  - id: D5
    description: "PARSEFORGE-RANKINGS-SPEC.md §2.2's point-cost row is a measured pointsSpentThisHour delta per query type, not an assumption"
    requirement: "R0-2"
    verification:
      - kind: other
        ref: "grep -qiF 'measured' .planning/research/PARSEFORGE-RANKINGS-SPEC.md (Task 3 gate script)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-20
status: complete
---

# Phase 4 Plan 02: WCL Rankings Fixtures Summary

Six real Warcraft Logs GraphQL responses (rankings, rate-limit budget, boss leaderboard, a Classic character's zone/encounter rankings, zone brackets, and a public guild's members/attendance/reports) are now committed fixtures with a 17-assertion shape guard and a measured per-query point-cost table — so 04-04's rankings engine gets built against reality, not the spec document.

## Performance

- **Duration:** ~35 min
- **Started:** ~2026-09-20T00:12Z (approximate — no explicit start timestamp captured)
- **Completed:** 2026-09-20T00:32Z
- **Tasks:** 3 completed (5 commits: 1 tracer, 1 TDD RED, 1 TDD GREEN, 1 auto, 1 correctness fix)
- **Files modified:** 10 (6 new fixtures, 4 modified files)

## Accomplishments
- Extended `scripts/record-wcl-fixtures.mjs` with 5 new query types and rate-limit sampling bracketing each one, staying a standalone `.mjs` with zero `lib/` imports
- Recorded and shape-tested `rankings-report.json` and `rankings-ratelimit.json` (Task 1 tracer), then `rankings-encounter.json`/`rankings-character.json`/`rankings-zones.json` (Task 2, TDD), then `rankings-guild.json` (Task 3) — 17 total shape assertions, all green
- Resolved 04-RESEARCH.md's A5, A6 and both Open Questions with real, measured data: the demo report has no guild (confirmed, not assumed); the `classic.warcraftlogs.com` host is required for Classic character rankings; per-query point costs are measured (three consistent runs), not estimated
- Recorded the `hidden` field's absence on today's character rows as an explicit, non-fatal, re-recordable observation rather than a frozen assumption

## Task Commits

Each task was committed atomically (Task 2 used the RED/GREEN TDD split its `tdd="true"` attribute calls for):

1. **Task 1: End-to-end rankings recording (tracer)** - `91f40f0` (feat)
2. **Task 2 RED: failing shape assertions** - `4ff614b` (test)
3. **Task 2 GREEN: recorder + fixtures** - `4dbb6fe` (feat)
4. **Task 3: guild fixture + measured point costs** - `4454b03` (feat)
5. **Correctness fix: _provenance on Task 1's two fixtures** - `0832091` (fix)

## Files Created/Modified
- `lib/__fixtures__/rankings-report.json` - the per-report rankings blob for the demo report/fight, recorded on its own; the single source of truth for 04-04's `parse-lens.ts`
- `lib/__fixtures__/rankings-ratelimit.json` - 7 labeled/timestamped `rateLimitData` samples across one run
- `lib/__fixtures__/rankings-encounter.json` - page-1 boss leaderboard (`characterRankings` + `fightRankings`), scoped to the report's own partition
- `lib/__fixtures__/rankings-character.json` - zone/encounter rankings for the demo report's featured DPS character, via the required `classic.` API host
- `lib/__fixtures__/rankings-zones.json` - bracket vocabulary for all 44 zones
- `lib/__fixtures__/rankings-guild.json` - members/attendance/reports for the chosen public fallback guild
- `scripts/record-wcl-fixtures.mjs` - extended with 5 new query bodies, a `classic.` host parameter on `gqlQuery`, and the rate-limit sampling helper
- `lib/__fixtures__/fixtures.test.ts` - 11 new numbered `it(...)` assertions (Tests 7-17)
- `lib/__fixtures__/README.md` - documents all six new fixtures, the character/guild choices and their public confirmations, restates the public-entity/deletion rule
- `.planning/research/PARSEFORGE-RANKINGS-SPEC.md` - new §2.2.1 dated, measured point-cost sub-table

## Decisions Made
See `key-decisions` in frontmatter — most notably: the demo report has no guild (confirmed, not assumed); the fallback guild (Sage, Dreamscythe-US) was found via a real public character's real ranking data on the same realm/zone, not picked arbitrarily; public-visibility confirmation used the WCL API's own `visibility` field because direct browser/HTTP checks are blocked (403) in this environment; the `classic.` API host is required for Classic character rankings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Full recorder run re-wrote fixtures outside this plan's scope**
- **Found during:** Tasks 1, 2, 3 (every `npm run record-fixtures` invocation)
- **Issue:** `scripts/record-wcl-fixtures.mjs`'s `main()` records all fixtures in one run, including the six pre-existing Phase 2 fixtures (`demo-player-dps.json`, `demo-player-healer.json`, `demo-raid-overview.json`, `demo-timeline-casts.json`). Running it to produce the new rankings fixtures also re-recorded these with fresh data (e.g. a different resolved healer, since the report's live rankings/state can drift), which is out of this plan's declared `files_modified` and would have silently broken the hardcoded `HEALER_SOURCE_ID = 32` assumption other tests depend on.
- **Fix:** After every recorder run, reverted the four out-of-scope fixture files via `git checkout --` before staging/committing, keeping only the new rankings fixtures and the (in-scope) `rankings-ratelimit.json` updates.
- **Files modified:** none (revert only, no fixture content changed outside scope)
- **Verification:** `git status --short` showed zero diff on the four files after each revert; full `npm test` stayed green throughout (237/237)
- **Committed in:** not a separate commit — a working-tree revert before each task's `git add`

**2. [Rule 2 - Missing critical] All six rankings fixtures needed a `_provenance` block, not just Task 2/3's three**
- **Found during:** Post-Task-3 self-check against the plan's own `<verification>` ("Six ... files exist, each with a `_provenance` block") and `<artifacts_this_phase_produces>` ("on every `rankings-*.json` fixture")
- **Issue:** Task 1's action text (written before the `_provenance` convention was introduced in Task 2) didn't ask for one on `rankings-report.json`/`rankings-ratelimit.json`, so they lacked it even though the plan-level requirements are unambiguous that "every"/"six" fixtures need it.
- **Fix:** Added a `_provenance` block to both fixtures (as a sibling key, not disturbing the existing `reportData.report.rankings.data`/`samples[]` paths existing tests already asserted against) and re-recorded.
- **Files modified:** `scripts/record-wcl-fixtures.mjs`, `lib/__fixtures__/rankings-report.json`, `lib/__fixtures__/rankings-ratelimit.json`
- **Verification:** `node -e "'_provenance' in require(...)"` true for all six fixtures; full suite re-run green (237/237); `npx tsc --noEmit` clean
- **Committed in:** `0832091`

**3. [Rule 3 - Blocking issue] Logged-out browser confirmation of the guild's public visibility was not available**
- **Found during:** Task 3
- **Issue:** The plan's guild-choice instruction models the same confirmation method as README.md's existing entries ("confirm it by opening its Warcraft Logs guild page logged-out"). Direct HTTP requests to `warcraftlogs.com` return HTTP 403 to automated readers in this environment — confirmed by testing the already-known-public demo report URL, which also 403'd, so a 403 here carries no privacy signal and a browser tool was not available.
- **Fix:** Used the WCL API's own `visibility: "public"` field on `reportData.reports(guildID:)` as the confirmation channel instead — an equally authoritative, arguably more precise signal (it comes directly from WCL, not an inference from page reachability) — and recorded the substitution transparently in both the fixture's `_provenance.public_confirmed_method` and README.md, rather than silently treating it as the browser check the plan modeled.
- **Files modified:** `scripts/record-wcl-fixtures.mjs`, `lib/__fixtures__/rankings-guild.json`, `lib/__fixtures__/README.md`
- **Verification:** all 10 sampled reports for the chosen guild returned `visibility: "public"`; Task 3's own gate script and `Test 17` both pass
- **Committed in:** `4454b03`

---

**Total deviations:** 3 auto-fixed (1 Rule 2, 2 Rule 3). **Impact on plan:** All three were necessary for correctness (Rule 2) or were blocking-issue workarounds executed with full transparency (Rule 3) rather than silent substitutions. No scope creep — no code outside `files_modified` was left changed, and D4's judgment call is explicitly flagged for human review below rather than self-certified.

## Known Stubs

None — this plan ships fixtures, tests and documentation only; no UI or engine code that could stub data.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None — `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` were pulled into a throwaway file outside the repo (`vercel env pull ... --environment=production --global-config ~/.vercel-personal --scope loot-list-plus`, per `lib/__fixtures__/README.md`'s existing recipe and this plan's `user_setup`), used only in-memory by the recorder process, never printed, never written into any repo file, and deleted at the end of this session. No `.env.local` or other local dev setup is required to run `npm test` — the shape-guard suite imports the committed JSON fixtures directly.

## Next Phase Readiness

`lib/__fixtures__/rankings-report.json` and `rankings-ratelimit.json` are ready for 04-04 to build `lib/rankings/parse-lens.ts` and `lib/rankings/budget.ts` entirely against recorded reality — per the plan's own success criteria, no field name needs to be looked up in `PARSEFORGE-RANKINGS-SPEC.md` again. `rankings-encounter.json`, `rankings-character.json`, `rankings-zones.json` and `rankings-guild.json` are ready for whichever later R-phase (R3/R4/R5 per §7) needs boss-leaderboard, character-card or guild-readiness data. The measured point-cost table in §2.2.1 gives 04-04's budget gate (`rateLimitData` → Redis, 90% threshold) real numbers to reason about instead of an `[ASSUMED]` marker.

**Open item for a human glance (D4 above, not a blocker):** the fallback guild choice (Sage, Dreamscythe-US) and the API-native public-confirmation method are recorded in `lib/__fixtures__/README.md` "Character and guild choices" — worth a quick read before this R0-2 deliverable is considered fully signed off, since it's a judgment call the plan itself flagged as a verification backstop.

## Self-Check: PASSED

- `[ -f lib/__fixtures__/rankings-report.json ]` → FOUND
- `[ -f lib/__fixtures__/rankings-ratelimit.json ]` → FOUND
- `[ -f lib/__fixtures__/rankings-encounter.json ]` → FOUND
- `[ -f lib/__fixtures__/rankings-character.json ]` → FOUND
- `[ -f lib/__fixtures__/rankings-zones.json ]` → FOUND
- `[ -f lib/__fixtures__/rankings-guild.json ]` → FOUND
- `git log --oneline --all | grep 91f40f0` → FOUND
- `git log --oneline --all | grep 4ff614b` → FOUND
- `git log --oneline --all | grep 4dbb6fe` → FOUND
- `git log --oneline --all | grep 4454b03` → FOUND
- `git log --oneline --all | grep 0832091` → FOUND
- `npm test` → 237/237 passed
- `npx tsc --noEmit` → clean
- `npm run protected-elements` → 10/10 passed
- `npm run seo-invariants` (against local dev server) → all routes `same` (one non-failing og-image host diff, expected)

---
*Phase: 04-ads-live*
*Completed: 2026-09-20*
