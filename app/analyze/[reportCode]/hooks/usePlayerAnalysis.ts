import { useState, useEffect, useCallback } from "react";
import type { AnalysisResult, ReportMeta } from "@/lib/wcl-types";
import { AnalysisSnapshot, buildSnapshot, saveSnapshot, getHistory } from "@/lib/analysis-history";
import posthog from "posthog-js";

type TabMode = "player" | "raid" | "cla";

export function usePlayerAnalysis(
  reportCode: string,
  selectedFight: number | null,
  selectedSource: number | null,
  activeTab: TabMode,
  report: ReportMeta | undefined,
) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState<AnalysisSnapshot | null>(null);

  // Clear results when fight changes
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedFight]);

  const run = useCallback(async () => {
    if (!selectedFight || !selectedSource) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fight = report?.fights.find((f) => f.id === selectedFight);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportCode,
          fightId: selectedFight,
          sourceId: selectedSource,
          encounterID: fight?.encounterID,
          encounterName: fight?.name,
          zoneName: report?.zone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        posthog.capture("analysis_error", { report_code: reportCode, error: data.error });
      } else {
        const snapshot = buildSnapshot(data, reportCode);
        const history = getHistory(data.playerName, data.encounterName);
        setPreviousSnapshot(history[0] ?? null);
        saveSnapshot(snapshot);
        setResult(data);
        posthog.capture("analysis_complete", {
          report_code: reportCode,
          player_name: data.playerName,
          player_class: data.playerClass,
          player_spec: data.playerSpec,
          encounter: data.encounterName,
          dps: Math.round(data.dps.playerDps),
          percentile: data.dps.percentile,
          has_previous: !!history[0],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis request failed");
      posthog.capture("analysis_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setLoading(false);
    }
  }, [reportCode, selectedFight, selectedSource, report]);

  // Auto-run when player is selected on the player tab
  useEffect(() => {
    if (activeTab === "player" && selectedFight && selectedSource && !loading) {
      run();
    }
  }, [selectedSource, selectedFight, activeTab, run]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, loading, previousSnapshot, run, clear };
}
