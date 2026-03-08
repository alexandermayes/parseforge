"use client";

import { RaidPlayerMetrics } from "@/lib/wcl-types";
import { CLASS_COLORS, ROLE_SORT_ORDER } from "@/lib/constants";
import { Check, X } from "lucide-react";

function ConsumableIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="w-3.5 h-3.5 text-status-good" />
  ) : (
    <X className="w-3.5 h-3.5 text-status-bad" />
  );
}

export default function PlayerQuickGrid({
  players,
  onPlayerClick,
}: {
  players: RaidPlayerMetrics[];
  onPlayerClick: (sourceId: number) => void;
}) {
  const sorted = [...players].sort((a, b) => {
    const roleOrder = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
    if (roleOrder !== 0) return roleOrder;
    return b.throughput - a.throughput;
  });

  return (
    <div className="space-y-3">
      <p className="text-caption">
        Select a player to analyze their performance against top-ranked players.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sorted.map((p) => {
          const classColor = CLASS_COLORS[p.className] ?? "#888";
          const metricLabel = p.role === "Healer" ? "HPS" : "DPS";
          const enchantOk = p.missingEnchants === 0;

          return (
            <button
              key={p.sourceId}
              onClick={() => onPlayerClick(p.sourceId)}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-interactive px-3 py-2.5 text-left group"
            >
              {/* Class color bar */}
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: classColor }}
              />

              {/* Name + spec */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-medium text-sm truncate group-hover:underline"
                    style={{ color: classColor }}
                  >
                    {p.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {p.spec}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{Math.round(p.throughput).toLocaleString()} {metricLabel}</span>
                  {p.avgItemLevel > 0 && (
                    <span className="font-mono">ilvl {p.avgItemLevel}</span>
                  )}
                </div>
              </div>

              {/* Quick status icons */}
              <div className="flex items-center gap-1 shrink-0">
                <ConsumableIcon value={p.consumables.flask} />
                <ConsumableIcon value={p.consumables.food} />
                <ConsumableIcon value={p.consumables.weaponEnhancement} />
                {!enchantOk && (
                  <span className="text-[10px] text-status-bad font-mono ml-0.5">
                    {p.missingEnchants}E
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 text-caption text-[10px]">
        <span>Icons: Flask / Food / Wep Enh</span>
        <span>E = missing enchants</span>
      </div>
    </div>
  );
}
