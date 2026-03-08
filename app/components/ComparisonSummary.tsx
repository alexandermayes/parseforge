"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalysisResult, ImprovementSuggestion, MetricPercentileAnalysis } from "@/lib/wcl-types";
import { AnalysisSnapshot } from "@/lib/analysis-history";
import { GRADE_COLORS, PerformanceGrade } from "@/lib/constants";
import { Copy, Check } from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";
import { NumberTicker } from "@/components/ui/number-ticker";

const priorityStyles: Record<string, string> = {
  high: "badge-bad",
  medium: "badge-warn",
  low: "badge-info",
};

const categoryLabels: Record<string, string> = {
  dps: "DPS",
  hps: "HPS",
  gear: "Gear",
  consumables: "Consumables",
  casts: "Casts",
};

function ScorecardCell({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "good" | "warn" | "bad" | "neutral";
}) {
  const statusColors = {
    good: "badge-good",
    warn: "badge-warn",
    bad: "badge-bad",
    neutral: "badge-neutral",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 min-w-[80px] ${statusColors[status]}`}
    >
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function DeltaBadge({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  if (value === 0) return null;
  const positive = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-[11px] font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {sign}{value}{suffix}
    </span>
  );
}

function PerformanceBreakdown({ data, previousSnapshot }: { data: MetricPercentileAnalysis; previousSnapshot?: AnalysisSnapshot | null }) {
  if (data.metrics.length === 0) return null;

  const overallGradeColor = GRADE_COLORS[data.overallGrade as PerformanceGrade] ?? GRADE_COLORS.D;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Performance Breakdown
        </h3>
        <Badge variant="outline" className={overallGradeColor}>
          {data.overallGrade} ({data.overallScore}%)
          {previousSnapshot && previousSnapshot.overallScore > 0 && (
            <> <DeltaBadge value={data.overallScore - previousSnapshot.overallScore} suffix="%" /></>
          )}
        </Badge>
      </div>
      <div className="space-y-2">
        {data.metrics.map((m) => {
          const gradeColor = GRADE_COLORS[m.grade as PerformanceGrade] ?? GRADE_COLORS.D;
          const barColor =
            m.percentile >= 75
              ? "progress-gradient-gold"
              : m.percentile >= 50
                ? "progress-gradient-blue"
                : "bg-red-500/60";
          const prevMetric = previousSnapshot?.metrics.find((pm) => pm.metric === m.metric);

          return (
            <div key={m.metric} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.label}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${gradeColor}`}>
                    {m.grade}
                  </Badge>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {m.percentile}%
                  {prevMetric && <> <DeltaBadge value={m.percentile - prevMetric.percentile} suffix="%" /></>}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${m.percentile}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{m.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatForDiscord(data: AnalysisResult): string {
  const metricLabel = data.playerRole === "healer" ? "HPS" : "DPS";
  const dpsVal = data.dps.playerDps.toLocaleString();
  const pct = `${data.dps.percentile}th`;
  const flask = data.consumables.flask ? "Yes" : "No";
  const food = data.consumables.food ? "Yes" : "No";
  const wepEnh = data.consumables.weaponEnhancement ? "Yes" : "No";
  const enchants =
    data.gear.missingEnchants > 0
      ? `${data.gear.missingEnchants} missing`
      : "All";
  const ilvl = data.gear.playerAvgIlvl > 0 ? `${data.gear.playerAvgIlvl}` : "N/A";

  const compLabel =
    data.topPlayersCount > 1
      ? `vs Avg Top ${data.topPlayersCount}`
      : `vs #1 ${data.topPlayerName}`;

  const scorecard = [
    `**${data.playerName}** — ${data.playerSpec} ${data.playerClass} — ${data.encounterName} ${compLabel}`,
    `${metricLabel}: **${dpsVal}** | Percentile: **${pct}** | iLvl: **${ilvl}**`,
    `Flask: ${flask} | Food: ${food} | Wep Enh: ${wepEnh} | Enchants: ${enchants}`,
  ].join("\n");

  // Add metric scores
  let metricsLine = "";
  if (data.metricPercentiles?.metrics.length > 0) {
    const scores = data.metricPercentiles.metrics
      .map((m) => `${m.label}: ${m.grade}(${m.percentile}%)`)
      .join(" | ");
    metricsLine = `\n**Performance:** ${data.metricPercentiles.overallGrade}(${data.metricPercentiles.overallScore}%) — ${scores}`;
  }

  if (data.suggestions.length === 0) {
    return scorecard + metricsLine;
  }

  const priorityMarker: Record<string, string> = {
    high: "!!",
    medium: "!",
    low: "~",
  };

  const lines = data.suggestions.map((s: ImprovementSuggestion) => {
    const marker = priorityMarker[s.priority] ?? "";
    return `${marker} **[${(categoryLabels[s.category] ?? s.category).toUpperCase()}]** ${s.title}\n> ${s.description}${s.estimatedImpact ? `\n> _${s.estimatedImpact}_` : ""}`;
  });

  return `${scorecard}${metricsLine}\n\n**Suggestions**\n${lines.join("\n\n")}`;
}

export default function ComparisonSummary({ data, previousSnapshot }: { data: AnalysisResult; previousSnapshot?: AnalysisSnapshot | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopyDiscord = async () => {
    const text = formatForDiscord(data);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metricLabel = data.playerRole === "healer" ? "HPS" : "DPS";
  const { consumables, gear, dps, suggestions, metricPercentiles } = data;

  // Determine status colors for each scorecard cell
  const pctStatus =
    dps.percentile >= 75 ? "good" : dps.percentile >= 50 ? "warn" : "bad";
  const flaskStatus = consumables.flask ? "good" : "bad";
  const foodStatus = consumables.food ? "good" : "bad";
  const wepEnhStatus = consumables.weaponEnhancement ? "good" : "bad";
  const enchantStatus =
    gear.missingEnchants === 0
      ? "good"
      : gear.missingEnchants <= 2
        ? "warn"
        : "bad";

  return (
    <Card className="relative overflow-hidden">
      <ShineBorder
        shineColor={["#D4A843", "#7C5CFC"]}
        borderWidth={1}
        duration={12}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Player Scorecard</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyDiscord}
            className="text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy for Discord
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scorecard grid */}
        <div className="flex flex-wrap gap-2">
          <div
            className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 min-w-[80px] ${
              { good: "badge-good", warn: "badge-warn", bad: "badge-bad", neutral: "badge-neutral" }[pctStatus]
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              {metricLabel}
            </span>
            <NumberTicker value={Math.round(dps.playerDps)} className="text-sm font-semibold" />
            {previousSnapshot && (
              <DeltaBadge value={Math.round(dps.playerDps - previousSnapshot.dps)} />
            )}
          </div>
          <div
            className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 min-w-[80px] ${
              { good: "badge-good", warn: "badge-warn", bad: "badge-bad", neutral: "badge-neutral" }[pctStatus]
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              Percentile
            </span>
            <span className="text-sm font-semibold">
              <NumberTicker value={dps.percentile} className="text-sm font-semibold" />th
            </span>
            {previousSnapshot && (
              <DeltaBadge value={dps.percentile - previousSnapshot.percentile} />
            )}
          </div>
          <ScorecardCell
            label="Flask"
            value={consumables.flask ? "\u2713" : "\u2717"}
            status={flaskStatus}
          />
          <ScorecardCell
            label="Food"
            value={consumables.food ? "\u2713" : "\u2717"}
            status={foodStatus}
          />
          <ScorecardCell
            label="Wep Enh"
            value={consumables.weaponEnhancement ? "\u2713" : "\u2717"}
            status={wepEnhStatus}
          />
          <ScorecardCell
            label="Enchants"
            value={
              gear.missingEnchants === 0
                ? "\u2713 All"
                : `${gear.missingEnchants} missing`
            }
            status={enchantStatus}
          />
          {gear.playerAvgIlvl > 0 && (
            <ScorecardCell
              label="Avg iLvl"
              value={`${gear.playerAvgIlvl}`}
              status="neutral"
            />
          )}
        </div>

        {/* Performance Breakdown */}
        {metricPercentiles && <PerformanceBreakdown data={metricPercentiles} previousSnapshot={previousSnapshot} />}

        {/* Suggestions */}
        {suggestions.length === 0 ? (
          <p className="text-sm text-status-good">
            Great performance! No significant improvements identified.
          </p>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Suggestions
            </h3>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="surface-card p-3 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={priorityStyles[s.priority]}
                  >
                    {s.priority}
                  </Badge>
                  <Badge variant="secondary">
                    {categoryLabels[s.category] ?? s.category}
                  </Badge>
                  <span className="font-medium text-sm">{s.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.description}
                </p>
                {s.estimatedImpact && (
                  <p className="text-xs text-status-good">
                    {s.estimatedImpact}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
