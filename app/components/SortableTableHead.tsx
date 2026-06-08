"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  currentSort: K;
  currentDir: "asc" | "desc";
  onSort: (key: K) => void;
  className?: string;
  /** Aligns the header content to match the column's cells. Defaults to left. */
  align?: "left" | "right" | "center";
}

export default function SortableTableHead<K extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
  align = "left",
}: SortableTableHeadProps<K>) {
  const isActive = currentSort === sortKey;
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <th
      scope="col"
      aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 text-label select-none whitespace-nowrap ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}${
          isActive ? (currentDir === "asc" ? " (ascending)" : " (descending)") : ""
        }`}
        className={`group inline-flex w-full items-center gap-1 ${justify} cursor-pointer transition-colors hover:text-gold-from ${
          isActive ? "text-gold-from" : ""
        }`}
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="w-3 h-3 shrink-0 text-gold-from" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3 h-3 shrink-0 text-gold-from" aria-hidden="true" />
          )
        ) : (
          // Neutral indicator so every sortable column reads as clickable
          // (the previous version showed nothing on inactive columns, which
          // drove header rageclicks — users couldn't tell they could sort).
          <ChevronsUpDown
            className="w-3 h-3 shrink-0 opacity-30 transition-opacity group-hover:opacity-70"
            aria-hidden="true"
          />
        )}
      </button>
    </th>
  );
}
