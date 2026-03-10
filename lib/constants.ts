export const CLASS_COLORS: Record<string, string> = {
  Warrior: "#C79C6E",
  Paladin: "#F58CBA",
  Hunter: "#ABD473",
  Rogue: "#FFF569",
  Priest: "#FFFFFF",
  Shaman: "#0070DE",
  Mage: "#69CCF0",
  Warlock: "#9482C9",
  Druid: "#FF7D0A",
  DeathKnight: "#C41E3A",
  Monk: "#00FF96",
};

// WCL CombatantInfo gear array follows WoW's INVSLOT enum (1-indexed), offset by -1.
// Index 3 is Shirt (INVSLOT_BODY=4), usually empty.
export const GEAR_SLOTS: Record<number, string> = {
  0: "Head",
  1: "Neck",
  2: "Shoulder",
  3: "Shirt",
  4: "Chest",
  5: "Waist",
  6: "Legs",
  7: "Feet",
  8: "Wrist",
  9: "Hands",
  10: "Finger 1",
  11: "Finger 2",
  12: "Trinket 1",
  13: "Trinket 2",
  14: "Back",
  15: "Main Hand",
  16: "Off Hand",
  17: "Ranged / Relic",
};

export const SPEC_ICONS: Record<string, string> = {
  // Warrior
  Arms: "ability_rogue_eviscerate",
  Fury: "ability_warrior_innerrage",
  Protection_Warrior: "ability_warrior_defensivestance",
  // Paladin
  Holy_Paladin: "spell_holy_holybolt",
  Retribution: "spell_holy_auraoflight",
  Protection_Paladin: "spell_holy_devotionaura",
  // Hunter
  "Beast Mastery": "ability_hunter_beasttaming",
  Marksmanship: "ability_hunter_focusedaim",
  Survival: "ability_hunter_swiftstrike",
  // Rogue
  Assassination: "ability_rogue_eviscerate",
  Combat: "ability_backstab",
  Subtlety: "ability_stealth",
  // Priest
  Discipline: "spell_holy_powerwordshield",
  Holy_Priest: "spell_holy_guardianspirit",
  Shadow: "spell_shadow_shadowwordpain",
  // Shaman
  Elemental: "spell_nature_lightning",
  Enhancement: "spell_nature_lightningshield",
  Restoration_Shaman: "spell_nature_magicimmunity",
  // Mage
  Arcane: "spell_holy_magicalsentry",
  Fire: "spell_fire_firebolt02",
  Frost_Mage: "spell_frost_frostbolt02",
  // Warlock
  Affliction: "spell_shadow_deathcoil",
  Demonology: "spell_shadow_metamorphosis",
  Destruction: "spell_shadow_rainoffire",
  // Druid
  Balance: "spell_nature_starfall",
  "Feral Combat": "ability_racial_bearform",
  Restoration_Druid: "spell_nature_healingtouch",
};

export const WCL_API_URL = "https://www.warcraftlogs.com/api/v2/client";
export const WCL_TOKEN_URL = "https://www.warcraftlogs.com/oauth/token";

export const ANALYSIS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
export const TOKEN_EXPIRY_BUFFER = 60; // seconds before expiry to refresh

export const TOP_PLAYERS_TO_FETCH = 3;

export const HEALER_SPECS = new Set([
  "Restoration",
  "Holy",
  "Discipline",
  "Mistweaver",
]);

export function isHealerSpec(spec: string): boolean {
  return HEALER_SPECS.has(spec);
}

// Wowhead tooltip domain strings (matches EnvKey in tooltips.js)
// classic=4(vanilla), tbc=5, wrath=8, cata=11, mists=15
export type WowheadDomain = "classic" | "tbc" | "wrath" | "cata" | "mists";

// Classic Era / Season of Discovery zone names
const CLASSIC_ZONE_NAMES = [
  "Molten Core", "Onyxia", "Blackwing Lair", "Zul'Gurub",
  "Ruins of Ahn'Qiraj", "Temple of Ahn'Qiraj", "Naxxramas",
  // Season of Discovery
  "Blackfathom Deeps", "Gnomeregan", "Sunken Temple",
  // Anniversary / Classic Era variants
  "World Bosses",
];

// TBC raid/dungeon zone names from WCL
const TBC_ZONE_NAMES = [
  "Karazhan", "Gruul", "Magtheridon", "Serpentshrine", "Tempest Keep",
  "Hyjal", "Black Temple", "Sunwell", "Zul'Aman",
];

const WRATH_ZONE_NAMES = [
  "Obsidian Sanctum", "Eye of Eternity", "Ulduar",
  "Trial of the Crusader", "Trial of the Grand Crusader",
  "Icecrown Citadel", "Ruby Sanctum", "Vault of Archavon",
];

const CATA_ZONE_NAMES = [
  "Blackwing Descent", "Bastion of Twilight", "Throne of the Four Winds",
  "Firelands", "Dragon Soul", "Baradin Hold",
];

const MOP_ZONE_NAMES = [
  "Mogu'shan Vaults", "Heart of Fear", "Terrace of Endless Spring",
  "Throne of Thunder", "Siege of Orgrimmar",
];

// ─── Raid Overview (RPB) Constants ───────────────────────────────────

import type { RaidRole } from "./wcl-types";

// Map class+spec → raid role
const ROLE_MAP: Record<string, Record<string, RaidRole>> = {
  Warrior: { Arms: "Physical", Fury: "Physical", Protection: "Physical", __default: "Physical" },
  Paladin: { Holy: "Healer", Retribution: "Physical", Protection: "Tank", __default: "Physical" },
  Hunter: { __default: "Physical" },
  Rogue: { __default: "Physical" },
  Priest: { Discipline: "Healer", Holy: "Healer", Shadow: "Caster", __default: "Caster" },
  Shaman: { Elemental: "Caster", Enhancement: "Physical", Restoration: "Healer", __default: "Caster" },
  Mage: { __default: "Caster" },
  Warlock: { __default: "Caster" },
  Druid: { Balance: "Caster", "Feral Combat": "Physical", Feral: "Physical", Restoration: "Healer", Guardian: "Tank", __default: "Physical" },
  DeathKnight: { Blood: "Tank", Frost: "Physical", Unholy: "Physical", __default: "Physical" },
  Monk: { Brewmaster: "Tank", Windwalker: "Physical", Mistweaver: "Healer", __default: "Physical" },
};

// Protection warriors need to be classified as Tank via spec icon detection
// WCL gives icons like "Warrior-Protection" for tanks
export function classifyRole(className: string, spec: string, icon?: string): RaidRole {
  // Check icon for tank detection (e.g. "Warrior-Protection")
  if (icon) {
    const iconSpec = icon.split("-")[1];
    if (iconSpec === "Protection" && (className === "Warrior" || className === "Paladin")) {
      return "Tank";
    }
    if (iconSpec === "Guardian" && className === "Druid") return "Tank";
    if (iconSpec === "Blood" && className === "DeathKnight") return "Tank";
    if (iconSpec === "Brewmaster" && className === "Monk") return "Tank";
  }

  const classMap = ROLE_MAP[className];
  if (!classMap) return "Physical";
  return classMap[spec] ?? classMap.__default ?? "Physical";
}

export const ROLE_SORT_ORDER: Record<RaidRole, number> = {
  Tank: 0,
  Healer: 1,
  Caster: 2,
  Physical: 3,
};

export const ROLE_COLORS: Record<RaidRole, string> = {
  Tank: "#60A5FA",   // blue-400
  Healer: "#4ADE80", // green-400
  Caster: "#C084FC",  // purple-400
  Physical: "#FBBF24", // amber-400
};

// Consumable buff spell IDs for WotLK/Cata detection from CombatantInfo auras
// These are well-known buff GUIDs; we check if any aura matches
export const FLASK_BUFF_IDS = new Set([
  // WotLK Flasks
  53758, 53755, 53760, 54212, 62380,
  // Cata Flasks
  79469, 79470, 79471, 79472, 94160,
  // TBC Flasks
  17626, 17627, 17628, 17629, 28518, 28519, 28520, 28521, 28540,
  // Classic Flasks
  13510, 13511, 13512, 13513,
  // MoP Flasks
  105689, 105691, 105693, 105694, 105696, 105617,
]);

// Battle + Guardian elixirs (if no flask, check for elixirs)
export const ELIXIR_BUFF_IDS = new Set([
  // Classic Battle Elixirs
  17538, // Elixir of the Mongoose (+25 agi, +2% crit)
  17537, // Elixir of Brute Force (+18 str/stam)
  11334, // Elixir of Greater Agility (+25 agi)
  11405, // Elixir of the Giants (+25 str)
  17535, // Elixir of the Sages (+18 int/spirit)
  26276, // Elixir of Greater Firepower (+40 fire dmg)
  11474, // Elixir of Shadow Power (+40 shadow dmg)
  21920, // Elixir of Frost Power (+15 frost dmg)
  11406, // Elixir of Demonslaying (+265 AP vs demons)
  // Classic Guardian Elixirs
  11348, // Elixir of Superior Defense (+450 armor)
  11396, // Elixir of Greater Intellect (+25 int)
  3593,  // Elixir of Fortitude (+120 HP)
  11371, // Gift of Arthas (+10 shadow resist)
  // TBC Battle Elixirs
  28497, 28490, 28491, 28493, 28501, 28503, 33720, 33721, 33726, 38954, 54452,
  // TBC Guardian Elixirs
  28502, 28509, 28514, 39625, 39627, 39628,
  // WotLK Battle Elixirs
  53746, 53748, 53749, 60340, 60341, 60344, 60345, 60346,
  // WotLK Guardian Elixirs
  53747, 53751, 53752, 53763, 53764, 60343, 60347,
  // Cata Elixirs
  79474, 79468, 79481, 79632, 79477, 79480, 79631,
  // MoP Battle Elixirs
  105682, 105683, 105684, 105685, 105686, 105688,
  // MoP Guardian Elixirs
  105681, 105687,
]);

export const FOOD_BUFF_IDS = new Set([
  // Well Fed (generic buff ID used by all food)
  57294, 57399, 25661,
  // TBC food buffs
  33254, 33256, 33257, 33259, 33261, 33263, 33265, 33268,
  35272, 43764, 43722, 43730, 24799, 24870, 44106, 46687,
  // WotLK specific food buffs
  57325, 57327, 57329, 57332, 57334, 57356, 57358, 57360, 57362, 57365, 57367, 57371, 57373,
  // Cata food buffs
  87545, 87546, 87547, 87548, 87549, 87550, 87551, 87552, 87554, 87555, 87556, 87557,
  // Fish Feast / Great Feast
  58067,
  // MoP food buffs (300/275/250 stat tiers)
  104272, 104275, 104277, 104280, 104283, // 300 tier (Str/Agi/Int/Spirit/Stam)
  104271, 104274, 104276, 104279, 104282, // 275 tier
  104267, 104273, 104264, 104278, 104281, // 250 tier
  125113, 125115, 125106, 125108, 125104, // Hit/Expertise foods
]);

export const WEAPON_ENHANCEMENT_IDS = new Set([
  // Classic Oils (use spell IDs)
  25120, // Brilliant Mana Oil
  25123, // Brilliant Mana Oil (alt)
  25122, // Brilliant Wizard Oil
  // Classic Sharpening Stones / Weightstones (use spell IDs)
  22756, // Elemental Sharpening Stone
  16138, // Dense Sharpening Stone
  16622, // Dense Weightstone
  // TBC Oils (use spell IDs)
  28017, // Superior Wizard Oil
  28013, // Superior Mana Oil
  28898, // Blessed Wizard Oil
  // TBC Sharpening Stones / Weightstones (use spell IDs)
  29453, // Adamantite Sharpening Stone
  34340, // Adamantite Weightstone
  29452, // Fel Sharpening Stone
  // WotLK
  28093, // Lightning Speed
  28095, // Deathfrost
  55836, // Titanium Weapon Chain
  // Cata
  96264, 96294,
]);

// Enchantable gear slot indices (0-indexed matching WCL gear array)
export const ENCHANTABLE_SLOTS = new Set([
  0,   // Head
  2,   // Shoulder
  4,   // Chest
  6,   // Legs
  7,   // Feet
  8,   // Wrist
  9,   // Hands
  14,  // Back
  15,  // Main Hand
]);

// ─── Performance Grade ──────────────────────────────────────────────

export type PerformanceGrade = "S" | "A" | "B" | "C" | "D";

export function getPerformanceGrade(percentile: number): PerformanceGrade {
  if (percentile >= 95) return "S";
  if (percentile >= 75) return "A";
  if (percentile >= 50) return "B";
  if (percentile >= 25) return "C";
  return "D";
}

export const GRADE_COLORS: Record<PerformanceGrade, string> = {
  S: "text-amber-400 bg-amber-400/20 border-amber-400/30",
  A: "text-purple-400 bg-purple-400/20 border-purple-400/30",
  B: "text-blue-400 bg-blue-400/20 border-blue-400/30",
  C: "text-green-400 bg-green-400/20 border-green-400/30",
  D: "text-gray-400 bg-gray-400/20 border-gray-400/30",
};

// Shared percentile-based color utility
export function percentileColor(p: number): string {
  if (p >= 99) return "text-amber-400";
  if (p >= 95) return "text-orange-400";
  if (p >= 75) return "text-purple-400";
  if (p >= 50) return "text-blue-400";
  if (p >= 25) return "text-green-400";
  return "text-gray-400";
}

export function percentileBg(p: number): string {
  if (p >= 99) return "bg-amber-400/20 text-amber-400 border-amber-400/30";
  if (p >= 95) return "bg-orange-400/20 text-orange-400 border-orange-400/30";
  if (p >= 75) return "bg-purple-400/20 text-purple-400 border-purple-400/30";
  if (p >= 50) return "bg-blue-400/20 text-blue-400 border-blue-400/30";
  if (p >= 25) return "bg-green-400/20 text-green-400 border-green-400/30";
  return "bg-gray-400/20 text-gray-400 border-gray-400/30";
}

// TBC/Classic talent tree names per class (order matches CombatantInfo talents array)
export const CLASS_TALENT_TREES: Record<string, string[]> = {
  Warrior: ["Arms", "Fury", "Protection"],
  Paladin: ["Holy", "Protection", "Retribution"],
  Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  Rogue: ["Assassination", "Combat", "Subtlety"],
  Priest: ["Discipline", "Holy", "Shadow"],
  Shaman: ["Elemental", "Enhancement", "Restoration"],
  Mage: ["Arcane", "Fire", "Frost"],
  Warlock: ["Affliction", "Demonology", "Destruction"],
  Druid: ["Balance", "Feral Combat", "Restoration"],
  DeathKnight: ["Blood", "Frost", "Unholy"],
  Monk: ["Brewmaster", "Mistweaver", "Windwalker"],
};

export function getWowheadDomain(zoneName?: string): WowheadDomain {
  if (!zoneName) return "classic";
  const lower = zoneName.toLowerCase();
  if (MOP_ZONE_NAMES.some((z) => lower.includes(z.toLowerCase()))) return "mists";
  if (CATA_ZONE_NAMES.some((z) => lower.includes(z.toLowerCase()))) return "cata";
  if (WRATH_ZONE_NAMES.some((z) => lower.includes(z.toLowerCase()))) return "wrath";
  if (TBC_ZONE_NAMES.some((z) => lower.includes(z.toLowerCase()))) return "tbc";
  if (CLASSIC_ZONE_NAMES.some((z) => lower.includes(z.toLowerCase()))) return "classic";
  // Default to classic for unrecognized zones
  return "classic";
}
