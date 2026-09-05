# Phase 1: Foundation — Themes & Consent - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-05
**Phase:** 1-Foundation — Themes & Consent
**Areas discussed:** Consent provider & banner UX, What 'reject' means for analytics, Default theme & light-mode bar, Token audit depth in Phase 1

---

## Consent provider & banner UX

| Option | Description | Selected |
|--------|-------------|----------|
| Google Privacy & Messaging | Google's own free CMP via AdSense account; zero vendor cost; guaranteed Phase 4 AdSense compatibility; limited styling | ✓ |
| Third-party certified CMP | Cookiebot/CookieYes-style; more styling control; extra vendor + script; free-tier limits | |
| You decide | Claude picks during research, defaulting to Google's CMP | |

**User's choice:** Google Privacy & Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| EEA/UK only | Geo-targeted; US visitors and Googlebot never see a banner | ✓ |
| EEA/UK + US state privacy message | Adds CPRA-style opt-out for US visitors | |
| Everyone worldwide | Consistent but imposes friction on visitors who don't need it | |

**User's choice:** EEA/UK only

| Option | Description | Selected |
|--------|-------------|----------|
| Need to create one | Sign-up step required in-phase | |
| Already have one | CMP config can start immediately | |
| Have Google account, no AdSense | Sign-up quick; approval review takes days–weeks; CMP configurable while pending | ✓ |

**User's choice:** Have Google account, no AdSense
**Notes:** AdSense sign-up becomes a Phase 1 task (requires the user — it's their Google account); approval running in background de-risks Phase 4.

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen/center dialog | Google's standard GDPR format; higher consent rates | ✓ |
| Bottom-anchored banner | Less intrusive; typically lower consent rates | |

**User's choice:** Full-screen/center dialog

---

## What 'reject' means for analytics

| Option | Description | Selected |
|--------|-------------|----------|
| Replay off, cookieless analytics stays | Anonymous memory-only-persistence events keep flowing; EEA stays visible in funnels; consent rates measurable | ✓ |
| Everything off on reject | Strictest reading; EEA traffic invisible, rejection rate unmeasurable | |
| You decide after research | Researcher checks PostHog consent-mode guidance | |

**User's choice:** Replay off, cookieless analytics stays

| Option | Description | Selected |
|--------|-------------|----------|
| Keep replay default-on outside EEA/UK | Preserves replay volume; maskAllInputs already on | ✓ |
| Replay only after consent, everywhere | Globally conservative; loses replay for the majority segment | |

**User's choice:** Keep replay default-on outside EEA/UK
**Notes:** Pre-choice EEA visitors treated as not-consented (noted, not asked — only compliant default).

---

## Default theme & light-mode bar

| Option | Description | Selected |
|--------|-------------|----------|
| Dark | Current brand identity; zero change for existing users | |
| Follow system preference | OS-light users land in light automatically | ✓ |
| Dark now, system after Phase 7 | Defer the flip until light is validated everywhere | |

**User's choice:** Follow system preference (declined the dark-default recommendation)

| Option | Description | Selected |
|--------|-------------|----------|
| Designed ParseForge light palette | Real branded light theme in Phase 1; Phase 7 refines | ✓ |
| Clean + readable, polish later | Minimum-bar light until Phase 7 | |

**User's choice:** Designed ParseForge light palette

| Option | Description | Selected |
|--------|-------------|----------|
| Navbar icon, 3-state | Light/Dark/System cycle (next-themes standard) | ✓ |
| Navbar icon, simple 2-state | Light ↔ Dark only; no return to system-follow | |
| Footer placement | Minimal navbar, lower discoverability | |

**User's choice:** Navbar icon, 3-state

---

## Token audit depth in Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Full consolidation now | All hardcoded palette classes → semantic tokens; spacing/motion/elevation categories added; audit report has no known exceptions | ✓ |
| Light-breakers + categories only | Fix only what breaks light mode; sweep rest in Phase 7 | |

**User's choice:** Full consolidation now

| Option | Description | Selected |
|--------|-------------|----------|
| Per-theme adjusted variants | Keep recognizable class hues, tune for light backgrounds (Wowhead approach); paired light/dark tokens | ✓ |
| Exact Blizzard colors + container treatment | Canonical hex preserved; dark chips behind names in light mode | |

**User's choice:** Per-theme adjusted variants

---

## Claude's Discretion

- Theme persistence/no-flash mechanism (next-themes assumed default)
- CMP TCF signal → PostHog config plumbing
- PostHog event naming (follow existing snake_case conventions)
- Semantic token naming; token audit report location/format
- CSP report-only additions for CMP sources
- Shape of the consent signal Phase 4's ad loader will read

## Deferred Ideas

None — discussion stayed within phase scope.
