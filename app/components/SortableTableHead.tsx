"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  currentSort: K;
  currentDir: "asc" | "desc";
  onSort: (key: K) => void;
  className?: string;
}

export default function SortableTableHead<K extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
}: SortableTableHeadProps<K>) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={`px-3 py-2 text-label cursor-pointer hover:text-gold-from select-none whitespace-nowrap ${className ?? ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {isActive &&
          (currentDir === "asc" ? (
            <ChevronUp className="w-3 h-3 text-gold-from" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gold-from" />
          ))}
      </span>
    </th>
  );
}
