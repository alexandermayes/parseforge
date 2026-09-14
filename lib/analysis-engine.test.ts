import { describe, it, expect } from "vitest";
import { analyzeDps, generateSuggestions } from "./analysis-engine";
import type {
  WCLRanking,
  DpsComparison,
  GearAnalysis,
  ConsumableStatus,
  CastAnalysis,
  HealerComparison,
} from "./wcl-types";

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

// generateSuggestions only reads specific fields off each argument, so
// minimal, individually-overridable fixtures suffice — mirrors `ranks()`'s
// idiom above.
const dpsFixture = (overrides: Partial<DpsComparison> = {}): DpsComparison => ({
  playerDps: 1000,
  medianDps: 1000,
  topDps: 1000,
  percentile: 50,
  gapToMedian: 0,
  gapToTop: 0,
  fightDuration: 300_000,
  ...overrides,
});

const gearFixture = (overrides: Partial<GearAnalysis> = {}): GearAnalysis => ({
  slots: [],
  playerAvgIlvl: 0,
  topAvgIlvl: 0,
  missingEnchants: 0,
  missingGems: 0,
  wowheadDomain: "tbc",
  ...overrides,
});

const consumablesFixture = (overrides: Partial<ConsumableStatus> = {}): ConsumableStatus => ({
  flask: true,
  food: true,
  weaponEnhancement: true,
  ...overrides,
});

// ratio 0.95 — well within the 0.85 active-time threshold, so the DPS-shaped
// active-time rule never fires against this fixture.
const healthyCasts: CastAnalysis = { casts: [], playerActiveTime: 190, topActiveTime: 200 };
// ratio 0.5 — clears the 0.85 active-time threshold, so this fixture fires
// the active-time rule for a DPS role and must NOT fire it for a healer.
const failingCasts: CastAnalysis = { casts: [], playerActiveTime: 100, topActiveTime: 200 };

const healerFixture = (overrides: Partial<HealerComparison> = {}): HealerComparison => ({
  effectiveHps: 1000,
  overhealPercent: 20,
  activityPercent: 80,
  topOverhealPercent: 20,
  topActivityPercent: 80,
  topSampleCount: 5,
  hasHealing: true,
  ...overrides,
});

describe("generateSuggestions — healer rules (D-07)", () => {
  const healingOnly = (result: ReturnType<typeof generateSuggestions>) =>
    result.filter((s) => s.category === "healing");

  it("Test 1: fires exactly the high-overheal rule when overheal is far above top healers", () => {
    const healer = healerFixture({ overhealPercent: 40, topOverhealPercent: 20 });
    const result = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    const fired = healingOnly(result);
    expect(fired).toHaveLength(1);
    expect(fired[0].title).toBe("High overheal");
  });

  it("Test 2: fires exactly the low-uptime rule when uptime is far below top healers", () => {
    const healer = healerFixture({ activityPercent: 50, topActivityPercent: 80 });
    const result = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    const fired = healingOnly(result);
    expect(fired).toHaveLength(1);
    expect(fired[0].title).toBe("Low healing uptime");
  });

  it("Test 3: fires exactly the gear-and-consumables rule for an effective-HPS gap with in-line overheal/uptime", () => {
    const healer = healerFixture(); // overheal/uptime equal to top — in line
    const dps = dpsFixture({ gapToTop: 15, gapToMedian: 12 });
    const result = generateSuggestions(
      dps,
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    const fired = healingOnly(result);
    expect(fired).toHaveLength(1);
    expect(fired[0].title).toBe("HPS gap despite efficient healing");
  });

  it("Test 4: fires no healer rule when overheal, uptime and HPS gap are all in line", () => {
    const healer = healerFixture();
    const dps = dpsFixture({ gapToTop: 2, gapToMedian: 1 });
    const result = generateSuggestions(
      dps,
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    expect(healingOnly(result)).toHaveLength(0);
  });

  it("Test 5: a healer never receives the active-time rule, whatever their cast analysis says", () => {
    const result = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      failingCasts, // would trigger the active-time rule for a DPS role
      "healer",
      healerFixture()
    );
    expect(result.some((s) => s.category === "casts")).toBe(false);
  });

  it("Test 6: a damage dealer with the same cast analysis still receives the active-time rule", () => {
    const result = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      failingCasts,
      "dps"
    );
    expect(result.some((s) => s.category === "casts")).toBe(true);
  });

  it("Test 7: every fired healer suggestion's description contains both the player's own value and the top value for that metric", () => {
    // Overheal rule
    const overhealResult = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healerFixture({ overhealPercent: 40, topOverhealPercent: 20 })
    );
    const overhealSuggestion = healingOnly(overhealResult)[0];
    expect(overhealSuggestion.description).toContain("40%");
    expect(overhealSuggestion.description).toContain("20%");

    // Uptime rule
    const uptimeResult = generateSuggestions(
      dpsFixture(),
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healerFixture({ activityPercent: 50, topActivityPercent: 80 })
    );
    const uptimeSuggestion = healingOnly(uptimeResult)[0];
    expect(uptimeSuggestion.description).toContain("50%");
    expect(uptimeSuggestion.description).toContain("80%");

    // Effective-HPS gap rule
    const gapDps = dpsFixture({ gapToTop: 15, playerDps: 900, topDps: 1050 });
    const gapResult = generateSuggestions(
      gapDps,
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healerFixture()
    );
    const gapSuggestion = healingOnly(gapResult)[0];
    expect(gapSuggestion.description).toContain("900");
    expect(gapSuggestion.description).toContain("1050");
  });

  it("Test 8: no healer rule fires when the top-healer sample count is zero", () => {
    const healer = healerFixture({
      overhealPercent: 90,
      topOverhealPercent: 5,
      activityPercent: 10,
      topActivityPercent: 90,
      topSampleCount: 0,
    });
    const dps = dpsFixture({ gapToTop: 50, gapToMedian: 50 });
    const result = generateSuggestions(
      dps,
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    expect(healingOnly(result)).toHaveLength(0);
  });

  it("Test 9: healer suggestions sort into the existing priority order alongside gear and consumable suggestions", () => {
    // High-priority overheal rule (ratio 2.0 >= the 1.5 high threshold) plus
    // a medium-priority missing-enchant suggestion.
    const healer = healerFixture({ overhealPercent: 40, topOverhealPercent: 20 });
    const gear = gearFixture({
      missingEnchants: 1,
      slots: [
        {
          slot: 0,
          slotName: "Head",
          playerItem: null,
          topItem: null,
          isSame: false,
          playerEnchant: null,
          playerEnchantId: null,
          topEnchant: null,
          missingEnchant: true,
        },
      ],
    });
    const result = generateSuggestions(
      dpsFixture(),
      gear,
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < result.length; i++) {
      expect(priorityOrder[result[i - 1].priority]).toBeLessThanOrEqual(
        priorityOrder[result[i].priority]
      );
    }
    expect(result.some((s) => s.category === "healing" && s.priority === "high")).toBe(true);
  });

  it("Test 10: no healer rule fires when the player recorded no healing this fight (hasHealing: false)", () => {
    // Mirrors a healer who died pre-pull or was off-role: every other field on
    // this fixture is "meaningless, not measured" per hasHealing's contract
    // (lib/wcl-types.ts), so zero activity/overheal must not read as a real
    // uptime or overheal gap (CR-01).
    const healer = healerFixture({
      hasHealing: false,
      overhealPercent: 0,
      activityPercent: 0,
    });
    const dps = dpsFixture({ gapToTop: 50, gapToMedian: 50 });
    const result = generateSuggestions(
      dps,
      gearFixture(),
      consumablesFixture(),
      healthyCasts,
      "healer",
      healer
    );
    expect(healingOnly(result)).toHaveLength(0);
  });
});
