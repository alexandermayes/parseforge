---
phase: 02-accuracy-analysis-depth
plan: 03
subsystem: infra
tags: [wago-tools, game-data, codegen, tbc, wotlk, cata, vitest]

# Dependency graph
requires: []
provides:
  - "scripts/regen-game-data.mjs — committed, repeatable `npm run regen-game-data` generator resolving each era's build from wago.tools/api/builds, deriving enchant/gem name and gem-stat maps from client CSVs, enforcing per-map row-count floors before writing, and enumerating cross-era ID collisions"
  - "lib/generated/game-data.classic-tbc.ts / game-data.wotlk.ts / game-data.cata.ts — three separately-stamped generated era modules (2553/3895/4891 rows respectively, built 2.5.6.69546 / 3.4.5.63697 / 4.4.2.60895)"
  - "lib/generated/game-data-overrides.json / .ts — the single hand-authored game-data file (3 sourced overrides) and its typed accessor, including the GemStatType/GeneratedGemInfo types and the STAT_TYPE_BAD_FOR_ROLES policy"
  - "lib/generated/game-data.test.ts — regression proof that the generated data reproduces every enchant/gem ID-to-name pair lib/cla-constants.test.ts pins"
affects: [02-06]

# Actuals (#2632)
actuals:
  tokens: 164428
  tasks: 2
  commits: 2
  # Note: this diff is dominated by ~640KB of generated era-module data
  # (thousands of enchant/gem rows per era, from the full wago.tools client
  # dump — not a curated subset). The plan's 75000-token estimate assumed a
  # smaller regeneration; code-only files (the generator script, the
  # overrides file+accessor, and the test) total roughly 30K chars (~7.5K
  # tokens), much closer to that estimate.

tech-stack:
  added: []
  patterns:
    - "Node script family (scripts/regen-game-data.mjs) following scripts/token-audit.mjs's shebang/header-doc/argv-mode/exit-code contract, extended with a fatal unconditional startup check (mirrors token-audit's allowlist-reason check) and a producer responsibility (writes generated modules on success) the audit-only scripts in this family don't have"
    - "Row-count floors computed and checked BEFORE any file write, across all three eras, so a truncated/unreachable upstream fetch can never silently replace a populated era module with a thinner one"
    - "Cross-era ID collisions enumerated (never resolved) by the generator; the compose-and-assert test asserts era-specific pinned facts against their own era module directly rather than a blind later-wins merge, once real cross-era ID reuse in the exhaustive data was confirmed to make that merge unsound for era-specific assertions"

key-files:
  created:
    - scripts/regen-game-data.mjs
    - lib/generated/game-data-overrides.json
    - lib/generated/game-data-overrides.ts
    - lib/generated/game-data.classic-tbc.ts
    - lib/generated/game-data.wotlk.ts
    - lib/generated/game-data.cata.ts
    - lib/generated/game-data.test.ts
  modified:
    - package.json

key-decisions:
  - "Enchant-name derivation combines two independent client-data sources: the friendly label from the owning spell's name (SpellEffect Effect 53/54 -> SpellName, stripped of a leading 'Enchant <slot> - ' prefix, QA/test spells excluded) and the raw stat text from SpellItemEnchantment.Name_lang itself — composed as 'label (raw)' unless identical, matching the exact style the pre-existing hand-authored map used (e.g. 'Major Strength (+15 Strength)', 'Mongoose' with no redundant parenthetical). This was discovered empirically — the plan's action text only described the spell-name join, which alone reproduces plain labels like 'Exceptional Stats' but not the pinned '+6 All Stats' stat text cla-constants.test.ts asserts for id 2661."
  - "When every SpellEffect candidate for an enchant id is an internal QA/test spell (name prefixed 'QAEnchant'), the generator falls back to the raw stat text rather than surfacing an internal test label to a raider — a Rule 1 correctness fix beyond the plan's literal derivation description."
  - "Overrides seeded: enchant id 88 (empty Name_lang and zero candidate spells in all three eras' client dumps — a deprecated placeholder row with no recoverable name) and enchant ids 2343/2566 (every candidate spell in all three eras is QA/test-only, so no friendly label is derivable from client data at all; the pre-existing hand-verified 'Major Healing'/'Healing Power' labels are preserved as sourced overrides, with their parenthetical stat text still wago-derived verbatim). D-11's own named override families (WotLK/Cata food-buff names, TBC food-buff id range, engineering tinkers) are CONSUMABLE_DB data, out of scope for this plan (files_modified has no CONSUMABLE_DB target; the plan's own artifact table restricts game-data-overrides.json's provides line to enchant/gem names + role policy; plan 02-06 explicitly 'adds a consumables key to this same file') — see Deviations."
  - "GemStatType and GeneratedGemInfo are declared locally in lib/generated/game-data-overrides.ts rather than imported from lib/cla-constants.ts, to avoid a future circular import once plan 02-06 makes cla-constants.ts import FROM lib/generated/ — 02-06 reconciles these with cla-constants.ts's canonical GemStatType/GemInfo during the cutover."
  - "GEM_STAT_DB is generated for every gem with a resolvable name (same key set as GEM_NAME_DB), not the small hand-curated subset the old map carried — this trivially satisfies the 'every gem-stat id with a name carries the identical name' invariant by construction, since both maps derive from the same ItemSparse pass."

patterns-established:
  - "regen-game-data.mjs's era descriptor / build-resolution / row-floor / collision-enumeration shape is reusable for any future wago.tools-sourced data pipeline this project adds."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "A committed, repeatable npm run regen-game-data script fetches era-pinned CSVs from wago.tools and generates ENCHANT_NAME/GEM_NAME/GEM_STAT data as three separately-stamped source files (Classic+TBC, WotLK, Cata), refusing to write when a map falls below its row-count floor"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node scripts/regen-game-data.mjs --report (exit 0, three distinct era-appropriate builds, per-map row counts against floors)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "lib/generated/game-data.test.ts (8/8 assertions)"
        status: pass
    human_judgment: true
    rationale: "The generator's row-floor gate and fatal-override-source checks were exercised via a manual, temporary-edit test during this session (confirmed exit 1 with no file write on an impossible floor, exit 2 on a missing source note) rather than an automated test committed to the suite — a human reviewing the regen-game-data.mjs source is the remaining verification step for that specific safety-gate code path."
  - id: D2
    description: "Values that cannot be derived from any client dump (enchant ids 88, 2343, 2566) live only in the single hand-authored overrides file, each with a non-empty source note, and are registered in UNVERIFIED_OVERRIDE_IDS so no override id can hide inside a generated era module"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "lib/generated/game-data.test.ts#Test 8: no unverified-override id appears inside any generated era module"
        status: pass
      - kind: other
        ref: "node -e 'require(\"./lib/generated/game-data-overrides.json\")' source-note validation (embedded in Task 1's <verify>)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The generated data reproduces every enchant/gem ID-to-name pair lib/cla-constants.test.ts pins against the pre-regeneration hand-authored maps, so the 02-06 cutover cannot regress a known-correct mapping"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "lib/generated/game-data.test.ts (Tests 1-7, all pinned pairs)"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 81/81 passing, no regressions)"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 3: Wago.tools Game-Data Regeneration Pipeline Summary

**Built and ran `scripts/regen-game-data.mjs` for real against live wago.tools, producing three era-stamped, exhaustively-derived enchant/gem-name and gem-stat modules (2553/3895/4891 rows) that provably reproduce every ID-to-name pair the pre-existing hand-typed `lib/cla-constants.ts` pinned — turning PR #11's one-off manual fix into a repeatable, row-floor-guarded generator.**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-09-07T18:05:00Z (approx.)
- **Completed:** 2026-09-08T18:22:00Z (approx.)
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- `scripts/regen-game-data.mjs` (in the `scripts/token-audit.mjs` family): resolves each of three eras' current build from `https://wago.tools/api/builds` by matching product + version prefix (never a fresh guess, never one product's latest build for all three — RESEARCH.md Pitfall 5), fetches and caches five CSV tables per build under `node_modules/.cache/regen-game-data/`, and derives enchant names, gem names and gem stats via a header-indexed RFC4180 CSV parser (no new dependency).
- **Enchant-name derivation, discovered empirically beyond the plan's literal description:** the friendly label from `SpellEffect` (Effect 53/54) → `SpellName`, stripped of a leading `Enchant <slot> - ` prefix and excluding internal `QA*` test spells, is combined with `SpellItemEnchantment.Name_lang`'s own raw stat text as `"label (raw)"` — unless they're identical, in which case the raw text alone is used (`"Mongoose"`, not `"Mongoose (Mongoose)"`). This reproduces the pre-existing map's exact style, including the parenthetical stat text (`"+6 All Stats"` for enchant 2661) the plan's spell-name-only description would have missed.
- **Gem derivation:** gem names from `ItemSparse.Display_lang` where `Gem_properties` is non-zero; gem stats via `ItemSparse.Gem_properties → GemProperties.Enchant_ID → SpellItemEnchantment.Name_lang`, classified into one `GemStatType` by a table-driven text classifier (unclassifiable text → `neutral`), with `badForRoles` derived from a `STAT_TYPE_BAD_FOR_ROLES` policy in the overrides file (spell power bad for Physical; strength/agility bad for Caster+Healer; defense/dodge/parry bad for all three).
- Per-era, per-map row-count floors (declared from the pre-regeneration hand-authored map's own counts) are checked before any file is written; a below-floor or zero-row map exits 1 with no write. Verified both directions this session: a temporarily-inflated floor correctly blocked the write and exited 1 (report mode still exited 0, per the family contract, without writing); a temporarily-blanked override source note correctly exited 2 in every mode.
- `lib/generated/game-data-overrides.json` — the single hand-authored file — seeded with 3 sourced entries: enchant id 88 (empty `Name_lang` and zero candidate spells in all three eras' client dumps), and enchant ids 2343/2566 (every candidate spell in all three eras is an internal QA/test spell, so no friendly label is derivable from client data at all — the pre-existing hand-verified labels are preserved as sourced overrides). `lib/generated/game-data-overrides.ts` projects it with zero data of its own, plus the `GemStatType`/`GeneratedGemInfo` types and `UNVERIFIED_OVERRIDE_IDS`.
- Ran `npm run regen-game-data` for real against live wago.tools. Resolved builds: **2.5.6.69546** (Classic+TBC, `wow_anniversary`), **3.4.5.63697** (WotLK, `wow_classic`), **4.4.2.60895** (Cata, `wow_classic`) — all three matching the builds already pinned in `lib/cla-constants.ts`'s header comment (no upstream build has moved since PR #11).
- `lib/generated/game-data.test.ts` composes the three era modules (a small local helper, not the app's future composition module — that's 02-06's artifact) and asserts all 8 required behaviours, including the override/registry separation invariant.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "regenerate one era's enchant names from wago.tools"** - `47c5091` (feat) — generator script, overrides file + accessor, three real generated era modules
2. **Task 2: Run the regeneration for real and prove it reproduces every pinned ID-to-name pair** - `e552d0f` (test)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `scripts/regen-game-data.mjs` - Build resolution, CSV fetch/cache, the three wago derivations, era-module emission, row-count floors
- `lib/generated/game-data-overrides.json` - The single hand-authored game-data file (3 sourced entries + role policy)
- `lib/generated/game-data-overrides.ts` - Typed accessor: `STAT_TYPE_BAD_FOR_ROLES`, `ENCHANT_NAME_OVERRIDES`, `GEM_NAME_OVERRIDES`, `UNVERIFIED_OVERRIDE_IDS`, `GemStatType`, `GeneratedGemInfo`
- `lib/generated/game-data.classic-tbc.ts` - Generated Classic+TBC enchant names (2041), gem names (256), gem stats (256) — build 2.5.6.69546
- `lib/generated/game-data.wotlk.ts` - Generated WotLK enchant names (2653), gem names (621), gem stats (621) — build 3.4.5.63697
- `lib/generated/game-data.cata.ts` - Generated Cata enchant names (3097), gem names (897), gem stats (897) — build 4.4.2.60895
- `lib/generated/game-data.test.ts` - Regression guard reproducing every ID-to-name pair `lib/cla-constants.test.ts` pins
- `package.json` - `regen-game-data` npm script

## Row Counts vs. Floors (per `--report`)

| Era | enchantNames | gemNames | gemStats |
|---|---|---|---|
| classic-tbc | 2041 rows (floor 130) | 256 rows (floor 100) | 256 rows (floor 100) |
| wotlk | 2653 rows (floor 80) | 621 rows (floor 120) | 621 rows (floor 120) |
| cata | 3097 rows (floor 70) | 897 rows (floor 100) | 897 rows (floor 100) |

Floors were derived from the counts the pre-regeneration hand-authored `lib/cla-constants.ts` carried per era-section (a conservative lower bound the exhaustive generated data comfortably exceeds).

## Cross-Era Collision List (for the owner's review — see Deviations)

`node scripts/regen-game-data.mjs --report` enumerates **806 enchantNames collisions** and **295 gemNames collisions** across the three eras — ids present in more than one era with a differing value. This is expected at the exhaustive-data scale: the client's `SpellItemEnchantment`/`ItemSparse` ID space is global across WoW's whole history, and later clients frequently rewrite or reassign older item/enchant IDs (Blizzard itemization reworks, stat-system changes like Cata's defense-rating removal, gem redesigns). The three generated era modules each stay independently correct — collisions are enumerated, never resolved, exactly as the plan requires. Representative samples confirmed genuine (not a derivation bug) by inspecting both era modules directly, e.g.:
- enchant id 3003: `classic-tbc="Glyph of Ferocity (+34 Attack Power and +16 Hit Rating)"` vs `wotlk="Arcanum of Ferocity (+34 Attack Power and +16 Hit Rating)"`
- enchant id 2667: `classic-tbc="Savagery"` vs `wotlk="Savagery (+70 Attack Power)"`
- gem id 32196: `wotlk="Runed Crimson Spinel"` vs `cata="Brilliant Crimson Spinel"`
- gem id 40024: `wotlk="Tenuous Twilight Opal"` vs `cata="Glinting Twilight Opal"`

**Recommendation carried into plan 02-06:** given the scale of real collisions (not the near-zero the plan anticipated), a blind "later era wins" merge is unsound as the *runtime* composition strategy — 02-06 should very likely select the correct era module per-report (matching the report's own detected content era) rather than merging all three eras into one flat lookup map.

## Changed-Value List vs. Pre-Regeneration Hand-Authored Maps

Compared every id in the old `ENCHANT_NAME_DB`/`GEM_NAME_DB` against the newly-generated data (composed in the same Classic+TBC → WotLK → Cata, later-wins order the old single flat map's section ordering implied):

| Map | Matched (unchanged) | Changed | Missing |
|---|---|---|---|
| ENCHANT_NAME_DB | 234 | 83 | 60 |
| GEM_NAME_DB | 246 | 114 | 77 |

- **Matched:** the generated value is byte-identical to the old hand-typed value.
- **Changed:** almost entirely the same cross-era ID-reuse phenomenon described above — an id the old flat map only ever showed one era's value for now also has a differing value in a *different* era's own generated module, and the naive full-history composition used for this comparison (not the app's runtime path) picked up the later era's value instead of the originally-pinned one.
- **Missing:** almost entirely MoP-range ids (`lib/cla-constants.ts` has hand-typed MoP sections; MoP is explicitly out of scope per D-10) plus the 3 ids now correctly routed through the overrides file (2343, 2566, 88) rather than a generated module.

No case was found where the generated *classic-tbc, wotlk, or cata module itself* disagreed with the corresponding hand-typed value for an id genuinely belonging to that era — every apparent "change" traces to the composition-order artifact described above, not a derivation defect. `lib/generated/game-data.test.ts` asserts every pinned pair against its correct era module directly (see Deviations) precisely to avoid this artifact contaminating the regression proof.

## Decisions Made

See `key-decisions` in frontmatter — most notably the two-source enchant-name derivation (spell-name label + raw stat text, discovered empirically), the QA-spell exclusion fallback, the three seeded overrides and their justification, and the local `GemStatType`/`GeneratedGemInfo` type declarations to avoid a future circular import with `lib/cla-constants.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Enchant-name derivation needed a second client-data source (SpellItemEnchantment.Name_lang) beyond the plan's spell-name-only description**
- **Found during:** Task 1 (implementing the enchant-name derivation) and Task 2 (writing/reproducing Test 4)
- **Issue:** The plan's action text describes deriving enchant names purely via `SpellEffect → SpellName`, stripped of an `Enchant <slot> - ` prefix. That alone reproduces plain labels ("Exceptional Stats") but not the exact stat text `lib/cla-constants.test.ts` pins for enchant 2661 (`toContain("+6 All Stats")`) — the pre-existing hand-typed map's parenthetical stat suffixes were never purely spell-name-derived.
- **Fix:** Discovered via direct wago.tools CSV inspection that `SpellItemEnchantment.Name_lang` itself carries the exact raw stat text (`"+6 All Stats"`, `"+34 Attack Power and +16 Hit Rating"`, etc.) for every enchant row. The derivation combines both sources: `label` (from the spell-name join, prefix-stripped) + `raw` (from `SpellItemEnchantment.Name_lang`), composed as `"label (raw)"` unless identical.
- **Files modified:** `scripts/regen-game-data.mjs`
- **Verification:** All 9 pinned enchant-name assertions pass exactly, including the exact-substring check for id 2661.
- **Committed in:** `47c5091` (Task 1 commit)

**2. [Rule 1 - Bug] QA/test-only spell names excluded from the friendly-label pool**
- **Found during:** Task 1, while cross-checking candidate spells for enchant ids 76, 1341, 1436, 2376, 2343, 2566, 2660 — every `SpellEffect` row referencing these ids points to an internal `QAEnchant*` test spell, never a player-facing one.
- **Issue:** Without exclusion, these ids would surface an internal dev/test spell name (e.g. `"QAEnchant Bracer +24 Healing"`) to a raider instead of a real label — a correctness defect against ACC-01's own bar.
- **Fix:** Candidates whose name starts with `QA` (case-insensitive) are excluded from the friendly-label pool. If every candidate for an id is QA-only, the generator falls back to the raw stat text (ids 76/1341/1436/2376/2660) or, where no raw text alone is good enough on its own merit, the id is routed to the overrides file (2343, 2566 — see below).
- **Files modified:** `scripts/regen-game-data.mjs`
- **Verification:** `lib/generated/game-data.test.ts` Test 8 confirms 2343/2566 are absent from all three generated modules and resolve correctly through `ENCHANT_NAME_OVERRIDES` in the composed map.
- **Committed in:** `47c5091` (Task 1 commit)

**3. [Rule 1 - Bug, discovered during Task 2] Local composition helper's "later era wins" order is unsound for asserting era-specific pinned facts at the exhaustive-data scale**
- **Found during:** Task 2, first `npx vitest run` of the newly-written test — 4 of 8 assertions failed
- **Issue:** The plan's action text directs the test to compose all three eras with "a later entry winning for a colliding id" and assert the required behaviours against that composed map. At the exhaustive-data scale (thousands of rows per era, not the collision-free curated subset the old hand-typed map happened to be), real cross-era ID collisions exist for several of the required test ids (enchant 2667, 3003; gem 32196) — composing with later-wins silently overwrote the pinned TBC-era fact with an unrelated later-era item that happens to reuse the same numeric id, which is precisely the class of silent cross-era misattribution this entire phase exists to prevent (RESEARCH.md Pitfall 5).
- **Fix:** Tests 1-6 (all inherently TBC-era-sourced facts, matching what `lib/cla-constants.test.ts` pins) now assert directly against `ENCHANT_NAME_CLASSIC_TBC`/`GEM_NAME_CLASSIC_TBC`/`GEM_STAT_CLASSIC_TBC` rather than the composed map. Tests 7-8, which are genuinely about composed/merge behaviour (the gem-stat/gem-name invariant across the full dataset, and the override-registry separation), continue to use the composed map, where that behaviour is exactly what's under test.
- **Files modified:** `lib/generated/game-data.test.ts`
- **Verification:** All 8 tests pass; `node scripts/regen-game-data.mjs --report` independently confirms the specific collisions (2667, 3003, 32196) are real (each era module verified directly to hold its own era's correct value).
- **Committed in:** `e552d0f` (Task 2 commit)

### Documented Discrepancy (not auto-fixed — plan authoring issue, not an implementation bug)

**4. D-11's three named override families (WotLK/Cata food-buff friendly names, TBC food-buff ID range, engineering tinkers) are CONSUMABLE_DB data, out of scope for this plan.**
- **Found during:** Task 1, seeding `lib/generated/game-data-overrides.json`
- **Issue:** The plan's action text says to "seed it with the three override families D-11 names," all three of which are consumable/food-buff facts — but this plan's own concrete artifact contract restricts the file to `enchantNames`/`gemNames`/`statTypeBadForRoles` (no `consumables` key; `game-data-overrides.json`'s `provides` line in the plan's artifact table is explicitly "source-noted enchant and gem name overrides plus the stat-type role policy"; the plan's own text says "Plan 02-06 adds a consumables key to this same file"; and Task 1's machine `<verify>` script only checks the `enchantNames`/`gemNames` sections, never `consumables`). `CONSUMABLE_DB` generation is not in this plan's `files_modified` at all.
- **Resolution:** Implemented per the concrete, machine-verified artifact contract — the overrides file stays scoped to enchant/gem names and the role policy this plan. The `>= 3 sourced entries` requirement was satisfied instead with genuinely-justified enchant-name overrides discovered during real generation (enchant ids 88, 2343, 2566 — see Auto-fixed Issue 2 above and `key-decisions`).
- **Files affected:** `lib/generated/game-data-overrides.json` (no incorrect content resulted; documented for plan-authoring awareness).
- **Impact:** None on shipped behavior. The file's structural contract (3 top-level keys, `enchantNames`/`gemNames` each carrying `>= 3` total sourced entries) is fully satisfied; every override is a genuine, verified "cannot be derived from client dump" case, not a placeholder.

**5. `npm run lint` (full repo, unscoped) reports pre-existing `.codex/hooks/**` errors, unrelated to this plan — same observation 02-01 already documented this phase.**
- **Found during:** Task 2 verification (`npm test && npx tsc --noEmit && npm run lint`)
- **Cause:** The untracked `.codex/` directory (GSD tooling scaffolding, not created by this plan, present in `git status` before this session started) trips `@typescript-eslint/no-require-imports`. Not part of this plan's `files_modified`, not touched by either task.
- **Verification it's unrelated:** `npx eslint scripts/regen-game-data.mjs lib/generated/game-data-overrides.ts lib/generated/game-data.classic-tbc.ts lib/generated/game-data.wotlk.ts lib/generated/game-data.cata.ts lib/generated/game-data.test.ts` (every file this plan touches) exits clean with zero findings.
- **Action:** None taken — out of scope per the scope-boundary rule, matching 02-01's identical precedent this same phase.

---

**Total deviations:** 3 auto-fixed (2 correctness fixes required for ACC-01's own bar, 1 test-design fix required to avoid the exact silent misattribution class this phase exists to prevent), 2 documented discrepancies (a plan-authoring scope mismatch and a pre-existing unrelated lint debt, neither requiring a code change).
**Impact on plan:** All three auto-fixes were necessary for correctness or to keep the regression test honest. No scope creep — `CONSUMABLE_DB` generation and the `docs/GAME-DATA-AUDIT.md` audit doc remain plan 02-06's job, as originally scoped.

## Issues Encountered

None beyond the documented deviations above. wago.tools was reachable throughout (no auth required, matching the PR #11 precedent); no auth gates encountered.

## Known Stubs

None — every generated map is populated from live wago.tools data; no placeholder/mock data paths exist. The overrides file's 3 entries are genuine, sourced, human-supplied values (not stubs).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02-06 can now cut `lib/cla-constants.ts` over to consume these three generated era modules plus the overrides file, and emit `docs/GAME-DATA-AUDIT.md` from this SUMMARY's row-count, collision and changed-value records. Two things 02-06 should account for, surfaced by this plan's real-data run:
1. The runtime composition strategy should very likely be **era-aware selection**, not a blind flat merge — the collision counts (806 enchant, 295 gem) are far larger than a naive "later wins" design tolerates safely.
2. `CONSUMABLE_DB` generation and its `consumables` overrides key (the WotLK/Cata food-buff names, TBC food-buff ID range, and engineering-tinker overrides D-11 names) are still fully open — this plan generated only the enchant/gem/gem-stat pipeline.

No blockers for plan 02-06.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 7 key files verified present on disk (`[ -f ]`); both task commits (`47c5091`, `e552d0f`) verified present in `git log --oneline --all`. `npx vitest run lib/generated/game-data.test.ts` re-confirmed 8/8 passing; `npm test` (full suite) 10 files / 81 tests passing; `npx tsc --noEmit` clean; `node scripts/regen-game-data.mjs --report` re-confirmed exit 0 with three distinct era-appropriate builds and all floors met.
