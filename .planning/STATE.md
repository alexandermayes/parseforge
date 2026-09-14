---
gsd_state_version: 1.0
current_phase: 2.1
current_phase_name: PostHog Consent Gate Hotfix
status: executing
stopped_at: Phase 2.1 planned (4 plans / 3 waves, checker passed iteration 2) — ready to execute
last_updated: "2026-09-14T20:46:33.171Z"
last_activity: 2026-09-14
last_activity_desc: PR #16 merged + deployed to prod; PostHog capture regression diagnosed; Phase 2.1 inserted, researched, planned, verified
state_head: 66b59da8a728eb48739990956591e2219dfa7c73
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 22
  completed_plans: 18
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08 after Phase 2)

**Core value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.
**Current focus:** Phase 2.1 — PostHog Consent Gate Hotfix (URGENT: capture ~99.9% down since 2026-09-06; see `02.1-DIAGNOSIS.md`). Phase 3 Share Loop follows.

## Current Position

Phase: 2.1 (PostHog Consent Gate Hotfix) — READY TO EXECUTE
Plan: Not started
Status: Ready to execute
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

Manual follow-ups (not todos): (1) AdSense → Privacy & messaging → European regulations → message → site settings: paste https://parseforge.gg/privacy (still open since 01-09); (2) PostHog MCP now authenticates; its *default* project is still "LootList+ App" — `switch-project 337485` per session works, but fix the connector default; (3) GSC: `/` and `/analyze/*` show "Crawled – currently not indexed" with crawl dates predating the Phase 2 deploy — request recrawl and watch `/` specifically; (4) ~~merge PR #15~~ done 2026-09-14; ~~PR #16~~ merged (fast-forward, `main` = `66b59da`) and deployed to prod 2026-09-14 (`dpl_4KnNGpjHrY9q1vwECEXZRaNFF5u7`), verified live: not-in-fight player → 404 on `/api/timeline`; (5) game-data ids 96264 / 96294 flagged for human review in `.planning/WINDOWS.md`; (6) ~~code-review findings in `02-REVIEW.md`~~ fixed (PR #16, 4/4) and live in prod since 2026-09-14; (7) PR #14 (external, Illidari-mark flasks — issue #13) must not merge as-is (hand-typed IDs, conflicting) — redo via `regen-game-data` + overrides with contributor credit, a `/gsd-quick` after Phase 2.1.

### Blockers/Concerns

- **[URGENT — Phase 2.1] PostHog capture has been ~99.9% down since the Phase 1 prod deploy (2026-09-06).** `cookieless_mode: "on_reject"` drops all PENDING-consent events; opt-in depended on `__tcfapi` calling back, which never happens for fresh visitors. Phase 1 & 2 OPS-01 PostHog criteria were not actually met. Fix: server-side geo opt-in (decided 2026-09-14). Evidence: `02.1-DIAGNOSIS.md`.
- ~~Vercel CLI logged into the wrong team~~ resolved 2026-09-14: personal login lives in `~/.vercel-personal`; every Vercel command needs `--global-config ~/.vercel-personal` (documented in CLAUDE.md).
- **Preview deployments are behind Vercel SSO** (302 → `vercel.com/sso-api`). Developer chose to enable "Protection Bypass for Automation"; once on, `VERCEL_AUTOMATION_BYPASS_SECRET` appears in `vercel env pull --environment=preview` and is sent as the `x-vercel-protection-bypass` header (or `?x-vercel-protection-bypass=…&x-vercel-set-bypass-cookie=true` for headless Chrome) — never printed, file deleted after use. Phase 2.1's D-10 netlog and the PR #16 smoke test both depend on it.
- **`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` (and `NEXT_PUBLIC_POSTHOG_HOST`) are Production-only env vars** — previews render no Google CMP, so the consent-region (EEA/UK/CH) path is only observable on production. Phase 2.1 verification must say so explicitly; adding the var to Preview is a developer decision (low risk).
- Live brownfield product — deploys are manual Vercel CLI and require explicit user confirmation each time; the Claude Code auto-mode classifier also blocks `vercel deploy --prod` unless `Bash(vercel deploy:*)` is allowed (granted 2026-09-08 in `.claude/settings.local.json`). Preview-before-prod is the established pattern.
- [Phase 1+2 carry-forward] Security ASVS review deferred for both phases (tooling not installed — see Deferred Items); CSP still report-only.
- ~~[Phase 2 carry-forward] `02-REVIEW.md` CR-01 / WR-01..03~~ fixed and deployed 2026-09-14 (PR #16, `dpl_4KnNGpjHrY9q1vwECEXZRaNFF5u7`).
- ~~[Phase 2 carry-forward] `origin/main` behind~~ resolved 2026-09-14 (PR #15 and #16 merged; `main` = `66b59da`).
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

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: PostHog Consent Gate Hotfix — cookieless_mode on_reject dropped all PENDING-consent capture since the Phase 1 deploy (2026-09-06); server-side geo opt-in for non-EEA, live-traffic OPS-01 re-verification (URGENT)

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
