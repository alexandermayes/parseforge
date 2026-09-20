// WCL client-credentials rate-budget gate, on top of the project's existing
// shared cache (lib/kv-cache.ts) — same Redis-with-Map-fallback, "never
// throw, log and degrade" contract, no second transport.
//
// The hourly point limit is ALWAYS read from the WCL response at runtime and
// never hard-coded: PARSEFORGE-RANKINGS-SPEC.md §2.2 records it moving
// mid-session (9000 -> 18000 in one cited report), so any constant baked in
// here would silently go stale. `BUDGET_GATE_FRACTION` (90%) is a deliberate
// policy choice, not a measured threshold — a later phase may tune it
// knowingly, but it should never be loosened to make a gate pass.
//
// The gate fails CLOSED on an unknown state (no state recorded, a state that
// fails validation on read-back, or a state whose reset window has already
// elapsed): `hasBudget()` returns `allowed: false` with `reason: "unknown"`
// rather than guessing, exposing the reason so a caller with a genuinely
// cheap or already-cached request can make its own decision instead of being
// silently blocked.

import { cacheGet, cacheSet } from "../kv-cache";

// ─── Types ─────────────────────────────────────────────────────────────

export interface WclRateLimitData {
  limitPerHour: number;
  pointsSpentThisHour: number;
  pointsResetIn: number;
}

export interface WclBudgetState extends WclRateLimitData {
  /** Epoch ms when this state was recorded (used to detect an elapsed window). */
  recordedAt: number;
}

export type BudgetReason = "ok" | "at-gate" | "unknown";

export interface BudgetDecision {
  allowed: boolean;
  reason: BudgetReason;
  spentFraction: number | null;
}

export const BUDGET_KEY = "wcl:budget";

/** Refuse once spend reaches this fraction of the runtime-read hourly limit. Deliberate policy choice — see module header. */
export const BUDGET_GATE_FRACTION = 0.9;

// ─── Validation ──────────────────────────────────────────────────────

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Runtime-validates a `rateLimitData` payload before trusting it: all three
 * values must be finite non-negative numbers, and the hourly limit must be
 * greater than zero (a zero denominator would make every spend look either
 * infinitely safe or infinitely spent, depending on division order). Pure,
 * no I/O. A malformed payload is never partially trusted — it returns null.
 */
export function parseRateLimitData(raw: unknown): WclRateLimitData | null {
  if (!raw || typeof raw !== "object") return null;
  const { limitPerHour, pointsSpentThisHour, pointsResetIn } = raw as Record<string, unknown>;
  if (
    !isFiniteNonNegative(limitPerHour) ||
    !isFiniteNonNegative(pointsSpentThisHour) ||
    !isFiniteNonNegative(pointsResetIn)
  ) {
    return null;
  }
  if (limitPerHour === 0) return null;
  return { limitPerHour, pointsSpentThisHour, pointsResetIn };
}

// ─── Persistence (through the existing shared cache) ──────────────────

/**
 * Validates `raw`, then persists it through the project's existing cache
 * helper with a TTL derived from `pointsResetIn` so an expired window can't
 * masquerade as current state. Never throws — a cache failure or an invalid
 * payload both resolve to `false`, they never reject.
 */
export async function recordRateLimit(raw: unknown): Promise<boolean> {
  const parsed = parseRateLimitData(raw);
  if (!parsed) return false;
  const state: WclBudgetState = { ...parsed, recordedAt: Date.now() };
  try {
    const ttlMs = Math.max(1000, parsed.pointsResetIn * 1000);
    await cacheSet(BUDGET_KEY, state, ttlMs);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the persisted state back through the existing cache helper and
 * re-validates it on the way out. A state that fails validation, or one
 * whose reset window has already elapsed since it was recorded, is treated
 * as absent — never as a stale-but-usable allowance.
 */
export async function readBudgetState(): Promise<WclBudgetState | null> {
  try {
    const raw = await cacheGet<WclBudgetState>(BUDGET_KEY);
    if (!raw || typeof raw !== "object") return null;
    const parsed = parseRateLimitData(raw);
    if (!parsed) return null;
    const recordedAt = (raw as { recordedAt?: unknown }).recordedAt;
    if (!isFiniteNonNegative(recordedAt)) return null;
    const elapsedSec = (Date.now() - recordedAt) / 1000;
    if (elapsedSec > parsed.pointsResetIn) return null;
    return { ...parsed, recordedAt };
  } catch {
    return null;
  }
}

// ─── The single question callers ask ──────────────────────────────────

/**
 * May an expensive query run right now? Reads the persisted budget state
 * and compares spend against `BUDGET_GATE_FRACTION` of the state's own
 * `limitPerHour` — never a hard-coded number. Inclusive at the gate
 * fraction (exactly 90% refuses, not just above it). Fails closed with
 * `reason: "unknown"` when no valid, current state exists.
 */
export async function hasBudget(): Promise<BudgetDecision> {
  const state = await readBudgetState();
  if (!state) return { allowed: false, reason: "unknown", spentFraction: null };

  const spentFraction = state.pointsSpentThisHour / state.limitPerHour;
  if (spentFraction >= BUDGET_GATE_FRACTION) {
    return { allowed: false, reason: "at-gate", spentFraction };
  }
  return { allowed: true, reason: "ok", spentFraction };
}
