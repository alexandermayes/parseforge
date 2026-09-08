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

    // Single call site for the error event — both the HTTP-error branch and
    // the exception branch below route through it, so this file holds
    // exactly one capture per interaction (one success, one error) even
    // though the failure can originate from two different code paths.
    const captureAnalysisError = (message: string) =>
      posthog.capture("analysis_error", { report_code: reportCode, error: message });

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
          zoneExpansionId: report?.zoneExpansionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        captureAnalysisError(data.error);
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
          player_role: data.playerRole,
          encounter: data.encounterName,
          dps: Math.round(data.dps.playerDps),
          percentile: data.dps.percentile,
          has_previous: !!history[0],
          // Healer-only measurement (ACC-04/OPS-01): whether the new healer
          // surface is actually reaching healers and driving suggestions.
          ...(data.healer
            ? {
                overheal_percent: Math.round(data.healer.overhealPercent),
                activity_percent: Math.round(data.healer.activityPercent),
                top_overheal_percent: Math.round(data.healer.topOverhealPercent),
                suggestion_count: data.suggestions.length,
              }
            : {}),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis request failed";
      setError(message);
      captureAnalysisError(err instanceof Error ? err.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [reportCode, selectedFight, selectedSource, report]);

  // Auto-run when player is selected on the player tab
  useEffect(() => {
    if (activeTab === "player" && selectedFight && selectedSource && !loading) {
      run();
    }
    // `loading` is a start guard only — depending on it would re-trigger this
    // effect when a run finishes. Intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, selectedFight, activeTab, run]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, loading, previousSnapshot, run, clear };
}
