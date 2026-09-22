// Pure lens over the WCL per-report rankings blob (`reportData.report.rankings`),
// in the style of lib/analysis-engine.ts: typed input, pure functions, never
// throws. Field names below are verified against the recorded response in
// lib/__fixtures__/rankings-report.json (2026-09-20), never against
// PARSEFORGE-RANKINGS-SPEC.md alone (04-RESEARCH.md Pitfall 1).
//
// The blob crosses a trust boundary (a third-party GraphQL response), so
// every nested object is read defensively — optional chaining and
// `Array.isArray` guards at every level — the same discipline lib/consent.ts
// applies to the CMP payload. A shape surprise returns an empty result, it
// never throws.
//
// D-13: this module is not imported by any route, page, component or API
// handler yet — it ships as tested, unwired engine code until R1 approval.

import {
  ReportRankingsBlob,
  ReportRankingEntry,
  RankingsCharacterEntry,
} from "../wcl-types";

// ─── Types ─────────────────────────────────────────────────────────────

export type ParseRole = "tank" | "healer" | "dps";

export interface ParseRow {
  id: number;
  name: string;
  serverName: string;
  region: string;
  className: string;
  spec: string;
  role: ParseRole;
  /** Raw metric amount (DPS/HPS-shaped), exactly as recorded. */
  amount: number;
  /** WCL's own percentile. Null means "the recording had no value" — never coerced to 0. */
  rankPercent: number | null;
  bracket: number;
  bracketData: number;
  /** Set only when the recorded character carried `hidden: true`. */
  hidden?: boolean;
  /** Set only when the character's id is in this entry's report blacklist. */
  blacklisted?: boolean;
}

export interface FightBadges {
  kill: boolean;
  duration: number;
  deaths: number;
  speedRankPercent: number | null;
  executionRankPercent: number | null;
}

// ─── Role flattening ─────────────────────────────────────────────────

const ROLE_KEYS: Array<{ key: "tanks" | "healers" | "dps"; role: ParseRole }> = [
  { key: "tanks", role: "tank" },
  { key: "healers", role: "healer" },
  { key: "dps", role: "dps" },
];

function toRowsForEntry(entry: ReportRankingEntry): ParseRow[] {
  const roles = entry?.roles;
  if (!roles || typeof roles !== "object") return [];

  const blacklist = new Set(
    Array.isArray(entry.reportsBlacklistForCharacters)
      ? entry.reportsBlacklistForCharacters
      : [],
  );

  const rows: ParseRow[] = [];
  for (const { key, role } of ROLE_KEYS) {
    const group = roles[key];
    const characters: RankingsCharacterEntry[] = Array.isArray(group?.characters)
      ? group.characters
      : [];

    for (const character of characters) {
      if (!character || typeof character !== "object") continue;
      const row: ParseRow = {
        id: character.id,
        name: character.name,
        serverName: character.server?.name ?? "",
        region: character.server?.region ?? "",
        className: character.class,
        spec: character.spec,
        role,
        amount: character.amount,
        rankPercent: character.rankPercent ?? null,
        bracket: character.bracket,
        bracketData: character.bracketData,
      };
      if (character.hidden === true) row.hidden = true;
      if (blacklist.has(character.id)) row.blacklisted = true;
      rows.push(row);
    }
  }
  return rows;
}

/**
 * Flattens a per-report rankings blob into one row per character, across
 * every fight entry and every role group. Never throws; a malformed or
 * empty blob returns an empty array. Never mutates `blob`.
 */
export function toParseRows(blob: ReportRankingsBlob): ParseRow[] {
  const entries: ReportRankingEntry[] = Array.isArray(blob?.data) ? blob.data : [];
  const rows: ParseRow[] = [];
  for (const entry of entries) {
    if (!entry) continue;
    rows.push(...toRowsForEntry(entry));
  }
  return rows;
}

/**
 * The badge object for the blob's first (and normally only) fight entry —
 * kill flag, duration, death count, and the speed/execution rankPercent
 * values, all read verbatim from the recording. Null when the blob carries
 * no entry at all. Never throws.
 */
export function toFightBadges(blob: ReportRankingsBlob): FightBadges | null {
  const entries: ReportRankingEntry[] = Array.isArray(blob?.data) ? blob.data : [];
  const entry = entries[0];
  if (!entry) return null;
  return {
    kill: Boolean(entry.kill),
    duration: entry.duration,
    deaths: entry.deaths,
    speedRankPercent: entry.speed?.rankPercent ?? null,
    executionRankPercent: entry.execution?.rankPercent ?? null,
  };
}

/**
 * The ranked view: rows that are neither hidden nor blacklisted, sorted by
 * `rankPercent` descending with a stable tiebreak on name so the order is
 * deterministic across calls. Does not mutate its argument.
 */
export function visibleParseRows(rows: ParseRow[]): ParseRow[] {
  return rows
    .filter((row) => !row.hidden && !row.blacklisted)
    .slice()
    .sort((a, b) => {
      const aPct = a.rankPercent ?? -Infinity;
      const bPct = b.rankPercent ?? -Infinity;
      if (bPct !== aPct) return bPct - aPct;
      return a.name.localeCompare(b.name);
    });
}
