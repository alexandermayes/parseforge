# Phase 4: Ads Live - Context

**Gathered:** 2026-09-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 turns on AdSense display advertising on `/analyze/*` and `/tbc-audit` in reserved, consent-gated slots that never cover, push down, or delay the paste box, the analysis tables, or any `data-protected` share/awards element — with a counted CWV baseline captured before ad code ships, a written rollback trigger agreed before launch, and the OPS-01 gate re-run on live traffic. Folded in (2026-09-19): **R0 — WCL contract & approval**: because advertising makes ParseForge a *commercial* user of the Warcraft Logs API, the RPGLogs approval request is Phase 4's first deliverable and the production ad deploy is gated on the written reply; R0-2 (rankings fixtures) and R0-3 (rankings types + pure parse-lens engine + rate-limit budget reader) ship as engine/test code with **no user-facing rankings UI** (R1+ stay outside this phase).

Out of scope: the homepage `/` and guides carry no ads this phase; Auto ads, anchor/overlay/vignette formats; any ranking/character/guild page; CSP promotion to enforcing (Phase 7); alternative monetization (only as a pre-agreed escalation option if RPGLogs declines).

</domain>

<decisions>
## Implementation Decisions

### Slot map & sizes (MONY-02)
- **D-01:** Ads run on **`/analyze/*` and `/tbc-audit` only**. The homepage paste box is the conversion surface and the CWV anchor — it stays ad-free this phase; `/` may be added later on evidence. — **Reversibility:** reversible — adding a route is a new `AdSlot` placement plus a whitelist row.
- **D-02:** **Two units per page, positioned in the read order and never inside or beside a protected element.** Analyze page: one in-content unit **between the report header/tab bar and the tab body** (below the header Share button, above the Raid-tab awards panel / Player-tab scorecard), and one **after the last table**. `/tbc-audit`: one after the first content section, one at the end. No unit inside a table, adjacent to `share-header`, `share-player`, `share-discord`, `awards-panel`, `awards-preview` or `share-awards`, or between a share button and the thing it shares. The placement whitelist is checked against `docs/PROTECTED-ELEMENTS.md` and `npm run protected-elements` must stay green. — **Reversibility:** reversible.
- **D-03:** **Phones get the same in-content units at 300×250 with the box reserved; no anchor, overlay, vignette or sticky formats** — they float over the bottom of the viewport where "Share my parse" and "Copy awards link" live. — **Reversibility:** costly — enabling anchors later means re-deriving the protected-elements bottom-padding contract and re-running the mobile reachability test (D-13 of Phase 3).
- **D-04:** **Fixed-size units with exact reserved boxes per breakpoint** (e.g. 728×90 / 336×280 on ≥ md, 300×250 on phones): the container carries the unit's exact width and height *before* the ad script runs, so CLS from ads is provably 0 and the protected-elements check can assert box dimensions. No responsive/auto-size units. — **Reversibility:** reversible.

### Ad product & load trigger (MONY-02, MONY-01 dependency)
- **D-05:** **Manual `<ins class="adsbygoogle">` units only; Auto ads is switched OFF in the AdSense account** so Google can never inject units at positions we did not reserve. — **Reversibility:** reversible (dashboard toggle), but turning Auto ads on would void D-02/D-04 guarantees.
- **D-06:** The `adsbygoogle` script loads **after hydration plus a first idle tick (`requestIdleCallback`, ~1–2 s), never before the route's LCP element has painted**, and only for visitors admitted by D-07. No `<head>` ad script. — **Reversibility:** reversible.
- **D-07:** **Consent gate is fail-closed and reuses the existing consent primitive**: ads load only on `consent_gate_path ∈ { geo-non-consent-region, tcf-accept }` (from `lib/consent.ts` `deriveConsentGateOutcome` / the server-side `/api/geo` decision). `tcf-reject`, `tcf-timeout` and a still-pending TCF decision **never load the script**; the reserved box collapses/renders empty. This mirrors the PostHog gate exactly, so the OPS-01 live check can prove both with one query. — **Reversibility:** costly — a later "non-personalized ads on pending" mode changes the TCF posture and the privacy text.
- **D-08:** **Kill switch = AdSense-side pause of the ad units (instant, no deploy; boxes render empty) plus a code flag `NEXT_PUBLIC_ADS_ENABLED`** that removes the loader entirely on the next deploy. `NEXT_PUBLIC_*` values bake at build time on this project (CLAUDE.md), so the flag alone is a redeploy-speed lever, not an instant one — the dashboard pause is the instant lever. No Edge Config / per-request runtime flag (would add a request to static/ISR routes). — **Reversibility:** reversible.

### CWV baseline & rollback (MONY-03)
- **D-09:** **Baseline = Vercel Speed Insights RUM p75 LCP/INP/CLS per route (`/`, `/analyze/*`, `/tbc-audit`), phone and desktop, over the 7 days before ad code ships, plus one Lighthouse mobile lab run per route** as the reproducible reference. Recorded as a dated table in `docs/OPS-01-SHIP-GATE.md` (new Part 6) **before** the first ad commit. Vercel Analytics + Speed Insights are already mounted in `app/layout.tsx`. — **Reversibility:** reversible.
- **D-10:** **Rollback trigger (any route, same device class, post-ship vs baseline): CLS p75 > 0.1 OR LCP p75 worsens by > 20 % OR INP p75 > 200 ms.** Written into Part 6 before launch and quoted in the plan. — **Reversibility:** reversible.
- **D-11:** **Observation window 7 days of RUM with a day-2 early read.** Claude runs the comparison and presents any breach with the numbers; the developer decides. **Exception pre-agreed now: a CLS p75 > 0.1 on any route is an automatic AdSense pause (D-08's instant lever) without waiting for a reply.** — **Reversibility:** reversible.

### Approval gating & sequencing (R0, ToS)
- **D-12:** **Everything is built now; only the production deploy that turns ads on waits for RPGLogs' written approval.** Baseline capture, `AdSlot` components, the consent-gated loader, CSP report-only entries for Google ad hosts, PostHog events, `ads.txt`, the `/privacy` update and a **preview deploy** all proceed. The prod ad deploy is a `checkpoint:human-action` that requires the approval text recorded in `.planning/research/rpglogs-approval-request-2026-09-19.md` Thread table. — **Reversibility:** one-way for the deploy itself — once ads are live the site is a commercial API user; reversing means pulling ads, not un-sending the request. Rationale: the ToS clause quoted in `PARSEFORGE-RANKINGS-SPEC.md` §2.1.
- **D-13:** **R0-2 (public-entity rankings fixtures via the extended recorder) and R0-3 (rankings types, pure `parse-lens` engine, `rateLimitData` → Redis budget reader with a 90 % gate) proceed now as non-user-facing code under the free tier; R1+ UI stays un-executed until approval.** R0-1 (dated ToS/API-doc copies saved to `.planning/research/`, email sent, thread recorded) is the phase's first task. — **Reversibility:** reversible.
- **D-14:** **Decline or 14 days of silence → escalate to the developer with options; nothing ships by default.** Options Claude brings at day 14: a nudge email; keep ads off and mark Phase 4 `blocked-external` while monetization is re-planned; or an explicitly recorded risk acceptance. Non-response is never treated as approval. — **Reversibility:** reversible.
- **D-15:** **Human-keyboard prerequisites run as developer-at-keyboard with Claude driving Chrome when connected** (the Search Console pattern): send the approval email from the operator address (`info@lootlistplus.com`, not a work account); AdSense site review / `ads.txt`; paste `https://parseforge.gg/privacy` into AdSense → Privacy & messaging → message site settings (open since Phase 1); the `/privacy` paragraph on WCL-sourced data and ad sharing is a normal code task Claude writes and the developer reviews before ads ship.

### Claude's Discretion
- `AdSlot` component API and file layout (`app/components/AdSlot.tsx`, `lib/ads.ts` for the gate/loader), the loader hook, and how the slot reads the consent outcome (must go through `lib/consent.ts`, not a second listener).
- What an unfilled/collapsed slot looks like (no placeholder text; reserved box may collapse only when D-07 says no ads will ever load for this visitor — never after the script has been invoked, to protect CLS).
- Exact unit sizes per breakpoint within D-04, and the AdSense unit naming.
- PostHog instrumentation: an `ad_slot` event family (requested / filled / empty / blocked-by-adblocker) with `route`, `slot_id`, `consent_gate_path`; keep cardinality low; ships **with** the change (standing OPS-01 invariant).
- CSP report-only additions for Google ad hosts (`pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, plus whatever report-only violations surface) — discovered from violations, not guessed exhaustively; promotion to enforcing stays Phase 7.
- Whether `ref=awards|parse|share` landings get the in-content unit on first view or only after the tab renders (must not delay the promised card content).
- `ads.txt` contents and route; the Part 6 table format; the preview-deploy verification script (protected-elements + a slot-dimension assertion).
- R0-2/R0-3 file layout (`lib/__fixtures__/rankings-*.json`, `lib/rankings/parse-lens.ts`, `lib/rankings/budget.ts`) and whether the recorder extension is shared with Phase 8's F0-1 probe (spec says one script, two consumers).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contract & approval (R0)
- `.planning/research/PARSEFORGE-RANKINGS-SPEC.md` §2.1 (ToS clauses and consequences), §2.2 (rate limits / `rateLimitData`), §7 R0-1…R0-3 (deliverables and verification) — defines what "commercial" means, why approval gates the ad deploy, and the R0 scope.
- `.planning/research/rpglogs-approval-request-2026-09-19.md` — the approval email draft and the Thread table where the sent text and every reply must be recorded verbatim.
- `.planning/ROADMAP.md` `### Phase 4: Ads Live` — success criteria 1–5 and the R0 note.

### Protected surfaces & measurement gate
- `docs/PROTECTED-ELEMENTS.md` — the six `data-protected` elements and the `/og`, share-link and canonical contracts no ad slot may disturb; `scripts/protected-elements.mjs` is the machine check.
- `docs/OPS-01-SHIP-GATE.md` — Parts 1–5 (gate procedure incl. mandatory post-deploy live-traffic check, item 7 thresholds); Phase 4 adds Part 6 (CWV baseline table, rollback trigger, ad-slot live check).
- `.planning/REQUIREMENTS.md` MONY-01 (+ addendum), MONY-02, MONY-03.

### Consent primitive (reuse, do not fork)
- `lib/consent.ts` — `ConsentGatePath`, `deriveConsentGateOutcome`, `getConsentState`, `startConsentListener`.
- `app/components/PostHogProvider.tsx` — the executor of the gate outcome; the ad loader must follow the same decision, not re-derive it.
- `app/api/geo/route.ts`, `lib/geo.ts` — server-side consent-region decision.
- `.planning/phases/01-foundation-themes-consent/01-CONTEXT.md` D-01…D-07 and `.planning/phases/02.1-posthog-consent-gate-hotfix/02.1-CONTEXT.md` D-01…D-07 — locked consent decisions (CMP = Google Privacy & Messaging; EEA/UK-only prompt; reject = no cookies/replay; geo decision server-side).

### CSP / project conventions
- `next.config.ts` — report-only CSP allowlist (add Google ad hosts here; stays report-only).
- `CLAUDE.md` — node PATH, manual Vercel deploys with `--global-config ~/.vercel-personal`, `NEXT_PUBLIC_*` env changes need a new deploy, confirm before prod deploys.
- `.planning/phases/03-share-loop/03-CONTEXT.md` D-13…D-16 — share CTA placement, `share_action`/`share_landing` events and the `ref` funnel that ad slots must not disturb.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/consent.ts` `deriveConsentGateOutcome` / `ConsentGatePath` + the `/api/geo` boolean: the complete "may this visitor be served ads?" signal already exists; the ad loader is a second consumer of the same outcome.
- `app/layout.tsx`: mounts `<Analytics />` and `<SpeedInsights />` (RUM source for D-09) and loads the Google CMP script behind `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` — the ad loader's env-flag pattern (D-08) should mirror this.
- `scripts/protected-elements.mjs` + `docs/PROTECTED-ELEMENTS.md`: extend with slot-dimension / no-overlap assertions rather than adding a second checker.
- `scripts/record-wcl-fixtures.mjs` + `lib/__fixtures__/`: the recorder R0-2 extends; `lib/wcl-types.ts`, `lib/wcl-queries.ts` already fetch `rankings(fightIDs:)` blobs the app currently discards.
- `lib/kv-cache.ts` (Upstash Redis + Map fallback): home for the R0-3 rate-limit budget reader.
- PostHog conventions: snake_case `posthog.capture`, `consent_gate_path` super property on every event (02.1 D-07).

### Established Patterns
- Consent decisions are made once (server geo + TCF) and executed by thin components — do not add a second `__tcfapi` listener for ads.
- Every route header is set in `next.config.ts`; CSP stays report-only and new sources are discovered from violation reports (01 pattern).
- Docs-plus-machine-check pattern (`seo-invariants`, `token-audit`, `theme-parity`, `protected-elements`) — Phase 4 adds a slot check the same way.
- OPS-01 gate: append-only dated evidence, counted live-traffic thresholds, zero events = FAIL; never signed on pre-deploy data.
- Env-gated third-party scripts (`GOOGLE_CMP_PUB_ID`), manual Vercel CLI deploys, preview-first before prod.

### Integration Points
- `app/analyze/[reportCode]/AnalyzeClient.tsx` (`<main className="py-6 space-y-6">`, tab shell): in-content slot goes between the header/tab bar and the tab body; end-of-page slot after the last section.
- `app/tbc-audit/page.tsx` (`max-w-3xl`, five `<section>`s): slot after the first section and at the end.
- `app/layout.tsx`: loader mount point / env flag; `next.config.ts`: CSP hosts.
- `docs/OPS-01-SHIP-GATE.md`: new Part 6; `.planning/WINDOWS.md`: rollback-window entry.

</code_context>

<specifics>
## Specific Ideas

- "Never covered, pushed down, or delayed" is the bar for every protected element — reserve space, load late, no overlays.
- Rollback is a number, not a feeling: CLS p75 > 0.1 / LCP p75 +20 % / INP p75 > 200 ms on any of the three routes, read at day 2 and day 7; CLS breach = automatic pause.
- The approval email is the phase's first deliverable and its Thread table is the only evidence that unblocks the prod ad deploy.

</specifics>

<deferred>
## Deferred Ideas

- Homepage `/` ad slot — revisit after the first 7-day read shows RPM and CWV impact on the two live routes.
- Non-personalized ads for EEA/UK pending/timeout visitors — explicitly rejected for this phase (D-07); revisit only with a privacy-text change.
- Non-ad monetization spike (support tiers, WCL-independent sponsor slot) — only as a D-14 escalation option if RPGLogs declines.
- R1+ rankings UI ("your parse, explained", coaching tiles, boss/character/guild pages) — gated on the approval reply; separate phases per `PARSEFORGE-RANKINGS-SPEC.md` §7.

### Reviewed Todos (not folded)
- `wow-forever-support.md` — keyword-only match (score 0.6); belongs to roadmap Phase 8 (WoW Forever Readiness / F0), not to ads.

</deferred>

---

*Phase: 04-ads-live*
*Context gathered: 2026-09-19*
