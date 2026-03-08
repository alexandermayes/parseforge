"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AbilityPriorityEntry } from "@/lib/wcl-types";
import SpellLink, { buildRankedNames } from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";
import { useMemo } from "react";

function RangeBar({
  min,
  max,
  avg,
  player,
}: {
  min: number;
  max: number;
  avg: number;
  player: number;
}) {
  // Scale to 0-100 range based on the max value we need to show
  const ceiling = Math.max(max, player, 1);
  const scale = (v: number) => Math.min((v / ceiling) * 100, 100);

  const minPos = scale(min);
  const maxPos = scale(max);
  const avgPos = scale(avg);
  const playerPos = scale(player);

  return (
    <div className="relative h-4 w-full rounded bg-surface-2">
      {/* Range bar (min-max) */}
      <div
        className="absolute top-1 h-2 rounded bg-gold-from/25"
        style={{ left: `${minPos}%`, width: `${Math.max(maxPos - minPos, 1)}%` }}
      />
      {/* Avg marker */}
      <div
        className="absolute top-0.5 h-3 w-0.5 bg-gold-from"
        style={{ left: `${avgPos}%` }}
      />
      {/* Player marker */}
      <div
        className="absolute top-0 h-4 w-1 rounded-sm bg-status-info"
        style={{ left: `${Math.max(playerPos - 0.5, 0)}%` }}
      />
    </div>
  );
}

export default function AbilityPriorityHeatmap({
  data,
  wowheadDomain = "tbc",
}: {
  data: AbilityPriorityEntry[];
  wowheadDomain?: string;
}) {
  useWowheadTooltips([data]);
  const rankedNames = useMemo(() => buildRankedNames(data), [data]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ability Priority Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-[30px_1fr_60px_60px_60px_100px] gap-2 text-label border-b border-border/50 pb-2">
            <span>#</span>
            <span>Ability</span>
            <span className="text-right">Top Avg</span>
            <span className="text-right">You</span>
            <span className="text-right">Diff</span>
            <span className="text-center">Range</span>
          </div>
          {data.map((entry) => {
            const diffColor =
              entry.shareDeviation > 2
                ? "text-status-good"
                : entry.shareDeviation < -2
                  ? "text-status-bad"
                  : "text-muted-foreground";

            return (
              <div
                key={entry.guid}
                className="grid grid-cols-[30px_1fr_60px_60px_60px_100px] gap-2 text-sm py-1 items-center border-b border-border/50 last:border-0"
              >
                <span className="text-xs text-muted-foreground font-mono">
                  {entry.rank}
                </span>
                <span className="truncate">
                  <SpellLink name={rankedNames.get(entry.guid) ?? entry.name} guid={entry.guid} domain={wowheadDomain} />
                </span>
                <span className="text-right font-mono text-gold-from text-xs">
                  {entry.avgTopShare}%
                </span>
                <span className="text-right font-mono text-blue-400 text-xs">
                  {entry.playerShare}%
                </span>
                <span className={`text-right font-mono text-xs ${diffColor}`}>
                  {entry.shareDeviation > 0 ? "+" : ""}
                  {entry.shareDeviation}%
                </span>
                <RangeBar
                  min={entry.minTopShare}
                  max={entry.maxTopShare}
                  avg={entry.avgTopShare}
                  player={entry.playerShare}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground pt-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-1 rounded-sm bg-status-info" /> You
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-0.5 bg-gold-from" /> Top Avg
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded bg-gold-from/25" /> Min-Max Range
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
