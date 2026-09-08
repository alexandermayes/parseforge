---
phase: 02-accuracy-analysis-depth
plan: 09
subsystem: infra
tags: [deploy, vercel, ops-01, search-console, posthog, timeline, healer, ship-gate]

requires:
  - phase: 02-accuracy-analysis-depth
    provides: "02-01 through 02-08: cast timeline (ACC-03), healer metrics/suggestions (ACC-04), regenerated wago.tools game-data pipeline (ACC-01), regression net over cla-engine/raid-overview-engine/wcl-client (ACC-02)"
provides:
  - "Phase 2 live on parseforge.gg — cast timeline, healer metrics, regenerated game data, all shipped and verified against production"
  - "docs/OPS-01-SHIP-GATE.md closed for Phase 2 with dated sign-off"
affects: [phase-03]

actuals:
  tokens: 8400
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Preview-first with a real-gear/real-report check: the both-theme sweep, Timeline 375px pass, and unpinned game-data name check all ran against a preview before production, extending Phase 1's preview-before-prod pattern to cover data-accuracy risk, not just visual risk"
    - "Live end-to-end proof: post-deploy evidence for a data-shape change is a real POST against the deployed API with a known fixture, not just a 200 on the page — the /api/timeline check reproduces the exact 02-05 calibration numbers (castCount 159, idleThresholdMs 2762) against production"

key-files:
  created: []
  modified:
    - docs/OPS-01-SHIP-GATE.md

key-decisions:
  - "Task 2 decision: preview-first, then production (not straight-to-prod, not hold) — the regenerated game-data names and the Timeline's hand-rolled virtualisation had no automated visual/data coverage beyond pinned regression pairs, so a human needed to see a real report before real traffic did."
  - "Also-decide: push + PR first, done ahead of Task 3 by the orchestrator — origin/main fast-forwarded to the Phase 1 tip, branch growth/phase-2-accuracy-depth pushed with the Phase 2 commits, PR #15 opened (https://github.com/alexandermayes/parseforge/pull/15). Local main remained the working branch for the rest of the plan; the orchestrator syncs branch/PR after close."
  - "Production deploy: the executor's own vercel deploy --prod invocation was denied by the Claude Code auto-mode classifier. The developer added a Bash(vercel deploy:*) permission and the orchestrator ran the command once, immediately after the developer's preview-sweep approval — the same approval-then-execute sequence Task 2 required, executed by a different actor because of the classifier denial, not because the approval gate was skipped."
  - "PostHog and Search Console post-deploy checks recorded as no-data: this gsd-executor dispatch has no PostHog or gscServer MCP tool in its available tool set (the same limitation 01-09-SUMMARY.md recorded for GSC). Recorded honestly per the gate document's own rule rather than fabricated or silently dropped; carried forward to the Phase 3 gate."

patterns-established:
  - "Ship-gate Part 3 (Phase 2 evidence) mirrors Part 2's (Phase 1) structure exactly — pre-deploy local gate, deploy-decision checkpoint, preview half, production half, dated sign-off — confirming the Part 1 template generalizes past its first use."

requirements-completed: [ACC-01, ACC-02, ACC-03, ACC-04]

coverage:
  - id: D1
    description: "Local gate green before any deploy proposal: tsc, lint, test suite, theme-parity, token-audit"
    requirement: "ACC-02"
    verification:
      - kind: command
        ref: "npx tsc --noEmit (exit 0); npm test (135/135 tests, 14 files); npm run theme-parity (PASS); npm run token-audit (0 gate-relevant findings); scoped eslint app lib components scripts (1 pre-existing warning, exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "SEO invariants clean pre-deploy and post-deploy — canonical, robots, and structured-data for /analyze unchanged by the Timeline sub-tab"
    requirement: "ACC-03"
    verification:
      - kind: command
        ref: "npm run seo-invariants -- --base http://localhost:3987 (Task 1, pre-deploy) and --base http://localhost:3990 (Task 3, post-deploy) — both exit 0, identical non-failing caveats, no canonical/robots/structured-data diff"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each new PostHog event (timeline_viewed, timeline_error, timeline_filter_used) has exactly one capture call site; analysis_complete still exactly one"
    requirement: "ACC-03"
    verification:
      - kind: command
        ref: "grep -rn 'posthog.capture(\"<event>\"' app/ lib/ — one hit per event, all in app/analyze/[reportCode]/hooks/useTimeline.ts (timeline_*) and usePlayerAnalysis.ts (analysis_complete)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Game-data regeneration diff reviewed by a human — docs/GAME-DATA-AUDIT.md's unverified-override and changed-value lists read, counts recorded (ACC-01's D-12 acceptance artifact)"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Task 1 section: 133 unverified overrides (each with a per-id source note), 0 changed values since the previous run, cross-era collisions enumerated (809 enchant, 295 gem)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both-theme, 11-route sweep plus a 375px Timeline pass (scroll, chip toggling, idle/death bands) and real-gear game-data names, verified by a human against the preview before production traffic saw them"
    requirement: "ACC-03"
    verification: []
    human_judgment: true
    rationale: "No visual-regression harness exists in this project (confirmed again this phase); the developer's own eyes against a real report are the only proof this deliverable can carry."
  - id: D6
    description: "A healer's card shows Overheal and Uptime rows with top-healer comparison values, confirmed live"
    requirement: "ACC-04"
    verification: []
    human_judgment: true
    rationale: "The developer confirmed this as part of the same preview sweep as D5; there is no automated UI assertion for the rendered card, only the underlying engine's unit tests (already covered under ACC-02's D1)."
  - id: D7
    description: "Live end-to-end proof the Timeline path works against production Redis and real WCL credentials — a real POST /api/timeline against the deployed API"
    requirement: "ACC-03"
    verification:
      - kind: other
        ref: "POST https://parseforge.gg/api/timeline {reportCode: ZjKgNYxVcAqR8pGJ, fightId: 23, sourceId: 12} -> 200, castCount 159, idleThresholdMs 2762 (both match the 02-05 STATE.md calibration exactly)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Production deploy only after an explicit, recorded developer approval; deployment id/URL/alias recorded"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "preview-first decision (Task 2) -> developer's preview sweep approved -> developer approved production -> vercel deploy --prod --scope loot-list-plus --yes -> dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c, aliased parseforge.gg + www.parseforge.gg, vercel inspect confirms target production / status Ready"
        status: pass
    human_judgment: false

# Metrics
duration: ~35min (this dispatch, continuing from checkpoint)
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 9: Ship Phase 2 and close the OPS-01 gate — Summary

**Phase 2 (cast timeline, healer metrics, regenerated game data, three-engine regression net) is live on parseforge.gg after a preview-first deploy the developer approved twice — once for the visual/data sweep, once for production — with the gate document carrying full pre- and post-deploy evidence including a live production `/api/timeline` proof that reproduces the exact local calibration numbers.**

## Performance

- **Duration:** ~35 min for this dispatch (continuing execution from a resolved human-action checkpoint; Tasks 1–2 and the preview half of Task 3 ran in prior dispatches — see the plan's per-task commits below)
- **Completed:** 2026-09-08T18:22:15Z
- **Tasks:** 3 (Task 1 auto, Task 2 checkpoint:decision, Task 3 auto — split preview/production halves across dispatches)
- **Files modified:** 1 (`docs/OPS-01-SHIP-GATE.md`, across 4 commits)

## Accomplishments

- Ran the full pre-deploy OPS-01 gate (local gate, SEO invariants, PostHog grep, game-data audit review) and recorded it in `docs/OPS-01-SHIP-GATE.md`
- Got an explicit developer decision on the deploy route (`preview-first`) plus the push/PR question, and the orchestrator opened PR #15 ahead of the deploy
- Deployed a preview, ran the SSO-blocked automated checks that could run non-interactively, and handed the both-theme sweep, Timeline mobile pass, real-gear game-data check, and healer-card check to the developer against the preview
- After the developer's preview approval and a second explicit approval for production (worked around a Claude Code auto-mode classifier denial via a developer-granted permission), the orchestrator ran the production deploy
- Closed the loop: re-ran `seo-invariants` against the deployed production build, swept all 11 routes + sitemap + robots for 200s, and proved the Timeline API works end-to-end in production with a live `POST /api/timeline` call that reproduces the exact 02-05 calibration (castCount 159, idleThresholdMs 2762)
- Recorded PostHog and Search Console post-deploy checks honestly as `no-data` (MCP tools unavailable to this dispatch) rather than fabricating a pass, and wrote the dated Phase 2 sign-off naming every outstanding item

## Task Commits

Each task/checkpoint was committed atomically, across four dispatches of this plan:

1. **Task 1: Local gate + pre-deploy OPS-01 checklist** — `58242be` (docs)
2. **Task 2: Deploy-route decision** — `ae515c3` (docs) — resolved `preview-first`; PR #15 opened
3. **Task 3 (preview half): Preview deploy + SSO-blocked automated checks** — `bee5740` (docs)
4. **Task 3 (production half): Production deploy evidence, post-deploy checks, dated sign-off** — `4b07e9c` (docs) — this dispatch

**Plan metadata:** commit follows this SUMMARY

## Files Created/Modified

- `docs/OPS-01-SHIP-GATE.md` — Phase 2 Part 3 section: pre-deploy evidence (Task 1), the deploy-route decision (Task 2), the preview deploy and SSO-blocked checks (Task 3 preview half), and the production deploy, post-deploy evidence, and dated sign-off (Task 3 production half, this dispatch)

## Decisions Made

- **Deploy route: `preview-first`.** The regenerated game-data names and the Timeline's hand-rolled virtualisation had no automated coverage beyond a handful of pinned regression pairs; a preview put a human in front of a real report before any raider saw a wrong enchant name or a broken scroll. See `key-decisions` in frontmatter for the full rationale and the also-decide (push+PR) outcome.
- **Production deploy executed by the orchestrator, not a spawned executor.** The Claude Code auto-mode classifier denied the executor's own `vercel deploy --prod` invocation; the developer added a `Bash(vercel deploy:*)` permission and the orchestrator ran the command once, immediately following the developer's explicit preview-sweep approval. The approval-then-execute sequence Task 2's decision required was preserved — only the executing actor changed.
- **PostHog/Search Console recorded as `no-data`, not skipped.** This gsd-executor dispatch has no PostHog or `gscServer` MCP tool available — the identical limitation 01-09-SUMMARY.md recorded for GSC in Phase 1. Rather than fabricate a pass or omit the row, both are recorded `no-data` with the reason, and carried forward as the first items to re-check at the Phase 3 gate.

## Deviations from Plan

None — the plan's Task 3 precondition (`vercel whoami` succeeds and the developer's Task 2 answer is recorded) was met before any deploy command ran, and every acceptance criterion for Tasks 1–3 is satisfied with recorded evidence. The auto-mode classifier's denial of the executor's own deploy invocation is documented as a checkpoint resolution (human-action), not a deviation — Rule 3's package-manager-install exclusion has a direct analogue here: a deploy command denied by the harness is exactly the kind of irreversible, trust-establishing action that should surface to a human rather than be silently retried or worked around, and it was — the developer granted the permission explicitly before the orchestrator ran the command once.

## Issues Encountered

- **PostHog and `gscServer` MCP tools unavailable to this gsd-executor dispatch.** Resolved by recording both post-deploy checks as `no-data` with the exact reason, matching the plan's own explicit instruction ("Never fabricate a pass") and Phase 1's precedent for the identical GSC-tool gap. Not blocking — the pre-deploy grep evidence for PostHog call sites and the Phase-1 pre-deploy Search Console PASS for `/analyze` (with no route/metadata change shipped this phase) are the standing evidence until the next gate re-run confirms post-deploy.

## User Setup Required

None — no external service configuration required. (Note: the AdSense privacy-policy manual follow-up from Phase 1 remains outstanding and is unrelated to this plan.)

## Next Phase Readiness

Phase 2 is fully shipped and its OPS-01 gate is closed with a dated sign-off. Phase 3 inherits:
- A live cast timeline, healer metrics, and a regenerated, audited game-data pipeline, all confirmed against production.
- Two outstanding evidence items to re-check as soon as a session has the PostHog/`gscServer` MCP tools connected: the six PostHog event definitions (`timeline_viewed`, `timeline_error`, `timeline_filter_used`, `analysis_complete`, and the Phase-1-carried-forward `theme_changed`/`consent_resolved`), and Search Console re-inspection of `/analyze/{code}` and `/`.
- The two flagged-but-unresolved game-data ids (Cata weapon-enhancement 96264, 96294) — real, previously-verified values, not placeholders, so not a blocker; tracked in `.planning/WINDOWS.md`.
- `git push origin main` still outstanding for the phase's remaining local commits beyond the already-pushed PR #15 branch — the orchestrator syncs this after the plan closes.

---
*Phase: 02-accuracy-analysis-depth*
*Completed: 2026-09-08*
