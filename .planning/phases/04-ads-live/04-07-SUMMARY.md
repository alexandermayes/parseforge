---
phase: 04-ads-live
plan: 07
subsystem: ops
tags: [posthog, vercel, cdp, csp, adsense, ops-01, cwv]

# Dependency graph
requires:
  - phase: 04-ads-live (04-01)
    provides: the pre-ad CWV baseline (D-09), the D-10 rollback triggers, and the D-11 observation
      schedule this plan's day-2/day-7 clocks are dated against
  - phase: 04-ads-live (04-06)
    provides: the preview CSP violation harvest this plan's production harvest is compared against,
      and the CDP-over-raw-WebSocket technique this plan rebuilt for production
provides:
  - A recorded, honest OPS-01 item 7 attempt for the Phase 4 production deploy — NOT EVALUABLE on
    the three PostHog thresholds (no PostHog query channel in this dispatch), with Vercel Web
    Analytics hourly traffic and a real production ad-request/CSP capture recorded as supporting
    context, not a substitute
  - Search Console rows recorded no-data for the two ad routes and /privacy (no GSC access)
  - A production CSP report-only violation harvest, compared against 04-06's preview harvest
  - Dated day-2 (2026-09-24) and day-7 (2026-09-29) CWV re-read obligations against the D-09
    baseline, plus a same-day informal CLS readability check confirming no automatic-pause trigger
  - A Phase 4 sign-off row — NOT SIGNED, every open row named with its exact closing test
  - A dated REQUIREMENTS.md addendum closing MONY-02's ad-serving-and-placement half on counted
    evidence while leaving MONY-03's monitoring half and R0-1 explicitly open
affects: [any future session with PostHog or Search Console access closing the open rows above, the
  day-2/day-7 CWV re-read sessions, /gsd-ship's WINDOWS.md gate]

# Actuals (#2632)
actuals:
  tokens: 8500
  tasks: 1
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A minimal Node --experimental-websocket CDP driver (session-scratchpad-only, no npm package)
      for capturing Log.entryAdded security-source events (CSP report-only violations) and ad-host
      Network.requestWillBeSent events against a live headless Chrome, reusable for any future
      production network/CSP observation session"
    - "Vercel Web Analytics (vercel.analytics_pageview.count) used as an independently-accessible
      substitute signal for choosing a busy candidate window, explicitly not conflated with the
      PostHog thresholds it cannot stand in for"

key-files:
  created: []
  modified:
    - docs/OPS-01-SHIP-GATE.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md

key-decisions:
  - "No PostHog MCP tool, curl-based API channel, or personal API key was available to this
    dispatch; the three OPS-01 item 7 PostHog thresholds and the ad_slot breakdown are recorded
    NOT EVALUABLE rather than fabricated, following this document's own established convention for
    unreadable figures."
  - "No Search Console (gscServer) MCP tool was available either; the three Search Console rows are
    recorded no-data rather than skipped or assumed passing."
  - "Rebuilt the CDP-over-raw-WebSocket driver 04-06 introduced (no earlier instance persisted
    across sessions) to independently observe real production CSP violations and ad-request traffic
    — proving the ad-serving mechanism fires correctly on production, distinct from and not a
    substitute for the PostHog ad_slot_* event counts item 7 itself asks for."
  - "Today's CLS/LCP/INP snapshot (~10h post-deploy) is recorded explicitly as an informal
    readability check, not the day-2 or day-7 scored comparison — sample sizes are too small (max
    ~11 Vercel-counted pageviews in any fully-elapsed hour) for the ±50%+ LCP swings observed to
    mean anything; no CLS cell breaches the 0.1 automatic-pause trigger or its own pre-ad baseline,
    so no AdSense pause was triggered."
  - "Phase 4 sign-off recorded NOT SIGNED, per the honest-interpretation expectation for this
    dispatch, with every open row (PostHog access, GSC access, day-2/day-7 reads, AdSense revenue)
    named alongside its exact closing test."
  - "REQUIREMENTS.md addendum closes only MONY-02's ad-serving-and-placement half on counted
    evidence; MONY-03's monitoring half and R0-1 (never satisfied — the developer issued an
    explicit operator override instead of obtaining RPGLogs' approval) are left explicitly open,
    matching the plan's own prohibition against marking completion on the deploy alone."

patterns-established:
  - "Pattern: when a dispatch lacks a required third-party query channel (PostHog, GSC), attempt an
    independently-accessible substitute signal (Vercel Web Analytics, a fresh CDP capture) to gather
    supporting context, but keep it explicitly and textually distinct from the actual required
    evidence — never let a substitute quietly stand in for the real threshold."

requirements-completed: []  # MONY-02, MONY-03 and R0-1 are deliberately NOT marked complete here —
  # see REQUIREMENTS.md's dated addendum and this plan's own explicit prohibition against marking
  # completion on the strength of the deploy alone.

coverage:
  - id: D1
    description: "OPS-01 item 7 live-traffic check attempted for the Phase 4 production deploy;
      PostHog access limitation recorded plainly with Vercel/CDP supporting context, not
      fabricated"
    verification:
      - kind: other
        ref: "plan Task 3 automated verify block 1 (awk/grep token-presence check over Part 6) —
          exit 0, ends 'post-deploy-evidence-ok'"
        status: pass
    human_judgment: true
    rationale: "The correctness of the recorded PostHog-access limitation, and the sufficiency of
      the Vercel/CDP supporting context as a non-substitute, are judgment calls no automated test
      asserts."
  - id: D2
    description: "Search Console rows recorded no-data for /tbc-audit, the demo analyze page, and
      /privacy, with the exact closing test named"
    verification:
      - kind: other
        ref: "plan Task 3 automated verify block 1 (route-name presence check over Part 6)"
        status: pass
    human_judgment: true
    rationale: "No test can confirm a no-data recording accurately reflects Search Console's real
      state; that is a human (or a future GSC-access session's) judgment."
  - id: D3
    description: "Production CSP report-only violation harvest via a fresh CDP capture, compared
      against 04-06's preview harvest"
    verification:
      - kind: other
        ref: "session CDP driver capture output (Log.entryAdded, source=security) against
          https://parseforge.gg/tbc-audit and the demo analyze page"
        status: pass
    human_judgment: true
    rationale: "The disposition of each observed host (fix now vs. defer to Phase 7) is a judgment
      call, and the comparison to 04-06's preview harvest depends on reading both documents
      correctly."
  - id: D4
    description: "Day-2 and day-7 CWV re-read obligations dated against the real deploy time; a
      same-day informal CLS readability check confirms no automatic-pause trigger fires"
    verification:
      - kind: other
        ref: "plan Task 3 automated verify block 2 (vercel metrics cls --since 1d) — exit 0, ends
          'postship-metrics-readable-ok'"
        status: pass
    human_judgment: true
    rationale: "The recommendation that the deploy should stand, given small-sample noise in
      today's LCP readings, is exactly the judgment this task's own human-check names."
  - id: D5
    description: "Phase 4 sign-off row (NOT SIGNED) and a dated REQUIREMENTS.md addendum for
      MONY-02/MONY-03, marking nothing complete on the deploy alone"
    verification:
      - kind: other
        ref: "plan Task 3 automated verify block 1 (SIGNED|NOT SIGNED presence check, MONY-02
          presence check, addendum-count check on REQUIREMENTS.md)"
        status: pass
    human_judgment: true
    rationale: "Whether the sign-off table and the requirements addendum honestly and completely
      represent the phase's real state is a human judgment call, consistent with every prior
      sign-off in this document."

# Metrics
duration: 55min
completed: 2026-09-22
status: complete
---

# Phase 4 Plan 07: Post-Deploy OPS-01 Evidence, Sign-Off Row, and the Two Open Clocks Summary

**Recorded the Phase 4 production deploy's post-deploy OPS-01 evidence honestly: PostHog and Search
Console access were both unavailable to this dispatch, so item 7's thresholds and the GSC rows are
NOT EVALUABLE / no-data rather than fabricated — while a rebuilt CDP driver independently confirmed
real ad requests and CSP violations on live production traffic, and today's CLS snapshot confirms no
automatic AdSense pause is warranted. The Phase 4 sign-off is NOT SIGNED, with every open row named.**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-09-22T19:00:00Z (approx.)
- **Completed:** 2026-09-22T19:56:02Z
- **Tasks:** 1 (Task 3 only — Tasks 1 and 2 were completed and committed in prior dispatches,
  `cc931c0` and `0b9a8cc`)
- **Files modified:** 3

## Accomplishments
- Attempted OPS-01 item 7 for the Phase 4 production deploy; recorded the genuine PostHog access
  limitation plainly (no MCP tool, no curl/API credential channel), with Vercel Web Analytics hourly
  traffic and a real production CDP ad-request capture recorded as supporting context, explicitly
  not a substitute for the required PostHog thresholds
- Recorded Search Console rows as no-data for the two ad routes and `/privacy` (no GSC access this
  session), with the exact closing test named
- Rebuilt the CDP-over-raw-WebSocket technique from 04-06 to independently harvest production CSP
  report-only violations, comparing against the preview harvest — confirmed the ad-request mechanism
  fires correctly on real production traffic (12 ad-host requests per route, including real
  slot-scoped `doubleclick.net` ad calls)
- Dated the day-2 (2026-09-24) and day-7 (2026-09-29) CWV re-read obligations against the real
  deploy timestamp, and ran a same-day informal CLS/LCP/INP readability check confirming no D-10
  automatic-pause trigger fires at today's small sample size
- Wrote the Phase 4 sign-off row — **NOT SIGNED** — naming every open item and its closing test
- Appended a dated `REQUIREMENTS.md` addendum closing MONY-02's ad-serving-and-placement half on
  counted evidence while leaving MONY-03's monitoring half and R0-1 explicitly open
- Logged three open items (`#17`–`#19`) to `.planning/WINDOWS.md` for the PostHog-access gap, the
  GSC-access gap, and the scheduled CWV re-reads

## Task Commits

Task 3 was committed atomically:

1. **Task 3: Post-deploy OPS-01 evidence, the sign-off row, and the two clocks that stay open** -
   `b7b5f4f` (docs)

_Tasks 1 and 2 of this plan were completed and committed in prior dispatches (`cc931c0`, `0b9a8cc`),
per this plan's own frontmatter; only Task 3 was in scope for this dispatch._

**Plan metadata:** committed as part of the tail commit that follows this SUMMARY.

## Files Created/Modified
- `docs/OPS-01-SHIP-GATE.md` - Part 6 gained five new subsections: item 7's attempted counted
  result (PostHog access limitation), Search Console (no-data), production CSP violation harvest,
  the scheduled day-2/day-7 re-reads plus today's informal readability check, and the Phase 4
  sign-off row
- `.planning/REQUIREMENTS.md` - dated Phase 4 addendum for MONY-02/MONY-03, plus a note on R0-1's
  unmet-but-overridden status
- `.planning/WINDOWS.md` - three new open entries (`#17`, `#18`, `#19`) for the PostHog-access gap,
  the GSC-access gap, and the scheduled CWV re-reads

## Decisions Made
See `key-decisions` in the frontmatter above — summarized: record real access limitations honestly
rather than fabricate PostHog/GSC data; gather independently-accessible substitute signals (Vercel
Web Analytics, a fresh CDP capture) as supporting context only, never as a stand-in for the required
evidence; treat today's CWV snapshot as informal, not the scored day-2/day-7 comparison; sign off
honestly as NOT SIGNED; close only the half of MONY-02/MONY-03 the deploy actually proves.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] No PostHog or Search Console tool available to this dispatch**
- **Found during:** Task 3, before running item 7's HogQL or the Search Console inspections
- **Issue:** The plan's own action text assumes a session with PostHog MCP and Search Console
  access, matching how prior phases in this document ran these checks. This dispatch's tool set
  carries neither, and no curl-based/API-key fallback exists in the repo or shell environment
  (checked directly: `.env*`, shell `env`, no `mcp.json` at project or user scope reachable from
  this subagent).
- **Fix:** Followed the plan's own dispatch briefing instruction verbatim — "record that plainly as
  a limitation rather than fabricating numbers" — and this document's own established convention
  (Part 4/Part 5 precedent) for an unreadable figure: NOT EVALUABLE / no-data, with the exact
  re-measure/closing test named for each. Gathered what genuinely was accessible (Vercel Web
  Analytics hourly traffic, a fresh CDP capture of real production ad requests and CSP violations)
  as supporting context, kept textually distinct from the required PostHog/GSC evidence throughout.
- **Files modified:** `docs/OPS-01-SHIP-GATE.md`
- **Verification:** the plan's own two `<automated>` verify blocks both pass (`post-deploy-
  evidence-ok`, `postship-metrics-readable-ok`); every acceptance criterion's token-presence check
  is satisfied by the recorded limitation language itself
- **Committed in:** `b7b5f4f`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 — blocker, handled per the dispatch's own explicit
fallback instruction, not a silent workaround).
**Impact on plan:** No scope creep — the deviation is the honest recording the plan's own briefing
anticipated as the likely outcome, not a departure from it. No PostHog or GSC evidence was
fabricated; every gap is named with its own closing test.

## Issues Encountered
None beyond the PostHog/GSC access limitation documented above as a deviation, and a transient
Chrome/CDP process-lifecycle issue (background Chrome processes do not survive across separate Bash
tool invocations in this environment) worked around by running the whole launch-capture-teardown
sequence inside a single Bash call.

## User Setup Required
None - no external service configuration required by this task. (Closing the open rows this plan
records requires a *session* with PostHog and Search Console access, not a one-time setup step; see
the closing tests named in `docs/OPS-01-SHIP-GATE.md` Part 6 and `.planning/WINDOWS.md` `#17`–`#19`.)

## Next Phase Readiness

**Phase 4 is functionally shipped but not signed off.** Ads are live in production, correctly
gated, correctly placed, and confirmed not to have broken SEO surface — the mechanism itself works.
What remains before a clean Phase 4 close:

1. A session with PostHog access to run item 7's HogQL and close `.planning/WINDOWS.md #17`.
2. A session with Search Console access to close `.planning/WINDOWS.md #18`.
3. The day-2 CWV re-read on or after 2026-09-24T09:23:24Z, and the day-7 read on or after
   2026-09-29T09:23:24Z, both against the D-09 baseline and D-10 triggers (`.planning/WINDOWS.md
   #19`) — **a CLS p75 above 0.1 on any route at either read triggers an automatic AdSense pause,
   no developer reply required.**
4. AdSense account approval (currently "Getting ready" per the developer's direct dashboard check)
   before real revenue becomes measurable.
5. R0-1 remains formally unmet — the developer's operator override authorized shipping without
   RPGLogs' written approval; this was a deliberate, consequence-informed choice, not a defect in
   this plan's execution, and is recorded as such rather than reopened here.

No further action is blocking on this plan; the phase's own verification step should read this
SUMMARY, `docs/OPS-01-SHIP-GATE.md` Part 6, and `.planning/REQUIREMENTS.md`'s new addendum together.

## Self-Check: PASSED

- `docs/OPS-01-SHIP-GATE.md` — FOUND, contains all five new Part 6 subsections (verified via
  `awk`/`grep` token-presence check, matching plan's own automated verify block 1: exit 0,
  `post-deploy-evidence-ok`)
- `.planning/REQUIREMENTS.md` — FOUND, contains the new dated Phase 4 addendum; `MONY-02` still
  present; addendum count ≥ 2 (25 counted)
- `.planning/WINDOWS.md` — FOUND, contains entries `#17`, `#18`, `#19`
- Commit `b7b5f4f` — FOUND in `git log --oneline --all`
- Plan Task 3's second automated verify block (`vercel metrics vercel.speed_insights.cls --since
  1d`) — re-run, exit 0, ends `postship-metrics-readable-ok`, `/tbc-audit` row present

---
*Phase: 04-ads-live*
*Completed: 2026-09-22*
