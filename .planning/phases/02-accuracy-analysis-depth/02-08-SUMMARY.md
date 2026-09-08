---
phase: 02-accuracy-analysis-depth
plan: 08
subsystem: testing
tags: [vitest, regression-net, cla-engine, raid-overview-engine, wcl-client, ops-gate]

# Dependency graph
requires:
  - phase: 02-accuracy-analysis-depth
    provides: "02-01's recorded WCL fixtures (lib/__fixtures__/), 02-04's healer-metrics extraction, 02-06's generated game-data cutover (lib/generated/) — all three engines under test here run against real recorded data through the post-02-06 production code path"
provides:
  - "lib/cla-engine.test.ts — behavioural + snapshot coverage of missing-enchant detection, flask/food presence, gem-vs-role mismatch, class-buff availability, driven by real recorded gear/aura data"
  - "lib/raid-overview-engine.test.ts — behavioural + snapshot coverage of healer-metrics agreement (D-08), role-then-throughput sort, death-timeline ordering/exclusion/fallback"
  - "lib/wcl-client.test.ts — scripted-fetch coverage of token mint/refresh, retry ceiling, timeout, and all five WCLError classifications, with no network/Redis/credential dependency"
  - "docs/OPS-01-SHIP-GATE.md amended to state a red npm test blocks a production deploy, name this phase's seven-file test reach, and record snapshot-update discipline"
affects: []

# Actuals (#2632)
actuals:
  tokens: 79300
  tasks: 3
  commits: 3
  # Dominated by ~284KB of committed vitest snapshot data (two full-output
  # snapshots over a 25-player raid + full raid-overview result) — generated
  # by running real production code against recorded fixtures, not authored.
  # Hand-authored test code (three .ts files) totals ~24K chars (~6K tokens),
  # plus a ~2.8K-char docs edit — much closer to hand-written-code scale.

tech-stack:
  added: []
  patterns:
    - "vi.resetModules() + per-test dynamic import to isolate a module's private module-scope caches (wcl-client.ts's token cache and query cache) between test cases, instead of exporting a reset hook the production module doesn't need"
    - "vi.mock of a dependency module (./kv-cache) combined with vi.stubGlobal(fetch) so a client with two layers of caching (module + shared store) is fully testable with zero network/Redis access"
    - "Fixture-grounded named assertions anchored to specific real player source ids (documented by name/id in each test's comment) rather than anonymous array indices, so a future reader can re-derive the expected value from the fixture directly"

key-files:
  created:
    - lib/cla-engine.test.ts
    - lib/raid-overview-engine.test.ts
    - lib/wcl-client.test.ts
    - lib/__snapshots__/cla-engine.test.ts.snap
    - lib/__snapshots__/raid-overview-engine.test.ts.snap
  modified:
    - docs/OPS-01-SHIP-GATE.md

key-decisions:
  - "analyzeConsumables' flask/food presence tests use a small synthetic WCLBuffEntry[] input (built from the real production flask id 17626) rather than fixture data, because no 02-01 fixture recorded a per-player buff-uptime table — combatantInfo.auras (used for gear/gem/class-buff checks elsewhere in the same file) is a bare id list with no totalUptime and cannot stand in for the WCLBuffEntry shape analyzeConsumables actually reads. Documented inline per the plan's own instruction (comment explaining why the fixture could not supply the case)."
  - "buildCLAResult's full-output snapshot runs with genuinely empty buffData (no fixture supplies it) — every player's consumables show as absent in the snapshot, an honest reflection of what was actually recorded rather than a derivation bug. Gear/gem/class-buff analysis inside the same snapshot reads combatantInfo directly and is unaffected."
  - "Fight 23 (the recorded demo fixture) has zero real deaths (confirmed in both demo-raid-death-events.json and demo-raid-overview.json's deaths table), so all three raid-overview-engine death-timeline behaviours (ordering, non-player exclusion, table fallback) use synthetic DeathEvent/death-table-entry inputs layered on top of the fixture's own real player source ids — only the death timing is synthetic, not which player \"died\"."
  - "wcl-client.test.ts isolates wcl-client.ts's module-scope token cache and query cache per test via vi.resetModules() + a fresh dynamic import, rather than relying solely on distinct query strings — belt-and-suspenders against a later test silently reusing an earlier test's cached token or result without ever calling the stubbed fetch."

patterns-established:
  - "Per-source-id, name-and-role-commented fixture assertions (e.g. \"Samkin, source 12, the demo report's own featured DPS player\") — a future engine-test author extending these files should keep citing the specific real player and field the assertion is grounded in, not just the numeric id."

requirements-completed: [ACC-02]

coverage:
  - id: D1
    description: "cla-engine.ts and raid-overview-engine.ts — previously untested — now run against real recorded WCL data under named assertions tied to real branches (missing-enchant by slot, flask/food presence, gem-vs-role mismatch, class-buff availability, healer-metrics agreement, death-timeline ordering/exclusion/fallback, role-then-throughput sort), plus one committed full-output snapshot each"
    requirement: "ACC-02"
    verification:
      - kind: unit
        ref: "lib/cla-engine.test.ts (9 tests, 18 assertions)"
        status: pass
      - kind: unit
        ref: "lib/raid-overview-engine.test.ts (6 tests, 18 assertions)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit && npx eslint lib/cla-engine.test.ts lib/raid-overview-engine.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "wcl-client.ts — previously untested — now has scripted-fetch coverage of token mint/refresh (401 -> clear -> remint, asserted via fetch call count), retry ceiling exhaustion for 429 and 500, AbortError timeout, and all three GraphQL-error-text classifications (not_found/private/upstream), with the userMessage boundary and the missing-credential message both asserted; no network, Redis, or credential value involved; wcl-client.ts itself untouched"
    requirement: "ACC-02"
    verification:
      - kind: unit
        ref: "lib/wcl-client.test.ts (10 tests covering all 10 required behaviours)"
        status: pass
      - kind: other
        ref: "npx vitest run lib/wcl-client.test.ts (10/10, ~0.1s real time, well under the 15s budget)"
        status: pass
      - kind: other
        ref: "git diff --quiet HEAD -- lib/wcl-client.ts (unmodified); node dependency check (no msw/nock/jest added)"
        status: pass
    human_judgment: false
  - id: D3
    description: "docs/OPS-01-SHIP-GATE.md states out loud that a red npm test blocks a production deploy, names all seven test files that make up this phase's coverage reach, states no coverage-percentage threshold is enforced and why, and records that committed snapshots are updated only deliberately"
    requirement: "ACC-02"
    verification:
      - kind: other
        ref: "grep gate: npm test / deploy-blocking phrase / coverage / snapshot keywords present; all 7 named test files exist on disk; .github/workflows/ci.yml still runs npm test"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 8: Regression Net for cla-engine, raid-overview-engine and wcl-client Summary

**Three previously-untested engines — the ones a Phase 7 redesign is most likely to break silently — now run against real recorded WCL data under 25 named assertions plus two committed full-output snapshots, and the OPS-01 ship gate now says out loud that a red suite blocks a production deploy.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments

- `lib/cla-engine.test.ts` — 9 tests / 18 assertions, driven by `demo-raid-overview.json` and `demo-raid-combatant-info.json` (real report `ZjKgNYxVcAqR8pGJ`, fight 23). Confirmed against the fixture directly: Samkin (source 12) has 3 real missing-enchant slots (Feet/Wrist/Back); Zulakeyah (source 32) has exactly 1 (Back); Ileria (source 7, Protection Paladin → Physical role) carries a real recorded spell-power gem flagged bad-for-Physical by `lib/generated/`'s `GEM_STAT_DB`; Ricoshams (source 15, Healer) carries no role-penalised gem; Zulakeyah's recorded auras include a Blessing of Kings id (reported "ok") but no Power Word: Fortitude id (reported "missing"). Flask/food presence uses a small synthetic `WCLBuffEntry[]` input (real flask id 17626) since no 02-01 fixture recorded a per-player buff-uptime table — documented inline. One full `buildCLAResult` snapshot committed.
- `lib/raid-overview-engine.test.ts` — 6 tests / 18 assertions, same fixtures plus `demo-raid-death-events.json`. `buildRaidOverview`'s healer-metrics entry for source 32 agrees field-for-field with an independent `computeHealerMetrics` call (D-08). Every real player in the raid sorts by role order then throughput descending (asserted across the full real roster, not a synthetic subset). Death-timeline ordering, fight-relative timing, non-player-source exclusion, and the death-table fallback path each use synthetic `DeathEvent`/death-table-entry inputs layered on real player source ids, since fight 23 genuinely has zero recorded deaths. One full `buildRaidOverview` snapshot committed.
- `lib/wcl-client.test.ts` — 10 tests, one per plan-specified behaviour: token mint + success, 401 refresh-and-retry (asserted via fetch call count, not just eventual success), 429/500 retry-ceiling exhaustion (`rate_limited`/`upstream`), `AbortError` timeout, the three `classifyGraphQLError` branches (`not_found`/`private`/`upstream`), the `userMessage` boundary (present, never carries raw upstream text), and both missing-credential branches. `vi.stubGlobal("fetch", ...)` plus a `vi.mock("./kv-cache", ...)` module mock mean zero network calls, zero Redis dependency, and no credential value anywhere in the file. `vi.resetModules()` + a fresh dynamic import per test isolates `wcl-client.ts`'s module-scope token/query caches between scenarios. Full file runs in ~0.1s real time (well under the 15s per-file / 30s full-suite budgets); `wcl-client.ts` itself is byte-identical to before this task; no new test dependency (`msw`/`nock`/alternative runner) was added.
- `docs/OPS-01-SHIP-GATE.md` — amended the local-gate step to state that a non-zero `npm test` exit blocks a production deploy with no override, added a subsection naming this phase's seven-file test reach (the three new engine tests plus `lib/timeline-engine.test.ts`, `lib/healer-metrics.test.ts`, `lib/generated/game-data.test.ts` and `lib/__fixtures__/fixtures.test.ts` from earlier Phase 2 plans) alongside the pre-existing suite, stated that no coverage-percentage threshold is enforced and why, and recorded that committed snapshots are updated only deliberately with the diff reviewed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Behavioural plus snapshot coverage for cla-engine and raid-overview-engine** - `3dd99c8` (test)
2. **Task 2: Scripted-fetch coverage of wcl-client's token refresh, retry and every error classification** - `e27d7d5` (test)
3. **Task 3: Make a red suite a deploy blocker in the OPS-01 gate, and name what is now covered** - `ff676c2` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `lib/cla-engine.test.ts` - Behavioural + snapshot coverage of gear/enchant/gem/class-buff audit logic
- `lib/raid-overview-engine.test.ts` - Behavioural + snapshot coverage of healer metrics, death timeline, sort order
- `lib/wcl-client.test.ts` - Scripted-fetch coverage of token refresh, retry, timeout and error classification
- `lib/__snapshots__/cla-engine.test.ts.snap` - Committed full-output snapshot (25-player raid CLA result)
- `lib/__snapshots__/raid-overview-engine.test.ts.snap` - Committed full-output snapshot (full raid-overview result)
- `docs/OPS-01-SHIP-GATE.md` - Deploy-blocking statement, seven-file coverage-reach subsection, snapshot-discipline note

## Decisions Made

See `key-decisions` in frontmatter — most notably: the flask/food and death-timeline behaviours use small synthetic inputs (documented inline, per the plan's own instruction) because no 02-01 fixture recorded a per-player buff-uptime table and fight 23 genuinely has zero real deaths; everything else (missing-enchant counts, gem-vs-role mismatch, class-buff availability, healer-metrics agreement, sort order) is driven directly by the real recorded fixtures with no synthetic substitution.

## Deviations from Plan

None — plan executed exactly as written. The plan itself anticipated and authorized the synthetic-input cases above (flask/food, death timeline) for exactly the reasons found during execution, so these are not deviations from the plan — they're the plan's own documented fallback being exercised as designed.

## Issues Encountered

`npm run lint` (full, unscoped repo run) reports ~1100 pre-existing errors from the untracked `.codex/` tooling directory — consistent with the identical observation every prior plan in this phase (02-01, 02-03, 02-05, 02-07) already documented; none of it is in this plan's touched files. Verified via a scoped `npx eslint lib/cla-engine.test.ts lib/raid-overview-engine.test.ts lib/wcl-client.test.ts` (zero findings) and a grep confirming the only `app/`/`lib/` finding in the unscoped run is `app/components/CastTimeline.tsx`'s pre-existing `<img>` LCP warning (from plan 02-02, not this plan).

## Known Stubs

None — every assertion is driven by either real recorded fixture data or a documented, plan-authorized synthetic input; no UI ships from this plan.

## User Setup Required

None - no external service configuration required.

## Full-Suite Reach After This Plan

```
$ npm test
 Test Files  14 passed (14)
      Tests  135 passed (135)
   Duration  ~0.7-1s (real wall-clock time)
```

Up from 110/110 (11 files) before this plan — the three new files add 25 tests (9 + 6 + 10). Well inside the 30-second feedback budget 02-VALIDATION.md sets; `lib/wcl-client.test.ts` alone runs in ~0.1s despite covering three retry-exhausting/timeout scenarios, because those scenarios run under fake timers.

## Next Phase Readiness

ACC-02 and ROADMAP success criterion 4 are closed: the three engines a Phase 7 redesign is most likely to break silently now fail loudly instead, on assertions tied to real recorded data and to the two bugs this project actually shipped (PR #11's shifted id maps, PR #12's unscoped rankings partition — both indirectly guarded by this phase's earlier `lib/generated/` and rankings-scoping work, with this plan adding the missing regression net around the engines that consume that data). The OPS-01 gate now states the deploy-blocking consequence and the coverage reach explicitly, so a later phase reading a green gate knows what it actually proves.

No blockers for the next plan in Phase 2.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 6 key files verified present on disk (`[ -f ]`). All three task commits (`3dd99c8`, `e27d7d5`, `ff676c2`) verified present in `git log --oneline --all`. Re-ran `npx vitest run lib/cla-engine.test.ts lib/raid-overview-engine.test.ts lib/wcl-client.test.ts` (25/25 passing); `npm test` (full suite) re-confirmed 14 files / 135 tests passing; `npx tsc --noEmit` clean; `git diff --quiet HEAD -- lib/wcl-client.ts` confirms the file is unmodified; dependency check confirms no `msw`/`nock`/alternative-runner package was added.
