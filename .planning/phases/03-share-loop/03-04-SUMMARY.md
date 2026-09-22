---
phase: 03-share-loop
plan: 04
subsystem: ui
tags: [react, posthog, share-links, awards-engine, next-og]

requires:
  - phase: 03-share-loop plan 01
    provides: "lib/awards-engine.ts computeAwards over RaidOverviewResult; lib/share-links.ts buildReportShareUrl/buildAwardsShareUrl/buildAwardsOgPath/parseShareRef"
provides:
  - "app/components/RaidOverview.tsx AwardsPanel — fired award rows + the real 1200x630 /og preview image + Copy awards link button, computed from the RaidOverviewResult already in memory (no extra fetch)"
  - "Widened RaidOverviewProps (reportCode, fight, openAwards) and the panel's data-protected=\"awards-panel\"/\"awards-preview\"/\"share-awards\" attributes"
  - "app/analyze/[reportCode]/AnalyzeClient.tsx header Share normalized via buildReportShareUrl (no more raw location.href read), dual-emitting share_action{kind:report_link} alongside the legacy share_link_copied"
  - "Bottom glass \"Found this useful?\" share bar removed entirely — no replacement"
  - "Landing-tab default: source-present + tab-absent opens Player tab; view=awards keeps Raid tab and the panel scrolls itself into view"
  - "One mount effect resolving ref via parseShareRef, capturing share_landing for an allowlisted value only, then stripping ref from the address bar"
affects: [03-05, 03-06, 03-07]

actuals:
  tokens: 3491
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "The awards panel and the /og image now share one computeAwards call site each (RaidOverview.tsx, app/og/route.tsx) — the D-06/D-08 no-drift guarantee extends from the OG-only tracer (03-01) into the in-app UI"
    - "Client components that need a normalized share URL always call the lib/share-links.ts builder with an explicit origin — RaidOverview.tsx and AnalyzeClient.tsx both read window.location.origin, never window.location.href"
    - "A mount-once effect guarded by a useRef boolean (not React state) is the established idiom for 'run exactly once even though a dependency changes during the effect's own side effect' — used here for the ref capture-and-strip, matching the panel's own scroll-once effect and Phase 2.1's WR-03 dedupe precedent"

key-files:
  created: []
  modified:
    - app/components/RaidOverview.tsx
    - app/analyze/[reportCode]/AnalyzeClient.tsx

key-decisions:
  - "Task 2 and Task 3 both touch app/analyze/[reportCode]/AnalyzeClient.tsx with overlapping infrastructure (a shared react import line, the activeTab default computation). To keep each task's commit atomic and independently verifiable rather than landing both tasks' code in one commit, the task-3-only pieces (TAB_MODES/isTabMode, the source-aware tab default, the ref-capture-and-strip effect, the openAwards prop) were temporarily reverted after Task 3 was implemented and verified, Task 2's isolated state was re-verified (tsc/eslint/token-audit/theme-parity) and committed, then Task 3's pieces were re-applied byte-for-byte and re-verified (tsc/eslint/vitest) before its own commit — the final working-tree state is identical to what Task 3's own verification already passed once; this was a commit-sequencing technique, not a code change."
  - "AwardsPanel's Copy awards link button uses the Link2 icon (matching ComparisonSummary's 'Share my parse' idiom for copying a URL), not the Copy icon that Copy for Discord uses for copying formatted text — keeps the two different copy actions visually distinct across the page."
  - "The awards panel header's Wipe percentage uses Math.round(bossPercentage / 100) (a whole-number percent), matching the 03-03 PlayerCard receipts pill rather than the AwardsCard OG image's toFixed(1) precision — the task text's literal 'rounded boss percentage' wording, an intentional smaller-UI-element precision choice already established as a non-issue by 03-03's own key-decisions."

patterns-established:
  - "Any new client-side share surface that needs 'the report code + fight + source (or view)' state reaches for a single useMemo-derived value computed from data already in AnalyzeClient (e.g. selectedFightEntry), rather than re-deriving it or threading raw searchParams further down the tree."

requirements-completed: [SHARE-01, SHARE-02, SHARE-03]

coverage:
  - id: D1
    description: "RaidOverview.tsx's new AwardsPanel computes its rows via one computeAwards(data, { name, outcome }) call over the RaidOverviewResult already in memory, renders the fired rows (icon, title, class-coloured winners, +N overflow, stat) and the real /og preview image via buildAwardsOgPath, renders nothing when fewer than MIN_AWARDS_FOR_CARD rows fired, and is the first interactive element under the Raid tab header (above Raid Buff Coverage)"
    requirement: SHARE-03
    verification:
      - kind: other
        ref: "grep gate: computeAwards=1, data-protected(awards-panel/awards-preview/share-awards)=1 each, kind: \"awards_link\"=1, buildAwardsOgPath(=1, buildAwardsShareUrl(=1, window.location.href=0, AwardsPanel-before-RaidBuffBar (panel-wiring-ok)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit, npx eslint app/components/RaidOverview.tsx, npm run token-audit, npm run theme-parity"
        status: pass
    human_judgment: false
  - id: D2
    description: "The awards panel's fired rows and the /og preview image render correctly from a genuine RaidOverviewResult (not just the never-fail fallback), and the Copy awards link button is reachable without scrolling past the raid table on a phone"
    requirement: SHARE-03
    verification: []
    human_judgment: true
    rationale: "Local next dev has no WCL_CLIENT_ID/SECRET (Vercel-only per CLAUDE.md), so the panel's computeAwards input (the raid-overview API result) and the /og preview image's own data fetch both degrade to empty/fallback locally — the wiring is grep-gated and code-reviewed (same gap already recorded by 03-01/03-02/03-03), but 'renders correctly from real data' needs the first preview/prod deploy with real credentials. Mobile reachability is the plan's own explicit backstop truth (no viewport harness in this repo) and is confirmed by the developer at the 03-06 preview gate, not by a test here."
  - id: D3
    description: "Header Share now builds its URL via buildReportShareUrl(origin, { reportCode, fightId }) instead of reading window.location.href, dual-emits share_action{kind:report_link} alongside the legacy share_link_copied, carries data-protected=\"share-header\", and the bottom glass \"Found this useful?\" bar is removed with no replacement; RaidOverview's call site now passes reportCode and the selected fight entry"
    requirement: SHARE-03
    verification:
      - kind: other
        ref: "grep gate: buildReportShareUrl(=1, kind: \"report_link\"=1, share_link_copied=1, data-protected=share-header=1, onClick={handleShareLink}=1, 'Found this useful'=0, window.location.href=0 (header-share-ok)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit, npx eslint, npm run token-audit, npm run theme-parity"
        status: pass
    human_judgment: false
  - id: D4
    description: "Initial tab computation opens Player when source is present and tab is absent (explicit tab still wins), an awards-view visitor keeps the Raid default with openAwards passed to RaidOverview, and one mount effect (guarded by a ref, not state) resolves ref via parseShareRef, captures share_landing with only the allowlisted value, and strips ref via updateUrlParam(\"ref\", null)"
    requirement: SHARE-02
    verification:
      - kind: other
        ref: "grep gate: parseShareRef(=1, posthog.capture(\"share_landing\")=1, updateUrlParam(\"ref\", null)=1, openAwards=1, no searchParams.get inside the share_landing call (landing-wiring-ok, ref-allowlist-ok)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit, npx eslint, npx vitest run (18 files, 226 tests, no regressions)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A visitor landing with source present and tab absent actually sees the Player tab's analysis loading (not just an idle tab), and a visitor landing with view=awards actually sees the awards panel scrolled into view"
    requirement: SHARE-02
    verification: []
    human_judgment: true
    rationale: "The auto-run condition this depends on (usePlayerAnalysis's shouldAutoRun) and the panel's scroll-into-view effect are both read/reviewed as wired correctly, but no browser-driven test exercises an actual page load in this repo (node-env Vitest only) — the plan's own Flagged Assumptions section names this exact gap and defers behavioral confirmation to the 03-06 preview gate."

duration: 11min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 4: Awards Panel, Share Normalization & Landing Attribution Summary

**The Raid tab now leads with an `AwardsPanel` showing the exact fired-award rows and the real Discord-bound `/og` image with a one-click "Copy awards link"; the header Share copies a normalized, ref-tagged report link instead of the raw address bar; the weakest "Found this useful?" share slot is gone; and an inbound visitor from any shared link now lands on the tab the card promised, is counted once via a `share_landing` capture, and never carries the `ref` forward.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-16T06:03:49Z
- **Completed:** 2026-09-16T06:14:49Z
- **Tasks:** 3 completed
- **Files modified:** 2

## Accomplishments
- `app/components/RaidOverview.tsx` gained `AwardsPanel`: computes its rows with one `computeAwards(data, { name, outcome })` over the already-in-memory `RaidOverviewResult`, renders the fired award rows (icon, title, class-coloured winner names, `+N` overflow, stat) plus the real `/og?view=awards` preview image via `buildAwardsOgPath`, renders nothing below `MIN_AWARDS_FOR_CARD`, and sits above the Raid Buff Coverage block so its "Copy awards link" button is the first interactive element under the Raid tab header
- `RaidOverviewProps` widened with `reportCode`, `fight`, and `openAwards`; the panel scrolls itself into view exactly once on mount when `openAwards` is true, guarded by a `useRef` (never re-triggers)
- `AnalyzeClient.tsx`'s header Share now builds its URL via `buildReportShareUrl(window.location.origin, { reportCode, fightId: selectedFight })` instead of reading `window.location.href`, and dual-emits `share_action{kind: "report_link"}` alongside the existing `share_link_copied`
- The bottom glass "Found this useful? Share it with your guild." bar is deleted entirely — no replacement; the `RaidOverview` call site now feeds it `reportCode` and the selected fight entry (via a `useMemo` lookup into `report.fights`)
- Landing behaviour: the initial tab now opens Player when `source` is present and `tab` is absent (explicit `tab` still wins), and an awards-view visitor keeps the Raid default with `openAwards` wired through
- One mount effect, guarded by a `useRef` boolean (not state) so it runs exactly once even though stripping the param changes `searchParams`, resolves `ref` through `parseShareRef`, captures `share_landing` with only the allowlisted value (never the raw query string), and removes `ref` from the address bar via `updateUrlParam("ref", null)`

## Task Commits

Each task was committed atomically:

1. **Task 1: The Raid tab awards panel with its real inline preview** - `900373a` (feat)
2. **Task 2: Normalize the header Share, retire the bottom bar, feed the panel** - `44c937b` (feat)
3. **Task 3: Landing rules and the inbound attribution funnel** - `6c1d3c4` (feat)

**Plan metadata:** (this commit, docs)

_Note: Tasks 2 and 3 both touch `AnalyzeClient.tsx` with overlapping infrastructure (a shared react import line, the tab-default computation). Task 3 was implemented and verified first, then temporarily reverted to produce a clean Task-2-only intermediate state, which was re-verified and committed; Task 3's pieces were then re-applied byte-for-byte and re-verified before its own commit. The final working tree is identical to what was verified — see Decisions Made._

## Files Created/Modified
- `app/components/RaidOverview.tsx` - New `AwardsPanel` function, widened `RaidOverviewProps`, `computeAwards`/`buildAwardsShareUrl`/`buildAwardsOgPath` imports
- `app/analyze/[reportCode]/AnalyzeClient.tsx` - Normalized `handleShareLink`, `data-protected="share-header"`, bottom bar removed, `selectedFightEntry` lookup, source-aware tab default, `ref` capture-and-strip mount effect, `openAwards` wiring

## Decisions Made
- Task 2/Task 3 commit sequencing: reconstructed a clean Task-2-only intermediate state (temporarily reverting Task 3's pieces) so each task lands as its own atomic, independently-gate-passing commit despite both tasks sharing a few lines of infrastructure in the same file. Not a code change — the final diff is identical to what Task 3's own verification already passed once.
- `AwardsPanel`'s "Copy awards link" button uses the `Link2` icon (matching `ComparisonSummary`'s "Share my parse" idiom for copying a URL) rather than the `Copy` icon `ComparisonSummary`'s "Copy for Discord" uses for copying formatted text — keeps the two different copy actions visually distinguishable.
- The panel's Wipe pill uses `Math.round(bossPercentage / 100)` (whole-number percent), matching 03-03's `PlayerCard` receipts precision rather than the `AwardsCard` OG image's `toFixed(1)` — the task text's literal "rounded boss percentage" wording, the same kind of intentional per-surface precision choice 03-03 already documented.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Same local-environment gap already recorded by 03-01/03-02/03-03: local `next dev` has no `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` (Vercel-only per CLAUDE.md), so the awards panel's `computeAwards` input and its `/og` preview image both depend on live data this local environment cannot fetch. The wiring (single `computeAwards(` call site, exact `data-protected` attributes, correct render order, no raw `window.location.href` anywhere in either file) is grep-gated, `tsc`/`eslint` clean on both touched files, and the full 226-test suite is unaffected. What remains unverified locally is "renders correctly from real data" for the panel and the landing/tab-default behavioral truths (D2 and D5 above) — both are explicit backstop items in the plan's own `must_haves` and `Flagged Assumptions` sections, closed at the 03-06 preview gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`data-protected="awards-panel"`, `"awards-preview"`, `"share-awards"`, and `"share-header"` are now live for plan 03-05's `scripts/protected-elements.mjs` gate to assert against. `share_action` now carries `report_link` and `awards_link` (alongside `player_link`/`discord_text` from 03-03), and `share_landing` is live for 03-06's OPS-01 share-rate and attribution HogQL. No blockers. Two items carried to the 03-06 preview gate (shared with every prior plan in this phase): confirm the awards panel and its `/og` preview genuinely render from real raid-overview data, and behaviorally confirm the two landing rules (source→Player tab loading, view=awards→Raid tab scrolled) plus mobile reachability of the Copy awards link button.

## Self-Check: PASSED

- Both modified files confirmed present on disk (`[ -f ]` below).
- All three task commit hashes (`900373a`, `44c937b`, `6c1d3c4`) confirmed in `git log --oneline --all`.
- `npx tsc --noEmit` clean; `npx eslint app/components/RaidOverview.tsx 'app/analyze/[reportCode]/AnalyzeClient.tsx'` reports no findings (zero occurrences in a full `npm run lint` run, whose 1698 pre-existing findings are all in `.codex/hooks/*` and one unrelated `CastTimeline.tsx` warning).
- `npx vitest run` → 18 files, 226 tests passed, no regressions.
- `npm run token-audit` → 0 non-allowlisted findings; `npm run theme-parity` → PASS.
- Re-ran every task-level `<acceptance_criteria>` grep gate verbatim: `panel-wiring-ok`, `header-share-ok`, `landing-wiring-ok`, and `ref-allowlist-ok` all pass with the exact expected counts.
- Re-ran the plan-level `<verification>`: vitest green, tsc clean, lint clean on touched files, token-audit + theme-parity exit 0; one call site each confirmed for `share_action{awards_link}`, `share_action{report_link}`, the legacy `share_link_copied`, and `share_landing`; the bottom glass share bar confirmed absent; all four `data-protected` values confirmed present exactly once each.

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*
