import { useState, useEffect, useCallback } from "react";
import type { CastTimelineResult } from "@/lib/wcl-types";
import posthog from "posthog-js";

const FALLBACK_ERROR = "Couldn't load the cast timeline. Try again.";

export function useTimeline(
  reportCode: string,
  fightId: number | null,
  sourceId: number | null,
  subTab: string,
) {
  const [result, setResult] = useState<CastTimelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear results when fight or player changes
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [fightId, sourceId]);

  // Clear error when switching to the timeline sub-tab (allows auto-retry)
  useEffect(() => {
    if (subTab === "timeline" && error) {
      setError(null);
    }
    // Depends only on subTab by design — re-running when `error` changes
    // would clear errors the moment they appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const run = useCallback(async () => {
    if (fightId == null || sourceId == null) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // Captured across both the "failed response" and "thrown request" paths
    // so the analytics call below stays a single site per outcome rather than
    // one per branch — matching the ship gate's one-event-per-interaction
    // rule (docs/OPS-01-SHIP-GATE.md step 4) while still following useCLA's
    // success/error branch structure.
    let capturedResult: CastTimelineResult | null = null;
    let capturedError: string | null = null;

    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCode, fightId, sourceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        capturedError = data.error ?? FALLBACK_ERROR;
        setError(capturedError);
      } else {
        capturedResult = data;
        setResult(data);
      }
    } catch (err) {
      capturedError = err instanceof Error ? err.message : "unknown";
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setLoading(false);
    }

    if (capturedResult) {
      posthog.capture("timeline_viewed", {
        report_code: reportCode,
        fight_id: fightId,
        source_id: sourceId,
        cast_count: capturedResult.castCount,
        truncated: capturedResult.truncated,
      });
    } else if (capturedError) {
      posthog.capture("timeline_error", {
        report_code: reportCode,
        fight_id: fightId,
        source_id: sourceId,
        error: capturedError,
      });
    }
  }, [reportCode, fightId, sourceId]);

  // Auto-run only when the timeline sub-tab is active — no WCL cast-events
  // fetch until someone opens the tab (D-01).
  const shouldAutoRun =
    subTab === "timeline" &&
    fightId != null &&
    sourceId != null &&
    !result &&
    !loading &&
    !error;
  useEffect(() => {
    if (shouldAutoRun) run();
  }, [shouldAutoRun, run]);

  // Fired by CastTimeline once per filter-chip interaction (toggle or the
  // All reset) — this is client-side only filtering with no refetch, so it
  // is a distinct interaction from timeline_viewed/timeline_error above.
  const captureFilterUsed = useCallback(
    (abilityCount: number, hiddenCount: number) => {
      posthog.capture("timeline_filter_used", {
        report_code: reportCode,
        fight_id: fightId,
        ability_count: abilityCount,
        hidden_count: hiddenCount,
      });
    },
    [reportCode, fightId]
  );

  return { result, error, loading, run, captureFilterUsed };
}
