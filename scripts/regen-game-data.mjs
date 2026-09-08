#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// regen-game-data: turns the one-off, by-hand wago.tools verification that
// fixed PR #11's shifted enchant/gem ID maps into a repeatable, committed
// generator (ACC-01, D-09/D-10/D-11).
//
// For each of three eras (Classic+TBC, WotLK, Cata — MoP is deliberately
// out of scope, D-10), this script:
//   1. Resolves that era's current build from https://wago.tools/api/builds
//      by matching the era's own product + version prefix (never a fresh
//      guess, never one product's latest build for all three eras —
//      RESEARCH.md Pitfall 5).
//   2. Downloads (and caches) SpellItemEnchantment, SpellName, SpellEffect,
//      ItemSparse and GemProperties CSV exports for that build.
//   3. Derives ENCHANT_NAME / GEM_NAME / GEM_STAT maps:
//        - Enchant names: SpellEffect rows with Effect 53 or 54 give the
//          EffectMiscValue_0 -> SpellItemEnchantment id and the owning
//          SpellID; that spell's SpellName.Name_lang is stripped of a
//          leading "Enchant <slot> - " prefix to give a friendly label
//          (skipping internal "QA*" test spells). The label is combined
//          with SpellItemEnchantment.Name_lang (the raw stat text) as
//          "label (raw)" unless they're identical, in which case the raw
//          text alone is used ("Mongoose", not "Mongoose (Mongoose)").
//          IDs with zero derivable label fall back to the raw stat text.
//        - Gem names: ItemSparse rows with a non-zero Gem_properties field,
//          keyed by item id, named from Display_lang.
//        - Gem stats: ItemSparse.Gem_properties -> GemProperties.Enchant_ID
//          -> SpellItemEnchantment.Name_lang, classified into one
//          GemStatType via a declared, table-driven text classifier
//          (unclassifiable text -> "neutral"), with badForRoles derived
//          from the STAT_TYPE_BAD_FOR_ROLES policy in the overrides file.
//   4. Refuses to write ANY module when a map falls below its per-era,
//      per-map row-count floor (declared below, derived from the counts
//      the pre-regeneration hand-authored lib/cla-constants.ts already
//      carried for that era) — a truncated or unreachable upstream must
//      never be able to replace good data with less data. A zero-row map
//      is always fatal. This check happens BEFORE any file is written.
//   5. Enumerates cross-era ID collisions (same id, different value across
//      eras) rather than resolving them — composition order (Classic+TBC,
//      then WotLK, then Cata; later wins) stays 02-06's job.
//
// Values that genuinely cannot be derived from any client dump live only in
// lib/generated/game-data-overrides.json (the single hand-authored data
// file), each with a non-empty `source` note; every overridden id is
// EXCLUDED from the generated era modules (never present in both places)
// and registered in UNVERIFIED_OVERRIDE_IDS via game-data-overrides.ts.
//
// Modes, matching the scripts/token-audit.mjs family contract:
//   node scripts/regen-game-data.mjs                    -> gate mode: fetch,
//                                                           derive, validate
//                                                           floors; exit 1
//                                                           on ANY finding
//                                                           (no files
//                                                           written), 0 on
//                                                           success (era
//                                                           modules
//                                                           written).
//   node scripts/regen-game-data.mjs --report            -> inspection mode:
//                                                           same fetch +
//                                                           derive, full
//                                                           report printed,
//                                                           ALWAYS exits 0
//                                                           (fatal config
//                                                           errors still
//                                                           exit non-zero);
//                                                           never writes
//                                                           era modules.
//   node scripts/regen-game-data.mjs --markdown <path>   -> also writes the
//                                                           report as
//                                                           markdown to
//                                                           <path>, creating
//                                                           parent dirs.
// Additional flags:
//   --build-<eraId>=<build>  -> pin one era to an explicit build instead of
//                                resolving it from wago.tools/api/builds.
//   --offline                -> use only already-cached CSVs (and each
//                                era's lastKnownBuild), never reach the
//                                network. The report states this per era.
//   --refresh                -> bypass the CSV cache and force a re-fetch.
//
// Every override entry in lib/generated/game-data-overrides.json missing a
// non-empty `source` note is a FATAL script-configuration error (exit 2),
// checked unconditionally before mode branching — an unexplained exception
// is exactly the silent omission this gate exists to prevent (mirrors
// scripts/token-audit.mjs's allowlist-reason check).
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const GENERATED_DIR = path.join(REPO_ROOT, "lib", "generated");
const OVERRIDES_JSON_PATH = path.join(GENERATED_DIR, "game-data-overrides.json");
const CACHE_ROOT = path.join(REPO_ROOT, "node_modules", ".cache", "regen-game-data");

const WAGO_BUILDS_URL = "https://wago.tools/api/builds";
const wagoCsvUrl = (table, build) =>
  `https://wago.tools/db2/${table}/csv?build=${encodeURIComponent(build)}`;

const TABLES = ["SpellItemEnchantment", "SpellName", "SpellEffect", "ItemSparse", "GemProperties"];

// ─── Era descriptors — the script's one source of truth. Exactly three
// eras; MoP is deliberately absent (D-10). ─────────────────────────────────

const ERAS = [
  {
    id: "classic-tbc",
    label: "Classic + TBC (Anniversary)",
    product: "wow_anniversary",
    versionPrefix: "2.5.",
    lastKnownBuild: "2.5.6.69546",
    suffix: "CLASSIC_TBC",
  },
  {
    id: "wotlk",
    label: "Wrath of the Lich King",
    product: "wow_classic",
    versionPrefix: "3.4.",
    lastKnownBuild: "3.4.5.63697",
    suffix: "WOTLK",
  },
  {
    id: "cata",
    label: "Cataclysm",
    product: "wow_classic",
    versionPrefix: "4.4.",
    lastKnownBuild: "4.4.2.60895",
    suffix: "CATA",
  },
];

// Row-count floors, derived from the counts the pre-regeneration
// hand-authored lib/cla-constants.ts already carried for that era (a
// conservative lower bound — the generated, exhaustive data is expected to
// exceed these by a wide margin under normal operation).
const ROW_FLOORS = {
  "classic-tbc": { enchantNames: 130, gemNames: 100, gemStats: 100 },
  wotlk: { enchantNames: 80, gemNames: 120, gemStats: 120 },
  cata: { enchantNames: 70, gemNames: 100, gemStats: 100 },
};

// ─── GemStatType classifier — table-driven, checked in priority order so a
// combo stat text ("+5 Strength and +4 Critical Rating") classifies by its
// primary stat rather than whichever pattern happens to match first in the
// string. Unclassifiable text (resistances, spell penetration, mp5, meta-gem
// proc text, resilience — none of which have a GemStatType) -> "neutral",
// counted in the report rather than guessed at. ────────────────────────────

const GEM_STAT_PATTERNS = [
  ["spell_power", /spell power|spell damage|damage and healing|healing spells|spell dmg/i],
  ["attack_power", /attack power/i],
  ["strength", /strength/i],
  ["agility", /agility/i],
  ["intellect", /intellect/i],
  ["spirit", /spirit/i],
  ["stamina", /stamina/i],
  ["defense", /defense/i],
  ["dodge", /dodge/i],
  ["parry", /parry/i],
  ["hit", /hit rating/i],
  ["crit", /critical/i],
  ["haste", /haste/i],
  ["expertise", /expertise/i],
  ["armor_penetration", /armor penetration/i],
];

function classifyGemStat(rawText) {
  const text = (rawText || "").trim();
  if (!text) return "neutral";
  for (const [statType, re] of GEM_STAT_PATTERNS) {
    if (re.test(text)) return statType;
  }
  return "neutral";
}

// ─── CSV parsing — RFC4180-ish, header-indexed so an upstream column
// reorder cannot silently shift values into the wrong field. Handles quoted
// fields containing commas and doubled-quote escapes ("" -> "). ───────────

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip — \n handles the row break
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseCsvIndexed(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const header = rows[0];
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length !== header.length) continue; // trailing blank line, etc.
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = r[c];
    records.push(obj);
  }
  return records;
}

// ─── Version comparison (numeric per dot-separated component — a string
// sort would put "2.5.6.9" ahead of "2.5.6.69546"). ────────────────────────

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

// ─── Build resolution ──────────────────────────────────────────────────────

async function fetchBuildsIndex() {
  const res = await fetch(WAGO_BUILDS_URL);
  if (!res.ok) {
    throw new BuildResolutionError(
      `https://wago.tools/api/builds returned HTTP ${res.status}`,
    );
  }
  return res.json();
}

class BuildResolutionError extends Error {}

function resolveEraBuild(era, buildsIndex) {
  const candidates = (buildsIndex[era.product] || []).filter((b) =>
    b.version.startsWith(era.versionPrefix),
  );
  if (candidates.length === 0) {
    throw new BuildResolutionError(
      `No build found for era "${era.id}" (product=${era.product}, versionPrefix=${era.versionPrefix})`,
    );
  }
  let best = candidates[0];
  for (const c of candidates) {
    if (compareVersions(c.version, best.version) > 0) best = c;
  }
  return best.version;
}

async function resolveAllBuilds(eras, opts) {
  const resolved = new Map(); // eraId -> { build, source }

  for (const era of eras) {
    if (opts.pinnedBuilds.has(era.id)) {
      resolved.set(era.id, { build: opts.pinnedBuilds.get(era.id), source: "pinned" });
    }
  }

  if (opts.offline) {
    for (const era of eras) {
      if (!resolved.has(era.id)) {
        resolved.set(era.id, { build: era.lastKnownBuild, source: "offline-fallback" });
      }
    }
    return resolved;
  }

  const needsNetwork = eras.some((era) => !resolved.has(era.id));
  if (needsNetwork) {
    const buildsIndex = await fetchBuildsIndex();
    for (const era of eras) {
      if (resolved.has(era.id)) continue;
      const build = resolveEraBuild(era, buildsIndex);
      resolved.set(era.id, { build, source: "resolved" });
    }
  }

  // Sanity checks — Pitfall 5: an era resolving to a build whose prefix
  // doesn't match its own, or two eras colliding on the same build string,
  // is fatal.
  for (const era of eras) {
    const { build } = resolved.get(era.id);
    if (!build.startsWith(era.versionPrefix)) {
      throw new BuildResolutionError(
        `Era "${era.id}" resolved to build ${build}, which does not start with its own prefix "${era.versionPrefix}"`,
      );
    }
  }
  const buildStrings = eras.map((era) => resolved.get(era.id).build);
  const seen = new Set();
  for (const b of buildStrings) {
    if (seen.has(b)) {
      throw new BuildResolutionError(
        `Two or more eras resolved to the identical build "${b}" — refusing to continue (Pitfall 5)`,
      );
    }
    seen.add(b);
  }

  return resolved;
}

// ─── CSV fetch + cache ──────────────────────────────────────────────────────

function cachePathFor(build, table) {
  return path.join(CACHE_ROOT, build, `${table}.csv`);
}

async function fetchTableCsv(table, build, opts) {
  const cachePath = cachePathFor(build, table);
  if (existsSync(cachePath) && !opts.refresh) {
    return readFileSync(cachePath, "utf8");
  }
  if (opts.offline) {
    throw new Error(
      `--offline was passed but no cached CSV exists at ${cachePath} — cannot proceed without network access.`,
    );
  }
  const res = await fetch(wagoCsvUrl(table, build));
  if (!res.ok) {
    throw new Error(`Fetching ${table} for build ${build} returned HTTP ${res.status}`);
  }
  const text = await res.text();
  mkdirSync(path.dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, text, "utf8");
  return text;
}

async function fetchAllTables(build, opts) {
  const entries = await Promise.all(
    TABLES.map(async (table) => [table, parseCsvIndexed(await fetchTableCsv(table, build, opts))]),
  );
  return Object.fromEntries(entries);
}

// ─── Derivation ─────────────────────────────────────────────────────────────

const ENCHANT_SLOT_PREFIX_RE = /^Enchant\s+[^-]+-\s*/i;

function deriveEnchantNames(tables, overrideIds) {
  const { SpellItemEnchantment, SpellName, SpellEffect } = tables;

  const spellNameById = new Map(SpellName.map((r) => [r.ID, r.Name_lang]));

  // Group SpellEffect rows (Effect 53 or 54 = apply enchantment) by the
  // SpellItemEnchantment id they reference (EffectMiscValue_0), carrying the
  // owning spell's id and name.
  const candidatesByEnchant = new Map();
  for (const r of SpellEffect) {
    if (r.Effect !== "53" && r.Effect !== "54") continue;
    const enchantId = r.EffectMiscValue_0;
    if (!enchantId || enchantId === "0") continue;
    const spellId = r.SpellID;
    const name = spellNameById.get(spellId) || "";
    if (!candidatesByEnchant.has(enchantId)) candidatesByEnchant.set(enchantId, []);
    candidatesByEnchant.get(enchantId).push({ spellId: Number(spellId), name });
  }

  const result = new Map();
  for (const enchRow of SpellItemEnchantment) {
    const idNum = Number(enchRow.ID);
    if (overrideIds.has(idNum)) continue; // overridden ids never appear in generated modules

    const rawText = (enchRow.Name_lang || "").trim();
    const candidates = candidatesByEnchant.get(enchRow.ID) || [];
    // Internal "QA*" spell names are dev/test labels, never player-facing —
    // exclude them from the friendly-label pool. If every candidate is a QA
    // spell, treat this as "no label" (fall back to raw stat text) rather
    // than surfacing an internal test name to a raider.
    const nonQa = candidates.filter((c) => !/^QA/i.test(c.name));
    let label = "";
    if (nonQa.length > 0) {
      const pool = [...nonQa].sort((a, b) => a.spellId - b.spellId);
      label = pool[0].name.replace(ENCHANT_SLOT_PREFIX_RE, "").trim();
    }

    let finalName;
    if (label && rawText) {
      finalName = label.toLowerCase() === rawText.toLowerCase() ? label : `${label} (${rawText})`;
    } else {
      finalName = label || rawText;
    }
    if (!finalName) continue; // no derivable name at all (e.g. id 88 — see overrides)
    result.set(idNum, finalName);
  }
  return result;
}

function deriveGemData(tables, overrideIds) {
  const { ItemSparse, GemProperties, SpellItemEnchantment } = tables;

  const enchantById = new Map(SpellItemEnchantment.map((r) => [r.ID, r.Name_lang]));
  const enchantIdByGemProp = new Map(GemProperties.map((r) => [r.ID, r.Enchant_ID]));

  const gemNames = new Map();
  const gemStats = new Map();

  for (const item of ItemSparse) {
    const gemProp = item.Gem_properties;
    if (!gemProp || gemProp === "0") continue;
    const idNum = Number(item.ID);
    if (overrideIds.has(idNum)) continue;

    const name =
      (item.Display_lang || item.Display1_lang || item.Display2_lang || item.Display3_lang || "").trim();
    if (!name) continue;

    gemNames.set(idNum, name);

    const enchantId = enchantIdByGemProp.get(gemProp);
    const rawStatText = enchantId ? (enchantById.get(enchantId) || "").trim() : "";
    const statType = classifyGemStat(rawStatText);
    gemStats.set(idNum, {
      name,
      statType,
      badForRoles: [], // filled in by the caller from STAT_TYPE_BAD_FOR_ROLES
    });
  }

  return { gemNames, gemStats };
}

// ─── Overrides file ─────────────────────────────────────────────────────────

const ALL_GEM_STAT_TYPES = [
  "spell_hit",
  "melee_hit",
  "spell_power",
  "attack_power",
  "strength",
  "agility",
  "intellect",
  "spirit",
  "defense",
  "dodge",
  "parry",
  "stamina",
  "haste",
  "crit",
  "hit",
  "expertise",
  "armor_penetration",
  "neutral",
];

function loadOverrides() {
  const raw = readFileSync(OVERRIDES_JSON_PATH, "utf8");
  const json = JSON.parse(raw);

  const problems = [];
  for (const section of ["enchantNames", "gemNames"]) {
    for (const [id, entry] of Object.entries(json[section] || {})) {
      if (!entry || typeof entry.source !== "string" || !entry.source.trim()) {
        problems.push(`${section}.${id}`);
      }
      if (!entry || typeof entry.value !== "string" || !entry.value.trim()) {
        problems.push(`${section}.${id} (missing value)`);
      }
    }
  }
  if (problems.length > 0) {
    console.error(
      `FATAL: override entr${problems.length === 1 ? "y" : "ies"} with an empty or missing source/value: ` +
        problems.join(", ") +
        " — an unexplained exception is a silent omission, not an override.",
    );
    process.exit(2);
  }
  if (!json.statTypeBadForRoles) {
    console.error("FATAL: game-data-overrides.json is missing statTypeBadForRoles.");
    process.exit(2);
  }
  for (const statType of ALL_GEM_STAT_TYPES) {
    if (!Array.isArray(json.statTypeBadForRoles[statType])) {
      console.error(`FATAL: statTypeBadForRoles is missing an entry for GemStatType "${statType}".`);
      process.exit(2);
    }
  }

  const overrideIds = new Set();
  for (const section of ["enchantNames", "gemNames"]) {
    for (const id of Object.keys(json[section] || {})) overrideIds.add(Number(id));
  }

  return { json, overrideIds };
}

// ─── Row-count floors ───────────────────────────────────────────────────────

function checkFloors(eraId, counts) {
  const floors = ROW_FLOORS[eraId];
  const findings = [];
  for (const mapName of ["enchantNames", "gemNames", "gemStats"]) {
    const count = counts[mapName];
    const floor = floors[mapName];
    if (count === 0) {
      findings.push(`${eraId}.${mapName}: zero rows (always fatal)`);
    } else if (count < floor) {
      findings.push(`${eraId}.${mapName}: ${count} rows, below floor of ${floor}`);
    }
  }
  return findings;
}

// ─── Cross-era collisions ───────────────────────────────────────────────────

function computeCollisions(erasData) {
  const collisions = [];
  for (const mapName of ["enchantNames", "gemNames"]) {
    const seenAt = new Map(); // id -> { eraId, value }
    for (const { era, data } of erasData) {
      for (const [id, value] of data[mapName]) {
        const prior = seenAt.get(id);
        if (prior && prior.value !== value) {
          collisions.push({
            map: mapName,
            id,
            eras: [
              { era: prior.eraId, value: prior.value },
              { era: era.id, value },
            ],
          });
        }
        seenAt.set(id, { eraId: era.id, value });
      }
    }
  }
  return collisions;
}

// ─── Emission ───────────────────────────────────────────────────────────────

function emitEraModule(era, buildInfo, data) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("// ─────────────────────────────────────────────────────────────────────────");
  lines.push("// GENERATED FILE — DO NOT EDIT BY HAND.");
  lines.push("//");
  lines.push("// Written by `npm run regen-game-data` (scripts/regen-game-data.mjs).");
  lines.push(`// Era: ${era.label}`);
  lines.push(`// Product: ${era.product}`);
  lines.push(`// Build: ${buildInfo.build} (resolution: ${buildInfo.source})`);
  lines.push(`// Source tables: ${TABLES.join(", ")}`);
  lines.push(`// Generated: ${now}`);
  lines.push("//");
  lines.push("// Re-run `npm run regen-game-data` to refresh this file. Hand edits are");
  lines.push("// silently overwritten on the next run and defeat the purpose of this");
  lines.push("// pipeline (ACC-01, D-09) — values that cannot be derived from a client");
  lines.push("// dump belong in lib/generated/game-data-overrides.json instead.");
  lines.push("// ─────────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push('import type { GemStatType, GeneratedGemInfo } from "./game-data-overrides";');
  lines.push("");

  lines.push(`// ─── ${era.label}: Enchant Names (${data.enchantNames.size} rows) ───`);
  lines.push(`export const ENCHANT_NAME_${era.suffix} = new Map<number, string>([`);
  for (const id of [...data.enchantNames.keys()].sort((a, b) => a - b)) {
    lines.push(`  [${id}, ${JSON.stringify(data.enchantNames.get(id))}],`);
  }
  lines.push("]);");
  lines.push("");

  lines.push(`// ─── ${era.label}: Gem Names (${data.gemNames.size} rows) ───`);
  lines.push(`export const GEM_NAME_${era.suffix} = new Map<number, string>([`);
  for (const id of [...data.gemNames.keys()].sort((a, b) => a - b)) {
    lines.push(`  [${id}, ${JSON.stringify(data.gemNames.get(id))}],`);
  }
  lines.push("]);");
  lines.push("");

  lines.push(`// ─── ${era.label}: Gem Stats (${data.gemStats.size} rows) ───`);
  lines.push(`export const GEM_STAT_${era.suffix} = new Map<number, GeneratedGemInfo>([`);
  for (const id of [...data.gemStats.keys()].sort((a, b) => a - b)) {
    const info = data.gemStats.get(id);
    const badForRoles = JSON.stringify(info.badForRoles);
    lines.push(
      `  [${id}, { name: ${JSON.stringify(info.name)}, statType: ${JSON.stringify(info.statType)} as GemStatType, badForRoles: ${badForRoles} as GeneratedGemInfo["badForRoles"] }],`,
    );
  }
  lines.push("]);");
  lines.push("");

  const filePath = path.join(GENERATED_DIR, `game-data.${era.id}.ts`);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, lines.join("\n"), "utf8");
  return filePath;
}

// ─── Report ─────────────────────────────────────────────────────────────────

function buildReport({ eras, buildResolutions, erasData, findings, collisions, opts }) {
  const lines = [];
  lines.push("# regen-game-data report");
  lines.push("");
  lines.push(
    "Generated by `scripts/regen-game-data.mjs`. Regenerate with " +
      "`npm run regen-game-data -- --markdown docs/GAME-DATA-AUDIT.md` " +
      "(plan 02-06) — never edit this section by hand.",
  );
  lines.push("");

  for (const era of eras) {
    const build = buildResolutions.get(era.id);
    const counts = erasData.find((e) => e.era.id === era.id)?.counts;
    lines.push(`## ${era.label} (${era.id})`);
    lines.push("");
    lines.push(`- Product: ${era.product}`);
    lines.push(`- Resolved build: ${build.build} (${build.source})`);
    if (opts.offline) lines.push("- Note: --offline was passed; build was NOT resolved live from wago.tools.");
    if (counts) {
      const floors = ROW_FLOORS[era.id];
      lines.push(`- enchantNames: ${counts.enchantNames} rows (floor: ${floors.enchantNames})`);
      lines.push(`- gemNames: ${counts.gemNames} rows (floor: ${floors.gemNames})`);
      lines.push(`- gemStats: ${counts.gemStats} rows (floor: ${floors.gemStats})`);
    }
    lines.push("");
  }

  lines.push("## Cross-era collisions");
  lines.push("");
  lines.push(
    "Composition order is Classic+TBC, then WotLK, then Cata — a later era wins " +
      "for a colliding id, matching lib/cla-constants.ts's current section order. " +
      "Collisions are enumerated here, never resolved silently.",
  );
  lines.push("");
  if (collisions.length === 0) {
    lines.push("(none)");
  } else {
    for (const c of collisions) {
      lines.push(
        `- ${c.map} id ${c.id}: ` +
          c.eras.map((e) => `${e.era}=${JSON.stringify(e.value)}`).join(" vs "),
      );
    }
  }
  lines.push("");

  lines.push("## Row-count floor findings");
  lines.push("");
  lines.push(findings.length === 0 ? "(none — all maps meet their floor)" : findings.map((f) => `- ${f}`).join("\n"));
  lines.push("");

  return lines.join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {
    reportMode: false,
    markdownPath: null,
    offline: false,
    refresh: false,
    pinnedBuilds: new Map(),
  };
  for (const arg of argv) {
    if (arg === "--report") opts.reportMode = true;
    else if (arg === "--offline") opts.offline = true;
    else if (arg === "--refresh") opts.refresh = true;
    else if (arg === "--markdown") continue; // value handled below
    else if (arg.startsWith("--markdown=")) opts.markdownPath = arg.slice("--markdown=".length);
    else {
      const buildMatch = arg.match(/^--build-([a-z0-9-]+)=(.+)$/);
      if (buildMatch) opts.pinnedBuilds.set(buildMatch[1], buildMatch[2]);
    }
  }
  const mdIdx = argv.indexOf("--markdown");
  if (mdIdx !== -1 && argv[mdIdx + 1]) opts.markdownPath = argv[mdIdx + 1];
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // Unconditional fatal check, independent of mode — mirrors token-audit's
  // validateAllowlist().
  const { json: overridesJson, overrideIds } = loadOverrides();

  let buildResolutions;
  try {
    buildResolutions = await resolveAllBuilds(ERAS, opts);
  } catch (err) {
    if (err instanceof BuildResolutionError) {
      console.error(`FATAL: ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  const erasData = [];
  for (const era of ERAS) {
    const build = buildResolutions.get(era.id).build;
    const tables = await fetchAllTables(build, opts);
    const enchantNames = deriveEnchantNames(tables, overrideIds);
    const { gemNames, gemStats } = deriveGemData(tables, overrideIds);
    for (const info of gemStats.values()) {
      info.badForRoles = overridesJson.statTypeBadForRoles[info.statType] || [];
    }
    erasData.push({
      era,
      data: { enchantNames, gemNames, gemStats },
      counts: {
        enchantNames: enchantNames.size,
        gemNames: gemNames.size,
        gemStats: gemStats.size,
      },
    });
  }

  const findings = erasData.flatMap(({ era, counts }) => checkFloors(era.id, counts));
  const collisions = computeCollisions(erasData);

  const reportText = buildReport({
    eras: ERAS,
    buildResolutions,
    erasData,
    findings,
    collisions,
    opts,
  });

  if (opts.markdownPath) {
    const absPath = path.isAbsolute(opts.markdownPath)
      ? opts.markdownPath
      : path.resolve(process.cwd(), opts.markdownPath);
    mkdirSync(path.dirname(absPath), { recursive: true });
    writeFileSync(absPath, reportText + "\n", "utf8");
  }

  console.log(reportText);

  if (opts.reportMode) {
    process.exit(0);
  }

  if (findings.length > 0) {
    console.error(`\nFATAL: ${findings.length} row-count floor finding(s) — no files written.`);
    process.exit(1);
  }

  for (const { era, data } of erasData) {
    const filePath = emitEraModule(era, buildResolutions.get(era.id), data);
    console.log(`Wrote ${path.relative(REPO_ROOT, filePath)}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err.stack || err.message || err);
  process.exit(2);
});
