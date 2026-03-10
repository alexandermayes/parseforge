"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = "phc_tOW4Bmj7hELXkhtvxz3w28nP0iZvP0LsIRhQFXQtRjC";
const POSTHOG_HOST = "https://us.i.posthog.com";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
