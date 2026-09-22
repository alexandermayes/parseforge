---
schema_version: 1
open_count: 16
waived_count: 0
fixed_count: 3
total_count: 19
last_updated: 2026-09-22T19:55:26.755Z
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
| 12 | 04 | deviation | app/components/AdSlot.tsx | 162 | Reserved ad box <div> carries an inline style={{width:base.width,height:base.height}} that outranks the responsive md: Tailwind classes at every viewport, so no slot (tbc-audit-mid/-end, analyze-mid/-end) ever grows to its declared desktop size; verified live via CDP getComputedStyle on the preview (04-06 Task 2). Blocking finding for 04-07. | fixed |  | 2026-09-21T20:15:46.704Z | 2026-09-22T05:01:23.318Z |
| 13 | 04 | deviation | app/components/ReportUrlForm.tsx | 95 | Pre-existing, non-ad-related: the example-URL <code> string has no wrap class, forcing the layout viewport wider than 384px on / and /tbc-audit (not /guides, not /analyze) at phone width; found while measuring ad-box adjacency in 04-06 Task 3. Out of Phase 4 scope to fix. | open |  | 2026-09-21T20:15:47.035Z |  |
| 14 | 04 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 04-06 Task 2 preview netlog/measured-box/CSP-harvest procedure could not be re-run against the second preview (dpl_9SxD4PEAPUHv8aghVucyjqJ3LQoV) after the box-size/dark-mode fixes: the one working method to source the Vercel SSO bypass secret was denied by the session's own Bash-permission auto-classifier (Credential Materialization). Closing test: re-run 04-06 Task 2's procedure against this preview once the bypass secret can be sourced in a session with permission. | open |  | 2026-09-21T22:32:39.303Z |  |
| 15 | 04 | deviation | app/components/AdSlot.tsx | 190 | Round-2's visibility:hidden fix for the white unfilled-frame defect (WINDOWS #12's sibling Defect B) did not hold on the second preview: adsbygoogle.js injects a child div (#aswift_N_host) inside the <ins> with its own explicit visibility:visible, which CSS lets override an ancestor's visibility:hidden regardless of tree depth. Round 3 replaced it with a wrapper-level occluding cover (a later sibling of the <ins>, absolute/inset-0/z-10/bg-background) verified via pixel-sampled local screenshots in both themes, both viewports (0% white-pixel deviation, exact page-background color match). Preview-level (SSO-gated) re-verification is still blocked by the same bypass-secret gap #14 records; closing test is the developer's first-hand review of the third preview (dpl_2CU68Zw3yFuxq7qqMjxNeTjT1VC1). | open |  | 2026-09-22T05:01:37.732Z |  |
| 16 | 04 | deviation | app/components/AdSlot.tsx | 228 | Round-3's flat bg-background occluding cover painted a textureless patch against the page's grainy .bg-noise background (developer caught it on the third preview as a subtle different-shade box). Confirmed numerically via pixel-sampled CDP screenshots on a production build (cover stddev 0 vs control ~0.5-0.8, mean ~1-2.8 RGB levels warmer, both themes/viewports); fixed with a local (position:absolute) grain-texture pseudo-element scoped to the cover, matching within ~0.1-0.2 RGB levels post-fix. Closing test: developer's first-hand review of the fourth preview (dpl_9hkgsvPz57brpYzdHdFf3x7GM56Z). | open |  | 2026-09-22T05:35:19.731Z |  |
| 17 | 04 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 04-07 Task 3: OPS-01 item 7 PostHog live-traffic thresholds and ad_slot breakdown NOT EVALUABLE - no PostHog MCP/API query channel available to this executor dispatch. Closing test: re-run Part 1 item 7's HogQL verbatim against PostHog project 337485 in a session with PostHog access. | open |  | 2026-09-22T19:55:25.355Z |  |
| 18 | 04 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 04-07 Task 3: Search Console rows for /tbc-audit, the demo analyze page, and /privacy recorded no-data - no gscServer MCP tool available to this executor dispatch. Closing test: URL-inspect all three routes via sc-domain:parseforge.gg in a session with GSC access. | open |  | 2026-09-22T19:55:26.466Z |  |
| 19 | 04 | unrun-verify | docs/OPS-01-SHIP-GATE.md |  | 04-07 Task 3: day-2 (due 2026-09-24T09:23:24Z) and day-7 (due 2026-09-29T09:23:24Z) CWV re-reads against the D-09 pre-ad baseline are scheduled, not yet due; today's reading is an informal same-day readability check only, not the scored comparison. Closing test: re-run the three vercel metrics commands recorded in Part 6 and append a dated PASS/breach row against every D-10 trigger. | open |  | 2026-09-22T19:55:26.755Z |  |

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
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-21T20:15:46.704Z",
    "resolved_at": "2026-09-22T05:01:23.318Z"
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
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "04",
    "file": "app/components/AdSlot.tsx",
    "line": 190,
    "description": "Round-2's visibility:hidden fix for the white unfilled-frame defect (WINDOWS #12's sibling Defect B) did not hold on the second preview: adsbygoogle.js injects a child div (#aswift_N_host) inside the <ins> with its own explicit visibility:visible, which CSS lets override an ancestor's visibility:hidden regardless of tree depth. Round 3 replaced it with a wrapper-level occluding cover (a later sibling of the <ins>, absolute/inset-0/z-10/bg-background) verified via pixel-sampled local screenshots in both themes, both viewports (0% white-pixel deviation, exact page-background color match). Preview-level (SSO-gated) re-verification is still blocked by the same bypass-secret gap #14 records; closing test is the developer's first-hand review of the third preview (dpl_2CU68Zw3yFuxq7qqMjxNeTjT1VC1).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T05:01:37.732Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "04",
    "file": "app/components/AdSlot.tsx",
    "line": 228,
    "description": "Round-3's flat bg-background occluding cover painted a textureless patch against the page's grainy .bg-noise background (developer caught it on the third preview as a subtle different-shade box). Confirmed numerically via pixel-sampled CDP screenshots on a production build (cover stddev 0 vs control ~0.5-0.8, mean ~1-2.8 RGB levels warmer, both themes/viewports); fixed with a local (position:absolute) grain-texture pseudo-element scoped to the cover, matching within ~0.1-0.2 RGB levels post-fix. Closing test: developer's first-hand review of the fourth preview (dpl_9hkgsvPz57brpYzdHdFf3x7GM56Z).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T05:35:19.731Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "04-07 Task 3: OPS-01 item 7 PostHog live-traffic thresholds and ad_slot breakdown NOT EVALUABLE - no PostHog MCP/API query channel available to this executor dispatch. Closing test: re-run Part 1 item 7's HogQL verbatim against PostHog project 337485 in a session with PostHog access.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T19:55:25.355Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "04-07 Task 3: Search Console rows for /tbc-audit, the demo analyze page, and /privacy recorded no-data - no gscServer MCP tool available to this executor dispatch. Closing test: URL-inspect all three routes via sc-domain:parseforge.gg in a session with GSC access.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T19:55:26.466Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "docs/OPS-01-SHIP-GATE.md",
    "line": null,
    "description": "04-07 Task 3: day-2 (due 2026-09-24T09:23:24Z) and day-7 (due 2026-09-29T09:23:24Z) CWV re-reads against the D-09 pre-ad baseline are scheduled, not yet due; today's reading is an informal same-day readability check only, not the scored comparison. Closing test: re-run the three vercel metrics commands recorded in Part 6 and append a dated PASS/breach row against every D-10 trigger.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T19:55:26.755Z",
    "resolved_at": null
  }
]
````
