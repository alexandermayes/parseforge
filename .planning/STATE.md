---
gsd_state_version: 1.0
current_phase: 3
current_phase_name: Share Loop
status: planning
stopped_at: Phase 3 context gathered
last_updated: "2026-09-15T23:27:14.122Z"
last_activity: 2026-09-15
last_activity_desc: Phase 02.1 complete, transitioned to Phase 3
state_head: c4e25b5b5646e1288ffcb1a506d7a308eb3c11bd
progress:
  total_phases: 8
  completed_phases: 3
  total_plans: 26
  completed_plans: 26
  percent: 38
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-15 after Phase 2.1)

**Core value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.
**Current focus:** Phase 3 — Share Loop

## Current Position

Phase: 3 — Share Loop
Plan: Not started
Status: Ready to plan
Last activity: 2026-09-15 — Phase 02.1 complete, transitioned to Phase 3

Progress: [████░░░░░░] 38% (3/8 phases; 26/26 planned plans complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 26
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 9 | - | - |
| 02 | 9 | - | - |
| 02.1 | 8 | - | - |

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
| Phase 02.1 P02 | 25min | 2 tasks | 4 files |
| Phase 02.1 P01 | continuation | 3 tasks | 7 files |
| Phase 02.1 P03 | 30min | 3 tasks | 2 files |
| Phase 02.1 P04 | 25min | 3 tasks | 3 files |
| Phase 02.1 P05 | 20min | 2 tasks | 2 files |
| Phase 02.1 P06 | 20min | 3 tasks | 1 files |
| Phase 02.1 P07 | continuation | 3 tasks | 1 files |
| Phase 02.1 P08 | continuation | 2 tasks | 2 files |

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
- [Phase 02.1]: [Phase 02.1 / 02-02]: OPS-01 gate hardened with a mandatory post-deploy live-traffic check (item 7: HogQL thresholds, zero-events-is-a-FAIL rule, bounded netlog proof) - an event definition's presence is no longer accepted as ingestion proof (D-08). Phase 1 and Phase 2 VERIFICATION.md records + REQUIREMENTS.md carry dated append-only addenda correcting the PostHog criterion (D-09).
- [Phase 02.1]: Task 2 (02.1-01): user-selected option a at checkpoint — Gibraltar, Isle of Man, Jersey and Guernsey stay outside CONSENT_REGIONS (no code change needed, Task 1 already implemented the default).
- [Phase 02.1]: [Phase 02.1 / 02.1-03]: Preview dpl_7JGkziQrpZrhKfvxHJNAmtuXfuFy proved the consent-gate fix end-to-end via headless-Chrome netlog (3 capture requests vs a production baseline of zero); RESEARCH Open Question 1 answered (preview deployments receive real x-vercel-ip-country geo headers).
- [Phase 02.1]: [Phase 02.1 / 02.1-03]: Found and worked around a previously-unknown false-negative trap in the D-10 netlog technique - posthog-js's built-in bot filter drops all captures for any User-Agent containing "HeadlessChrome" by default; fixed via --user-agent override for this run, logged as WINDOWS.md todo #7 for Part 1's own command text.
- [Phase 02.1]: [Phase 02.1 / 02.1-04]: Production deploy dpl_HY5319wSDVw3M4ibBU42JrSTgw4e ran the hardened OPS-01 live-traffic gate for the first time - 2 of 3 item-7 thresholds passed with counted PostHog evidence (25 pageviews across 3 non-consent-region countries); the Vercel Web Analytics ratio threshold is PENDING (unreadable this session), so Phase 2.1 was left deliberately unsigned rather than fabricated as complete. OPS-01 remains not-yet-met in REQUIREMENTS.md via an appended addendum.
- [Phase 02.1]: [Phase 02.1 / 02.1-05]: OPS-01 gate SIGNED (2026-09-15) — Vercel Web Analytics figure (23 page views, recorded as an upper bound) scored PASS against 25 PostHog pageviews (25/23 ~ 108.7% >= 50%); all three item 7 thresholds now PASS. — Developer read the dashboard directly (route a); figure recorded as an upper bound because the range's end time was illegible, but the PASS is invariant to that imprecision since any true figure <= 23 also clears the <= 50 PASS line.
- [Phase 02.1]: theme_changed, timeline_viewed and timeline_filter_used counted-observed in PostHog project 337485 with consent_gate_path=geo-non-consent-region via a targeted manual test (route: automation-performed, orchestrator-driven headless Chrome scoped to parseforge.gg, developer authorized "you drive it"); consent_resolved/consent_unavailable recorded structurally unobservable from a non-consent-region egress and handed off to 02.1-08; timeline_error not triggered by design (optional step not authorized).
- [Phase 02.1]: [Phase 02.1 / 02.1-07]: Deployed dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5 (commit dd19b0b) on the developer's verbatim "ship it" - all five 02.1-REVIEW-FIX.md commits (90f5a46, 0e03d9b, 7a7cf0c, 9657535, 9da21c4, incl. WR-03 consent_resolved dedupe) are now live in production. — Makes the WR-03 dedupe testable in 02.1-08 against actual reviewed source rather than known-unfixed code; the fail-closed geo body validation (CR-01/90f5a46) is now protecting real visitors too.
- [Phase 02.1]: [Phase 02.1 / 02.1-07]: This deploy's own OPS-01 item 7 gate row is recorded NOT SIGNED - the new 60-minute window (2026-09-15T19:16:13Z-20:16:13Z) landed on a low-traffic UTC hour: Threshold 1 FAIL (3 pageviews, need 20), Threshold 2 FAIL (1 non-consent-region country, need 2), Threshold 3 NOT EVALUABLE (Vercel CLI API only returns an hour-rounded upper bound, not a window-exact figure). — 02.1-05's 2026-09-14 sign-off is untouched and rests on its own evidence; this deploy needs its own re-measurement on a busier UTC hour with a window-granularity Vercel read to close its own row. Recorded honestly rather than reused, softened, or omitted (docs/OPS-01-SHIP-GATE.md).
- [Phase 02.1]: [Phase 02.1 / 02.1-08]: EEA/UK/CH TCF observation not performed - developer declined the manual VPN session verbatim ("Stop asking for me to do things. Do it for me please"), and no automation-side EEA egress exists in this environment; recorded as not-performed with the exact test that would close it, rather than upgraded on unit tests or code review. — Commit 9da21c4 (WR-03 dedupe) is confirmed live in the deployed production build (dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5, commit dd19b0b), so the test remains ready to run and meaningful whenever an EEA/UK/CH session becomes available.

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- `wow-forever-support.md` (2026-09-13) — add World of Warcraft Forever support once WCL exposes Forever logs; era module via wago regen, partition-aware rankings, fixtures. Not actionable until upstream data exists.

Manual follow-ups (not todos): (1) AdSense → Privacy & messaging → European regulations → message → site settings: paste https://parseforge.gg/privacy (still open since 01-09); (2) PostHog MCP now authenticates; its *default* project is still "LootList+ App" — `switch-project 337485` per session works, but fix the connector default; (3) GSC: `/` and `/analyze/*` show "Crawled – currently not indexed" with crawl dates predating the Phase 2 deploy — request recrawl and watch `/` specifically; (4) ~~merge PR #15~~ done 2026-09-14; ~~PR #16~~ merged (fast-forward, `main` = `66b59da`) and deployed to prod 2026-09-14 (`dpl_4KnNGpjHrY9q1vwECEXZRaNFF5u7`), verified live: not-in-fight player → 404 on `/api/timeline`; (5) game-data ids 96264 / 96294 flagged for human review in `.planning/WINDOWS.md`; (6) ~~code-review findings in `02-REVIEW.md`~~ fixed (PR #16, 4/4) and live in prod since 2026-09-14; (7) PR #14 (external, Illidari-mark flasks — issue #13) must not merge as-is (hand-typed IDs, conflicting) — redo via `regen-game-data` + overrides with contributor credit, a `/gsd-quick` after Phase 2.1.

### Blockers/Concerns

- ~~[URGENT — Phase 2.1] PostHog capture ~99.9% down since 2026-09-06~~ resolved by Phase 2.1 (server-side geo opt-in, prod since 2026-09-14; gate signed 2026-09-15 on counted live traffic; EEA/UK TCF path confirmed in a real browser at UAT 2026-09-15). Evidence: `02.1-DIAGNOSIS.md`, `docs/OPS-01-SHIP-GATE.md` Part 4, `02.1-UAT.md`.
- ~~Vercel CLI logged into the wrong team~~ resolved 2026-09-14: personal login lives in `~/.vercel-personal`; every Vercel command needs `--global-config ~/.vercel-personal` (documented in CLAUDE.md).
- **Preview deployments are behind Vercel SSO** (302 → `vercel.com/sso-api`). Developer chose to enable "Protection Bypass for Automation"; once on, `VERCEL_AUTOMATION_BYPASS_SECRET` appears in `vercel env pull --environment=preview` and is sent as the `x-vercel-protection-bypass` header (or `?x-vercel-protection-bypass=…&x-vercel-set-bypass-cookie=true` for headless Chrome) — never printed, file deleted after use. Phase 2.1's D-10 netlog and the PR #16 smoke test both depend on it.
- **`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` (and `NEXT_PUBLIC_POSTHOG_HOST`) are Production-only env vars** — previews render no Google CMP, so the consent-region (EEA/UK/CH) path is only observable on production. Phase 2.1 verification must say so explicitly; adding the var to Preview is a developer decision (low risk).
- Live brownfield product — deploys are manual Vercel CLI and require explicit user confirmation each time; the Claude Code auto-mode classifier also blocks `vercel deploy --prod` unless `Bash(vercel deploy:*)` is allowed (granted 2026-09-08 in `.claude/settings.local.json`). Preview-before-prod is the established pattern.
- [Phase 1+2 carry-forward] Security ASVS review deferred for both phases (tooling not installed — see Deferred Items); CSP still report-only. Phase 2.1's own `02.1-SECURITY.md` closed at ASVS L1 grep-depth (45 threats, 0 open, `gsd-security-auditor` still not installed).
- ~~[Phase 2 carry-forward] `02-REVIEW.md` CR-01 / WR-01..03~~ fixed and deployed 2026-09-14 (PR #16, `dpl_4KnNGpjHrY9q1vwECEXZRaNFF5u7`).
- ~~[Phase 2 carry-forward] `origin/main` behind~~ resolved 2026-09-14 (PR #15 and #16 merged; `main` = `66b59da`).
- [Phase 2 carry-forward] GSC reports `/` as "Crawled – currently not indexed" (crawl 2026-09-05, pre-deploy) — pre-existing but unexplained for the homepage; investigate at the Phase 3 gate.
- [Phase 1 carry-forward] Build-time `[kv-cache] getRecentReports failed: Dynamic server usage` noise during prerender of `/` and `/sitemap.xml` — pre-existing, harmless at runtime; small cleanup candidate.
- Phase 4 research flag: verify current ad-network eligibility thresholds directly at signup (Ezoic source contradiction unresolved); model revenue vs. CWV/UX cost before committing.
- Phase 5 open question: dedicated ParseForge Discord vs. channel in existing LootList+ server (empty-room risk). Phase touches a second repo at /Users/alexander.mayes/Code/loot-list-plus (Railway deploy).
- Phase 6 research flag: define the per-page uniqueness rubric before scaling programmatic pages past the 10–15 pilot set (scaled-content-abuse risk).
- Scheduled check-in 2026-09-08 reviews /tbc-audit + PR #10 outcomes — do not re-diagnose those before then.
- ~~[Phase 2.1 close] OPS-01 gate NOT signed / five review fixes not in production~~ resolved: gate signed 2026-09-15 (02.1-05, ratio 25/23); the five fix commits shipped in `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` (02.1-07).
- [Phase 2.1 carry-forward → Phase 3 gate] The dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5 deploy's own OPS-01 item 7 gate row is unsigned (thresholds 1/2 FAIL on a low-traffic window, threshold 3 NOT EVALUABLE - Vercel CLI API only exposes an hour-rounded aggregate, not a window-exact figure). Next action: re-measure a full 60-minute window against this same deployment on a busier UTC hour (old build showed 1-pageview hours at 12:00/13:00/16:00/17:00Z the same day and 24 at 22:00Z on 2026-09-14), with a window-granularity Vercel Web Analytics dashboard read. Not a precondition for 02.1-08. Separate finding, not a defect: a pre-existing PostHog-vs-Vercel capture gap for a subset of non-consent-region countries (BR, SG), present on the old build too, most plausibly ad-blocker-related - candidate WINDOWS.md follow-up to quantify the ratio per country over a week.
- ~~[Phase 02.1 close] ROADMAP SC2 / Truth 4 / MONY-01 behaviour-unverified~~ resolved 2026-09-15: the developer ran the EEA/UK/CH VPN session (reject, full opt-in, CMP re-confirm) and passed it as `02.1-UAT.md` Test 1; `consent_resolved` fired once (WR-03 dedupe holds in-browser).

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

Last session: 2026-09-15T23:27:13.832Z
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-share-loop/03-CONTEXT.md
