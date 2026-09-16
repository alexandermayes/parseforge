import { describe, it, expect } from "vitest";
import {
  parseShareRef,
  buildReportShareUrl,
  buildPlayerShareUrl,
  buildAwardsShareUrl,
  buildAwardsOgPath,
} from "./share-links";

const ORIGIN = "https://parseforge.gg";

describe("buildReportShareUrl", () => {
  it("appends fight and ref=share", () => {
    expect(buildReportShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23 })).toBe(
      "https://parseforge.gg/analyze/ABC?fight=23&ref=share",
    );
  });

  it("omits fight when fightId is null but still carries ref=share", () => {
    expect(buildReportShareUrl(ORIGIN, { reportCode: "ABC", fightId: null })).toBe(
      "https://parseforge.gg/analyze/ABC?ref=share",
    );
  });

  it("never emits a tab param", () => {
    const url = buildReportShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23 });
    expect(url).not.toContain("tab=");
  });
});

describe("buildPlayerShareUrl", () => {
  it("appends fight, source and ref=parse — source always present", () => {
    expect(
      buildPlayerShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23, sourceId: 12 }),
    ).toBe("https://parseforge.gg/analyze/ABC?fight=23&source=12&ref=parse");
  });

  it("never emits a tab param", () => {
    const url = buildPlayerShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23, sourceId: 12 });
    expect(url).not.toContain("tab=");
  });
});

describe("buildAwardsShareUrl", () => {
  it("appends fight, view=awards and ref=awards", () => {
    expect(buildAwardsShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23 })).toBe(
      "https://parseforge.gg/analyze/ABC?fight=23&view=awards&ref=awards",
    );
  });

  it("never emits a tab param", () => {
    const url = buildAwardsShareUrl(ORIGIN, { reportCode: "ABC", fightId: 23 });
    expect(url).not.toContain("tab=");
  });
});

describe("buildAwardsOgPath", () => {
  it("returns the relative /og path with no ref", () => {
    expect(buildAwardsOgPath({ reportCode: "ABC", fightId: 23 })).toBe(
      "/og?report=ABC&fight=23&view=awards",
    );
  });

  it("never emits a tab param", () => {
    expect(buildAwardsOgPath({ reportCode: "ABC", fightId: 23 })).not.toContain("tab=");
  });
});

describe("parseShareRef", () => {
  it.each(["share", "parse", "awards"] as const)("returns %s for an exact match", (ref) => {
    expect(parseShareRef(ref)).toBe(ref);
  });

  it.each([
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["unknown word", "banana"],
    ["case variant", "Share"],
    ["a URL", "https://evil.example/x"],
    ["a script tag", "<script>alert(1)</script>"],
  ])("returns null for %s", (_label, value) => {
    expect(parseShareRef(value)).toBeNull();
  });
});
