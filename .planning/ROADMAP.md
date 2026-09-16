# Roadmap: ParseForge — Growth, Design & Monetization

## Overview

ParseForge is a live product with real organic traffic, so this milestone ships in production-safe slices rather than one big rebuild. We start by consolidating the design tokens and standing up the consent layer — which immediately buys a working light/dark toggle and closes the PostHog EU-consent gap. Next we defend the core value: verified game data, tested engines, and the per-fight depth (cast timeline, healer metrics) that raiders already expect. With analysis trustworthy, we sharpen the viral loop (roast cards, per-player permalinks), then turn on ads inside slots that can never crowd the flow those shares land on. A real Discord and LootList+ cross-promotion give the audience somewhere to go, programmatic and guide content widens what search can find, and only then — with tokens stable, ads placed, and content in place — does the site-wide redesign roll out route-by-route behind an SEO-preservation gate, closing with CSP promoted to enforcing.

**Project mode:** MVP (vertical slices) — every phase ships an end-to-end, user-visible win to production, not a technical layer.

**Standing gate (OPS-01):** No phase is complete until its user-facing changes ship WITH PostHog instrumentation and a GSC verification pass (sitemap, indexing, metadata). This appears as the final success criterion of every phase.

**Deploy note:** This is a brownfield live site. Deploys are manual (`vercel deploy --prod --scope loot-list-plus`) and require explicit user confirmation — never self-authorized.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation — Themes & Consent** - Token audit unlocks a dark/light toggle; consent layer gates ads and PostHog replay (completed 2026-09-06)
- [x] **Phase 2: Accuracy & Analysis Depth** - Verified game data, tested engines, cast timeline, healer metrics (completed 2026-09-08)
- [x] **Phase 2.1: PostHog Consent Gate Hotfix** (INSERTED) - Server-side geo opt-in for non-EEA; live-traffic OPS-01 re-verification (completed 2026-09-15)
- [ ] **Phase 3: Share Loop** - Roast/award cards, per-player permalinks, share CTA that survives later phases
- [ ] **Phase 4: Ads Live** - AdSense in reserved, consent-gated slots that never crowd the core flow
- [ ] **Phase 5: Community & Cross-Promotion** - Dedicated Discord, LootList+ two-way links, auto-posted reports
- [ ] **Phase 6: Discoverability & Content** - Programmatic pages, fixed guides, CTR metadata, structured data
- [ ] **Phase 7: Redesign, De-bloat & Hardening** - Route-by-route visual overhaul behind an SEO gate; CSP enforcing

## Phase Details

### Phase 1: Foundation — Themes & Consent

**Goal**: Visitors control their own privacy and can read ParseForge in the theme they prefer, on a token system every later phase builds on
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-03, MONY-01, OPS-01
**Success Criteria** (what must be TRUE):

  1. An EEA/UK visitor sees a consent prompt on first visit and can accept or reject; PostHog session replay runs only after consent is granted, and ad scripts have a consent signal to read before any ad code exists.
  2. Any visitor can toggle dark/light theme from site chrome, the choice persists across page loads and routes, and no route renders unreadable or unstyled content in either theme.
  3. A token audit report shows shipped UI resolving color, spacing, motion, and elevation from Tailwind v4 `@theme` tokens — hardcoded values consolidated, missing token categories added.
  4. Consent choice and theme toggle emit PostHog events, and a GSC pass confirms no indexing/metadata regression — establishing the OPS-01 ship gate that every later phase repeats.

**Plans**: 9/9 plans executed
**UI hint**: yes

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Theme tracer: OS-preference default + 3-state navbar Light/Dark/System toggle, end to end
- [x] 01-02-PLAN.md — AdSense account + Google Privacy & Messaging EEA/UK consent message

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Consent tracer: TCF `__tcfapi` signal wired to PostHog gating, CMP script, CSP
- [x] 01-04-PLAN.md — Designed ParseForge light palette + spacing/motion/elevation `@theme` categories

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-05-PLAN.md — Per-theme WoW class and role colour tokens; Satori raw-hex exception preserved

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-06-PLAN.md — Token-audit gate, performance-tier tokens, and the shared colour helpers

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-07-PLAN.md — Hardcoded palette-class sweep + generated token audit report

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-08-PLAN.md — OPS-01 ship gate: both-theme route sweep, SEO-invariant diff, gate document

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 01-09-PLAN.md — Production deploy (approval-gated) + Search Console and PostHog close-out

**Notes**: Consent is deliberately built before any ad script (MONY-01 → MONY-02 sequencing) and simultaneously closes the pre-existing PostHog EU-consent debt in CONCERNS.md. Theme toggle is re-validated per route during Phase 7.

### Phase 2: Accuracy & Analysis Depth

**Goal**: Raiders get verifiably correct analysis plus the per-fight depth competitors already offer
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04
**Success Criteria** (what must be TRUE):

  1. User can open a per-fight cast timeline for a player in an analyzed report and read what that player actually cast, in order.
  2. Healers are judged on healer-relevant metrics rather than raw HPS alone — a healer viewing their own row sees analysis that reflects healing decisions, not a DPS-shaped ranking.
  3. Every enchant/gem/consumable ID the analysis surfaces traces to a wago.tools-regenerated data file (no hand-typed maps), with the regeneration re-run and the diff reviewed this phase.
  4. `cla-engine`, `raid-overview-engine`, and `wcl-client` have automated tests that fail when analysis output changes — a regression safety net in place before the redesign touches anything.
  5. New timeline and healer surfaces ship with PostHog events and pass the GSC verification pass (OPS-01 gate).

**Plans**: 9/9 plans executed
**UI hint**: yes

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Wave 0: record real WCL fixtures, then the query, type and rate-limit contracts the phase builds on

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Cast timeline tracer: open the Timeline tab and read your casts in order, end to end
- [x] 02-03-PLAN.md — wago.tools regeneration pipeline: script, overrides layer, three generated era modules

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-04-PLAN.md — Healer metrics: effective HPS, overheal and uptime from one shared helper on both surfaces
- [x] 02-05-PLAN.md — Timeline depth: idle gaps, death marker, filter chips, virtualisation, truncation notice
- [x] 02-06-PLAN.md — Cut cla-constants over to generated data and emit docs/GAME-DATA-AUDIT.md

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-07-PLAN.md — Healer-specific suggestions relative to top-healer values; DPS-shaped rules gated off
- [x] 02-08-PLAN.md — Engine regression tests for cla-engine, raid-overview-engine and wcl-client

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 02-09-PLAN.md — OPS-01 gate close-out and approval-gated production deploy

**Notes**: Accuracy is the project's stated core value ("a wrong recommendation is worse than no recommendation"), so it precedes monetization and redesign. The engine tests here are what make Phase 7's redesign safe to attempt.

### Phase 2.1: PostHog Consent Gate Hotfix (INSERTED)

**Goal**: Every visitor is measured again — non-EEA/UK visitors are captured without depending on the Google CMP, EEA/UK visitors keep the exact TCF gate, and the OPS-01 gate can never again pass on pre-deploy data
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: OPS-01 (re-verification), MONY-01 (consent semantics preserved)
**Success Criteria** (what must be TRUE):

  1. A fresh non-EEA/UK visitor's first `$pageview` reaches PostHog within seconds of load, with no `__tcfapi` involvement — decided server-side from Vercel's `x-vercel-ip-country` header.
  2. An EEA/UK visitor's behaviour is unchanged: no capture before the TCF dialog resolves, cookieless on reject, replay only on full opt-in.
  3. `consent_resolved` / `consent_unavailable` / `theme_changed` / `timeline_*` events appear in project 337485 within one hour of the prod deploy, with a `consent_gate_path` property distinguishing geo / TCF / timeout.
  4. `docs/OPS-01-SHIP-GATE.md` requires a post-deploy live-traffic check (≥ N `$pageview` from ≥ 2 non-EEA countries within 60 min) and this phase passes it for real; Phase 1 and 2 VERIFICATION docs carry an addendum noting their PostHog criterion was only met here.

**Plans**: 8/8 plans complete (incl. 4 gap-closure plans) — phase completed 2026-09-15 after human UAT (2/2), Nyquist validation and security verification
**UI hint**: no

Plans:
**Wave 1**

- [x] 02.1-01-PLAN.md — Tracer: server-side geo classification through `/api/geo` to an immediate PostHog opt-in, with the first `$pageview` gated on the consent path resolving
- [x] 02.1-02-PLAN.md — OPS-01 hardening: mandatory post-deploy live-traffic check, plus dated addenda correcting the Phase 1 and Phase 2 records

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02.1-03-PLAN.md — Preview deploy and the bounded headless-Chrome netlog proof that the first `$pageview` leaves the browser

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02.1-04-PLAN.md — Approval-gated production deploy, the live-traffic gate run for real, and the dated Phase 2.1 sign-off

**Gap closure** *(added 2026-09-14 from `02.1-VERIFICATION.md` — run with `/gsd-execute-phase 02.1 --gaps-only`; each depends on the previous)*

- [x] 02.1-05-PLAN.md — Gap B: read the pending Vercel Web Analytics figure for the 22:16:59Z–23:16:59Z window, score item-7 threshold 3, then sign Part 4 with a date or record FAIL honestly (never lower the bar)
- [x] 02.1-06-PLAN.md — Gap A (automatable half): drive the theme toggle and Timeline tab on production from a non-consent-region session, re-run the item-7 HogQL, record `theme_changed` / `timeline_*` with their `consent_gate_path`
- [x] 02.1-07-PLAN.md — Developer-approved redeploy of the five code-review fixes (CR-01, WR-01..04) so WR-03 is testable, plus a fresh 60-minute item-7 window measured for real
- [x] 02.1-08-PLAN.md — Truth 4 / MONY-01: EEA/UK TCF observation (reject, full opt-in, CMP re-confirm) as a human checkpoint with an honest not-performed branch

**Notes**: Diagnosis in `02.1-DIAGNOSIS.md`. Root cause: `cookieless_mode: "on_reject"` makes PENDING consent *drop* events in posthog-js 1.360, and opt-in depended on `__tcfapi` calling back — which it never does for fresh visitors. Capture fell from ~4–10k events/day to 3–7/day on 2026-09-06. Not a traffic collapse.

### Phase 3: Share Loop

**Goal**: A raider who just analyzed a log wants to post it, and the artifact they post pulls new players back to ParseForge
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):

  1. User can generate a roast/award-style card for a fight and paste it into Discord, where it unfurls as an image with the awards visible.
  2. User can copy a per-player permalink whose OG image shows that specific player's parse ("look at MY parse"), not a generic report card.
  3. Share actions are reachable without hunting on the analyze page on both desktop and mobile, and a protected-elements checklist naming the share CTA and OG pipeline exists for Phases 4 and 7 to honor.
  4. PostHog reports share rate per analysis against the ~2.8% baseline, and GSC verification confirms the new share routes/OG changes did not disturb indexing or canonicals (OPS-01 gate).

**Plans**: 3/7 plans executed
**UI hint**: yes

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Awards tracer: fight → awards engine → OG image → forwarded metadata, plus the one normalized share-link module

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Fill the award pool to fifteen conditional, stat-backed rules and lock the pool-wide invariants
- [x] 03-03-PLAN.md — Per-player permalink: OG receipts (Kill/Wipe, length, vs-top-N, proof line) and the Share my parse button
- [ ] 03-04-PLAN.md — Analyze-page share surfaces: Raid-tab awards panel with its real preview, normalized header Share, bottom bar removed, landing rules and `ref` attribution

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-05-PLAN.md — `docs/PROTECTED-ELEMENTS.md`, the `protected-elements` gate script, and the OPS-01 item plus share-rate HogQL

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 03-06-PLAN.md — Full local gate, preview deploy, and the developer's award-pool / Discord-unfurl / mobile review (OPS-01 Part 5, unsigned)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 03-07-PLAN.md — Approval-gated production deploy, the item-7 live-traffic and share-rate measurement, GSC pass, and an honest Part 5 sign-off

**Notes**: Built on the existing `/og/route.tsx` infrastructure. The protected-elements checklist produced here is a hard input to the Phase 4 ad placement whitelist.

### Phase 4: Ads Live

**Goal**: ParseForge earns ad revenue without the paste-and-analyze flow getting measurably worse
**Mode:** mvp
**Depends on**: Phase 1 (consent), Phase 3 (protected-elements checklist)
**Requirements**: MONY-02, MONY-03
**Success Criteria** (what must be TRUE):

  1. A visitor sees ads only in whitelisted slots; the paste box, analysis tables, and share CTA are never covered, pushed down, or delayed by ad loading.
  2. Ad slots reserve their exact space, so no visible layout shift happens when an ad fills — CLS measured, not eyeballed.
  3. Ads load only after consent is granted for EEA/UK visitors, and do not load at all when consent is rejected.
  4. LCP/INP/CLS on `/`, `/analyze/*`, and `/tbc-audit` are captured before ad code ships and re-measured after, with a written rollback trigger that has been agreed before launch.
  5. AdSense reports revenue on live traffic, PostHog tracks ad-slot impact on analyze completion, and GSC shows no ranking movement attributable to the change (OPS-01 gate).

**Plans**: TBD
**UI hint**: yes

**Notes**: Ads ship while CSP is still report-only so all new script sources surface as violation reports (feeds OPS-02 in Phase 7). Research flag: verify current ad-network eligibility thresholds directly at signup before finalizing; model expected revenue (est. $50–300/mo) against the CWV/UX cost and treat as a reversible experiment if marginal.

### Phase 5: Community & Cross-Promotion

**Goal**: Feedback and new reports flow into a real ParseForge community instead of the owner's personal DMs
**Mode:** mvp
**Depends on**: Phase 3 (share cards for auto-post)
**Requirements**: COMM-01, COMM-02, SHARE-04
**Success Criteria** (what must be TRUE):

  1. A visitor can join a dedicated ParseForge Discord from the site and lands in a server with real channels and visible activity, not an empty room.
  2. New feedback arrives in a Discord feedback channel rather than the owner's personal Discord.
  3. A visitor on LootList+ can reach ParseForge and vice versa via nav/footer links, with UTM attribution showing the traffic in PostHog on both sides.
  4. New public reports auto-post to Discord, and the post unfurls with the Phase 3 roast card.
  5. Cross-promo links and Discord entry points are instrumented in PostHog and GSC-verified as crawlable real `<a>` links that do not leak PageRank badly or break the sitemap (OPS-01 gate).

**Plans**: TBD
**UI hint**: yes

**Notes**: **Multi-repo phase.** The LootList+ side of COMM-02 is implemented in a separate repo at `/Users/alexander.mayes/Code/loot-list-plus` (Next.js + Supabase, deployed on **Railway**, separate GitHub repo `alexandermayes/loot-list-plus`) — its deploy path differs from ParseForge's Vercel CLI flow and needs its own confirmation. In-phase sequencing is COMM-01 → seed activity 1–2 weeks → site-wide promotion → SHARE-04 bot. LootList+'s existing `discord-bot/` is reusable prior art. Open question for planning: dedicated server vs. channel in the existing LootList+ server (empty-room risk).

### Phase 6: Discoverability & Content

**Goal**: More of the queries ParseForge can genuinely answer land on a ParseForge page
**Mode:** mvp
**Depends on**: Phase 2 (engine data grounds programmatic content)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):

  1. A searcher can land on a per-class or per-raid page whose content is generated from real engine/game data, reachable from a hub page and from existing internal links — 10–15 pilot pages rolled out staged, not batch-published.
  2. The 3 previously thin guides show as indexed in GSC, and new guide content targeting tool-intent queries is live.
  3. Already-ranking pages carry rewritten titles/descriptions (titles under ~47 chars pre-template, verified by rendering the page rather than eyeballing the metadata object).
  4. `/tbc-audit` FAQPage structured data is detected in GSC Rich Results, and all JSON-LD is compile-time type-checked via schema-dts.
  5. A keyword-to-URL map with intent segmentation exists, no new page targets a navigational cluster, and GSC/PostHog monitoring is in place for the 4–6 week indexing signature (OPS-01 gate).

**Plans**: TBD
**UI hint**: yes

**Notes**: Hard constraint from prior work — segment every keyword cluster by intent before building a page ("logs"/"warcraft logs" = navigational/unwinnable; "analyzer"/"parse"/"audit" = tool intent). Research flag: define the explicit per-page uniqueness rubric before scaling beyond the pilot set, or the pages risk scaled-content-abuse classification.

### Phase 7: Redesign, De-bloat & Hardening

**Goal**: The whole site looks and reads like one intentional product — without losing a single ranking
**Mode:** mvp
**Depends on**: Phase 1 (tokens/themes), Phase 4 (ad slots to design around), Phase 6 (content to preserve)
**Requirements**: DSGN-02, DSGN-04, SEO-05, OPS-02
**Success Criteria** (what must be TRUE):

  1. Every route is visually redesigned against the chosen refero.design references, still reads as recognizably ParseForge (colors/identity preserved), and works in both dark and light themes.
  2. A visitor on any page can find that page's primary action without scrolling past accumulated SEO filler — bloat restructured, never deleted outright.
  3. Each route passes an SEO-preservation gate before promotion: URL frozen, heading hierarchy and canonical tag preserved, internal links still real `<a>` tags, HTML diffed against production.
  4. CSP runs in enforcing mode with all ad, CMP, analytics, and font sources allowlisted, and the core flows (paste → analyze → share) produce zero CSP console errors.
  5. GSC shows no ranking or indexing regression on redesigned routes in the 2–4 weeks after promotion, and PostHog shows analyze-completion rate holding or improving (OPS-01 gate).

**Plans**: TBD
**UI hint**: yes

**Notes**: Rollout order is low-traffic routes first, high-traffic (`/`, `/analyze/*`, `/tbc-audit`) last. Uses the project's `impeccable` skill for the design work. OPS-02 lands at the very end of the milestone, after every ad/CMP source has been discovered through report-only violation reports.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation — Themes & Consent | 9/9 | Complete    | 2026-09-06 |
| 2. Accuracy & Analysis Depth | 9/9 | Complete    | 2026-09-08 |
| 2.1. PostHog Consent Gate Hotfix (INSERTED) | 8/8 | Complete    | 2026-09-15 |
| 3. Share Loop | 3/7 | In Progress|  |
| 4. Ads Live | 0/TBD | Not started | - |
| 5. Community & Cross-Promotion | 0/TBD | Not started | - |
| 6. Discoverability & Content | 0/TBD | Not started | - |
| 7. Redesign, De-bloat & Hardening | 0/TBD | Not started | - |

## Requirement Coverage

All 24 v1 requirements mapped to exactly one phase. No orphans, no duplicates.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. Foundation — Themes & Consent | DSGN-01, DSGN-03, MONY-01, OPS-01 | 4 |
| 2. Accuracy & Analysis Depth | ACC-01, ACC-02, ACC-03, ACC-04 | 4 |
| 3. Share Loop | SHARE-01, SHARE-02, SHARE-03 | 3 |
| 4. Ads Live | MONY-02, MONY-03 | 2 |
| 5. Community & Cross-Promotion | COMM-01, COMM-02, SHARE-04 | 3 |
| 6. Discoverability & Content | SEO-01, SEO-02, SEO-03, SEO-04 | 4 |
| 7. Redesign, De-bloat & Hardening | DSGN-02, DSGN-04, SEO-05, OPS-02 | 4 |
| **Total** | | **24** |

## Sequencing Constraints Honored

| Constraint | Where enforced |
|------------|----------------|
| Consent (MONY-01) precedes any ad script (MONY-02) | Phase 1 → Phase 4 |
| CWV baseline (MONY-03) captured before ads ship | Phase 4, first plan before ad code |
| Design-token audit (DSGN-01) precedes redesign (DSGN-02/03) | Phase 1 → Phase 7 |
| SEO-preservation gate (SEO-05) applies to redesign/de-bloat | Phase 7, per route |
| Discord (COMM-01) precedes auto-post bot (SHARE-04) | Phase 5, in-phase sequencing |
| CSP promotion (OPS-02) last, after ad/CMP sources discovered | Phase 7, final |
| OPS-01 measurement gate on every user-facing change | Final success criterion of all 7 phases |

---
*Roadmap created: 2026-09-04*
