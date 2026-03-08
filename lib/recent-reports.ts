export interface RecentReport {
  code: string;
  title: string;
  owner: string;
  zone: string;
  viewedAt: number;
}

const STORAGE_KEY = "parseforge:recent";
const MAX_REPORTS = 5;

export function getRecentReports(): RecentReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentReport(report: RecentReport): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentReports().filter((r) => r.code !== report.code);
    const updated = [report, ...existing].slice(0, MAX_REPORTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore quota / access errors
  }
}
