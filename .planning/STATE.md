---
gsd_state_version: 1.0
current_phase: 01
current_phase_name: Foundation — Themes & Consent
status: executing
stopped_at: Completed 01-08-PLAN.md
last_updated: "2026-09-07T04:30:07.666Z"
last_activity: 2026-09-07
last_activity_desc: Phase 01 execution started
state_head: f2bb14b792415d3b4e11b8695be76a9a9063a964
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 9
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-04)

**Core value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.
**Current focus:** Phase 01 — Foundation — Themes & Consent

## Current Position

Phase: 01 (Foundation — Themes & Consent) — EXECUTING
Plan: 8 of 9
Status: 01-08 complete, ready for 01-09 (final plan — deploy)
Last activity: 2026-09-07 - Completed 01-08-PLAN.md: seo-invariants gate + docs/OPS-01-SHIP-GATE.md

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None. (privacy-policy-page.md resolved by quick task 260906-kzw — one manual follow-up remains: after the 01-09 prod deploy, paste https://parseforge.gg/privacy into AdSense → Privacy & messaging → European regulations → message → site settings.)

### Blockers/Concerns

- Live brownfield product — deploys are manual Vercel CLI and require explicit user confirmation each time.
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
| *(none)* | | | | |

## Session Continuity

Last session: 2026-09-07T04:30:07.648Z
Stopped at: Completed 01-08-PLAN.md
Resume file: None
