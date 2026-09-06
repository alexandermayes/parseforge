# Requirements: ParseForge — Growth, Design & Monetization Milestone

**Defined:** 2026-09-04
**Core Value:** A player pastes a Warcraft Logs URL and instantly gets accurate, actionable answers to "why is my parse low" — accuracy is non-negotiable.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### SEO

- [ ] **SEO-01**: Visitor can discover ParseForge via programmatic landing pages (hub + 10–15 pilot pages, e.g. per-class/per-raid) whose content is grounded in real engine data — staged rollout with a keyword-to-URL map, per-page uniqueness bar, intent-segmented targets
- [ ] **SEO-02**: The 3 thin unindexed guides are rewritten/expanded to indexable quality, plus new guide content targeting tool-intent queries
- [ ] **SEO-03**: Pages that already rank get CTR-focused metadata iteration (titles under ~47 chars pre-template, descs matched to actual content)
- [ ] **SEO-04**: Structured data fixed and validated (`/tbc-audit` FAQPage detected in GSC; JSON-LD type-checked via schema-dts); sitemap and internal-link health maintained
- [ ] **SEO-05**: Redesign/de-bloat work passes an SEO-preservation gate per route: URLs frozen, heading hierarchy and canonical tags preserved, internal links remain real `<a>` tags, HTML diffed against production before promotion

### Viral Loop

- [ ] **SHARE-01**: User can generate a roast/award-style shareable card per fight (auto-generated awards, Discord-shareable image built on existing OG infra)
- [ ] **SHARE-02**: User can share a per-player permalink with a player-specific OG image ("look at MY parse")
- [ ] **SHARE-03**: Share actions are prominent in the analyze UI and protected from ad/redesign crowding (share CTA + OG unfurl on the protected-elements checklist)
- [ ] **SHARE-04**: New public reports can auto-post to Discord via bot/webhook (sequenced after COMM-01 exists)

### Design & UX

- [x] **DSGN-01**: Design-token audit complete — hardcoded values consolidated into the existing Tailwind v4 `@theme` tokens; spacing/motion/elevation categories added
- [ ] **DSGN-02**: Site-wide route-by-route visual redesign shipped (reference: top ~3 closest-matching styles from styles.refero.design; must stay recognizably ParseForge; low-traffic routes first)
- [x] **DSGN-03**: Site supports dark + light themes with a toggle (both validated across redesigned routes)
- [ ] **DSGN-04**: Every page passes a UX audit — SEO-accumulated bloat removed or restructured without deleting ranking content (gated by SEO-05)

### Monetization

- [x] **MONY-01**: Consent-management layer live (Google-certified TCF CMP) gating both ad scripts and PostHog session replay for EEA/UK visitors — closes the existing PostHog EU-consent gap
- [ ] **MONY-02**: AdSense ads live via reserved-space AdSlot components + consent-gated script loader + per-route placement whitelist; ads never block or crowd the core paste-and-analyze flow or analysis tables
- [ ] **MONY-03**: CWV baseline (LCP/INP/CLS on `/`, `/analyze/*`, `/tbc-audit`) captured before ad code ships; post-ship monitoring with defined rollback criteria

### Accuracy & Capabilities

- [ ] **ACC-01**: Game-data accuracy re-audit via the wago.tools regeneration workflow (no hand-typed ID maps)
- [ ] **ACC-02**: Test coverage added for the untested engines (`cla-engine`, `raid-overview-engine`, `wcl-client`)
- [ ] **ACC-03**: User can view a per-fight cast timeline (closes table-stakes gap vs competitors)
- [ ] **ACC-04**: Healer-specific analysis improved (healer metrics beyond raw HPS)

### Community & Cross-Promotion

- [ ] **COMM-01**: Dedicated ParseForge Discord exists — minimal channels, seeded activity for 1–2 weeks, then promoted site-wide (widget/link); feedback no longer lands in owner's personal Discord
- [ ] **COMM-02**: Two-way cross-promotion live between ParseForge and LootList+ (nav/footer links with UTM attribution on both sites) — LootList+ repo is locally available at `/Users/alexander.mayes/Code/loot-list-plus` (live sister product: Next.js + Supabase, deployed on Railway, has its own `discord-bot/`), so both sides can be implemented directly

### Operations (standing invariants)

- [ ] **OPS-01**: Every user-facing change ships WITH PostHog instrumentation and GSC verification (sitemap/indexing/metadata) — enforced as a phase-gate, not a follow-up task
- [ ] **OPS-02**: CSP promoted from report-only to enforcing at end of milestone, after all ad/CMP script sources are discovered via violation reports

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Analysis

- **ADV-01**: Death analysis / chain-of-events breakdown (requires per-boss mechanic metadata — needs dedicated research)
- **ADV-02**: Boss-specific mechanic checks (soaks, dispels, interrupts, tank swaps)
- **ADV-03**: Guild-level multi-report trend view (proven paid-tier surface — tbc-audit charges €8.99/mo for this)

### Monetization v2

- **MONY-V2-01**: Premium/ad-free tier (only viable once ads + audience exist)
- **MONY-V2-02**: Upgrade to premium ad network (Raptive/Playwire/etc.) once traffic clears eligibility thresholds

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Anniversary landing page | Investigated 2026-07-31: ~96% navigational intent, ceiling +19 clicks/mo, cannibalization risk vs /tbc-audit |
| GA4 | PostHog covers product analytics; GSC covers search |
| Retail WoW support | Different product/data model |
| Paid acquisition | Organic-first strategy |
| Targeting navigational query clusters | `wow tbc logs` / bare `tbc audit` / `* anniversary logs` = warcraftlogs.com/tbc-audit.com seekers; proven 0.2–0.6% CTR, unwinnable |
| Premium ad networks now | Below traffic thresholds (100k–1M pv/mo); AdSense is the only zero-friction option |
| Gating core analysis behind payment | Every successful comparable tool keeps single-report analysis free; violates core value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEO-01 | Phase 6 | Pending |
| SEO-02 | Phase 6 | Pending |
| SEO-03 | Phase 6 | Pending |
| SEO-04 | Phase 6 | Pending |
| SEO-05 | Phase 7 | Pending |
| SHARE-01 | Phase 3 | Pending |
| SHARE-02 | Phase 3 | Pending |
| SHARE-03 | Phase 3 | Pending |
| SHARE-04 | Phase 5 | Pending |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 7 | Pending |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 7 | Pending |
| MONY-01 | Phase 1 | Complete |
| MONY-02 | Phase 4 | Pending |
| MONY-03 | Phase 4 | Pending |
| ACC-01 | Phase 2 | Pending |
| ACC-02 | Phase 2 | Pending |
| ACC-03 | Phase 2 | Pending |
| ACC-04 | Phase 2 | Pending |
| COMM-01 | Phase 5 | Pending |
| COMM-02 | Phase 5 | Pending |
| OPS-01 | Phase 1 | Pending (enforced as a ship gate in every phase) |
| OPS-02 | Phase 7 | Pending |

**Coverage:**

- v1 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0

---
*Requirements defined: 2026-09-04*
*Last updated: 2026-09-04 after roadmap creation (7 phases, 100% coverage)*
