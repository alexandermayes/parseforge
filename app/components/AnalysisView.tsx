"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult } from "@/lib/wcl-types";
import { AnalysisSnapshot } from "@/lib/analysis-history";
import { classColor } from "@/lib/constants";
import { useUrlTabState } from "@/lib/use-url-tab-state";
import DpsComparison from "./DpsComparison";
import GearComparison from "./GearComparison";
import TalentComparison from "./TalentComparison";
import BuffUptimeComparison from "./BuffUptimeComparison";
import CastEfficiency from "./CastEfficiency";
import AbilityBreakdown from "./AbilityBreakdown";
import AbilityPriorityHeatmap from "./AbilityPriorityHeatmap";
import ComparisonSummary from "./ComparisonSummary";
import CastTimeline from "./CastTimeline";
import { useTimeline } from "@/app/analyze/[reportCode]/hooks/useTimeline";

export function AnalysisLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function AnalysisView({
  data,
  previousSnapshot,
  reportCode,
  fightId,
  sourceId,
}: {
  data: AnalysisResult;
  previousSnapshot?: AnalysisSnapshot | null;
  reportCode: string;
  fightId: number | null;
  sourceId: number | null;
}) {
  const playerColor = classColor(data.playerClass);

  // Build comparison label
  const comparisonLabel =
    data.topPlayersCount > 1
      ? `Avg Top ${data.topPlayersCount} (${data.topPlayerNames.join(", ")})`
      : data.topPlayerNames.length > 0
        ? `#1 ${data.topPlayerNames[0]}`
        : `#1 ${data.topPlayerName}`;

  const wowheadDomain = data.gear.wowheadDomain || "tbc";

  // Deep-linked sub-tab so shared scorecard links land on the right section.
  const [tab, setTab] = useUrlTabState("ptab", "dps", [
    "dps",
    "abilities",
    "gear",
    "talents",
    "buffs",
    "casts",
    "timeline",
  ]);

  const timeline = useTimeline(reportCode, fightId, sourceId, tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-16 z-40 py-3 px-4 surface-card flex flex-wrap items-center gap-3">
        <h2
          className="text-heading-lg"
          style={{ color: playerColor }}
        >
          {data.playerName}
        </h2>
        <Badge variant="outline" style={{ borderColor: playerColor, color: playerColor }}>
          {data.playerSpec} {data.playerClass}
        </Badge>
        <span className="text-muted-foreground">vs</span>
        <span className="text-sm text-muted-foreground">
          {comparisonLabel}
        </span>
        <span className="text-muted-foreground">&middot;</span>
        <span className="text-sm text-muted-foreground">
          {data.encounterName}
        </span>
      </div>

      {/* Summary always visible */}
      <ComparisonSummary data={data} previousSnapshot={previousSnapshot} />

      {/* Tabbed analysis sections */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent">
          <TabsTrigger value="dps">{data.playerRole === "healer" ? "HPS" : "DPS"}</TabsTrigger>
          <TabsTrigger value="abilities">Abilities</TabsTrigger>
          <TabsTrigger value="gear">Gear</TabsTrigger>
          <TabsTrigger value="talents">Talents</TabsTrigger>
          <TabsTrigger value="buffs">Buffs</TabsTrigger>
          <TabsTrigger value="casts">Casts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="dps" className="mt-4">
          <DpsComparison data={data.dps} role={data.playerRole} healer={data.healer} previousSnapshot={previousSnapshot} />
        </TabsContent>

        <TabsContent value="abilities" className="mt-4 space-y-4">
          <AbilityBreakdown data={data.abilities} wowheadDomain={wowheadDomain} />
          {data.abilityPriority.length > 0 && (
            <AbilityPriorityHeatmap data={data.abilityPriority} wowheadDomain={wowheadDomain} />
          )}
        </TabsContent>

        <TabsContent value="gear" className="mt-4">
          <GearComparison data={data.gear} popularity={data.gearPopularity} />
        </TabsContent>

        <TabsContent value="talents" className="mt-4">
          <TalentComparison data={data.talents} consensus={data.talentConsensus} />
        </TabsContent>

        <TabsContent value="buffs" className="mt-4">
          <BuffUptimeComparison data={data.buffs} wowheadDomain={wowheadDomain} />
        </TabsContent>

        <TabsContent value="casts" className="mt-4">
          <CastEfficiency data={data.casts} wowheadDomain={wowheadDomain} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <CastTimeline
            result={timeline.result}
            loading={timeline.loading}
            error={timeline.error}
            wowheadDomain={wowheadDomain}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
