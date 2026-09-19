# Phase 4: Ads Live - Research

**Researched:** 2026-09-19
**Domain:** Google AdSense integration on a Next.js 16 App Router site (CLS-safe, consent-gated) + a
gated Warcraft Logs API commercial-use approval workflow + non-UI rankings engine prep (R0)
**Confidence:** MEDIUM — HIGH on everything read directly from this repo or confirmed live against
this project's own Vercel account this session; LOW-MEDIUM on AdSense/Next.js integration patterns
(no official Next.js-blessed AdSense guide exists — every source is a third-party writeup); LOW on
the WCL API Terms of Service wording (the canonical page still returns HTTP 403 to automated
readers, re-confirmed this session — a human must read it in a browser, exactly as
`PARSEFORGE-RANKINGS-SPEC.md` already flagged).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Slot map & sizes (MONY-02)**
- **D-01:** Ads run on `/analyze/*` and `/tbc-audit` only. The homepage paste box is the conversion
  surface and the CWV anchor — it stays ad-free this phase; `/` may be added later on evidence.
  Reversibility: reversible.
- **D-02:** Two units per page, positioned in the read order and never inside or beside a protected
  element. Analyze page: one in-content unit between the report header/tab bar and the tab body
  (below the header Share button, above the Raid-tab awards panel / Player-tab scorecard), and one
  after the last table. `/tbc-audit`: one after the first content section, one at the end. No unit
  inside a table, adjacent to `share-header`, `share-player`, `share-discord`, `awards-panel`,
  `awards-preview` or `share-awards`, or between a share button and the thing it shares. The
  placement whitelist is checked against `docs/PROTECTED-ELEMENTS.md` and `npm run protected-elements`
  must stay green. Reversibility: reversible.
- **D-03:** Phones get the same in-content units at 300×250 with the box reserved; no anchor,
  overlay, vignette or sticky formats — they float over the bottom of the viewport where "Share my
  parse" and "Copy awards link" live. Reversibility: costly.
- **D-04:** Fixed-size units with exact reserved boxes per breakpoint (e.g. 728×90 / 336×280 on
  ≥ md, 300×250 on phones): the container carries the unit's exact width and height *before* the ad
  script runs, so CLS from ads is provably 0 and the protected-elements check can assert box
  dimensions. No responsive/auto-size units. Reversibility: reversible.

**Ad product & load trigger (MONY-02, MONY-01 dependency)**
- **D-05:** Manual `<ins class="adsbygoogle">` units only; Auto ads is switched OFF in the AdSense
  account so Google can never inject units at positions not reserved. Reversibility: reversible
  (dashboard toggle), but turning Auto ads on would void D-02/D-04 guarantees.
- **D-06:** The `adsbygoogle` script loads after hydration plus a first idle tick
  (`requestIdleCallback`, ~1–2 s), never before the route's LCP element has painted, and only for
  visitors admitted by D-07. No `<head>` ad script. Reversibility: reversible.
- **D-07:** Consent gate is fail-closed and reuses the existing consent primitive: ads load only on
  `consent_gate_path ∈ { geo-non-consent-region, tcf-accept }` (from `lib/consent.ts`
  `deriveConsentGateOutcome` / the server-side `/api/geo` decision). `tcf-reject`, `tcf-timeout` and a
  still-pending TCF decision never load the script; the reserved box collapses/renders empty. This
  mirrors the PostHog gate exactly, so the OPS-01 live check can prove both with one query.
  Reversibility: costly.
- **D-08:** Kill switch = AdSense-side pause of the ad units (instant, no deploy; boxes render
  empty) plus a code flag `NEXT_PUBLIC_ADS_ENABLED` that removes the loader entirely on the next
  deploy. `NEXT_PUBLIC_*` values bake at build time on this project (CLAUDE.md), so the flag alone
  is a redeploy-speed lever, not an instant one — the dashboard pause is the instant lever. No Edge
  Config / per-request runtime flag. Reversibility: reversible.

**CWV baseline & rollback (MONY-03)**
- **D-09:** Baseline = Vercel Speed Insights RUM p75 LCP/INP/CLS per route (`/`, `/analyze/*`,
  `/tbc-audit`), phone and desktop, over the 7 days before ad code ships, plus one Lighthouse mobile
  lab run per route as the reproducible reference. Recorded as a dated table in
  `docs/OPS-01-SHIP-GATE.md` (new Part 6) before the first ad commit. Vercel Analytics + Speed
  Insights are already mounted in `app/layout.tsx`. Reversibility: reversible.
- **D-10:** Rollback trigger (any route, same device class, post-ship vs baseline): CLS p75 > 0.1 OR
  LCP p75 worsens by > 20% OR INP p75 > 200 ms. Written into Part 6 before launch and quoted in the
  plan. Reversibility: reversible.
- **D-11:** Observation window 7 days of RUM with a day-2 early read. Claude runs the comparison and
  presents any breach with the numbers; the developer decides. Exception pre-agreed now: a CLS p75 >
  0.1 on any route is an automatic AdSense pause (D-08's instant lever) without waiting for a reply.
  Reversibility: reversible.

**Approval gating & sequencing (R0, ToS)**
- **D-12:** Everything is built now; only the production deploy that turns ads on waits for
  RPGLogs' written approval. Baseline capture, `AdSlot` components, the consent-gated loader, CSP
  report-only entries for Google ad hosts, PostHog events, `ads.txt`, the `/privacy` update and a
  preview deploy all proceed. The prod ad deploy is a `checkpoint:human-action` that requires the
  approval text recorded in `.planning/research/rpglogs-approval-request-2026-09-19.md` Thread
  table. Reversibility: one-way for the deploy itself.
- **D-13:** R0-2 (public-entity rankings fixtures via the extended recorder) and R0-3 (rankings
  types, pure `parse-lens` engine, `rateLimitData` → Redis budget reader with a 90% gate) proceed
  now as non-user-facing code under the free tier; R1+ UI stays un-executed until approval. R0-1
  (dated ToS/API-doc copies saved to `.planning/research/`, email sent, thread recorded) is the
  phase's first task. Reversibility: reversible.
- **D-14:** Decline or 14 days of silence → escalate to the developer with options; nothing ships by
  default. Options Claude brings at day 14: a nudge email; keep ads off and mark Phase 4
  `blocked-external`; or an explicitly recorded risk acceptance. Non-response is never treated as
  approval. Reversibility: reversible.
- **D-15:** Human-keyboard prerequisites run as developer-at-keyboard with Claude driving Chrome
  when connected: send the approval email from the operator address (`info@lootlistplus.com`, not a
  work account); AdSense site review / `ads.txt`; paste `https://parseforge.gg/privacy` into
  AdSense → Privacy & messaging → message site settings; the `/privacy` paragraph on WCL-sourced
  data and ad sharing is a normal code task Claude writes and the developer reviews before ads ship.

### Claude's Discretion
- `AdSlot` component API and file layout (`app/components/AdSlot.tsx`, `lib/ads.ts` for the
  gate/loader), the loader hook, and how the slot reads the consent outcome (must go through
  `lib/consent.ts`, not a second listener).
- What an unfilled/collapsed slot looks like (no placeholder text; reserved box may collapse only
  when D-07 says no ads will ever load for this visitor — never after the script has been invoked,
  to protect CLS).
- Exact unit sizes per breakpoint within D-04, and the AdSense unit naming.
- PostHog instrumentation: an `ad_slot` event family (requested / filled / empty /
  blocked-by-adblocker) with `route`, `slot_id`, `consent_gate_path`; keep cardinality low; ships
  with the change (standing OPS-01 invariant).
- CSP report-only additions for Google ad hosts (`pagead2.googlesyndication.com`,
  `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, plus whatever report-only violations
  surface) — discovered from violations, not guessed exhaustively; promotion to enforcing stays
  Phase 7.
- Whether `ref=awards|parse|share` landings get the in-content unit on first view or only after the
  tab renders (must not delay the promised card content).
- `ads.txt` contents and route; the Part 6 table format; the preview-deploy verification script
  (protected-elements + a slot-dimension assertion).
- R0-2/R0-3 file layout (`lib/__fixtures__/rankings-*.json`, `lib/rankings/parse-lens.ts`,
  `lib/rankings/budget.ts`) and whether the recorder extension is shared with Phase 8's F0-1 probe.

### Deferred Ideas (OUT OF SCOPE)
- Homepage `/` ad slot — revisit after the first 7-day read shows RPM and CWV impact on the two
  live routes.
- Non-personalized ads for EEA/UK pending/timeout visitors — explicitly rejected for this phase
  (D-07); revisit only with a privacy-text change.
- Non-ad monetization spike (support tiers, WCL-independent sponsor slot) — only as a D-14
  escalation option if RPGLogs declines.
- R1+ rankings UI ("your parse, explained", coaching tiles, boss/character/guild pages) — gated on
  the approval reply; separate phases per `PARSEFORGE-RANKINGS-SPEC.md` §7.
- `wow-forever-support.md` todo — belongs to roadmap Phase 8, not to ads.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MONY-02 | AdSense ads live via reserved-space AdSlot components + consent-gated script loader + per-route placement whitelist; ads never block or crowd the core paste-and-analyze flow or analysis tables | Architecture Patterns (AdSlot + loader), Common Pitfalls (CLS, Auto ads override, consent race), Code Examples |
| MONY-03 | CWV baseline (LCP/INP/CLS on `/`, `/analyze/*`, `/tbc-audit`) captured before ad code ships; post-ship monitoring with defined rollback criteria | Environment Availability (`vercel metrics` CLI, verified live against this project), Code Examples (exact commands), Validation Architecture |
| R0 (no new ID — folded scope, `PARSEFORGE-RANKINGS-SPEC.md` §7) | ToS/approval email (R0-1), rankings fixtures (R0-2), rankings types + pure parse-lens engine + budget reader (R0-3), all non-UI | Runtime State Inventory-style gap findings below (WCLRanking type mismatch, no demo guild), Common Pitfalls (403 pages, budget gate), Code Examples (parse-lens skeleton) |
</phase_requirements>

## Summary

This phase has two independent tracks that share a single ship gate. Track A (MONY-02/03) is a
conventional but exacting CLS-safe AdSense integration: reserved fixed-size boxes, Auto ads
disabled, a script loaded after hydration + one idle tick, and — the part that makes it
ParseForge-specific — the ad loader must be a *second consumer* of the exact same consent decision
`lib/consent.ts`/`app/api/geo` already computes for PostHog, not a new listener. Nothing here is
exotic; there is no first-party Next.js AdSense guide (every source is a third-party writeup
converging on the same `next/script strategy="afterInteractive"` shape), so the plan should hand-roll
a small `AdSlot`/`lib/ads.ts` pair rather than add a dependency — the project's own "reuse before
adding" convention plus the fact that no community package understands this project's specific
consent-gate/idle-callback/fixed-box requirements makes a package a worse fit than ~60 lines of
project code.

Track B (R0) is a compliance gate, not a coding problem: the RPGLogs API Terms of Service still
return HTTP 403 to automated readers (re-confirmed this session with a live `curl`), so a human must
open the page in a browser, save a dated copy, and send the approval email before the *production ad
deploy* — but R0-2/R0-3 (fixtures + a pure `parse-lens` engine + a Redis rate-budget reader) can and
should be built now, gated on nothing but the free API tier. One concrete gap surfaced this session:
the existing `WCLRanking`/`WCLRankingsData` types in `lib/wcl-types.ts` describe the **boss
leaderboard** shape (`characterRankings`), not the **per-report parse blob**
(`report.rankings(fightIDs:)`) that `app/api/analyze/route.ts` already fetches and discards down to
one field (`partition`) — R0-3's "type the rankings blob properly" task is therefore a *new* type,
not an extension of the existing one. A second gap: no public demo guild exists anywhere in the
codebase (`lib/demo-report.ts` only names a report/fight/source), so R0-2's guild fixture needs a
Claude's-Discretion pick of a public guild before it can be recorded.

The most useful discovery this session for MONY-03 is operational, not architectural: this
project's installed Vercel CLI (56.3.1) already exposes `vercel metrics`, which queries Speed
Insights RUM data — including p75 LCP/INP/CLS **grouped by route** — without Observability Plus.
This was run live against the `parseforge` project this session and returned real per-route data
(`/analyze/[reportCode]`, `/`, `/tbc-audit`, …). This replaces the illegible-dashboard workaround
Phase 2.1/3 struggled with (`docs/OPS-01-SHIP-GATE.md`'s repeated "Vercel Web Analytics figure ...
unreadable" entries) with a scriptable, exact, per-route, per-percentile number — the D-09 baseline
table should be built from this command, not a dashboard screenshot.

**Primary recommendation:** hand-roll `AdSlot`/`lib/ads.ts` (no new npm dependency), gate the script
load behind `deriveConsentGateOutcome` + `requestIdleCallback`, reserve boxes with fixed pixel
`width`/`height` (not `min-height`) so `protected-elements.mjs` can assert exact dimensions, capture
the D-09 baseline with `vercel metrics ... --group-by route --since 7d --project parseforge --prod`,
and treat R0-1 as a `checkpoint:human-action` blocking only the final prod-ads deploy while R0-2/R0-3
ship as ordinary tested engine code in the same phase.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ad slot placement & reserved-box sizing | Browser / Client | — | Layout/CLS is a rendering-time concern; `AdSlot` is a client component that reserves its box on first paint |
| Ad script load gating (consent + idle) | Browser / Client | — | Must read the same in-memory consent state `PostHogProvider` already resolves; no server round-trip needed beyond the existing `/api/geo` call |
| Consent decision (geo + TCF) | API / Backend (`/api/geo`) + Browser (TCF) | — | Already built (Phase 1/2.1); Phase 4 adds a second *consumer*, not a second *decision* |
| CSP host allow-listing for ad scripts | Frontend Server (Next.js config) | — | `next.config.ts` headers() is evaluated server-side per request; report-only mode stays until Phase 7 |
| `ads.txt` | Frontend Server (Route Handler) or CDN/Static | — | Static `public/ads.txt` is simplest but has a documented Vercel/Next inconsistency (see Pitfalls); a Route Handler is more reliable |
| CWV baseline measurement | Browser (RUM collection) + Frontend Server (Vercel platform aggregation) | — | `@vercel/speed-insights` already collects RUM client-side; `vercel metrics` reads the aggregate server-side via Vercel's API, no app code needed |
| WCL rankings blob → parse rows (R0-3 `parse-lens.ts`) | API / Backend (pure lib function, called from an API route) | — | Pure transform over data already fetched server-side by `/api/analyze`; no client involvement until R1 |
| WCL rate-budget tracking (R0-3 `budget.ts`) | API / Backend + Database/Storage (Redis) | — | Reads `rateLimitData` from WCL responses server-side, persists spend state in the existing Upstash Redis, gates future *server-side* WCL calls |
| RPGLogs approval email + ToS page capture (R0-1) | Human (outside the app tiers) | — | The canonical ToS/docs pages 403 automated readers (re-confirmed this session); this is a `checkpoint:human-action`, not a tier |

## Standard Stack

### Core
No new runtime dependency is recommended for this phase. AdSense's own script
(`pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-<ID>`) is loaded directly via
`next/script`, which is already a project dependency (bundled with Next.js 16.1.6). `[ASSUMED]` —
this is the standard third-party-script pattern for App Router (see Sources); there is no
first-party "Next.js + AdSense" integration guide from Vercel or Google.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/script` | bundled with `next@16.1.6` | Deferred loading of the AdSense JS SDK | Already used in `app/layout.tsx` for Wowhead tooltips and the Google CMP script — same pattern, same file, same `strategy` prop the project already relies on `[VERIFIED: app/layout.tsx:96-110]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none — no new packages this phase) | — | — | — |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `AdSlot`/`lib/ads.ts` | `@mesmotronic/next-adsense`, `next-google-adsense`, `@ctrl/react-adsense` or similar npm packages `[ASSUMED — discovered via WebSearch, not verified against an authoritative source or `package-legitimacy check`]` | None of these packages know about this project's specific requirements — gating the script behind `deriveConsentGateOutcome` (not a generic "consent" prop), a `requestIdleCallback` delay tied to LCP, and exact per-breakpoint fixed-box dimensions the protected-elements script must be able to assert. Wrapping a generic package to do all of that is more code than writing the ~60-line component directly, and it adds a dependency + its own postinstall/supply-chain surface for no benefit. Per the project's "reuse before adding" convention (CLAUDE.md), do not add one. |
| Static `public/ads.txt` | `app/ads.txt/route.ts` Route Handler | A GitHub issue (`vercel/next.js#71599`, cited via WebSearch, not independently verified this session) reports inconsistent behavior serving a static `ads.txt` from `public/` under some Next.js/Vercel configurations — the dev server's looser static-file matching can mask a production-only failure. A Route Handler returning `text/plain` with an explicit `Cache-Control` is the safer, verifiable choice and costs one small file. `[ASSUMED — LOW, single WebSearch source, not cross-checked]` |

**Installation:** none — no `npm install` needed for this phase's ad code. If the plan later needs
a Lighthouse lab run for D-09, that is a one-off `npx lighthouse <url> --preset=mobile` invocation,
not a project dependency (do not add `lighthouse` to `package.json`).

**Version verification:** N/A — no package versions to pin for this phase's new code paths.
`next@16.1.6`, `react@19.2.3` and `posthog-js@1.360.0` are already pinned in `package.json`
`[VERIFIED: package.json, read this session]`.

## Package Legitimacy Audit

**Not applicable this phase.** No new npm packages are recommended (see Alternatives Considered
above) — `AdSlot`/`lib/ads.ts` are hand-rolled project code, `ads.txt` is either a static file or a
Route Handler using only built-in Next.js primitives, and R0-2/R0-3 extend existing project files
(`scripts/record-wcl-fixtures.mjs`, `lib/wcl-types.ts`) with no new dependencies. If the plan later
decides a third-party AdSense React wrapper is worth it after all, run
`gsd_run query package-legitimacy check --ecosystem npm <pkg>` on it first and gate the install
behind a `checkpoint:human-verify`, per the standard protocol — none of the candidate packages
named above have been run through that check in this research session, so none should be assumed
`[OK]`.

**Packages removed due to [SLOP] verdict:** none — none were checked (none proposed for use).
**Packages flagged as suspicious [SUS]:** none proposed for use.

## Architecture Patterns

### System Architecture Diagram

```
 Visitor request → /analyze/[reportCode] or /tbc-audit (SSR / ISR)
        │
        ▼
 app/layout.tsx (Server)
   ├─ existing: Google CMP script (Script, afterInteractive, gated by NEXT_PUBLIC_GOOGLE_CMP_PUB_ID)
   ├─ existing: PostHogProvider → resolves geo (/api/geo) + TCF → deriveConsentGateOutcome()
   └─ (new) no ad script here — D-06 forbids a <head> ad script
        │
        ▼
 AnalyzeClient.tsx / tbc-audit/page.tsx (Client)
   ├─ renders <AdSlot id="analyze-mid" size={{md:[728,90], sm:[300,250]}} /> at the D-02 positions
   │     │
   │     ▼
   │  AdSlot (Client component)
   │     ├─ reserves a fixed-size box immediately on mount (no CLS regardless of gate outcome)
   │     ├─ reads the SAME consent outcome PostHogProvider already computed
   │     │     — do NOT re-derive it; read lib/consent.ts's exported state / a shared hook
   │     ├─ if gate path ∉ {geo-non-consent-region, tcf-accept} → box stays reserved, empty, no script
   │     ├─ else: after hydration + requestIdleCallback (~1-2s) → inject <ins class="adsbygoogle">
   │     │        + call window.adsbygoogle.push({}) once the adsbygoogle.js script (loaded via
   │     │        next/script strategy="afterInteractive" or "lazyOnload", loaded ONCE per page,
   │     │        not once per slot) has executed
   │     └─ posthog.capture("ad_slot_requested" / "ad_slot_filled" / ... ) — low-cardinality props
   │           only (route, slot_id, consent_gate_path)
   │
   └─ protected elements (share-header, share-player, awards-panel, ...) unchanged, never adjacent
         to an AdSlot per D-02's whitelist

 ── Separately, server-side, no UI (R0) ──

 /api/analyze route (existing)
   └─ report.rankings(fightIDs:) blob (already fetched) → (new) lib/rankings/parse-lens.ts
         (pure function: blob → per-player {rankPercent, bracket, role} rows, honouring `hidden`)
         → NOT wired into any response yet (R0-3 ships tests only, per D-13)

 scripts/record-wcl-fixtures.mjs (existing, extended)
   └─ (new) records rateLimitData, report.rankings, zoneRankings/encounterRankings,
         characterRankings/fightRankings page 1, guild{members,attendance}
         → lib/__fixtures__/rankings-*.json (public entities only)

 lib/rankings/budget.ts (new)
   └─ reads rateLimitData{limitPerHour,pointsSpentThisHour,pointsResetIn} from any WCL response
         → writes wcl:budget to Upstash Redis (lib/kv-cache.ts, existing client)
         → exposes a 90% gate function future R1+ code must call before an "expensive" query
```

### Recommended Project Structure
```
app/
├── components/
│   └── AdSlot.tsx          # new — client component, one per reserved ad position
├── analyze/[reportCode]/
│   └── AnalyzeClient.tsx   # existing — gains two <AdSlot> placements per D-02
├── tbc-audit/
│   └── page.tsx            # existing — gains two <AdSlot> placements per D-02
└── ads.txt/
    └── route.ts            # new (if Route Handler chosen over public/ads.txt)
lib/
├── ads.ts                  # new — gate/loader logic, script-injection helper, size constants
├── consent.ts              # existing — unchanged, read-only dependency for lib/ads.ts
├── wcl-types.ts            # existing — gains a NEW type for report.rankings(fightIDs:) shape
│                           #   (distinct from the existing WCLRanking/WCLRankingsData, which is
│                           #   the characterRankings/boss-leaderboard shape — see Pitfall 1)
└── rankings/
    ├── parse-lens.ts        # new (R0-3) — pure: rankings blob -> per-player parse rows
    └── budget.ts            # new (R0-3) — rateLimitData -> Redis budget gate
scripts/
└── record-wcl-fixtures.mjs # existing — extended (R0-2) with rankings queries
docs/
└── OPS-01-SHIP-GATE.md     # existing — gains new "Part 6" (CWV baseline + rollback trigger)
.planning/research/
├── wcl-tos-2026-09-19.md          # new (R0-1) — human-saved dated copy of the ToS page
├── wcl-api-docs-2026-09-19.md     # new (R0-1) — human-saved dated copy of the API docs page
└── rpglogs-approval-request-2026-09-19.md  # existing draft — gains a filled Thread table
```

### Pattern 1: Fixed-box AdSlot that never re-flows regardless of gate outcome
**What:** A client component whose outer wrapper has explicit `width`/`height` (not `min-height`)
set from a size map keyed by breakpoint, rendered identically whether the ad ultimately loads,
stays empty, or the visitor is gated out — so the box's presence in the DOM is unconditional and
its dimensions never change after first paint.
**When to use:** Every `AdSlot` instance (both analyze-page and tbc-audit placements).
**Example:**
```tsx
// Pattern synthesized from the CLS-mitigation guidance in Google's own Publisher
// Tag docs (developers.google.com/publisher-tag/guides/minimize-layout-shift,
// via WebSearch — page itself not fetched this session) [CITED — not independently
// verified] combined with this repo's existing gated-script pattern
// (app/layout.tsx:103-110, VERIFIED this session) and lib/consent.ts's
// deriveConsentGateOutcome (VERIFIED this session).
"use client";
import { useEffect, useRef, useState } from "react";
import { getConsentState } from "@/lib/consent"; // read-only consumer, no new listener

type SlotSize = { width: number; height: number };
const SIZES: Record<string, { base: SlotSize; md?: SlotSize }> = {
  "analyze-mid": { base: { width: 300, height: 250 }, md: { width: 728, height: 90 } },
};

export default function AdSlot({ id }: { id: keyof typeof SIZES }) {
  const size = SIZES[id];
  const insRef = useRef<HTMLModElement>(null);
  const [admitted, setAdmitted] = useState(false);

  useEffect(() => {
    const { action } = getConsentState(); // reflects the SAME decision PostHogProvider made
    // Gate path check mirrors D-07: only geo-non-consent-region / tcf-accept load the script.
    // (Exact wiring depends on how lib/ads.ts exposes the resolved ConsentGatePath — see
    // Open Questions; this sketch shows the shape, not the final API.)
    const idleId = ("requestIdleCallback" in window ? window.requestIdleCallback : setTimeout)(
      () => setAdmitted(true),
      { timeout: 2000 } as never,
    );
    return () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId as number);
    };
  }, []);

  useEffect(() => {
    if (admitted && insRef.current && window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  }, [admitted]);

  return (
    // Fixed pixel width/height — NOT min-height — so protected-elements.mjs can assert
    // exact box dimensions (D-04) rather than a lower bound.
    <div
      style={{ width: size.base.width, height: size.base.height }}
      className="md:[width:var(--ad-md-w)] md:[height:var(--ad-md-h)] mx-auto"
      data-ad-slot={id}
    >
      {admitted && (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
        />
      )}
    </div>
  );
}
```

### Pattern 2: Load the AdSense SDK once, at the app root, deferred
**What:** `next/script` with `strategy="afterInteractive"` (or `"lazyOnload"` for extra safety
margin on LCP — the two candidate strategies WebSearch surfaced), placed once in `app/layout.tsx`
next to the existing Google CMP script, not once per `AdSlot`.
**When to use:** Loaded exactly once per page load, gated the same way the CMP script already is
(env-flag pattern per D-08's own note that the loader should "mirror" `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID`).
**Example:**
```tsx
// Source: pattern converged on across multiple community writeups (WebSearch,
// not an official Next.js/Google doc) — combined with this repo's existing
// env-gated Script block. [ASSUMED — LOW, no authoritative source]
{process.env.NEXT_PUBLIC_ADS_ENABLED === "1" && (
  <Script
    id="adsbygoogle-sdk"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${ADSENSE_PUB_ID}`}
    strategy="afterInteractive"
    crossOrigin="anonymous"
    async
  />
)}
```

### Pattern 3: `ads.txt` as a Route Handler
**What:** `app/ads.txt/route.ts` returning `text/plain`, rather than a static `public/ads.txt` file.
**When to use:** Chosen over the static file because of a documented (but not independently
verified this session) Vercel/Next.js inconsistency serving static text files at a bare top-level
path.
**Example:**
```ts
// Pattern per community writeups (WebSearch) — not an official Next.js doc.
// [ASSUMED — LOW]
export async function GET() {
  return new Response(`google.com, pub-${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=86400" },
  });
}
```

### Pattern 4: `parse-lens.ts` — pure transform, no side effects, honours `hidden`
**What:** R0-3's core deliverable — a pure function over the `report.rankings(fightIDs:)` blob
already fetched by `/api/analyze`, following the exact style of `lib/analysis-engine.ts` and the
Phase 2 engines (fixture-tested, no I/O).
**When to use:** Called from `/api/analyze` (or a future R1 raid-overview route) once R1 ships; for
this phase it ships with tests only, wired into nothing (D-13).
**Example (sketch — exact WCL field names must come from R0-2's recorded fixture, not guessed):**
```ts
// lib/rankings/parse-lens.ts — style matches lib/analysis-engine.ts (pure, typed,
// no throwing). Field names below are what PARSEFORGE-RANKINGS-SPEC.md §3.3 cites
// from RPGLogs' own SDK snapshots [CITED, not re-verified against this project's
// own fixture this session — R0-2 must record the real shape before this ships].
export interface ParseRow {
  sourceId: number;
  name: string;
  rankPercent: number | null;
  bracketPercent: number | null;
  hidden: boolean;
}

export function toParseRows(
  rankingsBlob: RawReportRankingsBlob, // new type — NOT the existing WCLRankingsData
): ParseRow[] {
  // ... honour reportsBlacklistForCharacters / hidden per the spec's §4.3 "gaming" row
}
```

### Anti-Patterns to Avoid
- **Responsive/auto-size `<ins>` (`data-ad-format="auto"`)**: renders at 0px height until filled,
  which is the single most-cited cause of ad-related CLS across every source consulted this
  session — explicitly forbidden by D-04.
- **A second `__tcfapi` listener or a second `/api/geo` fetch inside `AdSlot`**: `lib/consent.ts`'s
  own doc comment already anticipates this exact mistake ("the ad loader must follow the same
  decision, not re-derive it" — CONTEXT.md canonical refs). `AdSlot` must read the resolved state,
  not compute its own.
- **Loading `adsbygoogle.js` in `<head>` or with `strategy="beforeInteractive"`**: directly
  contradicts D-06 ("never before the route's LCP element has painted").
- **Treating `NEXT_PUBLIC_ADS_ENABLED` as an instant kill switch**: it bakes at build time on this
  Vercel project (CLAUDE.md, re-affirmed by D-08 itself) — a real incident response must use the
  AdSense dashboard pause, not a flag flip + redeploy.
- **Assuming the AdSense npm packages found via WebSearch are safe to install without checking**:
  none were run through `package-legitimacy check` this session; if the plan chooses one anyway, it
  must go through that gate first (see Package Legitimacy Audit).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Is this visitor consented for ads?" | A second consent listener/derivation for ads | `lib/consent.ts`'s existing `getConsentState()` / `deriveConsentGateOutcome()`, already executed once by `PostHogProvider` | Two independent consent derivations is exactly the class of bug `02.1-DIAGNOSIS.md` already spent a phase fixing for PostHog; CONTEXT.md explicitly forbids repeating it for ads |
| "How much of the WCL rate budget is left?" | A hand-rolled counter in memory (resets on every serverless cold start, wrong under concurrency) | `rateLimitData{limitPerHour,pointsSpentThisHour,pointsResetIn}` (queryable on any WCL response) persisted into the existing Upstash Redis via `lib/kv-cache.ts` | The project already has a shared Redis + single-flight cache (`cachedApiHandler`); a second ad-hoc counter would drift from the real WCL-reported number and wouldn't survive a cold start |
| "Cache the result of an expensive rankings query" | A new caching layer | `cachedApiHandler()` / `lib/kv-cache.ts` (existing single-flight + Redis) | Exactly the primitive `PARSEFORGE-RANKINGS-SPEC.md` §6 already recommends reusing |
| "Measure CWV before/after ads" | A custom RUM collector or a one-off Lighthouse-only baseline | `@vercel/speed-insights` (already mounted, `app/layout.tsx:124`) + the `vercel metrics` CLI (confirmed working against this project this session, no new tooling) | Building a parallel collector duplicates data Vercel already has; `vercel metrics` gives exact per-route p75 numbers without a dashboard screenshot |

**Key insight:** every "don't hand-roll" row in this phase is really the same rule stated four
ways — this phase's job is to plug two *new* consumers (an ad loader, a rankings engine) into
*existing* project primitives (consent state, Redis cache, RUM collection), not to build new
plumbing for any of them.

## Common Pitfalls

### Pitfall 1: The existing `WCLRanking` type is the wrong shape for R0-3
**What goes wrong:** A plan or executor assumes `lib/wcl-types.ts`'s existing `WCLRanking`/
`WCLRankingsData` interfaces (`name, class, spec, amount, duration, startTime, report, guild,
server, bracketData, best, talents, gear` — `[VERIFIED: lib/wcl-types.ts:149-169, quoted verbatim]`)
already describe the per-report `rankPercent`/`speed`/`execution` blob R0-3 needs to type, and tries
to extend it instead of adding a new type.
**Why it happens:** Both are called "rankings" in casual conversation, and both come from WCL. But
`WCLRanking` is the **boss-leaderboard** shape (`worldData.encounter.characterRankings` — used
today only for `analyzeDps`'s page-1 percentile estimate), while `report.rankings(fightIDs:)` — the
blob `/api/analyze` already fetches and discards to a single field — is typed today, inline, as
`Array<{ fightID?: number; partition?: number }>` `[VERIFIED: app/api/analyze/route.ts:40, quoted
verbatim]`. They do not share a shape.
**How to avoid:** R0-3 must define a genuinely new type for the `report.rankings` blob (per
`PARSEFORGE-RANKINGS-SPEC.md` §3.3's field list, itself cited from RPGLogs' own SDK, not this
repo), verified against R0-2's own recorded fixture rather than the spec document alone.
**Warning signs:** A `parse-lens.ts` that imports `WCLRanking` and immediately needs to add half a
dozen optional fields nothing else uses.

### Pitfall 2: No public demo guild exists for R0-2's guild fixture
**What goes wrong:** R0-2 asks for `guild{members,attendance}` and `reports(guildID, zoneID)`
fixtures "for the demo guild," but `[VERIFIED: grep across lib/, scripts/, app/ this session, zero
matches for "guildData"/"DEMO_GUILD"/"guild("]` — no demo guild is defined anywhere in the codebase.
Only `lib/demo-report.ts`'s report/fight/source exist.
**Why it happens:** The demo report/fight/source were chosen for Phase 2's engine fixtures, which
never needed guild-level data; R0 is the first consumer of a guild query.
**How to avoid:** The plan needs an explicit step (Claude's Discretion, per CONTEXT.md's R0-2/R0-3
file-layout discretion) to pick a real public guild — ideally the demo report's own guild, if that
report's `report.guild` field resolves to one and that guild's `reports()` list is public — before
`record-wcl-fixtures.mjs` can be extended for the guild fixture. If the demo report's guild turns
out to be unlisted/private, a different public guild must be chosen and the choice documented
alongside `lib/demo-report.ts`'s own provenance comment.
**Warning signs:** A hand-typed guild name that was never confirmed public before a fixture was
committed — `lib/__fixtures__/README.md`'s own rule ("A fixture must never be recorded from a
report that is not publicly viewable") applies identically to a guild fixture.

### Pitfall 3: Responsive/auto ad units silently reappear via Auto ads
**What goes wrong:** Even with only manual `<ins class="adsbygoogle">` units in the code, Google's
Auto ads system can inject additional units elsewhere on the page if Auto ads is left on in the
AdSense dashboard — a code-only implementation of D-04/D-05 is not sufficient by itself.
**Why it happens:** Since a 2019 AdSense change, Auto ads activates from the presence of *any*
AdSense code on the page (including a manually placed unit), independent of what the page's own
markup asks for. `[CITED via WebSearch — support.google.com/adsense and third-party summaries, not
independently re-verified against the current AdSense dashboard UI this session]`.
**How to avoid:** D-05 already names this: Auto ads must be switched off in the AdSense account
dashboard as a *separate*, explicit step from shipping the code — this is a `checkpoint:human-action`
in the AdSense UI, not something `AdSlot.tsx` can enforce from the client.
**Warning signs:** An ad appearing at a page position no `AdSlot` component was placed at.

### Pitfall 4: `NEXT_PUBLIC_ADS_ENABLED` treated as a real-time kill switch
**What goes wrong:** An incident response plan assumes flipping `NEXT_PUBLIC_ADS_ENABLED=0` and
redeploying stops ads within seconds.
**Why it happens:** `NEXT_PUBLIC_*` env vars bake into the client bundle at build time on this
project `[VERIFIED: CLAUDE.md, "Env-var changes only take effect on a new deploy"]` — a flag flip
still requires a full build + manual `vercel deploy --prod`, which is minutes, not seconds.
**How to avoid:** D-08 already specifies the actual instant lever is the AdSense-side dashboard
pause; the code flag is documented as "a redeploy-speed lever," and the rollback runbook (Part 6)
must lead with the dashboard pause, not the flag.
**Warning signs:** A rollback procedure that starts with "set the env var and deploy" instead of
"pause the ad unit in AdSense."

### Pitfall 5: The RPGLogs ToS/docs pages are still unreadable by automation
**What goes wrong:** An executor tries to `curl`/`WebFetch` the canonical ToS or API-docs page to
"save a dated copy" programmatically for R0-1, and either silently succeeds with an error page's
content or fails without escalating.
**Why it happens:** `[VERIFIED this session: curl -s -o /dev/null -w '%{http_code}'
https://articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service` → `403`; same for
`https://www.warcraftlogs.com/api/docs` → `403`]` — unchanged from `PARSEFORGE-RANKINGS-SPEC.md`'s
2026-09-18 finding one day earlier.
**How to avoid:** R0-1 is inherently a human-at-a-browser task (per D-15's own "human-keyboard
prerequisites" pattern already used for the Search Console flow) — the plan should not create an
automated task for the page capture step, only for drafting the email body and recording the sent
thread.
**Warning signs:** A committed `.planning/research/wcl-tos-2026-09-19.md` whose content is
obviously a 403 error page rather than ToS text.

### Pitfall 6: Vercel Web Analytics dashboard reads have repeatedly been "unreadable" in this project's own history
**What goes wrong:** The plan defaults to a manual Vercel Analytics dashboard screenshot for the
D-09 baseline table, repeating a pattern that already cost this project multiple gap-closure cycles.
**Why it happens:** `docs/OPS-01-SHIP-GATE.md`'s own history records this exact failure mode
repeatedly (`[VERIFIED: STATE.md quotes — "Vercel Web Analytics ratio threshold is PENDING
(unreadable this session)"`, `"threshold 3 NOT EVALUABLE (Vercel CLI API only returns an
hour-rounded upper bound, not a window-exact figure)"`, `"recorded as an upper bound because the
range's end time was illegible"`]).
**How to avoid:** Use `vercel metrics vercel.speed_insights.{lcp_ms,inp_ms,cls} --aggregation p75
--group-by route --since 7d --project parseforge --prod --global-config ~/.vercel-personal --scope
loot-list-plus` (exact syntax `[VERIFIED: run live this session against the real project, see Code
Examples]`) instead of a dashboard read — it returns exact numbers, not an illegible or rounded
screenshot, and is the same class of tool this project's own docs already recommend for the item-7
PostHog-vs-Vercel ratio.
**Warning signs:** A Part 6 baseline table whose values are annotated "approximate" or "upper
bound" when an exact CLI read was available.

## Code Examples

### Verified this session: `vercel metrics` CLI for the D-09 baseline
```bash
export PATH="$HOME/.local/node20/bin:$PATH"
# Confirms the metric namespace and available aggregations (run live this session):
vercel metrics schema vercel.speed_insights --global-config ~/.vercel-personal --scope loot-list-plus

# Per-route p75 LCP over the trailing 7 days, production only — run live this session,
# returned real data for /, /analyze/[reportCode], /tbc-audit, /guides/*, /privacy:
vercel metrics vercel.speed_insights.lcp_ms --aggregation p75 --group-by route --since 7d \
  --project parseforge --prod --global-config ~/.vercel-personal --scope loot-list-plus

# Same shape for INP and CLS — swap the metric id, keep every other flag identical:
vercel metrics vercel.speed_insights.inp_ms --aggregation p75 --group-by route --since 7d \
  --project parseforge --prod --global-config ~/.vercel-personal --scope loot-list-plus
vercel metrics vercel.speed_insights.cls --aggregation p75 --group-by route --since 7d \
  --project parseforge --prod --global-config ~/.vercel-personal --scope loot-list-plus

# Split by device class for D-09's "phone and desktop" requirement — deviceType is a
# documented shared dimension [CITED: vercel.com/docs/speed-insights/accessing-metrics-with-vercel-cli,
# fetched this session]; add it as a second --group-by:
vercel metrics vercel.speed_insights.lcp_ms --aggregation p75 --group-by route --group-by deviceType \
  --since 7d --project parseforge --prod --global-config ~/.vercel-personal --scope loot-list-plus

# Filter to one route with daily granularity (for the day-2 early read, D-11):
vercel metrics vercel.speed_insights.cls --aggregation p75 --filter 'route:/analyze/[reportCode]' \
  --since 7d --granularity 1d --project parseforge --prod --global-config ~/.vercel-personal --scope loot-list-plus
```
`[VERIFIED: CLI version `56.3.1` confirmed installed at `~/.local/node20/bin/vercel`; `vercel
metrics schema vercel.speed_insights` and a live `lcp_ms` per-route query were both run this
session against the real `parseforge` project under scope `loot-list-plus` and returned real
per-route rows (`/analyze/[reportCode]`, `/`, `/tbc-audit`, `/guides/*`, `/privacy`) — this is not a
documentation claim, it is a confirmed-working command against this exact project.]` Note the
`route` dimension returns the Next.js *route pattern* (`/analyze/[reportCode]`), not per-report
URLs, which is exactly the granularity D-09 needs (per-route, not per-report).

### `--all` team-wide query is not needed here — always pass `--project parseforge --prod`
Every example above scopes to the single project and production environment; omitting `--prod`
would mix in preview-deployment RUM data, which is not representative of the live baseline.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reading Vercel Web Analytics/Speed Insights via the dashboard or the older `aggregate_pageviews`-style read this project used in Phase 2.1/3 | `vercel metrics` CLI, querying the same underlying Speed Insights data with exact per-route/per-percentile numbers, no Observability Plus required | Vercel CLI 56.x (confirmed installed version) — the docs page fetched this session is dated `last_updated: 2026-09-10` | Directly resolves the recurring "unreadable"/"upper bound"/"NOT EVALUABLE" pattern that cost this project multiple `OPS-01-SHIP-GATE.md` gap-closure cycles in Phase 2.1 and Phase 3 |
| AdSense responsive/`data-ad-format="auto"` units (historically the "recommended" default in many older tutorials) | Fixed-size manual units with explicit reserved boxes, as a direct response to Core Web Vitals/CLS becoming a ranking factor | Ongoing since CWV became a ranking signal (2021) | D-04 already reflects the current best practice; no old-vs-new gap for this project to fall into here |

**Deprecated/outdated:** Auto ads as a "just turn it on" default — every current CLS-focused source
consulted this session treats Auto ads as actively hostile to layout stability, matching D-05's own
reasoning.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `next/script strategy="afterInteractive"` (or `lazyOnload`) is the right loading strategy for `adsbygoogle.js`, and no official Next.js/Google-authored guide exists for this | Architecture Patterns, Standard Stack | Low — this is a well-worn community pattern and Next.js's own `Script` component semantics (afterInteractive = after hydration) are documented and stable; worst case is a slightly earlier/later load than optimal, tunable without a redesign |
| A2 | A `public/ads.txt` static file is less reliable on this Vercel/Next.js setup than a Route Handler | Architecture Patterns (Pattern 3), Standard Stack (Alternatives) | Low-medium — based on a single GitHub issue found via WebSearch, not reproduced against this project; if wrong, the plan does slightly more work than needed (a route handler instead of a static file), not a functional regression |
| A3 | Auto ads can inject units even when only manual code is present, requiring an explicit dashboard-side disable | Common Pitfalls (Pitfall 3) | Medium — if this is stale/wrong, D-05's dashboard step may be unnecessary, but doing it anyway is harmless; if it's right and the step is skipped, an ad could appear covering a protected element, which is this phase's core failure mode |
| A4 | Google publishes no hard numeric AdSense approval traffic threshold, and 50-100 daily visitors is only a community-sourced soft benchmark | Environment Availability, Sources | Medium — CONTEXT.md's own "Research flag: verify current ad-network eligibility thresholds directly at signup" already anticipates this is unverified; if wrong, AdSense approval could stall regardless of code readiness, which would only affect timing of the prod deploy, not the build |
| A5 | The `report.rankings(fightIDs:)` blob's field names (`rankPercent`, `bracketData`, `speed{...}`, `execution{...}`, `reportsBlacklistForCharacters`) match `PARSEFORGE-RANKINGS-SPEC.md` §3.3's citation of RPGLogs' own SDK | Architecture Patterns (Pattern 4), Pitfall 1 | Medium — R0-2's own purpose is to resolve this by recording a real fixture; `parse-lens.ts` must be written against that fixture, not against this document or the spec |
| A6 | No demo public guild currently exists and one must be newly chosen | Common Pitfalls (Pitfall 2) | Low — this was confirmed by an exhaustive grep this session (zero matches), so it is closer to VERIFIED-absence than a guess, but the *choice* of which guild to use is still open |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Which public guild becomes the R0-2 fixture source?**
   - What we know: no demo guild exists in the codebase today `[VERIFIED: grep, zero matches]`;
     `lib/demo-report.ts`'s own report is the natural first candidate if its `report.guild` field
     resolves to a public guild whose `reports()` are themselves public.
   - What's unclear: whether that guild (if any) is public, and whether its recent reports are
     public too (the same "must be publicly viewable" rule `lib/__fixtures__/README.md` already
     states for reports would apply to a guild fixture).
   - Recommendation: R0-2's first sub-step should probe `report.guild` on the existing demo report
     via the client-credentials token, and fall back to picking a well-known public
     Classic/TBC guild only if that resolves to nothing usable — record the choice with the same
     provenance rigor `lib/__fixtures__/README.md` already applies to the report/fight/source.

2. **Exact point cost per rankings query type — needed to size the `budget.ts` 90% gate meaningfully**
   - What we know: the free tier is 3,600 points/hour `[CITED via WebSearch, matches
     PARSEFORGE-RANKINGS-SPEC.md §2.2's own citation]`; per-query point cost is not published.
   - What's unclear: whether a single `report.rankings(fightIDs:)` call (already made on every
     `/api/analyze` request) meaningfully dents the budget, or whether it's negligible — this
     determines how conservative `budget.ts`'s gate needs to be for R0-scope code (which makes no
     new server-side calls beyond what's already fetched).
   - Recommendation: R0-2's fixture-recording run should log `pointsSpentThisHour` before and after
     each new query type, exactly as `PARSEFORGE-RANKINGS-SPEC.md` §7's own R0-2 verification
     criterion already specifies ("measured `pointsSpentThisHour` delta per query type").

3. **Will RPGLogs' reply (or silence) arrive inside this phase's execution window?**
   - What we know: D-14 already defines the 14-day escalation path and treats non-response as
     non-approval.
   - What's unclear: timing is entirely external; the plan cannot schedule around it.
   - Recommendation: structure the phase so every non-approval-gated task (baseline, AdSlot code,
     CSP entries, R0-2/R0-3, preview deploy) is completable and independently valuable even if the
     approval reply takes the full 14 days or longer — which the CONTEXT.md decisions already do
     (D-12/D-13).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel CLI (`vercel metrics`) | D-09 CWV baseline capture | ✓ `[VERIFIED: run live this session]` | 56.3.1 | — |
| `--global-config ~/.vercel-personal` + `--scope loot-list-plus` | Every Vercel CLI command per CLAUDE.md | ✓ `[VERIFIED: confirmed working against real `parseforge` project this session]` | — | — |
| Node 20 / npm (via `~/.local/node20/bin`) | Any local `npm`/`npx`/`vercel` invocation | ✓ `[VERIFIED: PATH prepend used successfully this session]` | Node 20 per CLAUDE.md | — |
| Google AdSense account + approved site | MONY-02 (the actual ad revenue) | ✗ (not confirmed this session — no account access) | — | None — this is the phase's own external dependency; D-15 already treats AdSense site review as a human-keyboard prerequisite |
| RPGLogs API ToS / API-docs pages (browser-readable) | R0-1 | ✗ automated `[VERIFIED: curl → 403 for both pages this session]`; readable in a real browser (not tested this session) | — | Human-in-browser read, per D-15's existing pattern |
| `npx lighthouse` (mobile lab run, D-09) | MONY-03 baseline | Not tested this session `[ASSUMED available via npx, standard public npm package]` | — | Chrome DevTools' own Lighthouse panel, run manually, if `npx lighthouse` has environment issues |
| WCL client-credentials API (`WCL_CLIENT_ID`/`WCL_CLIENT_SECRET`) | R0-2 fixture recording | ✓ (already provisioned per CLAUDE.md; Vercel-only, needs `vercel env pull` per `lib/__fixtures__/README.md`'s existing recipe) | — | — |

**Missing dependencies with no fallback:**
- Google AdSense account approval/eligibility — external, human-driven, cannot be verified or
  worked around by this research session; CONTEXT.md's own research flag already names this.

**Missing dependencies with fallback:**
- RPGLogs ToS/docs pages (403 to automation) → human-in-browser read (D-15 pattern, already planned).
- `npx lighthouse` untested this session → Chrome DevTools Lighthouse panel as a manual fallback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 `[VERIFIED: package.json]` |
| Config file | none found at repo root this session — check for `vitest.config.*` before assuming defaults; existing engine tests (`fixtures.test.ts`, `cla-engine.test.ts`, etc.) run via `npm test` = `vitest run` |
| Quick run command | `npx vitest run lib/rankings/parse-lens.test.ts` (once written) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MONY-02 | Ad slot never overlaps/pushes a protected element | integration (script) | `npm run protected-elements -- --report` (extended with a slot-dimension/no-overlap assertion — Claude's Discretion per CONTEXT.md) | ❌ Wave 0 — extend `scripts/protected-elements.mjs` |
| MONY-02 | Ads load only for `consent_gate_path ∈ {geo-non-consent-region, tcf-accept}` | unit | a new `lib/ads.test.ts` asserting the gate function's outputs across all four `ConsentGatePath` values (mirrors `lib/consent.ts`'s own existing test pattern, if one exists — check for `lib/consent.test.ts`) | ❌ Wave 0 |
| MONY-03 | CLS/LCP/INP baseline captured and rollback trigger numeric | manual-only (justified) | `vercel metrics ...` (see Code Examples) — this is a one-off measurement, not a repeatable automated test | N/A — data capture, not a test |
| R0-3 | `parse-lens.ts` correctly transforms the real rankings blob, honours `hidden` | unit (fixture-driven) | `npx vitest run lib/rankings/parse-lens.test.ts` against R0-2's recorded fixture | ❌ Wave 0 — needs R0-2's fixture first |
| R0-3 | `budget.ts` gates at 90% of `limitPerHour` | unit | `npx vitest run lib/rankings/budget.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (CLAUDE.md-mandated before any change is called done) +
  the specific new test file for that task.
- **Per wave merge:** `npm test` (full vitest suite) + `npm run protected-elements` (must stay
  green per D-02's own text) + `npx tsc --noEmit`.
- **Phase gate:** Full suite green, `protected-elements` green, `npm run lint` clean (no new
  findings — pre-existing debt in `components/ui/meteors.tsx`/`lib/analysis-engine.ts` stays
  untouched per CLAUDE.md) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `lib/ads.test.ts` — gate-decision unit tests for the ad loader (mirrors `lib/consent.ts`'s
      own decision-table testing style)
- [ ] `scripts/protected-elements.mjs` extension — slot-dimension + no-overlap assertions (currently
      only checks `data-protected` attribute presence + `/og`/canonical route contracts,
      `[VERIFIED: scripts/protected-elements.mjs, read in full this session]`)
- [ ] `lib/rankings/parse-lens.test.ts` + the R0-2 fixture it depends on
- [ ] `lib/rankings/budget.test.ts`
- [ ] `docs/OPS-01-SHIP-GATE.md` Part 6 — new section, not a test file, but a required Wave 0
      artifact before any ad code ships (per D-09's own wording, "before the first ad commit")

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth surface this phase |
| V3 Session Management | no | No new session state |
| V4 Access Control | no | No new access-controlled resource |
| V5 Input Validation | yes | `budget.ts` must runtime-validate `rateLimitData`'s shape before trusting it (same "runtime-validate, fail closed" pattern `PostHogProvider.tsx:119-122` already uses for `/api/geo`'s body — `[VERIFIED: quoted above]`) |
| V6 Cryptography | no | No new secrets/crypto this phase (existing `WCL_CLIENT_ID/SECRET` handling is unchanged) |
| V10 Malicious Code / Supply Chain | yes | No new npm dependency is being added (see Package Legitimacy Audit) — if the plan later reverses that and adds an AdSense wrapper package, it MUST go through `package-legitimacy check` first, per the standing protocol |
| V14 Configuration | yes | CSP report-only additions for Google ad hosts must be added to `next.config.ts`'s existing `CSP_REPORT_ONLY` array (not a new middleware), keeping the project's single-source-of-CSP convention; `NEXT_PUBLIC_ADS_ENABLED`/`NEXT_PUBLIC_ADSENSE_PUB_ID` follow the exact `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` env-gating precedent already in `app/layout.tsx` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Third-party ad script exfiltrating page data or injecting unwanted content | Tampering / Information Disclosure | CSP `script-src`/`connect-src`/`frame-src` allow-listing scoped to the exact Google ad hosts named in CONTEXT.md's discretion list (`pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`), report-only until Phase 7 so violations are visible before enforcement |
| A malformed/attacker-influenced `rateLimitData` response causing `budget.ts` to under- or over-count spend | Tampering | Runtime-validate the response shape (numbers, not just "truthy") before writing to Redis, same pattern as the existing geo-decision validation |
| A committed rankings fixture accidentally sourced from a private report/guild, permanently publishing third-party player data | Information Disclosure | The exact rule `lib/__fixtures__/README.md` already states for report fixtures ("must never be recorded from a report that is not publicly viewable... if this report is ever made private, these fixtures must be deleted") extends identically to the new guild/character fixtures R0-2 adds |
| Ad network revocation / ToS breach from running ads on the WCL-derived analyzer without approval | (business risk, not a STRIDE category) | D-12's phase-first structure: the deploy that actually turns ads on is a `checkpoint:human-action` gated on the recorded approval reply, not a code-level control |

## Sources

### Primary (HIGH confidence)
- This repository, read directly this session: `app/layout.tsx`, `next.config.ts`,
  `lib/consent.ts`, `app/components/PostHogProvider.tsx`, `app/analyze/[reportCode]/AnalyzeClient.tsx`,
  `app/tbc-audit/page.tsx`, `docs/PROTECTED-ELEMENTS.md`, `scripts/protected-elements.mjs`,
  `lib/wcl-types.ts`, `app/api/analyze/route.ts`, `lib/demo-report.ts`, `lib/constants.ts`,
  `lib/__fixtures__/README.md`, `package.json`, `.planning/config.json`, `.planning/REQUIREMENTS.md`,
  `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/phases/04-ads-live/04-CONTEXT.md`,
  `.planning/research/PARSEFORGE-RANKINGS-SPEC.md`, `.planning/research/rpglogs-approval-request-2026-09-19.md`.
- `vercel metrics schema vercel.speed_insights` and a live `lcp_ms` per-route query — run this
  session against the real `parseforge` project (`--global-config ~/.vercel-personal --scope
  loot-list-plus`), returned real data.
- `curl -I` against `articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service` and
  `www.warcraftlogs.com/api/docs` — both 403, run this session.
- `vercel.com/docs/speed-insights/accessing-metrics-with-vercel-cli` — fetched directly this
  session (WebFetch), verbatim commands quoted above.

### Secondary (MEDIUM confidence)
- Warcraft Logs `rateLimitData`/3,600-points-per-hour figure — cross-checked between this session's
  WebSearch and `PARSEFORGE-RANKINGS-SPEC.md`'s own independent citation of the same figure.

### Tertiary (LOW confidence)
- AdSense Auto-ads-vs-manual behavior, CLS mitigation via fixed boxes, Next.js `next/script`
  loading-strategy convention, `ads.txt` Route-Handler-vs-static-file reliability, and AdSense
  approval traffic thresholds — all WebSearch-only this session, no official page independently
  fetched and read for any of these five topics; flagged `[ASSUMED]` throughout and listed in the
  Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — no new dependency is needed (high confidence in that recommendation
  itself), but the AdSense integration *pattern* rests entirely on unofficial community sources.
- Architecture: HIGH for the parts that reuse existing project primitives (consent, Redis, RUM);
  MEDIUM for the AdSense-specific `AdSlot` sketch, which is illustrative, not copy-paste-ready.
- Pitfalls: HIGH for the two repo-specific findings (WCLRanking type mismatch, missing demo guild,
  both directly observed this session) and the 403-page/Vercel-metrics findings (directly tested
  this session); LOW-MEDIUM for the AdSense-ecosystem pitfalls (Auto ads behavior, sourced only via
  WebSearch).

**Research date:** 2026-09-19
**Valid until:** ~30 days for the repo-specific findings (stable code, unlikely to drift); ~7 days
for the AdSense-ecosystem claims and the "no official traffic minimum" claim, since AdSense policy
and eligibility criteria are known to change without notice and none of those claims were verified
against an authoritative source this session.
