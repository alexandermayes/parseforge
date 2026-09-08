"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CastTimelineResult } from "@/lib/wcl-types";
import { formatFightTime } from "@/lib/utils";
import SpellLink from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";

const ICON_BASE_URL = "https://wow.zamimg.com/images/wow/icons/medium/";

function AbilityIcon({ icon, name }: { icon?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!icon || failed) {
    return (
      <div className="w-6 h-6 shrink-0 rounded-[3px] bg-surface-2" aria-hidden="true" />
    );
  }
  return (
    <img
      src={`${ICON_BASE_URL}${icon}`}
      alt={name}
      loading="lazy"
      className="w-6 h-6 shrink-0 rounded-[3px] border border-border/50 bg-surface-2 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

interface CastTimelineProps {
  result: CastTimelineResult | null;
  loading: boolean;
  error: string | null;
  wowheadDomain?: string;
}

export default function CastTimeline({
  result,
  loading,
  error,
  wowheadDomain = "tbc",
}: CastTimelineProps) {
  useWowheadTooltips([result]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cast Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && result && result.castCount === 0 && (
          <p className="text-sm text-muted-foreground">
            No casts recorded for this player in this fight.
          </p>
        )}

        {!loading && !error && result && result.castCount > 0 && (
          // Bounded height + vertical-only scroll so a long log scrolls inside
          // the card instead of stretching the page. Only the ability-name
          // column flexes (truncate absorbs a long name); the timestamp, icon
          // and target columns are all fixed-width, so the row never needs
          // horizontal scroll.
          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {result.rows.map((row, i) => (
              <div
                key={`${row.abilityGameID}-${row.fightTimeMs}-${i}`}
                className="flex items-center gap-2 h-10 hover:bg-surface-2"
              >
                <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {formatFightTime(row.fightTimeMs)}
                </span>
                <AbilityIcon icon={row.abilityIcon} name={row.abilityName ?? ""} />
                <span className="flex-1 min-w-0 truncate text-body-sm">
                  <SpellLink
                    name={row.abilityName ?? ""}
                    guid={row.abilityGameID ?? 0}
                    domain={wowheadDomain}
                  />
                </span>
                <span className="w-24 shrink-0 truncate text-right text-caption text-muted-foreground">
                  {row.targetName ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
