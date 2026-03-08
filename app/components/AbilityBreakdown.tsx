"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AbilityShare } from "@/lib/wcl-types";
import SpellLink, { buildRankedNames } from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";
import { useMemo } from "react";

export default function AbilityBreakdown({ data, wowheadDomain = "tbc" }: { data: AbilityShare[]; wowheadDomain?: string }) {
  useWowheadTooltips([data]);
  const rankedNames = useMemo(() => buildRankedNames(data), [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No damage data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ability Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.guid} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={a.playerShare === 0 ? "text-muted-foreground" : ""}>
                  <SpellLink name={rankedNames.get(a.guid) ?? a.name} guid={a.guid} domain={wowheadDomain} />
                  {a.playerShare === 0 && " (not used)"}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {a.playerShare}% / {a.topShare}%
                </span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 space-y-0.5">
                  {/* Player bar */}
                  <div className="h-1.5 w-full rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full progress-gradient-blue"
                      style={{ width: `${a.playerShare}%` }}
                    />
                  </div>
                  {/* Top bar */}
                  <div className="h-1.5 w-full rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full progress-gradient-gold opacity-60"
                      style={{ width: `${a.topShare}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-status-info" /> You
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold-from/60" /> Top player
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
