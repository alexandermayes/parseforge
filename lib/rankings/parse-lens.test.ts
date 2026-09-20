import { describe, it, expect } from "vitest";
import rankingsReportFixture from "../__fixtures__/rankings-report.json";
import type { ReportRankingsBlob } from "../wcl-types";
import { toParseRows, toFightBadges, visibleParseRows } from "./parse-lens";

// Fixture-driven: every assertion below reads field names from the real
// recorded response in lib/__fixtures__/rankings-report.json (04-02), never
// from PARSEFORGE-RANKINGS-SPEC.md alone (04-RESEARCH.md Pitfall 1). `hidden`
// and a non-empty character blacklist are absent from that recording
// (README.md), so those two behaviors are exercised against a structurally
// cloned, minimally mutated copy of a real recorded character — never an
// invented field name.

const blob = rankingsReportFixture.reportData.report.rankings as unknown as ReportRankingsBlob;

function countFixtureCharacters(): number {
  const entry = blob.data[0];
  return (
    entry.roles.tanks.characters.length +
    entry.roles.healers.characters.length +
    entry.roles.dps.characters.length
  );
}

describe("toParseRows", () => {
  it("Test 1: returns one row per character across all three role groups", () => {
    const rows = toParseRows(blob);
    expect(rows.length).toBe(countFixtureCharacters());
  });

  it("Test 2: each row carries recorded fields exactly, none computed", () => {
    const rows = toParseRows(blob);
    const raw = blob.data[0].roles.tanks.characters[0];
    const row = rows.find((r) => r.id === raw.id);
    expect(row).toBeTruthy();
    expect(row?.name).toBe(raw.name);
    expect(row?.serverName).toBe(raw.server.name);
    expect(row?.region).toBe(raw.server.region);
    expect(row?.className).toBe(raw.class);
    expect(row?.spec).toBe(raw.spec);
    expect(row?.role).toBe("tank");
    expect(row?.amount).toBe(raw.amount);
    expect(row?.rankPercent).toBe(raw.rankPercent);
  });

  it("Test 3: rankPercent is preserved as null when the recording has no value for it, never coerced to 0", () => {
    const clone = structuredClone(blob);
    clone.data[0].roles.dps.characters[0].rankPercent = null;
    const rows = toParseRows(clone);
    const row = rows.find((r) => r.id === clone.data[0].roles.dps.characters[0].id);
    expect(row?.rankPercent).toBeNull();
  });

  it("Test 4: a character marked hidden is returned with hidden: true, and excluded from the visible ranking", () => {
    const clone = structuredClone(blob);
    const target = clone.data[0].roles.healers.characters[0];
    (target as { hidden?: boolean }).hidden = true;
    const rows = toParseRows(clone);
    const row = rows.find((r) => r.id === target.id);
    expect(row?.hidden).toBe(true);
    const visible = visibleParseRows(rows);
    expect(visible.some((r) => r.id === target.id)).toBe(false);
    // present in the data, absent from the ranking
    expect(rows.some((r) => r.id === target.id)).toBe(true);
  });

  it("Test 5: a character id in the entry's blacklist is returned with a blacklisted marker, excluded from the visible ranking", () => {
    const clone = structuredClone(blob);
    const target = clone.data[0].roles.dps.characters[1];
    clone.data[0].reportsBlacklistForCharacters = [target.id];
    const rows = toParseRows(clone);
    const row = rows.find((r) => r.id === target.id);
    expect(row?.blacklisted).toBe(true);
    const visible = visibleParseRows(rows);
    expect(visible.some((r) => r.id === target.id)).toBe(false);
    expect(rows.some((r) => r.id === target.id)).toBe(true);
  });

  it("Test 6: the lens is pure — calling it twice returns equal output and never mutates its argument", () => {
    const before = structuredClone(blob);
    const first = toParseRows(blob);
    const second = toParseRows(blob);
    expect(second).toEqual(first);
    expect(blob).toEqual(before);
  });

  it("Test 7: an empty data array returns an empty row list, never throws", () => {
    expect(() => toParseRows({ data: [] })).not.toThrow();
    expect(toParseRows({ data: [] })).toEqual([]);
  });

  it("Test 8: an entry missing the roles object entirely returns an empty row list, never throws", () => {
    const malformed = { data: [{ ...blob.data[0], roles: undefined }] } as unknown as ReportRankingsBlob;
    expect(() => toParseRows(malformed)).not.toThrow();
    expect(toParseRows(malformed)).toEqual([]);
  });

  it("Test 9: a role group present with an empty characters array contributes zero rows without error", () => {
    const clone = structuredClone(blob);
    clone.data[0].roles.tanks.characters = [];
    expect(() => toParseRows(clone)).not.toThrow();
    const rows = toParseRows(clone);
    expect(rows.some((r) => r.role === "tank")).toBe(false);
    expect(rows.length).toBe(
      clone.data[0].roles.healers.characters.length + clone.data[0].roles.dps.characters.length
    );
  });

  it("Test 10: never invents a bracket percentile — exposes only the recorded bracket/bracketData fields", () => {
    const rows = toParseRows(blob);
    for (const row of rows) {
      const keys = Object.keys(row);
      expect(keys.some((k) => /bracketpercent/i.test(k))).toBe(false);
      expect(row).toHaveProperty("bracket");
      expect(row).toHaveProperty("bracketData");
    }
  });
});

describe("toFightBadges", () => {
  it("Test 11: returns the fight's kill flag, duration, death count, and speed/execution rankPercent values, all read from the recording", () => {
    const badges = toFightBadges(blob);
    const entry = blob.data[0];
    expect(badges).not.toBeNull();
    expect(badges?.kill).toBe(Boolean(entry.kill));
    expect(badges?.duration).toBe(entry.duration);
    expect(badges?.deaths).toBe(entry.deaths);
    expect(badges?.speedRankPercent).toBe(entry.speed.rankPercent);
    expect(badges?.executionRankPercent).toBe(entry.execution.rankPercent);
  });

  it("Test 12: an empty data array returns a null badge object, never throws", () => {
    expect(() => toFightBadges({ data: [] })).not.toThrow();
    expect(toFightBadges({ data: [] })).toBeNull();
  });
});

describe("visibleParseRows", () => {
  it("Test 13: sorts by rankPercent descending with a stable tiebreak on name", () => {
    const rows = toParseRows(blob);
    const visible = visibleParseRows(rows);
    for (let i = 1; i < visible.length; i++) {
      const prev = visible[i - 1].rankPercent ?? -Infinity;
      const curr = visible[i].rankPercent ?? -Infinity;
      if (prev === curr) {
        expect(visible[i - 1].name.localeCompare(visible[i].name)).toBeLessThanOrEqual(0);
      } else {
        expect(prev).toBeGreaterThan(curr);
      }
    }
  });
});
