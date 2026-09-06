---
phase: 01-foundation-themes-consent
plan: 05
subsystem: ui
tags: [css, design-tokens, oklch, wcag, wow-class-colors, satori]

requires:
  - phase: 01-04
    provides: "Designed ParseForge light :root palette, spacing/motion/elevation @theme categories, and scripts/theme-parity.mjs (the parity+divergence gate this plan extends)"
provides:
  - "--class-*/--role-* paired light/dark CSS custom-property tokens in app/globals.css (D-12)"
  - "lib/constants.ts split into token maps (CLASS_COLORS/ROLE_COLORS, var() references) and Satori-only hex twins (CLASS_COLORS_HEX/ROLE_COLORS_HEX)"
  - "classColor()/roleColor()/roleColorAlpha() resolution helpers replacing direct map indexing and hex+alpha-suffix string concatenation"
  - "scripts/theme-parity.mjs THEME_DIVERGENT extended to guard the at-risk class/role tokens"
affects: [01-06, 01-07]

actuals:
  tokens: 6144
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "HSL-lightness binary search (scratch script, not committed) to tune a starting hex value down to a target WCAG contrast ratio while holding hue fixed — used where the plan's proposed starting hex fell short of 4.5:1"
    - "roleColor()/classColor() as the single read path for a themed color map, keeping the underlying Record an internal implementation detail no consumer indexes directly"

key-files:
  created:
    - lib/constants.test.ts
  modified:
    - app/globals.css
    - scripts/theme-parity.mjs
    - lib/constants.ts
    - app/og/route.tsx
    - app/components/RoleBadge.tsx
    - app/components/RaidOverview.tsx
    - app/components/AnalysisView.tsx
    - app/components/PlayerSelector.tsx
    - app/components/PlayerQuickGrid.tsx
    - app/components/PlayerAccordionRow.tsx
    - app/components/CLABuffComparison.tsx
    - app/components/CLABuffTable.tsx
    - app/analyze/[reportCode]/ReportSummary.tsx

key-decisions:
  - "Retuned 6 of the plan's 16 proposed starting hex values (Paladin, Hunter, Rogue, Mage, Healer, Physical) via a binary-search HSL-lightness script after measuring they fell short of WCAG AA 4.5:1 against the new light --background (measured 3.76-4.33:1); held hue and boosted saturation slightly, landing all six at ~4.70:1"
  - "Added roleColor(role) — not in the plan's artifact list — because Task 3's own automated verify command forbids any `ROLE_COLORS[` occurrence under app/, which conflicts with its action text's 'the solid color reads the role token directly'. Mirrors classColor() so the map itself stays an internal implementation detail"
  - "Used raw hex literals (not oklch()) for both :root and .dark class/role token values — the plan explicitly requires .dark to be the exact CLASS_COLORS/ROLE_COLORS hex verbatim, and using hex for :root too avoided an extra oklch-conversion step for the tuned light values"

patterns-established:
  - "Tuning a starting light-mode color: convert to HSL, hold hue, binary-search lightness (light saturation boost as needed) until the target contrast ratio against --background is met — reusable for any future per-theme color needing a WCAG-driven light variant"

requirements-completed: [DSGN-01]

coverage:
  - id: D1
    description: "app/globals.css :root and .dark each declare 12 --class-* tokens (11 classes + default) and 4 --role-* tokens; .dark values are byte-identical to lib/constants.ts's shipped hex; scripts/theme-parity.mjs THEME_DIVERGENT extended with the 4 role tokens plus --class-priest/rogue/paladin/hunter/monk/default"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "sed block-count checks (12/12/4/4) on app/globals.css; npm run theme-parity exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "lib/constants.ts exports CLASS_COLORS/ROLE_COLORS as var() reference maps, CLASS_COLORS_HEX/ROLE_COLORS_HEX as raw-hex Satori twins, and classColor()/roleColor()/roleColorAlpha() resolution helpers; app/og/route.tsx imports CLASS_COLORS_HEX and keeps GRADE_HEX untouched"
    requirement: "DSGN-01"
    verification:
      - kind: unit
        ref: "lib/constants.test.ts (6 tests) — npx vitest run lib/constants.test.ts"
        status: pass
      - kind: other
        ref: "awk block-count checks (11/11/4/4) on lib/constants.ts; grep for CLASS_COLORS_HEX/GRADE_HEX in app/og/route.tsx; npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "9 DOM consumer components resolve class/role color through classColor()/roleColor()/roleColorAlpha() instead of indexing CLASS_COLORS/ROLE_COLORS directly; app/og/route.tsx (the Satori exception) is untouched by this task"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "grep for zero CLASS_COLORS[/ROLE_COLORS[ occurrences under app/; classColor( in exactly 8 files; roleColorAlpha( in RoleBadge.tsx and RaidOverview.tsx; npx tsc --noEmit && npm run lint (per-file) && npm test all pass"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full-route light/dark visual legibility of class colors (Priest/Rogue/Paladin in particular), role-badge translucent tint, and an intact Open Graph card after the Satori hex path change"
    verification: []
    human_judgment: true
    rationale: "Requires a live browser to judge actual rendered legibility and the Discord/OG unfurl — deferred to the phase's end-of-phase human-verify sweep per workflow.human_verify_mode=end-of-phase (config.json). Logged as an open unrun-verify entry in .planning/WINDOWS.md (id 1) so it stays visible at ship time."

duration: ~35min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 5: Per-Theme WoW Class & Role Colors Summary

**The 11 WoW class colours and 4 role colours ship as paired `--class-*`/`--role-*` light/dark CSS custom properties (D-12), with `lib/constants.ts` split into token maps and a documented Satori-only hex mirror, and all 9 DOM consumers repointed at `classColor()`/`roleColor()`/`roleColorAlpha()` helpers — closing the single largest light-mode legibility risk (Priest as pure white, Rogue as near-yellow) in the analysis tables.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-06T22:15:00Z (approx.)
- **Completed:** 2026-09-06T22:35:00Z (approx.)
- **Tasks:** 3 completed
- **Files modified:** 13 (1 created, 12 modified)

## Accomplishments

- Added 12 `--class-*` and 4 `--role-*` paired custom properties to both `app/globals.css`'s `:root` and `.dark` blocks. `.dark` values are the exact hex `CLASS_COLORS`/`ROLE_COLORS` shipped before this plan, verbatim. `:root` values are a Wowhead-style tuning pass: same recognizable hue, adjusted lightness/saturation for WCAG AA 4.5:1 against the new light `--background`.
- Extended `scripts/theme-parity.mjs`'s `THEME_DIVERGENT` allow-list with the 4 role tokens and the 6 class tokens (`priest`, `rogue`, `paladin`, `hunter`, `monk`, `default`) whose dark value is demonstrably unusable on light — the gate now guards D-12 the same way it guards the brand palette.
- Split `lib/constants.ts`: `CLASS_COLORS`/`ROLE_COLORS` now hold `var(--class-*)`/`var(--role-*)` references; `CLASS_COLORS_HEX`/`ROLE_COLORS_HEX` are the documented raw-hex twins `next/og`'s Satori renderer needs (it has no CSS engine and cannot resolve custom properties). Added `classColor()`, `roleColor()`, and `roleColorAlpha()` resolution helpers plus `lib/constants.test.ts` (6 tests) covering the unknown-class fallback and the token/hex-map shape invariants.
- Repointed all 9 DOM consumers (`RoleBadge`, `RaidOverview`, `AnalysisView`, `PlayerSelector`, `PlayerQuickGrid`, `PlayerAccordionRow`, `CLABuffComparison`, `CLABuffTable`, `ReportSummary`) at the new helpers, replacing direct map indexing and the hex+alpha-suffix string concatenation that would silently break the moment a color value became a `var()` reference.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add paired class and role colour tokens and extend the parity gate** - `423fe8a` (feat)
2. **Task 2: Split lib/constants.ts into token maps and Satori-only hex maps** - `245abc6` (feat)
3. **Task 3: Repoint every DOM consumer at the resolution helpers** - `4d8f53c` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified

- `app/globals.css` - Added `--class-*`/`--role-*` paired tokens to `:root` and `.dark`
- `scripts/theme-parity.mjs` - Extended `THEME_DIVERGENT` with role + at-risk class tokens
- `lib/constants.ts` - `CLASS_COLORS`/`ROLE_COLORS` → token maps; `CLASS_COLORS_HEX`/`ROLE_COLORS_HEX` added; `classColor()`/`roleColor()`/`roleColorAlpha()` helpers added
- `lib/constants.test.ts` - New: 6 vitest cases covering the resolution helpers and map-shape invariants
- `app/og/route.tsx` - Imports `CLASS_COLORS_HEX` instead of `CLASS_COLORS`; comment extended to note it's the same documented Satori exception as `GRADE_HEX`
- `app/components/RoleBadge.tsx` - `roleColor()`/`roleColorAlpha(role, 20)`
- `app/components/RaidOverview.tsx` - `roleColor()`/`roleColorAlpha(role, 15)` for the role-count badges; `classColor()` in `HealerPanel`, `DeathTimeline`, `PlayerRow`
- `app/components/AnalysisView.tsx` - `classColor()` (local var renamed `playerColor` to avoid shadowing the imported function)
- `app/components/PlayerSelector.tsx` - `classColor()` for both the dot and label color reads
- `app/components/PlayerQuickGrid.tsx` - `classColor()` (local var renamed `playerColor`)
- `app/components/PlayerAccordionRow.tsx` - `classColor()` (local var renamed `playerColor`)
- `app/components/CLABuffComparison.tsx` - `classColor()` (local var renamed `playerColor`)
- `app/components/CLABuffTable.tsx` - `classColor()` (local var renamed `playerColor`)
- `app/analyze/[reportCode]/ReportSummary.tsx` - `classColor()` for the roster list

## Measured WCAG AA Contrast Ratios (light theme, class/role tokens)

Computed with the same manually-implemented OKLab→linear-sRGB WCAG relative-luminance method as 01-04-SUMMARY.md, against the light `--background` (`oklch(0.98 0.006 270)`, relative luminance 0.94096). The plan's proposed starting hex values were used as a first pass; 6 of 16 fell short of 4.5:1 and were retuned via an HSL-lightness binary search holding hue fixed (see Decisions).

| Class/Role | Final hex (light) | Contrast | AA (4.5:1) | Note |
|---|---|---|---|---|
| **Priest** | `#5A5A6E` | **6.35:1** | PASS | Highest-risk class (was pure `#FFFFFF`) — plan's starting value passed as-is |
| **Rogue** | `#7E7000` | **4.70:1** | PASS | Highest-risk class (was `#FFF569`) — retuned from plan's `#8A7B00` (4.03:1) |
| **Paladin** | `#C93376` | **4.70:1** | PASS | Highest-risk class (was `#F58CBA`) — retuned from plan's `#C4487F` (4.33:1) |
| Warrior | `#8A6A44` | 4.69:1 | PASS | Plan's starting value |
| Hunter | `#4F7C20` | 4.70:1 | PASS | Retuned from plan's `#5E8C2E` (3.76:1) |
| Shaman | `#0057AB` | 6.72:1 | PASS | Plan's starting value |
| Mage | `#14789D` | 4.70:1 | PASS | Retuned from plan's `#1D7FA3` (4.29:1) |
| Warlock | `#6350A0` | 6.22:1 | PASS | Plan's starting value |
| Druid | `#B35400` | 4.74:1 | PASS | Plan's starting value |
| DeathKnight | `#A0142C` | 7.53:1 | PASS | Plan's starting value |
| Monk | `#00805A` | 4.68:1 | PASS | Plan's starting value |
| Default | `#4A4A57` | 8.23:1 | PASS | Plan's starting value |
| Tank | `#1D5FBF` | 5.76:1 | PASS | Plan's starting value |
| Healer | `#158043` | 4.70:1 | PASS | Retuned from plan's `#1E8A4C` (4.13:1) |
| Caster | `#7A34C4` | 6.36:1 | PASS | Plan's starting value |
| Physical | `#956700` | 4.70:1 | PASS | Retuned from plan's `#A06E00` (4.19:1) |

All 16 clear WCAG AA 4.5:1. Not a browser DevTools check — a live-browser confirmation is deferred to the end-of-phase human-verify sweep (see Next Phase Readiness).

## Decisions Made

- Retuned 6 of the plan's 16 proposed starting hex values (see table above) using a binary-search HSL-lightness script after measuring they fell short of 4.5:1 — held hue, allowed a small saturation boost, targeted ~4.70:1 for a comfortable margin over the floor.
- Used raw hex literals for both `:root` and `.dark` class/role token values, not `oklch()` — the plan requires `.dark` to carry the exact `lib/constants.ts` hex verbatim, and using hex for `:root` too avoided an extra conversion step for values already computed in hex.
- Added `roleColor(role)` (not in the plan's artifact list) so the solid-color read in `RoleBadge`/`RaidOverview` goes through a helper rather than indexing `ROLE_COLORS` directly — see Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `roleColor()` helper to satisfy Task 3's own verify gate**
- **Found during:** Task 3 (repointing DOM consumers)
- **Issue:** The plan's Task 3 action text says "the solid `color` reads the role token directly" (implying `ROLE_COLORS[role]`), but Task 3's own automated verify command asserts `grep -rl 'ROLE_COLORS\[' app --include='*.tsx'` returns zero files — a direct contradiction. Following the action text literally would fail the plan's own gate.
- **Fix:** Added `roleColor(role: RaidRole): string` to `lib/constants.ts`, mirroring `classColor()`. `RoleBadge.tsx` and `RaidOverview.tsx` now call `roleColor(role)` for the solid color instead of indexing `ROLE_COLORS[role]`.
- **Files modified:** `lib/constants.ts`, `lib/constants.test.ts`, `app/components/RoleBadge.tsx`, `app/components/RaidOverview.tsx`
- **Verification:** `grep -rl 'ROLE_COLORS\['  app --include='*.tsx'` returns 0 files; new vitest case for `roleColor("Tank")`; `npx tsc --noEmit` passes.
- **Committed in:** `4d8f53c` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Necessary to satisfy the plan's own stated verification gate; no scope creep — `roleColor()` is a direct structural mirror of the already-planned `classColor()`.

**Also noted (not a deviation, a documented shortcut):** Task 2 carries `tdd="true"`, but the test file (`lib/constants.test.ts`) and the implementation (`lib/constants.ts` changes) were authored together in a single commit rather than as separate RED (failing test) → GREEN (passing implementation) commits. All 6 tests pass against the final implementation; the intermediate "test fails without implementation" step was not independently proven via a separate commit.

## Issues Encountered

None beyond the two items above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The class/role color token foundation D-12 requires is in place and gated: `npm run theme-parity` exits 0 (guarding the 10 at-risk class/role tokens), `npx vitest run lib/constants.test.ts` exits 0, `npx tsc --noEmit` exits 0, and no component under `app/` besides the documented `app/og/route.tsx` Satori exception indexes a color map directly.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`): Task 3's `<human-check>` — confirming in a live browser, in both themes, that Priest/Rogue/Paladin names are legible in the Raid Overview table, role badges show a visible translucent tint (not solid or invisible), the player selector/quick-grid class dots are visible, and a Discord/`/og?...` unfurl still renders the correct class color (proving the Satori hex path survived). Logged as an open `unrun-verify` entry in `.planning/WINDOWS.md` (id 1) so it stays visible through `/gsd-ship`.

**Known limitation, not a stub:** The full-route light-mode visual sweep and the Open Graph unfurl check both require a live browser/Discord — no automated harness exists for either (per 01-RESEARCH.md Open Question 3), consistent with 01-04's same deferral pattern.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- `app/globals.css` — FOUND (12/12 `--class-*`, 4/4 `--role-*` in both `:root` and `.dark`)
- `scripts/theme-parity.mjs` — FOUND (`THEME_DIVERGENT` extended)
- `lib/constants.ts` — FOUND (`CLASS_COLORS`, `CLASS_COLORS_HEX`, `ROLE_COLORS`, `ROLE_COLORS_HEX`, `classColor`, `roleColor`, `roleColorAlpha` all exported)
- `lib/constants.test.ts` — FOUND (6 tests, all passing)
- `app/og/route.tsx` — FOUND (imports `CLASS_COLORS_HEX`; `GRADE_HEX` untouched)
- 9 consumer components — FOUND, all repointed at helpers
- Commit `423fe8a` — FOUND in `git log`
- Commit `245abc6` — FOUND in `git log`
- Commit `4d8f53c` — FOUND in `git log`
- `npm run theme-parity` — re-run clean, exit 0
- `npx vitest run lib/constants.test.ts` — re-run clean, 6/6 passed
- `npm test` — re-run clean, 7 files / 51 tests passed
- `npx tsc --noEmit` — re-run clean, exit 0
- Per-file `npx eslint` on all 12 touched source files — 0 findings (full-repo `npm run lint` still reports the pre-existing `.codex/` scaffolding debt documented in 01-04's `deferred-items.md`, unrelated to this plan)
- Task 1, 2, and 3 acceptance criteria — re-verified, all pass
- `.planning/WINDOWS.md` — FOUND (1 open `unrun-verify` entry for the deferred human-check)
