---
schema_version: 1
open_count: 6
waived_count: 0
fixed_count: 0
total_count: 6
last_updated: 2026-09-08T02:21:39.073Z
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
| 4 | 02 | deviation | lib/generated/index.ts |  | Enchant/gem era composition uses Classic+TBC-first precedence (not later-era-wins as the plan's literal text describes) — required to keep cla-constants.test.ts passing against real cross-era ID reuse. | open |  | 2026-09-08T02:21:30.999Z |  |
| 5 | 02 | deviation | lib/generated/game-data-overrides.json |  | Cata weapon-enhancement consumable ids 96264 (Pyrium Weapon Chain) and 96294 (Pyrium Shield Spike) resolve to a SpellName value that looks unrelated to the curated item and could not be corroborated against another era; preserved via override pending a future human/ItemSparse-based verification pass. | open |  | 2026-09-08T02:21:38.992Z |  |
| 6 | 02 | deviation | lib/generated/game-data.consumables.ts |  | Consumable-name derivation via direct SpellName.Name_lang per-id lookup resolved only 48/178 (27%) names reliably; the remaining 130 needed a consumableNames override (prefix loss, generic buff-aura collapse, or unresolvable era coverage) — a future item-name-based (ItemSparse) derivation pass could raise the wago-verified ratio for this map. | open |  | 2026-09-08T02:21:39.073Z |  |

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
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "02",
    "file": "lib/generated/index.ts",
    "line": null,
    "description": "Enchant/gem era composition uses Classic+TBC-first precedence (not later-era-wins as the plan's literal text describes) — required to keep cla-constants.test.ts passing against real cross-era ID reuse.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T02:21:30.999Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "02",
    "file": "lib/generated/game-data-overrides.json",
    "line": null,
    "description": "Cata weapon-enhancement consumable ids 96264 (Pyrium Weapon Chain) and 96294 (Pyrium Shield Spike) resolve to a SpellName value that looks unrelated to the curated item and could not be corroborated against another era; preserved via override pending a future human/ItemSparse-based verification pass.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T02:21:38.992Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "02",
    "file": "lib/generated/game-data.consumables.ts",
    "line": null,
    "description": "Consumable-name derivation via direct SpellName.Name_lang per-id lookup resolved only 48/178 (27%) names reliably; the remaining 130 needed a consumableNames override (prefix loss, generic buff-aura collapse, or unresolvable era coverage) — a future item-name-based (ItemSparse) derivation pass could raise the wago-verified ratio for this map.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T02:21:39.073Z",
    "resolved_at": null
  }
]
````
