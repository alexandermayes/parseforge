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

  // ─── MoP Flasks ─────────────────────────────────────────────────
  [105689, { name: "Flask of Spring Blossoms", category: "flask", isSuboptimal: false }],
  [105691, { name: "Flask of the Warm Sun", category: "flask", isSuboptimal: false }],
  [105693, { name: "Flask of Falling Leaves", category: "flask", isSuboptimal: false }],
  [105694, { name: "Flask of the Earth", category: "flask", isSuboptimal: false }],
  [105696, { name: "Flask of Winter's Bite", category: "flask", isSuboptimal: false }],
  [105617, { name: "Alchemist's Flask", category: "flask", isSuboptimal: true, betterAlternative: "Stat-specific flask" }],

  // ─── MoP Battle Elixirs ─────────────────────────────────────────
  [105682, { name: "Mad Hozen Elixir", category: "battle_elixir", isSuboptimal: false }],
  [105683, { name: "Elixir of Weaponry", category: "battle_elixir", isSuboptimal: false }],
  [105684, { name: "Elixir of the Rapids", category: "battle_elixir", isSuboptimal: false }],
  [105685, { name: "Elixir of Peace", category: "battle_elixir", isSuboptimal: false }],
  [105686, { name: "Elixir of Perfection", category: "battle_elixir", isSuboptimal: false }],
  [105688, { name: "Monk's Elixir", category: "battle_elixir", isSuboptimal: false }],

  // ─── MoP Guardian Elixirs ───────────────────────────────────────
  [105681, { name: "Mantid Elixir", category: "guardian_elixir", isSuboptimal: false }],
  [105687, { name: "Elixir of Mirrors", category: "guardian_elixir", isSuboptimal: false }],

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

  // ─── MoP Food Buffs ────────────────────────────────────────────
  // 300 tier (top)
  [104272, { name: "Well Fed (+300 Str)", category: "food", isSuboptimal: false }],
  [104275, { name: "Well Fed (+300 Agi)", category: "food", isSuboptimal: false }],
  [104277, { name: "Well Fed (+300 Int)", category: "food", isSuboptimal: false }],
  [104280, { name: "Well Fed (+300 Spirit)", category: "food", isSuboptimal: false }],
  [104283, { name: "Well Fed (+450 Stam)", category: "food", isSuboptimal: false }],
  [125113, { name: "Well Fed (+300 Hit)", category: "food", isSuboptimal: false }],
  [125115, { name: "Well Fed (+300 Expertise)", category: "food", isSuboptimal: false }],
  // 275 tier (banquet)
  [104271, { name: "Well Fed (+275 Str)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104274, { name: "Well Fed (+275 Agi)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104276, { name: "Well Fed (+275 Int)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104279, { name: "Well Fed (+275 Spirit)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104282, { name: "Well Fed (+415 Stam)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [125106, { name: "Well Fed (+275 Hit)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [125108, { name: "Well Fed (+275 Expertise)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  // 250 tier (basic)
  [104267, { name: "Well Fed (+250 Str)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104273, { name: "Well Fed (+250 Agi)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104264, { name: "Well Fed (+250 Int)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104278, { name: "Well Fed (+250 Spirit)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [104281, { name: "Well Fed (+375 Stam)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],
  [125104, { name: "Well Fed (+250 Hit)", category: "food", isSuboptimal: true, betterAlternative: "300-stat food" }],

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

// ─── Enchant Name Database ───────────────────────────────────────────
// Maps WCL permanentEnchant IDs (SpellItemEnchantment IDs) to display names

export const ENCHANT_NAME_DB = new Map<number, string>([
  // ─── Classic Head ─────────────────────────────────────────────────
  [1503, "Arcanum of Voracity (+8 Str)"],
  [1504, "Arcanum of Voracity (+8 Agi)"],
  [1506, "Arcanum of Voracity (+8 Int)"],
  [1510, "Arcanum of Voracity (+8 Stam)"],
  [2543, "Arcanum of Focus (+8 SP)"],
  [2544, "Arcanum of Protection (+1% Dodge)"],
  [2545, "Arcanum of Rapidity (+1% Haste)"],
  [2583, "Arcanum of Subduing (+1% hit to Dragonkin)"],

  // ─── Classic Shoulder ─────────────────────────────────────────────
  [2604, "Might of the Scourge (+26 AP, +14 Crit)"],
  [2605, "Power of the Scourge (+15 SP, +14 Crit)"],
  [2606, "Resilience of the Scourge (+10 Dodge, +1% Block)"],
  [2715, "Fortitude of the Scourge (+16 Stam, +100 Armor)"],
  [2716, "Zandalar Signet of Might (+30 AP)"],
  [2717, "Zandalar Signet of Mojo (+18 SP)"],
  [2718, "Zandalar Signet of Serenity (+33 Healing)"],

  // ─── Classic Chest ────────────────────────────────────────────────
  [866, "Greater Stats (+4)"],
  [928, "Minor Stats (+3)"],
  [847, "Major Health (+100 HP)"],

  // ─── Classic Weapon ───────────────────────────────────────────────
  [1900, "Crusader"],
  [2564, "Major Strength (+15 Str)"],
  [2646, "Agility (+15 Agi)"],
  [2523, "Agility (+25 Agi, 2H)"],
  [2505, "Spell Power (+30 SP)"],

  // ─── Classic Cloak ────────────────────────────────────────────────
  [849, "Greater Agility (+3 Agi)"],
  [2463, "Fire Resistance (+15)"],
  [2464, "Nature Resistance (+15)"],

  // ─── Classic Bracers ──────────────────────────────────────────────
  [1147, "Superior Stamina (+9 Stam)"],
  [1886, "Healing Power (+24 Healing)"],
  [2326, "Assault (+24 AP)"],

  // ─── Classic Boots ────────────────────────────────────────────────
  [911, "Minor Speed"],
  [2658, "Dexterity (+12 Agi)"],

  // ─── TBC Head Arcanums ────────────────────────────────────────────
  [2999, "Glyph of Ferocity (+34 AP, +16 Hit)"],
  [3001, "Glyph of Power (+22 SP, +14 Hit)"],
  [3002, "Glyph of Renewal (+35 Healing, +7 MP5)"],
  [3003, "Glyph of the Defender (+17 Def, +16 Dodge)"],
  [3004, "Glyph of Fire Warding (+20 Fire Resist)"],
  [3005, "Glyph of Nature Warding (+20 Nature Resist)"],
  [3006, "Glyph of Shadow Warding (+20 Shadow Resist)"],
  [3007, "Glyph of Frost Warding (+20 Frost Resist)"],
  [3008, "Glyph of Arcane Warding (+20 Arcane Resist)"],
  [3096, "Glyph of Chromatic Warding (+8 All Resist)"],

  // ─── TBC Shoulder Inscriptions (Aldor) ────────────────────────────
  [2974, "Inscription of Vengeance (+15 AP, +5 Crit)"],
  [2975, "Inscription of Faith (+16 Healing, +2 MP5)"],
  [2976, "Inscription of Discipline (+9 SP, +5 Crit)"],
  [2977, "Inscription of Warding (+8 Dodge, +5 Def)"],
  [2978, "Greater Inscription of Vengeance (+30 AP, +10 Crit)"],
  [2979, "Greater Inscription of Faith (+33 Healing, +4 MP5)"],
  [2980, "Greater Inscription of Discipline (+18 SP, +10 Crit)"],
  [2981, "Greater Inscription of Warding (+15 Dodge, +10 Def)"],

  // ─── TBC Shoulder Inscriptions (Scryer) ───────────────────────────
  [2983, "Inscription of the Blade (+13 Crit, +7 AP)"],
  [2986, "Greater Inscription of the Blade (+15 Crit, +20 AP)"],
  [2987, "Inscription of the Knight (+8 Def, +5 Dodge)"],
  [2990, "Greater Inscription of the Knight (+15 Def, +10 Dodge)"],
  [2991, "Inscription of the Oracle (+3 MP5, +11 Healing)"],
  [2994, "Greater Inscription of the Oracle (+6 MP5, +22 Healing)"],
  [2995, "Inscription of the Orb (+6 SP, +8 Crit)"],
  [2998, "Greater Inscription of the Orb (+12 SP, +15 Crit)"],

  // ─── TBC Chest ────────────────────────────────────────────────────
  [1144, "Major Spirit (+15 Spirit)"],
  [2661, "Exceptional Health (+150 HP)"],
  [2933, "Exceptional Stats (+6 All Stats)"],
  [3150, "Exceptional Resilience (+15 Resilience)"],

  // ─── TBC Cloak ────────────────────────────────────────────────────
  [2621, "Subtlety (-2% Threat)"],
  [2622, "Dodge (+12 Dodge Rating)"],
  [2662, "Major Resistance (+7 All Resist)"],
  [2664, "Major Armor (+120 Armor)"],
  [2938, "Spell Penetration (+20 Spell Pen)"],

  // ─── TBC Bracers ──────────────────────────────────────────────────
  [1891, "Stats (+4 All Stats)"],
  [2617, "Superior Healing (+30 Healing)"],
  [2647, "Brawn (+12 Str)"],
  [2648, "Major Intellect (+12 Int)"],
  [2649, "Fortitude (+12 Stam)"],
  [2650, "Spellpower (+15 SP)"],
  [2679, "Assault (+24 AP)"],

  // ─── TBC Gloves ───────────────────────────────────────────────────
  [2613, "Threat (+2% Threat)"],
  [2935, "Major Spellpower (+20 SP)"],
  [2937, "Major Healing (+35 Healing)"],
  [930, "Riding Skill"],
  [684, "Major Agility (+15 Agi)"],
  [2934, "Blasting (+10 Crit)"],
  [2322, "Superior Agility (+15 Agi)"],

  // ─── TBC Legs ─────────────────────────────────────────────────────
  [2743, "Clefthide Leg Armor (+30 Stam, +10 Agi)"],
  [2744, "Nethercleft Leg Armor (+40 Stam, +12 Agi)"],
  [2745, "Runic Spellthread (+35 SP, +20 Stam)"],
  [2746, "Mystic Spellthread (+25 SP, +15 Stam)"],
  [2747, "Nethercobra Leg Armor (+50 AP, +12 Crit)"],
  [2748, "Cobrahide Leg Armor (+40 AP, +10 Crit)"],

  // ─── TBC Boots ────────────────────────────────────────────────────
  [2656, "Vitality (+4 HP5/MP5)"],
  [2657, "Fortitude (+12 Stam)"],
  [2939, "Cat's Swiftness (+6 Agi, Minor Speed)"],
  [2940, "Boar's Speed (+9 Stam, Minor Speed)"],

  // ─── TBC Weapons ──────────────────────────────────────────────────
  [2667, "Savagery (+70 AP)"],
  [2669, "Major Spellpower (+40 SP)"],
  [2670, "Major Agility (+35 Agi)"],
  [2671, "Sunfire (+50 Arcane/Fire Damage)"],
  [2672, "Soulfrost (+54 Shadow/Frost Damage)"],
  [2673, "Mongoose"],
  [2674, "Spellsurge"],
  [2675, "Battlemaster"],
  [3222, "Greater Agility (+20 Agi)"],
  [3225, "Executioner"],
  [3239, "Icebreaker"],
  [3241, "Deathfrost"],

  // ─── TBC Shield ───────────────────────────────────────────────────
  [2653, "Tough Shield (+18 Stam)"],
  [2654, "Resilience (+12 Resilience)"],
  [2655, "Resistance (+5 All Resist)"],

  // ─── TBC Off-Hand ─────────────────────────────────────────────────
  [2666, "Major Intellect (+12 Int)"],

  // ─── WotLK Head Arcanums ──────────────────────────────────────────
  [3812, "Arcanum of Torment (+50 AP, +20 Crit)"],
  [3815, "Arcanum of Blissful Mending (+30 SP, +10 MP5)"],
  [3817, "Arcanum of Triumph (+50 AP, +20 Resilience)"],
  [3818, "Arcanum of Dominance (+29 SP, +20 Resilience)"],
  [3819, "Arcanum of the Stalwart Protector (+37 Stam, +20 Def)"],
  [3820, "Arcanum of Burning Mysteries (+30 SP, +20 Crit)"],

  // ─── WotLK Shoulder Inscriptions ──────────────────────────────────
  [3806, "Inscription of the Axe (+30 AP, +10 Crit)"],
  [3807, "Inscription of the Crag (+18 SP, +5 MP5)"],
  [3808, "Greater Inscription of the Axe (+40 AP, +15 Crit)"],
  [3809, "Greater Inscription of the Crag (+24 SP, +8 MP5)"],
  [3810, "Greater Inscription of the Storm (+24 SP, +15 Crit)"],
  [3811, "Greater Inscription of the Pinnacle (+20 Dodge, +15 Def)"],
  [3793, "Inscription of the Pinnacle (+15 Dodge, +10 Def)"],
  [3794, "Inscription of the Storm (+18 SP, +10 Crit)"],
  [3835, "Inscription of Triumph (+40 AP, +15 Resilience)"],
  [3836, "Inscription of Dominance (+23 SP, +15 Resilience)"],
  [3837, "Master's Inscription of the Axe (+120 AP, +15 Crit)"],
  [3838, "Master's Inscription of the Crag (+70 SP, +8 MP5)"],
  [3876, "Master's Inscription of the Storm (+70 SP, +15 Crit)"],
  [3852, "Greater Inscription of the Gladiator (+30 Stam, +15 Resilience)"],

  // ─── WotLK Chest ──────────────────────────────────────────────────
  [3233, "Super Stats (+8 All Stats)"],
  [3236, "Exceptional Mana (+250 Mana)"],
  [3245, "Exceptional Resilience (+20 Resilience)"],
  [3252, "Super Health (+275 HP)"],
  [3297, "Greater Defense (+22 Def)"],
  [3832, "Powerful Stats (+10 All Stats)"],

  // ─── WotLK Cloak ──────────────────────────────────────────────────
  [3230, "Superior Agility (+16 Agi)"],
  [3243, "Spell Piercing (+35 Spell Pen)"],
  [3256, "Shadow Armor (+10 Agi, +8 Dodge)"],
  [3294, "Wisdom (-2% Threat, +10 Spirit)"],
  [3825, "Speed (+23 Haste)"],
  [3831, "Greater Speed (+23 Haste)"],
  [3859, "Springy Arachnoweave (+27 SP)"],
  [3605, "Flexweave Underlay (+23 Agi)"],

  // ─── WotLK Bracers ───────────────────────────────────────────────
  [3231, "Expertise (+15 Expertise)"],
  [3757, "Superior Spellpower (+30 SP)"],
  [3758, "Exceptional Intellect (+16 Int)"],
  [3845, "Greater Assault (+50 AP)"],
  [3850, "Major Stamina (+40 Stam)"],
  [3756, "Greater Stats (+6 All Stats)"],

  // ─── WotLK Gloves ────────────────────────────────────────────────
  [3234, "Precision (+20 Hit)"],
  [3246, "Exceptional Spellpower (+28 SP)"],
  [3253, "Crusher (+44 AP)"],
  [3829, "Greater Assault (+44 AP)"],
  [3604, "Hyperspeed Accelerators (Engineering)"],
  [3603, "Hand-Mounted Pyro Rocket (Engineering)"],
  [3860, "Reticulated Armor Webbing (+885 Armor, Engineering)"],

  // ─── WotLK Legs ──────────────────────────────────────────────────
  [3325, "Icescale Leg Armor (+75 AP, +22 Crit)"],
  [3326, "Frosthide Leg Armor (+55 Stam, +22 Agi)"],
  [3822, "Earthen Leg Armor (+28 Stam, +40 Resilience)"],
  [3718, "Brilliant Spellthread (+50 SP, +20 Spirit)"],
  [3719, "Sapphire Spellthread (+50 SP, +30 Stam)"],
  [3720, "Shining Spellthread (+35 SP, +12 Spirit)"],
  [3721, "Azure Spellthread (+35 SP, +20 Stam)"],
  [3853, "Jormungar Leg Armor (+45 Stam, +15 Agi)"],
  [3823, "Nerubian Leg Armor (+55 AP, +15 Crit)"],

  // ─── WotLK Boots ─────────────────────────────────────────────────
  [3232, "Tuskarr's Vitality (+15 Stam, Minor Speed)"],
  [3244, "Greater Fortitude (+22 Stam)"],
  [3824, "Icewalker (+12 Hit, +12 Crit)"],
  [3826, "Greater Spirit (+18 Spirit)"],
  [3606, "Nitro Boosts (Engineering)"],

  // ─── WotLK Weapons ───────────────────────────────────────────────
  [3788, "Accuracy (+25 Hit, +25 Crit)"],
  [3789, "Berserking"],
  [3790, "Black Magic"],
  [3828, "Greater Spellpower (+50 SP)"],
  [3830, "Massacre (+110 AP, 2H)"],
  [3833, "Superior Potency (+65 AP)"],
  [3834, "Mighty Spellpower (+63 SP)"],
  [3844, "Greater Savagery (+85 AP, 2H)"],
  [3827, "Exceptional Spellpower (+50 SP)"],
  [3869, "Blade Ward"],
  [3870, "Blood Draining"],

  // ─── WotLK Shield ────────────────────────────────────────────────
  [3229, "Resilience (+20 Resilience)"],
  [3748, "Defense (+20 Def)"],
  [3849, "Titanium Plating (-50% Disarm Duration)"],

  // ─── Cata Head Arcanums ───────────────────────────────────────────
  [4206, "Arcanum of the Earthen Ring (+60 Stam, +35 Dodge)"],
  [4207, "Arcanum of Hyjal (+60 Int, +35 Crit)"],
  [4208, "Arcanum of the Dragonmaw (+60 Str, +35 Mastery)"],
  [4209, "Arcanum of the Ramkahen (+60 Agi, +35 Haste)"],
  [4246, "Arcanum of Vicious Agility (+60 Agi, +35 Resilience)"],
  [4247, "Arcanum of Vicious Strength (+60 Str, +35 Resilience)"],
  [4248, "Arcanum of Vicious Intellect (+60 Int, +35 Resilience)"],

  // ─── Cata Shoulder Inscriptions ───────────────────────────────────
  [4193, "Greater Inscription of Charged Lodestone (+50 Int, +25 Haste)"],
  [4194, "Greater Inscription of Jagged Stone (+50 Str, +25 Crit)"],
  [4195, "Greater Inscription of Shattered Crystal (+50 Agi, +25 Mastery)"],
  [4196, "Greater Inscription of Unbreakable Quartz (+75 Stam, +25 Dodge)"],
  [4197, "Inscription of Charged Lodestone (+30 Int, +20 Haste)"],
  [4198, "Inscription of Jagged Stone (+30 Str, +20 Crit)"],
  [4199, "Inscription of Shattered Crystal (+30 Agi, +20 Mastery)"],
  [4200, "Inscription of Unbreakable Quartz (+45 Stam, +20 Dodge)"],
  [4270, "Felfire Inscription (+130 Int, +25 Haste)"],
  [4271, "Inscription of the Earth Prince (+195 Stam, +25 Dodge)"],
  [4272, "Lionsmane Inscription (+130 Str, +25 Crit)"],
  [4273, "Swiftsteel Inscription (+130 Agi, +25 Mastery)"],

  // ─── Cata Chest ───────────────────────────────────────────────────
  [4063, "Peerless Stats (+20 All Stats)"],
  [4070, "Exceptional Spirit (+40 Spirit)"],
  [4077, "Greater Stamina (+75 Stam)"],
  [4088, "Mighty Resilience (+40 Resilience)"],
  [4102, "Mighty Stats (+15 All Stats)"],

  // ─── Cata Cloak ───────────────────────────────────────────────────
  [4064, "Protection (+250 Armor)"],
  [4087, "Intellect (+30 Int)"],
  [4096, "Greater Intellect (+50 Int)"],
  [4100, "Greater Critical Strike (+65 Crit)"],

  // ─── Cata Bracers ─────────────────────────────────────────────────
  [4071, "Greater Speed (+65 Haste)"],
  [4093, "Speed (+50 Haste)"],
  [4101, "Greater Critical Strike (+65 Crit)"],
  [4256, "Mighty Intellect (+50 Int)"],
  [4257, "Major Strength (+50 Str)"],
  [4258, "Greater Expertise (+50 Expertise)"],
  [4108, "Precision (+50 Hit)"],

  // ─── Cata Gloves ──────────────────────────────────────────────────
  [4068, "Mastery (+50 Mastery)"],
  [4075, "Greater Mastery (+65 Mastery)"],
  [4082, "Mighty Strength (+50 Str)"],
  [4106, "Haste (+50 Haste)"],
  [4107, "Greater Haste (+65 Haste)"],

  // ─── Cata Legs ────────────────────────────────────────────────────
  [4109, "Powerful Ghostly Spellthread (+95 Int, +55 Spirit)"],
  [4110, "Powerful Enchanted Spellthread (+95 Int, +80 Stam)"],
  [4111, "Dragonscale Leg Armor (+190 AP, +55 Crit)"],
  [4112, "Charscale Leg Armor (+145 Stam, +55 Agi)"],
  [4113, "Drakehide Leg Armor (+145 Stam, +55 Dodge)"],
  [4126, "Ghostly Spellthread (+55 Int, +35 Spirit)"],
  [4127, "Enchanted Spellthread (+55 Int, +45 Stam)"],

  // ─── Cata Boots ───────────────────────────────────────────────────
  [4061, "Mastery (+50 Mastery)"],
  [4062, "Earthen Vitality (+30 Stam, Minor Speed)"],
  [4069, "Haste (+50 Haste)"],
  [4076, "Assassin's Step (+25 Agi, Minor Speed)"],
  [4086, "Lavawalker (+35 Mastery, Minor Speed)"],
  [4104, "Precision (+50 Hit)"],
  [4105, "Major Agility (+35 Agi)"],

  // ─── Cata Weapons ─────────────────────────────────────────────────
  [4066, "Avalanche"],
  [4067, "Mending"],
  [4074, "Power Torrent"],
  [4083, "Elemental Slayer"],
  [4084, "Hurricane"],
  [4097, "Landslide"],
  [4098, "Windwalk"],
  [4099, "Heartsong"],

  // ─── MoP Enchants ─────────────────────────────────────────────────
  // Head: no enchants in MoP
  // Shoulder
  [4803, "Greater Crane Wing Inscription (+200 Int, +100 Crit)"],
  [4804, "Greater Ox Horn Inscription (+200 Stam, +100 Dodge)"],
  [4805, "Greater Tiger Claw Inscription (+200 Str, +100 Crit)"],
  [4806, "Greater Tiger Fang Inscription (+200 Agi, +100 Crit)"],
  // Chest
  [4419, "Glorious Stats (+80 All Stats)"],
  [4412, "Super Resilience (+200 Resilience)"],
  [4413, "Mighty Spirit (+200 Spirit)"],
  [4414, "Superior Stamina (+300 Stam)"],
  // Cloak
  [4418, "Superior Intellect (+180 Int)"],
  [4421, "Superior Critical Strike (+180 Crit)"],
  // Bracers
  [4416, "Greater Agility (+180 Agi)"],
  [4417, "Exceptional Strength (+180 Str)"],
  [4420, "Super Intellect (+170 Int)"],
  // Gloves
  [4430, "Greater Haste (+170 Haste)"],
  [4431, "Superior Mastery (+170 Mastery)"],
  [4432, "Superior Expertise (+170 Expertise)"],
  [4433, "Superior Strength (+170 Str)"],
  // Legs
  [4822, "Angerhide Leg Armor (+285 AP, +165 Crit)"],
  [4823, "Ironscale Leg Armor (+430 Stam, +165 Dodge)"],
  [4824, "Sha Armor Kit (+285 Stam)"],
  [4825, "Greater Pearlescent Spellthread (+285 Int, +165 Spirit)"],
  [4826, "Greater Cerulean Spellthread (+285 Int, +165 Crit)"],
  // Boots
  [4429, "Greater Haste (+175 Haste)"],
  [4428, "Greater Precision (+175 Hit)"],
  [4427, "Blurred Speed (+140 Agi, Minor Speed)"],
  [4426, "Pandaren's Step (+140 Mastery, Minor Speed)"],
  // Weapons
  [4441, "Windsong"],
  [4443, "Elemental Force"],
  [4444, "Dancing Steel"],
  [4445, "Colossus"],
  [4446, "River's Song"],
  [4442, "Jade Spirit"],
]);

// ─── Gem Name Database ──────────────────────────────────────────────
// Maps gem item IDs to display names (supplements GEM_STAT_DB for display)

export const GEM_NAME_DB = new Map<number, string>([
  // ─── Classic Gems ─────────────────────────────────────────────────
  // Not commonly gemmed in Classic

  // ─── TBC Uncommon Gems ────────────────────────────────────────────
  // Red (Blood Garnet)
  [23094, "Bold Blood Garnet"],           // +6 Str
  [23095, "Delicate Blood Garnet"],       // +6 Agi
  [23096, "Runed Blood Garnet"],          // +7 SP
  [23097, "Bright Blood Garnet"],         // +12 AP
  [23098, "Teardrop Blood Garnet"],       // +13 Healing
  [23099, "Subtle Blood Garnet"],         // +6 Dodge
  // Blue (Azure Moonstone)
  [23109, "Solid Azure Moonstone"],       // +9 Stam
  [23110, "Sparkling Azure Moonstone"],   // +6 Spirit
  [23111, "Lustrous Azure Moonstone"],    // +3 MP5
  [23112, "Stormy Azure Moonstone"],      // +8 Spell Pen
  [23116, "Rigid Azure Moonstone"],       // +6 Hit
  // Yellow (Golden Draenite)
  [23113, "Gleaming Golden Draenite"],    // +6 Crit
  [23114, "Thick Golden Draenite"],       // +6 Def
  [23115, "Great Golden Draenite"],       // +6 Hit
  [23117, "Smooth Golden Draenite"],      // +6 Crit
  [23118, "Mystic Golden Draenite"],      // +6 Resilience
  // Orange (Flame Spessarite)
  [23101, "Inscribed Flame Spessarite"],  // +4 Str, +3 Crit
  [23104, "Glinting Flame Spessarite"],   // +4 Agi, +3 Hit
  [23098, "Luminous Flame Spessarite"],   // +4 SP, +3 Int
  [23099, "Potent Flame Spessarite"],     // +4 SP, +3 Crit
  // Green (Deep Peridot)
  [23103, "Jagged Deep Peridot"],         // +3 Crit, +4 Stam
  [23105, "Enduring Deep Peridot"],       // +3 Def, +4 Stam
  [23106, "Dazzling Deep Peridot"],       // +3 Int, +1 MP5
  // Purple (Shadow Draenite)
  [23100, "Sovereign Shadow Draenite"],   // +3 Str, +4 Stam
  [23108, "Shifting Shadow Draenite"],    // +3 Agi, +4 Stam
  [23104, "Glowing Shadow Draenite"],     // +4 SP, +4 Stam
  [23107, "Royal Shadow Draenite"],       // +4 SP, +2 MP5

  // ─── TBC Red Gems ─────────────────────────────────────────────────
  [32193, "Bold Living Ruby"],          // +8 Str
  [32194, "Delicate Living Ruby"],      // +8 Agi
  [32195, "Brilliant Living Ruby"],     // +8 Int
  [32196, "Runed Living Ruby"],         // +9 SP
  [32197, "Bright Living Ruby"],        // +16 AP
  [32198, "Subtle Living Ruby"],        // +8 Dodge
  [32199, "Flashing Living Ruby"],      // +8 Parry
  [32200, "Thick Living Ruby"],         // +8 Def
  [32201, "Teardrop Living Ruby"],      // +18 Healing
  // TBC Epic Red
  [35487, "Delicate Crimson Spinel"],   // +10 Agi
  [35488, "Runed Crimson Spinel"],      // +12 SP
  [35489, "Bold Crimson Spinel"],       // +10 Str
  [35490, "Bright Crimson Spinel"],     // +20 AP
  [35491, "Brilliant Crimson Spinel"],  // +10 Int
  [35492, "Subtle Crimson Spinel"],     // +10 Dodge
  [35493, "Flashing Crimson Spinel"],   // +10 Parry
  [35494, "Teardrop Crimson Spinel"],   // +22 Healing

  // ─── TBC Blue Gems ────────────────────────────────────────────────
  [32202, "Solid Star of Elune"],       // +12 Stam
  [32203, "Sparkling Star of Elune"],   // +8 Spirit
  [32204, "Lustrous Star of Elune"],    // +4 MP5
  [32205, "Stormy Star of Elune"],      // +10 Spell Pen
  [32206, "Rigid Star of Elune"],       // +8 Hit
  // TBC Epic Blue
  [35495, "Solid Empyrean Sapphire"],   // +15 Stam
  [35496, "Sparkling Empyrean Sapphire"], // +10 Spirit
  [35497, "Lustrous Empyrean Sapphire"], // +5 MP5
  [35498, "Stormy Empyrean Sapphire"],  // +13 Spell Pen
  [35499, "Rigid Empyrean Sapphire"],   // +10 Hit

  // ─── TBC Yellow Gems ──────────────────────────────────────────────
  [32207, "Gleaming Dawnstone"],        // +8 Crit
  [32210, "Great Dawnstone"],           // +8 Hit
  [32215, "Rigid Dawnstone"],           // +8 Hit (spell)
  [32209, "Smooth Dawnstone"],          // +8 Crit
  [32212, "Mystic Dawnstone"],          // +8 Resilience
  // TBC Epic Yellow
  [35500, "Smooth Lionseye"],           // +10 Crit
  [35501, "Gleaming Lionseye"],         // +10 Crit
  [35502, "Great Lionseye"],            // +10 Hit
  [35503, "Mystic Lionseye"],           // +10 Resilience
  [35707, "Rigid Lionseye"],            // +10 Hit (spell)

  // ─── TBC Orange Gems ──────────────────────────────────────────────
  [32211, "Luminous Noble Topaz"],      // +5 SP, +4 Int
  [32217, "Inscribed Noble Topaz"],     // +5 Str, +4 Crit
  [32218, "Potent Noble Topaz"],        // +5 SP, +4 Crit
  [32219, "Veiled Noble Topaz"],        // +5 SP, +4 Hit
  [32220, "Glinting Noble Topaz"],      // +5 Agi, +4 Hit
  [32221, "Wicked Noble Topaz"],        // +8 AP, +4 Crit
  [32222, "Etched Noble Topaz"],        // +5 Str, +4 Hit
  // TBC Epic Orange
  [35758, "Inscribed Pyrestone"],       // +5 Str, +5 Crit
  [35759, "Potent Pyrestone"],          // +6 SP, +5 Crit
  [35760, "Luminous Pyrestone"],        // +6 SP, +5 Int
  [35761, "Glinting Pyrestone"],        // +5 Agi, +5 Hit
  [35762, "Veiled Pyrestone"],          // +6 SP, +5 Hit

  // ─── TBC Green Gems ───────────────────────────────────────────────
  [32208, "Enduring Talasite"],         // +4 Def, +6 Stam
  [32213, "Jagged Talasite"],           // +4 Crit, +6 Stam
  [32224, "Radiant Talasite"],          // +5 SP, +4 Spell Pen
  [32225, "Dazzling Talasite"],         // +4 Int, +2 MP5
  // TBC Epic Green
  [35703, "Enduring Seaspray Emerald"], // +5 Def, +7 Stam
  [35704, "Jagged Seaspray Emerald"],   // +5 Crit, +7 Stam
  [35705, "Radiant Seaspray Emerald"],  // +6 SP, +5 Spell Pen
  [35706, "Dazzling Seaspray Emerald"], // +5 Int, +2 MP5

  // ─── TBC Purple Gems ──────────────────────────────────────────────
  [32214, "Glowing Nightseye"],         // +5 SP, +6 Stam
  [32216, "Shifting Nightseye"],        // +4 Agi, +6 Stam
  [32223, "Sovereign Nightseye"],       // +4 Str, +6 Stam
  [32226, "Purified Shadow Pearl"],     // +5 SP, +4 Spirit
  // TBC Epic Purple
  [35756, "Glowing Shadowsong Amethyst"], // +6 SP, +7 Stam
  [35757, "Shifting Shadowsong Amethyst"], // +5 Agi, +7 Stam

  // ─── TBC Meta Gems ────────────────────────────────────────────────
  [34220, "Chaotic Skyfire Diamond"],   // +12 Crit, 3% Crit Damage
  [25893, "Mystical Skyfire Diamond"],  // Proc Haste
  [25901, "Insightful Earthstorm Diamond"], // +12 Int, Proc Mana
  [32409, "Relentless Earthstorm Diamond"], // +12 Agi, 3% Crit Damage
  [25897, "Bracing Earthstorm Diamond"], // +14 SP, -2% Threat

  // ─── WotLK Uncommon Gems ────────────────────────────────────────
  // Red (Bloodstone)
  [39900, "Bold Bloodstone"],           // +12 Str
  [39905, "Delicate Bloodstone"],       // +12 Agi
  [39908, "Precise Bloodstone"],        // +12 Expertise
  [39909, "Flashing Bloodstone"],       // +12 Parry
  [39907, "Runed Bloodstone"],          // +12 SP
  [39906, "Bright Bloodstone"],         // +24 AP
  // Blue (Chalcedony)
  [39915, "Solid Chalcedony"],          // +18 Stam
  [39919, "Sparkling Chalcedony"],      // +12 Spirit
  [39920, "Lustrous Chalcedony"],       // +4 MP5
  [39927, "Rigid Chalcedony"],          // +12 Hit
  [39932, "Stormy Chalcedony"],         // +12 Spell Pen
  // Yellow (Sun Crystal)
  [39917, "Smooth Sun Crystal"],        // +12 Crit
  [39918, "Thick Sun Crystal"],         // +12 Def
  [39916, "Quick Sun Crystal"],         // +12 Haste
  [39933, "Mystic Sun Crystal"],        // +12 Resilience
  // Orange (Huge Citrine)
  [39946, "Inscribed Huge Citrine"],    // +6 Str, +6 Crit
  [39947, "Etched Huge Citrine"],       // +6 Str, +6 Hit
  [39949, "Glinting Huge Citrine"],     // +6 Agi, +6 Hit
  [39950, "Veiled Huge Citrine"],       // +6 SP, +6 Hit
  [39951, "Potent Huge Citrine"],       // +6 SP, +6 Crit
  [39952, "Luminous Huge Citrine"],     // +6 SP, +6 Int
  [39953, "Reckless Huge Citrine"],     // +6 SP, +6 Haste
  [39954, "Fierce Huge Citrine"],       // +6 Str, +6 Haste
  [39955, "Deft Huge Citrine"],         // +6 Agi, +6 Haste
  [39956, "Deadly Huge Citrine"],       // +6 Agi, +6 Crit
  [39957, "Accurate Huge Citrine"],     // +6 Expertise, +6 Hit
  [39958, "Wicked Huge Citrine"],       // +12 AP, +6 Crit
  // Green (Dark Jade)
  [39933, "Jagged Dark Jade"],          // +6 Crit, +9 Stam
  [39935, "Enduring Dark Jade"],        // +6 Def, +9 Stam
  [39936, "Forceful Dark Jade"],        // +6 Haste, +9 Stam
  [39938, "Vivid Dark Jade"],           // +6 Hit, +9 Stam
  [39939, "Turbid Dark Jade"],          // +6 Resilience, +9 Stam
  [39940, "Steady Dark Jade"],          // +6 Resilience, +9 Stam
  // Purple (Shadow Crystal)
  [39934, "Sovereign Shadow Crystal"],  // +6 Str, +9 Stam
  [39941, "Shifting Shadow Crystal"],   // +6 Agi, +9 Stam
  [39942, "Glowing Shadow Crystal"],    // +6 SP, +9 Stam
  [39943, "Purified Shadow Crystal"],   // +6 SP, +6 Spirit
  [39944, "Guardian's Shadow Crystal"], // +6 Expertise, +9 Stam
  [39945, "Defender's Shadow Crystal"], // +6 Parry, +9 Stam

  // ─── WotLK Rare Red Gems ─────────────────────────────────────────
  [39996, "Bold Scarlet Ruby"],         // +16 Str
  [39997, "Delicate Scarlet Ruby"],     // +16 Agi
  [39998, "Runed Scarlet Ruby"],        // +19 SP
  [39999, "Brilliant Scarlet Ruby"],    // +16 Int
  [40000, "Subtle Scarlet Ruby"],       // +16 Dodge
  [40001, "Flashing Scarlet Ruby"],     // +16 Parry
  [40002, "Fractured Scarlet Ruby"],    // +16 ArP
  [40003, "Precise Scarlet Ruby"],      // +16 Expertise
  // WotLK Epic Red
  [40111, "Bold Cardinal Ruby"],        // +20 Str
  [40112, "Delicate Cardinal Ruby"],    // +20 Agi
  [40113, "Runed Cardinal Ruby"],       // +23 SP
  [40114, "Brilliant Cardinal Ruby"],   // +20 Int
  [40115, "Subtle Cardinal Ruby"],      // +20 Dodge
  [40116, "Flashing Cardinal Ruby"],    // +20 Parry
  [40117, "Fractured Cardinal Ruby"],   // +20 ArP
  [40118, "Precise Cardinal Ruby"],     // +20 Expertise

  // ─── WotLK Blue Gems ─────────────────────────────────────────────
  [39919, "Solid Sky Sapphire"],        // +24 Stam
  [40010, "Sparkling Sky Sapphire"],    // +16 Spirit
  [40119, "Solid Majestic Zircon"],     // +30 Stam
  [40120, "Sparkling Majestic Zircon"], // +20 Spirit

  // ─── WotLK Yellow Gems ───────────────────────────────────────────
  [40014, "Rigid Autumn's Glow"],       // +16 Hit
  [40015, "Thick Autumn's Glow"],       // +16 Def
  [40016, "Smooth Autumn's Glow"],      // +16 Crit
  [40017, "Mystic Autumn's Glow"],      // +16 Resilience
  [40123, "Brilliant King's Amber"],    // +20 Int
  [40124, "Smooth King's Amber"],       // +20 Crit
  [40125, "Rigid King's Amber"],        // +20 Hit
  [40126, "Thick King's Amber"],        // +20 Def
  [40127, "Mystic King's Amber"],       // +20 Resilience
  [40128, "Quick King's Amber"],        // +20 Haste

  // ─── WotLK Orange Gems ───────────────────────────────────────────
  [40023, "Veiled Monarch Topaz"],      // +8 SP, +8 Hit
  [40024, "Potent Monarch Topaz"],      // +8 SP, +8 Crit
  [40025, "Luminous Monarch Topaz"],    // +8 SP, +8 Int... hmm
  [40026, "Inscribed Monarch Topaz"],   // +8 Str, +8 Crit
  [40032, "Glinting Monarch Topaz"],    // +8 Agi, +8 Hit
  [40037, "Etched Monarch Topaz"],      // +8 Str, +8 Hit
  [40133, "Veiled Ametrine"],           // +10 SP, +10 Hit
  [40142, "Potent Ametrine"],           // +10 SP, +10 Crit
  [40143, "Inscribed Ametrine"],        // +10 Str, +10 Crit
  [40144, "Etched Ametrine"],           // +10 Str, +10 Hit
  [40147, "Glinting Ametrine"],         // +10 Agi, +10 Hit
  [40148, "Accurate Ametrine"],         // +10 Expertise, +10 Hit
  [40149, "Deadly Ametrine"],           // +10 Agi, +10 Crit
  [40152, "Fierce Ametrine"],           // +10 Str, +10 Haste
  [40153, "Deft Ametrine"],             // +10 Agi, +10 Haste
  [40154, "Reckless Ametrine"],         // +10 SP, +10 Haste
  [40155, "Wicked Ametrine"],           // +20 AP, +10 Crit
  [40157, "Stark Ametrine"],            // +20 AP, +10 Hit

  // ─── WotLK Purple Gems ───────────────────────────────────────────
  [40011, "Purified Twilight Opal"],    // +8 SP, +8 Spirit
  [40022, "Shifting Twilight Opal"],    // +8 Agi, +12 Stam
  [40027, "Sovereign Twilight Opal"],   // +8 Str, +12 Stam
  [40029, "Glowing Twilight Opal"],     // +8 SP, +12 Stam
  [40130, "Purified Dreadstone"],       // +10 SP, +10 Spirit
  [40129, "Sovereign Dreadstone"],      // +10 Str, +15 Stam
  [40130, "Purified Dreadstone"],       // +10 SP, +10 Spirit
  [40131, "Shifting Dreadstone"],       // +10 Agi, +15 Stam
  [40132, "Glowing Dreadstone"],        // +10 SP, +15 Stam
  [40134, "Guardian's Dreadstone"],     // +10 Expertise, +15 Stam

  // ─── WotLK Green Gems ────────────────────────────────────────────
  [40088, "Jagged Forest Emerald"],     // +8 Crit, +12 Stam
  [40089, "Enduring Forest Emerald"],   // +8 Def, +12 Stam
  [40091, "Vivid Forest Emerald"],      // +8 Hit, +12 Stam
  [40094, "Forceful Forest Emerald"],   // +8 Haste, +12 Stam
  [40095, "Energized Forest Emerald"],  // +8 Haste, +8 Spirit
  [40105, "Jagged Eye of Zul"],         // +10 Crit, +15 Stam
  [40106, "Enduring Eye of Zul"],       // +10 Def, +15 Stam

  // ─── WotLK Meta Gems ─────────────────────────────────────────────
  [41285, "Chaotic Skyflare Diamond"],  // +21 Crit, 3% Crit Damage
  [41333, "Ember Skyflare Diamond"],    // +25 SP, +2% Int
  [41376, "Revitalizing Skyflare Diamond"], // +11 SP, 3% Crit Heals
  [41380, "Austere Earthsiege Diamond"], // +32 Stam, +2% Armor
  [41389, "Beaming Earthsiege Diamond"], // +21 Crit, +2% Mana
  [41395, "Insightful Earthsiege Diamond"], // +21 Int, Proc Mana
  [41398, "Relentless Earthsiege Diamond"], // +21 Agi, 3% Crit Damage
  [41401, "Bracing Earthsiege Diamond"], // +25 SP, -2% Threat

  // ─── Cata Uncommon Gems ─────────────────────────────────────────
  // Red (Carnelian)
  [52081, "Bold Carnelian"],            // +20 Str
  [52082, "Delicate Carnelian"],        // +20 Agi
  [52083, "Brilliant Carnelian"],       // +20 Int
  [52084, "Precise Carnelian"],         // +20 Expertise
  [52085, "Flashing Carnelian"],        // +20 Parry
  // Blue (Zephyrite)
  [52086, "Solid Zephyrite"],           // +30 Stam
  [52087, "Sparkling Zephyrite"],       // +20 Spirit
  [52088, "Rigid Zephyrite"],           // +20 Hit
  [52089, "Stormy Zephyrite"],          // +20 Spell Pen
  // Yellow (Alicite)
  [52090, "Smooth Alicite"],            // +20 Crit
  [52091, "Fractured Alicite"],         // +20 Mastery
  [52093, "Quick Alicite"],             // +20 Haste
  [52094, "Mystic Alicite"],            // +20 Resilience
  // Orange (Hessonite)
  [52095, "Inscribed Hessonite"],       // +10 Str, +10 Crit
  [52096, "Potent Hessonite"],          // +10 Int, +10 Crit
  [52097, "Fierce Hessonite"],          // +10 Str, +10 Haste
  [52098, "Deft Hessonite"],            // +10 Agi, +10 Haste
  [52099, "Reckless Hessonite"],        // +10 Int, +10 Haste
  [52100, "Deadly Hessonite"],          // +10 Agi, +10 Crit
  [52101, "Artful Hessonite"],          // +10 Int, +10 Mastery
  [52102, "Keen Hessonite"],            // +10 Int, +10 Hit... wait, Expertise
  [52103, "Fine Hessonite"],            // +10 Parry, +10 Mastery
  [52104, "Polished Hessonite"],        // +10 Agi, +10 Dodge... wait
  // Green (Jasper)
  [52119, "Jagged Jasper"],             // +10 Crit, +15 Stam
  [52120, "Piercing Jasper"],           // +10 Crit, +10 Hit
  [52121, "Forceful Jasper"],           // +10 Haste, +15 Stam
  [52122, "Lightning Jasper"],          // +10 Haste, +10 Hit
  [52123, "Puissant Jasper"],           // +10 Mastery, +15 Stam
  [52124, "Zen Jasper"],               // +10 Mastery, +10 Spirit
  [52125, "Sensei's Jasper"],           // +10 Mastery, +10 Hit
  // Purple (Nightstone)
  [52107, "Sovereign Nightstone"],      // +10 Str, +15 Stam
  [52108, "Shifting Nightstone"],       // +10 Agi, +15 Stam
  [52109, "Timeless Nightstone"],       // +10 Int, +15 Stam
  [52110, "Purified Nightstone"],       // +10 Int, +10 Spirit
  [52111, "Guardian's Nightstone"],     // +10 Expertise, +15 Stam
  [52112, "Defender's Nightstone"],     // +10 Parry, +15 Stam

  // ─── Cata Rare Orange Gems ────────────────────────────────────────
  [52215, "Inscribed Ember Topaz"],     // +20 Str, +20 Crit
  [52216, "Potent Ember Topaz"],        // +20 Int, +20 Crit
  [52217, "Fierce Ember Topaz"],        // +20 Str, +20 Haste
  [52218, "Deft Ember Topaz"],          // +20 Agi, +20 Haste
  [52219, "Reckless Ember Topaz"],      // +20 Int, +20 Haste
  [52220, "Deadly Ember Topaz"],        // +20 Agi, +20 Crit
  [52222, "Artful Ember Topaz"],        // +20 Int, +20 Mastery
  [52224, "Adept Ember Topaz"],         // +20 Agi, +20 Mastery

  // ─── Cata Rare Green Gems ─────────────────────────────────────────
  [52225, "Jagged Dream Emerald"],      // +20 Crit, +30 Stam
  [52227, "Forceful Dream Emerald"],    // +20 Haste, +30 Stam
  [52228, "Puissant Dream Emerald"],    // +20 Mastery, +30 Stam
  [52229, "Zen Dream Emerald"],         // +20 Mastery, +20 Spirit
  [52233, "Sensei's Dream Emerald"],    // +20 Mastery, +20 Hit
  [52236, "Lightning Dream Emerald"],   // +20 Haste, +20 Hit
  [52245, "Piercing Dream Emerald"],    // +20 Crit, +20 Hit

  // ─── Cata Rare Purple Gems ────────────────────────────────────────
  [52234, "Sovereign Demonseye"],       // +20 Str, +30 Stam
  [52236, "Shifting Demonseye"],        // +20 Agi, +30 Stam
  [52237, "Timeless Demonseye"],        // +20 Int, +30 Stam
  [52238, "Purified Demonseye"],        // +20 Int, +20 Spirit
  [52240, "Guardian's Demonseye"],      // +20 Expertise, +30 Stam
  [52243, "Veiled Demonseye"],          // +20 Int, +20 Hit
  [52246, "Glinting Demonseye"],        // +20 Agi, +20 Hit
  [52247, "Etched Demonseye"],          // +20 Str, +20 Hit
  [52248, "Accurate Demonseye"],        // +20 Expertise, +20 Hit

  // ─── Cata Meta Gems ──────────────────────────────────────────────
  [52291, "Chaotic Shadowspirit Diamond"], // +54 Crit, 3% Crit Damage
  [52293, "Austere Shadowspirit Diamond"], // +81 Stam, +2% Armor
  [52295, "Ember Shadowspirit Diamond"],   // +54 Int, +2% Mana
  [52296, "Revitalizing Shadowspirit Diamond"], // +54 Spirit, 3% Crit Heals
  [52297, "Destructive Shadowspirit Diamond"], // +54 Crit, +1% Spell Reflect
  [52298, "Powerful Shadowspirit Diamond"], // +81 Stam, -10% Stun
  [52299, "Enigmatic Shadowspirit Diamond"], // +54 Crit, -10% Snare
  [52300, "Impassive Shadowspirit Diamond"], // +54 Crit, Fear reduction
  [68778, "Agile Shadowspirit Diamond"],   // +54 Agi, 3% Crit Damage
  [68779, "Reverberating Shadowspirit Diamond"], // +54 Str, 3% Crit Damage
  [68780, "Burning Shadowspirit Diamond"], // +54 Int, 3% Crit Damage

  // ─── Cata Red Gems ────────────────────────────────────────────────
  [52206, "Bold Inferno Ruby"],         // +40 Str
  [52207, "Brilliant Inferno Ruby"],    // +40 Int
  [52212, "Delicate Inferno Ruby"],     // +40 Agi
  [52210, "Flashing Inferno Ruby"],     // +40 Parry
  [52214, "Subtle Inferno Ruby"],       // +40 Dodge
  [52230, "Precise Inferno Ruby"],      // +40 Expertise
  [71878, "Delicate Queen's Garnet"],   // +50 Agi
  [71879, "Brilliant Queen's Garnet"],  // +50 Int
  [71880, "Bold Queen's Garnet"],       // +50 Str

  // ─── Cata Blue Gems ───────────────────────────────────────────────
  [52235, "Rigid Ocean Sapphire"],      // +40 Hit
  [52242, "Solid Ocean Sapphire"],      // +60 Stam
  [52244, "Sparkling Ocean Sapphire"],  // +40 Spirit
  [71820, "Solid Deepholm Iolite"],     // +75 Stam
  [71823, "Sparkling Deepholm Iolite"], // +50 Spirit

  // ─── Cata Yellow Gems ─────────────────────────────────────────────
  [52232, "Quick Amberjewel"],          // +40 Haste
  [52234, "Smooth Amberjewel"],         // +40 Crit
  [52239, "Fractured Amberjewel"],      // +40 Mastery
  [52241, "Mystic Amberjewel"],         // +40 Resilience

  // ─── MoP Red Gems ────────────────────────────────────────────────
  [76693, "Bold Primordial Ruby"],      // +160 Str
  [76694, "Delicate Primordial Ruby"],  // +160 Agi
  [76695, "Brilliant Primordial Ruby"], // +160 Int
  [76696, "Flashing Primordial Ruby"],  // +160 Parry
  [76697, "Precise Primordial Ruby"],   // +160 Expertise

  // ─── MoP Blue Gems ───────────────────────────────────────────────
  [76698, "Solid River's Heart"],       // +240 Stam
  [76699, "Rigid River's Heart"],       // +160 Hit
  [76700, "Sparkling River's Heart"],   // +160 Spirit

  // ─── MoP Yellow Gems ─────────────────────────────────────────────
  [76701, "Smooth Sun's Radiance"],     // +160 Crit
  [76702, "Fractured Sun's Radiance"],  // +160 Mastery
  [76703, "Quick Sun's Radiance"],      // +160 Haste

  // ─── MoP Orange Gems ─────────────────────────────────────────────
  [76704, "Inscribed Vermilion Onyx"],  // +80 Str, +80 Crit
  [76705, "Potent Vermilion Onyx"],     // +80 Int, +80 Crit
  [76706, "Fierce Vermilion Onyx"],     // +80 Str, +80 Haste
  [76707, "Deft Vermilion Onyx"],       // +80 Agi, +80 Haste
  [76708, "Reckless Vermilion Onyx"],   // +80 Int, +80 Haste
  [76709, "Deadly Vermilion Onyx"],     // +80 Agi, +80 Crit
  [76710, "Artful Vermilion Onyx"],     // +80 Int, +80 Mastery
  [76711, "Keen Vermilion Onyx"],       // +80 Expertise, +80 Mastery
  [76712, "Adept Vermilion Onyx"],      // +80 Agi, +80 Mastery
  [76713, "Wicked Vermilion Onyx"],     // +80 Expertise, +80 Crit
  [76714, "Willful Vermilion Onyx"],    // +80 Int, +80 Resilience
  [76715, "Splendid Vermilion Onyx"],   // +80 Mastery, +80 Resilience
  [76716, "Resplendent Vermilion Onyx"], // +80 Str, +80 Resilience
  [76717, "Lucent Vermilion Onyx"],     // +80 Agi, +80 Resilience
  [76718, "Tenuous Vermilion Onyx"],    // +80 Expertise, +80 Resilience

  // ─── MoP Green Gems ──────────────────────────────────────────────
  [76719, "Jagged Wild Jade"],          // +80 Crit, +120 Stam
  [76720, "Piercing Wild Jade"],        // +80 Crit, +80 Hit
  [76721, "Forceful Wild Jade"],        // +80 Haste, +120 Stam
  [76722, "Lightning Wild Jade"],       // +80 Haste, +80 Hit
  [76723, "Puissant Wild Jade"],        // +80 Mastery, +120 Stam
  [76724, "Zen Wild Jade"],             // +80 Mastery, +80 Spirit
  [76725, "Sensei's Wild Jade"],        // +80 Mastery, +80 Hit
  [76726, "Effulgent Wild Jade"],       // +80 Mastery, +80 PvP Power
  [76727, "Radiant Wild Jade"],         // +80 Crit, +80 PvP Power

  // ─── MoP Purple Gems ─────────────────────────────────────────────
  [76728, "Sovereign Imperial Amethyst"],  // +80 Str, +120 Stam
  [76729, "Shifting Imperial Amethyst"],   // +80 Agi, +120 Stam
  [76730, "Timeless Imperial Amethyst"],   // +80 Int, +120 Stam
  [76731, "Purified Imperial Amethyst"],   // +80 Int, +80 Spirit
  [76732, "Guardian's Imperial Amethyst"], // +80 Expertise, +120 Stam
  [76733, "Accurate Imperial Amethyst"],   // +80 Expertise, +80 Hit
  [76734, "Veiled Imperial Amethyst"],     // +80 Int, +80 Hit
  [76735, "Etched Imperial Amethyst"],     // +80 Str, +80 Hit
  [76736, "Glinting Imperial Amethyst"],   // +80 Agi, +80 Hit

  // ─── MoP Meta Gems ───────────────────────────────────────────────
  [76884, "Agile Primal Diamond"],      // +216 Agi, 3% Crit Damage
  [76885, "Reverberating Primal Diamond"], // +216 Str, 3% Crit Damage
  [76886, "Burning Primal Diamond"],    // +216 Int, 3% Crit Damage
  [76887, "Austere Primal Diamond"],    // +324 Stam, +2% Armor
  [76888, "Ember Primal Diamond"],      // +216 Int, +2% Mana
  [76890, "Revitalizing Primal Diamond"], // +216 Spirit, 3% Crit Heals
  [76891, "Destructive Primal Diamond"], // +216 Crit, +1% Spell Reflect
  [76892, "Powerful Primal Diamond"],   // +324 Stam, -10% Stun
  [76893, "Enigmatic Primal Diamond"],  // +216 Crit, -10% Snare
  [76894, "Impassive Primal Diamond"],  // +216 Crit, Fear reduction
  [76895, "Courageous Primal Diamond"], // +324 Int, Proc
]);

// ─── Class Buff Definitions ──────────────────────────────────────────

import type { RaidRole } from "./wcl-types";

export interface ClassBuffFamily {
  name: string;
  spellIds: Set<number>;
  expectedRoles: RaidRole[];
  isWarningFor?: RaidRole[];
  warningReason?: string;
  /** Which wowhead domains (expansions) this buff family applies to */
  expansions?: string[];
}

export const CLASS_BUFF_FAMILIES: ClassBuffFamily[] = [
  // ── Paladin Blessings ──
  {
    name: "Blessing of Might",
    spellIds: new Set([
      // BoM ranks 1-10
      19740, 19834, 19835, 19836, 19837, 19838, 25291, 27140, 48931, 48932,
      // Greater BoM ranks 1-4
      25782, 25916, 27141, 48933, 48934,
    ]),
    expectedRoles: ["Physical", "Tank"],
  },
  {
    name: "Blessing of Wisdom",
    spellIds: new Set([
      // BoW ranks 1-9
      19742, 19850, 19852, 19853, 19854, 25290, 27142, 48935, 48936,
      // Greater BoW ranks 1-4
      25894, 25918, 27143, 48937, 48938,
    ]),
    expectedRoles: ["Caster", "Healer"],
  },
  {
    name: "Blessing of Kings",
    spellIds: new Set([20217, 25898]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  {
    name: "Blessing of Salvation",
    spellIds: new Set([1038, 25895]),
    expectedRoles: [],
    isWarningFor: ["Tank"],
    warningReason: "Salvation on Tank reduces threat",
    expansions: ["classic", "tbc"],
  },
  // ── Priest Buffs ──
  {
    name: "Power Word: Fortitude",
    spellIds: new Set([
      // Fort ranks 1-8
      1243, 1244, 1245, 2791, 10937, 10938, 25389, 48161,
      // Prayer of Fortitude ranks 1-4
      21562, 21564, 25392, 48162,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  {
    name: "Divine Spirit",
    spellIds: new Set([
      // DS ranks 1-5
      14752, 14818, 14819, 27841, 25312,
      // Prayer of Spirit ranks 1-3
      27681, 32999, 48073, 48074,
    ]),
    expectedRoles: ["Caster", "Healer"],
    expansions: ["classic", "tbc", "wrath"],
  },
  {
    name: "Shadow Protection",
    spellIds: new Set([
      // Shadow Protection ranks 1-5
      976, 10957, 10958, 25433, 48169,
      // Prayer of Shadow Protection ranks 1-3
      27683, 39374, 48170,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  // ── Druid Buffs ──
  {
    name: "Mark of the Wild",
    spellIds: new Set([
      // MotW ranks 1-9
      1126, 5232, 6756, 5234, 8907, 9884, 9885, 26990, 48469,
      // Gift of the Wild ranks 1-4
      21849, 21850, 26991, 48470,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  // ── Mage Buffs ──
  {
    name: "Arcane Intellect",
    spellIds: new Set([
      // AI ranks 1-7
      1459, 1460, 1461, 10156, 10157, 27126, 42995,
      // Arcane Brilliance ranks 1-3
      23028, 27127, 43002,
    ]),
    expectedRoles: ["Caster", "Healer"],
  },
  // ── Warrior Shouts ──
  {
    name: "Battle Shout",
    spellIds: new Set([
      // Ranks 1-9
      6673, 5242, 6192, 11549, 11550, 11551, 25289, 2048, 47436,
    ]),
    expectedRoles: ["Physical", "Tank"],
  },
  {
    name: "Commanding Shout",
    spellIds: new Set([
      // Ranks 1-4
      469, 47439, 47440, 25203,
    ]),
    expectedRoles: ["Tank"],
  },
];

// ─── Gem Stat Database ───────────────────────────────────────────────

export type GemStatType =
  | "spell_hit" | "melee_hit" | "spell_power" | "attack_power"
  | "strength" | "agility" | "intellect" | "spirit" | "defense"
  | "dodge" | "parry" | "stamina" | "haste" | "crit" | "hit"
  | "expertise" | "armor_penetration" | "neutral";

export interface GemInfo {
  name: string;
  statType: GemStatType;
  badForRoles: RaidRole[];
}

export const GEM_STAT_DB = new Map<number, GemInfo>([
  // ─── TBC Gems ─────────────────────────────────────────────────────

  // Spell hit (Rigid / Great Lionseye variants) → bad for Physical/Tank
  [32206, { name: "Rigid Star of Elune", statType: "spell_hit", badForRoles: ["Physical", "Tank"] }],
  [32215, { name: "Rigid Dawnstone", statType: "spell_hit", badForRoles: ["Physical", "Tank"] }],
  [35707, { name: "Rigid Lionseye", statType: "spell_hit", badForRoles: ["Physical", "Tank"] }],

  // Spell power (Runed / Luminous) → bad for Physical
  [32196, { name: "Runed Living Ruby", statType: "spell_power", badForRoles: ["Physical"] }],
  [35488, { name: "Runed Crimson Spinel", statType: "spell_power", badForRoles: ["Physical"] }],
  [32211, { name: "Luminous Noble Topaz", statType: "spell_power", badForRoles: ["Physical", "Tank"] }],
  [35760, { name: "Luminous Pyrestone", statType: "spell_power", badForRoles: ["Physical", "Tank"] }],

  // Attack power (Bold / Inscribed) → bad for Caster/Healer
  [32193, { name: "Bold Living Ruby", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],
  [35489, { name: "Bold Crimson Spinel", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],
  [32217, { name: "Inscribed Noble Topaz", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],
  [35758, { name: "Inscribed Pyrestone", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],

  // Defense (Thick / Enduring) → bad for DPS roles
  [32200, { name: "Thick Dawnstone", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [35702, { name: "Thick Lionseye", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [32208, { name: "Enduring Talasite", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [35703, { name: "Enduring Seaspray Emerald", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],

  // ─── WotLK Gems ───────────────────────────────────────────────────

  // Spell power (Runed) → bad for Physical
  [39998, { name: "Runed Scarlet Ruby", statType: "spell_power", badForRoles: ["Physical"] }],
  [40113, { name: "Runed Cardinal Ruby", statType: "spell_power", badForRoles: ["Physical"] }],

  // Attack power (Bold) → bad for Caster/Healer
  [39996, { name: "Bold Scarlet Ruby", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],
  [40111, { name: "Bold Cardinal Ruby", statType: "attack_power", badForRoles: ["Caster", "Healer"] }],

  // Strength (Bold) → bad for Caster/Healer
  [39900, { name: "Bold Bloodstone", statType: "strength", badForRoles: ["Caster", "Healer"] }],

  // Hit rating (Rigid) → universal hit, generally fine but pure hit gems:
  [40014, { name: "Rigid Autumn's Glow", statType: "hit", badForRoles: [] }],
  [40125, { name: "Rigid King's Amber", statType: "hit", badForRoles: [] }],

  // Spell hit (Veiled) → spell power + hit, bad for Physical/Tank
  [40023, { name: "Veiled Monarch Topaz", statType: "spell_hit", badForRoles: ["Physical", "Tank"] }],
  [40133, { name: "Veiled Ametrine", statType: "spell_hit", badForRoles: ["Physical", "Tank"] }],

  // Defense (Thick / Enduring) → bad for DPS
  [40015, { name: "Thick Autumn's Glow", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40126, { name: "Thick King's Amber", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40089, { name: "Enduring Forest Emerald", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40106, { name: "Enduring Eye of Zul", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Dodge (Subtle) → bad for DPS
  [40000, { name: "Subtle Scarlet Ruby", statType: "dodge", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40115, { name: "Subtle Cardinal Ruby", statType: "dodge", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Parry (Flashing) → bad for DPS
  [40001, { name: "Flashing Scarlet Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40116, { name: "Flashing Cardinal Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Stamina-only (Solid) → warning for DPS
  [39919, { name: "Solid Sky Sapphire", statType: "stamina", badForRoles: ["Physical", "Caster", "Healer"] }],
  [40119, { name: "Solid Majestic Zircon", statType: "stamina", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Armor pen (Fractured) → bad for Caster/Healer
  [40002, { name: "Fractured Scarlet Ruby", statType: "armor_penetration", badForRoles: ["Caster", "Healer"] }],
  [40117, { name: "Fractured Cardinal Ruby", statType: "armor_penetration", badForRoles: ["Caster", "Healer"] }],

  // Spirit (Sparkling) → bad for Physical/Tank
  [40010, { name: "Sparkling Sky Sapphire", statType: "spirit", badForRoles: ["Physical", "Tank"] }],
  [40120, { name: "Sparkling Majestic Zircon", statType: "spirit", badForRoles: ["Physical", "Tank"] }],

  // Intellect (Brilliant) → bad for Physical/Tank
  [40012, { name: "Brilliant Autumn's Glow", statType: "intellect", badForRoles: ["Physical", "Tank"] }],
  [40123, { name: "Brilliant King's Amber", statType: "intellect", badForRoles: ["Physical", "Tank"] }],

  // ─── Cata Gems ────────────────────────────────────────────────────

  // Spell power (Brilliant Inferno Ruby) → bad for Physical
  [52207, { name: "Brilliant Inferno Ruby", statType: "intellect", badForRoles: ["Physical"] }],
  [71879, { name: "Brilliant Queen's Garnet", statType: "intellect", badForRoles: ["Physical"] }],

  // Strength (Bold Inferno Ruby) → bad for Caster/Healer
  [52206, { name: "Bold Inferno Ruby", statType: "strength", badForRoles: ["Caster", "Healer"] }],
  [71880, { name: "Bold Queen's Garnet", statType: "strength", badForRoles: ["Caster", "Healer"] }],

  // Agility (Delicate Inferno Ruby) → bad for Caster/Healer
  [52212, { name: "Delicate Inferno Ruby", statType: "agility", badForRoles: ["Caster", "Healer"] }],
  [71878, { name: "Delicate Queen's Garnet", statType: "agility", badForRoles: ["Caster", "Healer"] }],

  // Defense/Dodge (Subtle / Thick) → bad for DPS
  [52214, { name: "Subtle Inferno Ruby", statType: "dodge", badForRoles: ["Physical", "Caster", "Healer"] }],
  [52210, { name: "Flashing Inferno Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Stamina-only (Solid Ocean Sapphire) → warning for DPS
  [52242, { name: "Solid Ocean Sapphire", statType: "stamina", badForRoles: ["Physical", "Caster", "Healer"] }],
  [71820, { name: "Solid Deepholm Iolite", statType: "stamina", badForRoles: ["Physical", "Caster", "Healer"] }],

  // Spirit (Sparkling Ocean Sapphire) → bad for Physical/Tank
  [52244, { name: "Sparkling Ocean Sapphire", statType: "spirit", badForRoles: ["Physical", "Tank"] }],
  [71823, { name: "Sparkling Deepholm Iolite", statType: "spirit", badForRoles: ["Physical", "Tank"] }],
]);

// ─── Talent Point Expectations ───────────────────────────────────────

export const EXPECTED_TALENT_POINTS: Record<string, number> = {
  classic: 51,
  tbc: 61,
  wrath: 71,
  cata: 41,
  mists: 6,
};
