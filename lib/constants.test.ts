import { describe, it, expect } from "vitest";
import {
  CLASS_COLORS,
  CLASS_COLORS_HEX,
  ROLE_COLORS,
  ROLE_COLORS_HEX,
  classColor,
  roleColorAlpha,
} from "./constants";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const CUSTOM_PROP_RE = /^var\(--/;

describe("classColor", () => {
  it("resolves a known class to its themed custom-property reference", () => {
    expect(classColor("Priest")).toBe("var(--class-priest)");
  });

  it("resolves an unknown class to the default token, never a bare literal", () => {
    const result = classColor("Bard");
    expect(result).toBe("var(--class-default)");
    expect(result).not.toMatch(HEX_RE);
  });
});

describe("roleColorAlpha", () => {
  it("returns a colour-mix expression over the tank role token at the given percentage", () => {
    expect(roleColorAlpha("Tank", 20)).toBe(
      "color-mix(in oklch, var(--role-tank) 20%, transparent)",
    );
  });
});

describe("CLASS_COLORS_HEX / ROLE_COLORS_HEX", () => {
  it("holds only six-digit hex literals (Satori cannot resolve custom properties)", () => {
    for (const value of Object.values(CLASS_COLORS_HEX)) {
      expect(value).toMatch(HEX_RE);
    }
    for (const value of Object.values(ROLE_COLORS_HEX)) {
      expect(value).toMatch(HEX_RE);
    }
  });
});

describe("CLASS_COLORS / ROLE_COLORS", () => {
  it("holds only custom-property references, no raw hex", () => {
    for (const value of Object.values(CLASS_COLORS)) {
      expect(value).toMatch(CUSTOM_PROP_RE);
    }
    for (const value of Object.values(ROLE_COLORS)) {
      expect(value).toMatch(CUSTOM_PROP_RE);
    }
  });
});
