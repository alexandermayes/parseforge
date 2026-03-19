import { useState, useEffect, useCallback } from "react";
import type { RaidOverviewResult } from "@/lib/wcl-types";
import posthog from "posthog-js";

type TabMode = "player" | "raid" | "cla";

export function useRaidOverview(
  reportCode: string,
  selectedFight: number | null,
  activeTab: TabMode,
) {
  const [result, setResult] = useState<RaidOverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear results when fight changes
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedFight]);

  const run = useCallback(async () => {
    if (!selectedFight) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/raid-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCode, fightId: selectedFight }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Raid overview failed");
        posthog.capture("raid_overview_error", { report_code: reportCode, error: data.error });
      } else {
        setResult(data);
        posthog.capture("raid_overview_complete", { report_code: reportCode, fight_id: selectedFight, player_count: data.players?.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Raid overview request failed");
      posthog.capture("raid_overview_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setLoading(false);
    }
  }, [reportCode, selectedFight]);

  // Auto-run when raid or player tab is active and fight is selected
  const shouldAutoRun = (activeTab === "raid" || activeTab === "player") && !!selectedFight && !result && !loading && !error;
  useEffect(() => {
    if (shouldAutoRun) run();
  }, [shouldAutoRun, run]);

  return { result, error, loading, run };
}
