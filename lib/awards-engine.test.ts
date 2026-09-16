import { describe, it, expect } from "vitest";
import { buildRaidOverview } from "./raid-overview-engine";
import type { DeathEvent } from "./raid-overview-engine";
import { computeAwards, AWARD_POOL, MAX_AWARDS_SHOWN, MAX_WINNER_NAMES } from "./awards-engine";
import { formatFightTime } from "./utils";
import type {
  RaidOverviewResult,
  RaidPlayerMetrics,
  HealerMetrics,
  WCLCombatantInfoEvent,
  WCLPlayerDetails,
} from "./wcl-types";
import demoRaidOverview from "./__fixtures__/demo-raid-overview.json";
import demoRaidCombatantInfo from "./__fixtures__/demo-raid-combatant-info.json";
import demoRaidDeathEvents from "./__fixtures__/demo-raid-death-events.json";

// Driven by the same recorded fixtures raid-overview-engine.test.ts uses
// (report ZjKgNYxVcAqR8pGJ, fight 23, "The Lurker Below") for one realistic
// "does it produce sane output on real data" case. Fight 23 genuinely has
// zero deaths (lib/__fixtures__/README.md), so it cannot exercise
// death-dependent awards — those behaviours are covered below by small
// synthetic RaidOverviewResult object literals, since the engine's input type
// is the already-decoupled RaidOverviewResult (not a new WCL recording).

const report = demoRaidOverview.reportData.report;
const FIGHT = report.fights[0];
const FIGHT_DURATION_MS = FIGHT.endTime - FIGHT.startTime;

const PLAYER_DETAILS = (
  Object.values(
    (report.playerDetails as unknown as { data: { playerDetails: Record<string, WCLPlayerDetails[]> } })
      .data.playerDetails,
  ).flat()
) as WCLPlayerDetails[];

const COMBATANT_EVENTS = demoRaidCombatantInfo.reportData.report.combatantInfo
  .data as unknown as WCLCombatantInfoEvent[];

// demo-raid-death-events.json's own recorded deathEvents.data is a genuinely
// empty array for this fight — real data, not a placeholder.
const RECORDED_DEATH_EVENTS = demoRaidDeathEvents.reportData.report.deathEvents
  .data as unknown as DeathEvent[];

function realOverview(): RaidOverviewResult {
  return buildRaidOverview({
    playerDetails: PLAYER_DETAILS,
    damageEntries: report.damage.data.entries,
    healingEntries: report.healing.data.entries,
    deathEntries: report.deaths.data.entries,
    damageTakenEntries: report.damageTaken.data.entries,
    combatantInfoEvents: COMBATANT_EVENTS,
    deathEvents: RECORDED_DEATH_EVENTS,
    fightDuration: FIGHT_DURATION_MS,
    fightStartTime: FIGHT.startTime,
    encounterName: FIGHT.name,
  });
}

// ─── Synthetic RaidOverviewResult builders ────────────────────────────
// The engine's input is the already-decoupled RaidOverviewResult type, so
// synthetic fixtures are simple object literals, not new WCL recordings.

function makePlayer(overrides: Partial<RaidPlayerMetrics> = {}): RaidPlayerMetrics {
  return {
    sourceId: 1,
    name: "Player1",
    className: "Warrior",
    spec: "Fury",
    role: "Physical",
    throughput: 1000,
    deaths: 0,
    deathDetails: [],
    avoidableDamage: 0,
    activityPercent: 90,
    consumables: { flask: true, food: true, weaponEnhancement: true },
    missingEnchants: 0,
    avgItemLevel: 60,
    ...overrides,
  };
}

function makeHealer(overrides: Partial<HealerMetrics> = {}): HealerMetrics {
  return {
    sourceId: 2,
    name: "Healer1",
    className: "Priest",
    spec: "Holy",
    hps: 500,
    totalHealing: 100000,
    overhealPercent: 10,
    activityPercent: 80,
    ...overrides,
  };
}

function makeOverview(overrides: Partial<RaidOverviewResult> = {}): RaidOverviewResult {
  return {
    encounterName: "Test Boss",
    fightDuration: 60000,
    players: [makePlayer()],
    deathTimeline: [],
    raidBuffCoverage: [],
    healerMetrics: [],
    ...overrides,
  };
}

describe("AWARD_POOL shape", () => {
  it("has exactly 5 entries at priorities 1 through 5 with the fixed ids", () => {
    expect(AWARD_POOL.map((r) => r.id)).toEqual([
      "first-to-die",
      "top-dps",
      "top-hps",
      "flaskless",
      "best-prepared",
    ]);
    expect(AWARD_POOL.map((r) => r.priority)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("computeAwards — fixture-driven real data (fight 23, zero deaths)", () => {
  it("fires neither first-to-die nor iron-man on the zero-death demo fixture", () => {
    const result = computeAwards(realOverview(), { name: FIGHT.name, outcome: null });
    const ids = result.awards.map((a) => a.id);
    expect(ids).not.toContain("first-to-die");
    // iron-man is not in this plan's 5-rule pool (03-02 adds it) — asserting
    // its absence documents the forward-compatible expectation.
    expect(ids).not.toContain("iron-man");
  });
});

describe("computeAwards — first-to-die", () => {
  it("fires first-to-die naming deathTimeline[0].playerName with a formatFightTime stat", () => {
    const overview = makeOverview({
      deathTimeline: [
        { playerName: "Thrallfan", playerClass: "Shaman", sourceId: 5, fightTimeMs: 42_000, damage: 0, healing: 0 },
        { playerName: "Latecomer", playerClass: "Mage", sourceId: 6, fightTimeMs: 90_000, damage: 0, healing: 0 },
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "first-to-die");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Thrallfan", className: "Shaman", sourceId: 5 }]);
    expect(award!.stat).toBe(`${formatFightTime(42_000)} in`);
  });
});

describe("computeAwards — top-dps / top-hps", () => {
  it("fires top-dps for the highest-throughput non-healer player, excluding Healer role", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", role: "Physical", throughput: 500 }),
        makePlayer({ sourceId: 2, name: "B", role: "Caster", throughput: 800 }),
        makePlayer({ sourceId: 3, name: "HealerGuy", role: "Healer", throughput: 900 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "top-dps");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "B", className: "Warrior", sourceId: 2 }]);
    expect(award!.stat).toBe("800 dps");
  });

  it("fires top-hps for the highest-hps entry in healerMetrics", () => {
    const overview = makeOverview({
      healerMetrics: [
        makeHealer({ sourceId: 10, name: "H1", hps: 300 }),
        makeHealer({ sourceId: 11, name: "H2", hps: 700 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "top-hps");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "H2", className: "Priest", sourceId: 11 }]);
    expect(award!.stat).toBe("700 hps");
  });
});

describe("computeAwards — flaskless", () => {
  it("fires only when at least one player's consumables.flask is false, naming every such player", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", consumables: { flask: false, food: true, weaponEnhancement: true } }),
        makePlayer({ sourceId: 2, name: "B", consumables: { flask: false, food: true, weaponEnhancement: true } }),
        makePlayer({ sourceId: 3, name: "C", consumables: { flask: true, food: true, weaponEnhancement: true } }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "flaskless");
    expect(award).toBeTruthy();
    expect(award!.winners.map((w) => w.name).sort()).toEqual(["A", "B"]);
    expect(award!.stat).toBe("no flask");
  });

  it("does not fire when every player has a flask", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", consumables: { flask: true, food: true, weaponEnhancement: true } }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "flaskless")).toBeUndefined();
  });
});

describe("computeAwards — winner truncation", () => {
  it("caps winners at MAX_WINNER_NAMES and records the remainder in extraWinnerCount", () => {
    const names = ["Amy", "Bob", "Cody", "Dee", "Eve"];
    const overview = makeOverview({
      players: names.map((name, i) =>
        makePlayer({
          sourceId: i + 1,
          name,
          consumables: { flask: false, food: true, weaponEnhancement: true },
        }),
      ),
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "flaskless");
    expect(award).toBeTruthy();
    expect(award!.winners).toHaveLength(MAX_WINNER_NAMES);
    expect(award!.winners.map((w) => w.name)).toEqual(["Amy", "Bob", "Cody"]);
    expect(award!.extraWinnerCount).toBe(2);
  });
});

describe("computeAwards — ordering and cap", () => {
  it("sorts fired awards ascending by priority and never exceeds MAX_AWARDS_SHOWN", () => {
    const overview = makeOverview({
      fightDuration: 120_000,
      players: [
        makePlayer({ sourceId: 1, name: "TopDps", role: "Physical", throughput: 5000, missingEnchants: 1 }),
        makePlayer({
          sourceId: 2,
          name: "Flaskless",
          role: "Physical",
          throughput: 200,
          consumables: { flask: false, food: true, weaponEnhancement: true },
        }),
        makePlayer({
          sourceId: 3,
          name: "BestPrepared",
          role: "Physical",
          throughput: 100,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 0,
          avgItemLevel: 90,
        }),
      ],
      healerMetrics: [makeHealer({ sourceId: 10, name: "H1", hps: 300 })],
      deathTimeline: [
        { playerName: "Deadguy", playerClass: "Warrior", sourceId: 99, fightTimeMs: 5000, damage: 0, healing: 0 },
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: { kill: false, bossPercentage: 42 } });
    expect(result.awards.map((a) => a.id)).toEqual([
      "first-to-die",
      "top-dps",
      "top-hps",
      "flaskless",
      "best-prepared",
    ]);
    expect(result.awards.length).toBeLessThanOrEqual(MAX_AWARDS_SHOWN);
    expect(result.awards.find((a) => a.id === "top-dps")!.winners[0].name).toBe("TopDps");
    expect(result.awards.find((a) => a.id === "best-prepared")!.winners[0].name).toBe("BestPrepared");
  });
});

describe("computeAwards — guards never throw", () => {
  it("returns an empty awards array for a falsy overview", () => {
    const result = computeAwards(null, { name: "Test Boss", outcome: null });
    expect(result.awards).toEqual([]);
    expect(result.encounterName).toBe("Test Boss");
  });

  it("returns an empty awards array for an empty players array", () => {
    const result = computeAwards(makeOverview({ players: [] }), { name: "Test Boss", outcome: null });
    expect(result.awards).toEqual([]);
  });

  it("returns an empty awards array for a fightDuration of 0", () => {
    const result = computeAwards(makeOverview({ fightDuration: 0 }), { name: "Test Boss", outcome: null });
    expect(result.awards).toEqual([]);
  });
});

describe("computeAwards — outcome", () => {
  it("returns outcome null when the caller passes no fight outcome", () => {
    const result = computeAwards(makeOverview(), { name: "Test Boss", outcome: null });
    expect(result.outcome).toBeNull();
  });
});
