"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  startConsentListener,
  deriveConsentGateOutcome,
  publishConsentGatePath,
} from "@/lib/consent";
import type { ConsentAction } from "@/lib/consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

// `posthog.init` is called at MODULE scope, not inside PostHogProvider's own
// `useEffect`, and guarded by `typeof window !== "undefined"` so it never
// evaluates during server-side module evaluation. Why: `capture()` is a bare
// early return until `init()` has set the SDK's loaded flag — a call that
// races ahead of `init()` is silently dropped, not queued (read directly from
// node_modules/posthog-js/dist/module.js this session). React runs child
// effects before parent effects on mount, so `PostHogPageView`'s effect (a
// child of this provider) was firing its `$pageview` capture BEFORE this
// provider's own effect had called `init()` — losing the very first page
// view on every load, for every visitor, regardless of consent region. Module
// scope removes the race entirely: by the time any component effect runs,
// `init()` has already executed. This is chosen over a root
// `instrumentation-client.ts` deliberately — it keeps the init config, the
// consent wiring and the readiness gate in one file, which is what this
// hotfix's six-source-file budget allows, and the `typeof window` guard
// already prevents the call from evaluating during SSR.
if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.i.posthog.com",
    person_profiles: "always",
    capture_pageview: false, // manually tracked via PostHogPageView
    capture_pageleave: true,
    // Consent gating (MONY-01): EEA/UK visitors who haven't accepted (or who
    // reject) get memory-only persistence and no cookies. Non-EEA/UK
    // visitors are opted in immediately below, so this global setting can't
    // silently cookie-block them (01-RESEARCH.md Pitfall 1).
    //
    // SDK semantics (diagnosed 2026-09-14, 02.1-DIAGNOSIS.md): under
    // `cookieless_mode: "on_reject"`, a PENDING consent state makes
    // `isOptedOut()` return true, and while opted out `capture()` DISCARDS
    // every event rather than sending it cookieless or queueing it for
    // later. The regression this hotfix fixes was exactly this: capture
    // stayed PENDING forever for any visitor Google's CMP never showed a
    // dialog to, because opt-in previously depended solely on a `__tcfapi`
    // callback that never fires for them. Do not reintroduce a path where a
    // visitor can stay PENDING indefinitely without an explicit opt-in call.
    cookieless_mode: "on_reject",
    // Session replay never auto-starts; it's started explicitly once
    // consent resolves to a full opt-in (below).
    disable_session_recording: true,
    session_recording: {
      // Mask all inputs by default. This masks the report-URL input too, which
      // is an acceptable trade for a privacy-safe default (vs. the previous
      // un-masking that could capture whatever a user typed).
      maskAllInputs: true,
    },
    // Don't capture console logs into replays — they can hoover up anything
    // logged client-side.
    enable_recording_console_log: false,
    // Autocapture clicks, inputs, form submits
    autocapture: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

function PostHogPageView({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ready || !pathname || !ph) return;
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    ph.capture("$pageview", { $current_url: url });
  }, [ready, pathname, searchParams, ph]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [consentReady, setConsentReady] = useState(false);
  const appliedRef = useRef(false);
  // Dedupes outbound consent_resolved/consent_unavailable events by gate
  // path: some CMPs (e.g. Google Funding Choices' "manage consent"
  // re-confirmation flow) can emit a second resolved TCF event for the same
  // visitor. `startConsentListener`'s own `hasResolved` guard only covers
  // its timeout branch, not a repeat non-timeout resolution, so a second
  // identical resolution would otherwise re-fire the same PostHog event and
  // inflate the OPS-01 gate's consent_gate_path counts. Keyed by gate path
  // (not a single boolean) so a genuine decision change (e.g. reject, then
  // later accept via re-confirmation) still gets its own event.
  const capturedGatePathRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let disposeConsentListener: (() => void) | undefined;
    let mounted = true;

    // Bound with a timeout so a hung request (dropped connection, stalled
    // edge function) can't leave `consentReady` stuck false forever — the
    // exact class of bug this hotfix exists to eliminate, just via a
    // stalled request instead of a stuck consent state. AbortSignal.timeout
    // rejects the fetch promise, which the existing `.catch` fail-closed
    // path below already handles.
    fetch("/api/geo", { signal: AbortSignal.timeout(5000) })
      .then((res) => res.json())
      .then((body: unknown) => {
        if (!mounted || appliedRef.current) return;
        // Runtime-validate the parsed body: a malformed-but-valid-JSON
        // response (e.g. a Vercel platform-level failure payload) must fail
        // CLOSED the same as a network error, not silently opt a visitor in
        // via `!undefined === true`.
        const isConsentRegion =
          typeof (body as { isConsentRegion?: unknown } | null)?.isConsentRegion === "boolean"
            ? (body as { isConsentRegion: boolean }).isConsentRegion
            : true;
        applyDecision(isConsentRegion);
      })
      .catch(() => {
        // Fail closed: a network or CSP failure must never opt a European
        // visitor in. Treat it exactly like a consent-region visitor.
        if (!mounted || appliedRef.current) return;
        applyDecision(true);
      });

    // Single executor (D-06): the ONLY place in this file that turns a
    // ConsentGateOutcome into SDK calls. Both the geo path and the TCF path
    // route through it, in a fixed order: register the gate-path property
    // BEFORE opting in, so consent_gate_path is already in the in-memory
    // props bag by the time the first $pageview (or any other event) is
    // captured (D-07); then opt in when the outcome says to; then start
    // replay when the outcome says to; then fire the outcome's event, if any.
    function applyOutcome(outcome: ReturnType<typeof deriveConsentGateOutcome>) {
      if (!outcome) return;
      // Each posthog.* call below is individually guarded so the SDK is
      // never touched on a deployment with no PostHog key (previews, for
      // one) — but the gate path is still published unconditionally right
      // after the register call, because Phase 4's ad gate (lib/ads.ts)
      // needs the decision regardless of whether PostHog itself is active.
      if (POSTHOG_KEY) posthog.register({ consent_gate_path: outcome.gatePath });
      publishConsentGatePath(outcome.gatePath);
      if (POSTHOG_KEY && outcome.optIn) posthog.opt_in_capturing({ captureEventName: false });
      if (POSTHOG_KEY && outcome.startReplay) posthog.startSessionRecording();
      if (POSTHOG_KEY && outcome.event && !capturedGatePathRef.current.has(outcome.gatePath)) {
        capturedGatePathRef.current.add(outcome.gatePath);
        posthog.capture(outcome.event, outcome.eventProps);
      }
    }

    function applyDecision(isConsentRegion: boolean) {
      appliedRef.current = true;

      if (!isConsentRegion) {
        // Non-consent-region visitor (D-04): opt in with NO CMP dependency
        // and no __tcfapi involvement whatsoever.
        applyOutcome(deriveConsentGateOutcome(false, null));
        setConsentReady(true);
        return;
      }

      // Consent-region visitor (D-05): keep the existing TCF flow exactly as
      // it is today. deriveConsentGateOutcome (lib/consent.ts) now decides
      // which SDK calls fire; this callback only executes the result via the
      // single executor above.
      disposeConsentListener = startConsentListener((action: ConsentAction) => {
        applyOutcome(deriveConsentGateOutcome(true, action));
        // consent_resolved / consent_unavailable on the reject and timeout
        // paths are dropped by the SDK while the visitor is opted out — that
        // is accepted (D-07); the observability for that gap is the
        // server-side geo_header_missing log plus the Vercel-Analytics-
        // versus-PostHog ratio recorded in the OPS-01 gate.
        setConsentReady(true);
      });
    }

    return () => {
      mounted = false;
      disposeConsentListener?.();
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView ready={consentReady} />
      </Suspense>
      {children}
    </PHProvider>
  );
}
