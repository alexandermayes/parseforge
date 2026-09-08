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

export interface TimelineEngineInput {
  castEvents: WCLCastEvent[];
  castTable: WCLCastEntry[];
  actors: TimelineEngineActor[];
  fight: TimelineEngineFight;
  playerName: string;
  sourceId: number;
  truncated: boolean;
}

/**
 * Pure, synchronous, JSON-serialisable transform from recorded WCL cast
 * events to an ordered cast timeline. Mirrors buildRaidOverview's shape —
 * no I/O, no fetch, just a typed input bag in, a typed result out.
 *
 * Emits only kind: "cast" rows. Plan 02-05 (wave 3, same phase) populates
 * the "idle" and "death" row kinds and computes a real idleThresholdMs;
 * the kind discriminator, idleMs and idleThresholdMs already exist in the
 * contract precisely so that addition needs no shape change here, in the
 * route, in the hook, or in the component.
 */
export function buildCastTimeline(input: TimelineEngineInput): CastTimelineResult {
  const { castEvents, castTable, actors, fight, sourceId, truncated } = input;

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

  const rows: TimelineRow[] = survivors.map((event) => {
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
    idleThresholdMs: 0,
    truncated,
    castCount: rows.length,
  };
}
