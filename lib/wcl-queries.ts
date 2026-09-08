export const REPORT_META_QUERY = `
  query ReportMeta($code: String!) {
    reportData {
      report(code: $code) {
        title
        owner { name }
        startTime
        endTime
        zone { id name expansion { id } }
        fights(translate: true) {
          id
          name
          encounterID
          kill
          startTime
          endTime
          difficulty
          bossPercentage
          fightPercentage
        }
        masterData {
          actors(type: "Player") {
            id
            name
            type
            subType
            server
            icon
          }
        }
      }
    }
  }
`;

export const ENCOUNTER_RANKINGS_QUERY = `
  query EncounterRankings($encounterID: Int!, $className: String!, $specName: String!, $metric: CharacterRankingMetricType, $partition: Int) {
    worldData {
      encounter(id: $encounterID) {
        characterRankings(
          className: $className
          specName: $specName
          metric: $metric
          partition: $partition
          includeCombatantInfo: true
          page: 1
        )
      }
    }
  }
`;

export const TOP_PLAYER_DATA_QUERY = `
  query TopPlayerData($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        damage: table(
          dataType: DamageDone
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        buffs: table(
          dataType: Buffs
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        casts: table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        fights(fightIDs: $fightIDs) {
          id
          startTime
          endTime
        }
      }
    }
  }
`;

// Combined query to fetch player healing, buffs, casts, and combatant info in one request
export const PLAYER_FULL_DATA_QUERY_HEALING = `
  query PlayerFullDataHealing($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        rankings(fightIDs: $fightIDs)
        healing: table(
          dataType: Healing
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        # The sourceID-scoped table above carries a per-ability breakdown
        # (each entry's own overheal), but not activeTime — that field only
        # appears on the un-scoped per-player row (README.md A3). Fetch it
        # here with sourceID omitted so player-level overheal and active
        # time are available with no second round trip.
        healingByPlayer: table(
          dataType: Healing
          fightIDs: $fightIDs
        )
        buffs: table(
          dataType: Buffs
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        casts: table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        combatantInfo: events(
          fightIDs: $fightIDs
          sourceID: $sourceID
          dataType: CombatantInfo
          limit: 1
        ) {
          data
        }
        fights(fightIDs: $fightIDs) {
          id
          startTime
          endTime
        }
      }
    }
  }
`;

export const TOP_PLAYER_DATA_QUERY_HEALING = `
  query TopPlayerDataHealing($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        healing: table(
          dataType: Healing
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        # Same reasoning as PLAYER_FULL_DATA_QUERY_HEALING above: the scoped
        # table lacks activeTime, which only appears on the un-scoped row.
        healingByPlayer: table(
          dataType: Healing
          fightIDs: $fightIDs
        )
        buffs: table(
          dataType: Buffs
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        casts: table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        fights(fightIDs: $fightIDs) {
          id
          startTime
          endTime
        }
      }
    }
  }
`;

// ─── Raid Overview Queries ───────────────────────────────────────────

// Fight-wide tables for all players (no sourceID filter)
export const RAID_OVERVIEW_QUERY = `
  query RaidOverview($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        damage: table(
          dataType: DamageDone
          fightIDs: $fightIDs
        )
        healing: table(
          dataType: Healing
          fightIDs: $fightIDs
        )
        damageTaken: table(
          dataType: DamageTaken
          fightIDs: $fightIDs
        )
        deaths: table(
          dataType: Deaths
          fightIDs: $fightIDs
        )
        fights(fightIDs: $fightIDs) {
          id
          name
          encounterID
          startTime
          endTime
        }
      }
    }
  }
`;

// Death events with timestamps for all players
export const RAID_DEATH_EVENTS_QUERY = `
  query RaidDeathEvents($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        deathEvents: events(
          fightIDs: $fightIDs
          dataType: Deaths
          limit: 100
        ) {
          data
        }
      }
    }
  }
`;

// CombatantInfo events for all players (gear, auras at pull)
export const RAID_COMBATANT_INFO_QUERY = `
  query RaidCombatantInfo($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        combatantInfo: events(
          fightIDs: $fightIDs
          dataType: CombatantInfo
          limit: 50
        ) {
          data
        }
      }
    }
  }
`;

// ─── Timeline Queries ─────────────────────────────────────────────────

// First page of a player's cast timeline plus everything else the timeline
// needs, fetched exactly once: the aggregated casts table (guid -> name/icon
// resolution), a small death-event probe for the death marker, the full
// actor list (cast targets include NPCs, not just players) and fight bounds
// for the fight-relative timestamp baseline. Field names match the recorded
// response in lib/__fixtures__/demo-timeline-casts.json (README.md A1/A2).
export const TIMELINE_CASTS_QUERY = `
  query TimelineCasts($code: String!, $fightIDs: [Int!]!, $sourceID: Int!, $startTime: Float) {
    reportData {
      report(code: $code) {
        castEvents: events(
          fightIDs: $fightIDs
          sourceID: $sourceID
          dataType: Casts
          startTime: $startTime
          limit: 300
        ) {
          data
          nextPageTimestamp
        }
        castTable: table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        deathEvents: events(
          fightIDs: $fightIDs
          sourceID: $sourceID
          dataType: Deaths
          limit: 10
        ) {
          data
        }
        masterData {
          actors {
            id
            name
            type
            subType
          }
        }
        fights(fightIDs: $fightIDs) {
          id
          name
          startTime
          endTime
        }
      }
    }
  }
`;

// Subsequent pages of the same cast timeline. Splitting this from
// TIMELINE_CASTS_QUERY avoids re-fetching the actor list, the casts table and
// the fight bounds on every page of a long fight.
export const TIMELINE_CASTS_PAGE_QUERY = `
  query TimelineCastsPage($code: String!, $fightIDs: [Int!]!, $sourceID: Int!, $startTime: Float!) {
    reportData {
      report(code: $code) {
        castEvents: events(
          fightIDs: $fightIDs
          sourceID: $sourceID
          dataType: Casts
          startTime: $startTime
          limit: 300
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

// Combined query to fetch player damage, buffs, casts, and combatant info in one request
export const PLAYER_FULL_DATA_QUERY = `
  query PlayerFullData($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        rankings(fightIDs: $fightIDs)
        damage: table(
          dataType: DamageDone
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        buffs: table(
          dataType: Buffs
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        casts: table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
        )
        combatantInfo: events(
          fightIDs: $fightIDs
          sourceID: $sourceID
          dataType: CombatantInfo
          limit: 1
        ) {
          data
        }
        fights(fightIDs: $fightIDs) {
          id
          startTime
          endTime
        }
      }
    }
  }
`;

// ─── Encounter & Actor Lookup Queries ────────────────────────────────

/** Fallback query when client doesn't provide encounterID */
export const ENCOUNTER_META_QUERY = `
  query GetEncounterID($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        zone { id name expansion { id } }
        fights(fightIDs: $fightIDs) {
          id
          encounterID
          name
        }
      }
    }
  }
`;

/** Fetch player actors for a report (used to resolve top player sourceIDs) */
export const REPORT_ACTORS_QUERY = `
  query ReportActors($code: String!) {
    reportData {
      report(code: $code) {
        masterData {
          actors(type: "Player") {
            id
            name
            type
          }
        }
      }
    }
  }
`;

// ─── CLA Queries ────────────────────────────────────────────────────

/**
 * Build a GraphQL query that fetches Buff uptime tables for multiple players
 * in a single request using aliases: buffs_1, buffs_2, etc.
 * Batches up to 12 players per query to stay under WCL complexity limits.
 */
export function buildCLABuffUptimeQuery(sourceIds: number[]): string {
  const aliases = sourceIds
    // These ids come from WCL's own actor list (safe), but this is the only place
    // a value reaches a query body as a raw string. Coerce to a non-negative
    // integer and drop anything else — one-line insurance against a future caller
    // passing unvalidated data into the interpolated query.
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id >= 0)
    .map(
      (id) =>
        `buffs_${id}: table(dataType: Buffs, fightIDs: $fightIDs, sourceID: ${id})`
    )
    .join("\n        ");

  return `
  query CLABuffUptime($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        ${aliases}
      }
    }
  }
`;
}
