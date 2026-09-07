# Phase 01 — External API Coverage Matrix

Phase 1 integrates two external API surfaces: the IAB **TCF v2.2 `__tcfapi`** browser API
exposed by Google Privacy & Messaging (the CMP, D-01), and the **PostHog JS SDK** consent /
capture surface it drives. Both are enumerated below; every capability is either INTEGRATE
or an explicit, reasoned OPT-OUT. Source of truth: `lib/consent.ts`,
`app/components/PostHogProvider.tsx`, `app/components/ThemeToggle.tsx`.

## TCF v2.2 `window.__tcfapi` (Google Privacy & Messaging CMP)

| capability | decision | reason |
|---|---|---|
| addEventListener | INTEGRATE | `startConsentListener` registers the single listener that receives every `tcData` event and derives the `ConsentAction` |
| removeEventListener | INTEGRATE | disposer returned by `startConsentListener` unregisters via the `listenerId` echoed by the CMP |
| ping | OPT-OUT | CMP presence is detected by the `CMP_TIMEOUT_MS` fail-closed timer (3 s, `consent_unavailable` telemetry); a `ping` poll would duplicate that signal |
| getInAppTCData | OPT-OUT | in-app (mobile SDK) surface; ParseForge is a web app |
| getVendorList | OPT-OUT | no per-vendor logic — purpose 1 (`purpose.consents[1]`) is the only field read; vendor granularity is Phase 4's ad-loader concern |
| getTCData (legacy v2.0/2.1) | OPT-OUT | removed in TCF v2.2; `addEventListener` delivers the same payload |
| tcData.gdprApplies | INTEGRATE | region gate — `false` → `opt-in-non-eea` immediately; missing → `pending` (fail closed) |
| tcData.eventStatus | INTEGRATE | only `tcloaded` / `useractioncomplete` count as resolved; `cmpuishown` is treated as in-progress |
| tcData.purpose.consents[1] | INTEGRATE | decides `opt-in-full` vs `cookieless`; read under both numeric and string keys |
| tcData.purpose.legitimateInterests | OPT-OUT | not consulted — Phase 1 has no LI-based processing; revisit with Phase 4 ads |
| tcData.vendor.* | OPT-OUT | see getVendorList |
| tcData.tcString | OPT-OUT | not stored or forwarded; no downstream consumer needs the encoded string this phase |

## PostHog JS SDK (consent + capture surface driven by the CMP signal)

| capability | decision | reason |
|---|---|---|
| init | INTEGRATE | single init in `PostHogProvider` with cookieless_mode "on_reject", disable_session_recording, maskAllInputs, no console capture — privacy-safe defaults per D-05/D-06 |
| opt_in_capturing | INTEGRATE | called on `opt-in-full` and `opt-in-non-eea` |
| opt_out_capturing | OPT-OUT | `cookieless_mode: "on_reject"` already yields memory-only, cookieless operation on reject; an explicit opt-out would drop the anonymous cookieless events D-05 permits |
| startSessionRecording | INTEGRATE | started only after `opt-in-full` / `opt-in-non-eea`; never auto-starts |
| stopSessionRecording | OPT-OUT | recording never starts in the reject/pending branches, so there is nothing to stop; consent changes reload the CMP state rather than toggling mid-session |
| capture | INTEGRATE | events consent_resolved, consent_unavailable, theme_changed, plus pageview via PostHogPageView — OPS-01 grep evidence in `docs/OPS-01-SHIP-GATE.md` |
| identify / alias / group | OPT-OUT | ParseForge has no user accounts; nothing to identify |
| set_config (runtime reconfiguration) | OPT-OUT | consent branches are expressed at init time via `cookieless_mode`; no runtime config flips needed |
| feature flags / experiments / surveys | OPT-OUT | out of scope for Phase 1 (consent + themes); no flag-gated behaviour shipped |
| debug | INTEGRATE | development only (`NODE_ENV === "development"`) |

## Not external API integrations (listed to pre-empt the detector)

- `app/api/*` route handlers are first-party Next.js routes, not an external surface.
- Warcraft Logs GraphQL (`lib/wcl-client.ts`) is pre-existing and untouched by Phase 1.
- Vercel Analytics / Speed Insights are drop-in components with no API surface consumed by this code.
