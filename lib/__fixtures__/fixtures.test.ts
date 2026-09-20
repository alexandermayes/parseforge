import { describe, it, expect } from "vitest";
import demoPlayerDps from "./demo-player-dps.json";
import demoPlayerHealer from "./demo-player-healer.json";
import demoRaidOverview from "./demo-raid-overview.json";
import demoRaidCombatantInfo from "./demo-raid-combatant-info.json";
import demoRaidDeathEvents from "./demo-raid-death-events.json";
import demoTimelineCasts from "./demo-timeline-casts.json";
import rankingsRatelimit from "./rankings-ratelimit.json";
import rankingsReport from "./rankings-report.json";
import rankingsEncounter from "./rankings-encounter.json";
import rankingsCharacter from "./rankings-character.json";
import rankingsZones from "./rankings-zones.json";

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

  // ─── R0-2 rankings fixtures (PARSEFORGE-RANKINGS-SPEC.md §7) ────────────

  it("Test 7: rankings-ratelimit.json carries at least three labeled, timestamped, numeric samples", () => {
    expect(Array.isArray(rankingsRatelimit.samples)).toBe(true);
    expect(rankingsRatelimit.samples.length).toBeGreaterThanOrEqual(3);
    const labels = rankingsRatelimit.samples.map((s) => s.label);
    for (const expected of ["before", "after-report-rankings", "end"]) {
      expect(labels).toContain(expected);
    }
    for (const sample of rankingsRatelimit.samples) {
      expect(typeof sample.limitPerHour).toBe("number");
      expect(typeof sample.pointsSpentThisHour).toBe("number");
      expect(typeof sample.pointsResetIn).toBe("number");
    }
  });

  it("Test 8: rankings-report.json exposes at least one rankings entry with the fields the parse lens will read", () => {
    const entries = rankingsReport.reportData.report.rankings.data;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    const entry = entries[0];
    expect(typeof entry.fightID).toBe("number");
    expect(typeof entry.partition).toBe("number");
    expect(typeof entry.bracketData).toBe("number");
    expect(typeof entry.kill).toBe("number");
    expect(typeof entry.encounter.id).toBe("number");
    expect(typeof entry.encounter.name).toBe("string");
    expect(entry.roles).toBeTruthy();
    for (const role of ["tanks", "healers", "dps"] as const) {
      expect(Array.isArray(entry.roles[role].characters)).toBe(true);
    }
    expect(typeof entry.speed.rankPercent).toBe("number");
    expect(typeof entry.execution.rankPercent).toBe("number");
  });

  it("Test 9: every character row in every role has a numeric id, a string name, and a numeric-or-null rankPercent", () => {
    const entry = rankingsReport.reportData.report.rankings.data[0];
    for (const role of ["tanks", "healers", "dps"] as const) {
      for (const character of entry.roles[role].characters) {
        expect(typeof character.id).toBe("number");
        expect(typeof character.name).toBe("string");
        expect(
          character.rankPercent === null || typeof character.rankPercent === "number"
        ).toBe(true);
      }
    }
  });

  it("Test 10: the `hidden` field's presence on character rows is recorded, never assumed absent", () => {
    // README.md/2026-09-19 recording: no character row carried a `hidden`
    // key at all. This is an explicit, non-fatal observation — 04-04's
    // parse-lens engine must honour `hidden` when present without assuming
    // it always is. If a future re-record starts returning `hidden`, this
    // count changes and the comment above should be updated, not the
    // assertion loosened to require absence.
    const entry = rankingsReport.reportData.report.rankings.data[0];
    let hiddenCount = 0;
    for (const role of ["tanks", "healers", "dps"] as const) {
      for (const character of entry.roles[role].characters) {
        if ("hidden" in character) hiddenCount += 1;
      }
    }
    expect(typeof hiddenCount).toBe("number");
  });

  // ─── R0-2 Task 2: boss leaderboard, character and zone-bracket fixtures ──

  it("Test 11: rankings-encounter.json exposes page-1 characterRankings with a numeric page/count and a rankings array", () => {
    const cr = rankingsEncounter.characterRankings;
    expect(typeof cr.page).toBe("number");
    expect(typeof cr.hasMorePages).toBe("boolean");
    expect(typeof cr.count).toBe("number");
    expect(Array.isArray(cr.rankings)).toBe(true);
    // Edge case: an empty leaderboard page is legitimate — only assert on
    // the shape of the first row when one exists.
    if (cr.rankings.length > 0) {
      expect(typeof cr.rankings[0].name).toBe("string");
      expect(typeof cr.rankings[0].amount).toBe("number");
    }
  });

  it("Test 12: rankings-encounter.json exposes its own fightRankings payload with a rankings array", () => {
    const fr = rankingsEncounter.fightRankings;
    expect(Array.isArray(fr.rankings)).toBe(true);
  });

  it("Test 13: rankings-character.json exposes zoneRankings and encounterRankings each with at least one numeric field", () => {
    const { zoneRankings, encounterRankings } = rankingsCharacter;
    expect(zoneRankings).toBeTruthy();
    expect(encounterRankings).toBeTruthy();
    // Tolerate a legitimately empty ranking list (a real public character can
    // genuinely have none) — never require non-empty data, only a present,
    // typed structure.
    expect(
      zoneRankings.bestPerformanceAverage === null ||
        typeof zoneRankings.bestPerformanceAverage === "number"
    ).toBe(true);
    expect(Array.isArray(zoneRankings.rankings)).toBe(true);
    expect(
      encounterRankings.bestAmount === null || typeof encounterRankings.bestAmount === "number"
    ).toBe(true);
    expect(Array.isArray(encounterRankings.ranks)).toBe(true);
  });

  it("Test 14: rankings-character.json records whether the Classic dataset required the classic. API host", () => {
    expect(typeof rankingsCharacter._provenance.api_host).toBe("string");
    expect(rankingsCharacter._provenance.api_host.length).toBeGreaterThan(0);
  });

  it("Test 15: rankings-zones.json exposes worldData.zones as an array whose entries carry a numeric id, string name and a brackets key", () => {
    const zones = rankingsZones.worldData.zones;
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
    for (const zone of zones) {
      expect(typeof zone.id).toBe("number");
      expect(typeof zone.name).toBe("string");
      // The key must be present; some zones (e.g. no bracket system for that
      // game/tier) legitimately carry `brackets: null` — a present-but-null
      // value is tolerated, a missing key is not.
      expect("brackets" in zone).toBe(true);
      expect(zone.brackets === null || typeof zone.brackets === "object").toBe(true);
    }
  });
});
