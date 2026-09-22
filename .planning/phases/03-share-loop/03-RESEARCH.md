# Phase 3: Share Loop - Research

**Researched:** 2026-09-15
**Domain:** Dynamic OG image generation (Satori/`next/og`), pure-function award rules over existing engine output, URL-state-driven share surfaces, PostHog funnel measurement
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Award content & tone (SHARE-01)**
- **D-01:** Tone is mixed — praise plus gentle roast. Positive awards (e.g. Top DPS, Top HPS, Iron Man / no deaths, Best Prepared) sit alongside light jabs (e.g. First to Die, Flaskless Wonder, GCD Tourist). Roasts are self-deprecating-guild-humour level and never insulting — the card names real raiders from a public log and must be fun to be on, not embarrassing. No "full roast" headline of the worst player.
- **D-02:** Awards come from a conditional slate with a fixed display count: a pool of ~12–15 award rules, each with a trigger condition (First to Die only fires if someone died; Flaskless Wonder only if someone lacked a flask; etc.). The card shows the top 5–6 that fired, ranked by a fixed priority order. Every card looks full; there are never empty "nobody died" rows. The pool, trigger conditions and priority order live in one pure, unit-tested engine module.
- **D-03:** Award rules draw on raid-overview data only — the existing per-fight `/api/raid-overview` result (`RaidOverviewResult`). One already-cached, already-regression-tested call per card. No per-raider `/api/analyze` fan-out and no cast-timeline fetch for awards this phase. Reversibility: reversible — adding percentile- or timeline-based awards later is additive to the rule pool.
- **D-04:** Each award row shows title + winning player(s) + the stat that earned it. No per-award quip line. Claude drafts WoW-flavoured award names; the user reviews the full pool before it ships (a human checkpoint in the plan, not a discretionary call).

**Roast card surface & URL (SHARE-01, SEO invariants)**
- **D-05:** The awards card lives as a param on the existing report page, e.g. `/analyze/{code}?fight={id}&view=awards`. `app/og/route.tsx` renders the awards card when `view=awards` is present; `generateMetadata` forwards the param into the OG URL exactly as it does `fight`/`source` today. The canonical stays the param-free `/analyze/{code}` — no sitemap, robots or `recordRecentReport` change. No dedicated route, no image-only download. Reversibility: costly — the `view=awards` URL shape becomes the thing people paste into Discord; changing it later means redirects for links already in the wild.
- **D-06:** In the analyze UI, the Raid tab gets an awards panel: the fired awards as rows plus the actual 1200×630 card image rendered inline (the same `/og` output Discord will show) with a "Copy awards link" button beside it. Not a modal, not rows-only.
- **D-07:** Any single fight is eligible — kills and wipes. The card header shows the boss name and Kill / Wipe (xx %). "All Bosses (Average)" does not get a card this phase (deferred).
- **D-08:** Visually the awards card reuses the existing OG `Shell` (brand row, gold top bar, `parseforge.gg` footer) with a new award layout inside: boss + Kill/Wipe header, 5–6 award rows with class-coloured player names and a small icon/emoji per award. Same Satori constraints as today (hex mirrors of tokens).

**Player permalink & OG card (SHARE-02)**
- **D-09:** A dedicated "Share my parse" button on the player scorecard copies a normalized permalink: always `/analyze/{code}?fight={id}&source={id}` (plus the `ref` param from D-16), with `tab` and any other params stripped and `source` always present. Reuses the existing `PlayerCard` OG path and the param-free canonical; no short vanity path, no new route. The header Share button remains the report-level link and stops copying raw `location.href`.
- **D-10:** The per-player OG image keeps the current `PlayerCard` composition and adds receipts: Kill/Wipe + fight length, a "vs top {N} {spec}s" comparison label, and one proof line — healers get effective HPS + overheal % (the percentile shown must be the effective-HPS percentile), DPS get active-time %. Not a redesign around the #1 suggestion.
- **D-11:** The existing "Copy for Discord" text scorecard stays as a secondary action; the link-only "Share my parse" is the primary button. Both keep working.
- **D-12:** Landing behaviour: when a visitor arrives with `source` present and `tab` absent, the page auto-opens the Player tab with that player's analysis already loading. Same rule for `view=awards` → Raid tab with the awards panel open and scrolled into view. Today `AnalyzeClient` defaults to the Raid tab whenever `tab` is absent; that default changes only for these two cases.

**Share CTA placement, measurement & protection (SHARE-03, OPS-01)**
- **D-13:** Contextual share buttons + persistent header Share. Each shareable thing gets its button where it is read. On mobile the contextual button sits at the top of its card, not below the fold. The bottom "Found this useful? Share it with your guild." glass bar is removed. No sticky share bar, no header-only menu.
- **D-14:** One `share_action` PostHog event with `kind: "report_link" | "player_link" | "awards_link" | "discord_text"` plus `report_code`, `fight_id`, `tab` (and the standing `consent_gate_path` super property). Share rate = distinct sessions with any `share_action` ÷ distinct sessions with `analysis_complete`. The legacy `share_link_copied` and `discord_copied` events keep firing for this phase (dual-emit); their removal is a later-phase cleanup. The exact HogQL for the share-rate figure is recorded in the OPS-01 gate doc for this phase.
- **D-15:** The protected-elements checklist is a doc plus a machine check, following the `seo-invariants`/`token-audit` pattern: `docs/PROTECTED-ELEMENTS.md` lists every protected element, each DOM element carries a stable `data-protected="…"` attribute, and `scripts/protected-elements.mjs` fails when any listed attribute is missing from the rendered analyze page. The script is added to the OPS-01 ship gate and named in ROADMAP Phase 4/7 notes as a hard input. Reversibility: costly — Phase 4's ad-placement whitelist and Phase 7's per-route SEO gate both consume this file and these attribute names.
- **D-16:** Inbound attribution via a `ref` param on every copied link (`ref=share` for the report link, `ref=parse` for a player permalink, `ref=awards` for an awards link). On first load the analyze page captures `share_landing` with the ref kind, then strips `ref` from the address bar (`history.replaceState`). The canonical is already param-free, so SEO is unaffected; the OG route ignores `ref`.

### Claude's Discretion
- The exact award pool (names, trigger thresholds, priority order, per-award icon) — drafted by Claude, reviewed by the user before ship (D-04); tie-breaking when several players qualify (list up to 2–3 names, then "+N").
- How the `/og` route obtains raid-overview data for `view=awards` (POST to `/api/raid-overview` via the same origin-pinned `fetchJson` pattern) and what unfurls when that call is slow or fails — must never fail the unfurl; the existing `ReportCard` fallback is acceptable, a "card still cooking" variant is fine.
- Cache headers / TTL for the awards OG image; whether the awards rules run in the OG route or are exposed through a small API the UI panel also reads (prefer one engine module consumed by both so the panel rows and the image can never disagree).
- The in-app card preview mechanism (an `<img>` pointing at the `/og` URL is fine; no client-side canvas rendering).
- Whether awards rows in the panel link to the player's scorecard.
- Button copy, "Copied!" confirmation styling, icon choices — must use `@theme` tokens (token-audit / theme-parity stay green).
- Share-button behaviour when the report failed to load or is private: no share buttons render; the `noindex` shell is unchanged.
- File layout for the awards engine (`lib/awards-engine.ts` + `lib/awards-engine.test.ts` with fixtures from `lib/__fixtures__/`), the `data-protected` attribute vocabulary, and the `scripts/protected-elements.mjs` mechanism.

### Deferred Ideas (OUT OF SCOPE)
- "All Bosses" aggregate raid-night awards card (Most Deaths All Night, etc.) — needs aggregate rule definitions; raid-overview runs per fight today. Candidate for a later share iteration.
- Percentile- and timeline-based awards ("Best Parse 94th pct", "Longest AFK") — would need per-raider `/api/analyze` fan-out or paginated casts fetches; revisit if the raid-overview-only pool proves too thin.
- Retiring the legacy `share_link_copied` / `discord_copied` events once one phase of dual-emit has established the `share_action` series.
- Auto-posting new public reports to Discord — SHARE-04, Phase 5 (after COMM-01).
- Deep-linkable timeline permalink (Phase 2 deferred item) — not needed by this phase's share surfaces.
- Auto-posting reports to Discord via bot/webhook, ad slots/ad code, redesigning the analyze page beyond share-surface needs, new indexable routes, an "All Bosses" aggregate awards card, and new analysis metrics (awards are computed from data the engines already produce).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|--------------|--------------------|
| SHARE-01 | User can generate a roast/award-style shareable card per fight (auto-generated awards, Discord-shareable image built on existing OG infra) | `lib/awards-engine.ts` design (Pattern 1), the `view=awards` branch on the existing `app/og/route.tsx` (Pattern 2), full `RaidOverviewResult`/`ReportMeta.fights` shapes verified as sufficient input (D-03), Satori text-overflow and Discord-caching pitfalls documented |
| SHARE-02 | User can share a per-player permalink with a player-specific OG image ("look at MY parse") | Existing `PlayerCard` branch + `computeHealerMetrics` reuse for D-10 receipts, normalized-URL pattern (`updateUrlParam`/`useSearchParams`) for D-09, `metadataBase`/relative-OG-URL resolution confirmed |
| SHARE-03 | Share actions are prominent in the analyze UI and protected from ad/redesign crowding (share CTA + OG unfurl on the protected-elements checklist) | `scripts/seo-invariants.mjs`/`scripts/token-audit.mjs` node-script gate pattern for `scripts/protected-elements.mjs`; existing `AnalyzeClient.tsx` button/bar locations identified for D-13 relocation; `posthog.register` super-property mechanism confirmed to cover new `share_action`/`share_landing` events with no extra wiring (D-14/D-16) |
</phase_requirements>

## Summary

Phase 3 is almost entirely an *extension* phase, not a new-infrastructure phase. Every piece it
needs already exists and already works in production: `app/og/route.tsx` already renders a
per-player OG card from `/api/analyze` output with a documented "never fail an unfurl" contract;
`generateMetadata` in `app/analyze/[reportCode]/page.tsx` already forwards `fight`/`source` into
that OG URL while keeping the canonical param-free; `RaidOverviewResult` already carries every
field the award pool needs (deaths with timestamps, consumables, missing enchants, activity,
healer overheal); and `lib/healer-metrics.ts` already exists as the one shared helper the
per-player receipts must reuse. No new npm package, no new API route, no new indexable surface,
and no new runtime is required — this phase adds one pure module (`lib/awards-engine.ts`), one
new branch in an existing route (`view=awards`), a few additive fields on an existing component
(`PlayerCard`), and reshuffles where existing buttons live.

The two real risk areas are (1) getting the Satori/OG constraints right for a denser card (5-6
award rows vs. today's two-stat player card) without breaking the "same image in-app and in
Discord" guarantee (D-06), and (2) the landing/URL-state wiring for `view=awards` and `ref=` so
D-12's auto-tab-open and D-16's attribution funnel behave exactly as specified without disturbing
the existing `tab`/`fight`/`source` URL contract `AnalyzeClient.tsx` already owns. Both are
tractable with patterns already live in this codebase — this is why confidence is HIGH.

**Primary recommendation:** Build one pure `lib/awards-engine.ts` module that takes
`RaidOverviewResult` (+ the fight's kill/wipe/bossPercentage from `ReportMeta.fights`) and returns
a fixed-shape `AwardsResult` (fired awards, ranked, capped at 5-6); consume that same module from
both the `/og` route's new `view=awards` branch and the Raid tab's new awards panel component, so
the two can never disagree (the same principle Phase 2 D-08 established for healer metrics).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Award rule evaluation (which awards fired, ranking) | Business logic (`lib/`) | — | Pure function over already-fetched data; must be identical for OG image and in-app panel (D-02/D-08 pattern) |
| Awards card image rendering | API / Backend (`app/og/route.tsx`, Satori) | — | Existing OG infra; Discord/unfurl bots only ever hit this route, never a React component |
| Awards panel + inline preview | Browser / Client (`app/components/RaidOverview.tsx`) | — | Renders the same `/og` image via `<img>` plus the fired-awards list read from the shared engine or a thin API |
| Per-player permalink OG receipts | API / Backend (`app/og/route.tsx` `PlayerCard`) | Business logic (`lib/healer-metrics.ts`) | Receipts must reuse the existing healer-metrics helper so the number never drifts from the player page |
| Share CTA placement (buttons) | Browser / Client (`ComparisonSummary.tsx`, `RaidOverview.tsx`, `AnalyzeClient.tsx`) | — | Pure UI; no server involvement beyond the permalink shape itself |
| URL state (`view`, `ref`, `tab`, `source` landing rules) | Frontend Server (SSR: `generateMetadata`) + Browser (Client: `AnalyzeClient.tsx`) | — | `generateMetadata` forwards params into the OG URL server-side; the landing/auto-tab and `ref`-strip logic is client-side `history.replaceState` |
| Protected-elements enforcement | Build/CI tooling (`scripts/protected-elements.mjs`) | — | Same node-script gate pattern as `seo-invariants.mjs`/`token-audit.mjs`, run against a rendered page, not a runtime concern |
| Share-rate measurement | Analytics (PostHog client capture) | — | `posthog.capture` from client components; no new backend aggregation needed (HogQL query against existing event stream) |

## Standard Stack

### Core

No new dependency is required for this phase — everything is built on packages already in
`package.json` `[VERIFIED: package.json]`.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` (`next/og` `ImageResponse`) | 16.1.6 | Satori-based OG image rendering | Already in use in `app/og/route.tsx`; no alternative needed |
| `react` / `react-dom` | 19.2.3 | Component rendering (OG JSX tree + UI panel) | Already the project's UI layer |
| `posthog-js` | ^1.360.0 | `share_action` / `share_landing` capture | Already the project's only analytics client; `consent_gate_path` super property already registered (`app/components/PostHogProvider.tsx`) so no extra wiring is needed for the consent-gate requirement |
| `vitest` | ^4.1.10 | `lib/awards-engine.test.ts` | Already the project's only test runner; `vitest.config.ts` restricts `test.include` to `lib/**/*.test.ts` and `app/**/*.test.ts` with `environment: "node"` `[VERIFIED: vitest.config.ts:1-15]` — a pure `.ts` engine module fits this directly with no config change |

Verified versions per `package.json` `[VERIFIED: package.json]`:
```
"next": "16.1.6"
"react": "19.2.3"
"posthog-js": "^1.360.0"
"vitest": "^4.1.10"
```

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.576.0 | Icons for new buttons ("Share my parse", "Copy awards link") | Reuse `Link2`/`Copy`/`Check` exactly as `AnalyzeClient.tsx`/`ComparisonSummary.tsx` already do |
| shadcn `Button` (`@/components/ui/button`) | n/a (local) | Every new CTA | Already the project's only button primitive |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `app/og/route.tsx` with a `view=awards` branch | A dedicated `/og/awards` route | Rejected by D-05 explicitly — a second route would duplicate the origin-pinned fetch/fallback logic and complicate the "same image everywhere" guarantee; the existing route's branching-by-query-param shape already does this cleanly |
| Client-side canvas rendering for the in-app preview | An `<img src="/og?...">` | Discretion item resolves this explicitly toward `<img>` — canvas rendering risks drifting from the Satori output Discord actually shows, defeating D-06's "see exactly what will unfurl" guarantee |
| A new small `/api/awards` endpoint returning fired awards as JSON | One shared `lib/awards-engine.ts` consumed directly by both the OG route (server) and the Raid tab panel (also server-fetchable via the already-fetched `raid.result`) | The panel already has `RaidOverviewResult` in memory once the Raid tab loads (via `useRaidOverview`) — computing awards client-side from that same object with the same pure function avoids a network round-trip; the OG route computes the same function server-side from its own POST to `/api/raid-overview`. No new endpoint needed. |

**Installation:** None — no new packages.

## Package Legitimacy Audit

No external packages are introduced by this phase. Every library used (`next`, `react`,
`posthog-js`, `lucide-react`, `vitest`) is already installed and in production use.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Discord / any link-unfurl bot
        │  GET /analyze/{code}?fight={id}&view=awards
        ▼
generateMetadata (SSR)                    ┌─────────────────────────────┐
  - getReportMeta(code)  ───────────────▶ │  Upstash Redis (shared      │
  - forwards fight + view into            │  result + query cache)      │
    og:image = /og?report=&fight=&view=   └─────────────────────────────┘
        │                                              ▲
        │ <meta og:image="/og?...view=awards">         │ cache hit/miss
        ▼                                              │
   Discord fetches /og?report=&fight=&view=awards ─────┘
        │
        ▼
  app/og/route.tsx  GET handler
        │  view === "awards"?
        ├─ yes → fetchJson(POST /api/raid-overview {reportCode, fightId})
        │           │
        │           ▼
        │      buildRaidOverview() [already cached under rpb-{code}-{fight}]
        │           │
        │           ▼
        │      computeAwards(RaidOverviewResult, fightMeta)  <- NEW lib/awards-engine.ts
        │           │
        │           ▼
        │      <AwardsCard/> Satori render → ImageResponse (1200x630)
        │
        ├─ no, fight+source valid → existing PlayerCard branch (+ D-10 receipts)
        └─ no, neither → existing ReportCard branch (unchanged fallback)

Browser (Raid tab)
        │  useRaidOverview() already fetches /api/raid-overview for the table
        ▼
  RaidOverview.tsx
        │  computeAwards(data, fightMeta)  <- SAME lib/awards-engine.ts, client-side
        ▼
  Awards panel: fired-award rows + <img src="/og?...view=awards"> preview
        │  "Copy awards link" → clipboard.writeText(normalized permalink with ref=awards)
        ▼
  posthog.capture("share_action", { kind: "awards_link", ... })
```

### Recommended Project Structure

```
lib/
├── awards-engine.ts           # NEW — pure computeAwards(RaidOverviewResult, fightCtx) -> AwardsResult
├── awards-engine.test.ts      # NEW — driven by lib/__fixtures__/demo-raid-overview.json + synthetic RaidOverviewResult fixtures for conditions the demo fight doesn't exercise
├── healer-metrics.ts          # EXISTING — reused as-is by PlayerCard receipts (D-10)
├── raid-overview-engine.ts    # EXISTING — unchanged; the only data source for award rules (D-03)
└── wcl-types.ts               # EXISTING — RaidOverviewResult etc.; add AwardsResult/AwardRow types here per existing convention

app/
├── og/route.tsx                # EXTENDED — new `view=awards` branch + PlayerCard receipts
├── analyze/[reportCode]/
│   ├── page.tsx                 # EXTENDED — generateMetadata forwards `view`
│   └── AnalyzeClient.tsx        # EXTENDED — D-12 landing rules, D-16 ref capture/strip, D-13 bottom-bar removal
└── components/
    ├── RaidOverview.tsx          # EXTENDED — awards panel + preview + "Copy awards link"
    └── ComparisonSummary.tsx     # EXTENDED — "Share my parse" primary, "Copy for Discord" secondary

docs/
└── PROTECTED-ELEMENTS.md        # NEW — D-15 checklist

scripts/
└── protected-elements.mjs       # NEW — D-15 machine check, same shape as seo-invariants.mjs
```

### Pattern 1: Shared pure engine consumed by two renderers (Phase 2 D-08 lineage)

**What:** One function computes a result; both the OG image and the in-app UI read that same
result, never independently deriving it.
**When to use:** Any time the same computed fact must appear in two places that must never
disagree — exactly the constraint D-02/D-06/D-08 state for awards.
**Example (existing precedent in this codebase):**
```typescript
// Source: lib/healer-metrics.ts:1-20 (read this session)
/**
 * Computes a healer's effective HPS, overheal percent and healing uptime from
 * the un-scoped per-player Healing row ... Single source of truth for both
 * call sites — lib/raid-overview-engine.ts (buildRaidOverview, feeding the
 * raid-wide Healer Breakdown panel) and app/api/analyze/route.ts (the healer
 * branch of the player-analysis route) — so the raid table and the player
 * page can never show a different number for the same healer and fight (D-08).
 */
export function computeHealerMetrics(
  row: HealerTableRow | undefined,
  fightDurationMs: number
): HealerMetricsComputed { /* ... */ }
```
`lib/awards-engine.ts` should carry the identical shape of doc comment and the identical
guarantee: both `app/og/route.tsx`'s `view=awards` branch and `RaidOverview.tsx`'s new awards
panel call the same exported function on the same `RaidOverviewResult`.

### Pattern 2: Origin-pinned server-to-server fetch with "never fail an unfurl"

**What:** The OG route fetches its own API by an absolute, environment-pinned origin (production
hardcodes `https://parseforge.gg`; dev falls back to the request origin), and every fetch failure
degrades to a branded fallback card rather than throwing.
**When to use:** Any new OG branch (the `view=awards` branch is a third instance of this pattern).
**Example:**
```typescript
// Source: app/og/route.tsx:33-41, 183-228 (read this session)
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
// ...
export async function GET(request: NextRequest) {
  const size = { width: 1200, height: 630 };
  const headers = { "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400" };
  try {
    // ... branch on report/fight/source (and, new: view) ...
  } catch {
    // Never fail an unfurl — fall back to a branded report card.
    return new ImageResponse(<ReportCard meta={null} reportCode="" />, { ...size, headers });
  }
}
```
The new `view=awards` branch must: (1) validate `view === "awards"` before attempting the
raid-overview fetch, (2) require `fight` to be a valid non-negative integer (no `source` needed —
awards are fight-scoped, not player-scoped), (3) fall back to the existing `ReportCard` branch — not
a new "still cooking" component — if `fetchJson` returns `null` or the awards computation yields
zero fired awards (the discretion note allows a "card still cooking" variant, but reusing
`ReportCard` is simpler and already proven never to fail).

### Pattern 3: URL-param-driven view state with `updateUrlParam`

**What:** `AnalyzeClient.tsx` already reads `tab`/`fight`/`source` from `useSearchParams()` on
mount and pushes changes via `router.replace()` without full navigation.
**When to use:** D-12's landing rules and D-16's `ref` capture/strip both extend this exact
mechanism — no new state-management library needed.
**Example (existing precedent):**
```typescript
// Source: app/analyze/[reportCode]/AnalyzeClient.tsx:35-60 (read this session)
const [activeTab, setActiveTab] = useState<TabMode>(
  (searchParams.get("tab") as TabMode) || "raid"
);
const updateUrlParam = useCallback(
  (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value !== null) params.set(key, value); else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  },
  [router]
);
```
D-12's new landing rule is a one-line change to the initial-state computation:
`tab` absent AND `source` present → default to `"player"` (the existing
`usePlayerAnalysis` auto-run effect already fires once `activeTab === "player"` and both
`selectedFight`/`selectedSource` are set — confirmed by reading
`app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts:96-104` this session — so no new fetch
wiring is needed, only the initial tab default). `view=awards` → default to `"raid"` (already
the fallback default) plus a scroll-into-view + "open the awards panel" flag threaded down as a
prop or a second URL-derived boolean.
D-16's `ref` strip is one `useEffect` calling `history.replaceState` after capturing
`share_landing` — `router.replace` (Next's App Router API) already removes a param without a
full reload elsewhere in this file, so the same primitive applies.

### Anti-Patterns to Avoid

- **Computing awards or receipts independently in two places:** any temptation to hand-roll the
  award ranking a second time inside `RaidOverview.tsx` instead of importing
  `lib/awards-engine.ts` reintroduces the exact drift risk D-02/D-08 exist to prevent.
- **Fetching per-player `/api/analyze` for awards:** D-03 explicitly forbids a per-raider
  analyze fan-out for awards this phase — the raid-overview call already has everything the
  pool needs (deaths, consumables, missing enchants, activity, healer overheal).
- **A new indexable route for the awards card:** D-05 forbids this — everything stays a `view=`
  param on the existing param-free-canonical `/analyze/{code}` page.
- **Forwarding raw `location.href` as the "normalized" share link:** the header Share button's
  current `handleShareLink` (`app/analyze/[reportCode]/AnalyzeClient.tsx:99-106`) copies
  `window.location.href` verbatim, which can carry a stale `tab`/incidental param combination.
  D-09 requires building the normalized URL explicitly (`/analyze/{code}?fight={id}&source={id}&ref=...`
  with `tab` stripped), not reusing `location.href`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Award trigger/ranking logic in two places | A second copy of the rule evaluation inside the UI panel | One `lib/awards-engine.ts` export consumed by both `app/og/route.tsx` and `RaidOverview.tsx` | Prevents the OG image and in-app preview from ever showing a different set of awards for the same fight (D-06's "same image everywhere" contract depends on this) |
| Healer effective-HPS/overheal math for the PlayerCard receipts | A second inline calculation in `app/og/route.tsx`'s `PlayerCard` | `computeHealerMetrics` from `lib/healer-metrics.ts` | Already the single source of truth per Phase 2 D-08; a second implementation would risk baking in a different healer number than the player page shows for the same fight |
| URL-param tab/view state | A new client state library or a custom router | The existing `useSearchParams()` + `updateUrlParam` pattern already in `AnalyzeClient.tsx` (and `useUrlTabState` in `lib/use-url-tab-state.ts` for any sub-view state) | Already proven, already shareable-by-URL, zero new dependency |
| Protected-elements enforcement | A bespoke visual-regression tool or manual checklist only | `scripts/protected-elements.mjs` in the same shape as `scripts/seo-invariants.mjs`/`scripts/token-audit.mjs` (render the live page, assert `data-protected="…"` attributes are present) | Matches the two existing node-script gates exactly; adding a third framework/tool would be inconsistent with the established gate pattern |

**Key insight:** This phase's entire technical risk surface is "don't let two renderers of the
same fact drift apart." The codebase already has one proven pattern for exactly that
(`lib/healer-metrics.ts` feeding two call sites, Phase 2 D-08) — the awards engine should be a
structural copy of that pattern, not a new design.

## Common Pitfalls

### Pitfall 1: Discord caches the unfurl by exact URL, including images, for hours to days

**What goes wrong:** A developer pastes a `?view=awards` link while testing, gets a stale or
broken card, fixes the bug, re-pastes the *same* URL, and still sees the old broken image —
concluding the fix didn't work.
**Why it happens:** Discord caches embed metadata and the proxied image separately, by exact URL,
and its cache duration is undocumented (estimates range from minutes to days across third-party
sources) `[CITED: https://previewog.com/discord-link-preview/, https://opengraphplus.com/consumers/discord/caching]`.
**How to avoid:** During manual verification, append a throwaway query param (e.g. `&v=2`) to
force Discord to treat it as a new URL, or test in a fresh/uncached channel. Do not rely on
re-pasting the exact same link as a verification method.
**Warning signs:** "It still shows the old card" after a code fix that a direct `curl`/browser
fetch of `/og?...` proves is already correct.

### Pitfall 2: Satori text overflow with variable-length player names / "+N" lists

**What goes wrong:** An award row like "Flaskless Wonder — Healbot, Grimm, Thrallfan, Zog" (D-04's
"list up to 2-3 names, then +N" tie-break) can overflow its row width, especially with the raid's
longest real names, and Satori has no automatic reflow the way a browser layout engine does.
**Why it happens:** Satori supports `text-overflow: ellipsis` with `-webkit-line-clamp` for
clamping, but only when those properties are set explicitly — it does not auto-wrap or auto-shrink
text by default `[CITED: html2img.com/articles/satori-css-limits]`.
**How to avoid:** Cap the display name list at 2-3 names (already the discretion-item plan),
enforce it in `lib/awards-engine.ts` (not just visually) so the OG renderer never receives more
names than fit, and set an explicit `maxWidth` + `textOverflow: "ellipsis"`/`whiteSpace: "nowrap"`
on the award-row name span as the existing `PlayerCard`/`ReportCard` already do for their own
long-text fields (`app/og/route.tsx:106-111, 157-160`).
**Warning signs:** A rendered award row with a name run into the row below it, or a name cut off
mid-character with no ellipsis.

### Pitfall 3: The "anon" rate-limit bucket is shared across every server-to-server OG fetch

**What goes wrong:** Under a traffic spike (e.g. several different fight-award links go viral in
the same 60-second window), the `/og` route's internal `fetch()` calls to `/api/raid-overview`
(and, for player cards, `/api/analyze`) do not forward the original request's
`x-forwarded-for` header, so every such internal call resolves to the same rate-limit identity —
`clientKey()` returns `"anon"` for any request lacking that header `[VERIFIED: lib/rate-limit.ts:50-54]`
— and shares one 30-requests-per-60-seconds budget `[VERIFIED: lib/constants.ts:135-142, quoting `"raid-overview": 30`
and `RATE_LIMIT_WINDOW = "60 s"`]` across *all* awards-card unfurls raid-wide, not per report.
**Why it happens:** This is pre-existing behavior (the current `PlayerCard` branch has the exact
same characteristic today, calling `/api/analyze` the same unauthenticated way) — not a regression
this phase introduces, but the awards branch doubles the surface exposed to it.
**How to avoid:** No code change is required to stay safe — `fetchJson` already returns `null` on
a non-2xx response (including 429), and the "never fail an unfurl" contract already falls back to
`ReportCard` in that case. Just don't add code that treats a `null` raid-overview response as an
error to surface to the visitor; keep the same silent-fallback behavior the PlayerCard branch uses.
**Warning signs:** A `429` response logged for the `raid-overview` bucket coinciding with a "why
did this awards card show the generic report card?" report — confirm the fallback fired, not a bug.

### Pitfall 4: `generateMetadata`'s relative `/og?...` URL depends on `metadataBase`

**What goes wrong:** Adding `view` to the `ogParams` in `generateMetadata` and testing only
locally (`http://localhost:3000`) can mask a case where the resolved `og:image` URL isn't a fully
qualified `https://parseforge.gg/og?...` URL — several unfurl consumers (not just Discord) require
an absolute URL in `og:image`.
**Why it happens:** Next.js resolves a relative `images` URL in `openGraph`/`twitter` metadata
against `metadataBase`, which this project already sets to `new URL("https://parseforge.gg")`
`[VERIFIED: app/layout.tsx:22, quoting `metadataBase: new URL("https://parseforge.gg")`]` — so this
already works correctly for the existing `fight`/`source` params, and `view` needs no special
handling beyond following the exact same `ogParams.set(...)` pattern already in
`generateMetadata` (`app/analyze/[reportCode]/page.tsx:37-40`).
**How to avoid:** Add `if (view) ogParams.set("view", view);` alongside the existing `fight`/`source`
lines — don't build a second, parallel URL-construction path.
**Warning signs:** An `og:image` meta tag missing the `parseforge.gg` host when inspected via
`view-source:` on a production render.

### Pitfall 5: `ref` values must be allowlisted before they reach a PostHog event property

**What goes wrong:** A hand-edited or bot-crafted URL like `/analyze/{code}?ref=<arbitrary-string>`
gets captured verbatim into the `share_landing` event's `ref` property, inflating PostHog's
property-value cardinality for a field meant to be a fixed 3-value enum (`share`/`parse`/`awards`)
and violating this project's own logging convention.
**Why it happens:** `ref` arrives from a URL query string, which is untrusted input by definition
(see project's untrusted-input-boundary policy) — nothing currently validates it before this
phase, because `ref` doesn't exist yet.
**How to avoid:** Validate `ref` against the exact allowlist (`"share" | "parse" | "awards"`)
before calling `posthog.capture("share_landing", { ref })`; an unrecognized value should be
dropped (event not fired) rather than passed through, consistent with the project's `Server-side
only` / `low-cardinality` logging conventions (`.claude/CLAUDE.md` "Logging" section).
**Warning signs:** A PostHog `share_landing` event property-values list showing more than 3
distinct `ref` values.

## Code Examples

### Existing PlayerCard branch (extend for D-10 receipts)

```typescript
// Source: app/og/route.tsx:93-143 (read this session)
function PlayerCard({ data }: { data: AnalysisResult }) {
  const classColor = CLASS_COLORS_HEX[data.playerClass] ?? "#FFFFFF";
  const grade = data.metricPercentiles?.overallGrade ?? "—";
  const gradeColor = GRADE_HEX[grade] ?? MUTED;
  const score = data.metricPercentiles?.overallScore ?? 0;
  const pct = Math.round(data.dps?.percentile ?? 0);
  const dps = data.dps?.playerDps ?? 0;
  const unit = data.playerRole === "healer" ? "HPS" : "DPS";
  // D-10 receipts to add here: Kill/Wipe + fight length (from ReportMeta.fights via a new
  // fetch, or forward encounterID/kill/bossPercentage as extra query params the way `fight`
  // already is), "vs top {N} {spec}s" (data.topPlayersCount / data.topPlayerName / data.playerSpec
  // — all already on AnalysisResult, no new fetch needed), and one proof line: healers use
  // data.healer.overhealPercent (already computed via computeHealerMetrics in the analyze route),
  // DPS use data.casts.playerActiveTime (already on AnalysisResult.casts).
}
```

### Existing RaidOverviewResult shape the awards engine consumes

```typescript
// Source: lib/wcl-types.ts:441-477, 489-510 (read this session)
export interface DeathDetail {
  playerName: string;
  playerClass: string;
  sourceId: number;
  /** Milliseconds into the fight when the death occurred */
  fightTimeMs: number;
  damage: number;
  healing: number;
}

export interface RaidPlayerMetrics {
  sourceId: number;
  name: string;
  className: string;
  spec: string;
  role: RaidRole;
  throughput: number; // DPS or HPS
  deaths: number;
  deathDetails: DeathDetail[];
  avoidableDamage: number;
  activityPercent: number;
  consumables: ConsumableStatus;
  missingEnchants: number;
  avgItemLevel: number;
}

export interface HealerMetrics {
  sourceId: number;
  name: string;
  className: string;
  spec: string;
  hps: number;
  totalHealing: number;
  overhealPercent: number;
  activityPercent: number;
}

export interface RaidOverviewResult {
  encounterName: string;
  fightDuration: number;
  players: RaidPlayerMetrics[];
  /** All deaths in chronological order across all players */
  deathTimeline: DeathDetail[];
  /** Raid-wide buff coverage based on class composition */
  raidBuffCoverage: RaidBuffCoverage[];
  /** Healer-specific metrics */
  healerMetrics: HealerMetrics[];
}
```
Every award in D-02's pool (First to Die, Flaskless Wonder, Iron Man/no deaths, Top DPS, Top HPS,
GCD Tourist [low activityPercent], Best Prepared [avgItemLevel/enchants], etc.) is derivable from
this single object plus the fight's `kill`/`bossPercentage` from `ReportMeta.fights`
(`[VERIFIED: lib/wcl-types.ts:566-575]`, quoting `fights: Array<{ id: number; name: string;
encounterID: number; kill: boolean; difficulty: number; bossPercentage: number; duration: number;
}>`) — no new WCL query, matching D-03.

### `/api/raid-overview` request shape the OG route's awards branch must send

```typescript
// Source: app/api/raid-overview/route.ts:106-110 (read this session)
export async function POST(request: NextRequest) {
  const parsed = await parseBody<{ reportCode: string; fightId: number }>(
    request, ["reportCode", "fightId"]
  );
  // ...cached under `rpb-${reportCode}-${fightId}` via cachedApiHandler...
}
```
The `/og` route's `view=awards` branch should POST exactly `{ reportCode, fightId }` — identical
to what `useRaidOverview.ts`'s client-side fetch already sends
(`[VERIFIED: app/analyze/[reportCode]/hooks/useRaidOverview.ts:29-33]`, quoting
`body: JSON.stringify({ reportCode, fightId: selectedFight })`) — so a freshly-viewed fight's
awards unfurl is warm against the same `rpb-{code}-{fight}` cache key.

### Consent-gate super property already covers new events with zero extra wiring

```typescript
// Source: app/components/PostHogProvider.tsx:139-146 (read this session)
function applyOutcome(outcome: ReturnType<typeof deriveConsentGateOutcome>) {
  if (!outcome) return;
  posthog.register({ consent_gate_path: outcome.gatePath });
  if (outcome.optIn) posthog.opt_in_capturing({ captureEventName: false });
  if (outcome.startReplay) posthog.startSessionRecording();
  if (outcome.event && !capturedGatePathRef.current.has(outcome.gatePath)) {
    capturedGatePathRef.current.add(outcome.gatePath);
    posthog.capture(outcome.event, outcome.eventProps);
  }
}
```
`posthog.register(...)` sets a **super property** that PostHog automatically attaches to every
subsequent `capture()` call on that client, including the new `share_action` and `share_landing`
events D-14/D-16 introduce. No additional code is needed to satisfy "the standing
`consent_gate_path` super property" requirement — it is already global once registered.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Bottom-of-page "Found this useful? Share it with your guild." glass bar as the only secondary share CTA | Contextual share buttons at the point of read (player scorecard, awards panel) + persistent header Share | This phase (D-13) | The removed bar is also the exact slot Phase 4's ad placement would want — removing it now avoids a later conflict, per the phase's own notes |
| `handleShareLink` copies `window.location.href` verbatim | Build a normalized `/analyze/{code}?fight={id}&source={id}&ref=share` URL explicitly, stripping `tab` | This phase (D-09) | Prevents a copied link from carrying incidental/stale params (e.g. a leftover `tab=cla`) into a link meant to represent "the report" |
| `share_link_copied` / `discord_copied` as the only share telemetry | One `share_action` event with a `kind` discriminator, dual-emitted alongside the legacy events for one phase | This phase (D-14) | Lets the ~2.8% baseline series continue uninterrupted while the new unified metric comes online; legacy event retirement is explicitly deferred |

**Deprecated/outdated:** None yet — `share_link_copied`/`discord_copied` are retained
deliberately (dual-emit) per D-14, not deprecated this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Discord's embed cache duration is on the order of minutes to days (exact figure not published) | Common Pitfalls, Pitfall 1 | Low — affects only manual verification technique (use a cache-busting param), not shipped behavior |
| A2 | Satori's `-webkit-line-clamp`/`text-overflow: ellipsis` behave as documented for third-party Satori/Next.js integrations generally (not confirmed against this exact Next.js 16.1.6 + Satori pairing in this repo) | Common Pitfalls, Pitfall 2 | Low-medium — worth a quick local `ImageResponse` render check during implementation before trusting long-name rows to clip cleanly; fallback is simply capping name-list length harder in the engine (already planned) |
| A3 | No developer-run EEA/UK/CH browser session covers `share_action`/`share_landing` specifically (only the general TCF wiring was proven live in Phase 2.1) | Validation Architecture / OPS-01 | Low — the consent-gate wiring itself is proven (Phase 2.1 D-09), and these are ordinary `posthog.capture()` calls through the same gated client; risk is theoretical, not a new mechanism |

**None of these are load-bearing for the plan's core mechanism** — they affect verification
technique and cosmetic edge cases, not architecture or data flow, which are fully `[VERIFIED]`
against source read this session.

## Open Questions

1. **Where does the "kill/wipe/boss%" header data for the awards card come from inside `/og/route.tsx`?**
   - What we know: `ReportMeta.fights[].kill`/`.bossPercentage` carries this
     (`[VERIFIED: lib/wcl-types.ts:566-575]`), and the route already fetches `ReportMeta` via
     `/api/report/${reportCode}` for the `ReportCard` fallback branch.
   - What's unclear: whether the awards branch should do a second fetch to `/api/report/{code}`
     (to get `fights[]`) alongside the `/api/raid-overview` POST, or whether `RaidOverviewResult`
     should be extended to carry `kill`/`bossPercentage` directly so one fetch suffices.
   - Recommendation: fetch `/api/report/{code}` too (it's the cheapest, highest-TTL-cached route
     in the system — `RATE_LIMITS.report = 60` `[VERIFIED: lib/constants.ts:135-142]` — and reusing
     it avoids widening `RaidOverviewResult`'s contract for a UI-only header field the Raid tab's
     table doesn't otherwise need). Confirm during planning which is cheaper in practice once the
     exact awards-panel data flow is drafted.

2. **Exact award pool content (names, trigger thresholds, priority order, icons)**
   - What we know: D-02/D-04 fix the mechanism (12-15 rule pool, top 5-6 shown, stat-backed rows,
     tone constraints) and explicitly assign drafting to Claude with a mandatory human-review
     checkpoint before ship.
   - What's unclear: the actual list — this is intentionally not resolved by research, since
     D-04 makes it a plan-time drafting task with a checkpoint, not a research question.
   - Recommendation: the plan should include an explicit `checkpoint:human-verify` (or
     equivalent) step presenting the full drafted pool for review before the awards-engine tests
     are finalized against it.

## Environment Availability

Skipped — this phase introduces no new external tool/service/runtime dependency. It extends an
existing Next.js route, an existing Redis-backed cache, and existing PostHog instrumentation, all
already verified live in this project (Phase 1/2/2.1 gates).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.10 `[VERIFIED: package.json]` |
| Config file | `vitest.config.ts` — `environment: "node"`, `include: ["lib/**/*.test.ts", "app/**/*.test.ts"]` `[VERIFIED: vitest.config.ts:1-15]` |
| Quick run command | `npx vitest run lib/awards-engine.test.ts` |
| Full suite command | `npm test` (= `vitest run`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| SHARE-01 | Award pool fires only when trigger conditions hold; top 5-6 shown ranked by fixed priority; tie-break lists 2-3 names + "+N" | unit | `npx vitest run lib/awards-engine.test.ts` | ❌ Wave 0 |
| SHARE-01 | `/og?...&view=awards` returns a 1200x630 `ImageResponse` for a valid fight, and falls back to `ReportCard` on fetch failure or zero fired awards | integration (route-level, may need a lightweight fetch-mock or a live local-dev smoke check per project convention — no existing `route.test.ts` precedent for `/og`) | manual/dev-server smoke check (`curl` or browser against local `next dev`) — no automated route test exists for `/og` today; follow existing project convention rather than introducing a new integration-test harness | ❌ Wave 0 (or explicitly scoped to manual verification, matching how `app/og/route.tsx`'s existing branches are verified today — no `route.test.ts` was found for this file) |
| SHARE-02 | Player permalink normalizes to `/analyze/{code}?fight={id}&source={id}&ref=parse`, strips `tab` | unit (a small pure "build normalized URL" helper is testable in isolation) | `npx vitest run lib/<new-helper>.test.ts` (or colocate in an existing test file if the helper is small enough to live inline) | ❌ Wave 0 |
| SHARE-02 | PlayerCard OG receipts show the correct healer basis (effective-HPS percentile, not raw HPS) matching `computeHealerMetrics` | unit (extends existing coverage) | `npx vitest run lib/healer-metrics.test.ts` (existing file — extend if `PlayerCard` gains new derived fields; the underlying helper itself needs no new test if unchanged) | ✅ existing |
| SHARE-03 | `scripts/protected-elements.mjs` fails when a listed `data-protected` attribute is missing from the rendered analyze page | integration (node-script gate against a rendered page, same shape as `seo-invariants.mjs`) | `npm run protected-elements` (new script entry, mirroring `npm run seo-invariants`) | ❌ Wave 0 |
| OPS-01 | Share-rate HogQL query (distinct sessions with `share_action` ÷ distinct sessions with `analysis_complete`) documented and runnable | manual-only (PostHog query, not a code test) | N/A — recorded in the OPS-01 gate doc for this phase, per D-14 | N/A |

### Sampling Rate

- **Per task commit:** `npx vitest run lib/awards-engine.test.ts` (plus whatever other unit files a
  task touches)
- **Per wave merge:** `npm test` (full suite) + `npx tsc --noEmit` + `npm run lint`
- **Phase gate:** Full suite green, `npm run token-audit`, `npm run theme-parity`, and the new
  `scripts/protected-elements.mjs` all green before `/gsd-verify-work`; `scripts/seo-invariants.mjs`
  re-run per its own established convention (OPS-01 gate Part 1).

### Wave 0 Gaps

- [ ] `lib/awards-engine.ts` + `lib/awards-engine.test.ts` — the core new module; test fixtures
      should combine the recorded `lib/__fixtures__/demo-raid-overview.json`-derived
      `RaidOverviewResult` (a realistic "does it produce sane output on real data" case — note
      this fixture's fight has **zero deaths** per `lib/__fixtures__/README.md`, so it cannot
      exercise death-dependent awards) with **hand-built synthetic `RaidOverviewResult` objects**
      for each individual trigger condition (a death, a missing flask, a missing enchant, an
      Iron Man/zero-death case, a tie needing "+N" truncation, etc.) — the engine's input type is
      the already-decoupled `RaidOverviewResult`, so synthetic fixtures are simple object literals,
      not new WCL recordings.
- [ ] `scripts/protected-elements.mjs` + `docs/PROTECTED-ELEMENTS.md` — new gate; no existing file
      to extend.
- [ ] A `route.test.ts`-style check (or documented manual smoke-check convention) for
      `app/og/route.tsx`'s new branch — this file currently has no automated test coverage of any
      kind (confirmed: no `app/og/route.test.ts` exists), so the plan should either introduce one
      or explicitly document that OG route verification stays manual/dev-server-based, consistent
      with the file's current (untested) status quo.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No accounts/sessions exist in this product |
| V3 Session Management | No | Same as above |
| V4 Access Control | No | All report data is already public WCL data; no new access boundary is introduced |
| V5 Input Validation | Yes | `view` query param must be validated against an exact allowlist (`"awards"`) before branching, exactly as `fight`/`source` are already validated as non-negative integers (`app/og/route.tsx:206-211`); `ref` must be validated against `"share" \| "parse" \| "awards"` before being captured into a PostHog event property (Pitfall 5) |
| V6 Cryptography | No | No new secrets, tokens, or crypto primitives |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Unvalidated `view`/`ref` query params reaching a render branch or an analytics property | Tampering / Information Disclosure (cardinality pollution, not data leakage — all underlying data is already public) | Explicit allowlist check before branching or capturing, matching the existing `isValidReportCode`/integer-parse pattern already in `app/og/route.tsx` |
| Award content naming real players in a roast/gentle-jab tone | Reputational (not a STRIDE category, but explicitly a product-trust concern per D-01) | D-01's tone constraints ("never insulting", no full-roast headline) plus the D-04 human-review checkpoint before ship — a process control, not a code control |
| Server-to-server OG fetches sharing an "anon" rate-limit identity | Denial of Service (self-inflicted, low severity) | Already mitigated by the existing fail-open/never-fail-an-unfurl contract (Pitfall 3); no new code needed, just don't regress the existing fallback behavior |

## Sources

### Primary (HIGH confidence)
- `app/og/route.tsx` (read in full this session) — Shell/PlayerCard/ReportCard, fetchJson, GET handler, cache headers
- `app/analyze/[reportCode]/page.tsx` (read in full this session) — generateMetadata, canonical handling
- `app/analyze/[reportCode]/AnalyzeClient.tsx` (read in full this session) — tab state, updateUrlParam, handleShareLink, bottom share bar
- `lib/wcl-types.ts` (read in full this session) — RaidOverviewResult, RaidPlayerMetrics, DeathDetail, HealerMetrics, ReportMeta
- `lib/healer-metrics.ts` (read in full this session) — computeHealerMetrics, averageTopHealerMetrics
- `lib/raid-overview-engine.ts` (read in full this session) — buildRaidOverview, all award-relevant field derivations
- `app/components/RaidOverview.tsx` (read in full this session) — existing Raid tab structure, HealerPanel/DeathTimeline patterns to follow for the new awards panel
- `app/components/ComparisonSummary.tsx` (read in full this session) — formatForDiscord, handleCopyDiscord, existing scorecard patterns
- `app/api/raid-overview/route.ts`, `lib/api-utils.ts`, `lib/rate-limit.ts` (read in full this session) — request/cache/rate-limit shapes
- `app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts`, `useRaidOverview.ts`, `useReportMeta.ts` (read in full this session) — auto-run/auto-select effects relevant to D-12
- `lib/constants.ts` (read relevant sections this session) — CLASS_COLORS_HEX, GRADE_COLORS, RATE_LIMITS, RATE_LIMIT_WINDOW
- `lib/use-url-tab-state.ts` (read in full this session) — existing URL-backed sub-tab state helper
- `next.config.ts` (read relevant section this session) — CSP report-only config, img-src already permits same-origin `/og`
- `app/layout.tsx` (read relevant section this session) — `metadataBase` confirming relative OG URLs resolve to absolute
- `scripts/seo-invariants.mjs`, `scripts/token-audit.mjs` (read in full/relevant sections this session) — the node-script gate pattern `scripts/protected-elements.mjs` must follow
- `vitest.config.ts`, `package.json` (read in full this session) — test framework config and dependency versions
- `lib/__fixtures__/README.md`, `lib/raid-overview-engine.test.ts` (read relevant sections this session) — fixture provenance and existing test conventions
- `.planning/phases/03-share-loop/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` (read in full this session) — locked decisions, requirements, project history

### Secondary (MEDIUM confidence)
- [previewog.com — Discord Link Preview: How Embeds Work & Troubleshooting](https://previewog.com/discord-link-preview/) — Discord embed caching behavior
- [opengraphplus.com — How to Clear Discord Embed Cache and Force a Refresh](https://opengraphplus.com/consumers/discord/caching) — cache-busting technique
- [html2img.com — Satori's CSS limits: what it can and can't render](https://html2img.com/articles/satori-css-limits/) — text-overflow/line-clamp support in Satori

### Tertiary (LOW confidence)
- None used as load-bearing claims — all WebSearch findings above are corroborated across multiple independent sources and used only for the Common Pitfalls section, not for architecture decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; every library version confirmed against `package.json` read this session
- Architecture: HIGH — every data shape and code pattern quoted verbatim from source files read this session; the shared-engine pattern has a direct, working precedent (`lib/healer-metrics.ts`) in the same codebase
- Pitfalls: MEDIUM-HIGH — the OG-route-specific pitfalls (rate-limit sharing, metadataBase resolution) are `[VERIFIED]` against source; the Discord-caching and Satori-text-limit pitfalls are `[CITED]` from external docs/community sources, cross-checked across multiple independent pages

**Research date:** 2026-09-15
**Valid until:** 30 days (stable Next.js/Satori APIs and an internal-only architecture; re-check if Next.js or the `next/og` package majors bump before planning resumes)
