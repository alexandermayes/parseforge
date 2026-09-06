---
phase: 01-foundation-themes-consent
plan: 06
subsystem: ui
tags: [design-tokens, oklch, wcag, tailwind-v4, audit-script, vitest]

requires:
  - phase: 01-05
    provides: "--class-*/--role-* paired light/dark tokens, the classColor()/roleColor()/roleColorAlpha() resolution-helper pattern, and lib/constants.ts's CLASS_COLORS_HEX/ROLE_COLORS_HEX Satori-only mirror convention this plan's allowlist rule extends"
provides:
  - "scripts/token-audit.mjs — a repeatable hardcoded-colour audit (palette-class + raw-hex findings, reasoned allowlist, @theme category inventory) with default/--report/--markdown modes"
  - "Six paired --tier-*/--color-tier-* performance-tier tokens in app/globals.css, generating text-tier-*/bg-tier-*/border-tier-* Tailwind utilities"
  - "GRADE_COLORS/percentileColor/percentileBg in lib/constants.ts rewritten to emit tier-token classes instead of Tailwind palette shades"
affects: [01-07]

actuals:
  tokens: 5544
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Declaration-scoped allowlisting: token-audit.mjs tracks the current top-level `const`/`function` identifier per line so an allowlist rule can key off \"any declaration ending in _HEX\" rather than a fixed line range — survives future additions to the Satori-hex-mirror family without a script edit"
    - "L-only OKLCH binary search (holding hue+chroma fixed) to retune a single light-mode tier's lightness to a target WCAG contrast ratio — same family of technique as 01-05's HSL-lightness search, adapted to stay in OKLCH space since these tokens were already authored in oklch()"

key-files:
  created:
    - scripts/token-audit.mjs
  modified:
    - scripts/theme-parity.mjs
    - package.json
    - app/globals.css
    - lib/constants.ts
    - lib/constants.test.ts

key-decisions:
  - "Retuned the artifact tier's light-mode lightness from the plan's proposed oklch(0.58 0.15 85) to oklch(0.545 0.15 85) after measuring the proposed value at 4.07:1 against the light --background — below the 4.5:1 AA floor. An L-only binary search holding hue (85) and chroma (0.15) fixed found L=0.5555 as the exact 4.5:1 crossover; landed on 0.545 for a ~4.70:1 margin, matching 01-05's established target margin for retuned tokens. The other five proposed tier values (legendary/epic/rare/uncommon/common) all cleared 4.5:1 as given (4.82:1–7.02:1) and were used verbatim."
  - "token-audit.mjs's allowlist keys off two rule shapes — a whole-file match (app/og/route.tsx) and a declaration-identifier-suffix match (_HEX in lib/constants.ts) — rather than a flat list of allowlisted line numbers, so the allowlist stays correct as the file's line numbers shift in later plans"
  - "The reason-required allowlist check (T-01-17) is enforced as a FATAL script-integrity error (exit 2) independent of --report/default mode, mirroring theme-parity.mjs's unparseable-stylesheet FATAL pattern — an unwritten reason is a script misconfiguration, not a gate-relevant finding that --report's \"always exit 0\" should suppress"

patterns-established:
  - "token-audit.mjs's ALLOWLIST array (appliesTo predicate + label + reason) is the canonical extension point for any future documented raw-color exception — add an entry here, never a scanner skip-list keyed on line ranges"

requirements-completed: [DSGN-01]

coverage:
  - id: D1
    description: "scripts/token-audit.mjs exists as a repeatable, fail-first-proven audit: walks app/, components/, lib/ for palette-class and raw-hex findings, reports the @theme category inventory (colour/radius/font/spacing/motion/elevation), enforces a non-empty reason on every allowlist entry (FATAL exit 2 otherwise), and supports default (gate)/--report (always exit 0)/--markdown modes"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "npm run token-audit -- --report exits 0 and lists 76 palette-class findings pre-sweep; npm run token-audit exits 1 pre-sweep; report names app/og/route.tsx and the _HEX declarations as allowlisted with reasons; @theme category inventory shows all four required categories present"
        status: pass
    human_judgment: false
  - id: D2
    description: "Six --tier-* tokens (artifact/legendary/epic/rare/uncommon/common) declared in both :root and .dark, plus matching --color-tier-* @theme entries; .dark values are byte-identical to the Tailwind 400-shades the functions emitted before this plan; :root values clear WCAG AA 4.5:1 against the light background (one retuned, see Decisions); theme-parity.mjs's THEME_DIVERGENT extended with all six"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "sed block-count checks (6/6/6) on app/globals.css; npm run theme-parity exits 0; OKLab->linear-sRGB contrast script (see ratio table below)"
        status: pass
    human_judgment: true
    rationale: "The measured contrast ratios use the same manually-implemented OKLab->linear-sRGB conversion as 01-04/01-05's tables, not a browser DevTools contrast checker — correct within the precision needed to clear or fail 4.5:1, but a live-browser confirmation of the artifact/legendary badge legibility on real analysis-view routes is deferred to the end-of-phase human-verify sweep per workflow.human_verify_mode=end-of-phase."
  - id: D3
    description: "GRADE_COLORS, percentileColor and percentileBg rewritten to emit tier-token utilities with unchanged signatures/thresholds/three-utility shape; lib/constants.test.ts covers all five <behavior> rows; lib/constants.ts reports zero palette-class findings; app/og/route.tsx's GRADE_HEX Satori mirror is untouched"
    requirement: "DSGN-01"
    verification:
      - kind: unit
        ref: "lib/constants.test.ts (14 tests, 8 new) — npx vitest run lib/constants.test.ts"
        status: pass
      - kind: other
        ref: "npm run token-audit -- --report | grep 'lib/constants.ts' | grep -c 'palette-class' -> 0; npx tsc --noEmit; npm test (59/59); grep -q GRADE_HEX app/og/route.tsx"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 6: Token-Audit Command & Tier-Token Colour Helpers Summary

**`scripts/token-audit.mjs` gives DSGN-01 a repeatable, fail-first-proven definition of "hardcoded colour," and `GRADE_COLORS`/`percentileColor`/`percentileBg` — the largest single concentration of hardcoded Tailwind palette shades, hiding inside functions a JSX-only grep would miss — now emit six paired `--tier-*` performance tokens instead.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-06T22:37:11Z
- **Completed:** 2026-09-06T22:44:33Z
- **Tasks:** 3 completed
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Built `scripts/token-audit.mjs`: a zero-dependency ESM node script walking `app/`, `components/` and `lib/` for `.ts`/`.tsx` files, reporting `palette-class` findings (Tailwind palette family + numeric shade utilities) and `raw-hex` findings (six-digit hex literals), against a reasoned allowlist (`app/og/route.tsx` whole-file, and any `lib/constants.ts` declaration whose identifier ends in `_HEX`). An allowlist entry with an empty reason is a FATAL script-configuration error (exit 2), independent of mode. The script also inventories `app/globals.css`'s `@theme` categories (colour/radius/font/spacing/motion/elevation) and flags any of the four DSGN-01-required categories (colour/spacing/motion/elevation) that are absent. Proven fail-first: ran against the pre-sweep codebase and found 154 total findings (76 palette-class, 78 raw-hex), 122 non-allowlisted — `npm run token-audit` exits 1, `--report` prints the same findings at exit 0.
- Added six paired `--tier-artifact`/`--tier-legendary`/`--tier-epic`/`--tier-rare`/`--tier-uncommon`/`--tier-common` tokens to both `:root` and `.dark` in `app/globals.css`, plus matching `--color-tier-*` `@theme inline` entries so Tailwind generates `text-tier-*`/`bg-tier-*`/`border-tier-*` utilities. `.dark` values are the exact Tailwind 400-shade OKLCH values the three functions emitted before this plan (bit-identical dark rendering). `:root` values are a WCAG AA light-mode tuning pass; retuned the artifact tier's lightness after the plan's proposed value measured below the 4.5:1 floor (see Decisions). Extended `scripts/theme-parity.mjs`'s `THEME_DIVERGENT` allow-list with all six tokens — `npm run theme-parity` exits 0.
- Rewrote `GRADE_COLORS`, `percentileColor` and `percentileBg` in `lib/constants.ts` (TDD: RED commit adds 8 failing tests covering all five `<behavior>` rows, GREEN commit implements) to return tier-token class names instead of Tailwind palette shades, keeping every exported name, signature, and threshold identical. `lib/constants.ts` now reports zero `palette-class` findings (was 38); `app/og/route.tsx`'s `GRADE_HEX` Satori mirror is untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the token-audit command and prove it fails against the current codebase** - `7317626` (feat)
2. **Task 2: Add paired performance-tier tokens for the grade and percentile scales** - `08e047f` (feat)
3. **Task 3: Move GRADE_COLORS, percentileColor and percentileBg onto the tier tokens** - RED `36e9aef` (test) -> GREEN `8ba895a` (feat)

**Plan metadata:** pending (this commit)

_Note: Task 3 carried `tdd="true"` and produced separate RED/GREEN commits — no REFACTOR commit was needed, the GREEN implementation was already minimal._

## Files Created/Modified

- `scripts/token-audit.mjs` - New: hardcoded-colour audit script (palette-class + raw-hex findings, reasoned allowlist, @theme category inventory, default/--report/--markdown modes)
- `package.json` - `token-audit` npm script added
- `app/globals.css` - Added 6 `--tier-*` tokens to `:root`/`.dark` and 6 `--color-tier-*` `@theme` entries
- `scripts/theme-parity.mjs` - `THEME_DIVERGENT` extended with the 6 tier tokens
- `lib/constants.ts` - `GRADE_COLORS`/`percentileColor`/`percentileBg` rewritten to emit tier-token classes
- `lib/constants.test.ts` - 8 new tests covering the tier-token behavior contract

## Measured WCAG AA Contrast Ratios (light theme, tier tokens)

Computed with the same manually-implemented OKLab→linear-sRGB WCAG relative-luminance method as 01-04/01-05-SUMMARY.md, against the light `--background` (`oklch(0.98 0.006 270)`, relative luminance 0.94096).

| Tier | Light-mode oklch | Contrast | AA (4.5:1) | Note |
|---|---|---|---|---|
| **Artifact** | `oklch(0.545 0.15 85)` | **4.70:1** | PASS | Retuned — plan's proposed `oklch(0.58 0.15 85)` measured 4.07:1 (FAIL); L-only binary search (hue/chroma fixed) found the 4.5:1 crossover at L=0.5555, landed at L=0.545 for margin |
| Legendary | `oklch(0.55 0.17 56)` | 4.82:1 | PASS | Plan's proposed value used verbatim |
| Epic | `oklch(0.48 0.2 305)` | 6.87:1 | PASS | Plan's proposed value used verbatim |
| Rare | `oklch(0.5 0.16 255)` | 5.74:1 | PASS | Plan's proposed value used verbatim |
| Uncommon | `oklch(0.5 0.15 152)` | 5.18:1 | PASS | Plan's proposed value used verbatim |
| Common | `oklch(0.45 0.02 261)` | 7.02:1 | PASS | Plan's proposed value used verbatim |

All six clear WCAG AA 4.5:1. Not a browser DevTools check — a live-browser confirmation is deferred to the end-of-phase human-verify sweep (see Next Phase Readiness).

## Decisions Made

- Retuned the artifact tier's `:root` lightness from the plan's proposed `oklch(0.58 0.15 85)` (measured 4.07:1, below AA) to `oklch(0.545 0.15 85)` (4.70:1) via an L-only OKLCH binary search holding hue and chroma fixed — see the ratio table above. The other five proposed tier values all cleared 4.5:1 as given.
- `token-audit.mjs`'s allowlist is a small predicate-based rule set (whole-file match, declaration-identifier-suffix match) rather than a line-number skip-list, so it stays correct as line numbers shift in future plans (notably 01-07's component sweep, which won't touch `lib/constants.ts`'s `_HEX` maps but will touch many other files this script scans).
- The allowlist's "reason required" check is enforced as a FATAL exit (code 2), independent of `--report` mode's "always exit 0" — an unwritten reason is a script-configuration defect, not a gate-relevant finding that inspection mode should silently pass through.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Retuned the artifact tier's light-mode lightness to actually clear WCAG AA**
- **Found during:** Task 2 (adding paired performance-tier tokens)
- **Issue:** The plan's proposed `:root` value for the artifact tier, `oklch(0.58 0.15 85)`, measured 4.07:1 against the light `--background` — below the 4.5:1 AA floor the plan's own acceptance criteria and threat T-01-19 require. Threshold T-01-19 explicitly calls out "an under-contrast tier colour makes grade badges and percentile figures unreadable in light mode."
- **Fix:** Ran an L-only OKLCH binary search (holding hue=85, chroma=0.15 fixed, mirroring 01-05's HSL-lightness retuning pattern) to find the 4.5:1 crossover point (L≈0.5555), then set `--tier-artifact` in `:root` to `oklch(0.545 0.15 85)` for a ~4.70:1 margin consistent with 01-05's target margin for retuned tokens.
- **Files modified:** `app/globals.css`
- **Verification:** Contrast script re-run confirms 4.70:1; `npm run theme-parity` exits 0.
- **Committed in:** `08e047f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — accessibility threshold).
**Impact on plan:** Necessary to satisfy the plan's own stated WCAG AA requirement and the T-01-19 mitigation it exists to prove; no scope creep — the fix is a single token value, using the exact retuning technique 01-05 already established as this codebase's convention.

## Issues Encountered

None beyond the retuning above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The audit gate and the tier-token colour foundation DSGN-01 requires are both in place: `npm run token-audit -- --report` exits 0 and lists a reasoned, non-empty allowlist plus a non-empty worklist; `npm run theme-parity` exits 0; `npx vitest run lib/constants.test.ts` exits 0 (14/14); `npx tsc --noEmit` and `npm test` both pass (59/59); `npm run token-audit` (default/gate mode) still exits non-zero — 83 non-allowlisted findings remain in `app/`/`components/`, all now outside `lib/constants.ts`, which is exactly the worklist plan 01-07's component sweep is scoped to close to zero.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`): a live-browser confirmation that grade badges and percentile figures render legibly with the new tier tokens in both themes on real analysis-view routes — no automated harness exists for this (consistent with 01-04/01-05's same deferral pattern). Not logged as a new `.planning/WINDOWS.md` entry since it will be covered by the same end-of-phase visual sweep already tracked for 01-04/01-05's deferred checks, and this plan's own component consumers of `GRADE_COLORS`/`percentileColor`/`percentileBg` are unchanged (same call sites, same three-class shape) — only the values they read from `lib/constants.ts` changed.

**Known limitation, not a stub:** `npm run token-audit` intentionally still exits non-zero at the end of this plan — the 83 remaining `palette-class`/`raw-hex` findings across `app/` and `components/` are the explicit worklist for plan 01-07, per this plan's own `<verification>` block.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- `scripts/token-audit.mjs` — FOUND, runs via `node scripts/token-audit.mjs`
- `package.json` — FOUND (`token-audit` script present)
- `app/globals.css` — FOUND (6/6 `--tier-*` in `:root`, 6/6 in `.dark`, 6/6 `--color-tier-*`)
- `scripts/theme-parity.mjs` — FOUND (`THEME_DIVERGENT` extended with 6 tier tokens)
- `lib/constants.ts` — FOUND (`GRADE_COLORS`/`percentileColor`/`percentileBg` emit tier-token classes; `GRADE_COLORS`/`percentileColor`/`percentileBg` names/signatures unchanged)
- `lib/constants.test.ts` — FOUND (14 tests, all passing)
- Commit `7317626` — FOUND in `git log`
- Commit `08e047f` — FOUND in `git log`
- Commit `36e9aef` (test/RED) — FOUND in `git log`, precedes GREEN
- Commit `8ba895a` (feat/GREEN) — FOUND in `git log`
- `npm run token-audit -- --report` — re-run clean, exit 0, names `app/og/route.tsx` and `_HEX` declarations as allowlisted with reasons
- `npm run token-audit` — re-run clean, exit 1 (83 non-allowlisted findings remain, all outside `lib/constants.ts`)
- `npm run theme-parity` — re-run clean, exit 0
- `npx vitest run lib/constants.test.ts` — re-run clean, 14/14 passed
- `npm test` — re-run clean, 7 files / 59 tests passed
- `npx tsc --noEmit` — re-run clean, exit 0
- Per-file `npx eslint` on all touched source files (`scripts/token-audit.mjs`, `scripts/theme-parity.mjs`, `lib/constants.ts`, `lib/constants.test.ts`) — 0 findings (full-repo `npm run lint` still reports the pre-existing `.codex/` scaffolding debt documented in 01-04's `deferred-items.md`, unrelated to this plan)
- Task 1, 2, and 3 acceptance criteria — re-verified, all pass
- `app/og/route.tsx` — FOUND, `GRADE_HEX` untouched
