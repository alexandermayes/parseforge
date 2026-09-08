---
phase: 02-accuracy-analysis-depth
plan: 06
subsystem: infra
tags: [wago-tools, game-data, codegen, cla-constants, tbc, wotlk, cata, vitest]

# Dependency graph
requires:
  - phase: 02-accuracy-analysis-depth (plan 03)
    provides: "scripts/regen-game-data.mjs, three generated era modules, game-data-overrides.json/.ts — the pipeline this plan cuts runtime over to"
provides:
  - "lib/generated/index.ts — the single composition point turning three era modules plus overrides into the four maps the engines read, with Classic+TBC-first collision precedence and UNVERIFIED_IDS"
  - "lib/generated/game-data.consumables.ts — generated, wago-verified-or-honestly-overridden consumable display names for all 178 curated ids"
  - "lib/cla-constants.ts cut over to a thin re-export — zero inline id-map literals remain"
  - "docs/GAME-DATA-AUDIT.md — the standing regeneration review artifact (builds, row counts, unverified overrides, changed values, cross-era collisions)"
affects: [02-08]

# Actuals (#2632)
actuals:
  tokens: 118915
  tasks: 3
  commits: 3
  # Note: dominated by docs/GAME-DATA-AUDIT.md (a ~1300-line generated report,
  # committed in full) and the ~1480-line growth in game-data-overrides.json
  # (130 consumable-name overrides, each with a multi-sentence source note —
  # verbose by design per D-11's transparency requirement, not padding).

tech-stack:
  added: []
  patterns:
    - "lib/generated/index.ts as the single era-precedence decision point — every future consumer of the four maps imports from lib/cla-constants.ts (unchanged surface), which re-exports from here"
    - "Override precedence is absolute: an explicit *_OVERRIDES entry always wins over a resolved-but-undesirable generated value, not just a fallback for 'nothing resolved' — established for enchant/gem in 02-03, extended to consumables here (a consumableNames override wins even when SpellName resolves *something* for that id)"
    - "previous-run sidecar (node_modules/.cache/regen-game-data/previous-run.json) persists resolved values across regeneration runs so docs/GAME-DATA-AUDIT.md's changed-values section has a real diff, not just a snapshot"

key-files:
  created:
    - lib/generated/index.ts
    - lib/generated/game-data.consumables.ts
    - docs/GAME-DATA-AUDIT.md
  modified:
    - lib/cla-constants.ts
    - lib/generated/game-data-overrides.json
    - lib/generated/game-data-overrides.ts
    - scripts/regen-game-data.mjs
    - lib/generated/game-data.classic-tbc.ts
    - lib/generated/game-data.wotlk.ts
    - lib/generated/game-data.cata.ts

key-decisions:
  - "Era composition precedence is Classic+TBC-FIRST (earliest-resolved era wins a collision), not the plan's literal 'later era wins' text — live wago data proved a flat later-wins merge breaks lib/cla-constants.test.ts's own pinned facts (enchant 3003, 2667; gem 32196) because the numeric id space is reused across WoW Classic-progression client builds for unrelated content (RESEARCH.md Pitfall 5, confirmed empirically). TBC-first also matches ParseForge's stated product focus. Every collision is still enumerated in docs/GAME-DATA-AUDIT.md, never silently applied."
  - "consumableNames overrides always win over a resolved SpellName value, not just when nothing resolves — required because many consumable ids resolve to a technically-real-but-uninformative buff-aura name (prefix loss, or a generic label like 'Well Fed' shared by dozens of distinct foods)."
  - "130 of 178 curated consumable ids (73%) ended up as consumableNames overrides rather than direct wago-derivation — far beyond the plan's assumption. Every override preserves the pre-regeneration, previously-verified (PR #11-era) name and carries a specific, honest source note; none is presented as wago-verified. This keeps CONSUMABLE_DB fully behaviour-preserving (a full 178-row parity check against the pre-cutover map found zero mismatches) at the cost of a lower automated-verification ratio for this one map — flagged for a future ItemSparse-based derivation pass rather than rushed under this plan's time budget."
  - "Two Cata weapon-enhancement ids (96264, 96294) resolve to a SpellName value that looks unrelated to the curated item and could not be corroborated against another era; preserved via override and explicitly flagged (in the source note, the audit doc, and .planning/WINDOWS.md) rather than trusted or silently dropped."

patterns-established:
  - "Generated-module compositors (lib/generated/index.ts) document era precedence with a full rationale comment at the top of the file, including empirical evidence for why the plan's literal precedence description doesn't hold at exhaustive-data scale — future compositors in this codebase should do the same rather than re-deriving the reasoning from git history."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "Every enchant, gem and consumable ID the analysis surfaces resolves through lib/generated/ — the four id maps the engines read are composed from generated era data plus one source-noted overrides file, with zero hand-typed rows left inside lib/cla-constants.ts"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "lib/cla-constants.test.ts (10/10, unmodified)"
        status: pass
      - kind: other
        ref: "grep gate: no non-comment `export const {ENCHANT_NAME_DB|GEM_NAME_DB|GEM_STAT_DB|CONSUMABLE_DB} = new Map` in lib/cla-constants.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 101/101)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every public symbol lib/cla-constants.ts previously exported keeps the same name and shape; no import site elsewhere (analysis-engine.ts, cla-engine.ts, raid-overview-engine.ts, api/analyze/route.ts) needed editing"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "grep gate over all 14 public symbols named in the plan's interfaces block"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 101/101 — no import-site edits made)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Consumable names are wago-verified per era where derivable; category/isSuboptimal/betterAlternative stay explicit human curation in the overrides file"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "node -e full-178-row parity check: CONSUMABLE_DB name === pre-cutover CONSUMABLE_DB name for every id"
        status: pass
      - kind: other
        ref: "node scripts/regen-game-data.mjs --report (consumable pass: 178/178 resolved, 0 floor findings)"
        status: pass
    human_judgment: true
    rationale: "130/178 consumable names are consumableNames overrides rather than direct per-era wago derivation — far more than anticipated. Values are behaviour-preserving and every override carries a specific source note, but a human should read docs/GAME-DATA-AUDIT.md's unverified-overrides section (in particular ids 96264/96294) to confirm the override ratio and the two flagged ids are acceptable, not a sign of a derivation bug that needs fixing before shipping."
  - id: D4
    description: "docs/GAME-DATA-AUDIT.md is generated by the regeneration script and lists, per era, the resolved build/product, each map's row count against its floor, every unverified override with its source note, and every id whose value changed since the previous run"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node scripts/regen-game-data.mjs --markdown docs/GAME-DATA-AUDIT.md (exit 0, idempotent apart from generation date)"
        status: pass
      - kind: other
        ref: "grep gate: header/floor/unverified/collision keywords present; 3+ distinct build-version substrings"
        status: pass
    human_judgment: true
    rationale: "D-12's 'diff reviewed' requirement is a human act, not a test assertion — the executor read the unverified and changed-values sections this session (documented in key-decisions and Deviations below), but the plan's own <human-check> instruction asks a human to confirm this too before considering ACC-01 fully satisfied."

duration: ~55min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 6: Runtime Cutover to Generated Game Data Summary

**`lib/cla-constants.ts`'s four id-to-name/stat maps are now composed at module load from three wago.tools-generated era modules plus one source-noted overrides file (`lib/generated/index.ts`), with Classic+TBC-first collision precedence — not the naive later-era-wins merge the plan described, which live data proved breaks the project's own pinned regression facts.**

## Performance

- **Duration:** ~55 min (extensive investigation phase — reading 10 large source/summary files and diagnosing real cross-era data collisions dominated the time, not the mechanical edits)
- **Started:** 2026-09-07T19:xx (approx, before first commit)
- **Completed:** 2026-09-08T02:21:39Z
- **Tasks:** 3
- **Files modified:** 10 (3 created: `lib/generated/index.ts`, `lib/generated/game-data.consumables.ts`, `docs/GAME-DATA-AUDIT.md`; 7 modified)

## Accomplishments

- **Task 1 — Consumable name generation:** Moved all 178 `CONSUMABLE_DB` curation rows (category/isSuboptimal/betterAlternative) into `lib/generated/game-data-overrides.json`'s new `consumables` key, dropping the `name` field. Extended `scripts/regen-game-data.mjs` with a consumable-name verification pass that resolves each curated id's display name directly from each era's `SpellName` table, with a row-count floor at the curation registry size (178) so a partial resolution is a hard failure. Ran it for real against live wago.tools, producing `lib/generated/game-data.consumables.ts`.
- **Task 2 — Composition and cutover:** Built `lib/generated/index.ts` as the single point deciding era precedence, and cut `lib/cla-constants.ts` down to a thin re-export — zero inline `new Map([...])` id-literals remain. All 14 public symbols the interfaces block requires stay exported with unchanged shapes; every existing import site (`lib/analysis-engine.ts`, `lib/cla-engine.ts`, `lib/raid-overview-engine.ts`, `app/api/analyze/route.ts`) works untouched. `lib/cla-constants.test.ts` passes unmodified (10/10).
- **Task 3 — Standing audit artifact:** Extended the `--markdown` report emitter (the flag itself already existed from 02-03) with a generated-file header, an era-builds table with a previous-build column, a row-count-vs-floor table, the consumable-name pass summary, an unverified-overrides section (every `UNVERIFIED_IDS` entry with its source note), and a changed-values-since-previous-run section backed by a `node_modules/.cache/regen-game-data/previous-run.json` sidecar. Re-ran the full regeneration for real and generated `docs/GAME-DATA-AUDIT.md` (1293 lines); confirmed idempotent apart from the generation timestamp.

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify every curated consumable name against client data, per era** — `188024f` (feat)
2. **Task 2: Compose the generated eras and overrides into the four maps the engines read** — `6e2a889` (feat)
3. **Task 3: Generate docs/GAME-DATA-AUDIT.md and re-run the regeneration for review** — `622064b` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `lib/generated/index.ts` - Single composition point for `ENCHANT_NAME_DB`, `GEM_NAME_DB`, `GEM_STAT_DB`, `CONSUMABLE_DB`, `UNVERIFIED_IDS`; documents and justifies Classic+TBC-first collision precedence
- `lib/generated/game-data.consumables.ts` - Generated (178 rows): per-id consumable display name, `verifiedIn` era-corroboration list
- `docs/GAME-DATA-AUDIT.md` - Generated standing review artifact (builds, row counts vs. floors, unverified overrides, changed values, cross-era collisions)
- `lib/cla-constants.ts` - Cut from ~1450 lines of inline id-map literals to a thin re-export; type declarations, `CLASS_BUFF_FAMILIES`, `EXPECTED_TALENT_POINTS`, the derived-set loop and `getAllConsumableAbilityIds` all kept unchanged
- `lib/generated/game-data-overrides.json` - Grew from 3 sourced entries to 133 (3 enchant + 130 consumable), each with a category-specific rationale
- `lib/generated/game-data-overrides.ts` - Added `ConsumableCategory`, `CONSUMABLE_CURATION`, `CONSUMABLE_NAME_OVERRIDES`; `UNVERIFIED_OVERRIDE_IDS` now unions all three override sections
- `scripts/regen-game-data.mjs` - Added the consumable-name derivation/composition pass, extended `loadOverrides()` validation to the new sections, rewrote the report builder for the full audit-doc structure, added the previous-run sidecar
- `lib/generated/game-data.classic-tbc.ts` / `.wotlk.ts` / `.cata.ts` - Re-stamped by the final real regeneration run (data unchanged from 02-03 — same builds, same row counts)

## Decisions Made

See `key-decisions` in frontmatter. Most consequential: **Classic+TBC-first collision precedence**, a deliberate reversal of the plan's literal "later era wins" text, made because that literal text is empirically false at the exhaustive-data scale this plan's own hard acceptance gate (`cla-constants.test.ts` passing unmodified) exists to catch — see Deviations below for the full reasoning and evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Era composition precedence inverted: Classic+TBC wins, not "later era wins"**
- **Found during:** Task 2, first `npx vitest run lib/cla-constants.test.ts` against a naive later-wins composition
- **Issue:** The plan's action text directs composing eras "Classic and TBC, then WotLK, then Cata, so a later era wins a colliding id," asserting this "changes no resolved value." Empirically false: enchant id 3003 is "Glyph of Ferocity" (TBC) but "Arcanum of Ferocity" (WotLK, an unrelated item reusing the id); gem id 32196 is "Runed Crimson Spinel" (TBC/WotLK) but "Brilliant Crimson Spinel" (Cata, unrelated); enchant id 2667 is "Savagery" (TBC) but "Savagery (+70 Attack Power)" (WotLK/Cata, a genuinely different, later item). A naive later-wins merge silently replaced all three pinned facts with the wrong value, failing the test.
- **Fix:** Composed with earliest-resolved-era winning instead (Classic+TBC beats WotLK beats Cata for a colliding id); overrides still win over any era. Documented extensively in `lib/generated/index.ts`'s header comment with the empirical evidence, and in `.planning/WINDOWS.md`.
- **Files modified:** `lib/generated/index.ts`
- **Verification:** `npx vitest run lib/cla-constants.test.ts` — 10/10 passing. Every enchant/gem cross-era collision is still enumerated in `docs/GAME-DATA-AUDIT.md` (809 enchant, 295 gem), never silently applied.
- **Committed in:** `6e2a889` (Task 2 commit)

**2. [Rule 1 - Bug] Consumable-name derivation needed far more override coverage than scoped — 130/178 ids, not the ~38 Task 1 anticipated**
- **Found during:** Task 1's `--report` run (38 ids with zero era-resolvable name — all pre-Anniversary Classic or MoP-out-of-scope ids, expected) and Task 2's `cla-constants.test.ts` run (a further 92 ids whose *resolved* name diverged from the pinned/curated value)
- **Issue:** Direct `SpellName.Name_lang` per-id lookup produces the raw in-game buff-aura label, which for ~52% of curated consumables differs from the item's curated display name in one of three ways: (a) 26 ids — the client omits the "Elixir of "/"Flask of " item-type prefix present on the item itself (e.g. `id 11334`: item "Elixir of Greater Agility", buff aura "Greater Agility"); (b) 54 ids, mostly food buffs plus a few weapon enhancements — many distinct items share one generic buff-aura name (`id 33254` "Well Fed (Ravager Dog)" → generic "Well Fed", shared by ~30 other foods) or the buff-effect name diverges from the item's flavor name (`id 11348`: item "Elixir of Superior Defense", buff aura "Greater Armor"); (c) 2 ids (`96264`, `96294`, Cata weapon enhancements) whose resolved value ("Enchant Bracer - Agility", "Chains of Ice") looks unrelated to the curated item and could not be corroborated against any other regenerated era.
- **Fix:** Added `consumableNames` overrides for all 92, each with a category-specific source note explaining the divergence class, preserving the pre-regeneration (PR #11-era) verified name. Also fixed `regen-game-data.mjs`'s override precedence so a `consumableNames` override wins even when an era DOES resolve *something* (previously it only served as a fallback for "nothing resolved" — insufficient for cases (a) and (b) above, where a value resolves but is the wrong one to display).
- **Files modified:** `lib/generated/game-data-overrides.json`, `scripts/regen-game-data.mjs`
- **Verification:** Full 178-row parity check (`CONSUMABLE_DB.get(id).name === pre-cutover name` for every id) — zero mismatches. `npx vitest run lib/cla-constants.test.ts` 10/10; `npm test` 101/101.
- **Committed in:** `188024f` (Task 1, the initial 38) and `6e2a889` (Task 2, the additional 92)

**3. [Rule 2 - Missing Critical] Extended `loadOverrides()`'s fatal validation to the new `consumables`/`consumableNames` sections**
- **Found during:** Task 1, adding the `consumables` section to the overrides JSON
- **Issue:** The pre-existing `loadOverrides()` fatal check (mirrors `token-audit.mjs`'s allowlist-reason check) only validated `enchantNames`/`gemNames` source notes. Without extending it, an unsourced or malformed `consumables`/`consumableNames` entry could reach the generator silently.
- **Fix:** Extended the unconditional fatal check to validate every `consumables` entry's `category` (against the 6-member enum), `isSuboptimal` (boolean) and `source` (non-empty string), and every `consumableNames` entry's `source`/`value`.
- **Files modified:** `scripts/regen-game-data.mjs`
- **Verification:** Machine `<verify>` script for Task 1 (category/isSuboptimal/source checks over all 178 rows) passes.
- **Committed in:** `188024f` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 correctness fixes required to keep the cutover genuinely behaviour-preserving per the plan's own hard acceptance gate, 1 missing-validation fix mirroring an existing established pattern).
**Impact on plan:** All three were necessary — a literal implementation of the plan's composition-order text would have shipped three known-wrong game-data values, and a literal implementation of "resolve names via SpellName lookup" alone would have shipped uninformative/wrong consumable names for over half the curated set. No scope creep: the fixes stayed inside the four maps and the overrides file this plan already owned.

## Issues Encountered

None beyond the documented deviations above. wago.tools was reachable throughout; no auth gates encountered. The CSV cache from 02-03's prior run was reused for most iterations (`--offline`/cached fetches); the final Task 3 run hit the network live and resolved identical builds.

## Known Stubs

None — every id CONSUMABLE_DB/ENCHANT_NAME_DB/GEM_NAME_DB/GEM_STAT_DB surfaces resolves to a real, either wago-verified or explicitly source-noted value; no placeholder/mock data paths were introduced. The two flagged-but-unresolved-mismatch ids (96264, 96294) are NOT stubs — they resolve to a real (pre-existing, previously-verified) value; they are flagged in the override source note, the audit doc, and `.planning/WINDOWS.md` as needing a future verification pass, not as missing functionality.

## Threat Flags

None beyond what the plan's own threat model already covers (T-02-18/T-02-19/T-02-20, all mitigated per this plan's implementation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `lib/cla-constants.ts`'s public surface is fully composed from generated data; plan 02-08's `lib/cla-engine.test.ts` snapshots can be taken against this data with confidence it is behaviour-preserving (a full 178-row consumable parity check plus the pre-existing enchant/gem pinned tests all pass).
- **Follow-up recommended, not blocking:** consider a future plan implementing an `ItemSparse`-based (item display name) derivation path for consumables, to reduce the 130/178 override ratio — the current override-heavy outcome is honest and behaviour-preserving but leaves less of `CONSUMABLE_DB` machine-verified against fresh client data than `ENCHANT_NAME_DB`/`GEM_NAME_DB` achieve.
- **Human review recommended:** `docs/GAME-DATA-AUDIT.md`'s unverified-overrides section, specifically consumable ids `96264`/`96294`, whose resolved SpellName value could not be corroborated and looks unrelated to the curated item.
- No blockers for plan 02-08.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*

## Self-Check: PASSED

Verified on disk: `lib/generated/index.ts`, `lib/generated/game-data.consumables.ts`, `docs/GAME-DATA-AUDIT.md` (all `[ -f ]` present). All three task commits (`188024f`, `6e2a889`, `622064b`) present in `git log --oneline --all`. Re-ran `npx vitest run lib/cla-constants.test.ts` (10/10), `npm test` (101/101), `npx tsc --noEmit` (clean), and `node scripts/regen-game-data.mjs --report` (0 floor findings, 178/178 consumables resolved) — all consistent with the results recorded above.
