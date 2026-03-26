"use client";

import type { ReactNode } from "react";
import { CLASS_COLORS } from "@/lib/constants";
import { ChevronRight } from "lucide-react";

interface PlayerAccordionRowProps {
  name: string;
  className: string;
  spec: string;
  isExpanded: boolean;
  onToggle: () => void;
  badges?: ReactNode;
  children?: ReactNode;
}

export default function PlayerAccordionRow({
  name,
  className,
  spec,
  isExpanded,
  onToggle,
  badges,
  children,
}: PlayerAccordionRowProps) {
  const classColor = CLASS_COLORS[className] ?? "#FFFFFF";

  return (
    <div className="rounded-lg glass overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 bg-surface-2 hover:bg-surface-2/80 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
          <span className="font-medium" style={{ color: classColor }}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground">
            {spec} {className}
          </span>
        </div>
        {badges && <div className="flex items-center gap-2">{badges}</div>}
      </button>
      {isExpanded && children}
    </div>
  );
}
