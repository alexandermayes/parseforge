# Stack Research

**Domain:** Adding ads monetization, design-token theming, community integration, and programmatic SEO to an existing Next.js 16 App Router site (ParseForge, ~30-50k pageviews/mo)
**Researched:** 2026-09-04
**Confidence:** LOW-MEDIUM (web-search sourced; no MCP docs/exa provider available in this environment — see Sources). Eligibility thresholds for ad networks change frequently and had at least one direct contradiction in search results (Ezoic); treat all numeric thresholds as "verify at signup," not fixed fact.

This is a **subsequent milestone on a live product** — nothing here replaces the existing stack (Next.js 16 / React 19 / TypeScript / Tailwind v4 / shadcn-Radix / Upstash Redis / PostHog / Vercel, per `.planning/codebase/STACK.md`). Everything below is additive.

## Recommended Stack

### Core Technologies (new, per capability track)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Google AdSense | current (auto-served JS tag) | Primary ad monetization | No minimum traffic requirement, no application backlog, ~68% publisher revenue share, accepts small/gaming sites with original content. At ParseForge's ~30-50k pageviews/mo, every gaming-specific premium network (Playwire 500k pv, Nitro/NitroPay 100k visitors / 300k pv, Freestar ~1M pv) is out of reach except Ezoic. AdSense is the only zero-friction option that ships this milestone. Confidence: LOW (single-search-pass) |
| Ezoic | current | Secondary/upgrade path once traffic is verified | Multiple 2025/2026 sources report no hard minimum (as low as 3,000 visits), AI-driven ad testing claims 50-150% eCPM lift over raw AdSense, $20 payout minimum (vs $100 for AdSense) — but one 2026 source claims Ezoic raised its bar to 250,000 users/mo. **Contradiction found — do not commit to Ezoic without confirming current eligibility directly on ezoic.com before building against it.** Recommend: ship AdSense first (zero-risk), evaluate Ezoic in a follow-up phase once real pageview data post-redesign is in hand. Confidence: LOW |
| InMobi CMP (formerly Quantcast Choice) | current, free tier | IAB TCF 2.3 consent management platform (CMP) for EEA/UK ad serving compliance | Google has required a **Google-certified, TCF-integrated CMP** for any publisher serving AdSense/Ad Manager/AdMob ads to EEA or UK users since Jan 16, 2024; TCF v2.3 (June 2025) must be adopted by **Feb 28, 2026** or consent strings invalidate and ads silently downgrade to "Limited Ads" (reported 50%+ revenue impact). InMobi CMP is free, TCF-certified, lightweight, and pre-registers Google as an IAB vendor — this is the only free path that satisfies Google's ads-compliance requirement (as opposed to CookieYes/Cookiebot/Osano, which are paid past small free tiers). Confidence: LOW |
| Tailwind v4 `@theme` + CSS custom properties (already in stack — extend, don't replace) | Tailwind CSS 4 (existing) | Design-token system for the site-wide dark-gaming redesign | Tailwind v4 already made design tokens CSS-native (no `tailwind.config.js` needed); shadcn/ui (already in stack) already consumes this exact model via semantic tokens (`--primary`, `--background`, `--border`, `--sidebar-*`, `--chart-1..5`) defined in `:root`/`.dark` and mapped with `@theme inline`. The redesign should **extend this existing token set** (new tokens like rarity/loot-tier accents) rather than introduce a second theming system — this is the path of least resistance that keeps shadcn components upgradable. Confidence: LOW (but low-risk claim: directly matches current shadcn+Tailwind v4 docs pattern) |
| Discord (official Server Widget) | n/a (Discord platform feature) | Community/feedback channel + homepage embed | Free, first-party, zero new dependencies: enable "Server Widget" in Discord Server Settings, embed via `<iframe src="https://discord.com/widget?id=<SERVER_ID>&theme=dark">`. Read-only (member list + invite link, no inline chat) but that's sufficient for a "join our community" surface — matches the stated need (get feedback out of the owner's personal DMs) without adding a bot/script dependency. Confidence: LOW |
| `schema-dts` (npm, types-only) | latest (`^1.1.x`) | Type-safe JSON-LD authoring for structured data | Purely a TypeScript type-definitions package for schema.org — zero runtime cost, catches malformed JSON-LD (e.g. the site's existing FAQPage-not-detected issue on `/tbc-audit`) at compile time. Pairs with rendering `<script type="application/ld+json">` directly from a Server Component — the current App Router-native pattern; **do not add `next-seo`** (see What NOT to Use). Confidence: LOW |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vanilla-cookieconsent` (orestbida/cookieconsent, npm) | latest (`^3.x`) | Cookie/consent banner UI with Google Consent Mode v2 support | If choosing to run the CMP banner UI yourself (framework-agnostic, MIT-licensed, wireable to PostHog's `opt_out_capturing()`/`opt_in_capturing()` and to Google's `gtag('consent', ...)` calls) instead of a hosted CMP's own banner widget. Use this **only if** InMobi CMP's own banner UI doesn't fit the new design system — otherwise prefer the CMP's native banner to avoid running two consent surfaces. |
| `next/script` (already in Next.js, no install) | Next.js 16 (existing) | Loading AdSense/ad-network scripts without hurting Core Web Vitals | Use `strategy="afterInteractive"` for ad scripts (ads should load quickly for revenue but must never block hydration — this is the documented Next.js guidance). Never use `beforeInteractive` for ad/analytics scripts. |
| CSS `min-height`/`aspect-ratio` on ad slot containers | n/a | CLS mitigation for ad units | Third-party ad scripts injecting unsized content into the DOM is the most common cause of CLS regressions on otherwise-optimized Next.js sites. Every ad slot must reserve its box before the ad script resolves — this is a design/CSS discipline, not a library, but it must be baked into the redesign's component library (e.g. an `<AdSlot>` component with a fixed `min-height` prop per format). |
| `posthog-js` consent wiring (already in stack, no new install) | posthog-js 1.360.0 (existing) | Close the "PostHog session replay lacks EU consent flow" gap flagged in CONCERNS.md | Call `posthog.opt_out_capturing()` / `opt_in_capturing()` from the new consent banner's decline/accept handlers; alternatively set `cookieless_mode: 'on_reject'` in the PostHog init config so events fire without personal identifiers pre-consent. PostHog publishes an official React cookie-banner tutorial with this exact wiring — reuse rather than build from scratch. This directly resolves a standing item in `.planning/PROJECT.md`'s Known Concerns and is a prerequisite for legally serving AdSense to EEA/UK visitors anyway (same CMP interaction covers both). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Chrome DevTools / PageSpeed Insights / Vercel Speed Insights (already in stack) | Verify CLS/LCP impact of ad slots before/after shipping | `@vercel/speed-insights` is already installed — use it as the before/after gate for any ad-script or consent-banner change; don't ship an ad slot without confirming CLS stays in the "Good" band on a representative `/analyze/[reportCode]` page. |
| Google Search Console (already connected via MCP `gscServer`) | Verify structured data / JSON-LD renders correctly post-redeploy | Per project's standing operational requirement — use the Rich Results Test / GSC's structured data report to confirm new JSON-LD (and the existing FAQPage-not-detected bug on `/tbc-audit`) actually validates, not just that the code compiles. |

## Installation

```bash
# Supporting libraries (consent banner, if self-hosting the UI rather than using a CMP's hosted widget)
npm install vanilla-cookieconsent

# Type-only, dev dependency (JSON-LD authoring safety net)
npm install -D schema-dts

# No install needed for: AdSense (script tag), Ezoic (script tag, evaluate later),
# InMobi CMP (script tag), Discord widget (iframe), next/script (built into Next.js 16)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Google AdSense (ship first) | Ezoic | Once ParseForge's actual post-redesign traffic is confirmed and Ezoic's real current threshold is verified directly at signup — its AI ad-testing plausibly beats AdSense RPM, but don't build around a contradicted eligibility claim. |
| Google AdSense / Ezoic | Playwire, Venatus, NitroPay, Freestar, Mediavine, Raptive | Once monthly pageviews clear the relevant floor: Raptive ~25k/mo (lowered Oct 2025 — closest to ParseForge's current 30-50k, worth re-checking eligibility directly), Nitro ~100k visitors/300k pv, Playwire ~500k pv, Freestar ~1M pv. Revisit this ladder at the next growth milestone once traffic is re-measured. |
| InMobi CMP (free) | CookieYes | If the free tier's UI/branding isn't sufficient and budget allows ~$10/domain/mo — CookieYes is also Google-certified TCF but has more polished self-serve banner customization; note it moved color customization behind its paywall in 2025. |
| Extend existing shadcn/Tailwind v4 tokens | A separate design-token tool (Style Dictionary, Tokens Studio, etc.) | Only if the design system needs to be shared across ParseForge and LootList+ as a standalone package — for a single-app redesign, a second tokens pipeline is unnecessary overhead. Cross-promotion between the two sites (an Active requirement) may eventually justify this; not yet. |
| Official Discord Widget (read-only iframe) | WidgetBot (interactive embedded chat) | If the goal becomes "let visitors chat without leaving the site" rather than "surface an easy join point" — WidgetBot requires adding and maintaining a bot, which is more operational surface than this milestone's stated need (get feedback out of a personal DM). |
| Native `<script type="application/ld+json">` + `schema-dts` types | `next-seo` | Never for new App Router work — `next-seo` targets the Pages Router's meta-tag gap, which Next.js's native Metadata API already closes; adding it now would be a step backward, not forward. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-seo` for JSON-LD/structured data | Built for Pages Router; App Router's native `generateMetadata` already covers meta tags, and `next-seo`'s JSON-LD helpers add an unnecessary dependency for what's a one Server Component `<script>` tag | Native `<script type="application/ld+json">` rendered from a Server Component + `schema-dts` for type safety |
| Committing to a premium gaming ad network (Playwire/Venatus/NitroPay/Freestar) before confirming current traffic against real thresholds | All of these require far more traffic than ParseForge's current 30-50k pageviews/mo; roadmapping around them now creates a phase that can't ship | AdSense now; revisit the network ladder (Raptive/Ezoic/Nitro) once traffic is re-measured post-redesign/SEO push |
| Shipping AdSense to EEA/UK traffic without a certified CMP | Violates Google's publisher policy (mandatory since Jan 2024, tightened with the Feb 28 2026 TCF v2.3 deadline) — non-compliant ad serving risks AdSense account suspension, not just a fine | InMobi CMP (free, TCF v2.3 certified) wired in before any ad script goes live for EU/UK visitors |
| A second/parallel design-token system alongside Tailwind v4 + shadcn | The stack already has a token system; layering another (e.g. a JS theme object, styled-components theme, or a separate token JSON pipeline) creates two sources of truth for colors during a redesign, which is exactly the "messy" state the redesign is meant to fix | Extend the existing `@theme`/CSS-variable tokens that shadcn already consumes |
| Ad scripts loaded with `next/script strategy="beforeInteractive"` (or no `next/script` at all — raw `<script>` in `<head>`) | Blocks/delays hydration and directly regresses LCP/CLS on report pages that are the site's core value + SEO asset | `next/script` with `strategy="afterInteractive"`, ad slots with reserved `min-height`/`aspect-ratio` |
| Building a custom Discord bot/chat-embed (WidgetBot-style) as the *first* community step | Adds an operational dependency (bot uptime, permissions, moderation surface) before it's known whether a simple "join our Discord" link + read-only widget is even used | Official read-only Discord Widget iframe first; revisit WidgetBot only if community engagement data justifies more investment |

## Stack Patterns by Variant

**If ParseForge's EU/UK traffic share is meaningful (check PostHog geo breakdown before this phase):**
- Stand up InMobi CMP + wire `posthog.opt_out_capturing()`/`cookieless_mode` *before* shipping any ad script
- Because serving AdSense to unconsented EEA/UK visitors is a policy violation with account-level risk, not just a compliance nicety

**If ParseForge's traffic is overwhelmingly US/non-EEA (also check PostHog geo breakdown):**
- A minimal, low-cost consent banner (or even a simplified US-only cookie notice) may be defensible short-term, but confirm with the user before skipping the CMP — the org's default posture on privacy/consent should err toward always implementing it correctly the first time, since retrofitting consent after ads are live is harder than building it in from the start
- Because CCPA and other US state privacy laws also increasingly expect opt-out mechanisms, and this closes the standing PostHog EU-consent gap from CONCERNS.md regardless of ad plans

**If the design overhaul (via `impeccable`/`design-loop` workflow) produces net-new component patterns beyond what shadcn ships:**
- New tokens go into the same `@theme`/CSS-variable file shadcn already reads — don't fork a separate stylesheet or CSS-in-JS layer for "new" components
- Because a split styling system is the exact kind of accumulated mess the redesign is meant to resolve, and it would undermine the "recognizably ParseForge" brand-continuity constraint by making colors harder to audit in one place

**If programmatic per-class/per-raid pages number in the low hundreds (not thousands):**
- Pre-render all of them via `generateStaticParams` at build/deploy time; skip the `dynamicParams`-on-demand pattern entirely
- Because ParseForge's manual-deploy model (no git auto-deploy, Vercel CLI only) means slow builds aren't a per-commit tax — they only cost time at the moment of a manual `vercel deploy`, and full pre-rendering gets every page indexable immediately rather than waiting on first-crawl-triggers-render

**If the page count grows into the thousands (e.g. combinatorial class × raid × boss pages) in a later milestone:**
- Switch to pre-building only the top N by projected search volume via `generateStaticParams`, leave `dynamicParams=true` for the long tail, and set `export const revalidate = N` (or per-fetch `next: { revalidate: N }`) for freshness
- Because pre-rendering everything at that scale would make every manual deploy prohibitively slow

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `schema-dts` | TypeScript 5 (existing) | Types-only package; no runtime coupling to Next.js/React versions, safe against Next.js 16/React 19 |
| `vanilla-cookieconsent` | Next.js 16 App Router | Must be wrapped in a Client Component (`"use client"`) since it manipulates the DOM directly and reads/writes browser storage; does not need SSR |
| InMobi CMP / Google AdSense scripts | `next/script strategy="afterInteractive"` | Both are designed to be loaded async post-hydration; verify no CLS regression via Vercel Speed Insights before considering the integration done |
| Tailwind v4 `@theme` tokens | shadcn/ui (already pinned in stack) | shadcn's current component generation already targets the Tailwind v4 CSS-variable model — no version mismatch risk as long as shadcn components aren't hand-edited to bypass tokens |

## Sources

- WebSearch: "Playwire Venatus Freestar Ezoic minimum traffic requirements to join ad network 2026" — LOW confidence, single-pass web search, one direct contradiction found on Ezoic's threshold (flagged above)
- WebSearch: "Mediavine Raptive minimum monthly pageviews requirement to apply" — LOW confidence; Raptive's Oct 2025 threshold drop (100k→25k) is cited across multiple independent listicles, more likely reliable than single-source claims
- WebSearch: "Google AdSense approval requirements small site revenue share gaming niche" — LOW confidence
- WebSearch: "Next.js third-party ad scripts Core Web Vitals CLS best practices next/script" — LOW confidence, but consistent with Next.js's own documented `next/script` strategy guidance
- WebSearch: "IAB TCF 2.2 consent management platform Google Ad Manager AdSense EEA UK requirement 2025" — LOW confidence source mix, but the Jan 2024 Google CMP mandate and June 2025 TCF v2.3 release / Feb 2026 migration deadline were corroborated across Google's own support pages (support.google.com/admanager, blog.google) and multiple CMP vendors (CookieYes, TrustArc, consentmanager.net) — treat this specific claim as MEDIUM confidence despite the LOW provider tier
- WebSearch: "Quantcast Choice CMP free Google certified TCF publishers small site" — LOW confidence
- WebSearch: "Ezoic no minimum traffic requirement small site AdSense alternative earnings" — LOW confidence, contradicts the "250k/mo" claim found in the first Ezoic search; **unresolved — verify before roadmapping**
- WebSearch: "Tailwind CSS v4 @theme directive design tokens custom dark theme CSS variables guide" — LOW confidence, but core mechanics (`@theme`, CSS-variable-first, OKLCH default) corroborated by tailwindcss.com's own docs/blog appearing in results
- WebSearch: "shadcn ui Tailwind v4 theming custom color tokens 2025 registry themes" — LOW confidence, corroborated by ui.shadcn.com's own docs pages appearing directly in results (theming, tailwind-v4 docs)
- WebSearch: "Discord widget API embed website official documentation widget.json" — LOW confidence
- WebSearch: "Next.js 15 App Router generateStaticParams programmatic SEO thousands of pages ISR dynamicParams" — LOW confidence, corroborated by nextjs.org's own `generateStaticParams` API reference page appearing in results
- WebSearch: "next-seo vs schema-dts JSON-LD structured data Next.js App Router 2025 recommended" — LOW confidence
- WebSearch: "vanilla-cookieconsent library React Google consent mode v2 IAB TCF 2025 open source" — LOW confidence
- WebSearch: "PostHog cookie consent opt_out_capturing session replay GDPR banner integration guide" — LOW confidence, corroborated by posthog.com's own docs/tutorials pages (privacy/gdpr-compliance, tutorials/react-cookie-banner) appearing directly in results
- WebSearch: "CookieYes vs Osano vs Cookiebot free tier small site consent management platform comparison 2025" — LOW confidence

**Note on tooling:** The `exa` MCP provider indicated by the `research-plan` seam was not available in this environment; all fetches fell back to the built-in `WebSearch` tool per the documented fallback rule, which caps confidence at LOW per the `classify-confidence` seam unless independently cross-verified (noted above where that happened). **Before finalizing the roadmap phase for monetization, re-verify current ad-network thresholds and the Ezoic contradiction directly against each network's official signup/eligibility page** — this space moves fast and the LOW-confidence numbers here are a starting point, not a commitment.

---
*Stack research for: ParseForge growth/design/monetization/community milestone*
*Researched: 2026-09-04*
