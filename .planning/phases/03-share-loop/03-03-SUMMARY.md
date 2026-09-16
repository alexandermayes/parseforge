---
phase: 03-share-loop
plan: 03
subsystem: ui
tags: [next-og, satori, posthog, share-links, react]

requires:
  - phase: 03-share-loop plan 01
    provides: "app/og/route.tsx PlayerCard branch + fetchJson never-fail pattern; lib/share-links.ts buildPlayerShareUrl"
provides:
  - "app/og/route.tsx PlayerCard renders D-10 receipts (Kill/Wipe pill, fight length, vs-top-N label, one proof line) reading only data.healer and the metricPercentiles activeTime entry — no arithmetic of its own"
  - "Player branch Promise.all's /api/analyze + /api/report to resolve the fight outcome, degrading to outcome: null on any meta-fetch failure without changing branch"
  - "ComparisonSummary Share my parse primary button (data-protected=\"share-player\") + Copy for Discord secondary (data-protected=\"share-discord\"), both above the fold in the card header"
  - "share_action PostHog event now fires with kind: player_link and kind: discord_text (dual-emitted alongside the existing discord_copied)"
affects: [03-05, 03-06]

actuals:
  tokens: 3454
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "The player OG branch now mirrors the awards branch's Promise.all + null-degrade shape (03-01 lineage): two server-to-server fetches in parallel, a null outcome on any failure, never a thrown error or a changed rendering branch"
    - "A single computed playerShareUrl value feeds both share surfaces in a component (ComparisonSummary), so 'no share surface reads window.location directly' is enforced by construction, not just by convention"

key-files:
  created: []
  modified:
    - app/og/route.tsx
    - app/components/AnalysisView.tsx
    - app/components/ComparisonSummary.tsx

key-decisions:
  - "The Discord text scorecard's 'Full breakdown' link now also comes from buildPlayerShareUrl instead of window.location.href (previously the only remaining raw-location read in this file) — the plan's own acceptance gate required zero window.location.href occurrences in ComparisonSummary.tsx, and the key_links note ('no share surface reads the browser location') applies to the whole file, not just the new button. When fightId/sourceId are unknown the Discord copy simply omits the link line, exactly as it already did for a missing shareUrl."
  - "The player-card comparison label is worded exactly per the task's literal spec ('vs top {N} {spec} {class}s' / 'vs #1 {name}'), which differs slightly from ComparisonSummary's own Discord wording ('vs Avg Top {N}') — the two surfaces already used different phrasing before this plan (Discord text vs. AnalysisView's header label), so this is a third, OG-specific phrasing rather than a new inconsistency."
  - "WIPE boss percentage in the new PlayerCard pill is Math.round(bossPercentage / 100) (a whole-number percent), not the AwardsCard's (bossPercentage / 100).toFixed(1) — the task text explicitly asked for 'the rounded boss percentage' for this smaller 18px pill, a deliberate difference in precision from the awards card's larger header pill, not a copy-paste miss."

patterns-established:
  - "Any new /og branch that needs a second server fact (fight outcome, in this case) fetches it in the same Promise.all as the primary data call and degrades the extra fact to null on failure — the primary render decision is never gated on the secondary fetch succeeding."

requirements-completed: [SHARE-02]

coverage:
  - id: D1
    description: "PlayerCard renders a Kill/Wipe pill, fight length (mm:ss), a vs-top-N comparison label, and one proof line (healer: effective HPS + overheal from data.healer; DPS: Active Time from the metricPercentiles activeTime entry) — reading no other source, performing no percentile/overheal arithmetic of its own"
    requirement: SHARE-02
    verification:
      - kind: other
        ref: "grep gate: promise-all=2 healer-reads=3 activetime-reads=3 (receipts-wiring-ok)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit, npx eslint app/og/route.tsx, npx vitest run (226/226, no regressions)"
        status: pass
    human_judgment: true
    rationale: "Local next dev has no WCL_CLIENT_ID/SECRET (Vercel-only per CLAUDE.md). The plan's own local smoke-check URL returned 200 image/png as required, but the dev log shows both /api/analyze and /api/report 500'd on missing credentials, so the request actually fell through to the ReportCard fallback branch, not a genuine PlayerCard render with real receipts data — the same gap 03-01 and 03-02 already recorded for their own OG branches. The wiring (single Promise.all, exact data.healer/activeTime read sites, no arithmetic) is grep-gated and code-reviewed, but 'renders correctly from real data' needs a preview/prod check with real credentials, exactly like the plan's own must_haves backstop truth already anticipates."
  - id: D2
    description: "The player branch resolves the fight outcome via one Promise.all alongside the existing /api/analyze fetch, passing outcome: null (never a thrown error or a changed branch) when the report-meta fetch fails or no fight entry matches"
    requirement: SHARE-02
    verification:
      - kind: other
        ref: "grep gate: exactly one Promise.all in the player branch, one in the awards branch"
        status: pass
    human_judgment: false
  - id: D3
    description: "Share my parse is the primary button on the player scorecard (data-protected=\"share-player\"), copies /analyze/{code}?fight={id}&source={id}&ref=parse via buildPlayerShareUrl, only renders when fightId and sourceId are known, and fires share_action{kind:player_link}; Copy for Discord (data-protected=\"share-discord\") stays secondary, keeps discord_copied, and now also fires share_action{kind:discord_text}"
    requirement: SHARE-02
    verification:
      - kind: other
        ref: "grep gate: buildPlayerShareUrl(=1, kind:player_link=1, kind:discord_text=1, discord_copied=1, data-protected=share-player=1, data-protected=share-discord=1, window.location.href=0 (share-wiring-ok)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit, npx eslint (both files), npm run token-audit, npm run theme-parity"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 3: Player Permalink Receipts + Share My Parse Summary

**The per-player OG card now shows Kill/Wipe, fight length, a vs-top-N comparison and one healer-or-DPS proof line read straight from the same helpers the player page uses, and the player scorecard leads with a "Share my parse" button that copies a normalized permalink and fires a unified `share_action` event, with "Copy for Discord" demoted to a secondary action that still works.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-15T22:53:26-07:00
- **Completed:** 2026-09-15T23:01:15-07:00
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- `app/og/route.tsx` PlayerCard branch now Promise.all's `/api/analyze` and `/api/report/{code}` to resolve the fight's Kill/Wipe outcome in parallel, degrading to `outcome: null` on any meta-fetch failure or unmatched fight — the player-card render is never gated on that second fetch
- `PlayerCard` gained the D-10 receipts: a Kill/Wipe pill + fight length in the encounter row, and a receipts row with a vs-top-N comparison label and one proof line (healer: effective HPS + overheal from `data.healer`; DPS: Active Time from the `metricPercentiles` `activeTime` entry) — no arithmetic of its own, only formatting of already-computed numbers
- `app/components/ComparisonSummary.tsx` gained a `handleSharePlayer` action building a single normalized `playerShareUrl` via `buildPlayerShareUrl`, reused by both buttons so no share surface in the file reads `window.location.href` directly anymore
- The player scorecard header now shows **Share my parse** (default variant, primary, `data-protected="share-player"`) beside **Copy for Discord** (outline variant, secondary, `data-protected="share-discord"`), both above the fold and wrapping on mobile
- `share_action` now fires with `kind: "player_link"` on Share my parse and `kind: "discord_text"` alongside the existing `discord_copied` on Copy for Discord (D-14 dual-emit, legacy series unbroken)
- `app/components/AnalysisView.tsx` forwards `reportCode`, `fightId`, `sourceId` (already in its own props) down to `ComparisonSummary` — no new fetch, no new state

## Task Commits

Each task was committed atomically:

1. **Task 1: Receipts on the per-player OG card** - `647bb16` (feat)
2. **Task 2: Share my parse becomes the primary action on the player scorecard** - `8e0b853` (feat)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `app/og/route.tsx` - Player branch fetches report meta in parallel with analyze; `PlayerCard` renders Kill/Wipe, fight length, vs-top-N and the healer/DPS proof line
- `app/components/AnalysisView.tsx` - Passes `reportCode`/`fightId`/`sourceId` down to `ComparisonSummary`
- `app/components/ComparisonSummary.tsx` - `handleSharePlayer` + widened props + reworked card header with both share buttons and `data-protected` attributes

## Decisions Made
- Routed the Discord scorecard's "Full breakdown" link through `buildPlayerShareUrl` instead of `window.location.href` — the plan's own acceptance gate for this file requires zero raw-location reads, and the key_links note ("no share surface reads the browser location") is file-scoped, not button-scoped. When `fightId`/`sourceId` are unknown the link line is simply omitted, matching the pre-existing behavior for a missing `shareUrl`.
- Implemented the OG card's comparison label and WIPE-percentage rounding exactly per the task's literal wording, which differs slightly from the existing Discord-text and AwardsCard phrasing/precision on the same data — see `key-decisions` in frontmatter for the specific deltas and why they're intentional, not drift.

## Deviations from Plan

None - plan executed exactly as written. (The two frontmatter `key-decisions` above are literal-spec-following choices where the plan's own wording differed slightly from sibling surfaces, not deviations from the plan.)

## Issues Encountered

Same local-environment gap already recorded by 03-01 and 03-02: local `next dev` has no `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` (Vercel-only per CLAUDE.md), so Task 1's own local smoke-check verify step — confirming the player OG URL returns `200 image/png` — passed, but the dev server log shows both `/api/analyze` and `/api/report/{code}` returned 500 on missing credentials, so the request actually rendered the `ReportCard` fallback, not a genuine `PlayerCard` with real receipts. The wiring (one `Promise.all`, exact `data.healer`/`activeTime` read sites, no arithmetic) is grep-gated, `tsc`/`eslint` clean, and the full 226-test suite is unaffected. What remains unverified locally is "renders correctly from real data" for the new receipts — the same gap the plan's own `must_haves.truths` backstop entry ("unfurls in a real Discord channel... verification: backstop") already anticipates, closed on the first preview/prod deploy with real WCL credentials.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`data-protected="share-player"` and `data-protected="share-discord"` are now live on the player scorecard for plan 03-05's `scripts/protected-elements.mjs` gate to assert against. `share_action` now carries both `player_link` and `discord_text` alongside the existing `awards_link`/`report_link` values already established by 03-01, so 03-06's OPS-01 share-rate HogQL has all four kinds available. No blockers. One item to close on the first preview/prod deploy of this phase (shared with 03-01/03-02): confirm the player OG card's new receipts actually render from genuine `/api/analyze` + `/api/report` data, not just the fallback path — not a code gap, a local-environment credential gap.

## Self-Check: PASSED

- Both modified-file sets confirmed present on disk (`[ -f ]` below).
- Both task commit hashes (`647bb16`, `8e0b853`) confirmed in `git log --oneline --all`.
- `npx tsc --noEmit` clean; `npx eslint app/og/route.tsx app/components/ComparisonSummary.tsx app/components/AnalysisView.tsx` reports no findings.
- `npx vitest run` → 18 files, 226 tests passed, no regressions.
- `npm run token-audit` → 0 non-allowlisted findings; `npm run theme-parity` → PASS.
- Re-ran all task-level `<acceptance_criteria>` grep gates verbatim: `receipts-wiring-ok` (promise-all=2, healer-reads=3, activetime-reads=3) and `share-wiring-ok` (all six exact-count checks plus `window.location.href` count 0) both pass.
- Re-ran the plan-level `<verification>`: vitest green, tsc clean, lint clean on touched files, token-audit + theme-parity exit 0, demo report's player OG URL returns `200 image/png` from a local dev server (see Issues Encountered for what that request actually exercised locally).

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*
