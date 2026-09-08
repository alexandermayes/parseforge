import { describe, it, expect } from "vitest";
import { computeHealerMetrics, averageTopHealerMetrics } from "./healer-metrics";
import type { HealerTableRow, HealerMetricsComputed } from "./wcl-types";
import demoRaidOverview from "./__fixtures__/demo-raid-overview.json";

// Recorded fight bounds (The Lurker Below, fight 23) — see
// lib/__fixtures__/README.md "Provenance".
const FIGHT = demoRaidOverview.reportData.report.fights[0];
const FIGHT_DURATION_MS = FIGHT.endTime - FIGHT.startTime;

// Recorded healer source id (Zulakeyah, Restoration Shaman).
const HEALER_SOURCE_ID = 32;

const healingEntries = demoRaidOverview.reportData.report.healing.data
  .entries as HealerTableRow[];

const zulakeyahRow = healingEntries.find((e) => e.id === HEALER_SOURCE_ID)!;

describe("computeHealerMetrics", () => {
  it("reproduces buildRaidOverview's current effective HPS, overheal percent and uptime for a known recorded entry (behaviour-preserving extraction)", () => {
    const result = computeHealerMetrics(zulakeyahRow, FIGHT_DURATION_MS);

    // total=230867, overheal=127626, activeTime=236189, duration=346111ms —
    // computed independently against the extraction source's own formulas
    // and rounding (lib/raid-overview-engine.ts pre-extraction lines 363-379).
    expect(result.effectiveHps).toBe(667);
    expect(result.overhealPercent).toBe(35.6);
    expect(result.activityPercent).toBe(68.2);
    expect(result.hasHealing).toBe(true);
  });

  it("returns zeros with hasHealing false when the row is undefined", () => {
    const result = computeHealerMetrics(undefined, FIGHT_DURATION_MS);
    expect(result).toEqual({
      effectiveHps: 0,
      overhealPercent: 0,
      activityPercent: 0,
      hasHealing: false,
    });
  });

  it("returns zeros when the fight duration is zero", () => {
    const result = computeHealerMetrics(zulakeyahRow, 0);
    expect(result).toEqual({
      effectiveHps: 0,
      overhealPercent: 0,
      activityPercent: 0,
      hasHealing: false,
    });
  });

  it("returns zeros when the player recorded no healing (total is zero)", () => {
    const row: HealerTableRow = { id: 99, total: 0, activeTime: 0 };
    const result = computeHealerMetrics(row, FIGHT_DURATION_MS);
    expect(result).toEqual({
      effectiveHps: 0,
      overhealPercent: 0,
      activityPercent: 0,
      hasHealing: false,
    });
  });

  it("yields an overheal percent of exactly 0, not NaN, when total is positive but overheal is absent", () => {
    const row: HealerTableRow = { id: 100, total: 5000, activeTime: 10_000 };
    const result = computeHealerMetrics(row, FIGHT_DURATION_MS);
    expect(result.overhealPercent).toBe(0);
    expect(Number.isNaN(result.overhealPercent)).toBe(false);
    expect(result.hasHealing).toBe(true);
  });

  it("caps activity percent at 100 when active time exceeds the fight duration", () => {
    const row: HealerTableRow = {
      id: 101,
      total: 5000,
      activeTime: FIGHT_DURATION_MS * 2,
    };
    const result = computeHealerMetrics(row, FIGHT_DURATION_MS);
    expect(result.activityPercent).toBe(100);
  });
});

describe("averageTopHealerMetrics", () => {
  it("averages only the rows whose hasHealing is true and reports the surviving count", () => {
    const rows: HealerMetricsComputed[] = [
      { effectiveHps: 500, overhealPercent: 20, activityPercent: 80, hasHealing: true },
      { effectiveHps: 600, overhealPercent: 30, activityPercent: 90, hasHealing: true },
      { effectiveHps: 0, overhealPercent: 0, activityPercent: 0, hasHealing: false },
    ];
    const result = averageTopHealerMetrics(rows);
    expect(result.overhealPercent).toBe(25);
    expect(result.activityPercent).toBe(85);
    expect(result.sampleCount).toBe(2);
  });

  it("returns zeros and a sample count of zero for an empty input", () => {
    const result = averageTopHealerMetrics([]);
    expect(result).toEqual({ overhealPercent: 0, activityPercent: 0, sampleCount: 0 });
  });

  it("returns zeros and a sample count of zero when every row has hasHealing false", () => {
    const rows: HealerMetricsComputed[] = [
      { effectiveHps: 0, overhealPercent: 0, activityPercent: 0, hasHealing: false },
    ];
    const result = averageTopHealerMetrics(rows);
    expect(result).toEqual({ overhealPercent: 0, activityPercent: 0, sampleCount: 0 });
  });
});
