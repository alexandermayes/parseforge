import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import rankingsRatelimit from "../__fixtures__/rankings-ratelimit.json";

// Stubs the shared cache helpers so no network call ever leaves the machine
// (D-15 pattern already established in lib/wcl-client.test.ts). Each `it()`
// resets modules and re-imports "./budget" fresh so no test's mock state
// leaks into another.

const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();

vi.mock("../kv-cache", () => ({
  cacheGet: (...args: unknown[]) => cacheGetMock(...args),
  cacheSet: (...args: unknown[]) => cacheSetMock(...args),
}));

beforeEach(() => {
  vi.resetModules();
  cacheGetMock.mockReset();
  cacheSetMock.mockReset();
  cacheSetMock.mockResolvedValue(undefined);
  cacheGetMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

async function loadBudget() {
  return import("./budget");
}

describe("parseRateLimitData", () => {
  it("Test 1: accepts every recorded fixture sample and returns the three numbers", async () => {
    const { parseRateLimitData } = await loadBudget();
    for (const sample of rankingsRatelimit.samples) {
      const parsed = parseRateLimitData(sample);
      expect(parsed).toEqual({
        limitPerHour: sample.limitPerHour,
        pointsSpentThisHour: sample.pointsSpentThisHour,
        pointsResetIn: sample.pointsResetIn,
      });
    }
  });

  it("Test 2: returns null when a value is missing", async () => {
    const { parseRateLimitData } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    expect(
      parseRateLimitData({ limitPerHour: sample.limitPerHour, pointsSpentThisHour: sample.pointsSpentThisHour }),
    ).toBeNull();
  });

  it("Test 3: returns null when a value is a string", async () => {
    const { parseRateLimitData } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    expect(
      parseRateLimitData({ ...sample, pointsSpentThisHour: String(sample.pointsSpentThisHour) }),
    ).toBeNull();
  });

  it("Test 4: returns null when a value is NaN", async () => {
    const { parseRateLimitData } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    expect(parseRateLimitData({ ...sample, pointsResetIn: NaN })).toBeNull();
  });

  it("Test 5: returns null when a value is negative", async () => {
    const { parseRateLimitData } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    expect(parseRateLimitData({ ...sample, pointsSpentThisHour: -1 })).toBeNull();
  });

  it("Test 6: returns null when the hourly limit is zero", async () => {
    const { parseRateLimitData } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    expect(parseRateLimitData({ ...sample, limitPerHour: 0 })).toBeNull();
  });

  it("Test 6b: returns null for a non-object payload", async () => {
    const { parseRateLimitData } = await loadBudget();
    expect(parseRateLimitData(null)).toBeNull();
    expect(parseRateLimitData("nope")).toBeNull();
  });
});

describe("recordRateLimit", () => {
  it("Test 7: a valid payload writes state through the cache helper and resolves true", async () => {
    const { recordRateLimit, BUDGET_KEY } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    const ok = await recordRateLimit(sample);
    expect(ok).toBe(true);
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
    expect(cacheSetMock.mock.calls[0][0]).toBe(BUDGET_KEY);
  });

  it("Test 8: an invalid payload writes nothing and resolves false", async () => {
    const { recordRateLimit } = await loadBudget();
    const ok = await recordRateLimit({ limitPerHour: 0 });
    expect(ok).toBe(false);
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("Test 9: never throws when the cache helper rejects — resolves false", async () => {
    cacheSetMock.mockRejectedValueOnce(new Error("redis down"));
    const { recordRateLimit } = await loadBudget();
    const sample = rankingsRatelimit.samples[0];
    await expect(recordRateLimit(sample)).resolves.toBe(false);
  });
});

describe("hasBudget", () => {
  it("Test 10: allowed true, reason ok when spend is below 90% of the limit", async () => {
    cacheGetMock.mockResolvedValue({
      limitPerHour: 1000,
      pointsSpentThisHour: 800,
      pointsResetIn: 1800,
      recordedAt: Date.now(),
    });
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result).toEqual({ allowed: true, reason: "ok", spentFraction: 0.8 });
  });

  it("Test 11: allowed false, reason at-gate at exactly 90% (inclusive boundary)", async () => {
    cacheGetMock.mockResolvedValue({
      limitPerHour: 1000,
      pointsSpentThisHour: 900,
      pointsResetIn: 1800,
      recordedAt: Date.now(),
    });
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("at-gate");
    expect(result.spentFraction).toBe(0.9);
  });

  it("Test 11b: allowed false, reason at-gate above 90%", async () => {
    cacheGetMock.mockResolvedValue({
      limitPerHour: 1000,
      pointsSpentThisHour: 950,
      pointsResetIn: 1800,
      recordedAt: Date.now(),
    });
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("at-gate");
  });

  it("Test 12: allowed false, reason unknown when no state has been recorded", async () => {
    cacheGetMock.mockResolvedValue(null);
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result).toEqual({ allowed: false, reason: "unknown", spentFraction: null });
  });

  it("Test 13: allowed false, reason unknown when the recorded state fails validation on read-back", async () => {
    cacheGetMock.mockResolvedValue({
      limitPerHour: -5,
      pointsSpentThisHour: 10,
      pointsResetIn: 100,
      recordedAt: Date.now(),
    });
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result).toEqual({ allowed: false, reason: "unknown", spentFraction: null });
  });

  it("Test 14: the hourly limit used in the comparison comes from the recorded state, never hard-coded — a different limit produces a different gate point", async () => {
    const spentAmount = 1000; // same absolute spend...
    cacheGetMock.mockResolvedValue({
      limitPerHour: 2000, // ...50% of this limit
      pointsSpentThisHour: spentAmount,
      pointsResetIn: 1800,
      recordedAt: Date.now(),
    });
    const { hasBudget: hasBudgetLowLimit } = await loadBudget();
    const lowLimitResult = await hasBudgetLowLimit();
    expect(lowLimitResult.allowed).toBe(true);

    vi.resetModules();
    cacheGetMock.mockResolvedValue({
      limitPerHour: 1000, // ...100% of this limit — same absolute spend, different limit
      pointsSpentThisHour: spentAmount,
      pointsResetIn: 1800,
      recordedAt: Date.now(),
    });
    const { hasBudget: hasBudgetHighUsage } = await loadBudget();
    const highUsageResult = await hasBudgetHighUsage();
    expect(highUsageResult.allowed).toBe(false);
    expect(highUsageResult.spentFraction).not.toBe(lowLimitResult.spentFraction);
  });

  it("Test 15: a state whose reset window has elapsed is treated as unknown, not a stale allowance", async () => {
    cacheGetMock.mockResolvedValue({
      limitPerHour: 1000,
      pointsSpentThisHour: 10,
      pointsResetIn: 60, // window was 60s from recordedAt
      recordedAt: Date.now() - 120_000, // recorded 120s ago — window has elapsed
    });
    const { hasBudget } = await loadBudget();
    const result = await hasBudget();
    expect(result).toEqual({ allowed: false, reason: "unknown", spentFraction: null });
  });
});
