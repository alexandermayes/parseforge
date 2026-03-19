"use client";

import { useState, useMemo } from "react";
import type { RaidOverviewResult, RaidPlayerMetrics, RaidRole, DeathDetail } from "@/lib/wcl-types";
import { CLASS_COLORS, ROLE_COLORS } from "@/lib/constants";
import { Check, X } from "lucide-react";
import SortableTableHead from "./SortableTableHead";
import RoleBadge from "./RoleBadge";

type SortKey =
  | "name"
  | "role"
  | "throughput"
  | "deaths"
  | "avoidableDamage"
  | "activityPercent"
  | "flask"
  | "food"
  | "weaponEnhancement"
  | "missingEnchants"
  | "avgItemLevel";

type SortDir = "asc" | "desc";

const ROLE_SORT: Record<RaidRole, number> = {
  Tank: 0,
  Healer: 1,
  Caster: 2,
  Physical: 3,
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function deathColor(deaths: number): string {
  if (deaths === 0) return "text-status-good";
  if (deaths === 1) return "text-status-warn";
  return "text-status-bad";
}

function activityColor(pct: number): string {
  if (pct >= 95) return "text-status-good";
  if (pct >= 80) return "text-status-warn";
  return "text-status-bad";
}

function enchantColor(missing: number): string {
  if (missing === 0) return "text-status-good";
  if (missing <= 2) return "text-status-warn";
  return "text-status-bad";
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <Check className="w-4 h-4 text-status-good mx-auto" />
  ) : (
    <X className="w-4 h-4 text-status-bad mx-auto" />
  );
}

export function RaidOverviewLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-64 bg-muted rounded" />
      <div className="h-[400px] bg-muted/50 rounded-lg" />
    </div>
  );
}

interface RaidOverviewProps {
  data: RaidOverviewResult;
  onPlayerClick?: (sourceId: number) => void;
}

export default function RaidOverview({ data, onPlayerClick }: RaidOverviewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("role");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "role" ? "asc" : "desc");
    }
  };

  const sortedPlayers = useMemo(() => {
    const sorted = [...data.players];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "role":
          cmp = ROLE_SORT[a.role] - ROLE_SORT[b.role];
          if (cmp === 0) cmp = b.throughput - a.throughput;
          break;
        case "throughput":
          cmp = a.throughput - b.throughput;
          break;
        case "deaths":
          cmp = a.deaths - b.deaths;
          break;
        case "avoidableDamage":
          cmp = a.avoidableDamage - b.avoidableDamage;
          break;
        case "activityPercent":
          cmp = a.activityPercent - b.activityPercent;
          break;
        case "flask":
          cmp = (a.consumables.flask ? 1 : 0) - (b.consumables.flask ? 1 : 0);
          break;
        case "food":
          cmp = (a.consumables.food ? 1 : 0) - (b.consumables.food ? 1 : 0);
          break;
        case "weaponEnhancement":
          cmp =
            (a.consumables.weaponEnhancement ? 1 : 0) -
            (b.consumables.weaponEnhancement ? 1 : 0);
          break;
        case "missingEnchants":
          cmp = a.missingEnchants - b.missingEnchants;
          break;
        case "avgItemLevel":
          cmp = a.avgItemLevel - b.avgItemLevel;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data.players, sortKey, sortDir]);

  const durationStr = `${Math.floor(data.fightDuration / 60000)}:${String(
    Math.floor((data.fightDuration % 60000) / 1000)
  ).padStart(2, "0")}`;

  const roleCounts = data.players.reduce(
    (acc, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<RaidRole, number>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-heading-lg">{data.encounterName}</h2>
          <p className="text-caption">
            {data.players.length} players &middot; {durationStr}
          </p>
        </div>
        <div className="flex gap-2">
          {(["Tank", "Healer", "Caster", "Physical"] as RaidRole[]).map(
            (role) =>
              roleCounts[role] ? (
                <span
                  key={role}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: ROLE_COLORS[role],
                    backgroundColor: ROLE_COLORS[role] + "15",
                  }}
                >
                  {roleCounts[role]} {role}
                  {roleCounts[role] > 1 ? "s" : ""}
                </span>
              ) : null
          )}
        </div>
      </div>

      {/* Death Timeline */}
      {data.deathTimeline && data.deathTimeline.length > 0 && (
        <DeathTimeline deaths={data.deathTimeline} fightDuration={data.fightDuration} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              <SortableTableHead
                label="Player"
                sortKey="name"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="sticky left-0 bg-surface-2 z-10 min-w-[140px]"
              />
              <SortableTableHead label="Role" sortKey="role" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="DPS/HPS" sortKey="throughput" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Deaths" sortKey="deaths" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Dmg Taken" sortKey="avoidableDamage" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Activity" sortKey="activityPercent" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Flask" sortKey="flask" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Food" sortKey="food" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Wep Enh" sortKey="weaponEnhancement" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="Enchants" sortKey="missingEnchants" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableTableHead label="iLvl" sortKey="avgItemLevel" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player: RaidPlayerMetrics) => (
              <PlayerRow key={player.sourceId} player={player} onPlayerClick={onPlayerClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatFightTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function DeathTimeline({ deaths, fightDuration }: { deaths: DeathDetail[]; fightDuration: number }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? deaths : deaths.slice(0, 5);
  const firstDeath = deaths[0];

  return (
    <div className="glass rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-sm">
          Death Log
          <span className="text-muted-foreground font-normal ml-2">
            {deaths.length} death{deaths.length !== 1 ? "s" : ""}
            {firstDeath && ` \u00b7 first at ${formatFightTime(firstDeath.fightTimeMs)}`}
          </span>
        </h3>
      </div>

      {/* Timeline bar */}
      <div className="relative h-2 bg-surface-2 rounded-full overflow-hidden">
        {deaths.map((d, i) => {
          const pct = fightDuration > 0 ? (d.fightTimeMs / fightDuration) * 100 : 0;
          return (
            <div
              key={`${d.sourceId}-${i}`}
              className="absolute top-0 h-full w-1 rounded-full bg-status-bad"
              style={{ left: `${Math.min(100, Math.max(0, pct))}%` }}
              title={`${d.playerName} at ${formatFightTime(d.fightTimeMs)}`}
            />
          );
        })}
      </div>

      {/* Death entries */}
      <div className="space-y-0.5">
        {displayed.map((d, i) => {
          const classColor = CLASS_COLORS[d.playerClass] ?? "#FFFFFF";
          return (
            <div key={`${d.sourceId}-${i}`} className="flex items-center gap-3 text-sm py-0.5">
              <span className="font-mono text-xs text-muted-foreground w-10 shrink-0 text-right">
                {formatFightTime(d.fightTimeMs)}
              </span>
              <span className="font-medium" style={{ color: classColor }}>
                {d.playerName}
              </span>
              {i === 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded badge-bad">
                  FIRST
                </span>
              )}
            </div>
          );
        })}
      </div>

      {deaths.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Show less" : `Show all ${deaths.length} deaths`}
        </button>
      )}
    </div>
  );
}

function PlayerRow({ player, onPlayerClick }: { player: RaidPlayerMetrics; onPlayerClick?: (sourceId: number) => void }) {
  const classColor = CLASS_COLORS[player.className] ?? "#FFFFFF";
  const isHealer = player.role === "Healer";

  return (
    <tr className="border-t border-border/50 hover:bg-surface-3 transition-interactive">
      {/* Player name */}
      <td className="px-3 py-2 sticky left-0 bg-surface-0 z-10">
        {onPlayerClick ? (
          <button
            onClick={() => onPlayerClick(player.sourceId)}
            className="font-medium hover:underline cursor-pointer"
            style={{ color: classColor }}
          >
            {player.name}
          </button>
        ) : (
          <span className="font-medium" style={{ color: classColor }}>
            {player.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-1">
          {player.spec}
        </span>
      </td>

      {/* Role */}
      <td className="px-3 py-2">
        <RoleBadge role={player.role} />
      </td>

      {/* Throughput */}
      <td className="px-3 py-2 font-mono text-right tabular-nums">
        {formatNumber(player.throughput)}
        <span className="text-xs text-muted-foreground ml-0.5">
          {isHealer ? "hps" : "dps"}
        </span>
      </td>

      {/* Deaths */}
      <td
        className={`px-3 py-2 text-center font-mono tabular-nums ${deathColor(player.deaths)}`}
      >
        {player.deaths}
      </td>

      {/* Damage Taken */}
      <td className="px-3 py-2 font-mono text-right tabular-nums">
        {formatNumber(player.avoidableDamage)}
      </td>

      {/* Activity */}
      <td
        className={`px-3 py-2 text-right font-mono tabular-nums ${activityColor(player.activityPercent)}`}
      >
        {player.activityPercent.toFixed(1)}%
      </td>

      {/* Flask */}
      <td className="px-3 py-2 text-center">
        <BoolCell value={player.consumables.flask} />
      </td>

      {/* Food */}
      <td className="px-3 py-2 text-center">
        <BoolCell value={player.consumables.food} />
      </td>

      {/* Weapon Enhancement */}
      <td className="px-3 py-2 text-center">
        <BoolCell value={player.consumables.weaponEnhancement} />
      </td>

      {/* Missing Enchants */}
      <td
        className={`px-3 py-2 text-center font-mono tabular-nums ${enchantColor(player.missingEnchants)}`}
      >
        {player.missingEnchants === 0 ? <Check className="w-4 h-4 text-status-good mx-auto" /> : `${player.missingEnchants} missing`}
      </td>

      {/* Avg iLvl */}
      <td className="px-3 py-2 text-right font-mono tabular-nums">
        {player.avgItemLevel || "—"}
      </td>
    </tr>
  );
}
