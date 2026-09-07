---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-09-07T04:26:44.848Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | app/components/RaidOverview.tsx |  | 01-05 Task 3 human-check (class/role legibility in both themes, role-badge tint, OG card) deferred to end-of-phase human verification per workflow.human_verify_mode=end-of-phase | open |  | 2026-09-06T22:32:55.462Z |  |
| 2 | 01 | unrun-verify | app/components/LandingHero.tsx |  | Live-browser confirmation deferred: migrated status/gold/arcane/tier token colours (7 analysis components + LandingHero decorative gradients) not yet visually confirmed in both themes; also spot-check SparklesText's SVG fill=var(...) resolves correctly. | open |  | 2026-09-06T23:01:42.780Z |  |
| 3 | 01 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 01-08 Task 1 human-check (11-route theme sweep, Light/Dark) deferred to end-of-phase human verification per workflow.human_verify_mode=end-of-phase; no automated visual-regression/browser-automation tool available this session | open |  | 2026-09-07T04:26:44.848Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "app/components/RaidOverview.tsx",
    "line": null,
    "description": "01-05 Task 3 human-check (class/role legibility in both themes, role-badge tint, OG card) deferred to end-of-phase human verification per workflow.human_verify_mode=end-of-phase",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T22:32:55.462Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "app/components/LandingHero.tsx",
    "line": null,
    "description": "Live-browser confirmation deferred: migrated status/gold/arcane/tier token colours (7 analysis components + LandingHero decorative gradients) not yet visually confirmed in both themes; also spot-check SparklesText's SVG fill=var(...) resolves correctly.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T23:01:42.780Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "01-08 Task 1 human-check (11-route theme sweep, Light/Dark) deferred to end-of-phase human verification per workflow.human_verify_mode=end-of-phase; no automated visual-regression/browser-automation tool available this session",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T04:26:44.848Z",
    "resolved_at": null
  }
]
````
