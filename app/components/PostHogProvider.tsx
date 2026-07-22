"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: false, // manually tracked via PostHogPageView
      capture_pageleave: true,
      // Session replay
      disable_session_recording: false,
      session_recording: {
        // Mask all inputs by default. This masks the report-URL input too, which
        // is an acceptable trade for a privacy-safe default (vs. the previous
        // un-masking that could capture whatever a user typed).
        maskAllInputs: true,
      },
      // Don't capture console logs into replays — they can hoover up anything
      // logged client-side.
      enable_recording_console_log: false,
      // TODO: serving EU users with session replay ultimately needs a consent
      // banner — that's a product decision, out of scope here.
      // Autocapture clicks, inputs, form submits
      autocapture: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
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
