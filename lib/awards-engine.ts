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

// plan 03-02 appends priorities 6 through 15 — these five keep their
// positions.
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
