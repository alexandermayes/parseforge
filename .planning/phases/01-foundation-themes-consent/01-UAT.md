---
status: complete
phase: 01-foundation-themes-consent
source: [01-VERIFICATION.md]
started: 2026-09-07T05:15:00Z
updated: 2026-09-07T05:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Theme toggle — no-flash, persistence, cross-tab sync, mobile reachability
expected: First paint matches the persisted/OS theme with no flash; explicit Light/Dark survives reload + navigation; System follows the OS; a second tab syncs; menu usable at 375px.
result: pass

### 2. Consent dialog — EEA/UK vs US behaviour on the live CMP
expected: From an EEA/UK IP (VPN) in a fresh profile, Google's full-screen TCF dialog renders cleanly with no half-rendered shell or layout shift; Accept and Reject both leave the site usable. From a US IP no dialog appears. (Optionally: after Accept from EEA, `consent_resolved` shows in PostHog live events.)
result: pass

### 3. Light-mode legibility sweep — all 11 routes
expected: In Light and Dark: no unreadable text, no dark-on-light card, grade/percentile badges, class-coloured names (esp. Priest, Rogue, Paladin), role-badge tints, progress bars, nav glass and hero glow all render with adequate contrast. Routes: /, /guides, the 5 guide pages, /tbc-audit, /privacy, /terms, /analyze/ZjKgNYxVcAqR8pGJ (all 3 tabs).
result: pass

### 4. OG unfurl — class colours after the Satori hex-path change
expected: Pasting an /analyze/ZjKgNYxVcAqR8pGJ link into Discord (or an unfurl preview tool) shows the OG card with the same WoW class colours as before this phase.
result: pass

### 5. Phone spot check — light mode on a real device
expected: On a phone in light mode, two guide pages and the analyze page read correctly (no horizontal scroll, readable class/tier colours, footer Privacy · Terms links present on /).
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
