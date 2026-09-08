import { describe, it, expect } from "vitest";
import { buildRaidOverview } from "./raid-overview-engine";
import type { DeathEvent } from "./raid-overview-engine";
import { computeHealerMetrics } from "./healer-metrics";
import { ROLE_SORT_ORDER } from "./constants";
import type { HealerTableRow, WCLCombatantInfoEvent, WCLPlayerDetails } from "./wcl-types";
import demoRaidOverview from "./__fixtures__/demo-raid-overview.json";
import demoRaidCombatantInfo from "./__fixtures__/demo-raid-combatant-info.json";
import demoRaidDeathEvents from "./__fixtures__/demo-raid-death-events.json";

// Driven by the recorded fixtures from plan 02-01: demo-raid-overview.json
// (playerDetails, damage/healing/deaths/damageTaken tables, fight bounds),
// demo-raid-combatant-info.json (real per-player gear/auras) and
// demo-raid-death-events.json — report ZjKgNYxVcAqR8pGJ, fight 23 ("The
// Lurker Below"). Fight 23 genuinely has zero deaths (README.md), so the
// death-timeline behaviours below layer small synthetic DeathEvent/death-table
// inputs on top of the fixture's own real player source ids — see each
// describe block's comment.

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

function baseInput() {
  return {
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
  };
}

describe("buildRaidOverview — healer metrics agreement", () => {
  it("agrees with computeHealerMetrics for the same recorded row and fight duration (D-08)", () => {
    const overview = buildRaidOverview(baseInput());
    const entry = overview.healerMetrics.find((h) => h.sourceId === 32);
    expect(entry).toBeTruthy();

    const row = report.healing.data.entries.find(
      (e: HealerTableRow) => e.id === 32,
    ) as HealerTableRow;
    const expected = computeHealerMetrics(row, FIGHT_DURATION_MS);
    expect(entry!.hps).toBe(expected.effectiveHps);
    expect(entry!.overhealPercent).toBe(expected.overhealPercent);
    expect(entry!.activityPercent).toBe(expected.activityPercent);
  });
});

describe("buildRaidOverview — sort order", () => {
  it("sorts every real player by role order, then throughput descending within each role", () => {
    const overview = buildRaidOverview(baseInput());
    expect(overview.players.length).toBeGreaterThan(0);
    for (let i = 1; i < overview.players.length; i++) {
      const prev = overview.players[i - 1];
      const cur = overview.players[i];
      const prevOrder = ROLE_SORT_ORDER[prev.role];
      const curOrder = ROLE_SORT_ORDER[cur.role];
      expect(curOrder).toBeGreaterThanOrEqual(prevOrder);
      if (curOrder === prevOrder) {
        expect(cur.throughput).toBeLessThanOrEqual(prev.throughput);
      }
    }
  });
});

describe("buildRaidOverview — death timeline (synthetic events over real player ids)", () => {
  // Fight 23 has zero recorded deaths (see file header) — timing and
  // exclusion cannot be exercised against real death data. "Which player
  // died" still uses real source ids already present in the fixture's own
  // playerDetails; only the death timing itself is synthetic.
  const realSourceIds = PLAYER_DETAILS.map((p) => p.id);
  const [idA, idB, idC] = realSourceIds;

  it("orders the timeline ascending by fight time and derives fightTimeMs from timestamp minus fight start", () => {
    const events: DeathEvent[] = [
      { timestamp: FIGHT.startTime + 50_000, type: "death", sourceID: idB },
      { timestamp: FIGHT.startTime + 10_000, type: "death", sourceID: idA },
      { timestamp: FIGHT.startTime + 90_000, type: "death", sourceID: idC },
    ];
    const overview = buildRaidOverview({ ...baseInput(), deathEvents: events });
    expect(overview.deathTimeline.map((d) => d.sourceId)).toEqual([idA, idB, idC]);
    expect(overview.deathTimeline[0].fightTimeMs).toBe(10_000);
    expect(overview.deathTimeline[1].fightTimeMs).toBe(50_000);
    expect(overview.deathTimeline[2].fightTimeMs).toBe(90_000);
  });

  it("excludes a death event whose source is not a player in playerDetails", () => {
    const nonPlayerSourceId = 999999;
    expect(realSourceIds).not.toContain(nonPlayerSourceId);
    const events: DeathEvent[] = [
      { timestamp: FIGHT.startTime + 10_000, type: "death", sourceID: idA },
      { timestamp: FIGHT.startTime + 20_000, type: "death", sourceID: nonPlayerSourceId },
    ];
    const overview = buildRaidOverview({ ...baseInput(), deathEvents: events });
    expect(overview.deathTimeline).toHaveLength(1);
    expect(overview.deathTimeline[0].sourceId).toBe(idA);
  });

  it("falls back to the death-table entries with a zero fight time per entry when death events are absent", () => {
    const deathEntries = [
      {
        id: idA,
        name: "PlayerA",
        type: "Warrior",
        icon: "",
        deathTime: 12345,
        damage: { total: 500 },
        healing: { total: 0 },
      },
      {
        id: idB,
        name: "PlayerB",
        type: "Priest",
        icon: "",
        deathTime: 54321,
        damage: { total: 0 },
        healing: { total: 100 },
      },
    ];
    const overview = buildRaidOverview({ ...baseInput(), deathEntries, deathEvents: [] });
    expect(overview.deathTimeline).toHaveLength(2);
    expect(overview.deathTimeline.every((d) => d.fightTimeMs === 0)).toBe(true);
    expect(overview.deathTimeline.map((d) => d.sourceId).sort()).toEqual(
      [idA, idB].sort(),
    );
  });
});

describe("buildRaidOverview snapshot", () => {
  it("matches the full recorded-fixture output", () => {
    const overview = buildRaidOverview(baseInput());
    expect(overview).toMatchSnapshot();
  });
});
