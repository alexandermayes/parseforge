"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startConsentListener } from "@/lib/consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let disposeConsentListener: (() => void) | undefined;

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
        // Google Privacy & Messaging (the certified TCF v2.2 CMP, D-01)
        // exposes __tcfapi once its script loads. lib/consent.ts's
        // startConsentListener translates its resolved payload into one of
        // the four ConsentAction branches below (D-05, D-06, D-07).
        disposeConsentListener = startConsentListener((action) => {
          switch (action) {
            case "opt-in-full":
              ph.opt_in_capturing();
              ph.startSessionRecording();
              ph.capture("consent_resolved", { accepted: true, gdpr_applies: true });
              break;
            case "cookieless":
              // cookieless_mode: "on_reject" + disable_session_recording
              // above already give D-05/D-06's memory-only persistence and
              // no replay — no further SDK call needed.
              ph.capture("consent_resolved", { accepted: false, gdpr_applies: true });
              break;
            case "opt-in-non-eea":
              // Restore today's default-on behavior for everyone outside
              // the EEA/UK (D-07) — without this, the global
              // cookieless_mode above would silently cookie-block a visitor
              // who was never shown a dialog (01-RESEARCH.md Pitfall 1).
              ph.opt_in_capturing();
              ph.startSessionRecording();
              break;
            case "pending":
              // Only reached via lib/consent.ts's CMP_TIMEOUT_MS fail-closed
              // path — a live "dialog still open" event never invokes this
              // callback. The visitor stays cookieless with no replay
              // indefinitely (deliberate: no home-rolled banner fallback);
              // this event is what makes that silence measurable.
              ph.capture("consent_unavailable", { reason: "tcfapi_timeout" });
              break;
          }
        });
      },
    });

    return () => {
      disposeConsentListener?.();
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
