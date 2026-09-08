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

// Consumable categories a CONSUMABLE_CURATION row may carry — kept in sync
// with lib/cla-constants.ts's ConsumableCategory / game-data-overrides.ts's
// locally-declared mirror of the same type.
const ALL_CONSUMABLE_CATEGORIES = new Set([
  "flask",
  "battle_elixir",
  "guardian_elixir",
  "food",
  "weapon_enhancement",
  "scroll",
]);

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

// ─── Consumable name derivation ─────────────────────────────────────────────
// Unlike enchant names (which join through SpellEffect to find the owning
// spell), a consumable id IS the buff/cast spell id directly — WCL reports
// this same id as the ability, and SpellName.Name_lang for that id is the
// player-facing consumable name ("Flask of Stoneblood", "Well Fed (Fish
// Feast)", etc). A direct per-era lookup is sufficient.

function deriveConsumableNames(tables, curatedIds) {
  const { SpellName } = tables;
  const spellNameById = new Map(SpellName.map((r) => [r.ID, r.Name_lang]));
  const result = new Map();
  for (const idStr of curatedIds) {
    const name = (spellNameById.get(idStr) || "").trim();
    if (name) result.set(Number(idStr), name);
  }
  return result;
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
  for (const section of ["enchantNames", "gemNames", "consumableNames"]) {
    for (const [id, entry] of Object.entries(json[section] || {})) {
      if (!entry || typeof entry.source !== "string" || !entry.source.trim()) {
        problems.push(`${section}.${id}`);
      }
      if (!entry || typeof entry.value !== "string" || !entry.value.trim()) {
        problems.push(`${section}.${id} (missing value)`);
      }
    }
  }
  for (const [id, entry] of Object.entries(json.consumables || {})) {
    if (!entry || typeof entry.source !== "string" || !entry.source.trim()) {
      problems.push(`consumables.${id}`);
    }
    if (!entry || !ALL_CONSUMABLE_CATEGORIES.has(entry.category)) {
      problems.push(`consumables.${id} (bad category "${entry && entry.category}")`);
    }
    if (!entry || typeof entry.isSuboptimal !== "boolean") {
      problems.push(`consumables.${id} (missing isSuboptimal)`);
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

  const curatedConsumableIds = Object.keys(json.consumables || {});
  const consumableNameOverrides = new Map(
    Object.entries(json.consumableNames || {}).map(([id, entry]) => [Number(id), entry.value]),
  );

  return { json, overrideIds, curatedConsumableIds, consumableNameOverrides };
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

function emitConsumablesModule(resolvedConsumableNames) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("// ─────────────────────────────────────────────────────────────────────────");
  lines.push("// GENERATED FILE — DO NOT EDIT BY HAND.");
  lines.push("//");
  lines.push("// Written by `npm run regen-game-data` (scripts/regen-game-data.mjs).");
  lines.push("// Per-era, wago-verified consumable display names for every curated");
  lines.push("// CONSUMABLE_CURATION id (lib/generated/game-data-overrides.json's");
  lines.push("// `consumables` key) — category/isSuboptimal/betterAlternative judgment");
  lines.push("// stays hand-curated in that same file; only the name is generated here.");
  lines.push(`// Generated: ${now}`);
  lines.push("//");
  lines.push("// Re-run `npm run regen-game-data` to refresh this file. Hand edits are");
  lines.push("// silently overwritten on the next run.");
  lines.push("// ─────────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push(`// ─── Consumable Names (${resolvedConsumableNames.size} rows) ───`);
  lines.push(
    "export const CONSUMABLE_NAMES = new Map<number, { name: string; verifiedIn: string[] }>([",
  );
  for (const id of [...resolvedConsumableNames.keys()].sort((a, b) => a - b)) {
    const row = resolvedConsumableNames.get(id);
    lines.push(
      `  [${id}, { name: ${JSON.stringify(row.name)}, verifiedIn: ${JSON.stringify(row.verifiedIn)} }],`,
    );
  }
  lines.push("]);");
  lines.push("");

  const filePath = path.join(GENERATED_DIR, "game-data.consumables.ts");
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, lines.join("\n"), "utf8");
  return filePath;
}

// ─── Previous-run sidecar (Task 3: changed-values diff) ────────────────────
// Persists the previous run's resolved values so a subsequent run can report
// what changed. Lives under node_modules/.cache — a build artifact, not
// committed — mirroring the CSV cache's location and lifecycle.

const SIDECAR_PATH = path.join(CACHE_ROOT, "previous-run.json");

function loadPreviousRunSidecar() {
  if (!existsSync(SIDECAR_PATH)) return null;
  try {
    return JSON.parse(readFileSync(SIDECAR_PATH, "utf8"));
  } catch {
    return null; // corrupt/missing sidecar is never fatal — just means "no baseline"
  }
}

function buildCurrentValuesSnapshot(erasData, resolvedConsumableNames) {
  const values = {};
  for (const { era, data } of erasData) {
    for (const [id, value] of data.enchantNames) values[`${era.id}.enchantNames.${id}`] = value;
    for (const [id, value] of data.gemNames) values[`${era.id}.gemNames.${id}`] = value;
    for (const [id, info] of data.gemStats) values[`${era.id}.gemStats.${id}`] = info.statType;
  }
  for (const [id, row] of resolvedConsumableNames) values[`consumables.${id}`] = row.name;
  return values;
}

function computeChangedValues(previousSidecar, currentValues) {
  if (!previousSidecar || !previousSidecar.values) return null; // no baseline — first run
  const changed = [];
  for (const [key, newValue] of Object.entries(currentValues)) {
    const oldValue = previousSidecar.values[key];
    if (oldValue !== undefined && oldValue !== newValue) {
      changed.push({ key, oldValue, newValue });
    }
  }
  return changed;
}

function writePreviousRunSidecar(buildResolutions, eras, currentValues) {
  const builds = Object.fromEntries(eras.map((era) => [era.id, buildResolutions.get(era.id).build]));
  mkdirSync(CACHE_ROOT, { recursive: true });
  writeFileSync(
    SIDECAR_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), builds, values: currentValues }, null, 2),
    "utf8",
  );
}

// ─── Report ─────────────────────────────────────────────────────────────────

function buildReport({
  eras,
  buildResolutions,
  erasData,
  findings,
  collisions,
  opts,
  consumables,
  previousSidecar,
  changedValues,
  unverifiedRows,
}) {
  const lines = [];
  lines.push("# regen-game-data report");
  lines.push("");
  lines.push(
    "This file is generated by `scripts/regen-game-data.mjs` — do not edit it by hand, " +
      "or it will silently drift from the codebase it describes. Regenerate it with " +
      "`npm run regen-game-data -- --markdown docs/GAME-DATA-AUDIT.md`.",
  );
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Era builds");
  lines.push("");
  lines.push("| Era | Product | Resolved build | Previous build |");
  lines.push("|---|---|---|---|");
  for (const era of eras) {
    const build = buildResolutions.get(era.id);
    const prevBuild = previousSidecar?.builds?.[era.id] ?? "(no prior run recorded)";
    lines.push(`| ${era.label} (${era.id}) | ${era.product} | ${build.build} (${build.source}) | ${prevBuild} |`);
  }
  if (opts.offline) {
    lines.push("");
    lines.push("Note: `--offline` was passed; builds above were NOT resolved live from wago.tools.");
  }
  lines.push("");

  lines.push("## Row counts vs. floors");
  lines.push("");
  lines.push("| Era | Map | Rows | Floor |");
  lines.push("|---|---|---|---|");
  for (const era of eras) {
    const counts = erasData.find((e) => e.era.id === era.id)?.counts;
    const floors = ROW_FLOORS[era.id];
    if (!counts) continue;
    lines.push(`| ${era.id} | enchantNames | ${counts.enchantNames} | ${floors.enchantNames} |`);
    lines.push(`| ${era.id} | gemNames | ${counts.gemNames} | ${floors.gemNames} |`);
    lines.push(`| ${era.id} | gemStats | ${counts.gemStats} | ${floors.gemStats} |`);
  }
  if (consumables) {
    lines.push(`| (curated) | consumables | ${consumables.resolvedCount} | ${consumables.floor} |`);
  }
  lines.push("");

  lines.push("## Consumable name pass");
  lines.push("");
  if (consumables) {
    lines.push(
      `Resolved ${consumables.resolvedCount} of ${consumables.floor} curated consumable names ` +
        `(${consumables.overriddenCount} via a \`consumableNames\` override, the rest wago-derived).`,
    );
    lines.push("");
    lines.push("### Consumable-name cross-era collisions");
    lines.push("");
    if (consumables.collisions.length === 0) {
      lines.push("(none)");
    } else {
      for (const c of consumables.collisions) {
        lines.push(`- consumables id ${c.id}: ${c.eras.map((e) => `${e.eraId}=${JSON.stringify(e.value)}`).join(" vs ")}`);
      }
    }
  } else {
    lines.push("(consumable pass not run)");
  }
  lines.push("");

  lines.push("## Unverified overrides");
  lines.push("");
  lines.push(
    "Every id below came from a human, not a client dump (D-11) — each carries the " +
      "hand-authored value and the source note explaining why client data could not supply it.",
  );
  lines.push("");
  if (!unverifiedRows || unverifiedRows.length === 0) {
    lines.push("(none)");
  } else {
    for (const row of unverifiedRows) {
      lines.push(`- ${row.section} id ${row.id}: ${JSON.stringify(row.value)} — ${row.source}`);
    }
  }
  lines.push("");

  lines.push("## Changed values since the previous run");
  lines.push("");
  if (changedValues === null) {
    lines.push("(no previous run recorded — this is the first run with a persisted baseline)");
  } else if (changedValues.length === 0) {
    lines.push("(none — every resolved value matches the previous run)");
  } else {
    for (const c of changedValues) {
      lines.push(`- ${c.key}: ${JSON.stringify(c.oldValue)} -> ${JSON.stringify(c.newValue)}`);
    }
  }
  lines.push("");

  lines.push("## Cross-era collisions (enchant/gem names)");
  lines.push("");
  lines.push(
    "Composition order and per-collision resolution is decided in lib/generated/index.ts, " +
      "not here — this script only enumerates raw per-era disagreements, never resolves them.",
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
  const { json: overridesJson, overrideIds, curatedConsumableIds, consumableNameOverrides } = loadOverrides();

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
  const consumableNamesByEra = []; // [{ eraId, names: Map<id, name> }] — same insertion order as ERAS
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
    consumableNamesByEra.push({
      eraId: era.id,
      names: deriveConsumableNames(tables, curatedConsumableIds),
    });
  }

  const findings = erasData.flatMap(({ era, counts }) => checkFloors(era.id, counts));
  const collisions = computeCollisions(erasData);

  // ─── Consumable-name resolution (Task 1) ──────────────────────────────────
  // Classic+TBC wins any collision (first-resolved-era wins), NOT "newest
  // era wins" — deliberately the reverse of the plan's literal prose. Live
  // data proved 3 curated ids (28497, 33721, 22756) collide: the numeric
  // spell id is legitimately a TBC consumable, but the WotLK or Cata client's
  // SpellName table happens to reuse that same id for an unrelated spell —
  // the identical cross-era ID-reuse phenomenon 02-03 documented for
  // enchant/gem data (RESEARCH.md Pitfall 5). Every id in CONSUMABLE_CURATION
  // was originally curated as a specific era's item (see the pre-regeneration
  // lib/cla-constants.ts section comments); letting a later era silently
  // overwrite that with an unrelated same-numbered spell would be exactly the
  // wrong-recommendation-shipped-to-a-raider failure ACC-01 exists to
  // prevent. Collisions are still enumerated below, never silently dropped.
  const consumableCollisions = [];
  const seenConsumableValueByEra = new Map(); // id -> { eraId, value } (first-resolved-era wins)
  for (const { eraId, names } of consumableNamesByEra) {
    for (const [id, value] of names) {
      const prior = seenConsumableValueByEra.get(id);
      if (prior && prior.value !== value) {
        consumableCollisions.push({ id, eras: [prior, { eraId, value }] });
        continue; // first-resolved (earliest era) value stands
      }
      if (!prior) seenConsumableValueByEra.set(id, { eraId, value });
    }
  }
  const resolvedConsumableNames = new Map(); // id -> { name, verifiedIn: string[] }
  for (const idStr of curatedConsumableIds) {
    const id = Number(idStr);
    const verifiedIn = consumableNamesByEra
      .filter(({ names }) => names.get(id) !== undefined)
      .map(({ eraId }) => eraId);
    // A consumableNames override is the explicit human final say — it wins
    // even when an era DOES resolve a name, exactly like ENCHANT_NAME_OVERRIDES
    // / GEM_NAME_OVERRIDES always win in lib/generated/index.ts. This matters
    // for ids whose client-derived buff-aura label is technically resolvable
    // but too terse/ambiguous for a raid audit (e.g. scroll ids resolve to a
    // single stat word like "Agility", not "Scroll of Agility V").
    if (consumableNameOverrides.has(id)) {
      resolvedConsumableNames.set(id, { name: consumableNameOverrides.get(id), verifiedIn: [] });
      continue;
    }
    const chosen = seenConsumableValueByEra.get(id);
    if (chosen) {
      resolvedConsumableNames.set(id, {
        name: chosen.value,
        verifiedIn: verifiedIn.filter(
          (eraId) => consumableNamesByEra.find((e) => e.eraId === eraId).names.get(id) === chosen.value,
        ),
      });
    }
    // else: unresolved — deliberately absent from resolvedConsumableNames;
    // surfaced below as a gate-mode finding, never a silently-empty name.
  }
  const unresolvedConsumableIds = curatedConsumableIds
    .map(Number)
    .filter((id) => !resolvedConsumableNames.has(id));
  const consumableFloor = curatedConsumableIds.length;
  if (unresolvedConsumableIds.length > 0) {
    findings.push(
      `consumables: ${unresolvedConsumableIds.length} curated id(s) with no resolvable name from any era ` +
        `and no consumableNames override: ${unresolvedConsumableIds.join(", ")}`,
    );
  }
  if (resolvedConsumableNames.size < consumableFloor) {
    findings.push(
      `consumables: ${resolvedConsumableNames.size} resolved-or-overridden names, below floor of ${consumableFloor}`,
    );
  }

  const unverifiedRows = [];
  for (const [id, entry] of Object.entries(overridesJson.enchantNames || {})) {
    unverifiedRows.push({ section: "enchantNames", id, value: entry.value, source: entry.source });
  }
  for (const [id, entry] of Object.entries(overridesJson.gemNames || {})) {
    unverifiedRows.push({ section: "gemNames", id, value: entry.value, source: entry.source });
  }
  for (const [id, entry] of Object.entries(overridesJson.consumableNames || {})) {
    unverifiedRows.push({ section: "consumableNames", id, value: entry.value, source: entry.source });
  }

  const previousSidecar = loadPreviousRunSidecar();
  const currentValuesSnapshot = buildCurrentValuesSnapshot(erasData, resolvedConsumableNames);
  const changedValues = computeChangedValues(previousSidecar, currentValuesSnapshot);

  const reportText = buildReport({
    eras: ERAS,
    buildResolutions,
    erasData,
    findings,
    collisions,
    opts,
    consumables: {
      resolvedCount: resolvedConsumableNames.size,
      floor: consumableFloor,
      collisions: consumableCollisions,
      overriddenCount: [...resolvedConsumableNames.values()].filter((v) => v.verifiedIn.length === 0).length,
    },
    previousSidecar,
    changedValues,
    unverifiedRows,
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

  const consumablesFilePath = emitConsumablesModule(resolvedConsumableNames);
  console.log(`Wrote ${path.relative(REPO_ROOT, consumablesFilePath)}`);

  writePreviousRunSidecar(buildResolutions, ERAS, currentValuesSnapshot);

  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err.stack || err.message || err);
  process.exit(2);
});
