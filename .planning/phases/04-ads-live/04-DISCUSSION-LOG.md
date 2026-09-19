# Phase 4: Ads Live - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-19
**Phase:** 04-ads-live
**Areas discussed:** Slot map & sizes, Ad products & load trigger, CWV baseline & rollback, Approval gating & sequencing

Format note: each area's questions were presented as one batched AskUserQuestion (max 4 questions) rather than four single-question turns; the more-or-next check ran after areas 1–2 together. All selections were the recommended option.

---

## Slot map & sizes

| Option | Description | Selected |
|--------|-------------|----------|
| /analyze/* + /tbc-audit only | Dwell-time routes; homepage stays ad-free as conversion surface / CWV anchor | ✓ |
| All three: /, /analyze/*, /tbc-audit | Max inventory; only a below-hero or footer unit fits on / | |
| /analyze/* only | Smallest blast radius, lowest revenue | |

| Option | Description | Selected |
|--------|-------------|----------|
| 1 in-content + 1 end-of-page | Analyze: between tab bar and tab body + after last table; tbc-audit: after first section + end | ✓ |
| Sidebar rail on ≥1280px + end-of-page | Sticky 300×600 in the wide-screen gutter | |
| End-of-page only | One unit per route after content | |

| Option | Description | Selected |
|--------|-------------|----------|
| Same in-content units, 300×250 reserved, no anchors | Reserved boxes; anchors excluded because they float over share buttons | ✓ |
| No ads on phones this phase | Desktop-only inventory | |
| Allow Google anchor ads on mobile | Highest mobile RPM, overlays content | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed sizes with exact reserved boxes | Provable CLS 0; dimensions assertable | ✓ |
| Responsive units with min-height | Better fill, height can differ from reservation | |

**User's choice:** all four recommended options.
**Notes:** none.

---

## Ad products & load trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Manual fixed units only; Auto ads OFF | Explicit `<ins>` per slot; Auto ads disabled in dashboard | ✓ |
| Manual units + Auto ads on | Google picks extra positions at runtime | |

| Option | Description | Selected |
|--------|-------------|----------|
| After hydration + first idle, never before LCP | requestIdleCallback tick (~1–2 s) | ✓ |
| Immediately in `<head>` (Google default) | Earliest impressions, contends with LCP | |
| Only after the first analysis renders on /analyze | Fewest impressions | |

| Option | Description | Selected |
|--------|-------------|----------|
| No ads at all (fail-closed) | Only geo-non-consent-region and tcf-accept load the script | ✓ |
| Non-personalized ads on pending/timeout | Limited-ads mode; TCF grey area | |

| Option | Description | Selected |
|--------|-------------|----------|
| AdSense-side pause + code flag | Dashboard pause instant; NEXT_PUBLIC_ADS_ENABLED + redeploy removes loader | ✓ |
| Env flag + redeploy only | Single mechanism, ~2 min manual deploy | |
| Runtime flag (Edge Config) per request | Adds a request to static/ISR routes | |

**User's choice:** all four recommended options.
**Notes:** NEXT_PUBLIC_* values bake at build time on this project (CLAUDE.md), stated in the question.

---

## CWV baseline & rollback

| Option | Description | Selected |
|--------|-------------|----------|
| Speed Insights RUM p75 per route + one lab Lighthouse run | 7-day pre-ship RUM table in OPS-01 Part 6 + Lighthouse mobile reference | ✓ |
| Lab Lighthouse only | Reproducible but not real-user | |
| RUM only | Real but noisy at current traffic | |

| Option | Description | Selected |
|--------|-------------|----------|
| CLS p75 > 0.1 OR LCP p75 worsens > 20% OR INP p75 > 200ms | Absolute CLS/INP + relative LCP guard, any route | ✓ |
| Any metric leaves Google's 'good' band | Absolute-only thresholds | |
| Analyze-completion rate drops > 10% in PostHog | Behavioural trigger | |

| Option | Description | Selected |
|--------|-------------|----------|
| 7 days RUM; Claude flags, you decide; automatic if CLS breach | Day-2 early read + day-7 comparison; CLS breach = automatic AdSense pause | ✓ |
| 14 days RUM; you decide every case | No automatic action | |
| Rolling: check weekly for 4 weeks | Longer observation | |

**User's choice:** all three recommended options.
**Notes:** none.

---

## Approval gating & sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Build everything; only the PROD ad deploy waits | Baseline, components, loader, CSP, events, preview all proceed | ✓ |
| Hold all ad code until the reply | Only R0 + baseline proceed | |
| Ship ads regardless of the reply | Not recommended — ToS breach risk | |

| Option | Description | Selected |
|--------|-------------|----------|
| R0-2/R0-3 proceed now; R1+ UI waits for approval | Fixtures + engine code are non-commercial dev | ✓ |
| Everything rankings-related waits for the reply | Only R0-1 in Phase 4 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Escalate to you with options at day 14; no ads until decided | Nudge / blocked-external / recorded risk acceptance | ✓ |
| Silence after 14 days = proceed to prod with ads | Treats non-response as approval | |
| Decline = pivot Phase 4 to a non-ad monetization spike | Pre-committed pivot | |

| Option | Description | Selected |
|--------|-------------|----------|
| You at the keyboard, me driving Chrome when connected | Search Console pattern | ✓ |
| You do the account steps alone; I only prepare text | | |

**User's choice:** all four recommended options.
**Notes:** approval email must be sent from the operator address (info@lootlistplus.com), not a work account; Chrome MCP was not connected in this session.

---

## Todo cross-reference

`wow-forever-support.md` matched on keywords only (score 0.6). User chose **Don't fold — stays Phase 8**.

## Claude's Discretion

AdSlot component API and file layout; unfilled-slot appearance (collapse only when no ads will ever load for the visitor); exact unit sizes per breakpoint; `ad_slot` PostHog event family; CSP report-only host additions; share-landing first-view treatment; `ads.txt`; Part 6 table format; preview verification script; R0-2/R0-3 file layout and recorder sharing with Phase 8 F0-1.

## Deferred Ideas

Homepage ad slot; non-personalized ads for EEA pending/timeout; non-ad monetization spike (only as D-14 escalation); R1+ rankings UI (gated on approval).
