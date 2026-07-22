import type { ReportMeta, RaidOverviewResult, AnalysisResult } from "./types.js";

const API_URL = process.env.PARSEFORGE_API_URL || "https://parseforge.gg";

/** A failed ParseForge API call, carrying the status and a clean, postable message. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    // Never echo raw upstream bodies into Discord. Surface only the API's
    // `error` field when the body is JSON, otherwise a generic message.
    let message = "Something went wrong. Please try again.";
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: unknown };
        if (typeof parsed.error === "string" && parsed.error) message = parsed.error;
      } catch {
        // Non-JSON body — keep the generic message.
      }
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

/** User-facing text for an API failure, always safe to post in a Discord reply. */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return "ParseForge is handling a lot of requests right now — give it a few seconds and try again.";
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
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
