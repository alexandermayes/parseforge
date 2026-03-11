"use client";

import { useState } from "react";
import type { CLAResult } from "@/lib/cla-types";
import CLABuffTable from "./CLABuffTable";
import { CLAGearIssuesView, CLAGearListing } from "./CLAGearIssues";

type CLASubTab = "buffs" | "gear-issues" | "gear-listing";

interface Props {
  data: CLAResult;
  selectedFightId: number | "all";
}

export function CLALoading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-64 bg-muted rounded" />
      <div className="h-[400px] bg-muted/50 rounded-lg" />
    </div>
  );
}

export default function CLAView({ data, selectedFightId }: Props) {
  const [subTab, setSubTab] = useState<CLASubTab>("buffs");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub-tab switcher */}
      <div className="glass flex gap-1 p-1 rounded-lg w-fit">
        {([
          { key: "buffs" as const, label: "Buff / Consumable Tracking" },
          { key: "gear-issues" as const, label: "Gear Issues" },
          { key: "gear-listing" as const, label: "Gear Listing" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`relative px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
              subTab === key
                ? "bg-surface-2 text-foreground shadow-sm tab-active-gold"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fight info header */}
      {selectedFightId === "all" ? (
        <p className="text-body text-muted-foreground">
          Showing averages across {data.fights.length} fight{data.fights.length > 1 ? "s" : ""}
        </p>
      ) : (
        (() => {
          const fight = data.fights.find((f) => f.id === selectedFightId);
          if (!fight) return null;
          const dur = `${Math.floor(fight.duration / 60000)}:${String(
            Math.floor((fight.duration % 60000) / 1000)
          ).padStart(2, "0")}`;
          return (
            <p className="text-body text-muted-foreground">
              {fight.name} &middot; {dur}
            </p>
          );
        })()
      )}

      {/* Sub-tab content */}
      {subTab === "buffs" && (
        <CLABuffTable
          players={data.players}
          selectedFightId={selectedFightId}
          wowheadDomain={data.wowheadDomain}
        />
      )}

      {subTab === "gear-issues" && (
        <CLAGearIssuesView
          players={data.players}
          wowheadDomain={data.wowheadDomain}
        />
      )}

      {subTab === "gear-listing" && (
        <CLAGearListing
          players={data.players}
          wowheadDomain={data.wowheadDomain}
        />
      )}
    </div>
  );
}
