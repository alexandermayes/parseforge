"use client";

import { useMemo, useState } from "react";
import type { CLAPlayerResult, CLAGearIssue, GearIssueSeverity } from "@/lib/cla-types";
import { CLASS_COLORS } from "@/lib/constants";
import { useWowheadTooltips } from "@/lib/use-wowhead";

function severityLabel(severity: GearIssueSeverity): string {
  switch (severity) {
    case "error": return "CRITICAL";
    case "warning": return "WARNING";
    case "info": return "NOTE";
  }
}

function severityPillClasses(severity: GearIssueSeverity): string {
  switch (severity) {
    case "error": return "badge-bad";
    case "warning": return "badge-warn";
    case "info": return "badge-info";
  }
}

function severityColor(severity: GearIssueSeverity): string {
  switch (severity) {
    case "error": return "border-status-bad/30 bg-status-bad/5";
    case "warning": return "border-status-warn/30 bg-status-warn/5";
    case "info": return "border-status-info/30 bg-status-info/5";
  }
}

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

function severityBreakdown(issues: CLAGearIssue[]) {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity]++;
  return counts;
}

function wowheadItemUrl(itemId: number, domain: string): string {
  return `https://www.wowhead.com/${domain}/item=${itemId}`;
}

interface GearIssuesProps {
  players: CLAPlayerResult[];
  wowheadDomain: string;
}

export function CLAGearIssuesView({ players, wowheadDomain }: GearIssuesProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  useWowheadTooltips([players, expandedPlayer]);

  const playersWithIssues = useMemo(() => {
    return players
      .filter((p) => p.gearIssues.length > 0)
      .sort((a, b) => {
        // Sort players by worst severity first, then by issue count
        const aWorst = Math.min(...a.gearIssues.map((i) => SEVERITY_ORDER[i.severity]));
        const bWorst = Math.min(...b.gearIssues.map((i) => SEVERITY_ORDER[i.severity]));
        if (aWorst !== bWorst) return aWorst - bWorst;
        return b.gearIssues.length - a.gearIssues.length;
      });
  }, [players]);

  if (playersWithIssues.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No gear issues detected. All players have proper enchants and gems.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {playersWithIssues.length} player{playersWithIssues.length > 1 ? "s" : ""} with gear issues
      </p>
      {playersWithIssues.map((player) => {
        const classColor = CLASS_COLORS[player.className] ?? "#FFFFFF";
        const counts = severityBreakdown(player.gearIssues);
        const isExpanded = expandedPlayer === player.sourceId;
        const sortedIssues = [...player.gearIssues].sort(
          (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
        );
        return (
          <div key={player.sourceId} className="rounded-lg glass overflow-hidden">
            <button
              onClick={() => setExpandedPlayer(isExpanded ? null : player.sourceId)}
              className="w-full px-3 py-2 bg-surface-2 hover:bg-surface-2/80 transition-colors flex items-center justify-between text-left"
            >
              <div>
                <span className="font-medium" style={{ color: classColor }}>
                  {player.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {player.spec} {player.className}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {counts.error > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-bad">
                    {counts.error} critical
                  </span>
                )}
                {counts.warning > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-warn">
                    {counts.warning} warning
                  </span>
                )}
                {counts.info > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded badge-info">
                    {counts.info} note
                  </span>
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="divide-y divide-border">
                {sortedIssues.map((issue, i) => (
                  <div
                    key={`${issue.slotIndex}-${issue.issueType}-${i}`}
                    className={`px-3 py-2 flex items-start gap-3 ${severityColor(issue.severity)}`}
                  >
                    <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${severityPillClasses(issue.severity)}`}>
                      {severityLabel(issue.severity)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {issue.slotName}
                        </span>
                        {issue.itemId > 0 && (
                          <a
                            href={wowheadItemUrl(issue.itemId, wowheadDomain)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                            data-wowhead={`item=${issue.itemId}&domain=${wowheadDomain}`}
                          >
                            {issue.itemName}
                          </a>
                        )}
                      </div>
                      <p className="text-sm">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Gear Listing ───────────────────────────────────────────────────

interface GearListingProps {
  players: CLAPlayerResult[];
  wowheadDomain: string;
}

export function CLAGearListing({ players, wowheadDomain }: GearListingProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  useWowheadTooltips([expandedPlayer]);

  return (
    <div className="space-y-2">
      {players.map((player) => {
        const classColor = CLASS_COLORS[player.className] ?? "#FFFFFF";
        const isExpanded = expandedPlayer === player.sourceId;
        const hasGear = player.gearSnapshot.length > 0;

        return (
          <div key={player.sourceId} className="rounded-lg glass overflow-hidden">
            <button
              onClick={() => setExpandedPlayer(isExpanded ? null : player.sourceId)}
              className="w-full px-3 py-2 bg-surface-1 hover:bg-surface-2 transition-colors flex items-center justify-between text-left"
            >
              <div>
                <span className="font-medium" style={{ color: classColor }}>
                  {player.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {player.spec} {player.className}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isExpanded ? "Hide" : "Show"} gear
              </span>
            </button>

            {isExpanded && hasGear && (
              <div className="divide-y divide-border/50">
                {player.gearSnapshot.filter((s) => s.itemId > 0).map((slot) => (
                  <div
                    key={slot.slotIndex}
                    className="px-3 py-1.5 flex items-center gap-3 text-sm"
                  >
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {slot.slotName}
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={slot.wowheadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                        data-wowhead={`item=${slot.itemId}&domain=${wowheadDomain}`}
                      >
                        {slot.itemName}
                      </a>
                      <div className="flex gap-2 flex-wrap text-xs">
                        {slot.itemLevel > 0 && (
                          <span className="text-muted-foreground">
                            ilvl {slot.itemLevel}
                          </span>
                        )}
                        {slot.enchantId > 0 && (
                          <span className="text-status-good">
                            {slot.enchantName || "Enchanted"}
                          </span>
                        )}
                        {slot.gems.length > 0 && (
                          <span className="text-purple-400 flex gap-1">
                            {slot.gems.map((gem, gi) => (
                              <a
                                key={gi}
                                href={`https://www.wowhead.com/${wowheadDomain}/item=${gem.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                data-wowhead={`item=${gem.id}&domain=${wowheadDomain}`}
                              >
                                Gem{slot.gems.length > 1 ? ` ${gi + 1}` : ""}
                              </a>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && !hasGear && (
              <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                No gear data available
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

