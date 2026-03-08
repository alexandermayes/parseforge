"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult } from "@/lib/wcl-types";
import { AnalysisSnapshot } from "@/lib/analysis-history";
import { CLASS_COLORS } from "@/lib/constants";
import DpsComparison from "./DpsComparison";
import GearComparison from "./GearComparison";
import TalentComparison from "./TalentComparison";
import BuffUptimeComparison from "./BuffUptimeComparison";
import CastEfficiency from "./CastEfficiency";
import AbilityBreakdown from "./AbilityBreakdown";
import AbilityPriorityHeatmap from "./AbilityPriorityHeatmap";
import ComparisonSummary from "./ComparisonSummary";

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

export default function AnalysisView({ data, previousSnapshot }: { data: AnalysisResult; previousSnapshot?: AnalysisSnapshot | null }) {
  const classColor = CLASS_COLORS[data.playerClass] ?? "#888";

  // Build comparison label
  const comparisonLabel =
    data.topPlayersCount > 1
      ? `Avg Top ${data.topPlayersCount} (${data.topPlayerNames.join(", ")})`
      : data.topPlayerNames.length > 0
        ? `#1 ${data.topPlayerNames[0]}`
        : `#1 ${data.topPlayerName}`;

  const wowheadDomain = data.gear.wowheadDomain || "tbc";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-16 z-40 py-3 px-4 surface-card flex flex-wrap items-center gap-3">
        <h2
          className="text-heading-lg"
          style={{ color: classColor }}
        >
          {data.playerName}
        </h2>
        <Badge variant="outline" style={{ borderColor: classColor, color: classColor }}>
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
      <Tabs defaultValue="dps" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent">
          <TabsTrigger value="dps">{data.playerRole === "healer" ? "HPS" : "DPS"}</TabsTrigger>
          <TabsTrigger value="abilities">Abilities</TabsTrigger>
          <TabsTrigger value="gear">Gear</TabsTrigger>
          <TabsTrigger value="talents">Talents</TabsTrigger>
          <TabsTrigger value="buffs">Buffs</TabsTrigger>
          <TabsTrigger value="casts">Casts</TabsTrigger>
        </TabsList>

        <TabsContent value="dps" className="mt-4">
          <DpsComparison data={data.dps} role={data.playerRole} previousSnapshot={previousSnapshot} />
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
      </Tabs>
    </div>
  );
}
