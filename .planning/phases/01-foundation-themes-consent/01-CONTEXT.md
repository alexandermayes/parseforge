# Phase 1: Foundation — Themes & Consent - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors control their own privacy and their own theme, on a token system every later phase builds on. This phase delivers: (1) a Google-certified TCF consent layer that gates PostHog session replay now and provides the consent signal ad code reads in Phase 4; (2) a dark/light theme toggle that persists across pages and routes with no route unreadable in either theme; (3) a design-token audit consolidating hardcoded values into Tailwind v4 `@theme` tokens with spacing/motion/elevation categories added; (4) PostHog events for consent + theme and a GSC verification pass (the OPS-01 gate every later phase repeats).

Out of scope: any actual ad code or slots (Phase 4), the site-wide visual redesign (Phase 7), CSP promotion to enforcing (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Consent provider & banner UX
- **D-01:** CMP is **Google Privacy & Messaging** — Google's own free certified TCF CMP, managed inside the AdSense account. — **Reversibility:** costly — swapping CMPs later means redoing the consent message config, the script loader, CSP allowlist entries, and Phase 4's ad-integration assumptions all build on this choice.
- **D-02:** User has a Google account but **no AdSense account yet** — AdSense sign-up is a Phase 1 task (sign-up only, zero ad code). It requires the user at the keyboard (their Google account). Site-approval review can take days–weeks and runs in the background, which also de-risks Phase 4.
- **D-03:** Consent prompt is **geo-targeted to EEA/UK only** (Google CMP native geo-targeting). US/other visitors see no banner; Googlebot (US IPs) never hits an interstitial. No US-state privacy message for now.
- **D-04:** EEA/UK prompt format: **full-screen/center dialog** (Google's standard GDPR format) — chosen for higher consent rates over a bottom banner.

### What "reject" means for analytics
- **D-05:** On reject (EEA/UK): **session replay + cookies off, cookieless anonymous PostHog analytics stays** (memory-only persistence). Core events (analysis runs, shares, consent accept/reject rates) remain measurable for the EEA segment.
- **D-06:** Pre-choice EEA/UK visitors are treated as **not consented** — replay off, cookieless analytics only, until they accept.
- **D-07:** **Outside EEA/UK, session replay stays default-on** as today (`maskAllInputs` remains on). Consent gating applies only where legally required.

### Default theme & light-mode bar
- **D-08:** First-time visitors get the theme from **system preference** (`prefers-color-scheme`), not forced dark. OS-light users land in light mode on day one.
- **D-09:** Because of D-08, light mode must be a **designed ParseForge light palette** in this phase — replace the stock shadcn `:root` values with branded, contrast-tuned light values across all routes. Phase 7 still refines route-by-route; Phase 1 makes light a genuine first impression, not just "readable".
- **D-10:** Theme toggle: **navbar icon, 3-state (Light / Dark / System)** — the next-themes standard. Explicit choice persists and overrides OS; "System" restores auto-follow. Visible on every route including mobile.

### Token audit depth
- **D-11:** **Full consolidation now** — migrate all hardcoded Tailwind palette classes (~32 found in `app/`, plus any in `components/ui/`) to semantic `@theme` tokens, and add the missing **spacing, motion, elevation** token categories. No "fix light-breakers only" shortcut; the audit report should show no known exceptions.
- **D-12:** WoW class colors get **per-theme adjusted variants** (the Wowhead approach): keep each class's recognizable hue, tune lightness/saturation for light backgrounds so Priest (white), Rogue (yellow), Paladin (pink) stay legible. Tokenized as paired light/dark values; `CLASS_COLORS` consumers resolve via token, not raw hex.

### Claude's Discretion
- Theme persistence/no-flash mechanism (next-themes with inline script is the assumed default; equivalent approach fine if better for Next 16/React 19).
- Exact plumbing from Google CMP's TCF consent signal to PostHog config (consent-change listener, opt-in/opt-out API choice).
- PostHog event names for consent/theme — follow the existing snake_case `posthog.capture` conventions in the codebase.
- Semantic token naming and the location/format of the token audit report artifact.
- CSP report-only header additions for CMP script/frame/connect sources (report-only mode means new sources surface as violations, not breakage — update the policy as part of this phase; promotion to enforcing stays in Phase 7).
- How consent state is exposed for Phase 4's future ad loader (a readable signal must exist; its exact shape is an implementation call).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & sequencing
- `.planning/ROADMAP.md` — Phase 1 entry: goal, 4 success criteria, MONY-01→MONY-02 sequencing note, OPS-01 standing gate
- `.planning/REQUIREMENTS.md` — DSGN-01 (token audit), DSGN-03 (dark+light toggle), MONY-01 (certified TCF CMP gating ads + replay), OPS-01 (PostHog + GSC ship gate)
- `.planning/PROJECT.md` — constraints: brand must stay recognizably ParseForge; measurement ships WITH changes; SEO invariants; manual confirmed deploys only

### Known concerns this phase closes
- `.planning/codebase/CONCERNS.md` — §"Session Replay: Missing EU Consent Banner" (the debt MONY-01 closes; cites `app/components/PostHogProvider.tsx:46`) and §"Content-Security-Policy: Still in Report-Only Mode" (context for CMP script sources; do NOT promote CSP this phase)

No other external specs — decisions above capture the discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/globals.css` — Tailwind v4 theming already structured: `@theme inline` (41 color tokens, 7 radius, 2 font), `@custom-variant dark (&:is(.dark *))`, `.dark {}` block holding ParseForge's real palette, `:root` holding **stock shadcn light values never designed**. The token audit extends this file; missing categories are spacing/motion/elevation.
- `components/ui/*` (shadcn primitives) — already consume semantic tokens (`bg-background`, etc.); the sweep targets page-level components that bypass them.
- Existing `posthog.capture("…")` call sites across `app/` — naming/props pattern for the new consent + theme events.

### Established Patterns
- Site is **hardcoded dark**: `app/layout.tsx:91` renders `<html lang="en" className="dark">`. Theme work replaces this with a provider + `suppressHydrationWarning`; `next-themes` is NOT currently installed.
- `app/components/PostHogProvider.tsx` — single init point (`disable_session_recording: false`, TODO at line 46). All consent gating of PostHog threads through this one file.
- ~32 hardcoded palette classes (`text-slate-400`-style) in `app/` per grep; count `components/ui/` too during research.
- `lib/constants.ts` `CLASS_COLORS` — raw hex game constants consumed by analysis tables/grids; D-12 turns these into per-theme tokens.

### Integration Points
- `next.config.ts:10–44` — CSP (report-only) `script-src`/`connect-src`/frame sources need Google CMP domains added; report-only mode surfaces gaps as violation reports (feeds Phase 7 OPS-02).
- `app/layout.tsx` — where the CMP script tag and theme provider both mount.
- Navbar (`app/components/Navbar.tsx`) — theme toggle placement (top-right convention), must work on mobile.
- OPS-01 verification: GSC via MCP `gscServer`; check the consent dialog doesn't register as intrusive interstitial for indexing (geo-targeting makes this a non-issue for US-crawling Googlebot, but verify).

</code_context>

<specifics>
## Specific Ideas

- Class colors in light mode: "the Wowhead approach" — recognizable hue preserved, tuned for light backgrounds.
- Consent dialog: Google's standard GDPR full-screen format, not a custom-styled banner.
- Light palette must read as ParseForge (brand constraint), not generic shadcn light.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation — Themes & Consent*
*Context gathered: 2026-09-05*
