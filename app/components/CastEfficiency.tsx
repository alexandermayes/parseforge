"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CastAnalysis } from "@/lib/wcl-types";
import SpellLink, { buildRankedNames } from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";
import { useMemo } from "react";

export default function CastEfficiency({ data, wowheadDomain = "tbc" }: { data: CastAnalysis; wowheadDomain?: string }) {
  useWowheadTooltips([data]);
  const rankedNames = useMemo(() => buildRankedNames(data.casts), [data.casts]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cast Efficiency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-caption mb-3">
          Your CPM: {data.playerActiveTime.toFixed(1)} &middot; Top CPM:{" "}
          {data.topActiveTime.toFixed(1)} (total casts / min)
        </div>
        {data.casts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cast data available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ability</TableHead>
                <TableHead className="text-right">Your CPM</TableHead>
                <TableHead className="text-right">Top CPM</TableHead>
                <TableHead className="text-right">Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.casts.map((c) => (
                <TableRow key={c.guid}>
                  <TableCell className="font-medium">
                    <SpellLink name={rankedNames.get(c.guid) ?? c.name} guid={c.guid} domain={wowheadDomain} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.playerCpm}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.topCpm}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      c.cpmDiff > 1
                        ? "text-status-bad"
                        : c.cpmDiff < -1
                          ? "text-status-good"
                          : "text-muted-foreground"
                    }`}
                  >
                    {c.cpmDiff > 0 ? "+" : ""}
                    {c.cpmDiff}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
