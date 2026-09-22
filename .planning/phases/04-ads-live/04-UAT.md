---
status: testing
phase: 04-ads-live
source: [04-VERIFICATION.md]
started: 2026-09-22T20:35:00Z
updated: 2026-09-22T20:35:00Z
---

## Current Test

number: 1
name: OPS-01 item 7 — PostHog live-traffic thresholds and ad_slot breakdown
expected: |
  ad_slot_shown/ad_slot_filled events present with correct consent_gate_path values; no
  measurable drop in analyze-completion rate attributable to ad slots.
awaiting: user response

## Tests

### 1. OPS-01 item 7 — PostHog live-traffic thresholds and ad_slot breakdown
expected: Re-run the OPS-01 item 7 HogQL statements against PostHog project 337485 (ad_slot event
  breakdown by consent_gate_path, analyze-completion impact). Expect ad_slot_shown/ad_slot_filled
  events present with correct consent_gate_path values, no measurable drop in analyze-completion
  rate attributable to ad slots.
result: [pending] — no PostHog query channel was available to the executing session or this
  verification pass (WINDOWS.md #17); this is a live-traffic analytics read, not answerable from
  static inspection.

### 2. Google Search Console — ad-route indexing state
expected: URL-inspect /tbc-audit, the demo analyze page, and /privacy in Search Console
  (sc-domain:parseforge.gg). Expect no ranking/indexing regression attributable to the ad change,
  all three routes still indexed as expected.
result: [pending] — no GSC access was available to the executing session or this verification pass
  (WINDOWS.md #18).

### 3. Day-2 and day-7 CWV re-reads against the D-09 pre-ad baseline
expected: Re-run the three `vercel metrics` commands (lcp_ms, inp_ms, cls; p75; group-by
  route+device_type) on/after 2026-09-24T09:23:24Z (day-2) and on/after 2026-09-29T09:23:24Z
  (day-7); append a dated PASS/breach row against every D-10 trigger in
  docs/OPS-01-SHIP-GATE.md Part 6. Expect no route/device pair breaches CLS p75 > 0.1 (absolute),
  LCP p75 worse than baseline by >20%, or INP p75 > 200ms; automatic AdSense pause fires
  immediately per the D-08 runbook if CLS is breached at either scored read.
result: [pending] — not due yet (WINDOWS.md #19); deploy was 2026-09-22T09:23:24Z, today is
  2026-09-22. Scheduled, real-traffic measurement no static check can accelerate.

### 4. AdSense account approval and real ad revenue
expected: Check the AdSense dashboard for account-approval status and confirm real ad revenue is
  accruing (not just ad requests firing). Expect account approved, ads.txt recognized, revenue > $0
  reported for a meaningful window.
result: [pending] — as of 2026-09-22 the AdSense dashboard read "Getting ready" / ads.txt "Not
  found" in Google's own UI (developer's direct check, recorded in
  docs/OPS-01-SHIP-GATE.md sign-off row 13). External approval state, not inspectable from the
  codebase or via curl.

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

One accepted override, not a gap requiring a test: R0-1 (RPGLogs written commercial-use approval
before shipping ads) was not obtained. The developer explicitly authorized shipping without it
after being told the real consequence (API-client revocation risk, not a fine) — recorded verbatim
in docs/OPS-01-SHIP-GATE.md `### Deploy decision (Phase 4, 2026-09-22)` and in
04-VERIFICATION.md's frontmatter `overrides` block. This does not require a UAT pass; it is a
recorded business decision by the account owner, not an engineering defect.

One Info-level finding from verification (not a UAT item, worth reading before the day-2 test):
`docs/OPS-01-SHIP-GATE.md`'s D-10 rollback-trigger table states the CLS trigger as a flat "> 0.1"
absolute number, but the post-deploy narrative reinterprets it as baseline-relative specifically
for `/analyze/[reportCode]` (whose pre-ad baseline already exceeded 0.1) to explain why today's
informal reading isn't a breach. Recommend making that carve-out explicit in the D-10 table before
the day-2 scored read, so the automatic-pause call isn't made ad hoc under time pressure.
