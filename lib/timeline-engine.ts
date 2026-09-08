import type { WCLCastEvent, WCLCastEntry, CastTimelineResult, TimelineRow, TimelineAbilityCount } from "./wcl-types";
import { isJunkSpell } from "./analysis-engine";

// Mirrors app/components/SpellLink.tsx's buildRankedNames() algorithm exactly.
// Not imported from there directly: SpellLink.tsx is a "use client" module, and
// this engine is imported by a server-only API route — pulling a client-boundary
// export into server code risks resolving to a client-reference proxy rather
// than the real function at Next.js build time. Same guid -> display-name
// contract, duplicated on purpose to keep this engine free of any client
// dependency (it stays pure and I/O-free, mirroring buildRaidOverview's shape).
function buildRankedNames(items: { name: string; guid: number }[]): Map<number, string> {
  const byName = new Map<string, number[]>();
  for (const item of items) {
    const existing = byName.get(item.name);
    if (existing) {
      if (!existing.includes(item.guid)) existing.push(item.guid);
    } else {
      byName.set(item.name, [item.guid]);
    }
  }

  const result = new Map<number, string>();
  for (const [name, guids] of byName) {
    if (guids.length === 1) {
      result.set(guids[0], name);
    } else {
      guids.sort((a, b) => a - b);
      for (let i = 0; i < guids.length; i++) {
        result.set(guids[i], `${name} (Rank ${i + 1})`);
      }
    }
  }
  return result;
}

// ─── Input types for the engine ─────────────────────────────────────

export interface TimelineEngineActor {
  id: number;
  name: string;
  type: string;
  subType?: string;
}

export interface TimelineEngineFight {
  name: string;
  startTime: number;
  endTime: number;
}

/**
 * A single death event, exactly as WCL's events(dataType: Deaths) returns it
 * (matching the shape RAID_DEATH_EVENTS_QUERY / raid-overview-engine.ts's
 * DeathEvent already consume) — only the fields this engine needs.
 */
export interface TimelineDeathEvent {
  timestamp: number;
  sourceID: number;
}

export interface TimelineEngineInput {
  castEvents: WCLCastEvent[];
  castTable: WCLCastEntry[];
  actors: TimelineEngineActor[];
  fight: TimelineEngineFight;
  playerName: string;
  sourceId: number;
  truncated: boolean;
  /** Death events for the whole fight; filtered down to this player inside the engine. */
  deathEvents?: TimelineDeathEvent[];
}

/**
 * Pure, synchronous, JSON-serialisable transform from recorded WCL cast
 * events to an ordered cast timeline. Mirrors buildRaidOverview's shape —
 * no I/O, no fetch, just a typed input bag in, a typed result out.
 *
 * Emits "cast" rows for every surviving cast, plus synthesized "idle" rows
 * (a gap between consecutive casts longer than a threshold derived from this
 * player's own cast rhythm — never a hardcoded per-class constant, D-03) and
 * at most one "death" row (the player's earliest death event this fight),
 * all merged into a single chronological stream.
 */
export function buildCastTimeline(input: TimelineEngineInput): CastTimelineResult {
  const { castEvents, castTable, actors, fight, sourceId, truncated, deathEvents } = input;

  // guid -> cast-table entry, for display name + icon resolution. The event
  // stream carries only ability ids; the aggregated Casts table is where the
  // name/icon live (README.md A2).
  const castTableByGuid = new Map<number, WCLCastEntry>();
  for (const entry of castTable) {
    castTableByGuid.set(entry.guid, entry);
  }

  // Ranked display names (e.g. "Steady Shot (Rank 2)") so abilities sharing a
  // base name across ranks read as they already do on the Casts tab.
  const rankedNames = buildRankedNames(castTable);

  // actor id -> name, for target resolution.
  const actorById = new Map<number, TimelineEngineActor>();
  for (const actor of actors) {
    actorById.set(actor.id, actor);
  }

  // Only "cast" events are completed casts. WCL also emits a "begincast" event
  // the instant a cast-time spell starts — keeping those would double-log
  // every cast-time ability (one row for starting the cast, one for finishing
  // it), which is not "what the player actually cast" and would silently
  // inflate ability counts.
  //
  // Also drop events whose ability has no cast-table entry at all (not a cast
  // this player made in this fight — an id the aggregated table doesn't list)
  // and events whose resolved entry is a junk spell.
  const survivors = castEvents.filter((event) => {
    if (event.type !== "cast") return false;
    const entry = castTableByGuid.get(event.abilityGameID);
    if (!entry) return false;
    if (isJunkSpell(entry)) return false;
    return true;
  });

  // Sort ascending by timestamp.
  survivors.sort((a, b) => a.timestamp - b.timestamp);

  const castRows: TimelineRow[] = survivors.map((event) => {
    const entry = castTableByGuid.get(event.abilityGameID)!;
    // WCL uses -1 as the "no real target" sentinel (e.g. a self-buff cast) —
    // treated identically to a missing targetID, not resolved to the
    // "Environment" actor that -1 otherwise maps to in the actor list.
    const targetName =
      event.targetID === sourceId
        ? "Self"
        : event.targetID != null && event.targetID !== -1
          ? actorById.get(event.targetID)?.name
          : undefined;

    return {
      kind: "cast",
      fightTimeMs: event.timestamp - fight.startTime,
      abilityGameID: event.abilityGameID,
      abilityName: rankedNames.get(entry.guid) ?? entry.name,
      abilityIcon: entry.abilityIcon,
      targetName,
    };
  });

  // ── Idle-gap threshold, derived from this player's own cast rhythm ──
  //
  // Three times a player's own median cast interval is long enough that a
  // caster with a 1.5s rhythm and a melee with a 300ms rhythm each get a
  // threshold proportional to how they actually play, rather than a single
  // constant tuned for one class and wrong for every other. The 2000ms floor
  // stops a very fast rotation from flagging every ordinary global-cooldown
  // boundary as idle. A sequence with fewer than two casts has no gaps, so
  // the threshold falls back to the floor and no idle row can be emitted.
  let idleThresholdMs = 2000;
  if (survivors.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < survivors.length; i++) {
      gaps.push(survivors[i].timestamp - survivors[i - 1].timestamp);
    }
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const mid = Math.floor(sortedGaps.length / 2);
    const medianGap =
      sortedGaps.length % 2 === 0
        ? (sortedGaps[mid - 1] + sortedGaps[mid]) / 2
        : sortedGaps[mid];
    idleThresholdMs = Math.max(2000, Math.round(3 * medianGap));
  }

  // Interleave an idle row between every pair of consecutive cast rows whose
  // gap exceeds the threshold. Never before the first cast or after the
  // last: the log describes the space between casts, and pre-pull or
  // post-death silence is not a decision the raider made mid-fight.
  const rowsWithIdle: TimelineRow[] = [];
  for (let i = 0; i < castRows.length; i++) {
    rowsWithIdle.push(castRows[i]);
    if (i < castRows.length - 1) {
      const gap = survivors[i + 1].timestamp - survivors[i].timestamp;
      if (gap > idleThresholdMs) {
        rowsWithIdle.push({
          kind: "idle",
          fightTimeMs: castRows[i].fightTimeMs,
          idleMs: gap,
        });
      }
    }
  }

  // ── Death marker — at most one row, merged chronologically ──
  let rows = rowsWithIdle;
  if (deathEvents && deathEvents.length > 0) {
    const playerDeaths = deathEvents.filter((event) => event.sourceID === sourceId);
    if (playerDeaths.length > 0) {
      const earliest = playerDeaths.reduce((a, b) => (a.timestamp <= b.timestamp ? a : b));
      const deathRow: TimelineRow = {
        kind: "death",
        fightTimeMs: earliest.timestamp - fight.startTime,
      };
      const insertAt = rows.findIndex((row) => row.fightTimeMs > deathRow.fightTimeMs);
      rows = insertAt === -1
        ? [...rows, deathRow]
        : [...rows.slice(0, insertAt), deathRow, ...rows.slice(insertAt)];
    }
  }

  // Ability counts from the unfiltered surviving events, sorted by count desc.
  const countsByAbility = new Map<number, TimelineAbilityCount>();
  for (const event of survivors) {
    const entry = castTableByGuid.get(event.abilityGameID)!;
    const existing = countsByAbility.get(event.abilityGameID);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
    } else {
      countsByAbility.set(event.abilityGameID, {
        abilityGameID: event.abilityGameID,
        abilityName: rankedNames.get(entry.guid) ?? entry.name,
        abilityIcon: entry.abilityIcon,
        count: 1,
      });
    }
  }
  const abilityCounts = Array.from(countsByAbility.values()).sort(
    (a, b) => (b.count ?? 0) - (a.count ?? 0)
  );

  return {
    encounterName: fight.name,
    fightDuration: fight.endTime - fight.startTime,
    playerName: input.playerName,
    rows,
    abilityCounts,
    idleThresholdMs,
    truncated,
    // Cast rows only — idle and death bands are structural markers, not
    // casts, and must never inflate the truncation notice or the
    // timeline_viewed PostHog event's cast_count.
    castCount: castRows.length,
  };
}
