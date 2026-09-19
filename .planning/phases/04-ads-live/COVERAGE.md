# API Coverage — Phase 4 (Ads Live)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Produced at plan time by `gsd-planner` after `api-coverage.cjs` returned `detected: true`
> for the Phase 4 scope. Two external surfaces are in scope this phase: **Google AdSense**
> (new integration) and the **Warcraft Logs / RPGLogs GraphQL API v2** (existing integration,
> new capability surface added by R0-2 / R0-3).

## Google AdSense (publisher ad serving) — new integration

| capability | decision | reason |
|---|---|---|
| display ad unit, manual fixed-size (`ins.adsbygoogle`) | INTEGRATE | |
| page-level unit cap (two units per page) | INTEGRATE | |
| `ads.txt` publisher declaration | INTEGRATE | |
| consent gating via Google Privacy & Messaging / IAB TCF v2.2 | INTEGRATE | |
| display ad unit, responsive/auto-size | OPT-OUT | D-04 forbids it — an auto-size unit renders at 0px until filled, the single most-cited source of ad CLS; fixed boxes are what makes SC2 provable |
| Auto ads (page-level automatic placement) | OPT-OUT | D-05 — Google could inject units at positions no `AdSlot` reserved, over a `data-protected` element; must be switched off in the account, not just absent from code |
| anchor / sticky ads | OPT-OUT | D-03 — floats over the bottom of the viewport where "Share my parse" and "Copy awards link" live |
| vignette / interstitial ads | OPT-OUT | D-03 — full-screen overlay delays the analysis the visitor came for |
| side-rail ads | OPT-OUT | D-03 — same overlay class as anchors; not reserved, not whitelisted |
| in-article ads | OPT-OUT | auto-sizing format; incompatible with D-04's exact reserved box |
| in-feed ads | OPT-OUT | no feed surface exists on `/analyze/*` or `/tbc-audit` |
| multiplex / matched content | OPT-OUT | auto-sizing related-content grid; not needed and would crowd the analysis tables (SC1) |
| AdSense for Search (AFS / CSE) | OPT-OUT | ParseForge has no site search |
| non-personalized ad requests (`npa`) | OPT-OUT | explicitly rejected for this phase by D-07 (Deferred Ideas); revisit only with a `/privacy` text change |
| Ad Review Center / advertiser blocklists | OPT-OUT | dashboard-only control with no code surface; nothing to integrate until a specific advertiser is a problem |
| AdSense Management API (programmatic reporting) | OPT-OUT | SC5's revenue reading is a dashboard read at the OPS-01 gate this phase; a reporting client is not needed to prove revenue exists |
| AdSense Platforms / Host API | OPT-OUT | ParseForge is not a host platform serving other publishers |

## Warcraft Logs / RPGLogs GraphQL API v2 — existing integration, new surface (R0-2 / R0-3)

| capability | decision | reason |
|---|---|---|
| `rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn }` | INTEGRATE | |
| `reportData.report.rankings(fightIDs:)` | INTEGRATE | |
| `worldData.zones { brackets }` | INTEGRATE | |
| `worldData.encounter.characterRankings` (page 1) | INTEGRATE | |
| `worldData.encounter.fightRankings` (page 1) | INTEGRATE | |
| `characterData.character.zoneRankings` | INTEGRATE | |
| `characterData.character.encounterRankings` | INTEGRATE | |
| `guildData.guild.members` | INTEGRATE | |
| `guildData.guild.attendance` | INTEGRATE | |
| `reportData.reports(guildID:, zoneID:)` | INTEGRATE | |
| `reportData.report` playerDetails / table / events / fights / masterData | INTEGRATE | already integrated before this phase; unchanged by R0 |
| `guildData.guild.zoneRanking` | OPT-OUT | belongs to R5 (Guild Readiness) in `PARSEFORGE-RANKINGS-SPEC.md` §7, which is gated on the approval reply — out of R0 scope |
| `progressRaceData` | OPT-OUT | no race-tracking product on the roadmap |
| `userData` / OAuth authorization-code (per-user) flow | OPT-OUT | ParseForge has no accounts; the client-credentials flow is the only auth surface and stays so |
| `gameData` (items / abilities / classes) | OPT-OUT | game-data IDs come from the wago.tools regeneration workflow (`npm run regen-game-data`), which is the project's accuracy constraint — no hand-typed or WCL-sourced ID maps |
| rate-limit circumvention via additional client keys | OPT-OUT | the ToS names this as circumvention (`PARSEFORGE-RANKINGS-SPEC.md` §2.1); a single client key plus a tier upgrade is the only sanctioned path |

## Notes

- Every AdSense `OPT-OUT` above that names a *format* is additionally enforced outside code: D-05
  requires Auto ads to be switched off in the AdSense account, because a code-only implementation
  cannot stop Google injecting a unit. That step is a `checkpoint:human-action` in `04-05-PLAN.md`.
- Every WCL `INTEGRATE` row in this phase is **non-user-facing** (fixtures, types, a pure engine, a
  budget reader). D-13 keeps R1+ UI un-executed until the RPGLogs approval reply is recorded.
