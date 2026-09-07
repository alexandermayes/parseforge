# ParseForge

## What This Is

ParseForge (parseforge.gg) is a free WoW Classic / TBC raid-log analyzer. A player pastes a Warcraft Logs report URL and gets instant analysis of their raid's DPS/HPS, gear, enchants, consumables, buffs, and talents compared against top-ranked players. It's a live, shipping product whose #1 acquisition channel is Google organic search (~1k clicks/mo).

## Core Value

A player pastes a Warcraft Logs URL and instantly gets **accurate**, actionable answers to "why is my parse low" — accuracy is non-negotiable; a wrong recommendation is worse than no recommendation.

## Business Context

- **Customer**: WoW Classic/TBC raiders, raid leaders, and officers auditing their raids
- **Revenue model**: None today; ads are the planned first monetization (user: "sucks, but easiest right now" — open to better low-effort alternatives)
- **Success metric**: Monthly organic clicks (GSC) growing + analyses run and shares (PostHog)
- **Strategy notes**: GSC connected via MCP `gscServer`; PostHog project 337485 (org LootList+); sister site LootList+ exists for cross-promotion

## Requirements

### Validated

<!-- Inferred from existing codebase (.planning/codebase/) and shipped growth PRs. -->

- ✓ WCL report analysis: DPS/HPS, gear, consumables, buffs, talents vs top-ranked parses — existing
- ✓ Raid-wide Buff & Gear Audit (CLA engine) with dedicated `/tbc-audit` landing page — existing
- ✓ SSR indexable report pages (index-when-public, noindex/404 safeguards, param-free canonicals) — existing
- ✓ Self-populating sitemap via Upstash Redis (`pf:recent_reports`) — existing, verified paying off (long tail of `/analyze/*` pages earning 17–100% CTR)
- ✓ SEO foundation: 5 guides, crawlable internal links (FeaturedReports, guides section, navbar), tuned metadata — existing
- ✓ Viral loop v1: Discord copy backlink + OG unfurl, demo report, share buttons — existing (share rate only ~2.8%, needs work)
- ✓ PostHog analytics + structured observability; rate limiting; CSP (report-only) — existing
- ✓ Verified game-data ID databases (wago.tools regeneration workflow) — existing
- ✓ Light/Dark/System theme toggle with a genuine ParseForge light palette; class/role/tier colours and every utility colour resolved from paired tokens, enforced by `theme-parity` + `token-audit` gates (DSGN-01, DSGN-03) — Phase 1
- ✓ GDPR consent layer: Google Privacy & Messaging (TCF v2.2) gates PostHog capture and session replay for EEA/UK visitors; non-EEA unaffected (MONY-01) — Phase 1
- ✓ `/privacy` and `/terms` pages (individual operator, California law, contact info@lootlistplus.com) — Phase 1 (quick task 260906-kzw)
- ✓ OPS-01 ship gate as a repeatable document (`docs/OPS-01-SHIP-GATE.md`) with `seo-invariants` local-vs-prod diff; Phase 1 gate closed with GSC + PostHog evidence — Phase 1

### Active

<!-- This milestone: Growth, Design, Monetization, Community. -->

**SEO (all four levers in scope):**
- [ ] Programmatic landing pages grounded in real product features (per-class / per-raid / per-tool pages like `/tbc-audit`) — never doorway pages
- [ ] Guides/content: fix the 3 thin unindexed guides; add new content targeting tool-intent queries
- [ ] CTR/metadata iteration on pages that already rank (homepage pos ~5.9 on head terms)
- [ ] Indexing plumbing: structured data fixes (FAQPage not detected on `/tbc-audit`), sitemap health, recrawl nudges, internal links

**Viral loop:**
- [ ] Raise share rate from ~2.8% of analyses — share UX, shared-page landing experience

**Design & UX:**
- [ ] Site-wide design overhaul (via impeccable workflow) — current UI is "super messy"; reference top ~3 closest-matching styles from https://styles.refero.design/; full redesign allowed but must stay recognizably ParseForge (colors/identity preserved)
- [ ] Full-page UX audit: de-bloat pages that accumulated SEO content, ensure every page's UX is intuitive

**Monetization:**
- [ ] Ship first monetization — ads as default plan; evaluate low-effort alternatives before committing

**Product quality:**
- [ ] Improve analysis accuracy (top priority per user) and expand tool capabilities

**Ecosystem & community:**
- [ ] Connect LootList+ ↔ ParseForge (cross-promotion between the two sites)
- [ ] Stand up a proper community/feedback channel — dedicated ParseForge Discord or shared LootList+ server (feedback currently lands in the owner's personal Discord)

**Standing operational requirement:**
- [ ] Every shipped user-facing change updates PostHog instrumentation and is verified in GSC (sitemap/indexing/metadata) — this is an always-on invariant, not a one-time task

### Out of Scope

- Anniversary landing page — investigated 2026-07-31 and rejected: intent is ~96% navigational (warcraftlogs.com seekers), ceiling ≈ +19 clicks/mo, cannibalization risk vs `/tbc-audit`
- GA4 — PostHog covers product analytics; GSC covers search
- Retail WoW support — different product/data model
- Paid acquisition — organic-first strategy
- Chasing navigational query clusters (`wow tbc logs`, `tbc audit` bare term, `* anniversary logs`) — unwinnable warcraftlogs.com/tbc-audit.com intent; proven 0.2–0.6% CTR at pos 4–6

## Context

- **Brownfield**: codebase mapped at `.planning/codebase/` (ARCHITECTURE, STACK, CONVENTIONS, CONCERNS, etc.)
- **Stack**: Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · shadcn/Radix · Upstash Redis · PostHog · Vercel (team `loot-list-plus`)
- **Measurement**: GSC via MCP `gscServer` (service account); PostHog via MCP. A Sept 8, 2026 scheduled check-in reviews `/tbc-audit` + PR #10 outcomes — don't re-diagnose before then
- **LootList+**: live, actively-developed sister product with repo locally at `/Users/alexander.mayes/Code/loot-list-plus` (Next.js + Supabase, deployed on Railway — NOT Vercel; separate GitHub repo `alexandermayes/loot-list-plus`). Already ships a `discord-bot/`, companion app, and in-game addon — reusable knowledge for ParseForge's Discord bot work. Cross-promo can be implemented directly in both repos
- **Hard-won SEO lessons (do not relearn):**
  - Segment ANY keyword cluster by intent before proposing a page: "logs"/"warcraft logs" in query = navigational (unwinnable); "analyzer"/"parse"/"audit" qualified = tool intent (10–36% CTR)
  - Site-wide CTR is structurally misleading (navigational impressions dominate) — never treat it as a health metric; segment first
  - Title template appends " | ParseForge" (13 chars) — child page titles must stay under ~47 chars; always render pages to verify, don't eyeball metadata
- **Next keyword candidate**: `wow log analyzer` (392 impr/28d, pos 3.5, tool intent) — segment before building
- **Known concerns** (from CONCERNS.md): CSP still report-only; core engines (cla, raid-overview, wcl-client) largely untested. *(Resolved Phase 1: PostHog EU consent flow now gated by the Google CMP.)* Deferred from Phase 1: formal ASVS security review — gsd security tooling not installed; per-plan STRIDE registers exist
- **Manual follow-ups after Phase 1**: paste `https://parseforge.gg/privacy` into AdSense → Privacy & messaging → message site settings; re-check PostHog event definitions (`theme_changed`, `consent_resolved`) at the Phase 2 gate; `git push origin main` (unpushed phase forces sequential execution)
- **Feedback source today**: owner's personal Discord (uncomfortable) — motivates the community requirement

## Constraints

- **Tech stack**: Keep Next.js 16 / React 19 / Tailwind v4 / shadcn — no framework migration
- **SEO invariants**: Report pages indexable only when public (noindex otherwise, 404 when missing); canonicals param-free; `recordRecentReport`/`getRecentReports`/`usingSharedCache` sitemap pipeline must never break — this project lives on organic search
- **Accuracy**: Game-data IDs must be verified via the wago.tools regeneration workflow — no hand-typed ID maps
- **Brand**: Redesign may be radical but must remain recognizably ParseForge (colors/identity)
- **Deploys**: Manual via Vercel CLI only (no git auto-deploy); confirm with user before prod deploys
- **Measurement**: GSC + PostHog updates ship WITH every user-facing change, not after
- **Secrets**: Live credentials in Vercel env — never commit or print

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Organic-first growth (SEO + viral loop), no paid acquisition | SEO already #1 channel; report pages compounding | ✓ Good |
| Programmatic pages must map to real features (e.g. `/tbc-audit` = CLA tab) | Avoids doorway-page risk; grounded content ranks | ✓ Good |
| Reject anniversary page; avoid navigational clusters | Intent segmentation showed unwinnable queries | ✓ Good |
| Full design overhaul, identity preserved | Site "messy/bloated" after SEO additions; refero.design as reference | — Pending |
| Ads as first monetization | Easiest path to revenue now; alternatives evaluated first | — Pending |
| Dedicated community channel (Discord) | Feedback currently in owner's personal Discord | — Pending |
| GSC + PostHog instrumentation as standing invariant | Measurement must track every change | ✓ Phase 1 gate closed via `docs/OPS-01-SHIP-GATE.md`; re-run every phase |
| Google Privacy & Messaging as the CMP; EEA/UK-only full-screen message; consent shipped before any ad script | Certified TCF v2.2 CMP inside the AdSense account Phase 4 needs anyway; US traffic and Googlebot never see an interstitial | ✓ Live 2026-09-06 (Phase 1) |
| Class-attribute theming via next-themes, tokens enforced by `theme-parity` + `token-audit` scripts | Machine-checkable DSGN-01 so the Phase 7 redesign can't regress hardcoded colours | ✓ Good (Phase 1) |
| Preview deploy before every prod deploy when no real-browser pass happened | Agents can't drive a browser; a preview lets the developer eyeball before visitors do | ✓ Good (Phase 1) |
| Defer the formal ASVS security review for Phase 1 | Security tooling absent from this gsd-core profile; STRIDE registers exist per plan | — Pending (install tooling, run `/gsd-secure-phase 01`) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-07 after Phase 1*
