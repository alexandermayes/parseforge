# Project Research Summary

**Project:** ParseForge (parseforge.gg) — WoW Classic/TBC raid-log analyzer, growth/design/monetization/community milestone

**Domain:** Established organic-search-dependent SaaS tool (web-based log analyzer) adding ads, programmatic content, design overhaul, viral enhancements, and community

**Researched:** 2026-09-04

**Confidence:** MEDIUM overall (strong architectural clarity, LOW-confidence technology sources, HIGH-confidence project constraints)

---

## Executive Summary

ParseForge is entering a multi-track growth milestone (programmatic SEO, ads monetization, design overhaul, viral loop, community) on top of a stable, Next.js 16 App Router foundation with proven organic-search momentum. Research confirms that the recommended approach is **additive integration** of five loosely-coupled tracks (pSEO pages, ads, token audit, cross-site links, share enhancements) rather than a monolithic redesign — this keeps risk tractable and allows parallel execution. The single highest risk is that ads, redesign, and content expansion all touch the same visual/SEO surfaces; without deliberate sequencing (token audit first, then share/ads, then pSEO/visual), the project risks quietly undermining the exact organic-search rankings that monetization depends on. The research flags a **critical prerequisite**: fix the existing PostHog EU-consent gap together with ad-consent management as a single compliance layer before any ad script goes live to EEA/UK users — otherwise the project compounds an existing unresolved compliance debt.

Recommended first phase is foundation setup (token audit + consent primitive): low-complexity, unblocks everything else, and addresses standing compliance gaps. Share-loop enhancements and ads integration can run in parallel (Phase 2) since they're loosely coupled. Content expansion and visual redesign happen later (Phases 3-4) once foundation is stable, allowing careful validation of programmatic pages against scaled-content-abuse risk and of the redesign against existing SEO signals.

---

## Key Findings

### Recommended Stack

**Summary:** ParseForge's existing stack (Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Upstash Redis, PostHog, Vercel) remains the foundation. New additions are minimal and additive: **Google AdSense** (zero-friction entry point at current 30–50k pageviews/month traffic), **InMobi CMP** (free, Google-certified TCF consent platform required for EEA/UK legal compliance since Jan 2024), **Tailwind v4 token extension** (audit existing hardcoded color values, add spacing/motion/elevation token categories), **Discord server widget** (read-only community embed, no bot yet), and **schema-dts** (TypeScript type-safety for JSON-LD structured data). Do **not** adopt premium ad networks (Raptive/Mediavine/Playwire) yet — ParseForge is below their traffic thresholds; AdSense is the only viable zero-friction option today.

**Core new technologies:**
- **Google AdSense** — Primary ad monetization, no application backlog, ~68% revenue share, only option at 30–50k pageviews/month scale
- **InMobi CMP** — Free, Google-certified IAB TCF 2.3 consent platform; mandatory for EEA/UK ad serving since Jan 2024, with Feb 28, 2026 migration deadline
- **Tailwind v4 `@theme` tokens (extend existing)** — Add missing token categories (spacing scale, motion durations, elevation/shadow); audit and consolidate hardcoded color values
- **Discord Server Widget (official iframe)** — Read-only community embed; no bot infrastructure yet (defer to Phase 2)
- **schema-dts** — Types-only package for compile-time validation of JSON-LD structured data (e.g., fixing the existing FAQPage-not-detected issue on `/tbc-audit`)

**Key constraint:** Content Security Policy is currently report-only with documented allowlist. Any ad network and CMP are new CSP sources; **ads must be integrated while CSP is report-only** so requirements are discovered via violation reports, not silent failures once enforcing mode is enabled. CSP promotion to enforcing happens at the end of this milestone, not before.

**Critical decision to validate:** STACK research found a contradiction on Ezoic's traffic threshold (sources claim both "3,000 visits/no minimum" and "250,000 users/month"). Before committing roadmap phases to "Ezoic as upgrade path," verify the actual current threshold directly at ezoic.com signup.

### Expected Features

**Summary:** Feature landscape is shaped by competitive insight: ParseForge's three direct competitors (tbc-audit.com, thisisfine.team, wipefest.gg) prove what users value. Table-stakes features ParseForge already has (paste-a-log, gear/buff audit, DPS comparison, shareable links) are working and should be protected from monetization friction. Differentiators to ship this milestone are roast/award-style shareable cards (proven share driver), cross-promotion with LootList+, and a community Discord; these are low-complexity, high-leverage items. Higher-complexity features (death analysis, boss mechanic checks, guild trends) require per-encounter metadata and should defer to Phase 3+.

**Must have (already exist, protect from ads blockage):**
- Paste-a-log instant audit, no login required
- Gear/enchant/gem/consumable check vs spec (CLA engine)
- DPS/HPS comparison to top-ranked players
- Shareable report links; mobile-readable results
- Raid buff uptime checks

**Should have this milestone (differentiators, low complexity):**
- Roast/award-style shareable card per fight (biggest share driver; builds on existing OG image infra)
- LootList+ cross-promotion nav/footer links (explicit PROJECT.md requirement, zero complexity)
- Community Discord server with seeded activity (explicit PROJECT.md requirement)
- Ads as default monetization, never blocking core paste-and-analyze flow

**Defer to Phase 2+ (moderate complexity):**
- Cast timeline / vertical cast log per fight (closes table-stakes gap vs competitors)
- Healer-specific metrics extension (underserved 30% of raid rosters)
- Discord bot/webhook auto-post on new reports (requires community Discord first)

**Future consideration — v2+, needs dedicated research (high complexity):**
- Death analysis / chain-of-events breakdown (requires per-boss mechanic metadata)
- Boss-specific mechanic checks (same metadata dependency as death analysis)
- Guild-level multi-report trend view (highest-complexity but proven monetization surface; tbc-audit charges €8.99/month for this exact feature)

### Architecture Approach

**Summary:** The project's growth requires integrating five parallel tracks (programmatic SEO, ads, design tokens, cross-site integration, share-loop enhancements) without creating a monolithic rebuild. The architecture approach is **track-based modularity**: each track has clear component boundaries, minimal cross-track dependencies beyond the shared foundation (tokens, consent), and can be verified independently via CWV/GSC/PostHog metrics. No new subsystems are needed; all five tracks extend existing patterns.

**Major architectural components:**

1. **Programmatic SEO pages** — Content generation grounded in existing game-data constants and analysis engines, not hand-authored facts. Template + data-module pattern (not MDX) to enforce substantive per-page uniqueness and avoid doorway-page classifications.

2. **Ads infrastructure** — Three-part split: (a) **AdSlot** component owns reserved space (fixed min-height/aspect-ratio), never collapses/resizes (CLS prevention); (b) **AdScriptLoader** is the single injection point for ad-network scripts, wired to consent state before any script loads; (c) **ad-config.ts** whitelists ad placement per route.

3. **Design tokens** — Extends existing Tailwind v4 `@theme inline` model. Work is (a) audit pass to consolidate hardcoded values into `var(--token)` references, (b) add missing token categories (spacing, motion durations, elevation), (c) route-by-route visual rollout.

4. **Cross-site integration (ParseForge ↔ LootList+)** — Two separate Vercel deployments, loose-coupled via small banner component and UTM query params for attribution.

5. **Share-loop enhancements** — Extends existing `/og/route.tsx` to support per-player share cards via query param, builds per-player permalink, optionally adds dedicated `/share/[reportCode]/[playerId]` landing route.

### Critical Pitfalls (Top 5)

1. **Ads degrade Core Web Vitals and silently tank rankings** — Ad scripts cause CLS without reserved space. On organic-search-dependent site, CWV regression suppresses ranking signals. **Prevention:** Reserve exact width/height for every ad slot; lazy-load below-fold; measure CWV before and after.

2. **Monetizing too early yields pennies while creating real costs** — At 30–50k pageviews/month and $2–6 gaming RPM, revenue is $50–300/month. CWV risk, GDPR burden, UX tax are all real and ongoing. **Prevention:** Model revenue vs costs; if under ~$100/month, treat as reversible experiment with rollback criteria.

3. **Redesign silently deletes SEO content and internal links** — Common failure: teams delete ranking-bearing content to "de-bloat," experience 500+-day recovery. **Prevention:** Freeze URLs; preserve heading hierarchy; keep internal links as real `<a>` tags; diff HTML against production before promoting.

4. **Programmatic pages trigger scaled-content-abuse policy** — If pages are templated with only class/raid name swapped, no unique per-page data, Google's March 2024+ updates suppress them. **Prevention:** Every page carries genuine, non-templated value; staged rollout, not batch-publish.

5. **Ad consent (GDPR/CMP) bolted on wrong kills revenue or breaks compliance** — This project already carries PostHog EU-consent debt. Layering ads without fixing it compounds the problem. **Prevention:** Fix PostHog consent gap + ad-consent requirement together as one consent-management layer; use Google-certified CMP if serving EEA/UK.

---

## Implications for Roadmap

Based on research, suggested phase structure is **five sequential phases** with carefully managed dependencies and parallel execution within phases.

### Phase 1: Foundation Setup (2–3 weeks)
**Rationale:** Token audit is the unblocking foundation for all subsequent UI work; consent primitive solves both the standing PostHog EU-consent gap and the ad-compliance requirement.

**Delivers:**
- Complete design-token audit (consolidate hardcoded values, add missing token categories)
- Stable, extended Tailwind v4 `@theme` token set
- Consent-management architecture (CMP choice, banner UI, PostHog + ad-network wiring, TCF signal passthrough)

**Addresses:** Design system foundation, ad consent infrastructure, PostHog EU-compliance gap
**Avoids:** Redoing token audit mid-redesign; bolting on ad consent without fixing existing consent debt

---

### Phase 2: Monetization + Viral Loop Foundation (3–4 weeks)
**Rationale:** Share-loop enhancements are low-risk, high-leverage extensions of existing infrastructure; ads CSP discovery runs in parallel. Both depend on Phase 1 foundation.

**Delivers:**
- Per-player share cards and OG image variants
- Richer share UX (Discord unfurl, dedicated landing route)
- Ad-network choice finalized; CSP report-only violations documented
- AdSlot + AdScriptLoader infrastructure
- Consent gate wiring

**Addresses:** Roast/award shareable card, ads monetization infrastructure
**Avoids:** Redesign breaking OG pipeline; ads/redesign cannibalizing share loop

**Research flags:**
- Verify actual Ezoic eligibility before final selection
- Before/after CWV measurement required (establish baseline, confirm no INP regression)
- Revenue model validation: calculate expected revenue at current + projected traffic

---

### Phase 3: Content Expansion + Community (4–5 weeks)
**Rationale:** pSEO hub/templates depend on stable tokens from Phase 1. Discord and cross-promo are independent and can run in parallel.

**Delivers:**
- pSEO hub pages (`/classes`, `/raids`) with initial template + 10–15 pilot pages
- Keyword-to-URL map (prevents cannibalization)
- Per-page uniqueness validation (spot-audit samples)
- LootList+ cross-promo integration
- Community Discord server (minimal channels, seeded activity for 1–2 weeks before site-wide promotion)

**Addresses:** Programmatic SEO (staged), LootList+ cross-promotion, community Discord
**Avoids:** Scaled-content-abuse (staged rollout), accuracy regressions (wago.tools regen), Discord launching empty

**Research flags:**
- Define per-page uniqueness criteria before scaling
- Build keyword-to-URL map with intent segmentation
- GSC monitoring plan (watch for 4–6 week plateau signature)

---

### Phase 4: Visual Redesign + Scale (5–6 weeks)
**Rationale:** Route-by-route visual redesign can proceed with confidence: tokens are audited/stable, pSEO templates set the pattern, ad infrastructure is ready, share UX is proven.

**Delivers:**
- Route-by-route visual redesign rollout (low-traffic routes first, high-traffic last)
- pSEO page scaling (replicate Phase 3 templates to full matrix)
- Ad-slot placement expansion
- Redesigned share-card UX

**Addresses:** Site-wide design overhaul, ads on higher-traffic pages, programmatic page scale-out
**Avoids:** Redesign deleting SEO content (HTML diffs per route); ads degrading CWV (re-measure); scaled-content-abuse

**Research flags:**
- SEO impact assessment per route (before/after GSC, structured-data, internal-link audits)
- CWV monitoring intensifies (Vercel Speed Insights + Lighthouse per key route)
- Discord engagement check (verify active daily activity before site-wide feature promotion)

---

### Phase 5: Hardening + Optimization (2–3 weeks, overlaps tail of Phase 4)
**Rationale:** Final phase, only after Phases 2–4 are stable in production. CSP promotion is the only hard gate (ad-network/CMP sources must be fully discovered first).

**Delivers:**
- CSP promotion from report-only to enforcing
- Game-data accuracy re-audit
- Discord moderation team assignment (once ~50 members)
- Performance optimization

**Avoids:** CSP enforcement breaking ads silently; accuracy regressions undetected; community moderation burden

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | MEDIUM | Core recommendations (AdSense, InMobi CMP, Tailwind token extension) sound and grounded in existing codebase. However, LOW-confidence web-search sources dominate (Ezoic threshold contradiction unresolved, ad-network thresholds move fast and need direct verification). |
| **Features** | MEDIUM | Competitive landscape research solid (cross-checked against 6+ direct competitor sites). Feature priorities validated by competitor precedent. Roadmap sequencing and exact implementation costs are estimates pending detailed planning. |
| **Architecture** | HIGH | Next.js 16 App Router patterns, Tailwind v4 token system, CSP sequence, and ISR strategy all verified against official docs and this project's existing implementation. Build-order dependencies derived from clear technical constraints. |
| **Pitfalls** | MEDIUM | Generic pitfalls corroborated across multiple independent industry sources (HIGH confidence). Project-specific constraints sourced directly from PROJECT.md and MEMORY.md (HIGH confidence). Integration to this specific project requires planning-phase validation. |

**Overall: MEDIUM.** Architecture is HIGH-confidence and well-understood. Features are MEDIUM-confidence (competitive research solid but implementation unknowns remain). Stack is sound but depends on verification of ad-network thresholds. Pitfalls are well-identified (HIGH for patterns, HIGH for project constraints).

### Gaps to Address

1. **Ad-network eligibility threshold confirmation** — Ezoic contradiction found (3,000 visits vs 250,000 users/month). Before finalizing monetization roadmap, verify directly at each network's signup. **Handle in:** Early Phase 2 planning.

2. **Programmatic page uniqueness bar definition** — What counts as "unique enough" to avoid scaled-content-abuse? Aggregate stats vs hand-authored? **Handle in:** Phase 3 planning; establish explicit rubric before scaling.

3. **PostHog + LootList+ relationship clarity** — Is LootList+ a sister product or a former brand redirecting to ParseForge? Same PostHog project, separate projects, or completely separate? **Handle in:** Phase 3 planning.

4. **Monetization revenue-vs-cost tradeoff** — Calculate concrete expected revenue post-redesign. If marginal (under ~$100/month), clarify if ads are strategic goal or experiment. **Handle in:** Phase 2 finalization.

5. **Discord: dedicated vs shared channel** — Dedicated ParseForge Discord or channel in existing LootList+ server? Avoids empty-room problem if shared with existing members. **Handle in:** Phase 3 planning.

---

## Sources

- `.planning/research/STACK.md` — ad networks/eligibility, CMP/TCF compliance, Tailwind v4 theming, Discord widget, JSON-LD patterns (WebSearch, LOW-MEDIUM confidence; official docs corroborated where noted)
- `.planning/research/FEATURES.md` — competitor landscape (tbc-audit.com, thisisfine.team, wipefest.gg, wowanalyzer.com, ParseCard.app, Logs by HLTG), monetization patterns, viral mechanics (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — integration architecture for all five tracks, grounded in direct codebase reads (`globals.css`, `AnalyzeClient.tsx`, `/og/route.tsx`, `next.config.ts`) (HIGH confidence)
- `.planning/research/PITFALLS.md` — 9 critical pitfalls with prevention strategies and phase mapping; project-specific constraints from PROJECT.md and prior incident history (MEDIUM-HIGH confidence)

---

*Research synthesis completed: 2026-09-04*
*Status: Ready for roadmap creation*
