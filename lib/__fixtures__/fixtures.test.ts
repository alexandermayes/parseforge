import { describe, it, expect } from "vitest";
import demoPlayerDps from "./demo-player-dps.json";
import demoPlayerHealer from "./demo-player-healer.json";
import demoRaidOverview from "./demo-raid-overview.json";
import demoRaidCombatantInfo from "./demo-raid-combatant-info.json";
import demoRaidDeathEvents from "./demo-raid-death-events.json";
import demoTimelineCasts from "./demo-timeline-casts.json";

// Shape guard over every fixture recorded by scripts/record-wcl-fixtures.mjs
// (02-01 Task 1). These assert the exact field names README.md documents
// against RESEARCH.md's A1-A5 assumptions — a re-recorded fixture whose shape
// changed fails loudly here instead of silently drifting from what the
// engines in lib/wcl-queries.ts and lib/wcl-types.ts assume.

// Recorded healer source id (Zulakeyah, Restoration Shaman) — see
// lib/__fixtures__/README.md "Provenance".
const HEALER_SOURCE_ID = 32;

describe("WCL fixtures shape guard", () => {
  it("Test 1: every recorded fixture parses as JSON and exposes a report object", () => {
    expect(demoPlayerDps.reportData.report).toBeTruthy();
    expect(demoPlayerHealer.reportData.report).toBeTruthy();
    expect(demoRaidOverview.reportData.report).toBeTruthy();
    expect(demoRaidCombatantInfo.reportData.report).toBeTruthy();
    expect(demoRaidDeathEvents.reportData.report).toBeTruthy();
    // demo-timeline-casts is the assembled probe result described in
    // README.md, not a verbatim WCL `data` payload — it has no `reportData`
    // wrapper, but still exposes the report-shaped fields the timeline reads.
    expect(demoTimelineCasts.pages).toBeInstanceOf(Array);
    expect(demoTimelineCasts.castsTable).toBeTruthy();
    expect(demoTimelineCasts.masterData).toBeTruthy();
  });

  it("Test 2: demo-raid-overview healing entries carry total and activeTime, and at least one carries overheal", () => {
    const entries = demoRaidOverview.reportData.report.healing.data.entries;
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(typeof entry.total).toBe("number");
      expect(typeof entry.activeTime).toBe("number");
    }
    expect(entries.some((entry) => typeof entry.overheal === "number")).toBe(
      true
    );
  });

  it("Test 3: demo-player-healer exposes a per-player healing row for the recorded healer source id", () => {
    const row = demoPlayerHealer.healingByPlayer.data.entries.find(
      (entry) => entry.id === HEALER_SOURCE_ID
    );
    expect(row).toBeTruthy();
    expect(row?.id).toBe(HEALER_SOURCE_ID);
    expect(typeof row?.total).toBe("number");
    expect(typeof row?.overheal).toBe("number");
    expect(typeof row?.activeTime).toBe("number");
  });

  it("Test 4: demo-timeline-casts pages[0].data is non-empty and every event carries the recorded field names", () => {
    const [firstPage] = demoTimelineCasts.pages;
    expect(firstPage.data.length).toBeGreaterThan(0);
    for (const event of firstPage.data) {
      expect(typeof event.abilityGameID).toBe("number");
      expect(typeof event.timestamp).toBe("number");
      expect(typeof event.sourceID).toBe("number");
      expect(typeof event.type).toBe("string");
    }
  });

  it("Test 5: demo-timeline-casts records an aggregated casts table whose entries resolve display names by guid", () => {
    const entries = demoTimelineCasts.castsTable.data.entries;
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(typeof entry.guid).toBe("number");
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.abilityIcon).toBe("string");
    }
  });

  it("Test 6: demo-raid-combatant-info and demo-raid-death-events expose the arrays buildRaidOverview reads", () => {
    expect(
      demoRaidCombatantInfo.reportData.report.combatantInfo.data
    ).toBeInstanceOf(Array);
    expect(
      demoRaidDeathEvents.reportData.report.deathEvents.data
    ).toBeInstanceOf(Array);
  });
});
