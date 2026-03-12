"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: true,
      capture_pageleave: true,
      // Session replay
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskInputFn: (text, element) => {
          // Only mask actual sensitive fields, not the report URL input
          const el = element as HTMLInputElement | null;
          if (el?.type === "password") return "*".repeat(text.length);
          return text;
        },
      },
      // Console log capture
      enable_recording_console_log: true,
      // Autocapture clicks, inputs, form submits
      autocapture: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
