"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TalentAnalysis, TalentConsensusAnalysis, TalentTreeSummary } from "@/lib/wcl-types";

function TalentConsensus({ data }: { data: TalentConsensusAnalysis }) {
  if (data.sampleSize === 0 || data.talents.length === 0) return null;

  const matchColor =
    data.matchPercentage >= 90
      ? "badge-good"
      : data.matchPercentage >= 70
        ? "badge-warn"
        : "badge-bad";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Talent Consensus</CardTitle>
          <Badge variant="outline" className={matchColor}>
            {data.matchPercentage}% match ({data.sampleSize} players)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px_50px] gap-2 text-label border-b border-border/50 pb-2">
            <span>Talent</span>
            <span>Usage</span>
            <span className="text-center">You</span>
          </div>
          {data.talents.map((t) => {
            const isConsensusMissing = t.percentage >= 50 && !t.playerHasTalent;
            return (
              <div
                key={t.id}
                className={`grid grid-cols-[1fr_120px_50px] gap-2 text-sm py-1 items-center ${
                  isConsensusMissing ? "bg-red-500/5 rounded px-1" : ""
                }`}
              >
                <span className="truncate">{t.name}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bar-sm rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t.percentage >= 80
                          ? "bg-amber-400"
                          : t.percentage >= 50
                            ? "bg-amber-400/60"
                            : "bg-zinc-500/40"
                      }`}
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                    {t.percentage}%
                  </span>
                </div>
                <span className="text-center">
                  {t.playerHasTalent ? (
                    <span className="text-status-good">{"\u2713"}</span>
                  ) : (
                    <span className={t.percentage >= 50 ? "text-status-bad" : "text-muted-foreground"}>
                      {"\u2717"}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TreeComparison({ data, treeSummary }: { data: TalentAnalysis; treeSummary: TalentTreeSummary }) {
  const { playerDistribution, topDistribution, treeNames } = treeSummary;
  const hasTopComparison = topDistribution.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Talent Build</CardTitle>
          {hasTopComparison && data.totalDiffs > 0 ? (
            <Badge variant="status_warn">
              {data.totalDiffs} point{data.totalDiffs !== 1 ? "s" : ""} different
            </Badge>
          ) : hasTopComparison ? (
            <Badge variant="status_good">Matching</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {/* Spec summary */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">You: </span>
            <span className="font-mono font-medium">{playerDistribution.join(" / ")}</span>
          </div>
          {hasTopComparison && (
            <>
              <span className="text-muted-foreground">vs</span>
              <div className="text-sm">
                <span className="text-muted-foreground">Top: </span>
                <span className="font-mono font-medium">{topDistribution.join(" / ")}</span>
              </div>
            </>
          )}
        </div>

        {/* Per-tree breakdown */}
        <div className="space-y-3">
          {treeNames.map((name, i) => {
            const player = playerDistribution[i] ?? 0;
            const top = hasTopComparison ? (topDistribution[i] ?? 0) : 0;
            const diff = hasTopComparison ? top - player : 0;
            const maxPts = Math.max(player, top, 1);

            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span>{player} pts</span>
                    {hasTopComparison && (
                      <span className="text-muted-foreground">vs {top}</span>
                    )}
                    {diff !== 0 && (
                      <span className={diff > 0 ? "text-status-good" : "text-status-bad"}>
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <div className="flex-1 bar-sm rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(player / maxPts) * 100}%` }}
                    />
                  </div>
                  {hasTopComparison && (
                    <div className="flex-1 bar-sm rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400"
                        style={{ width: `${(top / maxPts) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> You ({data.playerSpec})
          </span>
          {hasTopComparison && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block" /> Top ({data.topSpec})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TalentComparison({
  data,
  consensus,
}: {
  data: TalentAnalysis;
  consensus?: TalentConsensusAnalysis;
}) {
  return (
    <div className="space-y-4">
      {/* Existing talent diff table */}
      {data.treeSummary ? (
        <TreeComparison data={data} treeSummary={data.treeSummary} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Talents</CardTitle>
              <Badge variant="status_warn">
                {data.totalDiffs} point{data.totalDiffs !== 1 ? "s" : ""} different
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 text-label border-b border-border pb-2">
                <span>Talent</span>
                <span className="text-center">You</span>
                <span className="text-center">Top</span>
                <span className="text-center">Diff</span>
              </div>
              {data.diffs.map((d) => (
                <div
                  key={d.guid}
                  className="grid grid-cols-[1fr_60px_60px_60px] gap-2 text-sm py-0.5"
                >
                  <span className="truncate">{d.name}</span>
                  <span className="text-center font-mono">{d.playerPoints}</span>
                  <span className="text-center font-mono">{d.topPoints}</span>
                  <span
                    className={`text-center font-mono ${
                      d.diff > 0 ? "text-status-good" : "text-status-bad"
                    }`}
                  >
                    {d.diff > 0 ? "+" : ""}
                    {d.diff}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your spec: {data.playerSpec} &middot; Top player spec: {data.topSpec}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Talent Consensus */}
      {consensus && <TalentConsensus data={consensus} />}
    </div>
  );
}
