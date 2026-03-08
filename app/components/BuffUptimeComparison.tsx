"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuffAnalysis } from "@/lib/wcl-types";
import SpellLink, { buildRankedNames } from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";
import { useMemo } from "react";

export default function BuffUptimeComparison({ data, wowheadDomain = "tbc" }: { data: BuffAnalysis; wowheadDomain?: string }) {
  useWowheadTooltips([data]);
  const rankedNames = useMemo(() => buildRankedNames(data.buffs), [data.buffs]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Buff Uptime</CardTitle>
          <div className="flex gap-2">
            {data.missingBuffs.length > 0 && (
              <Badge variant="status_bad">
                {data.missingBuffs.length} missing
              </Badge>
            )}
            {data.lowUptimeBuffs.length > 0 && (
              <Badge variant="status_warn">
                {data.lowUptimeBuffs.length} low uptime
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.buffs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No buff data available for comparison.
          </p>
        ) : (
          <div className="space-y-3">
            {data.buffs.map((b) => (
              <div key={b.guid} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={b.isMissing ? "text-status-bad" : ""}>
                    <SpellLink name={rankedNames.get(b.guid) ?? b.name} guid={b.guid} domain={wowheadDomain} className={b.isMissing ? "text-status-bad" : ""} />
                    {b.isMissing && " (missing)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {b.playerUptime}% / {b.topUptime}%
                  </span>
                </div>
                <div className="flex gap-1 items-center">
                  <div className="flex-1 bar-sm rounded-full bg-surface-2 relative">
                    {/* Top player bar (background) */}
                    <div
                      className="absolute h-full rounded-full progress-gradient-gold opacity-30"
                      style={{ width: `${b.topUptime}%` }}
                    />
                    {/* Player bar (foreground) */}
                    <div
                      className={`absolute h-full rounded-full transition-all ${
                        b.isMissing
                          ? "bg-destructive/50"
                          : "progress-gradient-blue"
                      }`}
                      style={{ width: `${b.playerUptime}%` }}
                    />
                  </div>
                  {b.gap > 0 && (
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      -{b.gap}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
