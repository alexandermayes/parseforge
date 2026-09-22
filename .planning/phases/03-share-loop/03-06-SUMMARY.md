---
phase: 03-share-loop
plan: 06
subsystem: ops
tags: [vercel, deployment-protection, og-image, discord-unfurl, ops-01, ship-gate]

# Dependency graph
requires:
  - phase: 03-share-loop (03-02, 03-03, 03-04, 03-05)
    provides: awards engine, OG card branches (awards/player/report), Raid tab awards panel, PostHog share instrumentation, PROTECTED-ELEMENTS.md + protected-elements.mjs gate
provides:
  - A green full local OPS-01 gate (tsc, lint, vitest, theme-parity, token-audit, protected-elements, seo-invariants) captured verbatim
  - A real preview deployment (dpl_GF769NUm3eSbsQ2anhXzuTsTk8P1) serving all three OG card branches as 200 image/png with a query-free canonical
  - docs/OPS-01-SHIP-GATE.md Part 5 — the Phase 3 preview-half evidence record, explicitly unsigned
  - A recorded tooling gap in scripts/protected-elements.mjs (no bypass-header support) plus the curl-based workaround
  - Three developer-only backstops (D-04 tone, real Discord unfurl, D-13 mobile reachability) recorded as not-performed with exact closing tests and preview URLs
affects: [03-07]

# Actuals (#2632)
actuals:
  tokens: 6488
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns: ["Preview-deploy evidence gathering via the Vercel project REST record's protectionBypass key when `vercel env pull` doesn't surface VERCEL_AUTOMATION_BYPASS_SECRET"]

key-files:
  created: []
  modified:
    - docs/OPS-01-SHIP-GATE.md
    - eslint.config.mjs (pre-task fix, commit 4409a0a, ahead of Task 1)
    - .planning/WINDOWS.md

key-decisions:
  - "Sourced the Vercel automation-bypass secret from the project's REST record (protectionBypass object key) instead of `vercel env pull`, since env pull returned 29 preview vars with no VERCEL_AUTOMATION_BYPASS_SECRET line across two independent checks by two executors; verified non-empty by length only (32 chars), never printed."
  - "Ran `npm run protected-elements` against the preview as the plan instructed, then recorded honestly that the script's fetch() has no bypass-header support — its three live route checks 302 to Vercel SSO login instead of testing the deployed code — rather than patching the script beyond the plan's scope. Direct curl with the bypass header supplied the real route evidence instead."
  - "All three developer-only backstops (D-04 award-pool tone, real Discord unfurl, D-13 mobile reachability) were left not-performed, per explicit resume instructions — recorded with the exact test and exact preview URLs (cache-busted) rather than approximated or skipped silently."
  - "Flagged, but did not resolve, that a real Discord unfurl test of this specific preview is blocked by the same Deployment Protection that required the bypass header in the first place — Discord's crawler can't send custom headers. Recommended deferring that specific check to 03-07's production deploy (no SSO) as the lowest-risk close, rather than embedding the bypass secret in a URL pasted into a persistent Discord channel."

patterns-established:
  - "Pattern: when `vercel env pull` doesn't surface an automation-bypass secret, read it from `GET /v9/projects/{id}?slug={team}`'s `protectionBypass` object key via the Vercel REST API with the personal CLI's own auth.json bearer token — confirmed length-only, never printed."

requirements-completed: [SHARE-01, SHARE-02, SHARE-03, OPS-01]

coverage:
  - id: D1
    description: "Full local OPS-01 gate (tsc, lint, vitest, theme-parity, token-audit, protected-elements, seo-invariants) runs green before any deploy"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 5 § Local gate output"
        status: pass
    human_judgment: false
  - id: D2
    description: "Preview deployment serves all three OG card branches (awards, player, bare report) as 200 image/png with a query-free canonical"
    requirement: "SHARE-01"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 5 § Preview deployment (curl evidence)"
        status: pass
    human_judgment: false
  - id: D3
    description: "protected-elements gate run against the preview; its tooling gap (no bypass-header support) recorded honestly rather than papered over"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 5 § Preview deployment (protected-elements run)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-04 award-pool tone review, real Discord unfurl, and D-13 mobile reachability — genuine human judgment calls"
    verification: []
    human_judgment: true
    rationale: "These are the plan's own explicit backstop truths, requiring a real Discord channel and a real phone-width browser session no headless tool in this repo can substitute for; this executor's resume instructions explicitly directed leaving them not-performed rather than approximating them."

duration: 25min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 06: Preview Deploy, Captured Evidence, Developer Review Backstops Summary

**A real preview deployment (`dpl_GF769NUm3eSbsQ2anhXzuTsTk8P1`) serves all three OG card branches as clean `image/png` responses with a query-free canonical, the full local OPS-01 gate is green and captured verbatim, and `docs/OPS-01-SHIP-GATE.md` Part 5 records the exact D-04/Discord/mobile checks a developer still needs to run — honestly marked not-performed rather than assumed — before production is even proposed.**

## Performance

- **Duration:** ~25 min (this continuation session; Task 1 ran in a prior session)
- **Started (this session):** 2026-09-16T08:53:00Z (approx, first Bash call)
- **Completed:** 2026-09-16T09:02:54Z
- **Tasks:** 2/2 (Task 1 completed in a prior session; this session resumed at Task 2)
- **Files modified:** 3 (`docs/OPS-01-SHIP-GATE.md`, `eslint.config.mjs`, `.planning/WINDOWS.md`)

## Accomplishments
- Verified Task 1's commits (`4409a0a`, `840b05f`) exist on `growth/phase-2-review-fixes` with a clean tracked tree before resuming.
- Resolved the Task 2 precondition (`VERCEL_AUTOMATION_BYPASS_SECRET` not found via `vercel env pull`) by sourcing the secret from the Vercel project's REST record instead — confirmed non-empty by length only (32 chars), never printed, never committed.
- Deployed a real preview (`dpl_GF769NUm3eSbsQ2anhXzuTsTk8P1`, `https://parseforge-5y0xngn15-loot-list-plus.vercel.app`) from HEAD `840b05f` with a clean tracked working tree, no `--prod` flag used anywhere.
- Fetched all three OG card branches (awards, player, bare report) and the demo analyze page's canonical against the preview with the bypass header and cache-busting params — all three OG URLs `200 image/png`, canonical query-free.
- Ran `npm run protected-elements -- --base <preview-url>` and recorded, rather than hid, that the script's `fetch()` has no header/bypass support — its three live-route checks followed the SSO redirect instead of testing the deploy — while its six `attr:*` checks (local-file based) passed cleanly. Logged the gap to `.planning/WINDOWS.md`.
- Wrote a `### What this preview cannot show` subsection naming `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID`/`NEXT_PUBLIC_POSTHOG_HOST` as production-only, so the EEA/UK consent path and live PostHog ingestion for this phase's events are unobservable here.
- Wrote a `### Developer review (preview)` subsection recording all three backstop checks (D-04 tone, real Discord unfurl, D-13 mobile reachability) as not-performed, each with the exact test and exact cache-busted preview URLs needed to close it — including flagging that a genuine Discord-crawler unfurl test of this SSO-protected preview needs either a temporary Deployment Protection disable, a secret-in-URL tradeoff, or deferral to 03-07's production deploy.
- Confirmed Part 5 carries no sign-off line and that no bypass secret value appears anywhere in the repository (both by the plan's own verify commands and an extra literal-value grep this session ran for its own confidence).

## Task Commits

Task 1 was completed in a prior session (commits below carried over from the checkpoint context):

1. **Pre-task fix: Scope eslint to application code** - `4409a0a` (fix)
2. **Task 1: Run the full local gate and open Part 5** - `840b05f` (docs)
3. **Task 2: Preview deploy, captured evidence, and the developer's real-browser review** - `de3b001` (docs)

**Plan metadata:** see final commit below (this SUMMARY + STATE.md + ROADMAP.md + WINDOWS.md)

_Note: no code was written this plan — every task commit is `docs`/`fix` against the gate document or its tooling._

## Files Created/Modified
- `docs/OPS-01-SHIP-GATE.md` - Gained `## Part 5 — Phase 3 evidence` in full: local gate output, SEO invariants, PostHog instrumentation grep evidence, the 15-row award pool (Task 1); preview deployment record, protected-elements-against-preview run, "what this preview cannot show," and the developer-review backstop section (Task 2, this session)
- `eslint.config.mjs` - Pre-task fix (Rule 3): added the six untracked GSD-scaffolding directories to `globalIgnores` so `npm run lint` runs against application code only
- `.planning/WINDOWS.md` - Two new entries: the `protected-elements.mjs` bypass-header gap (id 8), and the three not-performed developer backstops (id 9)

## Decisions Made
- Sourced the bypass secret via the Vercel project REST record rather than retrying `vercel env pull` a third time — the orchestrator's own verification had already confirmed the secret is live server-side, so a third identical CLI check would not have produced new information.
- Ran `protected-elements` against the preview exactly as instructed rather than skipping it because the outcome was predictable; recording the real (failing) output plus the reason is more honest than omitting a check whose result was foreseeable.
- Did not attempt to resolve the Discord-crawler-vs-SSO conflict on the developer's behalf (e.g., by unilaterally disabling Deployment Protection) — flagged it with three concrete options and a recommendation, left the choice to the developer per this plan's own "developer review" framing.

## Deviations from Plan

None in Task 2 itself - executed exactly as the resume instructions specified. Task 1's one deviation (Rule 3 — eslint scoping) was already recorded in the prior session's commit `4409a0a` and Part 5's own "Local gate output" subsection; not re-litigated here.

## Issues Encountered
- `vercel env pull --environment=preview` still did not surface `VERCEL_AUTOMATION_BYPASS_SECRET` in this session either (checked implicitly by using the REST-record path directly per the resume instructions, which had already diagnosed this twice). Resolved via the REST-record substitution; recorded in Part 5 as an open oddity rather than investigated further, since it wasn't blocking.
- `scripts/protected-elements.mjs` has no way to attach the bypass header, so it cannot actually gate an SSO-protected preview — its three route checks return `200 text/html` (the Vercel login page) instead of testing the real routes. Not a regression in the deployed app (proven by the parallel `curl` evidence); recorded as a tooling gap and logged to `.planning/WINDOWS.md` rather than patched (out of this plan's scope per its own "do not add features beyond the plan" instruction).

## User Setup Required

None - no new external service configuration required. The developer has three open action items recorded in `docs/OPS-01-SHIP-GATE.md` Part 5's `### Developer review (preview)` section (D-04 tone confirmation, a real Discord-channel unfurl check, and a phone-width reachability check), each with the exact test and exact preview URL to close it.

## Known Stubs

None - this plan added no application code, only gate-document evidence and one tooling-scope fix.

## Next Phase Readiness
- The preview half of the Phase 3 OPS-01 gate is fully recorded and unsigned, exactly as designed — production deploy, its live-traffic check, and the gate sign-off are 03-07's job.
- Three developer action items are outstanding before 03-07 should be considered a rubber stamp: (1) confirm the 15-row award pool clears the D-01 tone bar, (2) paste the two cache-busted preview links into a real Discord channel (or defer this specific check to 03-07's production URLs, which carry no SSO complication), (3) confirm both share buttons are phone-reachable without scrolling past the analysis tables.
- One tooling gap is now visible for a future phase to close: `scripts/protected-elements.mjs` needs an optional bypass-header/query-param flag if it's ever meant to gate a protected preview deployment directly, rather than only production or a locally-served build.

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*

## Self-Check: PASSED
