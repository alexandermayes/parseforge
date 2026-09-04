# Architecture Research: Growth/Design/Monetization Tracks on ParseForge

**Domain:** Integrating pSEO scale, ads, a design-token system, cross-site promotion, and share loops into an existing Next.js 16 App Router app
**Researched:** 2026-09-04
**Confidence:** HIGH (Next.js/Tailwind/CSP mechanics, verified against current docs + codebase) / MEDIUM (ads network-specific behavior, since no ad network is chosen yet)

This document extends `.planning/codebase/ARCHITECTURE.md` — it does not restate the existing system. It answers: where do the five new tracks attach to the existing SSR/ISR + engines + Redis architecture, what are the component boundaries, and in what order should they be built.

---

## Standing architectural fact-check (grounds every recommendation below)

Before designing new tracks, three existing facts change what "add X" actually means here:

1. **A design-token layer already exists.** `app/globals.css` already defines a `@theme inline` block mapping shadcn semantic tokens (`--color-primary`, `--color-border`, etc.) plus a second custom layer (`--gold-from/to`, `--arcane-from/to`, `--surface-0..3`, `--status-good/warn/bad/info`) on top of OKLCH `:root`/`.dark` values. The "design-token overhaul" is therefore **not greenfield** — it's (a) auditing where components bypass the tokens by hardcoding raw `oklch(...)` literals instead of `var(--surface-1)` etc. (e.g. `.surface-card` in `globals.css` itself hardcodes `oklch(0.17 0.015 270 / 70%)` instead of referencing `--surface-1`), and (b) deciding if the redesign needs new token *categories* (spacing scale, motion durations, elevation) beyond color/radius.
2. **CSP is report-only and already has a documented rationale for every current exception** (`next.config.ts` comments explain `unsafe-inline`/`unsafe-eval`/Wowhead/PostHog). Any ad network is a new script-src/connect-src/frame-src source and will very likely require `unsafe-inline`-adjacent allowances (ad tags often inject inline styles/scripts) — this is a hard input to the ads track, not a detail to defer.
3. **A share mechanism already exists** (`handleShareLink` in `AnalyzeClient.tsx`: clipboard copy + PostHog `share_link_copied` event, surfaced in two places including a dedicated "Copy for Discord" affordance) and **dynamic per-report OG images already exist** (`/og/route.tsx`, edge runtime, reuses the shared result cache). The "share-loop architecture" work is an *enhancement* of a working pipeline (raise 2.8% share rate), not new plumbing — the new work is a share permalink surface and swapping the plain URL-copy for something with more virality (pre-filled Discord embed quality, per-player deep link, leaderboard-style share card).

---

## Track 1 — Programmatic SEO pages at scale

### Component boundary

pSEO pages must NOT become a fourth parallel content system. They sit as a **new route group that reads the same engines/constants the interactive product already uses**, never a hand-authored fact database that can drift from what the tool actually computes.

```
app/
├── (marketing)/                      # new route group — pSEO + guides live here
│   ├── classes/[classSlug]/page.tsx       # e.g. /classes/paladin
│   ├── raids/[raidSlug]/page.tsx          # e.g. /raids/black-temple
│   ├── classes/[classSlug]/[raidSlug]/    # cross e.g. /classes/paladin/black-temple
│   └── guides/...                          # existing guides, unchanged
lib/
├── pseo/
│   ├── page-data.ts                  # pure functions: classSlug → { icon, colors, specs, bis-summary }
│   ├── copy-fragments.ts             # per-class/per-raid prose fragments (short, factual, engine-derived)
│   └── static-params.ts              # generateStaticParams sources (class list, raid/zone list)
```

- **Data source discipline:** every fact rendered on a pSEO page must trace back to `lib/constants.ts` / `lib/cla-constants.ts` (class/spec/raid/BiS ID databases already verified via the wago.tools regen workflow) or to aggregated, cached output of `cla-engine.ts`/`analysis-engine.ts` — never a new hand-typed content file. This is the direct mechanism for "grounded in real engine capabilities, not doorway pages": if a page can't cite a real constant or a real engine capability (e.g., "ParseForge's CLA audits X, Y, Z for Paladins"), it doesn't get built.
- **Template vs. content-collection choice:** use **shared page templates + typed data modules** (`lib/pseo/*.ts`), not MDX/content collections. Reasoning: the content here is structured and derived (class → spec → BiS slot table, raid → boss list → common CLA failure modes), not long-form editorial prose. MDX is the right tool for the *guides* (already exist, keep as-is); a data-module + template pattern is the right tool for pages that are really "N instances of one layout with different data," which is what pSEO is by definition. This also makes the doorway-page risk mechanically harder to hit — a template forces every instance to render the same substantive sections (BiS table, common mistakes drawn from real CLA rule IDs, sample report CTA), so a thin page is a data-completeness bug, not a one-off editorial miss.
- **Route group `(marketing)`:** groups pSEO + guides under one segment for shared layout (breadcrumbs, hub navigation) without affecting URL paths (route groups are invisible in the URL). Keeps `/analyze/*` (the product) architecturally separate from `/classes/*`, `/raids/*`, `/guides/*` (the acquisition surface).

### Data flow

```
Static/near-static facts (class list, raid list, BiS constants)
        │  (build time / ISR revalidate)
        ▼
lib/pseo/page-data.ts  ──reads──►  lib/constants.ts, lib/cla-constants.ts
        │
        ▼
generateStaticParams()  →  pre-renders top-priority combinations
        │
        ▼
app/(marketing)/classes/[classSlug]/page.tsx
        │  optionally: pull 1-2 live proof points (e.g. "reports analyzed for this class this week")
        ▼
lib/kv-cache.ts (read-only aggregate, e.g. a Redis counter already incremented elsewhere)
        │
        ▼
ISR-rendered HTML → crawlers + users
```

Only the *proof point* (a live counter, a "recently analyzed" report link for that class) touches Redis; the substantive content is static-at-build/ISR, matching the recommended pSEO pattern of static generation with periodic revalidation rather than per-request SSR (cheaper, more cacheable, and avoids putting pSEO traffic on the WCL-dependent request path at all — pSEO pages must not call the WCL API directly).

### ISR strategy

- `generateStaticParams()` pre-renders the full combinatorial set at build (dozens of pages — small enough to fully pre-render, no need for on-demand fallback).
- `revalidate` tuned by volatility tier: class/raid reference data (BiS tables, spec descriptions) changes only when `cla-constants.ts` is regenerated (rare, deliberate) → long revalidate (e.g. 24h, or even fully static with manual revalidation via `revalidatePath` triggered from the same PR that regenerates game-data IDs). Any live proof-point widget gets its own shorter client-fetched or Suspense-streamed slice so it doesn't force full-page revalidation.
- Reuse the sitemap pattern already proven for `/analyze/*`: static pSEO routes get added to `sitemap.ts` as a static list (they're finite and known, unlike report codes), not through the Redis recent-reports mechanism.

### Internal-link architecture (hub/spoke)

```
Homepage ──► /classes (hub: all classes) ──► /classes/paladin (spoke)
Homepage ──► /raids (hub: all raids)     ──► /raids/black-temple (spoke)
/classes/paladin ──► /classes/paladin/black-temple (cross spoke) ──► /tbc-audit (tool CTA)
/raids/black-temple ──► /classes/paladin/black-temple
/guides/* ──► relevant /classes/[x] and /raids/[y] (contextual, not just nav)
Every spoke ──► "Analyze your log" CTA → /analyze form (the actual product, closing the loop)
```

Two new hub pages (`/classes`, `/raids`) are required — without them the spokes are orphaned leaves that only the sitemap finds, which is weaker for crawl equity than being reachable from a real navigational hub. This mirrors the existing pattern where the homepage links guides and FeaturedReports; the hubs slot into `Navbar` the same way.

### Build order implication

pSEO pages depend on **nothing new from the ads/design/cross-site tracks** except the design-token layer being stable enough that the template doesn't need to be re-skinned mid-build. Practically: stand up 1-2 pSEO templates *after* the token audit (Track 3) lands baseline tokens, so the new templates are the first consumer of the cleaned-up token set rather than more legacy debt to migrate later.

---

## Track 2 — Ads integration architecture

### Component boundary

```
app/
├── components/
│   └── ads/
│       ├── AdSlot.tsx              # client component: reserved-size container + lazy mount
│       ├── AdScriptLoader.tsx      # one instance in layout.tsx; loads network script IF consent granted
│       └── ad-config.ts            # slot IDs, sizes per breakpoint, placement allowlist per route
```

- `AdSlot` is a **presentation-only, network-agnostic** component: it owns the reserved box (fixed `min-height`/`aspect-ratio` per breakpoint) and an `IntersectionObserver`-gated mount (don't request/render an ad until the slot is near-viewport). It never talks to the ad network SDK directly — it renders a network-specific inner component only once consent + viewport conditions are met. This boundary matters because it lets you swap ad networks later (or A/B two) without touching every page that places `<AdSlot />`.
- `AdScriptLoader` is the **single** place the third-party ad script tag is injected (via `next/script` with `strategy="lazyOnload"` or `worker` if the network supports Partytown-style offloading), mounted once in `app/layout.tsx` alongside the existing `PostHogProvider`. Do not let individual pages import ad network scripts directly — one loader, one consent check, one CSP surface to reason about.
- Placement is **allowlisted per route** in `ad-config.ts`, not opt-out. Given the accuracy-first, UX-sensitive positioning of this product (raid audit tool, not a content farm), ads should be explicitly placed only on: guide pages, pSEO pages, and non-critical zones of `/analyze/*` (e.g., below the fold, never inside the CLA/analysis tables themselves). This is a product decision to confirm with the user before Track 2 execution, not an assumption to bake in silently.

### CLS/CWV protection (concrete mechanism)

1. **Reserve space unconditionally.** `AdSlot` renders its full reserved box (via explicit `width`/`height` or `aspect-ratio` CSS, matched to the ad network's declared unit size) on first paint, whether or not an ad is present yet or ever loads. Never collapse-on-empty and never resize-on-fill — both are direct CLS hits. This is the single highest-leverage rule from current CWV guidance and is non-negotiable for a site whose growth strategy is organic search (CWV is a ranking input).
2. **Lazy-load below the fold**, eager only for slots that are above-the-fold by design (rare here) — use `IntersectionObserver` (a small custom hook, not a heavy ad-lazy-load library) with a `rootMargin` of ~200-400px so the ad request fires slightly before scroll-into-view, hiding network latency.
3. **Suspense/skeleton parity:** treat the reserved ad box like the existing skeleton-loader pattern already used for analysis data (dimensionally-accurate placeholder) so there's one consistent "reserved space" idiom across the app for both data-loading and ad-loading UI.
4. **Consent gate before script load, not after.** `AdScriptLoader` must check consent state (new: a lightweight consent banner/cookie, likely reusing the same mechanism PostHog EU consent will eventually need per `CONCERNS.md`) *before* injecting the ad network `<script>`. This both respects privacy law for EU/CCPA visitors and avoids loading render-blocking or CLS-inducing third-party JS for users who decline — a second Core Web Vitals win, not just a compliance one. **Design these two consent gates (PostHog session replay + ads) as one shared consent primitive**, not two independent implementations — they'll need the same banner, the same cookie, the same "what counts as consent" logic.

### CSP interaction (this is the concrete blocker to sequence around)

The current CSP is `Content-Security-Policy-Report-Only` (logs, doesn't block) with a documented, narrow allowlist (`script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wow.zamimg.com`). Two things follow directly:

1. **Ads must be integrated while CSP is still report-only**, so the new script-src/connect-src/frame-src hosts the ad network requires get *discovered via violation reports* rather than causing a silent outage the day CSP is promoted to enforcing. Concretely: add the ad network to `next.config.ts`'s `CSP_REPORT_ONLY` list as soon as the network is chosen, deploy, and watch report-only violations for anything the network's docs didn't disclose (ad networks commonly need `frame-src` for iframe creatives and `img-src`/`connect-src` for a wide set of bidder domains — expect this list to be long and to require iteration).
2. **Enforcing CSP should happen *after* ads are stable**, not before — flipping to enforcing mode while still discovering ad-network CSP requirements risks silently breaking ad rendering (which, being revenue, is a worse silent failure than a logged violation). This inverts a "harden security first" instinct but is the correct order given the existing report-only safety net was specifically built to de-risk this kind of sequencing.
3. Expect ad networks (esp. those following AdSense-style guidance) to want `'unsafe-inline' 'unsafe-eval' 'strict-dynamic'` and a broad `https:` fallback in `script-src` if the network's own tag isn't nonce-compatible — this is very likely a *net loosening* of the current narrow CSP, which should be an explicit, confirmed tradeoff with the user (ties to the "confirm before hard-to-reverse/outward-facing actions" convention), not something silently absorbed during the ads phase.

### Build order implication

Ads should land **after** the design-token/UX pass has stabilized page layouts (adding reserved ad boxes to a layout that's about to be redesigned means doing the CLS-reservation work twice) and **after or alongside** the consent-primitive is decided (shared with the PostHog EU-consent gap already flagged in CONCERNS.md — solve consent once, wire both systems to it).

---

## Track 3 — Design-token layer / design-system overhaul

### Component boundary

No new architectural layer is needed — the token *mechanism* (Tailwind v4 `@theme inline` + CSS custom properties in `:root`/`.dark`) already exists and is the correct v4-idiomatic pattern (v4 moved config into CSS; this project already did that migration). The work is:

```
app/globals.css
├── @theme inline { ... }         # EXTEND: add missing categories (spacing scale, motion durations,
│                                    elevation/shadow tokens) alongside existing color/radius tokens
├── :root / .dark { ... }         # EXTEND: promote any hardcoded oklch(...) literal found in a
│                                    utility class (`.surface-card`, `.hero-glow`, gradient classes)
│                                    to a var(--token) reference
components/ui/*                    # shadcn primitives — audited last (most standardized already)
app/components/*                   # ~50+ product components — audited route-by-route
```

### Incremental adoption strategy (no big-bang rewrite, ~15 routes)

1. **Token audit pass first, isolated from visual changes.** Grep `globals.css` and `app/components/**` for raw `oklch(`/`rgba(`/hex literals that duplicate an existing token value (e.g., `.surface-card`'s hardcoded `oklch(0.17 0.015 270 / 70%)` is literally `--surface-1` restated) and replace with `var(--token)`. This is a mechanical, low-risk, high-leverage first phase — it makes every subsequent visual change a one-line token edit instead of a grep-and-replace across components, and it's the correct order because doing it *after* a visual redesign means redoing the audit against new hardcoded values.
2. **Add missing token categories** the redesign will need before touching components: a spacing/sizing scale if the redesign introduces new density, motion-duration tokens (there are already ad hoc animation durations scattered in `globals.css` keyframes — e.g. `5s`, `8s`, `0.5s` — worth tokenizing as `--duration-*` if the redesign standardizes motion), and elevation/shadow tokens (currently inline box-shadow values in `.surface-card`/`.surface-card-elevated`).
3. **Route-by-route rollout, not component-by-component.** Given ~15 routes, sequence by traffic/risk: start with a low-traffic, low-risk route (a single guide page) to validate the new token set and component patterns in production, then move to the highest-traffic surfaces (`/`, `/analyze/[reportCode]`) last, once the pattern is proven. This is the opposite of starting with the homepage — the homepage is the least forgiving place to discover a token or contrast mistake.
4. **shadcn primitives (`components/ui/`) get touched once, early, not per-route.** Since shadcn v4 components already use `data-slot` attributes and consume the semantic tokens (`--color-primary` etc.), updating the *token values* automatically restyles every shadcn-based component across all 15 routes simultaneously — this is the leverage point of a token system and the reason to do the token audit (step 1) before any route-level visual work.
5. **Dark-mode-only today (`<html className="dark">` is hardcoded in `layout.tsx`)** — confirm whether the redesign scope includes a light mode toggle; if not, tokens only need `.dark` values validated, simplifying the audit meaningfully.

### Build order implication

This track is a **prerequisite/foundation for Track 1 and Track 2's visual pieces** (new pSEO templates and ad slot styling should consume the audited token set, not the pre-audit one) but does not block Track 4 or Track 5, which are largely non-visual (cross-site linking, share mechanics). Recommended: token audit (step 1-2) lands first in the milestone; route-by-route visual rollout (steps 3-4) can run in parallel with pSEO template build once the tokens are stable.

---

## Track 4 — Cross-site integration (ParseForge ↔ LootList+)

### Component boundary

These are **two separate Vercel projects/deployments**, so integration is necessarily loose-coupled — no shared runtime, no shared imports. The two viable integration points are UI convention + URL-level attribution, both of which are cheap and reversible:

```
ParseForge (parseforge.gg)              LootList+ (lootlistplus.com — per redirect rules in next.config.ts)
├── app/components/Navbar.tsx           ├── (its own navbar)
│   └── cross-promo banner/link ────────┼──► UTM-tagged outbound link
│       (?utm_source=parseforge&        │
│        utm_medium=cross_promo&        │
│        utm_campaign=...)              │
└── PostHog (project 337485,            └── PostHog (same org "LootList+" —
    shared org)                             confirm whether it's the same
                                            project or a sibling project)
```

- **Shared nav/banner pattern, not shared component code.** Since these are separate deployments (confirmed by the existing domain-consolidation redirects in `next.config.ts` — `getlootlist.com`/`lootlistplus.com` variants already 301 to `parseforge.gg`, meaning these brands have some shared history/consolidation already), the practical pattern is a small, hand-maintained "cross-promo unit" (a banner component + a footer link) built independently in each codebase, following an agreed visual spec (can be a design-token export, e.g. sharing the gold/arcane palette values as a documented pair, not a shared npm package — too much overhead for two sites).
- **UTM/attribution:** every cross-site link in either direction carries `utm_source`/`utm_medium`/`utm_campaign` query params. Because PostHog is already wired (per PROJECT.md: "PostHog project 337485 (org LootList+)"), UTM params land in PostHog's existing autocapture/person properties with no new instrumentation — this is a linking/config task, not a new integration.
- **Backlink strategy:** a direct `lootlistplus.com → parseforge.gg` link (and vice versa) is also a legitimate, low-risk SEO backlink between same-owner properties — but per the existing "hard-won SEO lessons," don't let this backlink carry navigational-intent anchor text that could cannibalize ParseForge's own ranking pages; anchor text should target the tool-intent phrasing already proven to convert (e.g. "WoW log analyzer," not "logs").
- **One important open question to confirm before building:** whether the redirect entries already present for `getlootlist.com`/`lootlistplus.com`/`lootlistplus.dev` mean LootList+ *used to be* this same product/domain before a rebrand, versus being a genuinely separate live product today. This changes whether cross-promotion is "two sibling products" or "an old brand redirecting to the new one" — worth a direct question to the user before designing the banner copy.

### Build order implication

Fully decoupled from Tracks 1-3 and 5 — can be built any time, independently, since it's two small additions (a banner component in each codebase + UTM param conventions) with no shared runtime dependency. Natural to sequence late (low complexity, low risk, can slot into any open week) or early as a quick win if the team wants an early deliverable.

---

## Track 5 — Share-loop architecture

### Component boundary

Extends existing, working infrastructure — no new subsystem, three additions:

```
lib/
├── og-share.ts                       # NEW: extracted/shared logic between /og/route.tsx
│                                          and any new per-player share image variant
app/
├── og/route.tsx                      # EXISTING: report-level OG image — extend to accept
│                                          a `player` param for per-player share cards
├── analyze/[reportCode]/
│   └── AnalyzeClient.tsx             # EXISTING: handleShareLink — extend to build
│                                          per-player permalink, not just report URL
└── share/[reportCode]/[playerId]/    # NEW (optional): dedicated share-landing route if
    page.tsx                              per-player permalinks need a distinct landing
                                            experience from /analyze (simpler view, big
                                            share-card visual, CTA back to full analysis)
```

- **Per-player share permalinks:** the URL scheme should stay within the existing `/analyze/[reportCode]` structure via query params (`?player=X&fight=Y`) rather than a new route tree, *unless* the product wants a deliberately different landing experience for shared links (e.g., a punchier "here's how you did" card-first view rather than the full multi-tab analysis tool) — the latter is what the optional `/share/[reportCode]/[playerId]` route is for. This decision should be made based on the PROJECT.md goal ("shared-page landing experience" is explicitly called out as in-scope), suggesting the dedicated route is likely the better answer: a shared link's job is to convert a *viewer* (not the original analyzer) into a new user, which wants different content (bigger hook, less tool-chrome) than the analyzer's own working view.
- **OG image generation reuse:** `/og/route.tsx` already fetches analysis data through the shared result cache and renders a report-level image at the edge. Adding a per-player card is an extension of the same route (accept `player` search param, branch the render), not a new image pipeline — it inherits the existing cache-reuse property (warm if the report/player was recently viewed) for free.
- **Attribution loop closure:** every share-generated pageview should carry a query param (`?src=share` or similar, distinct from cross-site UTMs) so PostHog can measure share-driven acquisition distinctly from organic/direct — this closes the loop on "share rate" as a tracked funnel metric per the PROJECT.md standing invariant (every user-facing change ships with PostHog instrumentation).

### Data flow

```
User finishes viewing analysis → clicks Share
        │
        ▼
handleShareLink() builds URL (report + optional player/fight) + share-source param
        │
        ├──► navigator.clipboard.writeText(url)      (existing)
        ├──► posthog.capture("share_link_copied")     (existing, extend props: player-level?)
        └──► (new) "Copy for Discord"-style richer copy — Discord embed reads OG tags
                     from the URL when pasted, which pulls from /og/route.tsx
                     (already report+fight+source aware; extend for player)
        │
        ▼
Recipient clicks link → lands on /analyze/[reportCode]?player=X or /share/[code]/[player]
        │
        ▼
Page records ?src=share in PostHog; if new visitor, this is the acquisition event
        │
        ▼
recordRecentReport() already fires on public SSR render (existing) — no change needed;
share traffic naturally feeds the same sitemap/indexing pipeline
```

### Build order implication

Independent of Tracks 2-4; loosely coupled to Track 3 (a redesigned share card benefits from finalized tokens, but the *mechanism* — per-player param, extended `/og` route, richer copy action — can be built against current styling and re-skinned later at low cost, since it's a small, isolated surface). Reasonable to build early-to-mid in the milestone since it's low-risk and the existing plumbing (OG route, clipboard share, PostHog event) means most of the work is additive, not architectural.

---

## Suggested build order (cross-track synthesis)

Ordering is driven by (a) genuine technical dependency, (b) risk of rework if sequenced wrong, and (c) what's cheapest to de-risk early:

1. **Design-token audit** (Track 3, steps 1-2 only — the mechanical hardcoded-value cleanup, not the full visual redesign). Foundation for everything else that touches UI; cheapest to do before other tracks add more components that would need re-auditing.
2. **Consent primitive** (shared prerequisite surfaced by Track 2, also closes the PostHog EU-consent gap from CONCERNS.md). Needed before any ad script loads and is a compliance item independent of ads — do it once, early.
3. **Share-loop enhancements** (Track 5). Low-risk, additive, high leverage on an already-proven mechanism (2.8% share rate is a stated growth target); can ship independently and start compounding immediately.
4. **pSEO hub + first template** (Track 1). Depends on stable tokens (step 1) for the template shell; everything else about it (data modules, engines-grounding, sitemap entries) is independent. Build one template + hub end-to-end before replicating to more class/raid combinations, to validate the doorway-page-avoidance discipline on a real example before scaling it.
5. **Ads: CSP discovery + report-only integration** (Track 2, first half). Can start once an ad network is chosen and consent primitive (step 2) exists; runs in report-only CSP mode deliberately, in parallel with later pSEO template replication (more pages to monetize as they ship).
6. **Route-by-route visual redesign rollout** (Track 3, steps 3-5). Sequenced after pSEO templates and ad slots exist, so the redesign work styles the *final* set of components (including new ad slots and pSEO templates) once, rather than restyling old components and then again for new ones.
7. **CSP promotion to enforcing** (tail end of Track 2). Only after ad-network CSP requirements are fully discovered via report-only violations and the redesign isn't actively introducing new inline styles/scripts that would need re-auditing against the tightened policy.
8. **Cross-site integration** (Track 4). Fully decoupled — can slot in anywhere, including in parallel with any of the above, since it touches neither this codebase's core rendering path nor its CSP/token/engine surfaces. Good candidate for an early "quick win" if the team wants visible progress while heavier tracks are in flight.

---

## Anti-Patterns to avoid across all five tracks

### Anti-Pattern: pSEO content that duplicates constants instead of importing them
**What people do:** Hand-write class/raid facts as prose or JSON in a new content file, independent of `lib/constants.ts`/`lib/cla-constants.ts`.
**Why it's wrong:** Creates a second source of truth that will drift from the verified wago.tools-regenerated ID databases — the exact class of bug already fixed once in PR #11 (misaligned enchant/gem/consumable IDs), and directly risks the doorway-page classification the milestone explicitly wants to avoid.
**Do this instead:** pSEO data modules import from the existing constants/engines; if a fact isn't derivable from them, that's a signal the page idea needs a real product capability behind it first, not an excuse to hand-author it.

### Anti-Pattern: Ad slots without dimension reservation, or CSP enforced before ad discovery
**What people do:** Drop in an ad network's copy-paste snippet directly into a page, sized by whatever the ad returns; flip CSP to enforcing as a "security cleanup" task disconnected from the ads rollout.
**Why it's wrong:** Directly causes CLS regressions (harms both UX and the SEO ranking signal this whole project depends on) and, if CSP enforcement lands before the ad network's full script/frame/connect requirements are known, silently breaks ad rendering (revenue) with no visible error to the team.
**Do this instead:** Fixed-dimension `AdSlot` container; CSP stays report-only through the entire ads-integration window and is only promoted once violation reports go quiet with ads live.

### Anti-Pattern: Token audit done mid-redesign instead of before it
**What people do:** Start the visual redesign route-by-route, discovering and fixing hardcoded color values opportunistically as each route is touched.
**Why it's wrong:** Means the same hardcoded-value problem gets re-solved 15 times instead of once, and early-redesigned routes don't benefit from token categories (spacing/motion/elevation) only discovered to be needed later.
**Do this instead:** One dedicated token-audit pass first (cheap, mechanical, no visual risk), then route-by-route visual work consumes a stable, complete token set.

---

## Sources

- [Google AdSense: Integrate the AdSense ad code with a Content Security Policy](https://support.google.com/adsense/answer/16283098?hl=en) — HIGH confidence (vendor docs); confirms `strict-dynamic`/nonce pattern and `object-src 'none'` requirement for ad tags under CSP.
- [MDN: Content-Security-Policy-Report-Only header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only) — HIGH confidence; confirms report-only-then-enforce is the standard, intended rollout pattern (matches what this codebase already does).
- Web search synthesis on Next.js ad-slot CLS reservation and IntersectionObserver lazy-mount patterns (LogRocket, Medium sources) — MEDIUM confidence (blog-tier, but consistent with Core Web Vitals fundamentals which are HIGH confidence from web.dev/Google's own guidance on layout-shift reservation).
- [shadcn/ui: Tailwind v4 migration notes](https://ui.shadcn.com/docs/tailwind-v4) — HIGH confidence (maintainer docs); confirms `@theme` is the correct v4-idiomatic token location and that migration is non-breaking/incremental, matching the codebase's already-completed migration.
- Web search synthesis on programmatic SEO with Next.js App Router (ISR revalidate tiering, `generateStaticParams`, avoiding soft-404 doorway pages via `notFound()`) — MEDIUM confidence (blog-tier), cross-checked against this project's own documented SEO invariants (PROJECT.md), which take precedence wherever they conflict.
- Direct codebase inspection: `app/globals.css`, `next.config.ts`, `app/layout.tsx`, `app/og/route.tsx`, `app/analyze/[reportCode]/AnalyzeClient.tsx` — HIGH confidence (primary source, this repo).

---
*Architecture research for: ParseForge growth/design/monetization milestone*
*Researched: 2026-09-04*
