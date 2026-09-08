---
gsd_state_version: 1.0
current_phase: 02
current_phase_name: Accuracy & Analysis Depth
status: executing
stopped_at: Completed 02-07-PLAN.md
last_updated: "2026-09-08T02:36:04.167Z"
last_activity: 2026-09-07
last_activity_desc: Phase 02 execution started
state_head: bf45fbb4d46b25615df1a39e03f22074626d60f5
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 18
  completed_plans: 16
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-07 after Phase 1)

**Core value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.
**Current focus:** Phase 02 — Accuracy & Analysis Depth

## Current Position

Phase: 02 (Accuracy & Analysis Depth) — EXECUTING
Plan: 8 of 9
Status: Ready to execute
Last activity: 2026-09-07 — Phase 02 execution started

Progress: [█░░░░░░░░░] 14%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 9 | - | - |

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: MVP mode — every phase ships an end-to-end user-visible win to production, not a technical layer.
- [Roadmap]: Accuracy (Phase 2) precedes monetization and redesign — core value first; engine tests become the regression net for Phase 7.
- [Roadmap]: Consent layer (Phase 1) ships before any ad script, closing the pre-existing PostHog EU-consent gap at the same time.
- [Roadmap]: Redesign is last (Phase 7) so it designs around real ad slots and real content, behind a per-route SEO-preservation gate.
- [Roadmap]: OPS-01 (PostHog + GSC verification) is the final success criterion of every phase, not a standalone phase.
- [Phase 01]: next-themes wired end-to-end for Phase 1's theme toggle; shadcn CLI's cn-package regression and a set-state-in-effect lint rule both auto-fixed during 01-01 — Establishes the class-attribute theming architecture (next-themes, resolved pre-paint) every later Phase 1 UI plan builds on
- [Phase 01 / 01-02]: AdSense account + EEA/UK-only full-screen GDPR consent message published (Google Privacy & Messaging as CMP, per D-01–D-04); consent message ships without a privacy-policy URL for now — /privacy page tracked as pending todo, to be linked in the message site settings when shipped
- [Phase 01]: [Phase 01 / 01-03]: TCF v2.2 consent signal wired end-to-end into PostHog via a pure lib/consent.ts decision module; EEA/UK session replay now gates on real consent (opt-in-full/cookieless/opt-in-non-eea/pending), a CMP_TIMEOUT_MS fail-closed timer makes a blocked/absent CMP measurable via consent_unavailable, and getConsentState() is the readable signal Phase 4's ad loader will consult
- [Phase 01]: [Phase 01 / 01-04]: Designed a genuine ParseForge light palette (:root) in the same 270 hue family as .dark, added a scripts/theme-parity.mjs standing gate proving parity+divergence, and extended @theme with spacing/motion/elevation categories — every shipped utility class now resolves color from a token in both themes
- [Phase 01]: [Phase 01 / 01-05] Tokenized the 11 WoW class colours and 4 role colours as paired --class-*/--role-* light/dark CSS custom properties (D-12); retuned 6 of the plan's proposed starting hex values via an HSL-lightness binary search after measuring they fell short of WCAG AA 4.5:1; split lib/constants.ts into token maps (var() refs) and a documented Satori-only hex mirror (CLASS_COLORS_HEX/ROLE_COLORS_HEX) with classColor()/roleColor()/roleColorAlpha() resolution helpers replacing direct map indexing across 9 DOM consumers
- [Phase 01]: Phase 01 / 01-06: Built scripts/token-audit.mjs (fail-first-proven, reasoned allowlist for the Satori raw-hex exception) and moved GRADE_COLORS/percentileColor/percentileBg onto six paired --tier-* performance tokens; retuned the artifact tier's light lightness (oklch 0.545 0.15 85) after the plan's proposed value measured 4.07:1, below WCAG AA 4.5:1
- [Phase 01]: [Phase 01 / 01-07]: Closed DSGN-01's remaining token-audit worklist to zero (npm run token-audit exits 0 for the first time this phase) by migrating 9 components to semantic tokens and extending the audit's reasoned allowlist to cover manifest.ts, opengraph-image.tsx, and six vendored magicui-style effect components' unreachable default props; generated docs/TOKEN-AUDIT.md as the standing proof artifact.
- [Phase 01]: Phase 01 / 01-08: Built scripts/seo-invariants.mjs (local-vs-production head-tag + JSON-LD diff) and docs/OPS-01-SHIP-GATE.md as the repeatable OPS-01 gate every later phase runs; expanded the route set from the plan's stale 9 to the live 11 (adding /privacy and /terms) and corrected a stale consent_resolved instrumentation-count assumption against 01-03's already-correct two-branch implementation; the 11-route theme sweep is deferred to end-of-phase UAT.
- [Phase 01 / 01-09]: Phase 1 shipped to production (parseforge-424ibrxax → parseforge.gg) after a preview deploy was offered and the developer replied deploy-now; CMP script host confirmed in prod HTML so MONY-01 is live for EEA/UK; GSC 9× PASS on pre-deploy crawls + 2× no-data (/privacy, /terms unknown to Google yet); PostHog event definitions recorded no-data (MCP disconnected after OAuth) — OPS-01 Phase 1 gate closed with a dated sign-off; the real-browser UAT sweep (toggle, EEA vs US dialog, light mode on phone) is the remaining human step.
- [Phase 02]: [Phase 02 / 02-01]: Recorded real WCL fixtures for the public demo report and corrected RESEARCH.md Assumption A3 from live data — the sourceID-scoped per-ability Healing table DOES carry per-ability overheal (matches the un-scoped total exactly); what it actually lacks is activeTime, which only appears on the un-scoped healingByPlayer row. Timeline query/type contracts (TIMELINE_CASTS_QUERY, WCLCastEvent, CastTimelineResult, HealerTableRow, HealerComparison), RATE_LIMITS.timeline, formatFightTime, and exported JUNK_SPELL_IDS/isJunkSpell are now in place for plans 02-02, 02-04, 02-05 and 02-07 to build against with no further live WCL query. — Every later Phase 2 plan needs verified (not guessed) WCL response shapes; recording once up front replaces five flagged assumptions with facts and hands downstream plans ready-made contracts.
- [Phase 02]: Timeline engine (02-02): filtered WCL begincast probe events, treated -1 targetID as no-target, duplicated buildRankedNames locally rather than importing a use-client export into server code
- [Phase 02]: Phase 02 / 02-03: Built scripts/regen-game-data.mjs (wago.tools era-pinned generator), ran it for real against live wago.tools, and committed three generated era modules (2553/3895/4891 rows, builds 2.5.6.69546/3.4.5.63697/4.4.2.60895) that provably reproduce every enchant/gem ID-to-name pair lib/cla-constants.test.ts pins. Discovered real cross-era ID collisions at exhaustive-data scale (806 enchant, 295 gem) far exceeding what a naive later-wins merge tolerates safely -- 02-06 should select the correct era module per-report rather than flat-merging all three eras. — Turns PR #11's one-off manual wago.tools fix into a repeatable, row-floor-guarded generator so the class of bug that shipped wrong enchant/gem names to raiders cannot recur silently (ACC-01).
- [Phase 02]: Phase 02 / 02-04: Extracted computeHealerMetrics/averageTopHealerMetrics into lib/healer-metrics.ts as the single source of truth for healer effective HPS, overheal percent and healing uptime (D-08); wired the analyze route's healer branch and the raid overview engine to both call it, and added Overheal/Uptime comparison rows to the player-page healer card. A cross-surface unit test proves the raid table and the player page can never disagree on the same healer+fight number. RESEARCH.md Assumption A5 was re-confirmed (headline HPS already equals effective HPS) — no code change to the headline was needed. — ACC-04 success criterion 2 requires a healer to see analysis reflecting healing decisions, not a DPS-shaped ranking; a single shared helper closes the risk of the raid table and player page silently disagreeing on the same figure.
- [Phase 02]: Phase 02 / 02-05: Idle threshold shipped as max(2000ms, 3x median inter-cast gap) per player per fight (D-03); demo report fight 23/Samkin calibration: 2762ms threshold, 9 idle rows across 159 casts. Death marker merges chronologically (never appended). Filter chips + hand-rolled fixed-row-height windowing (no virtualisation dependency) + never-hidden truncation notice complete D-04.
- [Phase 02-accuracy-analysis-depth]: Phase 02 / 02-06: Cut lib/cla-constants.ts over to lib/generated/index.ts's composed maps (ENCHANT_NAME_DB, GEM_NAME_DB, GEM_STAT_DB, CONSUMABLE_DB, UNVERIFIED_IDS), zero inline id-map literals remain; generated docs/GAME-DATA-AUDIT.md standing audit artifact — Composition uses Classic+TBC-first collision precedence (not the plan's literal later-era-wins text) because live wago data proved cross-era numeric-id reuse would otherwise silently corrupt known-good pinned facts; 130/178 consumable names needed an explicit override (buff-aura names diverge from item names far more often than expected) but a full parity check confirms CONSUMABLE_DB is still byte-identical to pre-cutover values
- [Phase 02]: Phase 02 / 02-07: Added three healer suggestion rules (high overheal, low uptime, HPS gap despite efficient healing) to generateSuggestions, each thresholded via named constants against the top healers' own averaged values, and role-gated the DPS active-time rule off for healers. Consolidated usePlayerAnalysis.ts's two analysis_error call sites (pre-existing 3 literal posthog.capture lines for 2 interactions) into one closure to satisfy the ship gate's grep. analysis_complete now carries player_role and healer efficiency props for OPS-01 measurement.

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None. Manual follow-ups (not todos): (1) AdSense → Privacy & messaging → European regulations → message → site settings: paste https://parseforge.gg/privacy (page is live as of 01-09); (2) re-check PostHog event definitions for theme_changed / consent_resolved at the Phase 2 gate; (3) `git push origin main` — main is a full phase ahead of origin, which forces sequential (non-worktree) execution.

### Blockers/Concerns

- Live brownfield product — deploys are manual Vercel CLI and require explicit user confirmation each time. Phase 1 established preview-before-prod when no real-browser pass happened.
- [Phase 1 carry-forward] Security ASVS review deferred (tooling not installed — see Deferred Items); CSP still report-only; `main` unpushed (59+ commits ahead of origin → sequential execution until pushed).
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
| Security | Formal ASVS L1 security review of Phase 1 (`01-SECURITY.md`) — gsd security tooling (gsd-secure-phase skill, gsd-security-auditor agent) not installed in this profile; per-plan STRIDE registers exist. Close via full-profile install + `/gsd-secure-phase 01` | Deferred | 2026-09-07 (Phase 1 close) | v1 growth |

## Session Continuity

Last session: 2026-09-08T02:35:52.070Z
Stopped at: Completed 02-07-PLAN.md
Resume file: None
