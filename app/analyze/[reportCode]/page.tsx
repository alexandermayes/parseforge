"use client";

import { useState, useCallback, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import FightSelector from "@/app/components/FightSelector";
import PlayerSelector from "@/app/components/PlayerSelector";
import AnalysisView, { AnalysisLoading } from "@/app/components/AnalysisView";
import RaidOverview, { RaidOverviewLoading } from "@/app/components/RaidOverview";
import CLAView, { CLALoading } from "@/app/components/CLAView";
import PlayerQuickGrid from "@/app/components/PlayerQuickGrid";
import { ShineBorder } from "@/components/ui/shine-border";
import posthog from "posthog-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportMeta, useFightPlayers } from "./hooks/useReportMeta";
import { useRaidOverview } from "./hooks/useRaidOverview";
import { usePlayerAnalysis } from "./hooks/usePlayerAnalysis";
import { useCLA } from "./hooks/useCLA";

type TabMode = "player" | "raid" | "cla";

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

  // ─── Data hooks ───────────────────────────────────────────────────
  const { report, reportError, reportLoading } = useReportMeta(
    reportCode, selectedFight, setSelectedFight, updateUrlParam
  );
  const { players: fightPlayers } = useFightPlayers(reportCode, selectedFight);

  // ─── Analysis mode hooks ──────────────────────────────────────────
  const raid = useRaidOverview(reportCode, selectedFight, activeTab);
  const player = usePlayerAnalysis(reportCode, selectedFight, selectedSource, activeTab, report);
  const cla = useCLA(reportCode, report, selectedFight, activeTab);

  // Player quick-jump handler: switch to player tab + select player
  const handlePlayerClick = useCallback(
    (sourceId: number) => {
      player.clear();
      setSelectedSource(sourceId);
      updateUrlParam("source", String(sourceId));
      switchTab("player");
    },
    [switchTab, updateUrlParam, player.clear]
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
                players={fightPlayers ?? report.players}
                selectedSourceId={selectedSource}
                onSelect={(id) => {
                  setSelectedSource(id);
                  updateUrlParam("source", String(id));
                  const p = (fightPlayers ?? report.players).find((pl) => pl.id === id);
                  posthog.capture("player_selected", { report_code: reportCode, player_name: p?.name, player_class: p?.type });
                }}
              />
            </div>
          )}

          <Button
            onClick={
              activeTab === "player" ? player.run :
              activeTab === "cla" ? cla.run :
              raid.run
            }
            disabled={
              activeTab === "player" ? (!selectedFight || !selectedSource || player.loading) :
              activeTab === "cla" ? cla.loading :
              (!selectedFight || raid.loading)
            }
            size="default"
          >
            {activeTab === "player"
              ? (player.loading ? "Analyzing..." : "Analyze")
              : activeTab === "cla"
                ? (cla.loading ? "Running Audit..." : "Run Audit")
                : (raid.loading ? "Loading..." : "Load Raid Overview")}
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
          {player.error && (
            <Alert variant="destructive">
              <AlertDescription>{player.error}</AlertDescription>
            </Alert>
          )}
          {player.loading && <AnalysisLoading />}
          {player.result && !player.loading && (
            <div className="space-y-4">
              <button
                onClick={() => { player.clear(); setSelectedSource(null); updateUrlParam("source", null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                &larr; All Players
              </button>
              <AnalysisView data={player.result} previousSnapshot={player.previousSnapshot} />
            </div>
          )}
          {!player.result && !player.loading && !player.error && raid.result && (
            <PlayerQuickGrid
              players={raid.result.players}
              onPlayerClick={handlePlayerClick}
            />
          )}
          {!player.result && !player.loading && !player.error && raid.loading && (
            <AnalysisLoading />
          )}
        </>
      )}

      {/* Raid Overview tab content */}
      {activeTab === "raid" && (
        <>
          {raid.error && (
            <Alert variant="destructive">
              <AlertDescription>{raid.error}</AlertDescription>
            </Alert>
          )}
          {raid.loading && <RaidOverviewLoading />}
          {raid.result && !raid.loading && (
            <RaidOverview data={raid.result} onPlayerClick={handlePlayerClick} />
          )}
        </>
      )}

      {/* CLA tab content */}
      {activeTab === "cla" && (
        <>
          {cla.result && !cla.loading && cla.result.fights.length > 1 && (
            <div className="space-y-1">
              <label className="text-heading-sm text-muted-foreground">
                Fight View
              </label>
              <Select
                value={String(cla.fightSelection)}
                onValueChange={(v) => cla.setFightSelection(v === "all" ? "all" : parseInt(v, 10))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select fight view..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bosses (Average)</SelectItem>
                  {cla.result.fights.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {cla.error && (
            <Alert variant="destructive">
              <AlertDescription>{cla.error}</AlertDescription>
            </Alert>
          )}
          {cla.loading && <CLALoading />}
          {cla.result && !cla.loading && (
            <CLAView data={cla.result} selectedFightId={cla.fightSelection} />
          )}
        </>
      )}
    </main>
  );
}
