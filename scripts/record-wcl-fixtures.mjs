#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// record-wcl-fixtures: a one-off recorder that captures REAL Warcraft Logs
// GraphQL responses for the public demo report and writes them under
// lib/__fixtures__/ as pretty-printed JSON.
//
// This is Phase 2's Wave 0 spike (RESEARCH.md Assumptions A1-A5): before any
// timeline/healer engine code is written against a guessed WCL response
// shape, this script learns the real shape once and freezes it as a fixture.
//
// Standalone .mjs by design — it deliberately does NOT import from lib/ (that
// is TypeScript and this recorder must run under plain node with no build
// step). Query bodies below are duplicated from lib/wcl-queries.ts rather
// than shared; keep them in sync by hand if those queries change shape.
//
// Secrets discipline (CLAUDE.md): this script reads WCL_CLIENT_ID and
// WCL_CLIENT_SECRET from the environment, mints a token, and uses it only
// in-memory for the duration of the run. It NEVER writes a token, a client
// secret, or any part of either to stdout or to a file. The caller is
// responsible for pulling those variables into the environment (see the
// invocation documented in lib/__fixtures__/README.md) and deleting the
// pulled env file afterward — this script does not touch that file.
//
// Recording is restricted to the PUBLIC demo report (lib/demo-report.ts):
// code ZjKgNYxVcAqR8pGJ, fight 23. A committed fixture is permanent,
// world-readable data — never point this script at a private report.
//
// R0-2 (PARSEFORGE-RANKINGS-SPEC.md §7) extends this recorder with rankings
// fixtures: rankings-ratelimit.json (three rateLimitData samples per run —
// before, after-report-rankings, end) and rankings-report.json (the
// report.rankings(fightIDs:) blob for the demo report, recorded on its own).
// Same secrets/public-entity discipline as the six fixtures above.
//
// Usage:
//   node scripts/record-wcl-fixtures.mjs   -> records all eight fixtures,
//                                              exits 0 on success.
//
// Exit codes:
//   0  -> all fixtures written successfully
//   1  -> a WCL query failed (network, GraphQL error, or unexpected shape)
//   2  -> missing required environment variable(s), or no healer found in
//         the target fight (never falls back to a damage-dealer source)
// ─────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(REPO_ROOT, "lib", "__fixtures__");

// Duplicated from lib/constants.ts on purpose — see header comment.
const WCL_API_URL = "https://www.warcraftlogs.com/api/v2/client";
const WCL_TOKEN_URL = "https://www.warcraftlogs.com/oauth/token";

// Duplicated from lib/demo-report.ts on purpose — see header comment.
const REPORT_CODE = "ZjKgNYxVcAqR8pGJ";
const FIGHT_ID = 23;
const DPS_SOURCE_ID = 12;

// Duplicated from lib/constants.ts's HEALER_SPECS on purpose.
const HEALER_SPECS = new Set(["Restoration", "Holy", "Discipline", "Mistweaver"]);

const MAX_PAGES = 20;

// ─── GraphQL query bodies (mirror lib/wcl-queries.ts shapes) ──────────────

const PLAYER_FULL_DATA_QUERY = `
  query PlayerFullData($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        rankings(fightIDs: $fightIDs)
        damage: table(dataType: DamageDone, fightIDs: $fightIDs, sourceID: $sourceID)
        buffs: table(dataType: Buffs, fightIDs: $fightIDs, sourceID: $sourceID)
        casts: table(dataType: Casts, fightIDs: $fightIDs, sourceID: $sourceID)
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

const PLAYER_FULL_DATA_QUERY_HEALING = `
  query PlayerFullDataHealing($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        rankings(fightIDs: $fightIDs)
        healing: table(dataType: Healing, fightIDs: $fightIDs, sourceID: $sourceID)
        buffs: table(dataType: Buffs, fightIDs: $fightIDs, sourceID: $sourceID)
        casts: table(dataType: Casts, fightIDs: $fightIDs, sourceID: $sourceID)
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

// The un-scoped (no sourceID) counterpart — this is what Pitfall 1/A3/A5
// exist to probe: does the un-scoped per-player row carry overheal/activeTime
// where the scoped per-ability breakdown does not.
const HEALING_BY_PLAYER_QUERY = `
  query HealingByPlayer($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        healingByPlayer: table(dataType: Healing, fightIDs: $fightIDs)
      }
    }
  }
`;

const RAID_OVERVIEW_QUERY = `
  query RaidOverview($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        damage: table(dataType: DamageDone, fightIDs: $fightIDs)
        healing: table(dataType: Healing, fightIDs: $fightIDs)
        damageTaken: table(dataType: DamageTaken, fightIDs: $fightIDs)
        deaths: table(dataType: Deaths, fightIDs: $fightIDs)
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

const RAID_COMBATANT_INFO_QUERY = `
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

const RAID_DEATH_EVENTS_QUERY = `
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

// The new probe — nothing in this codebase queries events(dataType: Casts)
// today. Aliased castEvents to avoid colliding with the aggregated `casts`
// table field used elsewhere.
const TIMELINE_CASTS_PROBE_QUERY = `
  query TimelineCastsProbe($code: String!, $fightIDs: [Int!]!, $sourceID: Int!, $startTime: Float) {
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

const CASTS_TABLE_QUERY = `
  query CastsTable($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        castsTable: table(dataType: Casts, fightIDs: $fightIDs, sourceID: $sourceID)
      }
    }
  }
`;

const MASTER_DATA_ACTORS_QUERY = `
  query MasterDataActors($code: String!) {
    reportData {
      report(code: $code) {
        masterData {
          actors {
            id
            name
            type
            subType
          }
        }
      }
    }
  }
`;

// ─── R0-2 rankings probes (PARSEFORGE-RANKINGS-SPEC.md §7) ────────────────

// Budget introspection — never hard-code limitPerHour, the spec's §2.2
// records it changing mid-session.
const RATE_LIMIT_QUERY = `
  query RateLimitCheck {
    rateLimitData {
      limitPerHour
      pointsSpentThisHour
      pointsResetIn
    }
  }
`;

// The per-report rankings blob, recorded on its own (not as a by-product of
// PLAYER_FULL_DATA_QUERY above) so rankings-report.json is a faithful,
// independently-verifiable recording.
const REPORT_RANKINGS_QUERY = `
  query ReportRankings($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        rankings(fightIDs: $fightIDs)
      }
    }
  }
`;

// Boss leaderboard (page 1 of both the per-character and per-fight rankings),
// scoped to the report's own partition — an unpartitioned read would compare
// across raid phases (the "partition-unaware ranking query" anti-pattern).
const ENCOUNTER_RANKINGS_PROBE_QUERY = `
  query EncounterRankingsProbe($encounterID: Int!, $partition: Int) {
    worldData {
      encounter(id: $encounterID) {
        characterRankings(partition: $partition, page: 1)
        fightRankings(partition: $partition, page: 1)
      }
    }
  }
`;

// A character's zone/encounter rankings. Confirmed by probing this session:
// classic.warcraftlogs.com/api/v2/client is REQUIRED for this Classic
// character to resolve — the default www.warcraftlogs.com host returns
// `character: null` for the exact same name/serverSlug/serverRegion. This is
// an explicit R0-2 finding, recorded in the fixture's own _provenance block
// and in README.md, not just in this comment.
const CLASSIC_API_URL = "https://classic.warcraftlogs.com/api/v2/client";
const CHARACTER_RANKINGS_PROBE_QUERY = `
  query CharacterRankingsProbe(
    $name: String!
    $serverSlug: String!
    $serverRegion: String!
    $zoneID: Int!
    $encounterID: Int!
    $partition: Int
  ) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        id
        zoneRankings(zoneID: $zoneID, partition: $partition)
        encounterRankings(encounterID: $encounterID, partition: $partition)
      }
    }
  }
`;

// The bracket vocabulary any displayed percentile has to be labelled with.
const ZONES_PROBE_QUERY = `
  query ZonesProbe {
    worldData {
      zones {
        id
        name
        brackets {
          min
          max
          bucket
          type
        }
      }
    }
  }
`;

// ─── WCL HTTP plumbing (mirrors lib/wcl-client.ts's auth mechanics; not a
//     shared import — see header comment) ──────────────────────────────────

async function getAccessToken(clientId, clientSecret) {
  const res = await fetch(WCL_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    // Deliberately no response body in this message — never risk echoing
    // anything that could contain credential-adjacent content.
    throw new Error(`WCL OAuth token request failed with HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("WCL OAuth response did not include an access_token");
  }
  return data.access_token;
}

async function gqlQuery(token, query, variables, apiUrl = WCL_API_URL) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    const detail = json.errors.map((e) => e.message).join(", ");
    throw new Error(`WCL GraphQL error: ${detail}`);
  }
  if (!res.ok) {
    throw new Error(`WCL HTTP ${res.status}`);
  }
  return json.data;
}

// ─── Local reimplementations of lib/wcl-helpers.ts (TS, not importable from
//     a standalone .mjs) ───────────────────────────────────────────────────

function flattenPlayerDetails(raw) {
  return Object.values(raw?.data?.playerDetails ?? {}).flat();
}

function parsePlayerSpec(player) {
  const rawSpec = player?.specs?.[0];
  if (typeof rawSpec === "object" && rawSpec !== null && "spec" in rawSpec) {
    return rawSpec.spec;
  }
  if (typeof rawSpec === "string") return rawSpec;
  return player?.icon?.split("-")[1] ?? "";
}

// ─── Fixture I/O ────────────────────────────────────────────────────────

function writeFixture(filename, data) {
  const filePath = path.join(FIXTURES_DIR, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

// Takes one rateLimitData sample, labeled and timestamped, for
// rankings-ratelimit.json. Never writes the token — only the budget fields.
async function sampleRateLimit(token, label) {
  const data = await gqlQuery(token, RATE_LIMIT_QUERY, {});
  return {
    label,
    recorded: new Date().toISOString(),
    ...data.rateLimitData,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const clientId = process.env.WCL_CLIENT_ID;
  const clientSecret = process.env.WCL_CLIENT_SECRET;
  const missing = [];
  if (!clientId) missing.push("WCL_CLIENT_ID");
  if (!clientSecret) missing.push("WCL_CLIENT_SECRET");
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
    process.exit(2);
  }

  mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`Recording fixtures for report ${REPORT_CODE}, fight ${FIGHT_ID}...`);
  const token = await getAccessToken(clientId, clientSecret);

  // R0-2 rate-limit sample 1/3 — before any other query in this run.
  const rateLimitSamples = [];
  rateLimitSamples.push(await sampleRateLimit(token, "before"));

  // R0-2: the per-report rankings blob, recorded on its own.
  const rankingsReportData = await gqlQuery(token, REPORT_RANKINGS_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
  });
  writeFixture("rankings-report.json", rankingsReportData);

  // R0-2 rate-limit sample 2/3 — immediately after the rankings query above.
  rateLimitSamples.push(await sampleRateLimit(token, "after-report-rankings"));

  // R0-2 (Task 2): boss leaderboard, character and zone-bracket fixtures.
  // Every id below is read from the just-recorded rankings-report.json blob,
  // never a literal — including the partition, so the leaderboard read is
  // scoped to the report's own raid phase.
  const reportRankingEntry = rankingsReportData?.reportData?.report?.rankings?.data?.[0];
  const encounterID = reportRankingEntry?.encounter?.id;
  const encounterName = reportRankingEntry?.encounter?.name;
  const partition = reportRankingEntry?.partition;
  const zoneID = reportRankingEntry?.zone;
  const targetCharacter = reportRankingEntry?.roles?.dps?.characters?.[0];

  const encounterRankingsData = await gqlQuery(token, ENCOUNTER_RANKINGS_PROBE_QUERY, {
    encounterID,
    partition,
  });
  writeFixture("rankings-encounter.json", {
    _provenance: {
      query: "EncounterRankingsProbe (worldData.encounter.characterRankings + fightRankings)",
      recorded: new Date().toISOString(),
      entity: `encounter ${encounterID} ("${encounterName}"), partition ${partition}`,
      api_host: "www.warcraftlogs.com",
    },
    ...encounterRankingsData.worldData.encounter,
  });
  rateLimitSamples.push(await sampleRateLimit(token, "after-encounter-rankings"));

  const characterRankingsData = await gqlQuery(
    token,
    CHARACTER_RANKINGS_PROBE_QUERY,
    {
      name: targetCharacter.name,
      serverSlug: targetCharacter.server.name,
      serverRegion: targetCharacter.server.region,
      zoneID,
      encounterID,
      partition,
    },
    CLASSIC_API_URL,
  );
  writeFixture("rankings-character.json", {
    _provenance: {
      query: "CharacterRankingsProbe (characterData.character.zoneRankings + encounterRankings)",
      recorded: new Date().toISOString(),
      entity: `${targetCharacter.name}-${targetCharacter.server.name}-${targetCharacter.server.region}, zone ${zoneID}, partition ${partition}`,
      api_host: "classic.warcraftlogs.com",
      // R0-2 finding: this Classic character resolves to null on the
      // default www.warcraftlogs.com host and requires the classic. host —
      // confirmed by probing both hosts this session with identical args.
      required_classic_host: true,
    },
    ...characterRankingsData.characterData.character,
  });
  rateLimitSamples.push(await sampleRateLimit(token, "after-character-rankings"));

  const zonesData = await gqlQuery(token, ZONES_PROBE_QUERY, {});
  writeFixture("rankings-zones.json", {
    _provenance: {
      query: "ZonesProbe (worldData.zones)",
      recorded: new Date().toISOString(),
      entity: "all worldData.zones (bracket vocabulary, not report-specific)",
      api_host: "www.warcraftlogs.com",
    },
    worldData: zonesData.worldData,
  });
  rateLimitSamples.push(await sampleRateLimit(token, "after-zones"));

  // 1. DPS player data (fight 23, source 12)
  const dpsData = await gqlQuery(token, PLAYER_FULL_DATA_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
    sourceID: DPS_SOURCE_ID,
  });
  writeFixture("demo-player-dps.json", dpsData);

  // 2. Raid overview (also used to resolve a healer source id below)
  const raidOverviewData = await gqlQuery(token, RAID_OVERVIEW_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
  });
  writeFixture("demo-raid-overview.json", raidOverviewData);

  const allPlayers = flattenPlayerDetails(raidOverviewData?.reportData?.report?.playerDetails);
  const healer = allPlayers.find((p) => HEALER_SPECS.has(parsePlayerSpec(p)));
  if (!healer) {
    console.error(
      `No healer found in fight ${FIGHT_ID} of report ${REPORT_CODE} — pick a different ` +
        "fight and rerun. Never substituting a damage-dealer source for a healer fixture.",
    );
    process.exit(2);
  }
  const healerSourceId = healer.id;
  console.log(`Resolved healer source id ${healerSourceId} (${healer.name}, ${parsePlayerSpec(healer)})`);

  // 3. Healer player data (scoped) + un-scoped healingByPlayer sibling key
  const healerScopedData = await gqlQuery(token, PLAYER_FULL_DATA_QUERY_HEALING, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
    sourceID: healerSourceId,
  });
  const healingByPlayerData = await gqlQuery(token, HEALING_BY_PLAYER_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
  });
  writeFixture("demo-player-healer.json", {
    ...healerScopedData,
    healingByPlayer: healingByPlayerData?.reportData?.report?.healingByPlayer ?? null,
  });

  // 4. Raid combatant info
  const combatantInfoData = await gqlQuery(token, RAID_COMBATANT_INFO_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
  });
  writeFixture("demo-raid-combatant-info.json", combatantInfoData);

  // 5. Raid death events
  const deathEventsData = await gqlQuery(token, RAID_DEATH_EVENTS_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
  });
  writeFixture("demo-raid-death-events.json", deathEventsData);

  // 6. Timeline casts probe — paginate on nextPageTimestamp, capped at
  //    MAX_PAGES, plus the aggregated casts table and the actor list.
  const pages = [];
  let startTime;
  let truncatedByCap = false;
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
    const pageData = await gqlQuery(token, TIMELINE_CASTS_PROBE_QUERY, {
      code: REPORT_CODE,
      fightIDs: [FIGHT_ID],
      sourceID: DPS_SOURCE_ID,
      startTime,
    });
    const page = pageData?.reportData?.report?.castEvents;
    pages.push(page);
    const nextTimestamp = page?.nextPageTimestamp;
    if (nextTimestamp === undefined || nextTimestamp === null) {
      break;
    }
    if (pageIndex === MAX_PAGES - 1) {
      truncatedByCap = true;
      break;
    }
    startTime = nextTimestamp;
  }

  const castsTableData = await gqlQuery(token, CASTS_TABLE_QUERY, {
    code: REPORT_CODE,
    fightIDs: [FIGHT_ID],
    sourceID: DPS_SOURCE_ID,
  });
  const masterDataActorsData = await gqlQuery(token, MASTER_DATA_ACTORS_QUERY, {
    code: REPORT_CODE,
  });

  writeFixture("demo-timeline-casts.json", {
    pages,
    pageCount: pages.length,
    truncatedByCap,
    castsTable: castsTableData?.reportData?.report?.castsTable ?? null,
    masterData: masterDataActorsData?.reportData?.report?.masterData ?? null,
  });

  // R0-2 rate-limit sample 3/3 — at the very end of the run.
  rateLimitSamples.push(await sampleRateLimit(token, "end"));
  writeFixture("rankings-ratelimit.json", { samples: rateLimitSamples });

  console.log("All fixtures recorded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error(`Recording failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
