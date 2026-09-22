import { describe, it, expect } from "vitest";
import { CONSENT_REGIONS, isConsentRegionCode } from "./geo";

describe("CONSENT_REGIONS", () => {
  it("has exactly 32 members (EU-27 + IS, LI, NO + GB + CH)", () => {
    expect(CONSENT_REGIONS.size).toBe(32);
  });
});

describe("isConsentRegionCode", () => {
  it("returns true for EEA/UK/CH codes", () => {
    expect(isConsentRegionCode("DE")).toBe(true);
    expect(isConsentRegionCode("FR")).toBe(true);
    expect(isConsentRegionCode("IS")).toBe(true);
    expect(isConsentRegionCode("LI")).toBe(true);
    expect(isConsentRegionCode("NO")).toBe(true);
    expect(isConsentRegionCode("GB")).toBe(true);
    expect(isConsentRegionCode("CH")).toBe(true);
  });

  it("returns false for non-consent-region codes", () => {
    expect(isConsentRegionCode("US")).toBe(false);
    expect(isConsentRegionCode("AU")).toBe(false);
    expect(isConsentRegionCode("CA")).toBe(false);
    expect(isConsentRegionCode("BR")).toBe(false);
  });

  it("fails closed to true for null, undefined, empty or blank input", () => {
    expect(isConsentRegionCode(null)).toBe(true);
    expect(isConsentRegionCode(undefined)).toBe(true);
    expect(isConsentRegionCode("")).toBe(true);
    expect(isConsentRegionCode("   ")).toBe(true);
  });

  it("trims and upper-cases before comparison", () => {
    expect(isConsentRegionCode("de")).toBe(true);
    expect(isConsentRegionCode(" gb ")).toBe(true);
    expect(isConsentRegionCode("us")).toBe(false);
  });

  it("excludes Gibraltar, Isle of Man, Jersey and Guernsey — deliberately out pending Task 2's confirmation", () => {
    expect(isConsentRegionCode("GI")).toBe(false);
    expect(isConsentRegionCode("IM")).toBe(false);
    expect(isConsentRegionCode("JE")).toBe(false);
    expect(isConsentRegionCode("GG")).toBe(false);
  });
});
