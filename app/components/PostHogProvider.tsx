"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startConsentListener, deriveConsentGateOutcome } from "@/lib/consent";
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

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let disposeConsentListener: (() => void) | undefined;
    let mounted = true;

    fetch("/api/geo")
      .then((res) => res.json())
      .then((body: { isConsentRegion: boolean }) => {
        if (!mounted || appliedRef.current) return;
        applyDecision(body.isConsentRegion);
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
      posthog.register({ consent_gate_path: outcome.gatePath });
      if (outcome.optIn) posthog.opt_in_capturing({ captureEventName: false });
      if (outcome.startReplay) posthog.startSessionRecording();
      if (outcome.event) posthog.capture(outcome.event, outcome.eventProps);
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
