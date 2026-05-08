import type { ReportMeta, RaidOverviewResult, AnalysisResult } from "./types.js";

const API_URL = process.env.PARSEFORGE_API_URL || "https://parseforge.gg";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function fetchReportMeta(reportCode: string): Promise<ReportMeta> {
  return apiFetch<ReportMeta>(`/api/report/${reportCode}`);
}

export function fetchRaidOverview(
  reportCode: string,
  fightId: number,
): Promise<RaidOverviewResult> {
  return apiFetch<RaidOverviewResult>("/api/raid-overview", {
    method: "POST",
    body: JSON.stringify({ reportCode, fightId }),
  });
}

export function fetchAnalysis(
  reportCode: string,
  fightId: number,
  sourceId: number,
): Promise<AnalysisResult> {
  return apiFetch<AnalysisResult>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ reportCode, fightId, sourceId }),
  });
}
