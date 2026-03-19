"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import FightSelector from "@/app/components/FightSelector";
import PlayerSelector from "@/app/components/PlayerSelector";
import AnalysisView, { AnalysisLoading } from "@/app/components/AnalysisView";
import RaidOverview, { RaidOverviewLoading } from "@/app/components/RaidOverview";
import CLAView, { CLALoading } from "@/app/components/CLAView";
import PlayerQuickGrid from "@/app/components/PlayerQuickGrid";
import { ReportMeta, AnalysisResult, RaidOverviewResult } from "@/lib/wcl-types";
import { saveRecentReport } from "@/lib/recent-reports";
import { AnalysisSnapshot, buildSnapshot, saveSnapshot, getHistory } from "@/lib/analysis-history";
import type { CLAResult } from "@/lib/cla-types";
import { ShineBorder } from "@/components/ui/shine-border";
import posthog from "posthog-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabMode = "player" | "raid" | "cla";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
};

export default function AnalyzePage({
  params,
}: {
  params: Promise<{ reportCode: string }>;
}) {
  const { reportCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabMode>(
    (searchParams.get("tab") as TabMode) || "raid"
  );

  const [selectedFight, setSelectedFight] = useState<number | null>(
    searchParams.get("fight") ? parseInt(searchParams.get("fight")!, 10) : null
  );
  const [selectedSource, setSelectedSource] = useState<number | null>(
    searchParams.get("source")
      ? parseInt(searchParams.get("source")!, 10)
      : null
  );

  // Player Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState<AnalysisSnapshot | null>(null);

  // Raid Overview state
  const [raidResult, setRaidResult] = useState<RaidOverviewResult | null>(null);
  const [raidError, setRaidError] = useState<string | null>(null);
  const [raidLoading, setRaidLoading] = useState(false);

  // CLA state
  const [claResult, setClaResult] = useState<CLAResult | null>(null);
  const [claError, setClaError] = useState<string | null>(null);
  const [claLoading, setClaLoading] = useState(false);
  const [claFightSelection, setClaFightSelection] = useState<number | "all">("all");

  // Fetch report metadata
  const {
    data: report,
    error: reportError,
    isLoading: reportLoading,
  } = useSWR<ReportMeta>(`/api/report/${reportCode}`, fetcher);

  // Fetch fight-scoped players for Player Analysis tab
  const { data: fightPlayers } = useSWR<{
    players: { id: number; name: string; type: string; icon: string }[];
  }>(
    selectedFight ? `/api/report/${reportCode}/players?fightId=${selectedFight}` : null,
    fetcher
  );

  // Save to recent reports
  useEffect(() => {
    if (report) {
      saveRecentReport({ code: reportCode, title: report.title, owner: report.owner, zone: report.zone, viewedAt: Date.now() });
    }
  }, [report, reportCode]);

  // Update a URL search param without navigation
  const updateUrlParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(window.location.search);
      if (value !== null) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Sync active tab to URL params
  const switchTab = useCallback(
    (tab: TabMode) => {
      setActiveTab(tab);
      posthog.capture("tab_switched", { tab });
      updateUrlParam("tab", tab);
    },
    [updateUrlParam]
  );

  // Auto-select first fight if none selected
  useEffect(() => {
    if (report && !selectedFight && report.fights.length > 0) {
      const id = report.fights.find((f) => f.kill)?.id ?? report.fights[0].id;
      setSelectedFight(id);
      updateUrlParam("fight", String(id));
    }
  }, [report, selectedFight, updateUrlParam]);

  // Auto-run raid overview when raid or player tab is active and fight is selected
  const raidAutoRun = (activeTab === "raid" || activeTab === "player") && !!selectedFight && !raidResult && !raidLoading && !raidError;
  useEffect(() => {
    if (raidAutoRun) runRaidOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raidAutoRun]);

  // Auto-run CLA when tab is active and report is loaded
  const claAutoRun = activeTab === "cla" && !!report && !claResult && !claLoading && !claError;
  useEffect(() => {
    if (claAutoRun) runCLA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claAutoRun]);

  const runAnalysis = useCallback(async () => {
    if (!selectedFight || !selectedSource) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportCode,
          fightId: selectedFight,
          sourceId: selectedSource,
          encounterID: report?.fights.find((f) => f.id === selectedFight)?.encounterID,
          encounterName: report?.fights.find((f) => f.id === selectedFight)?.name,
          zoneName: report?.zone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAnalysisError(data.error ?? "Analysis failed");
        posthog.capture("analysis_error", { report_code: reportCode, error: data.error });
      } else {
        const snapshot = buildSnapshot(data, reportCode);
        const history = getHistory(data.playerName, data.encounterName);
        setPreviousSnapshot(history[0] ?? null);
        saveSnapshot(snapshot);
        setAnalysisResult(data);
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
      setAnalysisError(
        err instanceof Error ? err.message : "Analysis request failed"
      );
      posthog.capture("analysis_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setAnalyzing(false);
    }
  }, [reportCode, selectedFight, selectedSource]);

  // Auto-run player analysis when player is selected on the player tab
  useEffect(() => {
    if (activeTab === "player" && selectedFight && selectedSource && !analyzing) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, selectedFight, activeTab]);

  const runRaidOverview = useCallback(async () => {
    if (!selectedFight) return;
    setRaidLoading(true);
    setRaidError(null);
    setRaidResult(null);

    try {
      const res = await fetch("/api/raid-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportCode,
          fightId: selectedFight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRaidError(data.error ?? "Raid overview failed");
        posthog.capture("raid_overview_error", { report_code: reportCode, error: data.error });
      } else {
        setRaidResult(data);
        posthog.capture("raid_overview_complete", { report_code: reportCode, fight_id: selectedFight, player_count: data.players?.length });
      }
    } catch (err) {
      setRaidError(
        err instanceof Error ? err.message : "Raid overview request failed"
      );
      posthog.capture("raid_overview_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setRaidLoading(false);
    }
  }, [reportCode, selectedFight]);

  const runCLA = useCallback(async () => {
    if (!report) return;
    setClaLoading(true);
    setClaError(null);
    setClaResult(null);

    // Use selected fight or all boss fights
    const fightIds = selectedFight
      ? [selectedFight]
      : report.fights.filter((f) => f.kill).map((f) => f.id);

    if (fightIds.length === 0) {
      setClaError("No fights selected");
      setClaLoading(false);
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
        setClaError(data.error ?? "CLA analysis failed");
        posthog.capture("cla_error", { report_code: reportCode, error: data.error });
      } else {
        setClaResult(data);
        setClaFightSelection(fightIds.length === 1 ? fightIds[0] : "all");
        posthog.capture("cla_complete", { report_code: reportCode, fight_count: fightIds.length });
      }
    } catch (err) {
      setClaError(
        err instanceof Error ? err.message : "CLA request failed"
      );
      posthog.capture("cla_error", { report_code: reportCode, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setClaLoading(false);
    }
  }, [reportCode, selectedFight, report]);

  // Player quick-jump handler: switch to player tab + select player
  const handlePlayerClick = useCallback(
    (sourceId: number) => {
      setAnalysisResult(null);
      setAnalysisError(null);
      setSelectedSource(sourceId);
      updateUrlParam("source", String(sourceId));
      switchTab("player");
    },
    [switchTab, updateUrlParam]
  );

  return (
    <main className="py-6 space-y-6">
      {/* Report header */}
      <div>
        <h1 className="text-heading-lg truncate">
          {reportLoading ? (
            <Skeleton className="h-7 w-64" />
          ) : report ? (
            <>
              <a
                href={`https://classic.warcraftlogs.com/reports/${reportCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gradient-gold hover:underline"
              >
                {report.title}
              </a>
            </>
          ) : (
            `Report: ${reportCode}`
          )}
        </h1>
        {report && (
          <p className="text-caption mt-1">
            by {report.owner} &middot; {report.zone}
          </p>
        )}
      </div>

      {/* Error state */}
      {reportError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load report. Check the report code and try again.
            {reportError.message && `: ${reportError.message}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab switcher */}
      {report && (
        <div className="relative glass flex gap-1 p-1 rounded-lg w-fit">
          <ShineBorder
            shineColor={["#D4A843", "#7C5CFC"]}
            borderWidth={1}
            duration={10}
          />
          {(
            [
              { key: "raid" as const, label: "Raid Overview" },
              { key: "player" as const, label: "Player Analysis" },
              { key: "cla" as const, label: "Buff & Gear Audit" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`relative px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-surface-2 text-foreground shadow-sm tab-active-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Selectors */}
      {report && (
        <div className="flex flex-wrap items-end gap-4 min-h-[4.5rem]">
          <div className="space-y-1">
            <label className="text-heading-sm text-muted-foreground">
              Fight
            </label>
            <FightSelector
              fights={report.fights}
              selectedFightId={selectedFight}
              onSelect={(id) => {
                setSelectedFight(id);
                updateUrlParam("fight", String(id));
                // Clear stale results from the previous fight
                setAnalysisResult(null);
                setAnalysisError(null);
                setRaidResult(null);
                setRaidError(null);
                setClaResult(null);
                setClaError(null);
                const fight = report.fights.find((f) => f.id === id);
                posthog.capture("fight_selected", { report_code: reportCode, fight_id: id, fight_name: fight?.name });
              }}
            />
          </div>

          {activeTab === "player" && (
            <div className="space-y-1">
              <label className="text-heading-sm text-muted-foreground">
                Player
              </label>
              <PlayerSelector
                players={fightPlayers?.players ?? report.players}
                selectedSourceId={selectedSource}
                onSelect={(id) => {
                  setSelectedSource(id);
                  updateUrlParam("source", String(id));
                  const player = (fightPlayers?.players ?? report.players).find((p) => p.id === id);
                  posthog.capture("player_selected", { report_code: reportCode, player_name: player?.name, player_class: player?.type });
                }}
              />
            </div>
          )}

          <Button
            onClick={
              activeTab === "player" ? runAnalysis :
              activeTab === "cla" ? runCLA :
              runRaidOverview
            }
            disabled={
              activeTab === "player" ? (!selectedFight || !selectedSource || analyzing) :
              activeTab === "cla" ? claLoading :
              (!selectedFight || raidLoading)
            }
            size="default"
          >
            {activeTab === "player"
              ? (analyzing ? "Analyzing..." : "Analyze")
              : activeTab === "cla"
                ? (claLoading ? "Running Audit..." : "Run Audit")
                : (raidLoading ? "Loading..." : "Load Raid Overview")}
          </Button>
        </div>
      )}

      {/* Loading skeleton for report */}
      {reportLoading && (
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
      )}

      {/* Player Analysis tab content */}
      {activeTab === "player" && (
        <>
          {analysisError && (
            <Alert variant="destructive">
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}
          {analyzing && <AnalysisLoading />}
          {analysisResult && !analyzing && (
            <div className="space-y-4">
              <button
                onClick={() => { setAnalysisResult(null); setAnalysisError(null); setSelectedSource(null); updateUrlParam("source", null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                &larr; All Players
              </button>
              <AnalysisView data={analysisResult} previousSnapshot={previousSnapshot} />
            </div>
          )}
          {!analysisResult && !analyzing && !analysisError && raidResult && (
            <PlayerQuickGrid
              players={raidResult.players}
              onPlayerClick={handlePlayerClick}
            />
          )}
          {!analysisResult && !analyzing && !analysisError && raidLoading && (
            <AnalysisLoading />
          )}
        </>
      )}

      {/* Raid Overview tab content */}
      {activeTab === "raid" && (
        <>
          {raidError && (
            <Alert variant="destructive">
              <AlertDescription>{raidError}</AlertDescription>
            </Alert>
          )}
          {raidLoading && <RaidOverviewLoading />}
          {raidResult && !raidLoading && (
            <RaidOverview data={raidResult} onPlayerClick={handlePlayerClick} />
          )}
        </>
      )}

      {/* CLA tab content */}
      {activeTab === "cla" && (
        <>
          {claResult && !claLoading && claResult.fights.length > 1 && (
            <div className="space-y-1">
              <label className="text-heading-sm text-muted-foreground">
                Fight View
              </label>
              <Select
                value={String(claFightSelection)}
                onValueChange={(v) => setClaFightSelection(v === "all" ? "all" : parseInt(v, 10))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select fight view..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bosses (Average)</SelectItem>
                  {claResult.fights.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {claError && (
            <Alert variant="destructive">
              <AlertDescription>{claError}</AlertDescription>
            </Alert>
          )}
          {claLoading && <CLALoading />}
          {claResult && !claLoading && (
            <CLAView data={claResult} selectedFightId={claFightSelection} />
          )}
        </>
      )}
    </main>
  );
}
