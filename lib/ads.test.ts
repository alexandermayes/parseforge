import { describe, it, expect, afterEach, vi } from "vitest";
import { deriveConsentGateOutcome } from "./consent";
import {
  AD_SLOTS,
  UNCONFIGURED_UNIT,
  shouldLoadAds,
  isTerminalRefusal,
  adsConfigured,
  normalizeRoute,
} from "./ads";

// Deliberately imported from consent.ts, not re-implemented here: this test
// file is the assumption-delta invariant's home (04-CONTEXT.md, the
// "promote" decision) — the ad gate must never diverge from the decision
// PostHogProvider already resolved.
import {
  publishConsentGatePath,
  getConsentGatePath,
  subscribeConsentGatePath,
} from "./consent";

describe("shouldLoadAds", () => {
  it("admits geo-non-consent-region and tcf-accept", () => {
    expect(shouldLoadAds("geo-non-consent-region")).toBe(true);
    expect(shouldLoadAds("tcf-accept")).toBe(true);
  });

  it("refuses tcf-reject, tcf-timeout, and an unresolved (null) decision", () => {
    expect(shouldLoadAds("tcf-reject")).toBe(false);
    expect(shouldLoadAds("tcf-timeout")).toBe(false);
    expect(shouldLoadAds(null)).toBe(false);
  });

  it("never diverges from deriveConsentGateOutcome's optIn field, for all four gate paths (assumption-delta invariant)", () => {
    const cases: Array<[boolean, Parameters<typeof deriveConsentGateOutcome>[1]]> = [
      [false, null], // -> geo-non-consent-region
      [true, "opt-in-full"], // -> tcf-accept
      [true, "cookieless"], // -> tcf-reject
      [true, "pending"], // -> tcf-timeout
    ];
    for (const [isConsentRegion, tcfAction] of cases) {
      const outcome = deriveConsentGateOutcome(isConsentRegion, tcfAction);
      expect(outcome).not.toBeNull();
      expect(shouldLoadAds(outcome!.gatePath)).toBe(outcome!.optIn);
    }
  });
});

describe("isTerminalRefusal", () => {
  // Regression coverage for the AdSlot.tsx bug where `refusedTerminally` was
  // latched on ANY non-admitted gate path, silently dropping a later
  // legitimate "tcf-accept" republish that supersedes a merely-slow CMP's
  // "tcf-timeout". Only "tcf-reject" is a genuine, deliberate decline.
  it("treats tcf-reject as a genuine, terminal refusal", () => {
    expect(isTerminalRefusal("tcf-reject")).toBe(true);
  });

  it("does NOT treat tcf-timeout as terminal — it is provisional and may still resolve to tcf-accept", () => {
    expect(isTerminalRefusal("tcf-timeout")).toBe(false);
  });

  it("is consistent with shouldLoadAds: every path admitted by shouldLoadAds is never a terminal refusal", () => {
    for (const path of ["geo-non-consent-region", "tcf-accept", "tcf-reject", "tcf-timeout"] as const) {
      if (shouldLoadAds(path)) {
        expect(isTerminalRefusal(path)).toBe(false);
      }
    }
  });
});

describe("publishConsentGatePath / getConsentGatePath / subscribeConsentGatePath", () => {
  // Module-level singleton state, like lib/consent.ts's own `consentState` —
  // these tests intentionally run in file declaration order and each one
  // builds on the previous one's published value (mirrors the sequential
  // style already established in lib/consent.test.ts's getConsentState/
  // startConsentListener suites).

  it("returns null before any path has been published", () => {
    expect(getConsentGatePath()).toBeNull();
  });

  it("notifies a subscriber registered before the publish, exactly once, with the published path", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeConsentGatePath(cb);
    publishConsentGatePath("tcf-accept");
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("tcf-accept");
    expect(getConsentGatePath()).toBe("tcf-accept");
    unsubscribe();
  });

  it("immediately notifies a subscriber registered after the publish, with the already-known value (late mount must not miss the decision)", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeConsentGatePath(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("tcf-accept");
    unsubscribe();
  });

  it("does not re-notify subscribers on a second publish of the same path", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeConsentGatePath(cb);
    cb.mockClear();
    publishConsentGatePath("tcf-accept");
    expect(cb).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies subscribers on a publish of a different path (the CMP re-confirmation flow)", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeConsentGatePath(cb);
    cb.mockClear();
    publishConsentGatePath("tcf-reject");
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("tcf-reject");
    unsubscribe();
  });

  it("stops notifying once unsubscribed", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeConsentGatePath(cb);
    cb.mockClear();
    unsubscribe();
    publishConsentGatePath("geo-non-consent-region");
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("normalizeRoute", () => {
  it("maps an analyze report path to the route pattern", () => {
    expect(normalizeRoute("/analyze/ZjKgNYxVcAqR8pGJ")).toBe("/analyze/[reportCode]");
  });

  it("leaves a non-analyze path unchanged", () => {
    expect(normalizeRoute("/tbc-audit")).toBe("/tbc-audit");
  });

  it("strips the query string from an analyze path — a report code's fight/source params must never reach an analytics property", () => {
    expect(normalizeRoute("/analyze/abc?fight=23&source=12")).toBe("/analyze/[reportCode]");
  });
});

describe("AD_SLOTS", () => {
  const BOX_CLASS_RE =
    /w-\[(\d+)px\]\s+h-\[(\d+)px\]\s+md:w-\[(\d+)px\]\s+md:h-\[(\d+)px\]/;

  it("every slot's boxClass encodes exactly its own base/md pixel dimensions", () => {
    for (const [slotId, spec] of Object.entries(AD_SLOTS)) {
      const match = spec.boxClass.match(BOX_CLASS_RE);
      expect(match, `slot ${slotId}'s boxClass did not match the expected literal pattern`).not.toBeNull();
      const [, baseW, baseH, mdW, mdH] = match!;
      expect(Number(baseW)).toBe(spec.base.width);
      expect(Number(baseH)).toBe(spec.base.height);
      expect(Number(mdW)).toBe(spec.md.width);
      expect(Number(mdH)).toBe(spec.md.height);
    }
  });

  // 04-06 Task 3 defect fix (checkpoint round 2): AdSlot used to override
  // these size classes with an inline `style={{width, height}}` set to the
  // `base` dimensions only, so every box rendered at its mobile size on
  // every viewport (never reaching the declared `md` size). AdSlot no
  // longer sets that inline style — boxClass alone is the source of truth
  // for rendered size — so this asserts the class list itself, independent
  // of the component, carries a `max-w-full` safety net: the 728px-wide
  // `-mid` banner slots sit in a container that is narrower than 728px
  // between the `md` breakpoint (768px) and ~776px (max-w-7xl's
  // `sm:px-6` layout padding leaves less than 728px of content width in
  // that band), and `max-w-full` is what stops the box from overflowing
  // its container in that gap instead of shrinking to fit it.
  it("every slot's boxClass includes a max-w-full safety net against a narrower-than-declared container", () => {
    for (const [slotId, spec] of Object.entries(AD_SLOTS)) {
      expect(
        spec.boxClass.split(/\s+/),
        `slot ${slotId}'s boxClass is missing max-w-full`,
      ).toContain("max-w-full");
    }
  });

  it("every collapsible slot's id ends with the end-of-document-order suffix, and no other slot is collapsible", () => {
    for (const [slotId, spec] of Object.entries(AD_SLOTS)) {
      expect(spec.collapsible).toBe(slotId.endsWith("-end"));
    }
  });
});

describe("adsConfigured", () => {
  const ORIGINAL_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED;
  const ORIGINAL_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = ORIGINAL_ENABLED;
    process.env.NEXT_PUBLIC_ADSENSE_PUB_ID = ORIGINAL_PUB_ID;
  });

  it('is false when the enabled flag is not exactly the string "1"', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_PUB_ID = "1234567890123456";
    expect(adsConfigured("tbc-audit-end")).toBe(false);
  });

  it("is false when the publisher id is empty", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "1";
    process.env.NEXT_PUBLIC_ADSENSE_PUB_ID = "";
    expect(adsConfigured("tbc-audit-end")).toBe(false);
  });

  it("is false when the slot's unit id is still the unconfigured placeholder", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "1";
    process.env.NEXT_PUBLIC_ADSENSE_PUB_ID = "1234567890123456";
    // All four AD_SLOTS entries carry a real unit id as of 04-05 (Task 3).
    // Simulate the pre-04-05 "placeholder still wired" state directly on the
    // live record, restoring it after the assertion, so this test keeps
    // covering the `unit === UNCONFIGURED_UNIT` branch of `adsConfigured`
    // without asserting a real slot is unconfigured (it no longer is).
    const original = AD_SLOTS["tbc-audit-end"].unit;
    AD_SLOTS["tbc-audit-end"].unit = UNCONFIGURED_UNIT;
    try {
      expect(adsConfigured("tbc-audit-end")).toBe(false);
    } finally {
      AD_SLOTS["tbc-audit-end"].unit = original;
    }
  });
});
