import type { HealerTableRow, HealerMetricsComputed } from "./wcl-types";

/**
 * Computes a healer's effective HPS, overheal percent and healing uptime from
 * the un-scoped per-player Healing row (`healingByPlayer` in
 * lib/wcl-queries.ts). Single source of truth for both call sites —
 * `lib/raid-overview-engine.ts` (buildRaidOverview, feeding the raid-wide
 * Healer Breakdown panel) and `app/api/analyze/route.ts` (the healer branch
 * of the player-analysis route) — so the raid table and the player page can
 * never show a different number for the same healer and fight (D-08).
 *
 * The un-scoped per-player Healing row is the ONLY valid input. The
 * sourceID-scoped per-ability breakdown carries per-ability `overheal` but no
 * player-level `activeTime` (lib/__fixtures__/README.md Assumption A3), so
 * feeding this function the scoped row would silently zero uptime.
 *
 * Returns all zeros with `hasHealing: false` — never NaN, never Infinity —
 * when the row is absent, the fight duration is not positive, or the row's
 * total is zero.
 */
export function computeHealerMetrics(
  row: HealerTableRow | undefined,
  fightDurationMs: number
): HealerMetricsComputed {
  if (!row || fightDurationMs <= 0 || row.total <= 0) {
    return { effectiveHps: 0, overhealPercent: 0, activityPercent: 0, hasHealing: false };
  }

  const durationSec = fightDurationMs / 1000;
  const hps = row.total / durationSec;
  const overhealPct = row.overheal
    ? (row.overheal / (row.total + row.overheal)) * 100
    : 0;
  const activity = Math.min(100, (row.activeTime / fightDurationMs) * 100);

  return {
    effectiveHps: Math.round(hps),
    overhealPercent: Math.round(overhealPct * 10) / 10,
    activityPercent: Math.round(activity * 10) / 10,
    hasHealing: true,
  };
}

/**
 * Averages a set of already-computed healer metrics (e.g. the top N ranked
 * healers for a spec), ignoring any entry whose `hasHealing` is false. Mirrors
 * the same top-N averaging shape `analyzeBuffsAgainstAverage` and
 * `analyzeCastsAgainstAverage` already use in lib/analysis-engine.ts.
 */
export function averageTopHealerMetrics(
  rows: Array<HealerMetricsComputed>
): { overhealPercent: number; activityPercent: number; sampleCount: number } {
  const withHealing = rows.filter((r) => r.hasHealing);
  if (withHealing.length === 0) {
    return { overhealPercent: 0, activityPercent: 0, sampleCount: 0 };
  }

  const totalOverheal = withHealing.reduce((sum, r) => sum + r.overhealPercent, 0);
  const totalActivity = withHealing.reduce((sum, r) => sum + r.activityPercent, 0);

  return {
    overhealPercent: Math.round((totalOverheal / withHealing.length) * 10) / 10,
    activityPercent: Math.round((totalActivity / withHealing.length) * 10) / 10,
    sampleCount: withHealing.length,
  };
}
