import { describe, it, expect } from "vitest";
import { mapPool } from "./async-pool";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("mapPool", () => {
  it("preserves input order regardless of completion order", async () => {
    // Uneven delays so results would arrive out of order without index tracking.
    const delays = [30, 5, 20, 1, 15];
    const out = await mapPool(delays, 2, async (ms, i) => {
      await sleep(ms);
      return i;
    });
    expect(out).toEqual([0, 1, 2, 3, 4]);
  });

  it("passes the item and index to the worker", async () => {
    const out = await mapPool([10, 20, 30], 3, async (n, i) => n + i);
    expect(out).toEqual([10, 21, 32]);
  });

  it("never exceeds the concurrency cap", async () => {
    let active = 0;
    let peak = 0;
    await mapPool(
      Array.from({ length: 12 }, (_, i) => i),
      3,
      async (n) => {
        active++;
        peak = Math.max(peak, active);
        await sleep(5);
        active--;
        return n;
      },
    );
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1); // actually ran concurrently
  });

  it("handles empty input", async () => {
    const out = await mapPool([], 4, async (n) => n);
    expect(out).toEqual([]);
  });
});
