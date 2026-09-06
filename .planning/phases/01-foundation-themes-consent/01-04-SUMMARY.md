---
phase: 01-foundation-themes-consent
plan: 04
subsystem: ui
tags: [tailwind-v4, theme-tokens, oklch, css, design-system]

requires:
  - phase: 01-01
    provides: "next-themes class-attribute theming (attribute=\"class\", resolved pre-paint) — this plan's :root/.dark tokens are what that toggle actually switches between"
provides:
  - "scripts/theme-parity.mjs — standing :root/.dark token parity + divergence gate (npm run theme-parity)"
  - "A designed, contrast-checked ParseForge light palette in app/globals.css :root (D-09)"
  - "@theme spacing/motion/elevation categories (--spacing, --duration-*, --ease-standard, --shadow-card, --shadow-elevated)"
  - "Every utility-class color after @layer base resolves from a custom property in both themes"
affects: [01-05, 01-06, 01-07]

actuals:
  tokens: 4500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "CSS relative-color syntax (oklch(from var(--token) l c h / N%)) to derive a differently-tuned alpha/lightness from an existing token instead of hand-writing a second literal"
    - "color-mix(in oklch, var(--surface-1) N%, transparent) for translucent glass/card surfaces, replacing hand-written oklch(<literal> / N%) backgrounds"
    - "Plain node:fs ESM script (no test framework) for a build-time stylesheet-parity gate, parsing top-level CSS blocks via local brace-depth counting"

key-files:
  created:
    - scripts/theme-parity.mjs
  modified:
    - app/globals.css
    - package.json

key-decisions:
  - "muted-foreground set to oklch(0.42 0.02 270) rather than the plan's un-specified exact value — measured at 7.11:1 against the new --muted/--secondary surface (oklch(0.94 0.008 270)), comfortably clearing WCAG AA 4.5:1 with margin for future minor palette tuning"
  - "primary-foreground (and sidebar-primary-foreground) set to true white oklch(1 0 0) rather than near-white oklch(0.985 0 0) — measured 4.88:1 against the light --primary/--gold-from (oklch(0.55 0.14 85)), a firmer margin over the 4.5:1 floor than off-white gave (4.61:1)"
  - "Where a utility class's target alpha/lightness matched a token's own baked-in value exactly (e.g. .tab-active-gold::after's shadow, .animate-shimmer's gradient stops), referenced the token directly via var() rather than wrapping it in a redundant oklch(from ...) — simpler CSS, same de-hardcoding guarantee, and it lets the token's own per-theme tuning (e.g. --glow-gold's alpha differs 40%/25% between dark/light) flow through untouched"
  - "Deferred (not fixed): npm run lint reports ~1101 pre-existing errors from .codex/ scaffolding files unrelated to this plan's file list — documented in deferred-items.md rather than touched, since fixing requires an eslint.config.mjs ignore-list change out of this plan's scope"

patterns-established:
  - "theme-parity.mjs's THEME_DIVERGENT allow-list is the canonical list of tokens that must differ between :root and .dark — any future token addition to that set (e.g. a D-12 --class-* pair) should be added to the allow-list in the same commit"

requirements-completed: [DSGN-01, DSGN-03]

coverage:
  - id: D1
    description: "scripts/theme-parity.mjs exists as a standing gate: parses top-level :root/.dark blocks, flags any .dark property missing from :root, flags any THEME_DIVERGENT token holding an identical value in both blocks, hard-fails on an unparseable stylesheet, and exposes --report (always exit 0, SAME IN BOTH: prefix) vs default (exit 1 on any violation) modes"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "npm run theme-parity -- --report | grep -c 'SAME IN BOTH:' (14, pre-edit); npm run theme-parity; test $? -ne 0 (pre-edit); npm run theme-parity (post-edit, exit 0); hard-fail path manually verified against a mutated copy of globals.css with :root renamed to notroot (exit 2, explicit FATAL message, both modes)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The :root block is a designed ParseForge light palette in the same 270 hue family as .dark: near-white bg/surfaces, white cards on a faintly tinted secondary/muted, gold accent darkened for AA-on-white, darkened status colors, an inverted surface-0..3 ramp, and dark-on-light border/input — every property .dark declares is also declared in :root, and every THEME_DIVERGENT token holds a genuinely different value in each block; .dark is byte-identical to its pre-task state"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "npm run theme-parity (exit 0); git diff confirms only the :root block changed"
        status: pass
      - kind: unit
        ref: "scratch OKLab->linear-sRGB WCAG contrast script (not committed — ad hoc verification, see ratio table below)"
        status: pass
    human_judgment: true
    rationale: "The measured contrast ratios below use a manually-implemented OKLab->linear-sRGB conversion, not a browser or a canonical contrast-checker tool — correct within the precision needed to clear or fail a 4.5:1 threshold, but a live-browser DevTools contrast check (per the plan's Task 2 <human-check>) and a full-route light-mode sweep are the authoritative confirmation, deferred to the end-of-phase human-verify sweep per workflow.human_verify_mode=end-of-phase."
  - id: D3
    description: "@theme inline gains --spacing, --duration-fast/base/slow, --ease-standard, --shadow-card, --shadow-elevated; .surface-card/.surface-card-elevated/.transition-interactive reference the new shadow/duration tokens instead of hand-writing the same values a second time"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "grep checks for all six new @theme tokens plus box-shadow: var(--shadow-card)/var(--shadow-elevated) and transition-duration: var(--duration-base) in app/globals.css"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every utility class in the region from @layer base to end of file resolves its colors from a custom property (relative-color oklch(from var(--token) ...) or a direct var() reference) — no absolute oklch( literal remains outside @keyframes' non-color values; .bar-primary/.bar-sm heights left unchanged per 01-UI-SPEC.md's explicit out-of-scope note"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "sed -n '/^@layer base/,$p' app/globals.css | grep -oE 'oklch\\([^)]*' | grep -vc 'oklch(from var(--' -> 0; npm run theme-parity && npx tsc --noEmit (both exit 0)"
        status: pass
    human_judgment: true
    rationale: "The grep proves no absolute color literal remains, but whether the resulting visuals (glassmorphism nav, hero glow, active-tab underline, progress bars, skeleton shimmer) actually look correct in both themes on real routes is a visual judgment call — deferred to the end-of-phase human-check sweep (dev server confirmed to start and render / and /tbc-audit at 200 with no CSS compile errors in the Turbopack log, but that is not the same as a human confirming the visuals read correctly)."

duration: 20min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 4: Light Palette & Design-Token Categories Summary

**A designed, WCAG-AA-checked ParseForge light theme replaces the never-styled stock shadcn `:root` values, `app/globals.css`'s `@theme` block gains spacing/motion/elevation token categories, and a new `scripts/theme-parity.mjs` gate makes "light silently inherits the dark value" a CI-catchable regression instead of a visual bug.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-06T21:44:00Z (approx., continuing directly from 01-03)
- **Completed:** 2026-09-06T22:00:00Z (approx.)
- **Tasks:** 3 completed
- **Files modified:** 3 (1 created, 2 modified) + 1 phase-doc (`deferred-items.md`)

## Accomplishments

- `scripts/theme-parity.mjs`: a zero-dependency ESM node script that parses `app/globals.css`'s top-level `:root`/`.dark` blocks via local brace-depth counting, checks parity (every `.dark` property present in `:root`) and divergence (a 38-token allow-list must differ between the two blocks), hard-fails on an unparseable stylesheet, and supports a `--report` inspection mode. Ran against the pre-edit stylesheet: found and printed 14 `SAME IN BOTH:` lines (brand tokens byte-identical across themes) — proof the gate has teeth before any value changed.
- Redesigned the `:root` block into a genuine ParseForge light palette in the same 270 hue family as `.dark`: near-white background/surfaces, white cards on a faintly tinted secondary/muted, a darkened gold accent for AA contrast on white, darkened status colors, an inverted `--surface-0..3` ramp (ascends away from the page instead of toward it — the fix for progress-bar tracks rendering near-black on white), and dark-on-light border/input at low alpha. `.dark` is byte-identical to its pre-task state.
- Extended the existing `@theme inline` block with the three token categories DSGN-01 requires — spacing (`--spacing`), motion (`--duration-fast/base/slow`, `--ease-standard`), elevation (`--shadow-card`, `--shadow-elevated`) — and pointed `.surface-card`/`.surface-card-elevated`/`.transition-interactive` at them instead of hand-writing the same values twice.
- Swept every utility class after `@layer base` so no shipped class bakes in an absolute color: `.badge-neutral`, `.surface-card(-elevated)`, `.glass(-strong)`, `.glow-gold(-sm)`, `.glow-arcane`, `.glow-border-gold`, `.hero-glow::before`, `.tab-active-gold::after`, `.progress-gradient-blue`, `.animate-shimmer`, and `@keyframes glow-pulse` now all resolve their colors from custom properties.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the theme-parity gate and prove it fails against today's stylesheet** - `e7f4bc1` (feat)
2. **Task 2: Design the ParseForge light palette in :root** - `c54855f` (feat)
3. **Task 3: Add the spacing, motion and elevation @theme categories and de-hardcode the utility classes** - `7a47e46` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified

- `scripts/theme-parity.mjs` - Standing :root/.dark token parity + divergence gate, gate mode + `--report` inspection mode
- `app/globals.css` - Redesigned `:root` light palette; `@theme` spacing/motion/elevation categories; de-hardcoded utility-class colors
- `package.json` - `theme-parity` npm script added
- `.planning/phases/01-foundation-themes-consent/deferred-items.md` - Logged the pre-existing `.codex/` lint debt discovered during verification (out of scope, not fixed)

## Measured WCAG AA Contrast Ratios (light theme)

Computed with a manually-implemented OKLab→linear-sRGB conversion and the standard WCAG relative-luminance contrast formula (not a browser DevTools check — see D2's `human_judgment` rationale for the authoritative follow-up).

| Pair | Ratio | AA (4.5:1) |
|------|-------|------------|
| `--foreground` / `--background` | 17.77:1 | PASS |
| `--foreground` / `--card` (white) | 18.82:1 | PASS |
| `--muted-foreground` (0.42) / `--muted` | 7.11:1 | PASS |
| `--gold-from` (`--primary`) / `--background` | 4.61:1 | PASS |
| `--primary-foreground` (white) / `--primary` | 4.88:1 | PASS |
| `--destructive` / `--background` | 6.02:1 | PASS |
| `--status-good` / `--background` | 4.88:1 | PASS |
| `--status-warn` / `--background` | 5.77:1 | PASS |
| `--status-bad` / `--background` | 6.29:1 | PASS |
| `--status-info` / `--background` | 5.64:1 | PASS |
| `--status-good` text / its own 15%-alpha badge fill | 4.54:1 | PASS |
| `--status-warn` text / its own 15%-alpha badge fill | 5.34:1 | PASS |
| `--status-bad` text / its own 15%-alpha badge fill | 5.82:1 | PASS |
| `--status-info` text / its own 15%-alpha badge fill | 5.23:1 | PASS |

All 14 measured pairs clear WCAG AA 4.5:1, several with only a modest margin (`--gold-from`/background at 4.61:1, `--status-good`-on-badge at 4.54:1) — flagged for the end-of-phase human sweep to double-check against a live browser contrast tool, per D2/D4's `human_judgment: true`.

## Decisions Made

- `--muted-foreground: oklch(0.42 0.02 270)` — plan gave the surface/foreground pairing principle but not an exact value; chose 0.42 lightness for a comfortable 7.11:1 margin over the 4.5:1 floor.
- `--primary-foreground: oklch(1 0 0)` (true white, not off-white) — measured 4.88:1 vs. off-white's 4.61:1 against the new gold primary, a firmer safety margin.
- Used direct `var(--token)` references (not `oklch(from ...)`) wherever a utility class's needed value matched the token's own baked-in alpha/lightness exactly (`.tab-active-gold::after`, `.animate-shimmer`) — simpler CSS with the same de-hardcoding guarantee, and it lets each token's own per-theme tuning flow through unmodified.
- `color-mix(in oklch, var(--surface-1) N%, transparent)` chosen as the translucent-surface pattern for `.surface-card(-elevated)`/`.glass(-strong)`, replacing hand-written `oklch(<literal> / N%)` — resolves per-theme automatically since `--surface-1` itself is theme-divergent.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing-critical-functionality, or blocking issues surfaced during implementation that required a Rule 1-3 auto-fix.

### Deferred (out of scope, documented, not fixed)

**1. `npm run lint` reports ~1101 pre-existing errors from `.codex/` scaffolding, unrelated to this plan**
- **Found during:** Task 2 verification (`npm run lint`)
- **Issue:** `eslint.config.mjs`'s `globalIgnores([...])` call overrides rather than extends `eslint-config-next`'s default ignore list, so ESLint also lints untracked GSD-scaffolding directories (`.codex/hooks/**`), which use `require()`-style imports the project's `@typescript-eslint/no-require-imports` rule flags. Confirmed pre-existing via `git status` — `.codex/` was untracked before any 01-04 work began.
- **Not fixed:** out of scope per the scope-boundary rule — fixing means either broadening the ignore list (an unrelated ESLint-config change) or editing GSD tooling files, neither in this plan's file list (`scripts/theme-parity.mjs`, `app/globals.css`, `package.json`).
- **Verification performed instead:** `npx eslint scripts/theme-parity.mjs` exits 0 with zero findings; `app/globals.css` is CSS and not linted by ESLint at all.
- **Logged:** `.planning/phases/01-foundation-themes-consent/deferred-items.md`

**Total deviations:** 0 auto-fixed, 1 deferred (documented, out of scope).
**Impact on plan:** None — the deferred item is pre-existing repo state unrelated to any file this plan touches; `npx tsc --noEmit`, `npm test`, and `npm run theme-parity` all pass clean.

## Issues Encountered

None beyond the deferred lint item above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The token foundation DSGN-01 requires is in place and gated: `npm run theme-parity` exits 0, every utility-class color resolves from a token in both themes, and spacing/motion/elevation `@theme` categories exist for later plans (per-theme WoW class colors in 01-05/01-06, the full-route light-mode UAT sweep, and Phase 7's refinement pass) to build on without re-litigating the token architecture.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`): both plan `<human-check>` blocks — Task 2's "does light mode read as ParseForge, not generic shadcn light" sweep on `/`, and Task 3's "toggle Light/Dark on `/` and `/tbc-audit`, confirm glassmorphism nav, cards, hero glow, active-tab underline, progress bars, and skeleton shimmer all render correctly" sweep. A dev-server smoke check (not a substitute for the human sweep) confirmed both routes compile and return 200 with no CSS errors in the Turbopack log after all three tasks' edits.

**Known limitation, not a stub:** WoW class/role colors (D-12 — `CLASS_COLORS`/`ROLE_COLORS` per-theme tokenization) are unchanged this plan; that work belongs to a later Phase 1 plan per the phase's plan sequence.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- `scripts/theme-parity.mjs` — FOUND
- `app/globals.css` — FOUND (only `:root` and utility-class regions changed vs. pre-plan state; `.dark` byte-identical)
- `package.json` — FOUND (`theme-parity` script present)
- `.planning/phases/01-foundation-themes-consent/deferred-items.md` — FOUND
- Commit `e7f4bc1` — FOUND in `git log`
- Commit `c54855f` — FOUND in `git log`
- Commit `7a47e46` — FOUND in `git log`
- `npm run theme-parity` — re-run clean, exit 0
- `npx tsc --noEmit` — re-run clean, exit 0
- `npm test` — re-run clean, 6 files / 45 tests passed
- `npx eslint scripts/theme-parity.mjs` — 0 findings
- Task 1, 2, and 3 acceptance criteria — re-verified, all pass
- Plan-level `<verification>`: theme-parity exits 0; no absolute `oklch(` literal in the `@layer base`-to-end region; `npx tsc --noEmit` and `npm test` pass; `npm run lint` passes for all files this plan touched (full-repo lint has pre-existing, unrelated `.codex/` debt — see Deviations)
