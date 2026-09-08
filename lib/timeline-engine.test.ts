import { describe, it, expect } from "vitest";
import { buildCastTimeline, TimelineEngineInput } from "./timeline-engine";
import type { WCLCastEvent, WCLCastEntry } from "./wcl-types";
import demoTimelineCasts from "./__fixtures__/demo-timeline-casts.json";

// Driven entirely by lib/__fixtures__/demo-timeline-casts.json — the real
// recorded pages, casts table and actor list for the public demo report
// (fight 23, source 12 / Samkin). See __fixtures__/README.md for provenance.

const SOURCE_ID = 12; // Samkin, Hunter — the fixture's DPS source
const PLAYER_NAME = "Samkin";

const recordedEvents = demoTimelineCasts.pages[0].data as unknown as WCLCastEvent[];
const recordedCastTable = demoTimelineCasts.castsTable.data
  .entries as unknown as WCLCastEntry[];
const recordedActors = demoTimelineCasts.masterData.actors;

// First real "cast" (not "begincast") event, used to prove timestamps are
// fight-relative rather than report-relative.
const firstCastEvent = [...recordedEvents]
  .filter((e) => e.type === "cast")
  .sort((a, b) => a.timestamp - b.timestamp)[0];

// Fight bounds are not part of this probe fixture (they come from the real
// TIMELINE_CASTS_QUERY's `fights` field in production) — synthesize bounds
// close to the recorded events, five seconds before the first real cast, so
// the fixture proves fight-relative math without depending on wall-clock
// report offsets that aren't recorded here.
const FIGHT_START = firstCastEvent.timestamp - 5000;
const FIGHT_END = recordedEvents[recordedEvents.length - 1].timestamp + 5000;

// Synthetic events layered on top of the real recording to exercise cases
// the real fight may or may not happen to contain: a junk spell, a self-cast,
// and a no-target cast (WCL's -1 sentinel).
const JUNK_ENTRY: WCLCastEntry = {
  name: "Word of Recall (OLD)",
  guid: 1, // JUNK_SPELL_IDS
  type: 0,
  abilityIcon: "spell_arcane_portaldalaran.jpg",
  total: 1,
};
const SELF_CAST_ENTRY: WCLCastEntry = {
  name: "Test Self Buff",
  guid: 99001,
  type: 0,
  abilityIcon: "ability_test.jpg",
  total: 1,
};
const NO_TARGET_ENTRY: WCLCastEntry = {
  name: "Test No Target",
  guid: 99002,
  type: 0,
  abilityIcon: "ability_test2.jpg",
  total: 1,
};

const syntheticJunkEvent: WCLCastEvent = {
  timestamp: FIGHT_START + 1000,
  type: "cast",
  sourceID: SOURCE_ID,
  targetID: 110,
  abilityGameID: JUNK_ENTRY.guid,
};
const syntheticSelfEvent: WCLCastEvent = {
  timestamp: FIGHT_START + 2000,
  type: "cast",
  sourceID: SOURCE_ID,
  targetID: SOURCE_ID,
  abilityGameID: SELF_CAST_ENTRY.guid,
};
const syntheticNoTargetEvent: WCLCastEvent = {
  timestamp: FIGHT_START + 3000,
  type: "cast",
  sourceID: SOURCE_ID,
  targetID: -1,
  abilityGameID: NO_TARGET_ENTRY.guid,
};

function buildInput(): TimelineEngineInput {
  return {
    castEvents: [
      ...recordedEvents,
      syntheticJunkEvent,
      syntheticSelfEvent,
      syntheticNoTargetEvent,
    ],
    castTable: [...recordedCastTable, JUNK_ENTRY, SELF_CAST_ENTRY, NO_TARGET_ENTRY],
    actors: recordedActors,
    fight: { name: "The Lurker Below", startTime: FIGHT_START, endTime: FIGHT_END },
    playerName: PLAYER_NAME,
    sourceId: SOURCE_ID,
    truncated: demoTimelineCasts.truncatedByCap,
  };
}

describe("buildCastTimeline", () => {
  it("returns rows in ascending fightTimeMs order", () => {
    const result = buildCastTimeline(buildInput());
    expect(result.rows.length).toBeGreaterThan(0);
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].fightTimeMs).toBeGreaterThanOrEqual(
        result.rows[i - 1].fightTimeMs
      );
    }
  });

  it("computes the first row's fightTimeMs as fight-relative, not report-relative", () => {
    const result = buildCastTimeline(buildInput());
    // The synthetic junk/self/no-target events sit at FIGHT_START+1000/2000/3000
    // and are excluded (junk) or resolve fine, but the earliest surviving
    // real row is the recorded first cast, five seconds after FIGHT_START.
    const firstRealRow = result.rows.find(
      (r) => r.abilityGameID === firstCastEvent.abilityGameID
    );
    expect(firstRealRow).toBeTruthy();
    expect(firstRealRow!.fightTimeMs).toBeLessThan(10_000);
    expect(firstRealRow!.fightTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("gives every row a non-empty abilityName", () => {
    const result = buildCastTimeline(buildInput());
    for (const row of result.rows) {
      expect(typeof row.abilityName).toBe("string");
      expect(row.abilityName!.length).toBeGreaterThan(0);
    }
  });

  it("excludes a synthetic event whose ability resolves to a junk entry", () => {
    const result = buildCastTimeline(buildInput());
    expect(result.rows.some((r) => r.abilityGameID === JUNK_ENTRY.guid)).toBe(false);
  });

  it("resolves a target id equal to sourceId as the literal name Self", () => {
    const result = buildCastTimeline(buildInput());
    const selfRow = result.rows.find((r) => r.abilityGameID === SELF_CAST_ENTRY.guid);
    expect(selfRow).toBeTruthy();
    expect(selfRow!.targetName).toBe("Self");
  });

  it("produces an undefined targetName (not a dropped row) for an event with no target", () => {
    const result = buildCastTimeline(buildInput());
    const noTargetRow = result.rows.find(
      (r) => r.abilityGameID === NO_TARGET_ENTRY.guid
    );
    expect(noTargetRow).toBeTruthy();
    expect(noTargetRow!.targetName).toBeUndefined();
  });

  it("abilityCounts sums to castCount", () => {
    const result = buildCastTimeline(buildInput());
    const sum = result.abilityCounts.reduce((acc, a) => acc + (a.count ?? 0), 0);
    expect(sum).toBe(result.castCount);
  });

  it("orders abilityCounts by descending count", () => {
    const result = buildCastTimeline(buildInput());
    for (let i = 1; i < result.abilityCounts.length; i++) {
      expect(result.abilityCounts[i].count ?? 0).toBeLessThanOrEqual(
        result.abilityCounts[i - 1].count ?? 0
      );
    }
  });
});
