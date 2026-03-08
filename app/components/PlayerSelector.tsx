"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLASS_COLORS } from "@/lib/constants";

interface PlayerEntry {
  id: number;
  name: string;
  type: string;
  icon?: string;
}

interface Props {
  players: PlayerEntry[];
  selectedSourceId: number | null;
  onSelect: (sourceId: number) => void;
}

export default function PlayerSelector({ players, selectedSourceId, onSelect }: Props) {
  return (
    <Select
      value={selectedSourceId?.toString() ?? ""}
      onValueChange={(v) => onSelect(parseInt(v, 10))}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select a player..." />
      </SelectTrigger>
      <SelectContent>
        {players.map((p) => (
          <SelectItem key={p.id} value={p.id.toString()}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: CLASS_COLORS[p.type] ?? "#888",
                }}
              />
              <span style={{ color: CLASS_COLORS[p.type] ?? undefined }}>
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">{p.type}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
