import { useState, useEffect, useCallback } from "react";
import type { ReportMeta } from "@/lib/wcl-types";
import type { CLAResult } from "@/lib/cla-types";
import posthog from "posthog-js";

type TabMode = "player" | "raid" | "cla";

export function useCLA(
  reportCode: string,
  report: ReportMeta | undefined,
  selectedFight: number | null,
  activeTab: TabMode,
) {
  const [result, setResult] = useState<CLAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fightSelection, setFightSelection] = useState<number | "all">("all");

  // Clear results when fight changes
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedFight]);

  // Clear error when switching to CLA tab (allows auto-retry)
  useEffect(() => {
    if (activeTab === "cla" && error) {
      setError(null);
    }
  }, [activeTab]);

  const run = useCallback(async () => {
    if (!report) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fightIds = selectedFight
      ? [selectedFight]
      : report.fights.filter((f) => f.kill).map((f) => f.id);

    if (fightIds.length === 0) {
      setError("No fights selected");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/cla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCode, fightIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "CLA analysis failed");
        posthog.capture("cla_error", { report_code: reportCode, error: data.error });
      } else {
        setResult(data);
        setFightSelection(fightIds.length === 1 ? fightIds[0] : "all");
        posthog.capture("cla_complete", { report_code: reportCode, fight_count: fightIds.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "CLA request failed");
      posthog.capture("cla_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setLoading(false);
    }
  }, [reportCode, selectedFight, report]);

  // Auto-run when CLA tab is active and report is loaded
  const shouldAutoRun = activeTab === "cla" && !!report && !result && !loading && !error;
  useEffect(() => {
    if (shouldAutoRun) run();
  }, [shouldAutoRun, run]);

  return { result, error, loading, fightSelection, setFightSelection, run };
}
