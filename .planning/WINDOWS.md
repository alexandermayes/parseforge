---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-09-06T22:32:55.462Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | app/components/RaidOverview.tsx |  | 01-05 Task 3 human-check (class/role legibility in both themes, role-badge tint, OG card) deferred to end-of-phase human verification per workflow.human_verify_mode=end-of-phase | open |  | 2026-09-06T22:32:55.462Z |  |

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
  }
]
````
