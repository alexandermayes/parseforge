---
status: testing
phase: 03-share-loop
source: [03-VERIFICATION.md]
started: 2026-09-19T01:21:02Z
updated: 2026-09-19T01:21:02Z
---

## Current Test

number: 1
name: Real Discord unfurl of both production share links
expected: |
  Paste https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards&v=<fresh>
  and https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse&v=<fresh>
  into a real Discord channel (change v= on every retry). Both unfurl inline as images; award rows
  and the per-player receipts are legible; the longest raider names clip with an ellipsis rather
  than overflow.
awaiting: user response

## Tests

### 1. Real Discord unfurl of both production share links
expected: Both the awards card and the per-player card unfurl as images in a real Discord embed, rows/receipts legible, long names clipped cleanly. (Closes docs/OPS-01-SHIP-GATE.md Part 5 row 8 and part of .planning/WINDOWS.md #9.)
result: [pending]

### 2. First-hand D-04 award-pool tone verdict
expected: The developer states, in their own words, that the fifteen-row award pool in lib/awards-engine.ts clears the D-01 tone bar (every jab is about a measurable fact, nothing insults a named real raider, no rule designates a single worst player) — or names the failing row. A first-hand verdict, not a delegated one. (Upgrades Part 5 row 7 from delegated PASS; closes the rest of WINDOWS.md #9.)
result: [pending]

### 3. D-14 share-rate re-read (date-gated — on/after 2026-09-23T09:15Z)
expected: Re-run the 7-day D-14 share-rate HogQL against PostHog project 337485 once a full 7 days of live share_action exposure exists, and append a dated confirmation or correction to docs/OPS-01-SHIP-GATE.md Part 5 (the sign-now-conditional obligation). Do NOT run before 2026-09-23T09:15Z. (Closes WINDOWS.md #11.)
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
