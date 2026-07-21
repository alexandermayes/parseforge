import { describe, it, expect } from "vitest";
import { parseWCLUrl, buildWCLUrl } from "./url-parser";

const CODE = "aBcD1234EfGh5678"; // 16 chars, valid

describe("parseWCLUrl", () => {
  it("parses a bare report code", () => {
    expect(parseWCLUrl(CODE)).toEqual({ code: CODE });
  });

  it("parses hash-style fight/source", () => {
    expect(
      parseWCLUrl(`https://classic.warcraftlogs.com/reports/${CODE}#fight=5&source=12`),
    ).toEqual({ code: CODE, fightId: 5, sourceId: 12 });
  });

  it("parses query-style fight/source", () => {
    expect(
      parseWCLUrl(`https://www.warcraftlogs.com/reports/${CODE}?fight=5&source=12`),
    ).toEqual({ code: CODE, fightId: 5, sourceId: 12 });
  });

  it("parses a URL with no params", () => {
    expect(parseWCLUrl(`https://www.warcraftlogs.com/reports/${CODE}`)).toEqual({ code: CODE });
  });

  it("parses a scheme-less URL", () => {
    expect(parseWCLUrl(`classic.warcraftlogs.com/reports/${CODE}`)).toEqual({ code: CODE });
  });

  it("ignores fight=last (no reliable numeric id) but keeps source", () => {
    expect(
      parseWCLUrl(`https://classic.warcraftlogs.com/reports/${CODE}#fight=last&source=3`),
    ).toEqual({ code: CODE, sourceId: 3 });
  });

  it("extracts a report URL embedded in surrounding text", () => {
    expect(
      parseWCLUrl(`check this out https://classic.warcraftlogs.com/reports/${CODE}#fight=2&source=7 gg`),
    ).toEqual({ code: CODE, fightId: 2, sourceId: 7 });
  });

  it("returns null for junk / non-report input", () => {
    expect(parseWCLUrl("not a url")).toBeNull();
    expect(parseWCLUrl("")).toBeNull();
    expect(parseWCLUrl("short")).toBeNull();
    expect(parseWCLUrl("https://example.com/foo")).toBeNull();
  });
});

describe("buildWCLUrl", () => {
  it("builds a bare report URL", () => {
    expect(buildWCLUrl(CODE)).toBe(`https://classic.warcraftlogs.com/reports/${CODE}`);
  });

  it("appends fight and source as a hash", () => {
    expect(buildWCLUrl(CODE, 5, 12)).toBe(
      `https://classic.warcraftlogs.com/reports/${CODE}#fight=5&source=12`,
    );
  });

  it("appends only fight when source is absent", () => {
    expect(buildWCLUrl(CODE, 5)).toBe(`https://classic.warcraftlogs.com/reports/${CODE}#fight=5`);
  });
});
