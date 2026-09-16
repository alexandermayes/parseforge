---
phase: 03-share-loop
plan: 05
subsystem: infra
tags: [node-script, ops-gate, seo-invariants-analog, protected-elements, posthog-hogql]

requires:
  - phase: 03-share-loop plan 01
    provides: "lib/share-links.ts URL shapes; app/og/route.tsx view=awards branch"
  - phase: 03-share-loop plan 03
    provides: "data-protected=\"share-player\"/\"share-discord\" on the player scorecard"
  - phase: 03-share-loop plan 04
    provides: "data-protected=\"awards-panel\"/\"awards-preview\"/\"share-awards\" on the Raid tab; data-protected=\"share-header\" on the header Share button"
provides:
  - "docs/PROTECTED-ELEMENTS.md — the checklist naming all 6 shipped data-protected attributes, the /og route + URL contracts, the enforcement mechanism, and the change procedure; named as a hard input to Phase 4 and Phase 7"
  - "scripts/protected-elements.mjs — the machine check: parses the checklist table, confirms each attribute is present in its owner file, fetches the live awards/player/report /og cards + the analyze canonical against a resolved --base"
  - "npm run protected-elements script entry"
  - "OPS-01 Part 1 item 8 (Protected elements) + a share-rate HogQL sub-block under item 4 (D-14) + the two carried-forward open items recorded"
  - "ROADMAP.md Phase 4 and Phase 7 entries now name docs/PROTECTED-ELEMENTS.md explicitly"
affects: [04-ads-live, 07-redesign-de-bloat-hardening]

actuals:
  tokens: 5449
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A third node-script gate joins seo-invariants.mjs/token-audit.mjs: identical header shape, --report/--base flags, and the 0 (clean) / 1 (real diff) / 2 (fatal, can't-see-subject) exit convention"
    - "A doc-as-source-of-truth, script-as-enforcement pairing where the script parses the doc's own table rather than duplicating a hardcoded attribute list — the doc and the gate cannot drift apart by construction"

key-files:
  created:
    - docs/PROTECTED-ELEMENTS.md
    - scripts/protected-elements.mjs
  modified:
    - package.json
    - docs/OPS-01-SHIP-GATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "The six data-protected attributes actually shipped by 03-03/03-04 (share-header, share-player, share-discord, awards-panel, awards-preview, share-awards) matched the plan's expected names exactly — no reconciliation edit to any owner component was needed, only verification via grep before writing each checklist row."
  - "Per-row fatal vs. failure split: an owner file that no longer exists is FATAL (the gate cannot honestly evaluate that row), while an attribute string simply absent from an existing owner file is a FAIL (a real, reportable regression) — this is what lets the fail-first test (a row naming a real file but a fake attribute) prove exit 1 rather than exit 2."
  - "A network exception reaching --base (e.g. connection refused) is FATAL, not a failed check — only a successfully-reached non-2xx/non-image response would count as a failing route-contract row. This matches the plan's 'unreachable base means exit 2' requirement precisely."

patterns-established:
  - "New OPS-01 gate items are numbered continuations of Part 1's existing list (item 8 here), never renumbering or rewording prior items — matches the 'additive, never destructive' rule this document states about itself."

requirements-completed: [SHARE-03, OPS-01]

coverage:
  - id: D1
    description: "docs/PROTECTED-ELEMENTS.md names every protected element (6 data-protected attributes with owner/element/reason), the /og route's 4 params and 3 card branches, the 3 permalink shapes, the param-free canonical rule, and the generateMetadata forwarding rule — with headings for DOM attributes, route/URL contracts, enforcement, and change procedure, naming both consuming phases by number"
    requirement: SHARE-03
    verification:
      - kind: other
        ref: "Task 1 verify: checklist-shape-ok (4 headings present, 6 attribute rows) and checklist-truthful-ok (0 missing attributes across all 6 rows) — both re-run and passing"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/protected-elements.mjs (plain ESM, node: built-ins only) parses the checklist table and fetches live route contracts; exits 0 clean, 1 on a real missing-attribute regression, 2 when it cannot see its subject (missing checklist, missing owner file, or unreachable base)"
    requirement: SHARE-03
    verification:
      - kind: other
        ref: "npm run protected-elements -- --report -> 10/10 PASS, exit 0 (against live production); fail-first test (synthetic bad row) -> exit 1; --base http://127.0.0.1:1 -> exit 2; npx eslint scripts/protected-elements.mjs -> clean"
        status: pass
    human_judgment: false
  - id: D3
    description: "OPS-01 Part 1 gains item 8 (protected-elements gate) plus a share-rate HogQL sub-block under item 4 (D-14), records the two carried-forward open items from STATE.md, and the edit is purely additive (0 lines removed from OPS-01-SHIP-GATE.md); ROADMAP.md Phase 4 and Phase 7 entries name the checklist"
    requirement: OPS-01
    verification:
      - kind: other
        ref: "gate-doc-ok (all 6 required strings present), gate-doc-additive-ok (removed-lines=0), roadmap-notes-ok (roadmap-mentions=4, phase-headings=8) — all three verify commands re-run and passing"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 5: Protected-Elements Checklist Summary

**A `docs/PROTECTED-ELEMENTS.md` checklist plus a third node-script gate (`scripts/protected-elements.mjs`, mirroring `seo-invariants.mjs`/`token-audit.mjs`) now fail the build the moment a share button, the awards panel, or the analyze canonical's param-free shape goes missing — wired into OPS-01 as item 8 and named as a hard input to both Phase 4's ad whitelist and Phase 7's redesign gate, alongside the D-14 share-rate HogQL.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 3 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `docs/PROTECTED-ELEMENTS.md` — a `## DOM attributes` table listing all 6 shipped `data-protected` values (verified against their owner files by grep before being recorded: `share-header`, `share-player`, `share-discord`, `awards-panel`, `awards-preview`, `share-awards`), a `## Route and URL contracts` section documenting `/og`'s 4 params and 3 card branches, `lib/share-links.ts`'s 3 permalink shapes, and the param-free-canonical rule, a `## How this is enforced` section explaining the gate's two failure modes, and a `## Change procedure` section
- `scripts/protected-elements.mjs` — plain ESM, no new dependency, identical header/mode/exit-code shape to `seo-invariants.mjs`/`token-audit.mjs`: parses the checklist's table, confirms each attribute string in its owner file, then fetches the live awards/player/bare-report `/og` cards and the demo analyze page's canonical against a resolved `--base` (default production)
- `npm run protected-elements` added to `package.json` alongside `seo-invariants` and `token-audit`
- `docs/OPS-01-SHIP-GATE.md` Part 1 item 4 gained a share-rate HogQL sub-block (D-14: distinct sessions with `share_action` over distinct sessions with `analysis_complete`, vs. the ~2.8% baseline, with `share_link_copied`/`discord_copied` noted as still dual-emitting); item 8 (new) names `npm run protected-elements` as a gate item and records the two carried-forward open items from STATE.md (the unsigned `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` item-7 row, and the GSC crawled-not-indexed investigation) — items 1–7 untouched, 0 lines removed
- `.planning/ROADMAP.md` Phase 4 `**Depends on**`/`**Notes**` and Phase 7 `**Notes**` now name `docs/PROTECTED-ELEMENTS.md` explicitly

## Task Commits

Each task was committed atomically:

1. **Task 1: The protected-elements checklist** - `13a8466` (docs)
2. **Task 2: The machine check** - `29fa61e` (feat)
3. **Task 3: Wire the gate and the share-rate query into OPS-01 and the roadmap** - `d658762` (docs)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `docs/PROTECTED-ELEMENTS.md` - The checklist: DOM attributes, route/URL contracts, enforcement, change procedure
- `scripts/protected-elements.mjs` - The gate script: doc-driven attribute check + live route-contract check
- `package.json` - `protected-elements` script entry
- `docs/OPS-01-SHIP-GATE.md` - Item 8 + item 4's share-rate HogQL sub-block + carried-forward items
- `.planning/ROADMAP.md` - Phase 4/Phase 7 notes name the checklist

## Decisions Made
- The six attributes 03-03/03-04 actually shipped matched the plan's expected names exactly (verified by grep against each owner file first) — no reconciliation edit was needed to any component.
- Fatal-vs-failure split in the script: a nonexistent owner file or an unreachable base is FATAL (exit 2, "can't see the subject"); an attribute string genuinely absent from an existing file is a FAIL (exit 1, a real regression) — this is what makes the fail-first and unreachable-base verify tests each prove the intended, distinct behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Local `next dev` was not needed for this plan's verification — `scripts/protected-elements.mjs`'s `--base` defaults to production (`https://parseforge.gg`), so all four live route-contract checks (awards/player/report `/og` cards + the analyze canonical) ran against real, already-deployed data and returned genuine passes, not fallback-path artifacts. This differs from every prior plan in this phase, whose local smoke-checks all exercised the `ReportCard` fallback due to missing local WCL credentials (CLAUDE.md: Vercel-only secret) — that limitation does not apply here because the script was designed, per its own doc's "Rendered-HTML assumption" note, to check against a live base rather than a local dev server.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`npm run protected-elements` is live, green against production (10/10 checks passing), and wired into OPS-01 as a numbered gate item. Phase 4's ad-placement whitelist and Phase 7's per-route SEO gate both have `docs/PROTECTED-ELEMENTS.md` named as a hard input in `.planning/ROADMAP.md`. No blockers. This closes SHARE-03's protection half and completes this phase's `OPS-01` share-rate/gate-wiring requirement; remaining phase work (03-06, 03-07 per ROADMAP) covers the preview/prod deploy and the real-data verification backstop items every prior 03-* SUMMARY carried forward (awards/player card rendering from genuine data, landing-rule behavior, mobile reachability).

## Self-Check: PASSED

- Both created files confirmed present on disk (`docs/PROTECTED-ELEMENTS.md`, `scripts/protected-elements.mjs`).
- All three task commit hashes (`13a8466`, `29fa61e`, `d658762`) confirmed in `git log --oneline`.
- `npx tsc --noEmit` clean; `npx eslint app lib components scripts` reports only the pre-existing `CastTimeline.tsx` LCP warning (0 new findings); `npx vitest run` → 18 files, 226 tests passed, no regressions.
- Re-ran every task-level `<verify>` gate verbatim: `checklist-shape-ok`, `checklist-truthful-ok`, report-mode exit 0 (10/10 PASS against production), `fail-first-ok` (exit 1), `unreachable-fatal-ok` (exit 2), `gates-ok` (eslint + package.json entry), `gate-doc-ok`, `gate-doc-additive-ok` (0 lines removed), `roadmap-notes-ok` (4 mentions, 8 phase headings) — all pass.
- Re-ran the plan-level `<verification>`: `npm run protected-elements` exits 0 against production with every attribute present; the same command exits 1 on a synthetic bad row and 2 against an unreachable base; OPS-01 Part 1 confirmed to still carry items 1–7 plus the new item 8 and the share-rate HogQL; `.planning/ROADMAP.md` confirmed to name the checklist in both the Phase 4 and Phase 7 entries with no phase headings lost.

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*
