---
gsd_state_version: 1.0
current_phase: 3
current_phase_name: Share Loop
status: planning
stopped_at: Phase 02 complete, ready to plan Phase 3
last_updated: "2026-09-08T21:21:51.076Z"
last_activity: 2026-09-08
last_activity_desc: Phase 02 complete, transitioned to Phase 3
state_head: b5058ce0f4fe241d967d8634e4837cbfa33adb01
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 18
  completed_plans: 18
  percent: 29
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08 after Phase 2)

**Core value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.
**Current focus:** Phase 3 — Share Loop (roast/award cards, per-player permalinks, a share CTA that survives later phases)

## Current Position

Phase: 3 — Share Loop
Plan: Not started
Status: Ready to plan
Last activity: 2026-09-08 — Phase 02 complete, transitioned to Phase 3

Progress: [███░░░░░░░] 29% (2/7 phases; 18/18 planned plans complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 18
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 9 | - | - |
| 02 | 9 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 25 | 2 tasks | 7 files |
| Phase 01 P02 | — (split across sessions) | 2 tasks | 1 file |
| Phase 01 P03 | 20min | 2 tasks | 5 files |
| Phase 01 P04 | 20min | 3 tasks | 3 files |
| Phase 01 P05 | 35min | 3 tasks | 13 files |
| Phase 01 P06 | 7min | 3 tasks | 6 files |
| Phase 01 P07 | 35min | 3 tasks | 15 files |
| Phase 01 P08 | 55min | 3 tasks | 3 files |
| Phase 01 P09 | 40min | 3 tasks | 1 file (+ prod deploy) |
| Phase 02 P01 | n/a (checkpoint-resumed) | 2 tasks | 15 files |
| Phase 02 P02 | 40min | 2 tasks | 7 files |
| Phase 02 P03 | 65min | 2 tasks | 8 files |
| Phase 02-accuracy-analysis-depth P04 | 35min | 2 tasks | 11 files |
| Phase 02-accuracy-analysis-depth P05 | 55min | 2 tasks | 6 files |
| Phase 02-accuracy-analysis-depth P06 | 55min | 3 tasks | 10 files |
| Phase 02-accuracy-analysis-depth P07 | 45min | 2 tasks | 5 files |
| Phase 02-accuracy-analysis-depth P08 | 55min | 3 tasks | 6 files |
| Phase 02 P09 | 35min | 3 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: MVP mode — every phase ships an end-to-end user-visible win to production, not a technical layer.
- [Roadmap]: Accuracy (Phase 2) precedes monetization and redesign — core value first; engine tests become the regression net for Phase 7.
- [Roadmap]: Consent layer (Phase 1) ships before any ad script, closing the pre-existing PostHog EU-consent gap at the same time.
- [Roadmap]: Redesign is last (Phase 7) so it designs around real ad slots and real content, behind a per-route SEO-preservation gate.
- [Roadmap]: OPS-01 (PostHog + GSC verification) is the final success criterion of every phase, not a standalone phase.
- [Phase 01]: Class-attribute theming (next-themes) with paired light/dark tokens enforced by `theme-parity` + `token-audit`; Google Privacy & Messaging as the TCF v2.2 CMP gating PostHog for EEA/UK; `docs/OPS-01-SHIP-GATE.md` + `seo-invariants` as the repeatable ship gate; preview-before-prod when no real-browser pass happened. (Full per-plan log: PROJECT.md Key Decisions + 01-*-SUMMARY.md.)
- [Phase 02 / 02-01]: Real WCL responses recorded as committed fixtures (Wave 0) before anything was built on assumed shapes; corrected RESEARCH assumption A3 (scoped healing table has per-ability `overheal`, lacks `activeTime`). Fixtures feed both the timeline and the regression net.
- [Phase 02 / 02-03, 02-06]: Generated game data is the runtime source of truth (`npm run regen-game-data`, three era modules, `cla-constants.ts` a thin re-export, `docs/GAME-DATA-AUDIT.md`). Era precedence is **Classic/TBC-first, not later-era-wins** — client builds reuse IDs across eras (806 enchant + 295 gem collisions) and later-wins corrupted pinned pairs. 130/178 consumable names are explicit sourced overrides.
- [Phase 02 / 02-04, 02-07]: One `lib/healer-metrics.ts` helper feeds both the player card and the raid Healer Breakdown (D-08, parity asserted by test and confirmed live in prod); healer suggestion rules threshold against top healers' own values and DPS-shaped rules are role-gated off.
- [Phase 02 / 02-02, 02-05]: Timeline idle threshold `max(2000ms, 3×median inter-cast gap)`; death rows merged chronologically; hand-rolled windowing (no virtualisation dependency); WCL `begincast` probes filtered, `-1` targetID = no target.
- [Phase 02 / 02-09]: Shipped preview-first with push + PR #15 before prod (`dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c`); the harness classifier denied `vercel deploy --prod` for both executor and orchestrator until the developer granted `Bash(vercel deploy:*)`. ASVS review deferred again (tooling absent) with the developer's explicit choice.

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- `wow-forever-support.md` (2026-09-13) — add World of Warcraft Forever support once WCL exposes Forever logs; era module via wago regen, partition-aware rankings, fixtures. Not actionable until upstream data exists.

Manual follow-ups (not todos): (1) AdSense → Privacy & messaging → European regulations → message → site settings: paste https://parseforge.gg/privacy (still open since 01-09); (2) PostHog MCP connection returns `INVALID_API_KEY` and its active project is "LootList+ App" — re-wire it to the ParseForge project (337485) before the Phase 3 gate so event definitions can be confirmed by tool rather than by hand; (3) GSC: `/` and `/analyze/*` show "Crawled – currently not indexed" with crawl dates predating the Phase 2 deploy — request recrawl and watch `/` specifically; (4) merge PR #15 (or `git push origin main`) — `origin/main` is at `55d2010`, local `main` carries Phase 2 + close-out commits; parallel worktree execution returns once they match; (5) game-data ids 96264 / 96294 flagged for human review in `.planning/WINDOWS.md`; (6) code-review findings in `02-REVIEW.md` — CR-01 (healer suggestions fire with `hasHealing: false`) is live and should be fixed via `/gsd-code-review 02 --fix` + a follow-up deploy.

### Blockers/Concerns

- Live brownfield product — deploys are manual Vercel CLI and require explicit user confirmation each time; the Claude Code auto-mode classifier also blocks `vercel deploy --prod` unless `Bash(vercel deploy:*)` is allowed (granted 2026-09-08 in `.claude/settings.local.json`). Preview-before-prod is the established pattern.
- [Phase 1+2 carry-forward] Security ASVS review deferred for both phases (tooling not installed — see Deferred Items); CSP still report-only.
- [Phase 2 carry-forward] `02-REVIEW.md` CR-01: healer overheal/uptime suggestions fire when `hasHealing` is false — a wrong recommendation live on parseforge.gg; plus WR-01..03. Fix before Phase 3 bakes healer numbers into share images.
- [Phase 2 carry-forward] `origin/main` at `55d2010`; Phase 2 on PR #15 — worktree isolation degrades to sequential until merged/pushed.
- [Phase 2 carry-forward] GSC reports `/` as "Crawled – currently not indexed" (crawl 2026-09-05, pre-deploy) — pre-existing but unexplained for the homepage; investigate at the Phase 3 gate.
- [Phase 1 carry-forward] Build-time `[kv-cache] getRecentReports failed: Dynamic server usage` noise during prerender of `/` and `/sitemap.xml` — pre-existing, harmless at runtime; small cleanup candidate.
- Phase 4 research flag: verify current ad-network eligibility thresholds directly at signup (Ezoic source contradiction unresolved); model revenue vs. CWV/UX cost before committing.
- Phase 5 open question: dedicated ParseForge Discord vs. channel in existing LootList+ server (empty-room risk). Phase touches a second repo at /Users/alexander.mayes/Code/loot-list-plus (Railway deploy).
- Phase 6 research flag: define the per-page uniqueness rubric before scaling programmatic pages past the 10–15 pilot set (scaled-content-abuse risk).
- Scheduled check-in 2026-09-08 reviews /tbc-audit + PR #10 outcomes — do not re-diagnose those before then.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260906-kzw | Add /privacy and /terms pages, footer links, sitemap entries | 2026-09-06 | 8dc7673 | [260906-kzw-add-privacy-and-terms-pages-footer-links](./quick/260906-kzw-add-privacy-and-terms-pages-footer-links/) |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Security | Formal ASVS L1 security review of Phase 2 (`02-SECURITY.md`) — `gsd-secure-phase` still not installed in this profile (verify:post hook active, `Unknown skill`); per-plan STRIDE registers exist. Developer chose to defer at UAT close. Close via full-profile install + `/gsd-secure-phase 02` | Deferred | 2026-09-08 (Phase 2 close) | v1 growth |
| Security | Formal ASVS L1 security review of Phase 1 (`01-SECURITY.md`) — gsd security tooling (gsd-secure-phase skill, gsd-security-auditor agent) not installed in this profile; per-plan STRIDE registers exist. Close via full-profile install + `/gsd-secure-phase 01` | Deferred | 2026-09-07 (Phase 1 close) | v1 growth |

## Session Continuity

Last session: 2026-09-08T21:30:00Z
Stopped at: Phase 02 complete (verified, UAT 1/1, shipped dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c), ready to plan Phase 3
Resume file: None
