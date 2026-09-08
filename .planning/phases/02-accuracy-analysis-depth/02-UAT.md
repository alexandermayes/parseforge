---
status: testing
phase: 02-accuracy-analysis-depth
source: [02-VERIFICATION.md]
started: 2026-09-08T18:36:00Z
updated: 2026-09-08T18:36:00Z
---

## Current Test

number: 1
name: PostHog event definitions registered + Search Console inspection against the Phase 2 production build
expected: |
  Each of the six events — timeline_viewed, timeline_error, timeline_filter_used, analysis_complete,
  theme_changed, consent_resolved — appears in the PostHog project's event-definitions list with the
  props this phase's grep evidence confirms (report_code, fight_id, cast_count, truncated,
  ability_count, hidden_count, player_role, overheal_percent, activity_percent,
  top_overheal_percent, suggestion_count). Search Console shows /analyze/{code} and / indexable
  with no new coverage or manual-action issues on the Phase 2 production build
  (dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c).
awaiting: user response

## Tests

### 1. PostHog event definitions registered + Search Console inspection against the Phase 2 production build
expected: Each event appears in PostHog's event-definitions list with the props this phase's grep evidence confirms (report_code, fight_id, cast_count, truncated, ability_count, hidden_count, player_role, overheal_percent, activity_percent, top_overheal_percent, suggestion_count); GSC shows /analyze/{code} and / indexable with no new coverage or manual-action issues.
why_human: No PostHog or gscServer MCP tool was available to the 02-09 executor or the verifier — this is an external-service confirmation step, not something a grep or local test run can prove. The code-side mechanism (single capture call site per event, unchanged canonical/robots/structured-data for /analyze) is independently verified in 02-VERIFICATION.md and is low-risk, but ROADMAP success criterion 5 explicitly requires the events to be confirmed and the GSC pass to be run, not merely coded.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
