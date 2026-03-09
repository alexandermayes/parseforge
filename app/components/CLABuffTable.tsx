"use client";

import { useState, useMemo } from "react";
import type { CLAPlayerResult, CLAConsumableRow, CLAConsumableDetail } from "@/lib/cla-types";
import type { RaidRole } from "@/lib/wcl-types";
import { CLASS_COLORS, ROLE_SORT_ORDER } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";
import SortableTableHead from "./SortableTableHead";
import RoleBadge from "./RoleBadge";

type SortKey =
  | "name"
  | "role"
  | "flask"
  | "battleElixir"
  | "guardianElixir"
  | "food"
  | "weaponEnhancement"
  | "scrolls"
  | "averageUptime";

type SortDir = "asc" | "desc";

interface Props {
  players: CLAPlayerResult[];
  selectedFightId: number | "all";
}

function uptimeColor(pct: number): string {
  if (pct >= 99.5) return "text-status-good";
  if (pct > 0) return "text-status-warn";
  return "text-status-bad";
}

function uptimeBg(pct: number): string {
  if (pct >= 99.5) return "";
  if (pct > 0) return "bg-status-warn/5";
  return "bg-status-bad/5";
}

function ConsumableCell({ detail }: { detail: CLAConsumableDetail }) {
  if (!detail.present) {
    return <span className="text-status-bad font-mono">0%</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`font-mono tabular-nums ${uptimeColor(detail.uptimePercent)}`}>
        {detail.uptimePercent.toFixed(0)}%
      </span>
      {detail.isSuboptimal && (
        <span title={detail.suboptimalReason}>
          <AlertTriangle className="w-3 h-3 text-status-warn" />
        </span>
      )}
    </span>
  );
}

/** Average a CLAConsumableRow field across multiple fights */
function averageConsumables(
  player: CLAPlayerResult,
): CLAConsumableRow {
  const fightData = player.fightData;
  if (fightData.length === 0) {
    const empty: CLAConsumableDetail = {
      present: false, uptimePercent: 0, spellId: 0,
      spellName: "", isSuboptimal: false, suboptimalReason: "",
    };
    return {
      flask: empty, battleElixir: empty, guardianElixir: empty,
      food: empty, weaponEnhancement: empty, scrolls: [], averageUptime: 0,
    };
  }

  if (fightData.length === 1) return fightData[0].consumables;

  const n = fightData.length;
  const avgDetail = (
    getter: (c: CLAConsumableRow) => CLAConsumableDetail,
  ): CLAConsumableDetail => {
    const details = fightData.map((fd) => getter(fd.consumables));
    const avgUptime = details.reduce((s, d) => s + d.uptimePercent, 0) / n;
    const sample = details.find((d) => d.present) ?? details[0];
    return {
      present: details.some((d) => d.present),
      uptimePercent: Math.round(avgUptime * 10) / 10,
      spellId: sample.spellId,
      spellName: sample.spellName,
      isSuboptimal: sample.isSuboptimal,
      suboptimalReason: sample.suboptimalReason,
    };
  };

  const scrollMap = new Map<number, { total: number; count: number; detail: CLAConsumableDetail }>();
  for (const fd of fightData) {
    for (const scroll of fd.consumables.scrolls) {
      const existing = scrollMap.get(scroll.spellId);
      if (existing) {
        existing.total += scroll.uptimePercent;
        existing.count++;
      } else {
        scrollMap.set(scroll.spellId, { total: scroll.uptimePercent, count: 1, detail: scroll });
      }
    }
  }
  const scrolls = Array.from(scrollMap.values()).map((s) => ({
    ...s.detail,
    uptimePercent: Math.round((s.total / n) * 10) / 10,
  }));

  const avgUptime =
    fightData.reduce((s, fd) => s + fd.consumables.averageUptime, 0) / n;

  return {
    flask: avgDetail((c) => c.flask),
    battleElixir: avgDetail((c) => c.battleElixir),
    guardianElixir: avgDetail((c) => c.guardianElixir),
    food: avgDetail((c) => c.food),
    weaponEnhancement: avgDetail((c) => c.weaponEnhancement),
    scrolls,
    averageUptime: Math.round(avgUptime * 10) / 10,
  };
}

function getPlayerConsumables(
  player: CLAPlayerResult,
  selectedFightId: number | "all",
): CLAConsumableRow {
  if (selectedFightId === "all") {
    return averageConsumables(player);
  }
  const fd = player.fightData.find((f) => f.fightId === selectedFightId);
  return fd?.consumables ?? averageConsumables(player);
}

export default function CLABuffTable({ players, selectedFightId }: Props) {
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
    const withData = players.map((p) => ({
      player: p,
      consumables: getPlayerConsumables(p, selectedFightId),
    }));

    withData.sort((a, b) => {
      let cmp = 0;
      const ac = a.consumables;
      const bc = b.consumables;

      switch (sortKey) {
        case "name":
          cmp = a.player.name.localeCompare(b.player.name);
          break;
        case "role":
          cmp = ROLE_SORT_ORDER[a.player.role] - ROLE_SORT_ORDER[b.player.role];
          if (cmp === 0) cmp = a.player.name.localeCompare(b.player.name);
          break;
        case "flask":
          cmp = ac.flask.uptimePercent - bc.flask.uptimePercent;
          break;
        case "battleElixir":
          cmp = ac.battleElixir.uptimePercent - bc.battleElixir.uptimePercent;
          break;
        case "guardianElixir":
          cmp = ac.guardianElixir.uptimePercent - bc.guardianElixir.uptimePercent;
          break;
        case "food":
          cmp = ac.food.uptimePercent - bc.food.uptimePercent;
          break;
        case "weaponEnhancement":
          cmp = ac.weaponEnhancement.uptimePercent - bc.weaponEnhancement.uptimePercent;
          break;
        case "scrolls":
          cmp = ac.scrolls.length - bc.scrolls.length;
          break;
        case "averageUptime":
          cmp = ac.averageUptime - bc.averageUptime;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return withData;
  }, [players, selectedFightId, sortKey, sortDir]);

  return (
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
            <SortableTableHead label="Flask" sortKey="flask" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Battle Elixir" sortKey="battleElixir" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Guard Elixir" sortKey="guardianElixir" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Food" sortKey="food" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Wep Enh" sortKey="weaponEnhancement" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Scrolls" sortKey="scrolls" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableTableHead label="Avg %" sortKey="averageUptime" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(({ player, consumables }) => {
            const classColor = CLASS_COLORS[player.className] ?? "#FFFFFF";
            return (
              <tr
                key={player.sourceId}
                className={`border-t border-border/50 hover:bg-surface-3 transition-interactive ${uptimeBg(consumables.averageUptime)}`}
              >
                <td className="px-3 py-2 sticky left-0 bg-surface-0 z-10">
                  <span className="font-medium" style={{ color: classColor }}>
                    {player.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {player.spec}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <RoleBadge role={player.role} />
                </td>
                <td className="px-3 py-2 text-center">
                  {!consumables.flask.present && (consumables.battleElixir.present || consumables.guardianElixir.present)
                    ? <span className="text-muted-foreground/50">—</span>
                    : <ConsumableCell detail={consumables.flask} />}
                </td>
                <td className="px-3 py-2 text-center">
                  {!consumables.battleElixir.present && consumables.flask.present
                    ? <span className="text-muted-foreground/50">—</span>
                    : <ConsumableCell detail={consumables.battleElixir} />}
                </td>
                <td className="px-3 py-2 text-center">
                  {!consumables.guardianElixir.present && consumables.flask.present
                    ? <span className="text-muted-foreground/50">—</span>
                    : <ConsumableCell detail={consumables.guardianElixir} />}
                </td>
                <td className="px-3 py-2 text-center">
                  <ConsumableCell detail={consumables.food} />
                </td>
                <td className="px-3 py-2 text-center">
                  <ConsumableCell detail={consumables.weaponEnhancement} />
                </td>
                <td className="px-3 py-2 text-center">
                  {consumables.scrolls.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {consumables.scrolls.map((s) => s.spellName.replace(/Scroll of /, "").replace(/ VIII| V/, "")).join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className={`px-3 py-2 text-center font-mono tabular-nums font-semibold ${uptimeColor(consumables.averageUptime)}`}>
                  {consumables.averageUptime.toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
