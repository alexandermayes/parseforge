import { describe, it, expect } from "vitest";
import { buildCastTimeline, TimelineEngineInput, TimelineDeathEvent } from "./timeline-engine";
import type { WCLCastEvent, WCLCastEntry } from "./wcl-types";
import { isJunkSpell } from "./analysis-engine";
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

// Independently mirrors buildCastTimeline's survivor-selection + median-gap
// math (not imported from the engine) so Test 1 below proves the engine's
// idleThresholdMs against an isolated re-derivation, not against itself.
function computeExpectedIdleThreshold(
  events: WCLCastEvent[],
  castTable: WCLCastEntry[]
): number {
  const byGuid = new Map(castTable.map((e) => [e.guid, e]));
  const survivors = events
    .filter((e) => e.type === "cast")
    .filter((e) => {
      const entry = byGuid.get(e.abilityGameID);
      return entry != null && !isJunkSpell(entry);
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  if (survivors.length < 2) return 2000;
  const gaps: number[] = [];
  for (let i = 1; i < survivors.length; i++) {
    gaps.push(survivors[i].timestamp - survivors[i - 1].timestamp);
  }
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 === 0 ? (gaps[mid - 1] + gaps[mid]) / 2 : gaps[mid];
  return Math.max(2000, Math.round(3 * median));
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

  it("gives every cast row a non-empty abilityName", () => {
    // Scoped to kind === "cast" — idle/death rows are structural markers
    // introduced by 02-05 and, by design, carry no abilityName.
    const result = buildCastTimeline(buildInput());
    for (const row of result.rows.filter((r) => r.kind === "cast")) {
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

// ─── Idle gaps and death marker (02-05) ───────────────────────────────
//
// Test 1 is driven by the real fixture (steady-state threshold derivation);
// Tests 2-9 use small synthetic sequences with a deliberately spaced ability
// so a specific gap/threshold interaction can be asserted deterministically
// — the real fixture's cadence cannot be relied on to contain a given gap.

const MIN_ABILITY: WCLCastEntry = {
  name: "Minimal Ability",
  guid: 99010,
  type: 0,
  abilityIcon: "ability_test3.jpg",
  total: 1,
};

function makeCastEvent(timestamp: number): WCLCastEvent {
  return {
    timestamp,
    type: "cast",
    sourceID: SOURCE_ID,
    targetID: 999,
    abilityGameID: MIN_ABILITY.guid,
  };
}

function buildMinimalInput(overrides: Partial<TimelineEngineInput> = {}): TimelineEngineInput {
  return {
    castEvents: [],
    castTable: [MIN_ABILITY],
    actors: recordedActors,
    fight: { name: "Synthetic Fight", startTime: 0, endTime: 100_000 },
    playerName: PLAYER_NAME,
    sourceId: SOURCE_ID,
    truncated: false,
    ...overrides,
  };
}

describe("buildCastTimeline — idle gaps and death marker", () => {
  it("Test 1: derives idleThresholdMs as max(2000, 3x median inter-cast gap) for the recorded fixture", () => {
    const input = buildInput();
    const result = buildCastTimeline(input);
    const expected = computeExpectedIdleThreshold(input.castEvents, input.castTable);
    expect(result.idleThresholdMs).toBeGreaterThanOrEqual(2000);
    expect(result.idleThresholdMs).toBe(expected);
  });

  it("Test 2: a steady 1500ms cadence produces zero idle rows", () => {
    const events = Array.from({ length: 10 }, (_, i) => makeCastEvent(i * 1500));
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events }));
    expect(result.rows.filter((r) => r.kind === "idle")).toHaveLength(0);
  });

  it("Test 3: one large gap produces exactly one idle row positioned between its bracketing casts", () => {
    const events = [makeCastEvent(0), makeCastEvent(1500), makeCastEvent(13_500), makeCastEvent(15_000)];
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events }));
    const idleRows = result.rows.filter((r) => r.kind === "idle");
    expect(idleRows).toHaveLength(1);
    expect(idleRows[0].idleMs).toBe(12_000);
    const idleIndex = result.rows.findIndex((r) => r.kind === "idle");
    expect(result.rows[idleIndex - 1].fightTimeMs).toBe(1500);
    expect(result.rows[idleIndex + 1].fightTimeMs).toBe(13_500);
  });

  it("Test 4: a death event produces exactly one death row at timestamp minus fight start", () => {
    const events = [makeCastEvent(0), makeCastEvent(2000)];
    const deathEvents: TimelineDeathEvent[] = [{ timestamp: 5000, sourceID: SOURCE_ID }];
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events, deathEvents }));
    const deathRows = result.rows.filter((r) => r.kind === "death");
    expect(deathRows).toHaveLength(1);
    expect(deathRows[0].fightTimeMs).toBe(5000);
  });

  it("Test 5: the death row sorts into chronological position among cast rows, not appended at the end", () => {
    const events = [0, 2000, 4000, 6000, 8000].map(makeCastEvent);
    const deathEvents: TimelineDeathEvent[] = [{ timestamp: 5000, sourceID: SOURCE_ID }];
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events, deathEvents }));
    const deathIndex = result.rows.findIndex((r) => r.kind === "death");
    expect(deathIndex).toBeGreaterThan(0);
    expect(deathIndex).toBeLessThan(result.rows.length - 1);
    expect(result.rows[deathIndex - 1].fightTimeMs).toBeLessThan(5000);
    expect(result.rows[deathIndex + 1].fightTimeMs).toBeGreaterThan(5000);
  });

  it("Test 6: two death events for the same player still yield at most one death row", () => {
    const events = [makeCastEvent(0), makeCastEvent(2000), makeCastEvent(4000)];
    const deathEvents: TimelineDeathEvent[] = [
      { timestamp: 3000, sourceID: SOURCE_ID },
      { timestamp: 3500, sourceID: SOURCE_ID },
    ];
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events, deathEvents }));
    const deathRows = result.rows.filter((r) => r.kind === "death");
    expect(deathRows).toHaveLength(1);
    expect(deathRows[0].fightTimeMs).toBe(3000);
  });

  it("Test 7: a single-cast input produces one cast row and zero idle rows", () => {
    const result = buildCastTimeline(buildMinimalInput({ castEvents: [makeCastEvent(1000)] }));
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].kind).toBe("cast");
    expect(result.castCount).toBe(1);
  });

  it("Test 8: an empty cast input produces zero rows, castCount zero and empty abilityCounts", () => {
    const result = buildCastTimeline(buildMinimalInput({ castEvents: [] }));
    expect(result.rows).toHaveLength(0);
    expect(result.castCount).toBe(0);
    expect(result.abilityCounts).toHaveLength(0);
  });

  it("Test 9: castCount counts only cast rows, not idle or death rows", () => {
    const events = [makeCastEvent(0), makeCastEvent(1500), makeCastEvent(13_500), makeCastEvent(15_000)];
    const deathEvents: TimelineDeathEvent[] = [{ timestamp: 20_000, sourceID: SOURCE_ID }];
    const result = buildCastTimeline(buildMinimalInput({ castEvents: events, deathEvents }));
    // 4 casts + 1 idle row (the 12s gap from Test 3) + 1 death row = 6 total.
    expect(result.castCount).toBe(4);
    expect(result.rows.length).toBeGreaterThan(result.castCount);
  });
});
