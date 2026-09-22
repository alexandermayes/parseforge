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

- [x] **SHARE-01**: User can generate a roast/award-style shareable card per fight (auto-generated awards, Discord-shareable image built on existing OG infra)
- [x] **SHARE-02**: User can share a per-player permalink with a player-specific OG image ("look at MY parse")
- [x] **SHARE-03**: Share actions are prominent in the analyze UI and protected from ad/redesign crowding (share CTA + OG unfurl on the protected-elements checklist)
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

- [x] **ACC-01**: Game-data accuracy re-audit via the wago.tools regeneration workflow (no hand-typed ID maps)
- [x] **ACC-02**: Test coverage added for the untested engines (`cla-engine`, `raid-overview-engine`, `wcl-client`)
- [x] **ACC-03**: User can view a per-fight cast timeline (closes table-stakes gap vs competitors)
- [x] **ACC-04**: Healer-specific analysis improved (healer metrics beyond raw HPS)

### Community & Cross-Promotion

- [ ] **COMM-01**: Dedicated ParseForge Discord exists — minimal channels, seeded activity for 1–2 weeks, then promoted site-wide (widget/link); feedback no longer lands in owner's personal Discord
- [ ] **COMM-02**: Two-way cross-promotion live between ParseForge and LootList+ (nav/footer links with UTM attribution on both sites) — LootList+ repo is locally available at `/Users/alexander.mayes/Code/loot-list-plus` (live sister product: Next.js + Supabase, deployed on Railway, has its own `discord-bot/`), so both sides can be implemented directly

### Operations (standing invariants)

- [x] **OPS-01**: Every user-facing change ships WITH PostHog instrumentation and GSC verification (sitemap/indexing/metadata) — enforced as a phase-gate, not a follow-up task. *Phase 1 gate closed 2026-09-06 (`docs/OPS-01-SHIP-GATE.md`, dated sign-off); standing gate — re-run for every later phase. Correction (2026-09-14): the Phase 1 and Phase 2 PostHog halves of that gate were not actually met at their respective sign-offs — see the dated addenda in `01-VERIFICATION.md` and `02-VERIFICATION.md` — and were met for real by Phase 2.1, which also hardened this gate to require a mandatory post-deploy live-traffic check.*
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
| SHARE-01 | Phase 3 | Complete |
| SHARE-02 | Phase 3 | Complete |
| SHARE-03 | Phase 3 | Complete |
| SHARE-04 | Phase 5 | Pending |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 7 | Pending |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 7 | Pending |
| MONY-01 | Phase 1 | Complete |
| MONY-02 | Phase 4 | Pending |
| MONY-03 | Phase 4 | Pending |
| ACC-01 | Phase 2 | Complete |
| ACC-02 | Phase 2 | Complete |
| ACC-03 | Phase 2 | Complete |
| ACC-04 | Phase 2 | Complete |
| COMM-01 | Phase 5 | Pending |
| COMM-02 | Phase 5 | Pending |
| OPS-01 | Phase 1 | Phase 1 gate closed 2026-09-06 — docs/OPS-01-SHIP-GATE.md (standing gate, re-run every phase); PostHog half not actually met until Phase 2.1 (addenda dated 2026-09-14 in 01-VERIFICATION.md / 02-VERIFICATION.md) |
| OPS-02 | Phase 7 | Pending |

**Coverage:**

- v1 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0

---
*Requirements defined: 2026-09-04*
*Last updated: 2026-09-04 after roadmap creation (7 phases, 100% coverage)*

### OPS-01 Addendum (2026-09-14, Phase 2.1 Plan 04)

The OPS-01 traceability row above records Phase 2.1 as having "met [the PostHog criterion] for
real" — that claim is premature. Phase 2.1's own post-deploy live-traffic gate
(`docs/OPS-01-SHIP-GATE.md` Part 4) ran its production deploy and live-traffic check on
2026-09-14, and two of its three item-7 thresholds passed with counted events (≥ 20 `$pageview`:
25 counted; ≥ 2 distinct non-consent-region countries: 3 counted). The third threshold — PostHog
`$pageview` at least 50% of Vercel Web Analytics page views for the same window — is recorded as
**PENDING**, not evaluated and not failed, because the Vercel Web Analytics figure for that window
could not be read from the session that ran the check (see Part 4 for the full reason and the
exact figure still needed).

**OPS-01's PostHog criterion is therefore not-yet-met for Phase 2.1.** It remains not-yet-met
until the pending Vercel Web Analytics figure is read, the ratio is evaluated, and — only if it
passes — `docs/OPS-01-SHIP-GATE.md` Part 4 is signed with a date, at which point this addendum
should be superseded by a line recording the real date the criterion was met (D-09).

### OPS-01 Addendum 2 (2026-09-15, Phase 2.1 gap closure 02.1-05)

This addendum supersedes `### OPS-01 Addendum (2026-09-14, Phase 2.1 Plan 04)` above it, which
stays in place unedited.

The Vercel Web Analytics page-view figure for the window `2026-09-14T22:16:59Z`–
`2026-09-14T23:16:59Z` that the 2026-09-14 addendum recorded as PENDING has now been read: **23**
page views (recorded as an upper bound — the range's end time was illegible in the screenshot the
developer supplied; see `docs/OPS-01-SHIP-GATE.md` Part 4 for the full provenance). Scored against
that figure, all three of item 7's thresholds read PASS:

- ≥ 20 `$pageview` events: 25 counted — PASS
- ≥ 2 distinct non-consent-region countries: 3 counted — PASS
- PostHog `$pageview` count ≥ 50% of the Vercel figure: 25 / 23 ≈ 108.7% — PASS

**OPS-01's PostHog criterion was met for Phase 2.1 on 2026-09-15**, against production deployment
`dpl_HY5319wSDVw3M4ibBU42JrSTgw4e` (created 2026-09-14T22:16:59Z). `docs/OPS-01-SHIP-GATE.md`
Part 4 is signed accordingly: `### Phase 2.1 Sign-off — SIGNED (2026-09-15, gap-closure 02.1-05)`.

### MONY-01 Addendum (2026-09-15, Phase 2.1 gap closure 02.1-08)

The MONY-01 row above records "Complete" from Phase 1. That row covers the consent-management
layer's existence and its non-EEA/UK behaviour, which Phase 2.1 has now proven live in production.
It does **not** cover a real-browser observation of the EEA/UK/CH TCF path itself — that live proof
**remains outstanding**.

**Reason.** No EEA/UK/CH consent-region browser session was performed this plan. The developer
declined the manual ask, saying verbatim: "Stop asking for me to do things. Do it for me please."
The orchestrator could not perform it either — no EEA/UK/CH egress IP exists in this environment,
the Claude-in-Chrome extension was not connected this session, and no VPN is available to the
automation.

**What is proven and what is not.** `deriveConsentGateOutcome`'s consent-region branch
(`lib/consent.ts`) is exhaustively unit-tested (21 tests) and confirmed by code review to reproduce
the pre-hotfix SDK-call mapping byte for byte. That is evidence about the logic. No browser has ever
executed `PostHogProvider.tsx`'s TCF wiring against that logic — the preview never rendered the
Google CMP (`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` is Production-only) and zero EEA/UK/CH visitors arrived
in any measured production window this phase. That gap is evidence about the wiring, and it is not
closed by the unit tests or the code review. See `docs/OPS-01-SHIP-GATE.md` Part 4,
`### EEA/UK TCF observation (gap closure 02.1-08, 2026-09-15)`, for the full record, including the
WR-03 dedupe's not-exercised status (commit `9da21c4` is live in production and ready to test, but
untested by a browser).

**The test that would close this.** A developer-run session, from a real EEA/UK/Swiss VPN egress and
a fresh private browser window opened after the VPN connects, covering explicit reject, full opt-in,
and a CMP re-confirmation (testing the WR-03 dedupe) — exact steps in the gate document section
above.

**MONY-01's live proof therefore stays outstanding.** ROADMAP SC2 and `02.1-VERIFICATION.md`
Truth 4 stay behaviour-unverified for the same reason. This addendum does not change the MONY-01
traceability row above; it appends the live-proof status the row itself does not carry.

### OPS-01 Addendum 3 (2026-09-16, Phase 3 gate 03-07)

This addendum records the standing gate's next phase re-run (Phase 3, `03-share-loop`) — it does
not touch Addendum 2's Phase 2.1 sign-off, which stays in place unedited.

Phase 3 ran its own re-run of the standing OPS-01 gate against production deployment
`dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx` (`docs/OPS-01-SHIP-GATE.md` Part 5). Per the developer's own
**2026-09-16T16:47Z "Record now, leave open"** decision, Part 5 ends with `### Part 5 status update
(2026-09-16, 03-07 final continuation) — Sign-off: LEFT OPEN — not signed` rather than a dated
sign-off. The item-7 live-traffic check scored threshold 1 FAIL (7 pageviews, need 20), threshold 2
PASS (2 non-consent-region countries: UA, US), threshold 3 NOT EVALUABLE (the personal Vercel CLI
token exposes no Web Analytics endpoint); the D-14 share-rate figure read 0.0% as a first reading
(0 `share_action` sessions / 19 `analysis_complete` sessions, against a ~2.8% baseline); Search
Console and the three developer-only backstops (D-04 tone, real Discord unfurl, D-13 mobile) remain
NOT PERFORMED. Nine outstanding items and their exact closing tests are recorded in
`docs/OPS-01-SHIP-GATE.md`'s final `### Part 5 status update` table.

**OPS-01's Phase 3 re-run is therefore not met.** The traceability row above still reflects Phase
1's own original closure plus the Phase 2.1 correction (Addenda 1–2); this addendum records, per the
same pattern, that the Phase 3 re-run specifically remains open. It stays open until a future
session re-measures item 7 on a busier UTC hour, re-runs the share-rate HogQL on or after
2026-09-23T09:15Z, and completes the Search Console pass and the three developer backstops, closing
with a dated sign-off in `docs/OPS-01-SHIP-GATE.md` Part 5.

### SHARE-01 / SHARE-02 / SHARE-03 Addendum (2026-09-16, Phase 3 gate 03-07)

The SHARE-01, SHARE-02 and SHARE-03 rows above already read "Complete" — that marking was applied
by 03-06's `update_requirements` step (commit `adaea2f`), before 03-07 (a sibling plan in the same
phase directory that also declares all three IDs) had produced a `03-07-SUMMARY.md`. This plan's
own frontmatter states the intended rule explicitly: *"docs/OPS-01-SHIP-GATE.md Part 5 is the
single record of this phase's gate; its sign-off is what marks SHARE-01, SHARE-02 and SHARE-03 and
the OPS-01 re-run as met."* Part 5 was left explicitly unsigned at 03-07's close (OPS-01 Addendum 3
above), so by the plan's own stated rule these three requirements are not yet fully met, even
though the checkboxes above already read complete.

**What is proven.** All three requirements' underlying code capability is live in production and
directly confirmed this session: the awards OG card, the per-player OG card and the bare report OG
card all return `200 image/png` from `https://parseforge.gg`; the production analyze canonical
carries no query string; and `npm run protected-elements` exits 0 with all ten rows PASS against
production (`docs/OPS-01-SHIP-GATE.md`, `### Post-deploy production route-contract evidence`).

**What is not yet proven.** The plan's own `must_haves.truths` backstop — *"Live PostHog shows at
least one `share_action` and at least one `share_landing` from real traffic, each carrying a
`consent_gate_path` value"* — is unobserved: zero `share_action` and zero `share_landing` events
exist in either the item-7 60-minute window or the D-14 7-day window counted this session. The
three developer-only checks (D-04 tone, real Discord unfurl, D-13 mobile reachability) also remain
NOT PERFORMED.

**These checkboxes are left as-is** (not reverted) because the underlying capability genuinely works
in production, and reverting a checked box without new evidence of a regression would misrepresent
what changed. This addendum instead makes the ledger honest: SHARE-01/02/03 should be read as
*capability confirmed live in production; the phase's own live-traffic and human-review backstops
remain open* — not as fully verified per the plan's own sign-off rule. Closes when a future session
observes at least one real `share_action`/`share_landing` event with `consent_gate_path` present and
the three developer backstops are performed, at which point `docs/OPS-01-SHIP-GATE.md` Part 5 can be
signed and this addendum superseded.

### OPS-01 Addendum 4 (2026-09-19, Phase 3 gap closure 03-10)

This addendum supersedes `### OPS-01 Addendum 3 (2026-09-16, Phase 3 gate 03-07)` above it, which
stays in place unedited; it does not touch Addendum 2's Phase 2.1 sign-off.

Plan 03-10 closed the eight-of-nine-counted state that Addendum 3 recorded as left open, per
`docs/OPS-01-SHIP-GATE.md`'s new `### Part 5 close-out (2026-09-19, gap closure 03-10)` subsection:

- Item 7's live-traffic thresholds were re-measured on a fully elapsed 60-minute window
  (`2026-09-17T06:00:00Z`–`07:00:00Z`, deployment `dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`): threshold 1
  PASS (87 `$pageview` events), threshold 2 PASS (3 distinct non-consent-region countries: US, KZ,
  UA), threshold 3 PASS (PostHog 87 vs. Vercel 27 for the same hourly bucket, 322% ≥ 50%).
- The D-14 share-rate figure remains a standing first reading — 0 `share_action` sessions / 19
  `analysis_complete` sessions = 0.0%, below the ~2.8% baseline, from ~7.5h of live exposure —
  accepted, not improved, under the developer's `sign-now-conditional` decision (quoted verbatim in
  the gate document); the re-run stays date-gated to on/after 2026-09-23T09:15Z and was not
  performed in this plan.
- Search Console showed no regression on either route: `/` improved from "Crawled – currently not
  indexed" to "Page is indexed" (last crawl 2026-09-17), with a recrawl requested at
  2026-09-18T21:47Z; the analyze route remained indexed and unchanged (last crawl 2026-09-15); none
  of the `?view=awards`, `?ref=awards` or `?ref=parse` permutations appears separately indexed.
- The three developer-only backstops read: D-04 tone review PASS on a delegated verdict (not the
  developer's own words); the real Discord unfurl NOT OBTAINED (2026-09-18), with Discordbot-UA
  proxy evidence recorded; D-13 mobile reachability PASS from a resized 384px-viewport observation.

**OPS-01's Phase 3 re-run is met on 2026-09-19** against production deployment
`dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`, with `docs/OPS-01-SHIP-GATE.md` Part 5 signed accordingly:
`### Phase 3 Sign-off — SIGNED (2026-09-19, gap closure 03-10)`. That signature is explicitly
conditional: the D-14 re-read, once run on or after 2026-09-23T09:15Z, must append a dated
confirmation or correction to Part 5, and `.planning/WINDOWS.md #11` stays open until it does.
`.planning/WINDOWS.md #9` also stays open — the D-04 verdict is delegated rather than first-hand,
and the real Discord unfurl was not obtained.

### SHARE-01 / SHARE-02 / SHARE-03 Addendum 2 (2026-09-19, Phase 3 gap closure 03-10)

This addendum supersedes `### SHARE-01 / SHARE-02 / SHARE-03 Addendum (2026-09-16, Phase 3 gate
03-07)` above it, which stays in place unedited.

Of the backstops that addendum listed as open, the following are now closed with counted evidence:

- **The live-PostHog backstop** — two real `share_landing` events were captured in the re-measured
  `2026-09-17T06:00Z`–`07:00Z` window, both carrying `consent_gate_path = geo-non-consent-region`
  (RESEARCH A3; `docs/OPS-01-SHIP-GATE.md` `### Item 7 — re-measured counted result (2026-09-18, gap
  closure 03-09)`).
- **D-13 phone-width reachability** — a resized-browser observation at a 384px CSS-pixel viewport
  found both the "Copy awards link" and "Share my parse" buttons reachable without scrolling past
  the analysis tables (`### Developer review backstops — counted result (2026-09-18, gap closure
  03-08)`).

The following remain open:

- **The real Discord unfurl of both production share links** (SHARE-01's awards-link case and
  SHARE-02's player-link case) — NOT OBTAINED (2026-09-18); no real Discord channel was available.
  Closing test: paste
  `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards&v=<fresh>` and
  `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse&v=<fresh>` into a
  real Discord channel and confirm each unfurls with rows/receipts legible and the longest names
  clipped with an ellipsis rather than overflowing.
- **A first-hand (non-delegated) D-04 tone verdict** — the developer delegated the verdict three
  times ("Just do whatever you think is best.") rather than stating one in their own words. Closing
  test: the developer states, in their own words, that the award pool clears the D-01 bar or names
  the failing row.

With `docs/OPS-01-SHIP-GATE.md` Part 5 now signed (`### Phase 3 Sign-off — SIGNED (2026-09-19, gap
closure 03-10)`), SHARE-01, SHARE-02 and SHARE-03's underlying capability and their live-traffic
backstop now rest on their own counted evidence rather than a sibling plan's premature marking. The
Discord-unfurl and first-hand-D-04 backstops above remain open and are tracked in
`.planning/WINDOWS.md #9`; nothing here reverts or edits the checkbox lines above.

### MONY-02 / MONY-03 Addendum (2026-09-22, Phase 4 gate 04-07)

The MONY-02 and MONY-03 rows above still read "Pending" — this addendum does **not** flip either
checkbox to complete. The production deploy alone does not prove either requirement in full, per
this plan's own explicit prohibition: "Do not mark either requirement complete on the strength of
the deploy alone."

**What is closed by counted evidence (MONY-02's ad-serving-and-placement half).** The production
deploy (`dpl_HRmX5EMk5aKgXtDp4z9FYW6jXNih`, commit `cc931c0`, 2026-09-22T09:23:24Z) proves, with
captured evidence in `docs/OPS-01-SHIP-GATE.md` Part 6: all four reserved AdSlot components render
on the two whitelisted routes (`/tbc-audit`: `tbc-audit-mid`, `tbc-audit-end`; the analyze page:
`analyze-mid`, `analyze-end`), gated correctly behind the consent-gate loader (a real production ad
request fires only for an admitted, non-consent-region visitor — confirmed this session via a fresh
CDP capture on real production traffic, both routes, 12 ad-host requests each including real
slot-scoped `doubleclick.net` ad calls); `npm run protected-elements` passes 25/25 against
production; `/ads.txt` returns a `DIRECT` line; every canonical stays param-free; and
`npm run seo-invariants` shows no unexplained diff on either ad route or `/privacy`. **This half is
met by counted evidence** — ads render in the correct reserved space, on the correct routes, gated
correctly, without disturbing SEO surface.

**What remains open (MONY-03's monitoring half, and MONY-02's own revenue-adjacent edge).** The CWV
baseline itself is captured (D-09, Part 6, pre-ad) and rollback criteria are defined (D-10) — that
half of MONY-03 was already met before this deploy. What stays open: the day-2 CWV re-read (due on
or after 2026-09-24T09:23:24Z), the day-7 CWV re-read (due on or after 2026-09-29T09:23:24Z), both
scored against the D-09 baseline and D-10 triggers; the OPS-01 item 7 live-traffic PostHog
thresholds (this session had no PostHog query channel — see `docs/OPS-01-SHIP-GATE.md`
`### Item 7 — attempted counted result, PostHog access limitation (Phase 4, 2026-09-22)`); Search
Console rows for the two ad routes (no GSC access this session); and AdSense reporting real revenue
(not measurable — the AdSense account's own dashboard read "Getting ready" / `ads.txt` "Not found"
as of 2026-09-22, i.e. Google has not yet approved the account to serve real creative on this
domain, a separate fact from this session's own network capture showing genuine ad requests firing
but not yet fillable).

**R0-1's status, recorded here for completeness — not a REQUIREMENTS.md-tracked row.** The R0-x
requirement family is not present in this file's traceability table at all (a pre-existing gap
`04-04-SUMMARY.md` already recorded). RPGLogs' written commercial-use approval was never obtained;
the developer issued an explicit, consequence-informed operator override instead
(`docs/OPS-01-SHIP-GATE.md` `### Deploy decision (Phase 4, 2026-09-22)`). R0-1's own gating purpose
— a recorded yes before shipping — was not satisfied; it was consciously bypassed by the account
owner, a materially different outcome from "met," and is not claimed as one here.

**Closing tests, restated.** MONY-03 (and this addendum) close only when the day-2 and day-7 CWV
reads are appended to `docs/OPS-01-SHIP-GATE.md` Part 6 with a dated PASS against every D-10
trigger, the OPS-01 item 7 PostHog thresholds are counted in a session with real PostHog access, and
Search Console rows are recorded for the two ad routes. MONY-02's remaining open edge (AdSense
actually serving and reporting revenue) closes once the AdSense dashboard shows an approved status
and revenue accrues.
