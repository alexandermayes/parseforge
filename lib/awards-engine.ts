import type { RaidOverviewResult, AwardRow, AwardsResult, AwardTone } from "./wcl-types";
import { formatFightTime } from "./utils";

/**
 * Computes the fired awards for a single fight from its RaidOverviewResult —
 * the raid-wide per-fight data `/api/raid-overview` already returns. Single
 * source of truth for both call sites — the `view=awards` branch of
 * `app/og/route.tsx` (the Discord-shareable image) and (from plan 03-04) the
 * awards panel in `app/components/RaidOverview.tsx` — so the OG image and the
 * in-app preview can never show a different award set for the same fight
 * (D-06/D-08).
 *
 * Never throws. A falsy overview, a non-array or empty `players`, or a
 * non-positive `fightDuration` returns an empty `awards` array with the
 * caller's `name`/`outcome` echoed back — the OG route's never-fail-an-unfurl
 * contract depends on this function being safe to call on a null-shaped
 * input.
 */

export const MAX_AWARDS_SHOWN = 6;
export const MIN_AWARDS_FOR_CARD = 3;
export const MAX_WINNER_NAMES = 3;

type FightOutcome = AwardsResult["outcome"];

/** A rule's candidate winner before tie-break sorting and name truncation. */
interface WinnerCandidate {
  name: string;
  className: string;
  sourceId: number;
  /** The metric this award ranks by, sorted descending before truncation. */
  rank: number;
}

interface AwardRuleResult {
  winners: WinnerCandidate[];
  stat: string;
}

interface AwardRule {
  id: string;
  title: string;
  icon: string;
  priority: number;
  tone: AwardTone;
  evaluate: (overview: RaidOverviewResult, outcome: FightOutcome) => AwardRuleResult | null;
}

/**
 * K/M-formatted number, identical to the formatter already in
 * `app/og/route.tsx` and `app/components/RaidOverview.tsx` so all three
 * surfaces produce the same string for the same underlying number.
 */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toString();
}

/** Sorted-middle median, used by fire-dancer's and punching-up's thresholds. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Priorities 1-5 (the 03-01 tracer pool) and 6-15 (this plan) together form
// the full fixed-priority pool (D-02).
export const AWARD_POOL: AwardRule[] = [
  {
    id: "first-to-die",
    title: "First to Die",
    icon: "💀",
    priority: 1,
    tone: "jab",
    evaluate: (overview) => {
      const first = overview.deathTimeline[0];
      if (!first) return null;
      return {
        winners: [
          { name: first.playerName, className: first.playerClass, sourceId: first.sourceId, rank: 0 },
        ],
        stat: `${formatFightTime(first.fightTimeMs)} in`,
      };
    },
  },
  {
    id: "top-dps",
    title: "Meter Lord",
    icon: "⚔️",
    priority: 2,
    tone: "praise",
    evaluate: (overview) => {
      const candidates = overview.players.filter((p) => p.role !== "Healer" && p.throughput > 0);
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, p) => (p.throughput > best.throughput ? p : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: top.throughput }],
        stat: `${formatNumber(top.throughput)} dps`,
      };
    },
  },
  {
    id: "top-hps",
    title: "Triage Master",
    icon: "✨",
    priority: 3,
    tone: "praise",
    evaluate: (overview) => {
      const candidates = overview.healerMetrics.filter((h) => h.hps > 0);
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, h) => (h.hps > best.hps ? h : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: top.hps }],
        stat: `${formatNumber(top.hps)} hps`,
      };
    },
  },
  {
    id: "flaskless",
    title: "Flaskless Wonder",
    icon: "🧪",
    priority: 4,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.players.filter((p) => !p.consumables.flask);
      if (candidates.length === 0) return null;
      return {
        winners: candidates.map((p) => ({
          name: p.name,
          className: p.className,
          sourceId: p.sourceId,
          rank: 0,
        })),
        stat: "no flask",
      };
    },
  },
  {
    id: "best-prepared",
    title: "Best Prepared",
    icon: "🛡️",
    priority: 5,
    tone: "praise",
    evaluate: (overview) => {
      const candidates = overview.players.filter(
        (p) =>
          p.consumables.flask &&
          p.consumables.food &&
          p.consumables.weaponEnhancement &&
          p.missingEnchants === 0,
      );
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, p) => (p.avgItemLevel > best.avgItemLevel ? p : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: top.avgItemLevel }],
        stat: "flask + food + weapon + full enchants",
      };
    },
  },
  {
    id: "graveyard-shift",
    title: "Graveyard Shift",
    icon: "⚰️",
    priority: 6,
    tone: "jab",
    evaluate: (overview) => {
      const maxDeaths = overview.players.reduce((max, p) => Math.max(max, p.deaths), 0);
      if (maxDeaths < 2) return null;
      const candidates = overview.players.filter((p) => p.deaths === maxDeaths);
      return {
        winners: candidates.map((p) => ({ name: p.name, className: p.className, sourceId: p.sourceId, rank: 0 })),
        stat: `${maxDeaths} deaths`,
      };
    },
  },
  {
    id: "gcd-tourist",
    title: "GCD Tourist",
    icon: "🕰️",
    priority: 7,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.players.filter((p) => p.role !== "Healer" && p.throughput > 0);
      if (candidates.length === 0) return null;
      const lowest = candidates.reduce((min, p) => (p.activityPercent < min.activityPercent ? p : min));
      if (lowest.activityPercent >= 80) return null;
      return {
        winners: [{ name: lowest.name, className: lowest.className, sourceId: lowest.sourceId, rank: 0 }],
        stat: `${lowest.activityPercent.toFixed(1)} active`,
      };
    },
  },
  {
    id: "fire-dancer",
    title: "Standing in the Fire",
    icon: "🔥",
    priority: 8,
    tone: "jab",
    evaluate: (overview) => {
      const values = overview.players.map((p) => p.avoidableDamage);
      const max = Math.max(...values);
      if (!(max > 0)) return null;
      const med = median(values);
      if (!(max >= 1.5 * med)) return null;
      const candidates = overview.players.filter((p) => p.avoidableDamage === max);
      return {
        winners: candidates.map((p) => ({
          name: p.name,
          className: p.className,
          sourceId: p.sourceId,
          rank: p.avoidableDamage,
        })),
        stat: `${formatNumber(max)} taken`,
      };
    },
  },
  {
    id: "naked-slots",
    title: "Enchants? Never Heard of Her",
    icon: "🔧",
    priority: 9,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.players.filter((p) => p.missingEnchants >= 3);
      if (candidates.length === 0) return null;
      const maxMissing = Math.max(...candidates.map((p) => p.missingEnchants));
      return {
        winners: candidates.map((p) => ({
          name: p.name,
          className: p.className,
          sourceId: p.sourceId,
          rank: p.missingEnchants,
        })),
        stat: `${maxMissing} missing enchants`,
      };
    },
  },
  {
    id: "skipped-breakfast",
    title: "Skipped Breakfast",
    icon: "🍖",
    priority: 10,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.players.filter((p) => !p.consumables.food);
      if (candidates.length === 0) return null;
      return {
        winners: candidates.map((p) => ({ name: p.name, className: p.className, sourceId: p.sourceId, rank: 0 })),
        stat: "no food buff",
      };
    },
  },
  {
    id: "dull-blade",
    title: "Dull Blade",
    icon: "🗡️",
    priority: 11,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.players.filter(
        (p) => (p.role === "Physical" || p.role === "Tank") && !p.consumables.weaponEnhancement,
      );
      if (candidates.length === 0) return null;
      return {
        winners: candidates.map((p) => ({ name: p.name, className: p.className, sourceId: p.sourceId, rank: 0 })),
        stat: "no weapon enhancement",
      };
    },
  },
  {
    id: "iron-man",
    title: "Iron Man",
    icon: "🪨",
    priority: 12,
    tone: "praise",
    evaluate: (overview) => {
      if (overview.deathTimeline.length === 0) return null;
      const candidates = overview.players.filter((p) => p.deaths === 0);
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, p) => (p.avoidableDamage > best.avoidableDamage ? p : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: 0 }],
        stat: `0 deaths · ${formatNumber(top.avoidableDamage)} taken`,
      };
    },
  },
  {
    id: "watering-the-garden",
    title: "Watering the Garden",
    icon: "💧",
    priority: 13,
    tone: "jab",
    evaluate: (overview) => {
      const candidates = overview.healerMetrics.filter((h) => h.totalHealing > 0 && h.overhealPercent >= 50);
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, h) => (h.overhealPercent > best.overhealPercent ? h : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: 0 }],
        stat: `${Math.round(top.overhealPercent)}% overheal`,
      };
    },
  },
  {
    id: "kept-them-breathing",
    title: "Kept Them Breathing",
    icon: "💚",
    priority: 14,
    tone: "praise",
    evaluate: (overview) => {
      const candidates = overview.healerMetrics.filter((h) => h.totalHealing > 0 && h.activityPercent >= 85);
      if (candidates.length === 0) return null;
      const top = candidates.reduce((best, h) => (h.activityPercent > best.activityPercent ? h : best));
      return {
        winners: [{ name: top.name, className: top.className, sourceId: top.sourceId, rank: 0 }],
        stat: `${Math.round(top.activityPercent)}% healing uptime`,
      };
    },
  },
  {
    id: "punching-up",
    title: "Punching Up",
    icon: "🎯",
    priority: 15,
    tone: "praise",
    evaluate: (overview) => {
      const nonHealers = overview.players.filter((p) => p.role !== "Healer");
      const geared = nonHealers.filter((p) => p.avgItemLevel > 0);
      if (geared.length < 2) return null;
      const maxIlvl = Math.max(...geared.map((p) => p.avgItemLevel));
      const minIlvl = Math.min(...geared.map((p) => p.avgItemLevel));
      if (maxIlvl - minIlvl < 10) return null;
      const lowest = geared.reduce((min, p) => (p.avgItemLevel < min.avgItemLevel ? p : min));
      const medianThroughput = median(nonHealers.map((p) => p.throughput));
      if (!(lowest.throughput >= medianThroughput)) return null;
      return {
        winners: [{ name: lowest.name, className: lowest.className, sourceId: lowest.sourceId, rank: 0 }],
        stat: `ilvl ${lowest.avgItemLevel} · ${formatNumber(lowest.throughput)} dps`,
      };
    },
  },
];

export function computeAwards(
  overview: RaidOverviewResult | null | undefined,
  fight: { name: string; outcome: FightOutcome },
): AwardsResult {
  if (
    !overview ||
    !Array.isArray(overview.players) ||
    overview.players.length === 0 ||
    !(overview.fightDuration > 0)
  ) {
    return { encounterName: fight.name, outcome: fight.outcome, awards: [] };
  }

  const fired: AwardRow[] = [];
  for (const rule of AWARD_POOL) {
    const result = rule.evaluate(overview, fight.outcome);
    if (!result) continue;

    // Sort by the rule's own ranking metric descending, then by name so
    // output is deterministic (RESEARCH Pitfall 2), then cap the name list —
    // enforced here, not in the renderer, so Satori never receives more
    // names than a row can fit.
    const sorted = [...result.winners].sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.name.localeCompare(b.name);
    });
    const winners = sorted.slice(0, MAX_WINNER_NAMES).map((w) => ({
      name: w.name,
      className: w.className,
      sourceId: w.sourceId,
    }));
    const extraWinnerCount = Math.max(0, sorted.length - MAX_WINNER_NAMES);

    fired.push({
      id: rule.id,
      title: rule.title,
      icon: rule.icon,
      priority: rule.priority,
      tone: rule.tone,
      winners,
      extraWinnerCount,
      stat: result.stat,
    });
  }

  fired.sort((a, b) => a.priority - b.priority);

  return {
    encounterName: fight.name,
    outcome: fight.outcome,
    awards: fired.slice(0, MAX_AWARDS_SHOWN),
  };
}
