# API Coverage — Phase 2.1 (PostHog Consent Gate Hotfix)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
>
> Two external surfaces are integrated by this phase: **Vercel's geolocation request
> headers** (read server-side in `app/api/geo/route.ts`) and **posthog-js 1.360.0's
> consent / super-property API** (called client-side in
> `app/components/PostHogProvider.tsx`). No new package is installed — both surfaces
> already ship with the project's pinned dependencies (`next@16.1.6`,
> `posthog-js@1.360.0`).

## Surface 1 — Vercel geolocation request headers

Read only inside `app/api/geo/route.ts`. Every header below is attached by Vercel's
edge to every request reaching the deployment; the decision here is which ones this
phase reads, not which ones exist.

| capability | decision | reason |
|---|---|---|
| `x-vercel-ip-country` | INTEGRATE | |
| `x-vercel-ip-country-region` | OPT-OUT | The consent-region set (D-03) is defined at country granularity — Google Privacy & Messaging's targeted list names countries (EEA, UK, Switzerland), never sub-national regions, so a region read would add a field with no consumer. |
| `x-vercel-ip-city` | OPT-OUT | City is personal data under GDPR and this phase's endpoint must return a single boolean; reading it would put PII into a request path that exists to protect privacy. |
| `x-vercel-ip-latitude` | OPT-OUT | Same PII reason as city, at finer precision. Nothing in the consent decision needs coordinates. |
| `x-vercel-ip-longitude` | OPT-OUT | Same PII reason as latitude. |
| `x-vercel-ip-timezone` | OPT-OUT | Timezone is a fingerprinting vector and is not part of any consent-region definition. |

Any further `x-vercel-ip-*` header Vercel exposes now or later inherits the same
OPT-OUT reason by default: this endpoint reads exactly one header and returns exactly
one boolean. Widening it is a new decision, not an omission.

## Surface 2 — posthog-js consent & super-property API

Method names below are taken from `node_modules/posthog-js/dist/module.d.ts`
(v1.360.0). "INTEGRATE" means this phase calls it; "OPT-OUT" means this phase
deliberately does not.

| capability | decision | reason |
|---|---|---|
| `init` | INTEGRATE | |
| `opt_in_capturing({ captureEventName: false })` | INTEGRATE | |
| `startSessionRecording` | INTEGRATE | |
| `register` | INTEGRATE | |
| `capture` | INTEGRATE | |
| `opt_out_capturing` | OPT-OUT | The explicit-reject path is owned by the SDK's own `cookieless_mode: "on_reject"` handling, which already yields memory-only persistence and no cookie. Forcing the `DENIED` state ourselves would additionally trigger `opt_in_capturing`'s `reset(true)` branch on any later opt-in (RESEARCH Pitfall 4), destroying the session and page-view managers. D-05 keeps the reject path exactly as-is. |
| `get_explicit_consent_status` | OPT-OUT | Would be the natural assertion target for a provider-level test, but this project has no browser test harness (Vitest `environment: "node"`, no RTL, no jsdom — `vitest.config.ts`) and D-06 explicitly does not add one. The consent decision is unit-tested as a pure function in `lib/consent.ts` instead. |
| `is_capturing` | OPT-OUT | Same missing-harness reason as `get_explicit_consent_status`. The end-to-end equivalent is verified for real by D-10's headless-Chrome netlog against a deployed URL, not by a stubbed SDK. |
| `has_opted_in_capturing` | OPT-OUT | Same missing-harness reason; no runtime branch in this phase depends on reading the opt-in flag back. |
| `has_opted_out_capturing` | OPT-OUT | Same missing-harness reason. |
| `clear_opt_in_out_capturing` | OPT-OUT | No flow in this phase revokes a stored consent choice; revocation is the CMP's own surface (Google Privacy & Messaging), not ours. |
| `stopSessionRecording` | OPT-OUT | Replay is started only on a full opt-in and never needs stopping within a page load; `disable_session_recording: true` is the default-off state D-05 preserves. |
| `set_config` | OPT-OUT | All config is passed once at `init`; mutating it post-init would make the consent state depend on call ordering, the exact bug class this phase removes. |
| `register_once` | OPT-OUT | `consent_gate_path` (D-07) must reflect the path that actually admitted the visitor, and the geo path resolves before the TCF path can; a write-once register would silently keep a stale value. |
| `unregister` | OPT-OUT | Nothing un-sets `consent_gate_path` within a page load. |
| `identify` / `alias` / `group` | OPT-OUT | Identity resolution is outside this hotfix; `person_profiles: "always"` is unchanged from Phase 1. |

## Not integrated at all

| surface | decision | reason |
|---|---|---|
| PostHog HogQL query API (`scripts/posthog-live-check.mjs`) | OPT-OUT | D-08 leaves this to Claude's discretion. The live-traffic check ships as an exact HogQL query recorded in `docs/OPS-01-SHIP-GATE.md` and run through the PostHog MCP (`switch-project 337485` first), not as a committed script — a script would need a PostHog personal API key on the machine running the gate, adding a credential-handling surface to a hotfix whose whole point is to keep the change small (CONTEXT `<specifics>`: "If a plan grows past ~6 files of source change, something is wrong"). |
| Google `__tcfapi` (TCF v2.2) | OPT-OUT (unchanged) | Already integrated in Phase 1 via `lib/consent.ts`; D-05 keeps it exactly as-is. This phase adds no new TCF command and changes no CMP configuration. |

---

*Produced during phase planning, 2026-09-14. Detector: `api-coverage.cjs --json` →
`detected: true` (signal: "PostHog SDK lifecycle (`init`, `opt_in_capturing`,
`register`)").*
