import { describe, it, expect } from "vitest";
import { analyzeDps } from "./analysis-engine";
import type { WCLRanking } from "./wcl-types";

// analyzeDps only reads `.amount` off each ranking, so minimal fixtures suffice.
const ranks = (amounts: number[]): WCLRanking[] =>
  amounts.map((amount) => ({ amount }) as unknown as WCLRanking);

describe("analyzeDps", () => {
  it("defaults to the 50th percentile with no rankings to compare against", () => {
    // 1,000,000 damage over 10s = 100,000 DPS.
    const r = analyzeDps(1_000_000, 10_000, []);
    expect(r.playerDps).toBe(100_000);
    expect(r.percentile).toBe(50);
    expect(r.medianDps).toBe(100_000); // falls back to the player's own DPS
    expect(r.gapToMedian).toBe(0);
    expect(r.gapToTop).toBe(0);
  });

  it("places a player who beats part of the field", () => {
    // 1,200,000 over 10s = 120,000 DPS, above 2 of 3 ranked parses.
    const r = analyzeDps(1_200_000, 10_000, ranks([80_000, 100_000, 130_000]), 3);
    expect(r.playerDps).toBe(120_000);
    expect(r.medianDps).toBe(100_000);
    expect(r.topDps).toBe(130_000);
    expect(r.percentile).toBe(67); // round(2/3 * 100)
    expect(r.gapToMedian).toBe(-20); // 20% above median
    expect(r.gapToTop).toBe(8); // ~7.7% below top
  });

  it("caps the percentile at 99 for a player above the entire field", () => {
    // 1,000,000 over 1s = 1,000,000 DPS, well above both ranked parses.
    const r = analyzeDps(1_000_000, 1_000, ranks([10_000, 20_000]));
    expect(r.percentile).toBe(99); // 100 clamped to 99
  });
});
