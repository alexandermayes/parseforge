# Phase 1: Foundation — Themes & Consent - Research

**Researched:** 2026-09-05
**Domain:** Consent management (Google-certified TCF CMP), Next.js theming, Tailwind v4 design tokens
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** CMP is **Google Privacy & Messaging** — Google's own free certified TCF CMP, managed inside the AdSense account. — **Reversibility:** costly — swapping CMPs later means redoing the consent message config, the script loader, CSP allowlist entries, and Phase 4's ad-integration assumptions all build on this choice.
- **D-02:** User has a Google account but **no AdSense account yet** — AdSense sign-up is a Phase 1 task (sign-up only, zero ad code). It requires the user at the keyboard (their Google account). Site-approval review can take days–weeks and runs in the background, which also de-risks Phase 4.
- **D-03:** Consent prompt is **geo-targeted to EEA/UK only** (Google CMP native geo-targeting). US/other visitors see no banner; Googlebot (US IPs) never hits an interstitial. No US-state privacy message for now.
- **D-04:** EEA/UK prompt format: **full-screen/center dialog** (Google's standard GDPR format) — chosen for higher consent rates over a bottom banner.
- **D-05:** On reject (EEA/UK): **session replay + cookies off, cookieless anonymous PostHog analytics stays** (memory-only persistence). Core events (analysis runs, shares, consent accept/reject rates) remain measurable for the EEA segment.
- **D-06:** Pre-choice EEA/UK visitors are treated as **not consented** — replay off, cookieless analytics only, until they accept.
- **D-07:** **Outside EEA/UK, session replay stays default-on** as today (`maskAllInputs` remains on). Consent gating applies only where legally required.
- **D-08:** First-time visitors get the theme from **system preference** (`prefers-color-scheme`), not forced dark. OS-light users land in light mode on day one.
- **D-09:** Because of D-08, light mode must be a **designed ParseForge light palette** in this phase — replace the stock shadcn `:root` values with branded, contrast-tuned light values across all routes. Phase 7 still refines route-by-route; Phase 1 makes light a genuine first impression, not just "readable".
- **D-10:** Theme toggle: **navbar icon, 3-state (Light / Dark / System)** — the next-themes standard. Explicit choice persists and overrides OS; "System" restores auto-follow. Visible on every route including mobile.
- **D-11:** **Full consolidation now** — migrate all hardcoded Tailwind palette classes (~32 found in `app/`, plus any in `components/ui/`) to semantic `@theme` tokens, and add the missing **spacing, motion, elevation** token categories. No "fix light-breakers only" shortcut; the audit report should show no known exceptions.
- **D-12:** WoW class colors get **per-theme adjusted variants** (the Wowhead approach): keep each class's recognizable hue, tune lightness/saturation for light backgrounds so Priest (white), Rogue (yellow), Paladin (pink) stay legible. Tokenized as paired light/dark values; `CLASS_COLORS` consumers resolve via token, not raw hex.

### Claude's Discretion

- Theme persistence/no-flash mechanism (next-themes with inline script is the assumed default; equivalent approach fine if better for Next 16/React 19).
- Exact plumbing from Google CMP's TCF consent signal to PostHog config (consent-change listener, opt-in/opt-out API choice).
- PostHog event names for consent/theme — follow the existing snake_case `posthog.capture` conventions in the codebase.
- Semantic token naming and the location/format of the token audit report artifact.
- CSP report-only header additions for CMP script/frame/connect sources (report-only mode means new sources surface as violations, not breakage — update the policy as part of this phase; promotion to enforcing stays in Phase 7).
- How consent state is exposed for Phase 4's future ad loader (a readable signal must exist; its exact shape is an implementation call).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | Design-token audit complete — hardcoded values consolidated into `@theme` tokens; spacing/motion/elevation categories added | See `## Standard Stack` (Tailwind v4 token mechanics), `## Don't Hand-Roll`, and the verified hardcoded-value inventory in `## Runtime State Inventory`-style code audit below |
| DSGN-03 | Site supports dark + light themes with a toggle | See `next-themes` findings in `## Standard Stack` and `## Code Examples` |
| MONY-01 | Consent-management layer live (Google-certified TCF CMP) gating ad scripts + PostHog session replay for EEA/UK | See `## Architecture Patterns` (CMP → PostHog plumbing) and `## Common Pitfalls` |
| OPS-01 | Every user-facing change ships WITH PostHog instrumentation + GSC verification | See `## Validation Architecture` and existing `posthog.capture` conventions cited in code |

</phase_requirements>

## Summary

This phase has two independent-but-sequenced tracks that share one foundation (Tailwind v4 `@theme` tokens) and one closing gate (PostHog + GSC verification).

**Consent (MONY-01):** Google's own **Privacy & Messaging** tool (formerly "Funding Choices") is the correct, free, Google-certified TCF v2.2 CMP — no third-party CMP evaluation needed since D-01 locks this in. It is configured inside the AdSense account (hence D-02's signup-first sequencing) and delivered as a script tag scoped to the account's `pub-` publisher ID, which exists immediately after AdSense signup — **before** site-approval completes `[CITED: support.google.com/adsense]`. The CMP exposes the standard `window.__tcfapi` TCF API; the codebase-facing work is (1) load the CMP script, (2) read its consent signal via `__tcfapi('addEventListener', 2, cb)`, and (3) translate that into calls against `posthog-js`'s **already-installed, version-confirmed** consent API: `opt_in_capturing()` / `opt_out_capturing()` for full gating, plus `disable_session_recording: true` + `startSessionRecording()`/`stopSessionRecording()` for replay, plus the `cookieless_mode: "on_reject"` config key for D-05/D-06's "cookies off, anonymous analytics stays" requirement `[VERIFIED: node_modules/posthog-js/dist/module.js]`. The single biggest implementation risk (see Pitfalls) is that `cookieless_mode` is a **global** config key — it must not be allowed to silently cookie-block non-EEA/UK visitors, which would violate D-07.

**Themes (DSGN-03, DSGN-01):** `next-themes` is the industry-standard, shadcn-documented library for this exact stack (Next.js App Router + Tailwind class-based dark mode) `[CITED: ui.shadcn.com/docs/dark-mode/next]`, confirmed clean on the npm registry (26.5M weekly downloads, no postinstall script, active maintainer repo). The codebase currently hardcodes `<html className="dark">` (`app/layout.tsx:91`) and has never designed real light-mode values — `:root` in `globals.css` still holds unmodified stock shadcn oklch values (D-09's gap). Tailwind v4's `@theme` directive auto-generates utilities from CSS custom properties: `--spacing-*` → spacing utilities, `--shadow-*` → elevation utilities, `--duration-*`/`--ease-*` → motion utilities — all three categories D-11 requires are absent from the current `globals.css`, which only defines color/radius/font tokens plus ad-hoc `--animate-*` keyframes. The DSGN-01 audit's scope is **larger than the ~32 hardcoded classes found in `app/`+`components/`**: a code-level grep this session found an additional **16 hardcoded Tailwind palette references living inside `lib/constants.ts`** (`GRADE_COLORS`, `percentileColor()`, `percentileBg()`) that return literal class-name strings, invisible to a JSX-only grep. Separately, `CLASS_COLORS` (11 raw hex WoW class colors) and `ROLE_COLORS` (4 raw hex) are consumed via inline `style={{ color: ... }}` in 9 component files — these bypass Tailwind classes entirely and need CSS-custom-property tokenization (not Tailwind utility classes) to satisfy D-12. `app/og/route.tsx` already maintains its own hardcoded hex mirror of `GRADE_COLORS` with an explicit comment explaining why (Satori/OG image generation cannot consume CSS variables) — this is a legitimate, pre-existing, documented exception the audit should preserve, not "fix."

**Primary recommendation:** Install `next-themes@0.4.6`; keep Google Privacy & Messaging's CMP signal (`gdprApplies` from `__tcfapi`) as the single source of truth for both the consent banner's geo-gating **and** the PostHog `cookieless_mode` decision, so the two systems can't drift; extend `globals.css`'s existing `@theme inline` block with `--spacing-*`, `--shadow-*`, `--duration-*`/`--ease-*` categories before sweeping component-level hardcoded classes; treat `lib/constants.ts`'s three color-returning functions and the `CLASS_COLORS`/`ROLE_COLORS` raw-hex maps as in-scope for the DSGN-01 audit, distinct from the `app/`+`components/` file sweep.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Consent banner rendering & geo-targeting | Browser / Client (3rd-party script) | Frontend Server (script mount point in `app/layout.tsx`) | Google's CMP is a client-side script that self-renders the dialog and does its own geo-detection; the app only needs to load it and read its output |
| Consent signal → PostHog gating | Browser / Client | — | `__tcfapi` listener and `posthog-js` calls both run client-side in `PostHogProvider.tsx` (already the single PostHog init point) |
| Session replay start/stop | Browser / Client | — | `posthog.startSessionRecording()`/`stopSessionRecording()` are client SDK calls; no server involvement |
| Theme resolution (no-flash) | Browser / Client (inline script) | Frontend Server (SSR shell via `suppressHydrationWarning`) | `next-themes` injects a blocking inline script that runs before paint; SSR must not fight it via `suppressHydrationWarning` on `<html>` |
| Theme toggle UI | Browser / Client | — | `Navbar.tsx` is already a client component (`usePathname`, `useState`) |
| Design tokens (`@theme`) | CDN / Static (compiled CSS) | Browser / Client (resolves `var()` at paint time) | Tailwind compiles `@theme` into a static CSS file at build; runtime only flips `.dark`/`:root` scope via the `class` attribute |
| CLASS_COLORS / ROLE_COLORS per-theme resolution | CDN / Static (CSS custom properties) | Browser / Client (inline `style` reads `var()`) | Same mechanism as theme tokens — must migrate off raw hex constants to `var(--class-*)` so the browser resolves the active theme's value |
| CSP header (CMP domains) | API / Backend (`next.config.ts` headers) | — | Response headers are set server-side in Next.js config, independent of client script loading |
| Consent + theme event capture | Browser / Client (`posthog.capture`) | — | Follows existing `posthog.capture()` call-site convention throughout `app/` |
| GSC verification | Ops (external, post-deploy) | — | MCP `gscServer` check happens after deploy, outside the request path |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next-themes` | `0.4.6` `[VERIFIED: npm registry]` (verified via `npm view next-themes version` + `gsd_run query package-legitimacy check` → `OK`, 26.5M weekly downloads, `github.com/pacocoursey/next-themes`, no postinstall script) | Theme persistence, no-flash inline script, `class`-attribute dark-mode toggling | The Next.js App Router standard; shadcn/ui's own docs (`ui.shadcn.com/docs/dark-mode/next`) recommend it verbatim `[CITED: ui.shadcn.com/docs/dark-mode/next]` |
| Google Privacy & Messaging (script tag, no npm package) | N/A — hosted at `fundingchoicesmessages.google.com/i/pub-{ID}?ers=1` | Google-certified TCF v2.2 CMP; renders the EEA/UK consent dialog, exposes `__tcfapi`, does its own geo-targeting | Locked by D-01; only Google-certified CMP that is free and native to the AdSense account the project is signing up for `[CITED: support.google.com/adsense/answer/7670013]` |
| `posthog-js` | `1.360.0` (already installed — no version change needed) | Consent-gated analytics + session replay | Already the project's analytics SDK; ships first-class `cookieless_mode`, `opt_in_capturing()`/`opt_out_capturing()`, `startSessionRecording()`/`stopSessionRecording()` APIs purpose-built for exactly this GDPR pattern `[VERIFIED: node_modules/posthog-js/dist/module.js, module.d.ts]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind v4 `@theme` (already installed, `tailwindcss@^4`) | current | Spacing/motion/elevation token categories | Extend the existing `@theme inline` block in `app/globals.css` — no new package required |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Privacy & Messaging | Third-party TCF CMP (CookieYes, Cookiebot, Secure Privacy, TrustArc) | D-01 already locked Google's own CMP — third-party CMPs add cost/config surface and duplicate what AdSense already provides for free; not evaluated further per CONTEXT.md constraint |
| `next-themes` | Hand-rolled `localStorage` + `useEffect` theme toggle | Reinvents the no-flash inline-script problem (FOUC) that `next-themes` already solved; D-11/D-08 discretion note explicitly names `next-themes` as the assumed default |
| `posthog-js` `cookieless_mode` | Fully custom consent-state machine gating `posthog.capture()` calls manually | `cookieless_mode` is a first-class, tested SDK feature for exactly D-05/D-06's "cookies off, anonymous analytics stays" pattern — hand-rolling duplicates SDK internals (session/distinct-ID handling) that are easy to get subtly wrong |

**Installation:**
```bash
export PATH="$HOME/.local/node20/bin:$PATH"
npm install next-themes
```

**Version verification:** `npm view next-themes version` → `0.4.6`, published `2025-03-11`. `posthog-js` requires no install — already at `^1.360.0` in `package.json`, confirmed present in `node_modules`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `next-themes` | npm | published 2025-03-11 (mature project, long-running) | 26,547,324/wk | `github.com/pacocoursey/next-themes` | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No other new npm packages are required by this phase — the Google CMP integration is a script tag (not an npm dependency), and `posthog-js` is already installed and in use.

## Architecture Patterns

### System Architecture Diagram

```
Visitor request
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│ app/layout.tsx (SSR shell)                               │
│  <html suppressHydrationWarning>                          │
│    <head> Google CMP script tag (async) ─────────────┐   │
│    <body>                                              │   │
│      <ThemeProvider attribute="class"                  │   │
│                      defaultTheme="system" enableSystem>│   │
│        inline no-flash script (next-themes, pre-paint) │   │
│        <PostHogProvider>  ◄────────────────────────────┼───┤ CMP script loads,
│          <Navbar> (theme toggle: Light/Dark/System) │   │  self-renders dialog
│          {children}                                  │   │  for EEA/UK only
│        </PostHogProvider>                            │   │  (Google-side geo check)
│    </body>                                           │   │
└───────────────────────────────────────────────────────┘   │
      │                                                      │
      ▼                                                      ▼
 CSS resolves --color-*, --spacing-*,                 __tcfapi('addEventListener', 2, cb)
 --shadow-*, --duration-* tokens                       fires on load + every TC-string change
 from :root/.dark scope set by                                │
 the "class" attribute                                        ▼
                                                     cb(tcData) → tcData.gdprApplies,
                                                     tcData.eventStatus ('tcloaded' | 'useractioncomplete')
                                                                │
                                          ┌─────────────────────┴─────────────────────┐
                                          ▼                                           ▼
                              gdprApplies === true                        gdprApplies === false
                              (EEA/UK visitor)                             (everyone else, incl. Googlebot)
                                          │                                           │
                              consent accepted? ───┐                    posthog.opt_in_capturing()
                                          │         │                    posthog.startSessionRecording()
                                    yes   │   no/pending                  (today's default-on behavior, D-07)
                                          │         │
                          opt_in_capturing()   cookieless_mode:'on_reject'
                          startSessionRecording()   already applies —
                          (full cookies+replay)     memory persistence,
                                                     no replay (D-05/D-06)
```

### Recommended Project Structure

```
app/
├── layout.tsx                      # CMP <Script> tag + ThemeProvider mount (existing file, edited)
├── components/
│   ├── Navbar.tsx                  # + 3-state theme toggle icon (existing file, edited)
│   ├── PostHogProvider.tsx         # + __tcfapi listener → opt_in/opt_out/session-recording calls (existing file, edited)
│   └── ThemeProvider.tsx           # new: thin wrapper re-exporting next-themes' ThemeProvider (client component boundary)
lib/
│   └── consent.ts                  # new (suggested): typed __tcfapi wrapper + TCData narrowing, single place other code reads consent state from (also the Phase 4 ad-loader signal per Claude's Discretion)
app/globals.css                     # @theme inline: + --spacing-*, --shadow-*, --duration-*/--ease-* categories; :root redesigned light palette (D-09); CLASS_COLORS/ROLE_COLORS become --class-*/--role-* CSS vars (D-12)
lib/constants.ts                    # CLASS_COLORS/ROLE_COLORS raw hex → token refs; GRADE_COLORS/percentileColor/percentileBg hardcoded Tailwind classes → semantic token classes
```

### Pattern 1: CMP `gdprApplies` as the single geo-consent source of truth

**What:** Rather than doing a second, independent geo-IP lookup to decide "is this an EEA/UK visitor," read Google CMP's own `tcData.gdprApplies` boolean from the `__tcfapi('addEventListener', 2, cb)` callback and drive all downstream PostHog decisions off that same value.
**When to use:** Any time code needs to know "should this visitor be gated" — both the initial `cookieless_mode` decision and any Phase 4 ad-loader check.
**Example:**
```typescript
// Source: IAB TCF v2.2 spec pattern (window.__tcfapi is the standard CMP API surface;
// tcData shape per IAB TCF v2 spec) [CITED: developers.google.com/tag-platform/security/guides/implement-TCF-strings]
declare global {
  interface Window {
    __tcfapi?: (
      command: "addEventListener" | "removeEventListener",
      version: 2,
      callback: (tcData: { gdprApplies: boolean; eventStatus: string }, success: boolean) => void
    ) => void;
  }
}

function listenForConsent(onResolved: (accepted: boolean, gdprApplies: boolean) => void) {
  window.__tcfapi?.("addEventListener", 2, (tcData, success) => {
    if (!success) return;
    if (tcData.eventStatus === "tcloaded" || tcData.eventStatus === "useractioncomplete") {
      // TCF spec: purpose 1 (storage/access) consent for Google as vendor is what
      // gates cookie-based analytics; exact purpose-id check is an implementation detail.
      onResolved(/* derive from tcData.purpose.consent[1] */ true, tcData.gdprApplies);
    }
  });
}
```
**Why this matters:** Avoids two independent geo-detection mechanisms (CMP's + a hypothetical Vercel-header/IP lookup) drifting out of sync, which would violate D-07 (non-EEA visitors must never be treated as "pending").

### Pattern 2: `next-themes` no-flash setup (App Router)

**What:** Blocking inline script sets the `class` attribute on `<html>` before first paint, avoiding FOUC.
**When to use:** Root layout only — one `ThemeProvider` for the whole app.
**Example:**
```tsx
// Source: shadcn/ui official docs [CITED: ui.shadcn.com/docs/dark-mode/next]
// and next-themes README [CITED: github.com/pacocoursey/next-themes]
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```
`suppressHydrationWarning` must be on `<html>` (this codebase currently sets `className="dark"` directly on `<html>` at `app/layout.tsx:91` — that hardcoded class is what D-08/D-10 replace).

### Pattern 3: PostHog consent gating with `cookieless_mode`

**What:** Use the SDK's built-in cookieless mode instead of a hand-rolled analytics kill-switch.
**When to use:** Whenever "reject" should mean "reduce, not eliminate" analytics (D-05/D-06).
**Example:**
```typescript
// Source: verified against installed node_modules/posthog-js/dist/module.js
// (compiled bundle confirms 'always' | 'on_reject' as the only two literal
// cookieless_mode values, and opt_out_capturing_by_default as a real config key)
posthog.init(POSTHOG_KEY, {
  api_host: "/ingest",
  cookieless_mode: "on_reject",       // EEA/UK pending or explicit-reject -> memory persistence, no cookies
  disable_session_recording: true,     // replay never auto-starts; started explicitly below
  // ...existing config (autocapture, capture_pageview: false, etc.)
});

// On resolved consent (from Pattern 1's listener):
if (gdprApplies) {
  if (accepted) {
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
  }
  // else: cookieless_mode:'on_reject' already applies automatically — no call needed
} else {
  // Non-EEA/UK: must NOT sit at "pending" (which cookieless_mode:'on_reject' would
  // otherwise cookie-block) — opt in immediately to preserve today's default-on behavior (D-07).
  posthog.opt_in_capturing();
  posthog.startSessionRecording();
}
```

### Anti-Patterns to Avoid

- **Setting `cookieless_mode: 'on_reject'` globally without an immediate `opt_in_capturing()` for non-EEA/UK visitors:** the compiled SDK logic treats *any* visitor whose consent status is still `PENDING` as cookieless when this mode is set — silently cookie-blocking every non-EEA/UK visitor (violates D-07) unless the app explicitly opts them in on load.
- **Hardcoding `<html className="dark">` alongside `next-themes`:** next-themes owns the `class` attribute at runtime; a hardcoded class fights its inline script and reintroduces FOUC. Remove the hardcoded class as part of the `next-themes` migration.
- **Tokenizing `CLASS_COLORS`/`ROLE_COLORS` as Tailwind utility classes:** these are consumed via inline `style={{ color: ... }}`, not `className`. They need CSS custom properties (`var(--class-warrior)`) referenced from `style`, not `@theme`-generated Tailwind classes — a different remediation than the `text-slate-400`-style sweep.
- **"Fixing" `app/og/route.tsx`'s hardcoded `GRADE_HEX`/hex color constants:** these exist because Satori (`next/og`'s `ImageResponse`) cannot resolve CSS custom properties or Tailwind classes at all — it's a static image renderer, not a browser. This is a legitimate, already-documented exception (see the file's own comment at line 16), not audit debt.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence + no-flash | Custom `localStorage` + inline `<script>` FOUC-prevention | `next-themes` | Solved problem; shadcn's own docs assume it; hand-rolling risks re-introducing flash-of-wrong-theme edge cases (SSR/hydration mismatch) |
| TCF consent state parsing | Custom TC-string decoder | `window.__tcfapi` event listener (reads Google CMP's own resolved `tcData` object) | The CMP already decodes the IAB TC string; re-parsing it is redundant and error-prone versus reading `tcData.gdprApplies`/`eventStatus` directly |
| Cookieless anonymous analytics | Custom distinct-ID randomization + manual cookie suppression | `posthog-js`'s `cookieless_mode: 'on_reject'` | First-class SDK feature; handles server-side IP+UA+salt hashing, session ID lifecycle, and persistence-type switching internally — the exact behavior D-05/D-06 need |

**Key insight:** Every "hard part" of this phase (no-flash theming, TCF signal parsing, cookieless analytics) already has a first-class, currently-installed-or-installable library solution. The actual engineering work is **wiring**, not building: connecting the CMP's consent signal to PostHog's existing consent API, and extending the existing `@theme` block rather than inventing a new token system.

## Common Pitfalls

### Pitfall 1: `cookieless_mode` cookie-blocks visitors it shouldn't

**What goes wrong:** Setting `cookieless_mode: 'on_reject'` in the single global PostHog init silently degrades analytics for every visitor whose consent status is `PENDING` — including all non-EEA/UK visitors, who never see a banner and therefore never leave the `PENDING` state.
**Why it happens:** `cookieless_mode` has no built-in geo-awareness; it only reacts to PostHog's internal consent status (`DENIED`/`PENDING`/opted-in), not to `gdprApplies`.
**How to avoid:** Immediately call `posthog.opt_in_capturing()` for any visitor where the CMP reports `gdprApplies === false` (Pattern 1), before that visitor's consent state can be evaluated as `PENDING`.
**Warning signs:** A drop in PostHog session-replay volume or distinct-user counts for non-EU traffic after this phase ships — check this specifically as part of the OPS-01 PostHog verification step.

### Pitfall 2: CSP additions break, or fail to unblock, the CMP script

**What goes wrong:** Google explicitly does not publish a fixed CSP domain allowlist for AdSense/GPT/Funding Choices because the domains change over time `[CITED: support.google.com/adsense/answer/16283098]` — a hand-typed allowlist risks being incomplete on day one or silently stale later.
**Why it happens:** Google's own recommended fix (nonce-based strict CSP with `'strict-dynamic'`) is a bigger architectural change than "add a domain," and this project's CSP is intentionally still in report-only mode.
**How to avoid:** Add the known `fundingchoicesmessages.google.com` script-src entry as a starting point, ship in report-only mode (already true), and use the existing violation-report-driven CSP process (documented in `next.config.ts`'s own comments and `CONCERNS.md`) to discover and add any further domains post-deploy — do not attempt to enumerate every CMP domain in advance.
**Warning signs:** Consent dialog fails to render, or `__tcfapi` never fires — check the browser console for CSP violation reports naming a blocked Google domain.

### Pitfall 3: DSGN-01 audit undercounts hardcoded values by grepping only `.tsx` files

**What goes wrong:** A grep for Tailwind palette classes across `app/` and `components/` finds ~32-33 hits, but misses hardcoded color values hiding inside **functions that return class-name strings** (`lib/constants.ts`'s `GRADE_COLORS`, `percentileColor()`, `percentileBg()` — 16 additional hardcoded palette references confirmed this session) and misses raw-hex constants consumed via inline `style` (`CLASS_COLORS`, `ROLE_COLORS` — 15 raw hex values across `lib/constants.ts`, consumed in 9+ component files).
**Why it happens:** These two patterns don't match a simple `className="..."`-shaped grep; they require reading `lib/constants.ts` directly.
**How to avoid:** Scope the audit to include `lib/constants.ts` explicitly, and split remediation into two kinds: (a) Tailwind-class-returning functions → migrate to token-backed class names; (b) raw-hex maps consumed via inline `style` → migrate to CSS custom properties referenced via `var()`, which is the mechanism D-12 (per-theme class colors) actually requires.
**Warning signs:** The audit report claims "no known exceptions" (per D-11) but a follow-up grep of `lib/` still turns up `text-amber-400`-style strings.

### Pitfall 4: Theme toggle causes hydration mismatch without `suppressHydrationWarning` in the right place

**What goes wrong:** React logs a hydration warning (and in the worst case, a visible flash) because `next-themes`' inline script mutates the `<html>` element's `class` attribute before React hydrates, and React's hydration diffing flags the mismatch.
**Why it happens:** `suppressHydrationWarning` only suppresses warnings **one level deep** — it must be applied to the exact element `next-themes` mutates (`<html>`), not `<body>` or a wrapper `<div>`.
**How to avoid:** Confirm `suppressHydrationWarning` is on the `<html>` tag in `app/layout.tsx` (which already exists there for other reasons — verify it isn't accidentally removed when refactoring the hardcoded `className="dark"` away).
**Warning signs:** Console warning `Warning: Extra attributes from the server: class` or a brief flash of the wrong theme on load.

## Code Examples

### Consent-gated PostHog init (replaces `PostHogProvider.tsx`'s current always-on config)

```typescript
// Source: pattern synthesized from verified posthog-js 1.360.0 API surface
// (node_modules/posthog-js/dist/module.d.ts, module.js) + TCF v2.2 __tcfapi spec
// [CITED: developers.google.com/tag-platform/security/guides/implement-TCF-strings]
useEffect(() => {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.i.posthog.com",
    person_profiles: "always",
    capture_pageview: false,
    capture_pageleave: true,
    cookieless_mode: "on_reject",
    disable_session_recording: true,
    session_recording: { maskAllInputs: true },
    enable_recording_console_log: false,
    autocapture: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
      window.__tcfapi?.("addEventListener", 2, (tcData, success) => {
        if (!success) return;
        if (tcData.eventStatus !== "tcloaded" && tcData.eventStatus !== "useractioncomplete") return;
        if (!tcData.gdprApplies) {
          // Non-EEA/UK: preserve today's default-on behavior (D-07)
          ph.opt_in_capturing();
          ph.startSessionRecording();
          return;
        }
        // EEA/UK: derive accepted/rejected from tcData (exact purpose-id check is
        // an implementation detail left to Claude's Discretion per CONTEXT.md)
        const accepted = /* derive from tcData */ false;
        if (accepted) {
          ph.opt_in_capturing();
          ph.startSessionRecording();
        }
        // else: cookieless_mode:'on_reject' + disable_session_recording already
        // gives D-05/D-06's "cookies+replay off, anonymous analytics stays"
        ph.capture("consent_resolved", { accepted, region: "eea_uk" });
      });
    },
  });
}, []);
```

### `@theme` token extension (motion + elevation categories, additive to existing `globals.css`)

```css
/* Source: Tailwind v4 @theme mechanics [CITED: tailwindcss.com/docs/theme] */
@theme inline {
  /* ...existing color/radius/font tokens unchanged... */

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 350ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Elevation (new category) */
  --shadow-card: 0 1px 3px oklch(0 0 0 / 12%), 0 1px 2px oklch(0 0 0 / 8%);
  --shadow-elevated: 0 4px 6px oklch(0 0 0 / 15%), 0 2px 4px oklch(0 0 0 / 10%);
}
```
Note: `surface-card`/`surface-card-elevated` in the current `globals.css` (lines 333–347) already hand-write these exact shadow values inline — migrating them to `--shadow-*` tokens both satisfies D-11's "elevation category" requirement and de-duplicates the existing hardcoded values.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Third-party CMPs required for TCF compliance | Google Ad Manager/AdSense/AdMob ship a native, Google-certified TCF v2.2 CMP ("Privacy & Messaging", formerly "Funding Choices") | Rebranded/consolidated into ad platforms; Jan 16 2024 was Google's enforcement deadline for *any* certified CMP on EEA/UK ad traffic `[CITED: support.google.com]` | No separate CMP vendor evaluation needed — D-01 already reflects this |
| TCF `getTCData()` polling | `addEventListener` event-driven consent reads (TCF 2.2 deprecated `getTCData` in favor of listeners) | TCF v2.2 spec update | Code should use `__tcfapi('addEventListener', 2, cb)`, not a `getTCData` polling loop |
| `tailwind.config.js` JS-based theme config | Tailwind v4 CSS-first `@theme` directive | Tailwind v4 release | Already reflected in this codebase's `globals.css`; this phase extends the pattern rather than migrating to it |

**Deprecated/outdated:** TCF `getTCData` API command (superseded by `addEventListener`); `tailwind.config.js`-based `theme.extend` (superseded by `@theme` in CSS, already not used here).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Google Privacy & Messaging does not require AdSense site-approval to complete before the consent message can go live (only account existence for the `pub-` ID) | Summary, Standard Stack | If wrong, the Phase 1 consent-banner deliverable would be blocked on AdSense's days-to-weeks approval review, changing phase sequencing significantly — verify directly in the AdSense "Privacy & messaging" settings UI once the account exists (D-02's task), before relying on this for planning |
| A2 | The exact TCF purpose/vendor-consent field to read for "did this visitor accept or reject" (used as a placeholder `/* derive from tcData */` in the code example) | Architecture Patterns (Pattern 1), Code Examples | If the wrong purpose ID or vendor-consent path is read, the app could treat a partial/legitimate-interest-only consent as full acceptance or vice versa — this needs to be nailed down against the live CMP's actual configured message during implementation, not assumed from the generic TCF spec |
| A3 | `fundingchoicesmessages.google.com` is the correct (and sufficient) CSP `script-src`/`frame-src` addition for the CMP | Common Pitfalls (Pitfall 2), Code Examples | Google explicitly states its domains "change over time" and declines to publish a fixed list — if additional domains are needed (e.g., a separate iframe host for the dialog UI), the report-only CSP will surface them as violations post-deploy, so the risk is a temporary gap rather than a silent failure |

**If this table is empty:** N/A — see entries above; all three should be confirmed against the live Google account/CMP config during implementation rather than treated as locked facts.

## Open Questions

1. **Exact TCF purpose/consent field for "accepted vs. rejected"**
   - What we know: `tcData.gdprApplies` (boolean) and `tcData.eventStatus` (`'tcloaded'`/`'useractioncomplete'`) are confirmed fields per the TCF v2.2 spec pattern.
   - What's unclear: The precise purpose-ID or vendor-consent boolean to read as "user said yes" depends on how the consent message is configured inside the live AdSense account (which doesn't exist yet at research time).
   - Recommendation: Resolve during implementation, once the AdSense account + CMP message are actually configured (D-02's task) — inspect the live `tcData` object shape via browser devtools rather than guessing from generic docs.

2. **Where should the "Phase 4 ad-loader consent signal" live?**
   - What we know: CONTEXT.md leaves this to Claude's Discretion; a `lib/consent.ts` module wrapping `__tcfapi` (suggested in Recommended Project Structure) is a natural single source of truth.
   - What's unclear: Whether Phase 4 will want a React hook, a plain module-level getter, or a value threaded through context — that phase's requirements aren't researched yet.
   - Recommendation: Build the minimal typed wrapper this phase needs; don't over-engineer an API surface for a not-yet-researched future phase.

3. **Automated test coverage for theme toggle / consent banner behavior**
   - What we know: The project's only test environment is `vitest` with `environment: "node"` (no `jsdom`/React Testing Library present); existing tests are all pure-logic (`url-parser`, `cla-constants`, `analysis-engine`, `async-pool`, `api-utils`).
   - What's unclear: Whether this phase should add a browser-like test environment for component-level assertions, or rely on manual/GSD `verify-work` UAT for the visually-driven success criteria (theme toggle persists, no unreadable route).
   - Recommendation: Given `nyquist_validation` is enabled, plan pure-logic unit tests where possible (e.g., a `resolveConsentState()`/`deriveCookielessDecision()` helper extracted from the wiring, and a script-based token-audit report generator), and treat the visual/behavioral criteria as `checkpoint:human-verify` / UAT rather than adding a new jsdom test harness mid-phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | All phases | ✓ | node v20.20.2, npm 10.8.2 (at `~/.local/node20/bin`, not on default PATH) | — |
| `next-themes` (npm) | DSGN-03 | ✗ (not yet installed) | — | `npm install next-themes` — no fallback needed, trivial install |
| Google AdSense account | MONY-01 (CMP config) | ✗ (does not exist yet) | — | D-02 makes signup a Phase 1 task; no code fallback — this is a blocking prerequisite for the CMP's live message, not just code |
| `posthog-js` | MONY-01 (consent gating) | ✓ | `1.360.0` (installed) | — |
| Vitest + jsdom/RTL for component tests | Validation Architecture (optional) | ✗ (only node-env vitest present) | — | Rely on manual UAT for UI-behavior criteria (see Open Question 3) rather than adding a new test harness |

**Missing dependencies with no fallback:**
- AdSense account must exist before the live CMP message can be configured — this is a manual, human-in-the-loop step (D-02), not automatable by an agent.

**Missing dependencies with fallback:**
- `next-themes` — trivial `npm install`.
- Component-level automated tests — fall back to manual verification (`checkpoint:human-verify` / GSD `verify-work`) for the visual/behavioral success criteria.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | `vitest.config.ts` (`environment: "node"`, includes `lib/**/*.test.ts` and `app/**/*.test.ts`) |
| Quick run command | `export PATH="$HOME/.local/node20/bin:$PATH" && npx vitest run <path>` |
| Full suite command | `export PATH="$HOME/.local/node20/bin:$PATH" && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MONY-01 | Consent decision logic (gdprApplies → opt-in/cookieless branch) resolves correctly for EEA-accept / EEA-reject / EEA-pending / non-EEA inputs | unit | `npx vitest run lib/consent.test.ts` | ❌ Wave 0 — extract the branching logic in Pattern 3/Code Examples into a pure, testable function (e.g. `deriveConsentAction(tcData): 'opt-in-full' | 'cookieless' | 'opt-in-non-eea'`) rather than testing it inline inside `PostHogProvider.tsx`'s `useEffect` |
| DSGN-01 | Token audit script/report correctly flags all hardcoded Tailwind-class and raw-hex occurrences (including the `lib/constants.ts` cases found this session) | unit (if a grep-based audit script is built) or manual | `npx vitest run lib/token-audit.test.ts` (if built) | ❌ Wave 0 — only needed if the "audit report" artifact (Claude's Discretion) is implemented as a script rather than a manual document |
| DSGN-03 | Theme toggle persists across routes; no route unreadable in either theme | manual/UAT | N/A — visual/behavioral | ❌ No automated component-test harness exists (see Open Question 3); rely on `checkpoint:human-verify` |
| OPS-01 | `posthog.capture()` fires for consent accept/reject and theme toggle events with expected event names/props | manual (PostHog live-events check) or unit (if capture calls are wrapped in testable helper functions) | N/A / project convention | — Follows existing project convention of manual PostHog verification, not unit-tested `posthog.capture` call sites elsewhere in the codebase |

### Sampling Rate

- **Per task commit:** `npx vitest run <changed-test-file>`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`; manual UAT for theme/consent visual behavior since no component-test harness exists

### Wave 0 Gaps

- [ ] `lib/consent.ts` + `lib/consent.test.ts` — pure function(s) for deriving the consent/cookieless-mode decision from `tcData`, testable without a browser or the real `__tcfapi` global (mock it)
- [ ] Decide whether the DSGN-01 "audit report" is a manual markdown document or a grep-based script with its own test — if the latter, needs `lib/token-audit.test.ts` (or equivalent) plus a fixture
- [ ] No jsdom/RTL harness exists for component-level assertions (theme toggle click behavior, consent dialog rendering) — accept manual UAT for these per Open Question 3, or explicitly scope in a jsdom+RTL setup as its own Wave 0 task if the planner decides automated coverage is worth the setup cost

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface touched this phase |
| V3 Session Management | no | No session/auth changes; PostHog "session" here is analytics session replay, not an auth session |
| V4 Access Control | no | No access-control surface |
| V5 Input Validation | no (minimal) | No new user-input-accepting endpoints; `__tcfapi` payload is read-only, sourced from a script this project doesn't control the internals of but does trust as first-party Google infrastructure |
| V6 Cryptography | no | No cryptographic operations introduced |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Third-party script (Google CMP) given broad `script-src`/`unsafe-inline` CSP latitude | Tampering / Elevation of Privilege | Keep CSP in report-only mode (already the project's posture) while onboarding the CMP; scope any new `script-src`/`connect-src`/`frame-src` additions to the specific `fundingchoicesmessages.google.com` host rather than a wildcard; monitor violation reports before considering CSP promotion (Phase 7, OPS-02, out of scope here) |
| Consent state spoofing/bypass (a user or extension manipulating `window.__tcfapi` to force "accepted") | Tampering | Out of scope to fully defend against (the CMP script itself is the trust boundary Google provides) — no additional mitigation needed beyond using the CMP's own documented API surface; do not build a custom consent cookie that could be forged independently of the CMP's signal |
| Session replay capturing sensitive input despite consent | Information Disclosure | Already mitigated in the existing codebase: `maskAllInputs: true` stays on regardless of consent state (per D-07's note "`maskAllInputs` remains on") — this phase must not regress that setting when restructuring the PostHog init |

## Sources

### Primary (HIGH confidence)
- `node_modules/posthog-js/dist/module.js`, `module.d.ts` (installed package source, read directly this session) — `opt_in_capturing()`, `opt_out_capturing()`, `has_opted_in_capturing()`, `has_opted_out_capturing()`, `startSessionRecording()`, `stopSessionRecording()`, `cookieless_mode: 'always' | 'on_reject'`, `opt_out_capturing_by_default`, persistence literals `"memory"`/`"localStorage+cookie"`
- `npm view next-themes version` / `gsd_run query package-legitimacy check` — `next-themes@0.4.6`, `OK` verdict, 26.5M weekly downloads
- Codebase reads this session: `app/globals.css`, `app/layout.tsx`, `app/components/PostHogProvider.tsx`, `app/components/Navbar.tsx`, `next.config.ts`, `lib/constants.ts`, `app/og/route.tsx`, `.planning/codebase/CONCERNS.md`

### Secondary (MEDIUM confidence — WebSearch cross-checked against official docs)
- `ui.shadcn.com/docs/dark-mode/next` — next-themes App Router setup pattern
- `github.com/pacocoursey/next-themes` — no-flash inline script, `enableSystem`, 3-state toggle mechanics
- `tailwindcss.com/docs/theme` — `@theme` directive, `--spacing-*`/`--shadow-*`/`--duration-*`/`--ease-*` token generation
- `posthog.com/tutorials/cookieless-tracking`, `posthog.com/docs/session-replay/how-to-control-which-sessions-you-record` — `cookieless_mode` modes, `startSessionRecording`/`stopSessionRecording` usage
- `support.google.com/adsense/answer/7670013`, `support.google.com/adsense/answer/16283098` — Privacy & Messaging setup, CSP guidance (Google declines to publish a fixed domain allowlist)
- Smashing Magazine / SEO industry sources on Google's intrusive-interstitial legal-notice exemption

### Tertiary (LOW confidence — flagged for validation during implementation)
- Whether AdSense site-approval (vs. just account creation) gates the live consent message going out — see Assumption A1
- `fundingchoicesmessages.google.com` as the complete CSP domain requirement — see Assumption A3 and Pitfall 2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `next-themes` verified via registry + legitimacy check; `posthog-js` consent API verified by reading the actually-installed package source, not just docs
- Architecture: MEDIUM — CMP↔PostHog wiring pattern is sound and grounded in verified SDK behavior, but the exact TCF purpose-ID field to read depends on the not-yet-created live AdSense/CMP configuration (Open Question 1)
- Pitfalls: HIGH — Pitfall 1 (cookieless_mode global scope) and Pitfall 3 (hardcoded-value undercounting) are both grounded in direct source/codebase reads this session, not speculation

**Research date:** 2026-09-05
**Valid until:** 30 days for the Tailwind/next-themes findings (stable libraries); re-verify the AdSense/CMP-specific findings (Assumptions A1–A3) at the start of implementation regardless of age, since they depend on an account that doesn't exist yet at research time
