"use client";

import { useMemo, useState } from "react";
import type { CLAPlayerResult, CLAClassBuff } from "@/lib/cla-types";
import PlayerAccordionRow from "./PlayerAccordionRow";

function buffSeverityIcon(severity: CLAClassBuff["severity"]): string {
  switch (severity) {
    case "ok": return "✓";
    case "missing": return "✗";
    case "warning": return "⚠";
  }
}

function buffSeverityClasses(severity: CLAClassBuff["severity"]): string {
  switch (severity) {
    case "ok": return "text-status-good";
    case "missing": return "text-status-bad";
    case "warning": return "text-status-warn";
  }
}

function buffRowBg(severity: CLAClassBuff["severity"]): string {
  switch (severity) {
    case "ok": return "";
    case "missing": return "border-status-bad/30 bg-status-bad/5";
    case "warning": return "border-status-warn/30 bg-status-warn/5";
  }
}

function summarize(buffs: CLAClassBuff[]): { missing: number; warning: number } {
  let missing = 0;
  let warning = 0;
  for (const b of buffs) {
    if (b.severity === "missing") missing++;
    if (b.severity === "warning") warning++;
  }
  return { missing, warning };
}

interface Props {
  players: CLAPlayerResult[];
  wowheadDomain: string;
}

export default function CLAClassBuffs({ players, wowheadDomain }: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

  const playersWithBuffData = useMemo(() => {
    return players
      .filter((p) => p.classBuffs.length > 0)
      .sort((a, b) => {
        const aSum = summarize(a.classBuffs);
        const bSum = summarize(b.classBuffs);
        // Sort by issues first (missing+warning), then alphabetically
        const aIssues = aSum.missing * 2 + aSum.warning;
        const bIssues = bSum.missing * 2 + bSum.warning;
        if (aIssues !== bIssues) return bIssues - aIssues;
        return a.name.localeCompare(b.name);
      });
  }, [players]);

  if (playersWithBuffData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No class buff data available. Buff data requires auras in CombatantInfo events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {playersWithBuffData.length} player{playersWithBuffData.length > 1 ? "s" : ""} with class buff data
      </p>
      {playersWithBuffData.map((player) => {
        const { missing, warning } = summarize(player.classBuffs);
        const isExpanded = expandedPlayer === player.sourceId;

        return (
          <PlayerAccordionRow
            key={player.sourceId}
            name={player.name}
            className={player.className}
            spec={player.spec}
            isExpanded={isExpanded}
            onToggle={() => setExpandedPlayer(isExpanded ? null : player.sourceId)}
            badges={
              <>
                {missing > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-bad">
                    {missing} missing
                  </span>
                )}
                {warning > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-warn">
                    {warning} warning
                  </span>
                )}
                {missing === 0 && warning === 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-good">
                    All buffs
                  </span>
                )}
              </>
            }
          >
            <div className="divide-y divide-border">
              {player.classBuffs.map((buff, i) => (
                <div
                  key={`${buff.buffFamily}-${i}`}
                  className={`px-3 py-2 flex items-center gap-3 ${buffRowBg(buff.severity)}`}
                >
                  <span className={`text-sm font-bold shrink-0 ${buffSeverityClasses(buff.severity)}`}>
                    {buffSeverityIcon(buff.severity)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">{buff.buffFamily}</span>
                    {buff.severity === "missing" && (
                      <span className="text-xs text-status-bad ml-2">Missing</span>
                    )}
                    {buff.severity === "warning" && buff.reason && (
                      <span className="text-xs text-status-warn ml-2">{buff.reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </PlayerAccordionRow>
        );
      })}
    </div>
  );
}
