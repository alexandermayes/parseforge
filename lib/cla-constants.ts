// ─── CLA Consumable Database ────────────────────────────────────────
// Master lookup: spell ID → name, category, suboptimality metadata

export type ConsumableCategory =
  | "flask"
  | "battle_elixir"
  | "guardian_elixir"
  | "food"
  | "weapon_enhancement"
  | "scroll";

export interface ConsumableInfo {
  name: string;
  category: ConsumableCategory;
  isSuboptimal: boolean;
  betterAlternative?: string;
}

export const CONSUMABLE_DB = new Map<number, ConsumableInfo>([
  // ─── WotLK Flasks ──────────────────────────────────────────────────
  [53758, { name: "Flask of Stoneblood", category: "flask", isSuboptimal: false }],
  [53755, { name: "Flask of the Frost Wyrm", category: "flask", isSuboptimal: false }],
  [53760, { name: "Flask of Endless Rage", category: "flask", isSuboptimal: false }],
  [54212, { name: "Flask of Pure Mojo", category: "flask", isSuboptimal: false }],
  [62380, { name: "Flask of Lesser Resistance (Frostfire)", category: "flask", isSuboptimal: true, betterAlternative: "Flask of Stoneblood or Frost Wyrm" }],

  // ─── Cata Flasks ───────────────────────────────────────────────────
  [79469, { name: "Flask of Steelskin", category: "flask", isSuboptimal: false }],
  [79470, { name: "Flask of the Draconic Mind", category: "flask", isSuboptimal: false }],
  [79471, { name: "Flask of the Winds", category: "flask", isSuboptimal: false }],
  [79472, { name: "Flask of Titanic Strength", category: "flask", isSuboptimal: false }],
  [94160, { name: "Flask of Flowing Water", category: "flask", isSuboptimal: false }],

  // ─── TBC Flasks ────────────────────────────────────────────────────
  [17626, { name: "Flask of the Titans", category: "flask", isSuboptimal: false }],
  [17627, { name: "Flask of Distilled Wisdom", category: "flask", isSuboptimal: false }],
  [17628, { name: "Flask of Supreme Power", category: "flask", isSuboptimal: false }],
  [17629, { name: "Flask of Chromatic Resistance", category: "flask", isSuboptimal: true, betterAlternative: "Flask of the Titans or Supreme Power" }],
  [28518, { name: "Flask of Fortification", category: "flask", isSuboptimal: false }],
  [28519, { name: "Flask of Mighty Versatility", category: "flask", isSuboptimal: false }],
  [28520, { name: "Flask of Relentless Assault", category: "flask", isSuboptimal: false }],
  [28521, { name: "Flask of Blinding Light", category: "flask", isSuboptimal: false }],
  [28540, { name: "Flask of Pure Death", category: "flask", isSuboptimal: false }],

  // ─── Classic Flasks ────────────────────────────────────────────────
  [13510, { name: "Flask of the Titans (Classic)", category: "flask", isSuboptimal: false }],
  [13511, { name: "Flask of Distilled Wisdom (Classic)", category: "flask", isSuboptimal: false }],
  [13512, { name: "Flask of Supreme Power (Classic)", category: "flask", isSuboptimal: false }],
  [13513, { name: "Flask of Chromatic Resistance (Classic)", category: "flask", isSuboptimal: true, betterAlternative: "Flask of the Titans or Supreme Power" }],

  // ─── Classic Battle Elixirs ──────────────────────────────────────
  [17538, { name: "Elixir of the Mongoose", category: "battle_elixir", isSuboptimal: false }],
  [17537, { name: "Elixir of Brute Force", category: "battle_elixir", isSuboptimal: false }],
  [11334, { name: "Elixir of Greater Agility", category: "battle_elixir", isSuboptimal: false }],
  [11405, { name: "Elixir of the Giants", category: "battle_elixir", isSuboptimal: false }],
  [17535, { name: "Elixir of the Sages", category: "battle_elixir", isSuboptimal: false }],
  [26276, { name: "Elixir of Greater Firepower", category: "battle_elixir", isSuboptimal: false }],
  [11474, { name: "Elixir of Shadow Power", category: "battle_elixir", isSuboptimal: false }],
  [21920, { name: "Elixir of Frost Power", category: "battle_elixir", isSuboptimal: false }],
  [11406, { name: "Elixir of Demonslaying", category: "battle_elixir", isSuboptimal: false }],

  // ─── Classic Guardian Elixirs ──────────────────────────────────────
  [11348, { name: "Elixir of Superior Defense", category: "guardian_elixir", isSuboptimal: false }],
  [11396, { name: "Elixir of Greater Intellect", category: "guardian_elixir", isSuboptimal: false }],
  [3593, { name: "Elixir of Fortitude", category: "guardian_elixir", isSuboptimal: false }],
  [11371, { name: "Gift of Arthas", category: "guardian_elixir", isSuboptimal: false }],

  // ─── TBC Battle Elixirs ───────────────────────────────────────────
  [28497, { name: "Elixir of Major Agility", category: "battle_elixir", isSuboptimal: false }],
  [28490, { name: "Elixir of Major Strength", category: "battle_elixir", isSuboptimal: false }],
  [28491, { name: "Elixir of Healing Power", category: "battle_elixir", isSuboptimal: false }],
  [28493, { name: "Elixir of Major Frost Power", category: "battle_elixir", isSuboptimal: false }],
  [28501, { name: "Elixir of Major Firepower", category: "battle_elixir", isSuboptimal: false }],
  [28503, { name: "Elixir of Major Shadow Power", category: "battle_elixir", isSuboptimal: false }],
  [33720, { name: "Onslaught Elixir", category: "battle_elixir", isSuboptimal: false }],
  [33721, { name: "Adept's Elixir", category: "battle_elixir", isSuboptimal: false }],
  [33726, { name: "Elixir of Mastery", category: "battle_elixir", isSuboptimal: false }],
  [38954, { name: "Fel Strength Elixir", category: "battle_elixir", isSuboptimal: false }],
  [54452, { name: "Adept's Elixir", category: "battle_elixir", isSuboptimal: false }],

  // ─── TBC Guardian Elixirs ──────────────────────────────────────────
  [28502, { name: "Elixir of Major Defense", category: "guardian_elixir", isSuboptimal: false }],
  [28509, { name: "Elixir of Major Mageblood", category: "guardian_elixir", isSuboptimal: false }],
  [28514, { name: "Elixir of Empowerment", category: "guardian_elixir", isSuboptimal: false }],
  [39625, { name: "Elixir of Major Fortitude", category: "guardian_elixir", isSuboptimal: false }],
  [39627, { name: "Elixir of Draenic Wisdom", category: "guardian_elixir", isSuboptimal: false }],
  [39628, { name: "Elixir of Ironskin", category: "guardian_elixir", isSuboptimal: false }],

  // ─── WotLK Battle Elixirs ─────────────────────────────────────────
  [53746, { name: "Wrath Elixir", category: "battle_elixir", isSuboptimal: true, betterAlternative: "Elixir of Mighty Agility/Accuracy" }],
  [53748, { name: "Elixir of Mighty Strength", category: "battle_elixir", isSuboptimal: false }],
  [53749, { name: "Guru's Elixir", category: "battle_elixir", isSuboptimal: true, betterAlternative: "Elixir of Mighty Strength or Accuracy" }],
  [60340, { name: "Elixir of Accuracy", category: "battle_elixir", isSuboptimal: false }],
  [60341, { name: "Elixir of Deadly Strikes", category: "battle_elixir", isSuboptimal: false }],
  [60344, { name: "Elixir of Expertise", category: "battle_elixir", isSuboptimal: false }],
  [60345, { name: "Elixir of Armor Piercing", category: "battle_elixir", isSuboptimal: false }],
  [60346, { name: "Elixir of Lightning Speed", category: "battle_elixir", isSuboptimal: false }],

  // ─── WotLK Guardian Elixirs ───────────────────────────────────────
  [53747, { name: "Elixir of Spirit", category: "guardian_elixir", isSuboptimal: false }],
  [53751, { name: "Elixir of Mighty Fortitude", category: "guardian_elixir", isSuboptimal: false }],
  [53752, { name: "Elixir of Mighty Defense", category: "guardian_elixir", isSuboptimal: false }],
  [53763, { name: "Elixir of Protection", category: "guardian_elixir", isSuboptimal: false }],
  [53764, { name: "Elixir of Mighty Mageblood", category: "guardian_elixir", isSuboptimal: false }],
  [60343, { name: "Elixir of Mighty Defense", category: "guardian_elixir", isSuboptimal: false }],
  [60347, { name: "Elixir of Mighty Thoughts", category: "guardian_elixir", isSuboptimal: false }],

  // ─── Cata Elixirs ─────────────────────────────────────────────────
  [79474, { name: "Elixir of the Cobra", category: "battle_elixir", isSuboptimal: false }],
  [79468, { name: "Ghost Elixir", category: "battle_elixir", isSuboptimal: false }],
  [79481, { name: "Elixir of Impossible Accuracy", category: "battle_elixir", isSuboptimal: false }],
  [79632, { name: "Elixir of Mighty Speed", category: "battle_elixir", isSuboptimal: false }],
  [79477, { name: "Elixir of the Master", category: "battle_elixir", isSuboptimal: false }],
  [79480, { name: "Elixir of the Naga", category: "battle_elixir", isSuboptimal: false }],
  [79631, { name: "Prismatic Elixir", category: "guardian_elixir", isSuboptimal: false }],

  // ─── TBC Food Buffs ──────────────────────────────────────────────
  [33254, { name: "Well Fed (Ravager Dog)", category: "food", isSuboptimal: false }],
  [33256, { name: "Well Fed (Roasted Clefthoof)", category: "food", isSuboptimal: false }],
  [33257, { name: "Well Fed (Blackened Sporefish)", category: "food", isSuboptimal: false }],
  [33259, { name: "Well Fed (Grilled Mudfish)", category: "food", isSuboptimal: false }],
  [33261, { name: "Well Fed (Warp Burger)", category: "food", isSuboptimal: false }],
  [33263, { name: "Well Fed (Blackened Basilisk)", category: "food", isSuboptimal: false }],
  [33265, { name: "Well Fed (Poached Bluefish)", category: "food", isSuboptimal: false }],
  [33268, { name: "Well Fed (Spicy Hot Talbuk)", category: "food", isSuboptimal: false }],
  [35272, { name: "Well Fed (Spicy Crawdad)", category: "food", isSuboptimal: false }],
  [43764, { name: "Well Fed (Fish Feast TBC)", category: "food", isSuboptimal: false }],
  [43722, { name: "Well Fed (Fisherman's Feast)", category: "food", isSuboptimal: false }],
  [43730, { name: "Electrified", category: "food", isSuboptimal: false }],
  [24799, { name: "Well Fed (Stamina)", category: "food", isSuboptimal: true, betterAlternative: "Stat-specific food" }],
  [24870, { name: "Well Fed (Spirit)", category: "food", isSuboptimal: true, betterAlternative: "Stat-specific food" }],
  [44106, { name: "Well Fed (Hit Rating)", category: "food", isSuboptimal: false }],
  [46687, { name: "Well Fed (Broiled Bloodfin)", category: "food", isSuboptimal: false }],
  [25661, { name: "Well Fed", category: "food", isSuboptimal: false }],

  // ─── WotLK Food Buffs ─────────────────────────────────────────────
  [57294, { name: "Well Fed", category: "food", isSuboptimal: false }],
  [57399, { name: "Well Fed (Fish Feast)", category: "food", isSuboptimal: false }],
  [57325, { name: "Firecracker Salmon", category: "food", isSuboptimal: false }],
  [57327, { name: "Poached Northern Sculpin", category: "food", isSuboptimal: false }],
  [57329, { name: "Imperial Manta Steak", category: "food", isSuboptimal: false }],
  [57332, { name: "Rhinolicious Wormsteak", category: "food", isSuboptimal: false }],
  [57334, { name: "Mega Mammoth Meal", category: "food", isSuboptimal: false }],
  [57356, { name: "Spiced Worm Burger", category: "food", isSuboptimal: false }],
  [57358, { name: "Snapper Extreme", category: "food", isSuboptimal: false }],
  [57360, { name: "Blackened Dragonfin", category: "food", isSuboptimal: false }],
  [57362, { name: "Dragonfin Filet", category: "food", isSuboptimal: false }],
  [57365, { name: "Cuttlesteak", category: "food", isSuboptimal: false }],
  [57367, { name: "Spicy Blue Nettlefish", category: "food", isSuboptimal: false }],
  [57371, { name: "Tender Shoveltusk Steak", category: "food", isSuboptimal: true, betterAlternative: "Higher-stat food (e.g. Fish Feast)" }],
  [57373, { name: "Mighty Rhino Dogs", category: "food", isSuboptimal: true, betterAlternative: "Higher-stat food (e.g. Fish Feast)" }],
  [58067, { name: "Fish Feast", category: "food", isSuboptimal: false }],

  // ─── Cata Food Buffs ──────────────────────────────────────────────
  [87545, { name: "Beer-Basted Crocolisk", category: "food", isSuboptimal: false }],
  [87546, { name: "Skewered Eel", category: "food", isSuboptimal: false }],
  [87547, { name: "Basilisk Liverdog", category: "food", isSuboptimal: false }],
  [87548, { name: "Mushroom Sauce Mudfish", category: "food", isSuboptimal: false }],
  [87549, { name: "Grilled Dragon", category: "food", isSuboptimal: false }],
  [87550, { name: "Baked Rockfish", category: "food", isSuboptimal: false }],
  [87551, { name: "Lavascale Fillet", category: "food", isSuboptimal: false }],
  [87552, { name: "Severed Sagefish Head", category: "food", isSuboptimal: false }],
  [87554, { name: "Crocolisk Au Gratin", category: "food", isSuboptimal: false }],
  [87555, { name: "Lavascale Minestrone", category: "food", isSuboptimal: false }],
  [87556, { name: "Broiled Dragon Feast", category: "food", isSuboptimal: false }],
  [87557, { name: "Seafood Magnifique Feast", category: "food", isSuboptimal: false }],

  // ─── Weapon Enhancements (use spell IDs) ─────────────────────────
  // Classic Oils
  [25120, { name: "Brilliant Mana Oil", category: "weapon_enhancement", isSuboptimal: true, betterAlternative: "Superior Mana Oil" }],
  [25122, { name: "Brilliant Wizard Oil", category: "weapon_enhancement", isSuboptimal: true, betterAlternative: "Superior Wizard Oil" }],
  [25123, { name: "Brilliant Mana Oil", category: "weapon_enhancement", isSuboptimal: true, betterAlternative: "Superior Mana Oil" }],
  // Classic Stones
  [22756, { name: "Elemental Sharpening Stone", category: "weapon_enhancement", isSuboptimal: false }],
  [16138, { name: "Dense Sharpening Stone", category: "weapon_enhancement", isSuboptimal: true, betterAlternative: "Adamantite Sharpening Stone" }],
  [16622, { name: "Dense Weightstone", category: "weapon_enhancement", isSuboptimal: true, betterAlternative: "Adamantite Weightstone" }],
  // TBC Oils
  [28017, { name: "Superior Wizard Oil", category: "weapon_enhancement", isSuboptimal: false }],
  [28013, { name: "Superior Mana Oil", category: "weapon_enhancement", isSuboptimal: false }],
  [28898, { name: "Blessed Wizard Oil", category: "weapon_enhancement", isSuboptimal: false }],
  // TBC Stones
  [29453, { name: "Adamantite Sharpening Stone", category: "weapon_enhancement", isSuboptimal: false }],
  [34340, { name: "Adamantite Weightstone", category: "weapon_enhancement", isSuboptimal: false }],
  [29452, { name: "Fel Sharpening Stone", category: "weapon_enhancement", isSuboptimal: false }],
  // WotLK
  [28093, { name: "Lightning Speed", category: "weapon_enhancement", isSuboptimal: false }],
  [28095, { name: "Deathfrost", category: "weapon_enhancement", isSuboptimal: false }],
  [55836, { name: "Titanium Weapon Chain", category: "weapon_enhancement", isSuboptimal: false }],
  // Cata
  [96264, { name: "Pyrium Weapon Chain (Cata)", category: "weapon_enhancement", isSuboptimal: false }],
  [96294, { name: "Pyrium Shield Spike (Cata)", category: "weapon_enhancement", isSuboptimal: false }],

  // ─── Scroll Buffs ─────────────────────────────────────────────────
  [43199, { name: "Scroll of Strength VIII", category: "scroll", isSuboptimal: false }],
  [43194, { name: "Scroll of Agility VIII", category: "scroll", isSuboptimal: false }],
  [43196, { name: "Scroll of Intellect VIII", category: "scroll", isSuboptimal: false }],
  [43197, { name: "Scroll of Spirit VIII", category: "scroll", isSuboptimal: false }],
  [43195, { name: "Scroll of Stamina VIII", category: "scroll", isSuboptimal: false }],
  [43198, { name: "Scroll of Protection VIII", category: "scroll", isSuboptimal: false }],
  // Lower-rank scrolls
  [33081, { name: "Scroll of Agility V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Agility VIII" }],
  [33082, { name: "Scroll of Strength V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Strength VIII" }],
  [33077, { name: "Scroll of Intellect V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Intellect VIII" }],
  [33078, { name: "Scroll of Spirit V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Spirit VIII" }],
  [33079, { name: "Scroll of Stamina V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Stamina VIII" }],
  [33080, { name: "Scroll of Protection V", category: "scroll", isSuboptimal: true, betterAlternative: "Scroll of Protection VIII" }],
]);

// ─── Categorized ID sets ────────────────────────────────────────────

export const BATTLE_ELIXIR_IDS = new Set<number>();
export const GUARDIAN_ELIXIR_IDS = new Set<number>();
export const SCROLL_BUFF_IDS = new Set<number>();

// Build categorized sets from the master DB
for (const [id, info] of CONSUMABLE_DB) {
  if (info.category === "battle_elixir") BATTLE_ELIXIR_IDS.add(id);
  if (info.category === "guardian_elixir") GUARDIAN_ELIXIR_IDS.add(id);
  if (info.category === "scroll") SCROLL_BUFF_IDS.add(id);
}

/** Combined set of all consumable spell IDs for GraphQL filtering */
export function getAllConsumableAbilityIds(): number[] {
  return Array.from(CONSUMABLE_DB.keys());
}
