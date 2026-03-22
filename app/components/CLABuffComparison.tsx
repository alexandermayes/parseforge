"use client";

import { useMemo } from "react";
import type { CLAPlayerResult, CLAFightMeta, CLAConsumableRow } from "@/lib/cla-types";
import { CLASS_COLORS, ROLE_SORT_ORDER } from "@/lib/constants";

function uptimeColor(pct: number): string {
  if (pct >= 95) return "bg-status-good/20 text-status-good";
  if (pct > 0) return "bg-status-warn/20 text-status-warn";
  return "bg-status-bad/20 text-status-bad";
}

function shortFightName(name: string): string {
  // Shorten boss names for column headers
  return name.replace(/^(The|Lady|Lord|King|Prince|High) /, "").split(",")[0];
}

interface Props {
  players: CLAPlayerResult[];
  fights: CLAFightMeta[];
}

export default function CLABuffComparison({ players, fights }: Props) {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  if (fights.length <= 1) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Buff comparison requires multiple fights. Select &quot;All Bosses&quot; in the fight selector to compare across fights.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Average consumable uptime per player per fight. Hover cells for details.
      </p>
      <div className="overflow-x-auto rounded-lg glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-surface-2 z-10 min-w-[140px]">
                Player
              </th>
              {fights.map((fight) => (
                <th
                  key={fight.id}
                  className="px-2 py-2 text-center text-xs font-medium text-muted-foreground min-w-[70px]"
                  title={fight.name}
                >
                  {shortFightName(fight.name)}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground min-w-[60px]">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const classColor = CLASS_COLORS[player.className] ?? "#FFFFFF";
              // Calculate overall average across all fights
              const overallAvg = player.fightData.length > 0
                ? player.fightData.reduce((s, fd) => s + fd.consumables.averageUptime, 0) / player.fightData.length
                : 0;

              return (
                <tr key={player.sourceId} className="border-t border-border/50 hover:bg-surface-3 transition-interactive">
                  <td className="px-3 py-1.5 sticky left-0 bg-surface-0 z-10">
                    <span className="font-medium text-sm" style={{ color: classColor }}>
                      {player.name}
                    </span>
                  </td>
                  {fights.map((fight) => {
                    const fd = player.fightData.find((f) => f.fightId === fight.id);
                    const uptime = fd?.consumables.averageUptime ?? 0;
                    const detail = fd?.consumables;
                    const tooltip = detail
                      ? buildTooltip(detail, fight.name)
                      : "No data";

                    return (
                      <td
                        key={fight.id}
                        className={`px-2 py-1.5 text-center font-mono text-xs tabular-nums ${uptimeColor(uptime)}`}
                        title={tooltip}
                      >
                        {fd ? `${uptime.toFixed(0)}%` : "—"}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-1.5 text-center font-mono text-xs tabular-nums font-semibold ${uptimeColor(overallAvg)}`}>
                    {overallAvg.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildTooltip(consumables: CLAConsumableRow, fightName: string): string {
  const lines = [fightName];
  if (consumables.flask.present) {
    lines.push(`Flask: ${consumables.flask.spellName} (${consumables.flask.uptimePercent.toFixed(0)}%)`);
  } else if (consumables.battleElixir.present || consumables.guardianElixir.present) {
    if (consumables.battleElixir.present)
      lines.push(`Battle: ${consumables.battleElixir.spellName} (${consumables.battleElixir.uptimePercent.toFixed(0)}%)`);
    if (consumables.guardianElixir.present)
      lines.push(`Guardian: ${consumables.guardianElixir.spellName} (${consumables.guardianElixir.uptimePercent.toFixed(0)}%)`);
  } else {
    lines.push("No flask or elixirs");
  }
  if (consumables.food.present) {
    lines.push(`Food: ${consumables.food.spellName} (${consumables.food.uptimePercent.toFixed(0)}%)`);
  } else {
    lines.push("No food buff");
  }
  return lines.join("\n");
}
