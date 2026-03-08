"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { DpsComparison as DpsData } from "@/lib/wcl-types";
import { getPerformanceGrade, GRADE_COLORS, percentileColor, percentileBg } from "@/lib/constants";

function formatDps(dps: number): string {
  if (dps >= 1000) return `${(dps / 1000).toFixed(1)}k`;
  return dps.toFixed(0);
}

const GRADE_BEAM_COLORS: Record<string, { from: string; to: string }> = {
  S: { from: "#F59E0B", to: "#D97706" },
  A: { from: "#A855F7", to: "#7C3AED" },
  B: { from: "#3B82F6", to: "#2563EB" },
  C: { from: "#22C55E", to: "#16A34A" },
  D: { from: "#6B7280", to: "#4B5563" },
};

export default function DpsComparison({ data, role = "dps" }: { data: DpsData; role?: "dps" | "healer" }) {
  const metricLabel = role === "healer" ? "HPS" : "DPS";
  const maxDps = Math.max(data.playerDps, data.topDps, data.medianDps);
  const grade = getPerformanceGrade(data.percentile);
  const gradeStyle = GRADE_COLORS[grade];
  const beamColors = GRADE_BEAM_COLORS[grade] ?? GRADE_BEAM_COLORS.D;

  const barWidth = (dps: number) =>
    maxDps > 0 ? `${(dps / maxDps) * 100}%` : "0%";

  return (
    <Card className="relative overflow-hidden">
      <BorderBeam
        size={80}
        duration={10}
        colorFrom={beamColors.from}
        colorTo={beamColors.to}
        borderWidth={1}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{metricLabel} Performance</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${gradeStyle} text-base font-bold px-2.5`}>
              {grade}
            </Badge>
            <Badge variant="outline" className={percentileBg(data.percentile)}>
              <NumberTicker value={data.percentile} className={`${percentileColor(data.percentile)} font-mono`} />
              <span>th percentile</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Player DPS */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>You</span>
              <span className={`font-mono font-bold ${percentileColor(data.percentile)}`}>
                <NumberTicker
                  value={Math.round(data.playerDps)}
                  className={percentileColor(data.percentile)}
                />{" "}
                {metricLabel}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-2">
              <div
                className="h-full rounded-full progress-gradient-blue transition-all"
                style={{ width: barWidth(data.playerDps) }}
              />
            </div>
          </div>

          {/* Median DPS */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Median</span>
              <span className="font-mono text-muted-foreground">
                {formatDps(data.medianDps)} {metricLabel}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gray-500 transition-all"
                style={{ width: barWidth(data.medianDps) }}
              />
            </div>
          </div>

          {/* Top DPS */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top</span>
              <span className="font-mono text-muted-foreground">
                {formatDps(data.topDps)} {metricLabel}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-2">
              <div
                className="h-full rounded-full progress-gradient-gold transition-all"
                style={{ width: barWidth(data.topDps) }}
              />
            </div>
          </div>
        </div>

        {data.gapToMedian > 0 && (
          <p className="text-sm text-muted-foreground">
            {data.gapToMedian}% below median &middot; {data.gapToTop}% below
            top
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Fight duration: {Math.round(data.fightDuration / 1000)}s
        </p>
      </CardContent>
    </Card>
  );
}
