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
  it("has exactly 15 entries at priorities 1 through 15 with the fixed ids", () => {
    expect(AWARD_POOL.map((r) => r.id)).toEqual([
      "first-to-die",
      "top-dps",
      "top-hps",
      "flaskless",
      "best-prepared",
      "graveyard-shift",
      "gcd-tourist",
      "fire-dancer",
      "naked-slots",
      "skipped-breakfast",
      "dull-blade",
      "iron-man",
      "watering-the-garden",
      "kept-them-breathing",
      "punching-up",
    ]);
    expect(AWARD_POOL.map((r) => r.priority)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });
});

describe("computeAwards — fixture-driven real data (fight 23, zero deaths)", () => {
  it("fires neither first-to-die nor iron-man on the zero-death demo fixture", () => {
    const result = computeAwards(realOverview(), { name: FIGHT.name, outcome: null });
    const ids = result.awards.map((a) => a.id);
    expect(ids).not.toContain("first-to-die");
    // iron-man requires a non-empty deathTimeline (D-02); this fixture has
    // genuinely zero recorded deaths, so it must not fire here either.
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
        // deaths: 1 on every player (not 0) so iron-man's "some player has
        // zero deaths" condition cannot fire and bleed into this fixture —
        // this test is scoped to the original 5-rule tracer's own ordering.
        makePlayer({
          sourceId: 1,
          name: "TopDps",
          role: "Physical",
          throughput: 5000,
          missingEnchants: 1,
          deaths: 1,
        }),
        makePlayer({
          sourceId: 2,
          name: "Flaskless",
          role: "Physical",
          throughput: 200,
          consumables: { flask: false, food: true, weaponEnhancement: true },
          deaths: 1,
        }),
        makePlayer({
          sourceId: 3,
          name: "BestPrepared",
          role: "Physical",
          throughput: 100,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 0,
          // Same avgItemLevel as the other two (default 60, not overridden)
          // so punching-up's >=10 ilvl-spread trigger cannot fire here — this
          // is the only best-prepared candidate regardless of ilvl, so this
          // keeps the fixture scoped to the original 5-rule ordering test.
          deaths: 1,
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

describe("computeAwards — graveyard-shift", () => {
  it("fires naming every player tied at 2 or more deaths", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", deaths: 2 }),
        makePlayer({ sourceId: 2, name: "B", deaths: 2 }),
        makePlayer({ sourceId: 3, name: "C", deaths: 1 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "graveyard-shift");
    expect(award).toBeTruthy();
    expect(award!.winners.map((w) => w.name).sort()).toEqual(["A", "B"]);
    expect(award!.stat).toBe("2 deaths");
  });

  it("does not fire when the max deaths is below 2", () => {
    const overview = makeOverview({ players: [makePlayer({ sourceId: 1, name: "A", deaths: 1 })] });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "graveyard-shift")).toBeUndefined();
  });
});

describe("computeAwards — gcd-tourist", () => {
  it("fires for the lowest-activity non-healer below 80% activity", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Low", role: "Physical", throughput: 500, activityPercent: 70 }),
        makePlayer({ sourceId: 2, name: "High", role: "Caster", throughput: 500, activityPercent: 95 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "gcd-tourist");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Low", className: "Warrior", sourceId: 1 }]);
    expect(award!.stat).toBe("70.0 active");
  });

  it("does not fire when every non-healer with throughput is at or above 80% activity", () => {
    const overview = makeOverview({ players: [makePlayer({ sourceId: 1, name: "A", activityPercent: 85 })] });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "gcd-tourist")).toBeUndefined();
  });

  it("never names a healer even at very low activity", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "HealerLow", role: "Healer", throughput: 500, activityPercent: 20 }),
        makePlayer({ sourceId: 2, name: "DpsFine", role: "Physical", throughput: 500, activityPercent: 90 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "gcd-tourist")).toBeUndefined();
  });
});

describe("computeAwards — fire-dancer", () => {
  it("fires for the max avoidableDamage when it is at least 1.5x the median across all players", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Ouch", avoidableDamage: 3000 }),
        makePlayer({ sourceId: 2, name: "B", avoidableDamage: 100 }),
        makePlayer({ sourceId: 3, name: "C", avoidableDamage: 200 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "fire-dancer");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Ouch", className: "Warrior", sourceId: 1 }]);
    expect(award!.stat).toBe("3.0K taken");
  });

  it("does not fire when the max avoidableDamage is below 1.5x the median", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", avoidableDamage: 120 }),
        makePlayer({ sourceId: 2, name: "B", avoidableDamage: 100 }),
        makePlayer({ sourceId: 3, name: "C", avoidableDamage: 110 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "fire-dancer")).toBeUndefined();
  });
});

describe("computeAwards — naked-slots", () => {
  it("fires for players with 3 or more missing enchants, ranked descending", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Worst", missingEnchants: 5 }),
        makePlayer({ sourceId: 2, name: "Bad", missingEnchants: 3 }),
        makePlayer({ sourceId: 3, name: "Fine", missingEnchants: 1 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "naked-slots");
    expect(award).toBeTruthy();
    expect(award!.winners.map((w) => w.name)).toEqual(["Worst", "Bad"]);
    expect(award!.stat).toBe("5 missing enchants");
  });

  it("does not fire when everyone has fewer than 3 missing enchants", () => {
    const overview = makeOverview({ players: [makePlayer({ sourceId: 1, name: "A", missingEnchants: 2 })] });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "naked-slots")).toBeUndefined();
  });
});

describe("computeAwards — skipped-breakfast", () => {
  it("fires for every player missing the food buff", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", consumables: { flask: true, food: false, weaponEnhancement: true } }),
        makePlayer({ sourceId: 2, name: "B", consumables: { flask: true, food: true, weaponEnhancement: true } }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "skipped-breakfast");
    expect(award).toBeTruthy();
    expect(award!.winners.map((w) => w.name)).toEqual(["A"]);
    expect(award!.stat).toBe("no food buff");
  });

  it("does not fire when everyone has the food buff", () => {
    const overview = makeOverview({ players: [makePlayer({ sourceId: 1, name: "A" })] });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "skipped-breakfast")).toBeUndefined();
  });
});

describe("computeAwards — dull-blade", () => {
  it("fires for a Physical or Tank player missing weapon enhancement, never a caster", () => {
    const overview = makeOverview({
      players: [
        makePlayer({
          sourceId: 1,
          name: "DullWarrior",
          role: "Physical",
          consumables: { flask: true, food: true, weaponEnhancement: false },
        }),
        makePlayer({
          sourceId: 2,
          name: "DullTank",
          role: "Tank",
          consumables: { flask: true, food: true, weaponEnhancement: false },
        }),
        makePlayer({
          sourceId: 3,
          name: "CasterFine",
          role: "Caster",
          consumables: { flask: true, food: true, weaponEnhancement: false },
        }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "dull-blade");
    expect(award).toBeTruthy();
    expect(award!.winners.map((w) => w.name).sort()).toEqual(["DullTank", "DullWarrior"]);
    expect(award!.stat).toBe("no weapon enhancement");
  });

  it("does not fire for a caster with no weapon enhancement", () => {
    const overview = makeOverview({
      players: [
        makePlayer({
          sourceId: 1,
          name: "CasterOnly",
          role: "Caster",
          consumables: { flask: true, food: true, weaponEnhancement: false },
        }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "dull-blade")).toBeUndefined();
  });
});

describe("computeAwards — iron-man", () => {
  it("fires praising the highest-avoidableDamage zero-death player when the raid had at least one death", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Survivor", deaths: 0, avoidableDamage: 500 }),
        makePlayer({ sourceId: 2, name: "AlsoAlive", deaths: 0, avoidableDamage: 100 }),
      ],
      deathTimeline: [
        { playerName: "Dead", playerClass: "Mage", sourceId: 9, fightTimeMs: 1000, damage: 0, healing: 0 },
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "iron-man");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Survivor", className: "Warrior", sourceId: 1 }]);
    expect(award!.stat).toBe("0 deaths · 500 taken");
  });

  it("does not fire on a wipe where every raider died", () => {
    const overview = makeOverview({
      players: [makePlayer({ sourceId: 1, name: "A", deaths: 1 })],
      deathTimeline: [
        { playerName: "A", playerClass: "Warrior", sourceId: 1, fightTimeMs: 1000, damage: 0, healing: 0 },
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "iron-man")).toBeUndefined();
  });

  it("does not fire when nobody died at all", () => {
    const overview = makeOverview({ players: [makePlayer({ sourceId: 1, name: "A", deaths: 0 })] });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "iron-man")).toBeUndefined();
  });
});

describe("computeAwards — watering-the-garden", () => {
  it("fires for a healer with overheal at or above 50%", () => {
    const overview = makeOverview({
      healerMetrics: [makeHealer({ sourceId: 10, name: "Overhealer", totalHealing: 50000, overhealPercent: 62 })],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "watering-the-garden");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Overhealer", className: "Priest", sourceId: 10 }]);
    expect(award!.stat).toBe("62% overheal");
  });

  it("does not fire below 50% overheal", () => {
    const overview = makeOverview({
      healerMetrics: [makeHealer({ sourceId: 10, name: "Efficient", totalHealing: 50000, overhealPercent: 20 })],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "watering-the-garden")).toBeUndefined();
  });
});

describe("computeAwards — kept-them-breathing", () => {
  it("fires for a healer with activity at or above 85%", () => {
    const overview = makeOverview({
      healerMetrics: [makeHealer({ sourceId: 10, name: "Attentive", totalHealing: 50000, activityPercent: 92 })],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "kept-them-breathing");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Attentive", className: "Priest", sourceId: 10 }]);
    expect(award!.stat).toBe("92% healing uptime");
  });

  it("does not fire below 85% activity", () => {
    const overview = makeOverview({
      healerMetrics: [makeHealer({ sourceId: 10, name: "Distracted", totalHealing: 50000, activityPercent: 60 })],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "kept-them-breathing")).toBeUndefined();
  });
});

describe("computeAwards — punching-up", () => {
  it("fires for the lowest-ilvl non-healer keeping pace at or above the non-healer median throughput", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Geared", role: "Physical", avgItemLevel: 90, throughput: 1000 }),
        makePlayer({ sourceId: 2, name: "Underdog", role: "Caster", avgItemLevel: 60, throughput: 900 }),
        makePlayer({ sourceId: 3, name: "Mid", role: "Physical", avgItemLevel: 75, throughput: 500 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    const award = result.awards.find((a) => a.id === "punching-up");
    expect(award).toBeTruthy();
    expect(award!.winners).toEqual([{ name: "Underdog", className: "Warrior", sourceId: 2 }]);
    expect(award!.stat).toBe("ilvl 60 · 900 dps");
  });

  it("does not fire when the ilvl spread is below 10", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "A", avgItemLevel: 65, throughput: 1000 }),
        makePlayer({ sourceId: 2, name: "B", avgItemLevel: 60, throughput: 900 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "punching-up")).toBeUndefined();
  });

  it("does not fire when the lowest-ilvl player's throughput is below the non-healer median", () => {
    const overview = makeOverview({
      players: [
        makePlayer({ sourceId: 1, name: "Geared", role: "Physical", avgItemLevel: 90, throughput: 1000 }),
        makePlayer({ sourceId: 2, name: "Underdog", role: "Caster", avgItemLevel: 60, throughput: 50 }),
        makePlayer({ sourceId: 3, name: "Mid", role: "Physical", avgItemLevel: 75, throughput: 500 }),
      ],
    });
    const result = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(result.awards.find((a) => a.id === "punching-up")).toBeUndefined();
  });
});

describe("computeAwards — full fifteen-rule pool fires, capped at MAX_AWARDS_SHOWN", () => {
  it("fires every rule in AWARD_POOL on a fight built to trigger every condition, returning only the six lowest priorities", () => {
    const overview = makeOverview({
      fightDuration: 120_000,
      players: [
        makePlayer({
          sourceId: 1,
          name: "Ace",
          role: "Physical",
          throughput: 5000,
          deaths: 0,
          avoidableDamage: 200,
          activityPercent: 95,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 0,
          avgItemLevel: 80,
        }),
        makePlayer({
          sourceId: 2,
          name: "Bee",
          role: "Physical",
          throughput: 1200,
          deaths: 0,
          avoidableDamage: 150,
          activityPercent: 85,
          consumables: { flask: true, food: true, weaponEnhancement: false },
          missingEnchants: 4,
          avgItemLevel: 68,
        }),
        makePlayer({
          sourceId: 3,
          name: "Cee",
          className: "Mage",
          role: "Caster",
          throughput: 300,
          deaths: 3,
          avoidableDamage: 5000,
          activityPercent: 60,
          consumables: { flask: false, food: false, weaponEnhancement: true },
          missingEnchants: 0,
          avgItemLevel: 55,
        }),
        makePlayer({
          sourceId: 4,
          name: "Dee",
          role: "Tank",
          throughput: 800,
          deaths: 0,
          avoidableDamage: 300,
          activityPercent: 90,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 1,
          avgItemLevel: 70,
        }),
        makePlayer({
          sourceId: 5,
          name: "Newbie",
          role: "Caster",
          throughput: 900,
          deaths: 0,
          avoidableDamage: 100,
          activityPercent: 88,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 0,
          avgItemLevel: 40,
        }),
        makePlayer({
          sourceId: 6,
          name: "Holy",
          className: "Priest",
          role: "Healer",
          throughput: 700,
          deaths: 0,
          avoidableDamage: 50,
          activityPercent: 90,
          consumables: { flask: true, food: true, weaponEnhancement: true },
          missingEnchants: 0,
          avgItemLevel: 65,
        }),
      ],
      healerMetrics: [
        makeHealer({
          sourceId: 6,
          name: "Holy",
          className: "Priest",
          hps: 900,
          totalHealing: 200_000,
          overhealPercent: 55,
          activityPercent: 90,
        }),
      ],
      deathTimeline: [
        { playerName: "Cee", playerClass: "Mage", sourceId: 3, fightTimeMs: 10_000, damage: 0, healing: 0 },
        { playerName: "Cee", playerClass: "Mage", sourceId: 3, fightTimeMs: 30_000, damage: 0, healing: 0 },
        { playerName: "Cee", playerClass: "Mage", sourceId: 3, fightTimeMs: 50_000, damage: 0, healing: 0 },
      ],
    });

    // Prove every one of the fifteen rules actually fires against this fight
    // — not just the six that make the display cap — by calling each rule's
    // evaluate() directly, since computeAwards only exposes the capped
    // result.
    for (const rule of AWARD_POOL) {
      expect(rule.evaluate(overview, null), `expected ${rule.id} to fire`).toBeTruthy();
    }

    const result = computeAwards(overview, { name: "Test Boss", outcome: { kill: false, bossPercentage: 37 } });
    expect(result.awards).toHaveLength(MAX_AWARDS_SHOWN);
    expect(result.awards.map((a) => a.id)).toEqual([
      "first-to-die",
      "top-dps",
      "top-hps",
      "flaskless",
      "best-prepared",
      "graveyard-shift",
    ]);
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

// ─── Pool-wide invariants (D-01/D-02/D-04) ────────────────────────────
// These assert the contract of the fifteen-rule pool itself, not any one
// rule's behaviour — the guardrails that keep a future sixteenth rule safe
// to add without silently breaking the shape every consumer depends on.

describe("AWARD_POOL — pool-wide invariants", () => {
  it("has unique ids", () => {
    const ids = AWARD_POOL.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has the contiguous priority range 1 to 15 with no gaps or repeats", () => {
    const priorities = AWARD_POOL.map((r) => r.priority).slice().sort((a, b) => a - b);
    expect(priorities).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it("gives every rule a non-empty title and icon", () => {
    for (const rule of AWARD_POOL) {
      expect(rule.title.length, `${rule.id} title`).toBeGreaterThan(0);
      expect(rule.icon.length, `${rule.id} icon`).toBeGreaterThan(0);
    }
  });

  it("gives every rule one of the two allowed tones", () => {
    for (const rule of AWARD_POOL) {
      expect(["praise", "jab"], `${rule.id} tone`).toContain(rule.tone);
    }
  });

  it("fires no rule unconditionally — only an explicit allowlist fires on a minimal all-zero fight", () => {
    // One player, no deaths, all consumables true, no missing enchants, zero
    // healing — the emptiest fight computeAwards will still evaluate rules
    // against (fightDuration/players guards need a positive duration and a
    // non-empty roster).
    const minimal = makeOverview();

    // top-dps and best-prepared are the only rules whose trigger genuinely
    // holds on this input: a single non-healer with positive throughput is
    // trivially "top", and a single fully-consumed, fully-enchanted player is
    // trivially "best prepared". Every other rule's trigger requires a
    // condition this fixture does not create (a death, a missing consumable,
    // a second player to create a spread, etc.) — adding a rule that fires
    // here without adding it to this allowlist is a bug, not a feature.
    const permittedToFireOnMinimalFight = new Set(["top-dps", "best-prepared"]);

    for (const rule of AWARD_POOL) {
      const fired = rule.evaluate(minimal, null);
      if (permittedToFireOnMinimalFight.has(rule.id)) {
        expect(fired, `expected ${rule.id} to fire on the minimal fixture`).toBeTruthy();
      } else {
        expect(fired, `expected ${rule.id} NOT to fire on the minimal fixture`).toBeNull();
      }
    }
  });

  it("gives every fired row a non-empty stat and 1..MAX_WINNER_NAMES winners, across every fixture in this suite", () => {
    const fixtures: RaidOverviewResult[] = [
      realOverview(),
      makeOverview(),
      makeOverview({
        players: ["Amy", "Bob", "Cody", "Dee", "Eve"].map((name, i) =>
          makePlayer({
            sourceId: i + 1,
            name,
            consumables: { flask: false, food: true, weaponEnhancement: true },
          }),
        ),
      }),
      makeOverview({
        fightDuration: 120_000,
        players: [
          makePlayer({
            sourceId: 1,
            name: "Ace",
            role: "Physical",
            throughput: 5000,
            avoidableDamage: 200,
            activityPercent: 95,
            avgItemLevel: 80,
          }),
          makePlayer({
            sourceId: 2,
            name: "Bee",
            role: "Physical",
            throughput: 1200,
            avoidableDamage: 150,
            activityPercent: 85,
            consumables: { flask: true, food: true, weaponEnhancement: false },
            missingEnchants: 4,
            avgItemLevel: 68,
          }),
          makePlayer({
            sourceId: 3,
            name: "Cee",
            role: "Caster",
            throughput: 300,
            deaths: 3,
            avoidableDamage: 5000,
            activityPercent: 60,
            consumables: { flask: false, food: false, weaponEnhancement: true },
            avgItemLevel: 55,
          }),
          makePlayer({
            sourceId: 4,
            name: "Dee",
            role: "Tank",
            throughput: 800,
            avoidableDamage: 300,
            activityPercent: 90,
            missingEnchants: 1,
            avgItemLevel: 70,
          }),
          makePlayer({
            sourceId: 5,
            name: "Newbie",
            role: "Caster",
            throughput: 900,
            avoidableDamage: 100,
            activityPercent: 88,
            avgItemLevel: 40,
          }),
        ],
        healerMetrics: [
          makeHealer({
            sourceId: 6,
            name: "Holy",
            hps: 900,
            totalHealing: 200_000,
            overhealPercent: 55,
            activityPercent: 90,
          }),
        ],
        deathTimeline: [
          { playerName: "Cee", playerClass: "Mage", sourceId: 3, fightTimeMs: 10_000, damage: 0, healing: 0 },
        ],
      }),
    ];

    for (const overview of fixtures) {
      const result = computeAwards(overview, { name: "Test Boss", outcome: null });
      expect(result.awards.length).toBeLessThanOrEqual(MAX_AWARDS_SHOWN);
      for (const row of result.awards) {
        expect(row.stat.length, `${row.id} stat`).toBeGreaterThan(0);
        expect(row.winners.length, `${row.id} winners`).toBeGreaterThanOrEqual(1);
        expect(row.winners.length, `${row.id} winners`).toBeLessThanOrEqual(MAX_WINNER_NAMES);
      }
    }
  });

  it("sorts stably — computing awards twice on the same input returns identical id order", () => {
    const overview = realOverview();
    const first = computeAwards(overview, { name: "Test Boss", outcome: null });
    const second = computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(second.awards.map((a) => a.id)).toEqual(first.awards.map((a) => a.id));
  });

  it("does not mutate the RaidOverviewResult it is given", () => {
    const overview = realOverview();
    const snapshot = structuredClone(overview);
    computeAwards(overview, { name: "Test Boss", outcome: null });
    expect(overview).toEqual(snapshot);
  });
});
