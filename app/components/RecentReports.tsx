"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentReports, type RecentReport } from "@/lib/recent-reports";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentReports() {
  const [reports, setReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    setReports(getRecentReports());
  }, []);

  if (reports.length === 0) return null;

  return (
    <div className="w-full space-y-3 text-left">
      <h2 className="text-heading-sm text-muted-foreground">Recent Reports</h2>
      <div className="grid gap-2">
        {reports.map((r) => (
          <Link
            key={r.code}
            href={`/analyze/${r.code}`}
            className="surface-card rounded-lg px-4 py-3 transition-interactive hover:bg-surface-3 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-caption text-muted-foreground truncate">
                {r.owner} &middot; {r.zone}
              </p>
            </div>
            <span className="text-caption text-muted-foreground shrink-0">
              {relativeTime(r.viewedAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
