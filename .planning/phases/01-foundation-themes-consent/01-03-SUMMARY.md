---
phase: 01-foundation-themes-consent
plan: 03
subsystem: infra
tags: [posthog, consent, gdpr, tcf, google-privacy-messaging, csp, vitest]

requires:
  - phase: 01-01
    provides: "next-themes shell (unrelated but same layout.tsx)"
  - phase: 01-02
    provides: "AdSense account + published EEA/UK consent message; NEXT_PUBLIC_GOOGLE_CMP_PUB_ID in Vercel prod + .env.example"
provides:
  - "lib/consent.ts — deriveConsentAction (pure TCF decision function), startConsentListener (tcfapi listener + CMP_TIMEOUT_MS fail-closed timer), getConsentState (readable snapshot for Phase 4's ad loader)"
  - "Google Privacy & Messaging CMP script tag in app/layout.tsx, gated on NEXT_PUBLIC_GOOGLE_CMP_PUB_ID"
  - "Consent-gated PostHogProvider: cookieless_mode, replay start/stop, consent_resolved/consent_unavailable events, all four ConsentAction branches wired"
  - "Report-only CSP extended with fundingchoicesmessages.google.com (script-src, connect-src, frame-src)"
affects: [phase-04]

actuals:
  tokens: 4700
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Pure decision function (lib/consent.ts::deriveConsentAction), errors-as-data via a narrow string-literal union, mirroring lib/url-parser.ts"
    - "Plain module-level getter (getConsentState) instead of a React hook/context, for a not-yet-researched Phase 4 consumer"
    - "Fail-closed timeout pattern: CMP_TIMEOUT_MS timer distinguishes 'blocked/absent CMP' from an ordinary in-progress consent dialog, so telemetry doesn't false-positive on ordinary dialog-open pending"

key-files:
  created:
    - lib/consent.ts
    - lib/consent.test.ts
  modified:
    - app/layout.tsx
    - app/components/PostHogProvider.tsx
    - next.config.ts

key-decisions:
  - "Added a timedOut boolean to ConsentState (beyond the plan's literal 3-field sketch) so PostHogProvider can fire consent_unavailable only for the genuine CMP_TIMEOUT_MS fail-closed path, never for an ordinary in-progress 'cmpuishown' dialog-open event that also resolves to 'pending' — prevents a false-positive telemetry flood on every normal EEA/UK visit."
  - "startConsentListener's live-event callback treats an intermediate 'pending' TCF event (dialog still open, not yet decided) as state-only: it updates getConsentState()'s gdprApplies field but does not invoke onResolve, since there's no decision yet to act on."
  - "Implemented the TCF v2.2 removeEventListener call in the listener's disposer (using the listenerId echoed back in tcData) — the plan's action text mentioned 'removes the listener' without detailing the mechanism; this is the documented spec-correct way to do it."
  - "Recorded decision for 01-UI-SPEC.md E2 · error (previously unresolved): silent fail-closed is the accepted final behavior when the CMP is blocked by CSP or an ad-blocker — no hand-rolled consent banner fallback, since it would not be a Google-certified TCF signal and Phase 4's ad loader must never read an uncertified one. consent_unavailable is what makes that silence measurable."

patterns-established:
  - "TCF payload -> PostHog action translation lives entirely in lib/consent.ts (pure) + PostHogProvider.tsx's single init/loaded callback (SDK calls) — no second posthog.init() call anywhere."

requirements-completed: [MONY-01, OPS-01]

coverage:
  - id: D1
    description: "deriveConsentAction resolves the full TCF branch table: non-EEA immediate opt-in, EEA accept/reject on useractioncomplete (tolerant of numeric/string purpose-1 key), pending while the dialog is open, and fail-closed pending on a nullish or gdprApplies-absent payload"
    requirement: "MONY-01"
    verification:
      - kind: unit
        ref: "lib/consent.test.ts#deriveConsentAction (7 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "startConsentListener fires opt-in-non-eea immediately without waiting for a user action; fires pending exactly once via the CMP_TIMEOUT_MS fail-closed timer when no TCF event ever arrives; getConsentState() starts pending/unresolved and updates correctly on a late TCF event without re-triggering the timeout branch"
    requirement: "MONY-01"
    verification:
      - kind: unit
        ref: "lib/consent.test.ts#getConsentState + #startConsentListener (4 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Google Privacy & Messaging CMP script tag mounted in app/layout.tsx (gated on NEXT_PUBLIC_GOOGLE_CMP_PUB_ID, next/script strategy=afterInteractive), and the report-only CSP extended with fundingchoicesmessages.google.com in script-src, connect-src, and a new frame-src — header stays Content-Security-Policy-Report-Only, no promotion to enforcing"
    requirement: "MONY-01"
    verification:
      - kind: other
        ref: "grep -c 'fundingchoicesmessages.google.com' next.config.ts (4); grep -q frame-src; grep -q Content-Security-Policy-Report-Only; grep -q fundingchoicesmessages app/layout.tsx; npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D4
    description: "PostHogProvider handles all four ConsentAction branches from a single startConsentListener registration: opt-in-full and opt-in-non-eea both opt in + start replay, cookieless takes no SDK action (cookieless_mode + disabled-by-default replay already cover it), and the timeout-only pending path fires consent_unavailable; consent_resolved fires with {accepted, gdpr_applies} on both decided branches; maskAllInputs/enable_recording_console_log privacy defaults preserved verbatim; listener disposer returned from useEffect"
    requirement: "OPS-01"
    verification:
      - kind: unit
        ref: "npm test (full 45-test suite, no regression)"
        status: pass
      - kind: other
        ref: "grep checks for cookieless_mode, disable_session_recording: true, maskAllInputs: true, consent_resolved, consent_unavailable, opt-in-non-eea, getConsentState in app/components/PostHogProvider.tsx and lib/consent.ts; npx tsc --noEmit; npx eslint (scoped, 0 findings)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Live end-to-end behavior: US-IP visitor sees no dialog and replay stays active; EEA/UK-IP visitor sees Google's full-screen dialog with no half-rendered shell/layout jump; reject keeps the page usable with no replay and a consent_resolved(accepted:false) event; accept starts replay and fires consent_resolved(accepted:true); the resolved tcData payload genuinely carries purpose-1 consent under the live published message's configuration (01-RESEARCH.md Assumption A2)"
    requirement: "MONY-01"
    verification: []
    human_judgment: true
    rationale: "Requires a live browser session against the real published AdSense/CMP message (US IP + EEA/UK VPN, devtools inspection of the actual tcData shape) — no jsdom/RTL harness exists in this project (01-RESEARCH.md Open Question 3) and the CMP's live configuration didn't exist at research time (Assumption A1/A2). Deferred to the end-of-phase human-check sweep per workflow.human_verify_mode=end-of-phase, alongside 01-01's and 01-02's deferred visual/behavioral checks."

duration: 20min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 3: Consent Layer Summary

**Google Privacy & Messaging (certified TCF v2.2 CMP) wired end-to-end into PostHog via a pure `lib/consent.ts` decision module — EEA/UK session replay now gates on real consent, non-EEA visitors keep today's default-on analytics, and a blocked/absent CMP fails closed and is measurable via `consent_unavailable`.**

## Performance
- **Duration:** ~20min
- **Started:** 2026-09-06T14:36:00-07:00 (approx.)
- **Completed:** 2026-09-06T14:43:00-07:00
- **Tasks:** 2 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `lib/consent.ts`: zero-import pure module (`declare global` for `__tcfapi`) exporting `deriveConsentAction`, `TcfConsentData`, `ConsentAction`, `CMP_TIMEOUT_MS`, `startConsentListener`, `getConsentState`, `ConsentState` — full TCF branch table plus a fail-closed timeout and a readable module-level consent snapshot for Phase 4's ad loader
- `app/layout.tsx`: Google Privacy & Messaging `<Script>` tag mounted beside the existing Wowhead scripts, rendered only when `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` is a non-empty string
- `app/components/PostHogProvider.tsx`: `cookieless_mode: "on_reject"`, `disable_session_recording: true`, and a single `startConsentListener` registration inside `loaded` switching on all four `ConsentAction` values — opt-in-full/opt-in-non-eea start replay, cookieless is a no-op (already covered by config), the timeout-only pending path fires `consent_unavailable`; `consent_resolved` fires with `{accepted, gdpr_applies}` on both decided branches; stale consent-banner TODO removed; listener disposer returned from the effect
- `next.config.ts`: report-only CSP extended with `fundingchoicesmessages.google.com` across `script-src`, `connect-src`, and a new `frame-src` directive; header stays `Content-Security-Policy-Report-Only`
- `lib/consent.test.ts`: 11 passing vitest cases (7 for `deriveConsentAction`'s branch table + nullish/absent-field fail-closed cases, 1 for the initial `getConsentState()` value, 3 for `startConsentListener`'s immediate non-EEA opt-in / timeout-exactly-once / late-event-after-timeout behavior, using fake timers and a stubbed `window.__tcfapi`)

## Task Commits
1. **Task 1: End-to-end "EEA visitor accepts and replay starts"** - `b260ecb` (test, RED) → `bf3abb4` (feat, GREEN)
2. **Task 2: Complete the branch table** - `761de03` (test, RED) → `67ab745` (feat, GREEN)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `lib/consent.ts` - Pure TCF decision function, `__tcfapi` listener with fail-closed timeout, readable consent snapshot
- `lib/consent.test.ts` - 11 vitest cases covering the full branch table and listener/timeout behavior
- `app/layout.tsx` - Google Privacy & Messaging CMP script tag, gated on `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID`
- `app/components/PostHogProvider.tsx` - Consent-gated init (`cookieless_mode`, `disable_session_recording: true`) + all four `ConsentAction` branches + `consent_resolved`/`consent_unavailable` telemetry
- `next.config.ts` - Report-only CSP extended with the CMP host across `script-src`/`connect-src`/`frame-src`

## Decisions Made
- Added a `timedOut` boolean to `ConsentState` so the provider can fire `consent_unavailable` only on a genuine blocked/absent-CMP timeout, never on an ordinary in-progress "dialog still open" event that also resolves to `"pending"` — avoids a telemetry false-positive on every normal EEA/UK visit.
- A live intermediate TCF event (e.g. `cmpuishown`) updates `getConsentState()`'s `gdprApplies` field but does not invoke the `onResolve` callback — there's no actionable decision yet.
- Implemented the TCF v2.2 `removeEventListener` call in the listener's disposer using the `listenerId` the CMP echoes back in `tcData`, per spec (the plan's action text said "removes the listener" without detailing the mechanism).
- Recorded the previously-unresolved 01-UI-SPEC.md E2 · error decision: silent fail-closed is the accepted final behavior for a blocked CMP — no hand-rolled banner (would not be a Google-certified TCF signal); `consent_unavailable` makes that population measurable instead of invisible. Ad-blocker users outside the EEA/UK also land cookieless under this path — the accepted cost of failing closed rather than guessing at a region.

## Deviations from Plan
None — plan executed as written. The `timedOut` field and `removeEventListener` wiring above are elaborations within the plan's explicit "Claude's Discretion" latitude (exact `ConsentState`/listener plumbing was left to implementation), not corrections to a bug or gap.

## Issues Encountered
None.

## User Setup Required
None — `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` was already set in Vercel prod and documented in `.env.example` by plan 01-02; this plan only reads it. Plan 01-08's deploy is what makes this code live.

## Next Phase Readiness
The consent layer is fully wired and unit-tested: `npx vitest run lib/consent.test.ts` (11/11), `npm test` (45/45, no regression), `npx tsc --noEmit` clean, `npx eslint` clean on all five touched files. Phase 4's ad loader has a stable, minimal `getConsentState()` signal to consult without needing to touch `__tcfapi` directly.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`): Task 2's `<human-check>` block — confirming against the *live* AdSense/CMP configuration that (a) US-IP visitors see no dialog and keep default-on replay, (b) EEA/UK-IP visitors see Google's full-screen dialog with no rendering glitch, (c) reject/accept correctly drive `consent_resolved` in PostHog live events, and (d) the real `tcData` payload's purpose-1 field matches what `deriveConsentAction` reads (01-RESEARCH.md Assumption A2). This requires a real browser session with the published consent message and an EEA/UK VPN — no jsdom/RTL harness exists in this project (01-RESEARCH.md Open Question 3). Will be exercised together with 01-01's and 01-02's deferred checks at phase close.

**Known limitation, not a stub:** the CSP is still report-only (unchanged this plan, by design — promotion to enforcing is Phase 7 / OPS-02); any further CMP-related domains the live dialog needs will surface as report-only violations, per 01-RESEARCH.md Pitfall 2.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- `lib/consent.ts` — FOUND
- `lib/consent.test.ts` — FOUND
- `app/layout.tsx` — FOUND (CMP script tag present)
- `app/components/PostHogProvider.tsx` — FOUND (all four branches present)
- `next.config.ts` — FOUND (CSP extended)
- Commit `b260ecb` — FOUND in `git log`
- Commit `bf3abb4` — FOUND in `git log`
- Commit `761de03` — FOUND in `git log`
- Commit `67ab745` — FOUND in `git log`
- `npx vitest run lib/consent.test.ts` — re-run clean, 11/11 pass
- `npm test` — re-run clean, 45/45 pass
- `npx tsc --noEmit` — re-run clean, exit 0
- `npx eslint` (scoped to touched files) — 0 findings
- Task 1 and Task 2 acceptance criteria — re-verified, all pass
