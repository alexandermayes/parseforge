"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportMeta } from "@/lib/wcl-types";

interface Props {
  fights: ReportMeta["fights"];
  selectedFightId: number | null;
  onSelect: (fightId: number) => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function FightSelector({ fights, selectedFightId, onSelect }: Props) {
  return (
    <Select
      value={selectedFightId?.toString() ?? ""}
      onValueChange={(v) => onSelect(parseInt(v, 10))}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select a fight..." />
      </SelectTrigger>
      <SelectContent>
        {fights.map((f) => (
          <SelectItem key={f.id} value={f.id.toString()}>
            <span className="flex items-center gap-2">
              {f.kill ? (
                <span className="h-2 w-2 rounded-full bg-status-good" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-status-bad" />
              )}
              {f.name}
              <span className="text-muted-foreground text-xs">
                ({formatDuration(f.duration)}
                {!f.kill && f.bossPercentage > 0
                  ? ` — ${(f.bossPercentage / 100).toFixed(1)}%`
                  : ""}
                )
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
