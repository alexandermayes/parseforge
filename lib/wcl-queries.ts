export const REPORT_META_QUERY = `
  query ReportMeta($code: String!) {
    reportData {
      report(code: $code) {
        title
        owner { name }
        startTime
        endTime
        zone { id name }
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
        healing: table(
          dataType: Healing
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

// Combined query to fetch player damage, buffs, casts, and combatant info in one request
export const PLAYER_FULL_DATA_QUERY = `
  query PlayerFullData($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
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

// ─── CLA Queries ────────────────────────────────────────────────────

/**
 * Build a GraphQL query that fetches Buff uptime tables for multiple players
 * in a single request using aliases: buffs_1, buffs_2, etc.
 * Batches up to 12 players per query to stay under WCL complexity limits.
 */
export function buildCLABuffUptimeQuery(sourceIds: number[]): string {
  const aliases = sourceIds
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
