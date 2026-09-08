import { useState, useEffect, useCallback } from "react";
import type { CastTimelineResult } from "@/lib/wcl-types";

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

    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCode, fightId, sourceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? FALLBACK_ERROR);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setLoading(false);
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

  return { result, error, loading, run };
}
