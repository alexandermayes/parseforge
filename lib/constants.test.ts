import { describe, it, expect } from "vitest";
import {
  CLASS_COLORS,
  CLASS_COLORS_HEX,
  ROLE_COLORS,
  ROLE_COLORS_HEX,
  classColor,
  roleColor,
  roleColorAlpha,
  GRADE_COLORS,
  percentileColor,
  percentileBg,
} from "./constants";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const CUSTOM_PROP_RE = /^var\(--/;

// Tailwind's built-in palette family names — a returned class string must
// never carry one of these, since that's exactly the raw-palette-shade
// pattern the tier tokens replace.
const PALETTE_FAMILY_RE =
  /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/;

// A two-or-three digit numeric Tailwind shade suffix (e.g. "-400", "-50").
const NUMERIC_SHADE_RE = /-[0-9]{2,3}\b/;

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

describe("roleColor", () => {
  it("resolves a role to its themed custom-property reference, mirroring classColor", () => {
    expect(roleColor("Tank")).toBe("var(--role-tank)");
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

describe("GRADE_COLORS", () => {
  it("contains only tier token class names — no Tailwind palette family name in any of its five values", () => {
    for (const value of Object.values(GRADE_COLORS)) {
      expect(value).not.toMatch(PALETTE_FAMILY_RE);
      expect(value).toMatch(/tier-/);
    }
  });

  it("maps S to the artifact tier", () => {
    expect(GRADE_COLORS.S).toMatch(/tier-artifact/);
  });

  it("carries no numeric shade suffix in any grade", () => {
    for (const value of Object.values(GRADE_COLORS)) {
      expect(value).not.toMatch(NUMERIC_SHADE_RE);
    }
  });
});

describe("percentileColor", () => {
  it("returns different tier token classes for 99 and 95, preserving two distinct top tiers", () => {
    const p99 = percentileColor(99);
    const p95 = percentileColor(95);
    expect(p99).not.toBe(p95);
    expect(p99).toMatch(/tier-artifact/);
    expect(p95).toMatch(/tier-legendary/);
  });

  it("returns the lowest tier token class for a low percentile", () => {
    expect(percentileColor(10)).toMatch(/tier-common/);
  });

  it("carries no Tailwind palette family name or numeric shade suffix at any threshold", () => {
    for (const p of [99, 95, 75, 50, 25, 10]) {
      const value = percentileColor(p);
      expect(value).not.toMatch(PALETTE_FAMILY_RE);
      expect(value).not.toMatch(NUMERIC_SHADE_RE);
    }
  });
});

describe("percentileBg", () => {
  it("returns a text, background and border class that all name the same tier", () => {
    const value = percentileBg(80);
    expect(value).toMatch(/text-tier-epic\b/);
    expect(value).toMatch(/bg-tier-epic\//);
    expect(value).toMatch(/border-tier-epic\//);
  });

  it("carries no Tailwind palette family name or numeric shade suffix at any threshold", () => {
    for (const p of [99, 95, 75, 50, 25, 10]) {
      const value = percentileBg(p);
      expect(value).not.toMatch(PALETTE_FAMILY_RE);
      expect(value).not.toMatch(NUMERIC_SHADE_RE);
    }
  });
});
