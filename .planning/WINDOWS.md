---
schema_version: 1
open_count: 12
waived_count: 0
fixed_count: 2
total_count: 14
last_updated: 2026-09-21T22:32:39.303Z
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
| 7 | 02.1 | todo | docs/OPS-01-SHIP-GATE.md |  | Part 1 item 7's browser-level netlog sub-item needs a --user-agent override (or opt_out_useragent_filter:true in posthog.init) - posthog-js's built-in bot filter silently drops all captures for any UA containing HeadlessChrome, producing a false negative regardless of app correctness (found 02.1-03). | open |  | 2026-09-14T22:02:16.645Z |  |
| 8 | 03 | deviation | scripts/protected-elements.mjs |  | protected-elements has no bypass-header/query-param support, so its live route checks cannot verify an SSO-protected preview deploy (302s to Vercel login instead); direct curl with x-vercel-protection-bypass is the workaround used in 03-06 Part 5 | open |  | 2026-09-16T08:59:20.886Z |  |
| 9 | 03 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 03-06 Task 2 developer-only backstops not performed by the executor: D-04 award-pool tone review, real Discord unfurl of preview awards+player links (longest-name ellipsis check), D-13 mobile reachability of both share buttons — exact tests and preview URLs recorded in Part 5 Developer review (preview) | fixed |  | 2026-09-16T09:02:42.606Z | 2026-09-19T20:19:49.601Z |
| 10 | 03 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 03-07 item-7 re-measure needed: dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx's 09:14:57Z-10:14:57Z window scored threshold 1 FAIL (7 pageviews), threshold 2 PASS (2 countries), threshold 3 NOT EVALUABLE (no Vercel Web Analytics endpoint on the personal token). Re-run the three HogQL queries against a full 60-minute window on a busier UTC hour (candidate ~22:00Z, 24 pageviews on 2026-09-14) plus a window-granularity Vercel Web Analytics dashboard read. | fixed |  | 2026-09-16T16:56:13.409Z | 2026-09-19T01:10:28.150Z |
| 11 | 03 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 03-07 share-rate (D-14) re-run needed: 7-day trailing HogQL read 0.0% (0 share_action sessions / 19 analysis_complete sessions) as a first reading with only ~7.5h of live share_action exposure. Re-run the same HogQL on/after 2026-09-23T09:15Z for the first meaningful comparison against the ~2.8% baseline. | open |  | 2026-09-16T16:56:13.555Z |  |
| 12 | 04 | deviation | app/components/AdSlot.tsx | 162 | Reserved ad box <div> carries an inline style={{width:base.width,height:base.height}} that outranks the responsive md: Tailwind classes at every viewport, so no slot (tbc-audit-mid/-end, analyze-mid/-end) ever grows to its declared desktop size; verified live via CDP getComputedStyle on the preview (04-06 Task 2). Blocking finding for 04-07. | open |  | 2026-09-21T20:15:46.704Z |  |
| 13 | 04 | deviation | app/components/ReportUrlForm.tsx | 95 | Pre-existing, non-ad-related: the example-URL <code> string has no wrap class, forcing the layout viewport wider than 384px on / and /tbc-audit (not /guides, not /analyze) at phone width; found while measuring ad-box adjacency in 04-06 Task 3. Out of Phase 4 scope to fix. | open |  | 2026-09-21T20:15:47.035Z |  |
| 14 | 04 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 04-06 Task 2 preview netlog/measured-box/CSP-harvest procedure could not be re-run against the second preview (dpl_9SxD4PEAPUHv8aghVucyjqJ3LQoV) after the box-size/dark-mode fixes: the one working method to source the Vercel SSO bypass secret was denied by the session's own Bash-permission auto-classifier (Credential Materialization). Closing test: re-run 04-06 Task 2's procedure against this preview once the bypass secret can be sourced in a session with permission. | open |  | 2026-09-21T22:32:39.303Z |  |

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
  },
  {
    "id": 7,
    "kind": "todo",
    "phase": "02.1",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "Part 1 item 7's browser-level netlog sub-item needs a --user-agent override (or opt_out_useragent_filter:true in posthog.init) - posthog-js's built-in bot filter silently drops all captures for any UA containing HeadlessChrome, producing a false negative regardless of app correctness (found 02.1-03).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T22:02:16.645Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "03",
    "file": "scripts/protected-elements.mjs",
    "line": null,
    "description": "protected-elements has no bypass-header/query-param support, so its live route checks cannot verify an SSO-protected preview deploy (302s to Vercel login instead); direct curl with x-vercel-protection-bypass is the workaround used in 03-06 Part 5",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T08:59:20.886Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "03-06 Task 2 developer-only backstops not performed by the executor: D-04 award-pool tone review, real Discord unfurl of preview awards+player links (longest-name ellipsis check), D-13 mobile reachability of both share buttons — exact tests and preview URLs recorded in Part 5 Developer review (preview)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T09:02:42.606Z",
    "resolved_at": "2026-09-19T20:19:49.601Z"
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "03-07 item-7 re-measure needed: dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx's 09:14:57Z-10:14:57Z window scored threshold 1 FAIL (7 pageviews), threshold 2 PASS (2 countries), threshold 3 NOT EVALUABLE (no Vercel Web Analytics endpoint on the personal token). Re-run the three HogQL queries against a full 60-minute window on a busier UTC hour (candidate ~22:00Z, 24 pageviews on 2026-09-14) plus a window-granularity Vercel Web Analytics dashboard read.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T16:56:13.409Z",
    "resolved_at": "2026-09-19T01:10:28.150Z"
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "03-07 share-rate (D-14) re-run needed: 7-day trailing HogQL read 0.0% (0 share_action sessions / 19 analysis_complete sessions) as a first reading with only ~7.5h of live share_action exposure. Re-run the same HogQL on/after 2026-09-23T09:15Z for the first meaningful comparison against the ~2.8% baseline.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T16:56:13.555Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "deviation",
    "phase": "04",
    "file": "app/components/AdSlot.tsx",
    "line": 162,
    "description": "Reserved ad box <div> carries an inline style={{width:base.width,height:base.height}} that outranks the responsive md: Tailwind classes at every viewport, so no slot (tbc-audit-mid/-end, analyze-mid/-end) ever grows to its declared desktop size; verified live via CDP getComputedStyle on the preview (04-06 Task 2). Blocking finding for 04-07.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-21T20:15:46.704Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "deviation",
    "phase": "04",
    "file": "app/components/ReportUrlForm.tsx",
    "line": 95,
    "description": "Pre-existing, non-ad-related: the example-URL <code> string has no wrap class, forcing the layout viewport wider than 384px on / and /tbc-audit (not /guides, not /analyze) at phone width; found while measuring ad-box adjacency in 04-06 Task 3. Out of Phase 4 scope to fix.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-21T20:15:47.035Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "04-06 Task 2 preview netlog/measured-box/CSP-harvest procedure could not be re-run against the second preview (dpl_9SxD4PEAPUHv8aghVucyjqJ3LQoV) after the box-size/dark-mode fixes: the one working method to source the Vercel SSO bypass secret was denied by the session's own Bash-permission auto-classifier (Credential Materialization). Closing test: re-run 04-06 Task 2's procedure against this preview once the bypass secret can be sourced in a session with permission.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-21T22:32:39.303Z",
    "resolved_at": null
  }
]
````
