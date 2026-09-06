---
phase: 01-foundation-themes-consent
plan: 07
subsystem: ui
tags: [design-tokens, tailwind-v4, audit-script, oklch]

requires:
  - phase: 01-06
    provides: "scripts/token-audit.mjs (the standing gate this plan drives to zero), --tier-* performance tokens, and the @theme category inventory (colour/spacing/motion/elevation)"
provides:
  - "Zero non-allowlisted hardcoded Tailwind palette classes or raw-hex colours anywhere in app/, components/, or lib/ — npm run token-audit exits 0 for the whole repository for the first time this phase"
  - "docs/TOKEN-AUDIT.md — a generated, regenerable DSGN-01 audit report"
  - "An extended, reasoned scripts/token-audit.mjs allowlist covering every remaining genuine raw-colour exception (Satori og/route.tsx + opengraph-image.tsx, the Web App Manifest spec's manifest.ts, lib/constants.ts's _HEX maps, six vendored magicui-style effect components' unreachable default props, and one canvas-constrained call site)"
affects: [01-08]

actuals:
  tokens: 12580
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "token-audit.mjs allowlist rules can now match on raw line content (not just file path or top-level declaration name), enabling a single-line exception inside an otherwise fully-migrated file without introducing a line-number-keyed rule"
    - "Vendored magicui-style effect-component default props that are always overridden at every call site in the codebase are allowlisted as unreachable fallback values rather than edited, extending the existing meteors.tsx/animated-shiny-text.tsx precedent (CLAUDE.md) of leaving vendored effect-component internals alone"

key-files:
  created:
    - docs/TOKEN-AUDIT.md
  modified:
    - app/components/AbilityPriorityHeatmap.tsx
    - app/components/CLAGearIssues.tsx
    - app/components/ComparisonSummary.tsx
    - app/components/DpsComparison.tsx
    - app/components/GearComparison.tsx
    - app/components/RaidOverview.tsx
    - app/components/TalentComparison.tsx
    - app/analyze/[reportCode]/AnalyzeClient.tsx
    - app/components/LandingHero.tsx
    - app/components/ReportUrlForm.tsx
    - app/guides/warcraft-logs-vs-parseforge/page.tsx
    - components/ui/animated-shiny-text.tsx
    - components/ui/meteors.tsx
    - scripts/token-audit.mjs

key-decisions:
  - "Used the live `npm run token-audit -- --report` output, not the plan's frontmatter file list, as the worklist authority (per the plan's own instruction) — this surfaced 8 additional files (LandingHero.tsx, ReportUrlForm.tsx, app/manifest.ts, app/opengraph-image.tsx, and 6 vendored components/ui/*.tsx effect components) that plans 01-05/01-06 had not yet touched"
  - "DpsComparison's local GRADE_BEAM_COLORS map now mirrors lib/constants.ts's GRADE_COLORS S/A/B/C/D -> artifact/epic/rare/uncommon/common tier mapping instead of an independent hardcoded hex map, so the BorderBeam gradient and the grade badge always agree"
  - "Allowlisted (not tokenized) app/manifest.ts and app/opengraph-image.tsx: the Web App Manifest spec reads background_color/theme_color before any stylesheet loads (no CSS engine available), and opengraph-image.tsx is Satori (next/og's ImageResponse) — the same documented exception as the existing app/og/route.tsx entry"
  - "Allowlisted the six vendored magicui-style effect components' (border-beam, magic-card, particles, shimmer-button, shine-border, sparkles-text) hex-valued default props as unreachable fallback values, since every call site in this codebase supplies an explicit override — left as shipped rather than edited, per the meteors.tsx precedent (CLAUDE.md) of not touching vendored effect-component internals"
  - "Migrated the actually-reachable call-site colour props in LandingHero.tsx/ReportUrlForm.tsx/ComparisonSummary.tsx/AnalyzeClient.tsx (SparklesText, BorderBeam, MagicCard, ShimmerButton, ShineBorder) from raw hex to var(--gold-from)/var(--arcane-from) CSS custom-property references — these flow into genuine CSS contexts (inline style, CSS custom properties, gradient strings), so var() resolves correctly and now adapts per theme instead of being a theme-blind fixed value"
  - "Kept LandingHero.tsx's single Particles color prop as a literal hex, allowlisted with a line-content-matching rule: Particles parses this value via hexToRgb() for canvas fillStyle compositing, and a canvas 2D context cannot resolve a CSS custom property"
  - "Extended token-audit.mjs's makeFinding/scanFile to pass the raw line text into each allowlist rule's appliesTo() predicate, adding a third matching strategy (line-content) alongside the existing whole-file and declaration-suffix strategies from 01-06"

requirements-completed: []

coverage:
  - id: D1
    description: "Seven analysis components (AbilityPriorityHeatmap, CLAGearIssues, ComparisonSummary, DpsComparison, GearComparison, RaidOverview, TalentComparison) resolve every colour from a semantic token; diffs are class-name-string-only"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "npm run token-audit -- --report | grep -E these 7 files | grep -c palette-class -> 0; npx tsc --noEmit; npx eslint (per-file) 0 findings; npm test 59/59"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm run token-audit exits 0 for the whole repository for the first time this phase: every remaining hardcoded colour is either migrated to a token/var() reference or allowlisted with a written, specific reason"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "npm run token-audit exit 0 (57 findings, 57 allowlisted, 0 non-allowlisted); npm run theme-parity exit 0; guide-page diff-gate (every changed line carries a class attribute) exit 0; npx tsc --noEmit, npm run lint (no new findings, meteors.tsx count unchanged at 0), npm test all pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "docs/TOKEN-AUDIT.md is generated (never hand-written) by npm run token-audit -- --markdown, names all four required @theme categories present, shows zero non-allowlisted findings, and lists every allowlist entry with its reason including the Open Graph route"
    requirement: "DSGN-01"
    verification:
      - kind: other
        ref: "test -s docs/TOKEN-AUDIT.md; grep -qi spacing/motion/elevation/color/allowlist docs/TOKEN-AUDIT.md all pass; grep -q 'og/route' docs/TOKEN-AUDIT.md pass; npm run theme-parity && npm run token-audit && npx tsc --noEmit all exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rendered legibility of the migrated colours (status/gold/arcane/tier tokens now driving previously-hardcoded UI) in both light and dark themes on real analysis-view routes"
    verification: []
    human_judgment: true
    rationale: "Requires a live browser to judge actual rendered contrast/legibility across AbilityPriorityHeatmap, TalentComparison, DpsComparison, GearComparison, CLAGearIssues, RaidOverview, ComparisonSummary, and LandingHero's decorative SparklesText/BorderBeam/MagicCard var()-driven gradients — deferred to the phase's end-of-phase human-verify sweep per workflow.human_verify_mode=end-of-phase (config.json), consistent with 01-04/01-05/01-06's same deferral pattern."

duration: 35min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 7: Component Colour-Token Sweep & Token Audit Report Summary

**Every remaining hardcoded Tailwind palette class and raw-hex colour in the shipped UI is now either a semantic `@theme` token or a written-down allowlist exception — `npm run token-audit` exits 0 for the first time this phase, and `docs/TOKEN-AUDIT.md` is generated to prove it.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-06 (continuing directly from 01-06)
- **Completed:** 2026-09-06
- **Tasks:** 3 completed
- **Files modified:** 15 (1 created, 14 modified)

## Accomplishments

- Migrated the seven densest analysis components (`AbilityPriorityHeatmap`, `CLAGearIssues`, `ComparisonSummary`, `DpsComparison`, `GearComparison`, `RaidOverview`, `TalentComparison`) off hardcoded Tailwind palette classes onto semantic tokens — `status-good/bad/warn/info` for positive/negative/informational states, `gold-from`/`arcane-from` for brand-accent and decorative pairs, `tier-*` for grade-linked gradients, `surface-3` for inert bar fills. `DpsComparison`'s local `GRADE_BEAM_COLORS` map now mirrors `lib/constants.ts`'s `GRADE_COLORS` S/A/B/C/D tier mapping instead of an independent hardcoded hex map. All diffs are class-name-string-only.
- Closed the rest of the live `--report` worklist (the audit output, not the plan's original file list, per the plan's own instruction) — `AnalyzeClient.tsx`, the SEO guide page (class-name-only diff, verified via a diff gate that every changed line carries a class attribute), `animated-shiny-text.tsx`, `meteors.tsx`, plus two files the plan's frontmatter hadn't listed (`LandingHero.tsx`, `ReportUrlForm.tsx`) whose vendored-effect-component colour props were migrated from raw hex to `var(--gold-from)`/`var(--arcane-from)`.
- Extended `scripts/token-audit.mjs`'s reasoned allowlist to cover every remaining genuinely-raw exception: `app/opengraph-image.tsx` and `app/manifest.ts` (Satori/Web-App-Manifest-spec constraints, same category as the existing `og/route.tsx` entry), the six vendored magicui-style effect components' unreachable default props, and one canvas-constrained call site (`Particles`' `color` prop, which needs a literal hex for its `hexToRgb()` canvas compositing). Added a line-content matching strategy to the allowlist predicate so a single problematic line can be allowlisted without a fragile line-number rule. `npm run token-audit` now exits 0 for the whole repository.
- Generated `docs/TOKEN-AUDIT.md` via `npm run token-audit -- --markdown docs/TOKEN-AUDIT.md`, after adding a short generated-report header to the script's markdown output explaining what the report is and how to regenerate it (rather than hand-editing the artifact).

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate the seven analysis components to semantic tokens** - `0139ed2` (feat)
2. **Task 2: Migrate the analyze shell, the SEO guide page and the two vendored UI components** (+ the additionally-discovered LandingHero.tsx/ReportUrlForm.tsx and allowlist extensions) - `8b7eb98` (feat)
3. **Task 3: Generate the DSGN-01 token audit report** - `c8c1c70` (docs)

**Plan metadata:** pending (this commit)

## Files Created/Modified

- `app/components/AbilityPriorityHeatmap.tsx` - `text-blue-400` → `text-status-info`
- `app/components/CLAGearIssues.tsx` - `text-blue-400` → `text-status-info` (x2), `text-purple-400` → `text-arcane-from`
- `app/components/ComparisonSummary.tsx` - status-good/bad for deltas and bar colour, `ShineBorder` colours → `var(--gold-from)`/`var(--arcane-from)`
- `app/components/DpsComparison.tsx` - `GRADE_BEAM_COLORS` → tier tokens, status-good/bad for deltas, `bg-arcane-from/50`, `bg-surface-3`
- `app/components/GearComparison.tsx` - `text-blue-400` → `text-status-info` (x2), `text-purple-400` → `text-arcane-from`
- `app/components/RaidOverview.tsx` - `bg-emerald-500/60` → `bg-status-good/60`
- `app/components/TalentComparison.tsx` - `bg-red-500` → `bg-status-bad`, amber → `gold-from`, zinc → `surface-3`, purple → `arcane-from`
- `app/analyze/[reportCode]/AnalyzeClient.tsx` - `text-emerald-400` → `text-status-good` (x2), `ShineBorder` colours → `var()`
- `app/components/LandingHero.tsx` - `SparklesText`/`BorderBeam`/`MagicCard` brand-accent props → `var(--gold-from)`/`var(--arcane-from)`; `Particles` `color` kept as documented, allowlisted literal hex (canvas constraint)
- `app/components/ReportUrlForm.tsx` - `ShimmerButton` `shimmerColor` → `var(--gold-from)`
- `app/guides/warcraft-logs-vs-parseforge/page.tsx` - `text-emerald-400` → `text-status-good` (x8), class-name-only diff verified
- `components/ui/animated-shiny-text.tsx` - collapsed light/dark neutral pair to `text-muted-foreground`
- `components/ui/meteors.tsx` - `bg-zinc-500`/`from-zinc-500` → `bg-muted-foreground`/`from-muted-foreground` (only these two utilities changed)
- `scripts/token-audit.mjs` - Extended allowlist (opengraph-image.tsx, manifest.ts, six vendored effect components, one line-content rule); added generated-report header to markdown output
- `docs/TOKEN-AUDIT.md` - New: generated DSGN-01 audit report

## Decisions Made

See `key-decisions` in frontmatter above — summarized: (1) treated the live audit output as the worklist authority rather than the plan's pre-01-05/06 file list; (2) mirrored `GRADE_COLORS`' tier mapping in `DpsComparison`'s beam-colour map instead of an independent hex map; (3) allowlisted `manifest.ts`/`opengraph-image.tsx` as genuine renderer/spec constraints rather than forcing a token; (4) allowlisted vendored effect components' unreachable default props rather than editing third-party-sourced files, per the existing `meteors.tsx` precedent; (5) migrated the actually-reachable call-site props to `var()` tokens since they resolve correctly in their CSS contexts; (6) kept exactly one line (`Particles`' `color` prop) as a documented raw-hex exception for a genuine canvas-rendering constraint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Migrated two files not in the plan's frontmatter file list, to satisfy the plan's own "audit must exit 0 for the whole repository" gate**
- **Found during:** Task 2 (`npm run token-audit -- --report` after the plan's four listed files still showed non-zero findings)
- **Issue:** `app/components/LandingHero.tsx` and `app/components/ReportUrlForm.tsx` carried raw-hex colour props passed into vendored effect components (`SparklesText`, `BorderBeam`, `MagicCard`, `ShimmerButton`) — findings the plan's frontmatter `files_modified` list didn't name (written before 01-05/01-06 landed), but the plan's own prompt explicitly designates the live `--report` output as the worklist authority.
- **Fix:** Migrated the reachable colour props to `var(--gold-from)`/`var(--arcane-from)` CSS custom-property references; allowlisted the one genuinely-raw exception (`Particles`' `color` prop, canvas-constrained).
- **Files modified:** `app/components/LandingHero.tsx`, `app/components/ReportUrlForm.tsx`, `scripts/token-audit.mjs`
- **Verification:** `npm run token-audit` exits 0; `npx tsc --noEmit`, `npm run lint`, `npm test` all pass.
- **Committed in:** `8b7eb98` (Task 2 commit)

**2. [Rule 2 - Missing critical functionality] Allowlisted `app/manifest.ts`, `app/opengraph-image.tsx`, and six vendored `components/ui/*.tsx` effect components**
- **Found during:** Task 2 (same `--report` re-run)
- **Issue:** These files carry raw-hex findings the plan's file list didn't anticipate, for reasons structurally identical to the already-accepted `app/og/route.tsx` exception (Web App Manifest spec / Satori / unreachable vendored defaults).
- **Fix:** Added three new reasoned allowlist entries (plus a line-content-matching rule for the one canvas-constrained call site) to `scripts/token-audit.mjs`, extending `makeFinding`/`scanFile` to pass line text into the `appliesTo()` predicate so a single line can be allowlisted without a line-number-keyed rule.
- **Files modified:** `scripts/token-audit.mjs`
- **Verification:** `npm run token-audit` exits 0 with a fully reasoned allowlist; each new entry has a non-empty reason (enforced by the script's own FATAL check).
- **Committed in:** `8b7eb98` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — completing the plan's own stated gate, not scope creep beyond what the plan's prompt explicitly authorized).
**Impact on plan:** Necessary to satisfy DSGN-01's "no known exceptions... full consolidation" bar (D-11) and the plan's own Task 2 acceptance criterion that `npm run token-audit` exit 0 for the whole repository. No architectural changes; no logic or JSX structure changed anywhere.

## Issues Encountered

None beyond the two items above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

DSGN-01's full-consolidation bar is met: `npm run token-audit` exits 0 for the whole repository (57 findings, all 57 allowlisted with a written reason, 0 non-allowlisted), `npm run theme-parity` exits 0, and `docs/TOKEN-AUDIT.md` demonstrates all four required `@theme` categories present. `npx tsc --noEmit`, `npm run lint`, and `npm test` (59/59) all pass with no new findings introduced anywhere, including `components/ui/meteors.tsx`'s pre-existing lint-debt count (unchanged at 0).

**DSGN-01 requirement marking:** `DSGN-01` is declared by five plans in this phase (01-04, 01-05, 01-06, 01-07, 01-08). Per the shared-ID gate (`requirements.ready-ids`), it is NOT marked complete in `REQUIREMENTS.md` yet — 01-08 hasn't produced a SUMMARY. It will flip to `Complete` automatically the next time any plan in this phase finishes its `update_requirements` step, once 01-08 lands.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`): a live-browser confirmation that the migrated colours (status/gold/arcane/tier tokens now driving `AbilityPriorityHeatmap`, `TalentComparison`, `DpsComparison`, `GearComparison`, `CLAGearIssues`, `RaidOverview`, `ComparisonSummary`, and `LandingHero`'s decorative gradients) render with correct contrast and hue in both themes — no automated visual-regression harness exists (same deferral pattern as 01-04/01-05/01-06). Also worth a spot-check: `SparklesText`'s per-sparkle SVG `fill` attribute now receives a `var(--gold-from)`/`var(--arcane-from)` string rather than a literal hex — this is expected to resolve via the CSS cascade on SVG presentation attributes in all evergreen browsers, but was not confirmed in a live browser this session.

## Known Stubs

None — no hardcoded empty values, placeholder text, or unwired data introduced this plan.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- All 15 key files (7 Task-1 components, 6 Task-2 files, `scripts/token-audit.mjs`, `docs/TOKEN-AUDIT.md`) — FOUND on disk
- Commits `0139ed2`, `8b7eb98`, `c8c1c70` — FOUND in `git log`
- `npm run token-audit` — re-run clean, exit 0 (57 findings, 57 allowlisted, 0 non-allowlisted)
- `npm run theme-parity` — re-run clean, exit 0
- `npx tsc --noEmit` — re-run clean, exit 0
- `npm test` — re-run clean, 7 files / 59 tests passed
- `npm run lint` (full repo) — exit 1, but 100% pre-existing `.codex/`/`.claude/`/`.agents/` scaffolding debt (documented in `deferred-items.md`); zero findings in any file this plan touched (confirmed via per-file `npx eslint` and a full-lint-output path-prefix check)
- Guide-page diff gate — every changed line carries a class attribute (0 non-class-attribute changed lines)
- `docs/TOKEN-AUDIT.md` — names all four required `@theme` categories present, zero non-allowlisted findings, allowlist section names `og/route` and every other exception with a reason
- Task 1, 2, and 3 acceptance criteria — re-verified, all pass
- `.planning/WINDOWS.md` — FOUND, 1 new `unrun-verify` entry recorded (id 2) for the deferred live-browser colour/SVG-fill check
