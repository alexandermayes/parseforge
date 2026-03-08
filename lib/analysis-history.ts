import { AnalysisResult } from "./wcl-types";

export interface AnalysisSnapshot {
  timestamp: number;
  reportCode: string;
  encounterName: string;
  playerName: string;
  playerClass: string;
  playerSpec: string;
  dps: number;
  percentile: number;
  overallScore: number;
  overallGrade: string;
  metrics: Array<{ metric: string; percentile: number; grade: string }>;
  consumables: { flask: boolean; food: boolean; weaponEnhancement: boolean };
  missingEnchants: number;
}

const STORAGE_KEY = "parseforge:history";
const MAX_PER_KEY = 10;

function getStore(): Record<string, AnalysisSnapshot[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, AnalysisSnapshot[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / access errors
  }
}

export function getHistory(playerName: string, encounterName: string): AnalysisSnapshot[] {
  const key = `${playerName}:${encounterName}`;
  return getStore()[key] ?? [];
}

export function saveSnapshot(snapshot: AnalysisSnapshot): void {
  const key = `${snapshot.playerName}:${snapshot.encounterName}`;
  const store = getStore();
  const existing = (store[key] ?? []).filter((s) => s.reportCode !== snapshot.reportCode);
  store[key] = [snapshot, ...existing].slice(0, MAX_PER_KEY);
  setStore(store);
}

export function buildSnapshot(data: AnalysisResult, reportCode: string): AnalysisSnapshot {
  return {
    timestamp: Date.now(),
    reportCode,
    encounterName: data.encounterName,
    playerName: data.playerName,
    playerClass: data.playerClass,
    playerSpec: data.playerSpec,
    dps: data.dps.playerDps,
    percentile: data.dps.percentile,
    overallScore: data.metricPercentiles?.overallScore ?? 0,
    overallGrade: data.metricPercentiles?.overallGrade ?? "",
    metrics: (data.metricPercentiles?.metrics ?? []).map((m) => ({
      metric: m.metric,
      percentile: m.percentile,
      grade: m.grade,
    })),
    consumables: { ...data.consumables },
    missingEnchants: data.gear.missingEnchants,
  };
}
