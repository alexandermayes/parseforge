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
  [62380, { name: "Lesser Flask of Resistance", category: "flask", isSuboptimal: true, betterAlternative: "Flask of Stoneblood or Frost Wyrm" }],
  [53752, { name: "Lesser Flask of Toughness", category: "flask", isSuboptimal: true, betterAlternative: "Flask of Stoneblood or Frost Wyrm" }],

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
  [28519, { name: "Flask of Mighty Restoration", category: "flask", isSuboptimal: false }],
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
  [53763, { name: "Elixir of Protection", category: "guardian_elixir", isSuboptimal: false }],
  [53764, { name: "Elixir of Mighty Mageblood", category: "guardian_elixir", isSuboptimal: false }],
  [60343, { name: "Elixir of Mighty Defense", category: "guardian_elixir", isSuboptimal: false }],
  [60347, { name: "Elixir of Mighty Thoughts", category: "guardian_elixir", isSuboptimal: false }],

  // ─── Cata Elixirs ─────────────────────────────────────────────────
  [79474, { name: "Elixir of the Naga", category: "battle_elixir", isSuboptimal: false }],
  [79468, { name: "Ghost Elixir", category: "battle_elixir", isSuboptimal: false }],
  [79481, { name: "Elixir of Impossible Accuracy", category: "battle_elixir", isSuboptimal: false }],
  [79632, { name: "Elixir of Mighty Speed", category: "battle_elixir", isSuboptimal: false }],
  [79477, { name: "Elixir of the Cobra", category: "battle_elixir", isSuboptimal: false }],
  [79480, { name: "Elixir of Deep Earth", category: "guardian_elixir", isSuboptimal: false }],
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
  [43722, { name: "Enlightened (Skullfish Soup)", category: "food", isSuboptimal: false }],
  [43730, { name: "Electrified", category: "food", isSuboptimal: false }],
  [24799, { name: "Well Fed (Stamina)", category: "food", isSuboptimal: true, betterAlternative: "Stat-specific food" }],
  [24870, { name: "Well Fed (Spirit)", category: "food", isSuboptimal: true, betterAlternative: "Stat-specific food" }],
  [44106, { name: "Well Fed (Hit Rating)", category: "food", isSuboptimal: false }],
  [46687, { name: "Well Fed (Broiled Bloodfin)", category: "food", isSuboptimal: false }],
  [25661, { name: "Increased Stamina (Food)", category: "food", isSuboptimal: false }],

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
  [57365, { name: "Cuttlesteak", category: "food", isSuboptimal: false }],
  [57367, { name: "Spicy Blue Nettlefish", category: "food", isSuboptimal: false }],
  [57371, { name: "Tender Shoveltusk Steak", category: "food", isSuboptimal: true, betterAlternative: "Higher-stat food (e.g. Fish Feast)" }],
  [57373, { name: "Mighty Rhino Dogs", category: "food", isSuboptimal: true, betterAlternative: "Higher-stat food (e.g. Fish Feast)" }],

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
  // Note: 28093 "Lightning Speed" (Mongoose proc) and 28095 (enchant procs) were
  // removed — they're permanent-enchant proc buffs, not oils/stones, and falsely
  // credited enchant users with a weapon-enhancement consumable.
  [55836, { name: "Titanium Weapon Chain", category: "weapon_enhancement", isSuboptimal: false }],
  // Cata
  [96264, { name: "Pyrium Weapon Chain (Cata)", category: "weapon_enhancement", isSuboptimal: false }],
  [96294, { name: "Pyrium Shield Spike (Cata)", category: "weapon_enhancement", isSuboptimal: false }],

  // ─── Scroll Buffs ─────────────────────────────────────────────────
  // WotLK rank VIII scrolls (buff spell IDs verified vs 3.4.5 client data)
  [43199, { name: "Scroll of Strength VIII", category: "scroll", isSuboptimal: false }],
  [43194, { name: "Scroll of Agility VIII", category: "scroll", isSuboptimal: false }],
  [43195, { name: "Scroll of Intellect VIII", category: "scroll", isSuboptimal: false }],
  [43197, { name: "Scroll of Spirit VIII", category: "scroll", isSuboptimal: false }],
  [43198, { name: "Scroll of Stamina VIII", category: "scroll", isSuboptimal: false }],
  [43196, { name: "Scroll of Protection VIII", category: "scroll", isSuboptimal: false }],
  // TBC rank V scrolls (top rank in TBC — not suboptimal there; IDs verified vs 2.5.6)
  [33077, { name: "Scroll of Agility V", category: "scroll", isSuboptimal: false }],
  [33082, { name: "Scroll of Strength V", category: "scroll", isSuboptimal: false }],
  [33078, { name: "Scroll of Intellect V", category: "scroll", isSuboptimal: false }],
  [33080, { name: "Scroll of Spirit V", category: "scroll", isSuboptimal: false }],
  [33081, { name: "Scroll of Stamina V", category: "scroll", isSuboptimal: false }],
  [33079, { name: "Scroll of Protection V", category: "scroll", isSuboptimal: false }],
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
// Maps WCL permanentEnchant IDs (SpellItemEnchantment IDs) to display names.
// IDs + names verified against client data (wago.tools SpellItemEnchantment /
// SpellEffect / SpellName): Classic+TBC = 2.5.6.69546 (TBC Anniversary),
// WotLK = 3.4.5.63697, Cata = 4.4.2.60895, MoP = 5.5.4.69585.

export const ENCHANT_NAME_DB = new Map<number, string>([
  // ─── Classic Head ─────────────────────────────────────────────────
  [1503, "Lesser Arcane Amalgamation (+100 HP)"],
  [1504, "Lesser Arcane Amalgamation (+125 Armor)"],
  [1506, "Lesser Arcane Amalgamation (+8 Strength)"],
  [1510, "Lesser Arcane Amalgamation (+8 Spirit)"],
  [2544, "Arcanum of Focus (+8 Healing and Spell Damage)"],
  [2543, "Arcanum of Rapidity (+10 Haste Rating)"],
  [2545, "Arcanum of Protection (+12 Dodge Rating)"],
  [2583, "Presence of Might (+10 Defense Rating/+10 Stamina/+15 Block Value)"],

  // ─── Classic Shoulder ─────────────────────────────────────────────
  [2717, "Might of the Scourge (+26 Attack Power and +14 Critical Strike Rating)"],
  [2604, "Zandalar Signet of Serenity (+33 Healing Spells and +11 Damage Spells)"],
  [2721, "Power of the Scourge (+15 Spell Damage and +14 Spell Critical Rating)"],
  [2605, "Zandalar Signet of Mojo (+18 Spell Damage and Healing)"],
  [2715, "Resilience of the Scourge (+31 Healing +11 Spell Damage and 5 mana per 5 sec.)"],
  [2606, "Zandalar Signet of Might (+30 Attack Power)"],
  [2716, "Fortitude of the Scourge (+16 Stamina and +100 Armor)"],
  [2718, "Lesser Rune of Warding"],

  // ─── Classic Chest ────────────────────────────────────────────────
  [1891, "Greater Stats (+4 All Stats)"],
  [866, "Lesser Stats (+2 All Stats)"],
  [847, "Minor Stats (+1 All Stats)"],
  [928, "Stats (+3 All Stats)"],
  [1892, "Major Health (+100 Health)"],

  // ─── Classic Weapon ───────────────────────────────────────────────
  [1900, "Crusader"],
  [684, "Major Strength (+15 Strength)"],
  [2564, "Agility (+15 Agility)"],
  [904, "Agility (+5 Agility)"],
  [2646, "Agility (+25 Agility)"],
  [2523, "Biznicks 247x128 Accurascope (+30 Hit Rating)"],
  [2504, "Spell Power (+30 Spell Damage)"],
  [2505, "Healing Power (+55 Healing and +19 Spell Damage)"],

  // ─── Classic Cloak ────────────────────────────────────────────────
  [368, "Greater Agility (+12 Agility)"],
  [1887, "Greater Agility (+7 Agility)"],
  [3222, "Greater Agility (+20 Agility)"],
  [849, "Lesser Agility (+3 Agility)"],
  [2463, "Fire Resistance (+7 Fire Resistance)"],

  // ─── Classic Bracers ──────────────────────────────────────────────
  [1886, "Superior Stamina (+9 Stamina)"],
  [1147, "+18 Spirit"],
  [2566, "Healing Power (+24 Healing and +8 Spell Damage)"],
  [2617, "Healing Power (+30 Healing and +10 Spell Damage)"],
  [2930, "Healing Power (+20 Healing and +7 Spell Damage)"],
  [1593, "Assault (+24 Attack Power)"],
  [1594, "Assault (+26 Attack Power)"],
  [2326, "+44 Healing Spells and +15 Damage Spells"],

  // ─── Classic Boots ────────────────────────────────────────────────
  [911, "Minor Speed (Minor Speed Increase)"],
  [2657, "Dexterity (+12 Agility)"],
  [2658, "Surefooted"],

  // ─── TBC Head Arcanums ────────────────────────────────────────────
  [3003, "Glyph of Ferocity (+34 Attack Power and +16 Hit Rating)"],
  [2999, "Glyph of the Defender (+16 Defense Rating and +17 Dodge Rating)"],
  [3002, "Glyph of Power (+22 Spell Power and +14 Spell Hit Rating)"],
  [3001, "Glyph of Renewal (+35 Healing +12 Spell Damage and 7 Mana Per 5 sec.)"],
  [3007, "Glyph of Fire Warding (+20 Fire Resistance)"],
  [3004, "Glyph of the Gladiator (+18 Stamina and +20 Resilience Rating)"],
  [3005, "Glyph of Nature Warding (+20 Nature Resistance)"],
  [3009, "Glyph of Shadow Warding (+20 Shadow Resistance)"],
  [3006, "Glyph of Arcane Warding (+20 Arcane Resistance)"],
  [3008, "Glyph of Frost Warding (+20 Frost Resistance)"],
  [3095, "Glyph of Chromatic Warding (+8 Resist All)"],
  [3096, "Glyph of the Outcast (+17 Strength and +16 Intellect)"],

  // ─── TBC Shoulder Inscriptions (Aldor) ────────────────────────────
  [2983, "Inscription of Vengeance (+26 Attack Power)"],
  [2974, "+7 Healing +3 Spell Damage"],
  [2979, "Inscription of Faith (+29 Healing and +10 Spell Damage)"],
  [2975, "+5 Block Value"],
  [2981, "Inscription of Discipline (+15 Spell Power)"],
  [2976, "+2 Defense Rating"],
  [2977, "Inscription of Warding (+13 Dodge Rating)"],
  [2986, "Greater Inscription of Vengeance (+30 Attack Power and +10 Critical Strike Rating)"],
  [2978, "Greater Inscription of Warding (+15 Dodge Rating and +10 Defense Rating)"],
  [2980, "Greater Inscription of Faith (+33 Healing and +11 Spell Damage and +4 Mana Regen)"],
  [2982, "Greater Inscription of Discipline (+18 Spell Power and +10 Spell Critical Strike Rating)"],

  // ─── TBC Shoulder Inscriptions (Scryer) ───────────────────────────
  [2996, "Inscription of the Blade (+13 Critical Strike Rating)"],
  [2997, "Greater Inscription of the Blade (+15 Critical Strike Rating and +20 Attack Power)"],
  [2990, "Inscription of the Knight (+13 Defense Rating)"],
  [2987, "Frost Armor Kit (+8 Frost Resist)"],
  [2991, "Greater Inscription of the Knight (+15 Defense Rating and +10 Dodge Rating)"],
  [2992, "Inscription of the Oracle (+5 Mana Regen)"],
  [2993, "Greater Inscription of the Oracle (+6 Mana Regen and +22 Healing)"],
  [2994, "Inscription of the Orb (+13 Spell Critical Strike Rating)"],
  [2995, "Greater Inscription of the Orb (+15 Spell Critical Strike Rating and +12 Spell Damage and Healing)"],
  [2998, "Inscription of Endurance (+7 All Resistances)"],

  // ─── TBC Chest ────────────────────────────────────────────────────
  [1144, "Major Spirit (+15 Spirit)"],
  [1898, "Lifestealing"],
  [1903, "Major Spirit (+9 Spirit)"],
  [2659, "Exceptional Health (+150 Health)"],
  [2661, "Exceptional Stats (+6 All Stats)"],
  [2933, "Major Resilience (+15 Resilience Rating)"],
  [3150, "Restore Mana Prime (+6 mana every 5 sec.)"],

  // ─── TBC Cloak ────────────────────────────────────────────────────
  [2621, "Subtlety"],
  [2622, "Dodge (+12 Dodge Rating)"],
  [2664, "Major Resistance (+7 Resist All)"],
  [2662, "Major Armor (+120 Armor)"],
  [2938, "Spell Penetration (+20 Spell Penetration)"],

  // ─── TBC Bracers ──────────────────────────────────────────────────
  [2931, "Stats (+4 All Stats)"],
  [2647, "Brawn (+12 Strength)"],
  [369, "Major Intellect (+12 Intellect)"],
  [1904, "Major Intellect (+9 Intellect)"],
  [2666, "Major Intellect (+30 Intellect)"],
  [2648, "Major Defense (+12 Defense Rating)"],
  [2649, "Fortitude (+12 Stamina)"],
  [2650, "Spellpower (+15 Spell Damage)"],
  [2928, "Spellpower (+12 Spell Damage)"],
  [2679, "Restore Mana Prime (6 Mana per 5 Sec.)"],

  // ─── TBC Gloves ───────────────────────────────────────────────────
  [2613, "Threat (+2% Threat)"],
  [2669, "Major Spellpower (+40 Spell Damage and Healing)"],
  [2937, "Major Spellpower (+20 Spell Damage)"],
  [2935, "Spell Strike (+15 Spell Hit Rating)"],
  [2322, "Major Healing (+35 Healing Spells and +12 Damage Spells)"],
  [2343, "Major Healing (+81 Healing Spells and +27 Damage Spells)"],
  [930, "Riding Skill (+2% Mount Speed)"],
  [2670, "Major Agility (+35 Agility)"],
  [2934, "Blasting (+10 Spell Critical Strike Rating)"],

  // ─── TBC Legs ─────────────────────────────────────────────────────
  [3011, "Clefthide Leg Armor (+30 Stamina and +10 Agility)"],
  [2743, "+4 Defense Rating and +6 Stamina"],
  [3013, "Nethercleft Leg Armor (+40 Stamina and +12 Agility)"],
  [2744, "+4 Intellect and +2 Mana every 5 seconds"],
  [2748, "Runic Spellthread (+35 Spell Damage and +20 Stamina)"],
  [2745, "Silver Spellthread (+46 Healing +16 Spell Damage and +15 Stamina)"],
  [2747, "Mystic Spellthread (+25 Spell Damage and +15 Stamina)"],
  [2746, "Golden Spellthread (+66 Healing +22 Spell Damage and +20 Stamina)"],
  [3012, "Nethercobra Leg Armor (+50 Attack Power and +12 Critical Strike Rating)"],
  [3010, "Cobrahide Leg Armor (+40 Attack Power and +10 Critical Strike Rating)"],

  // ─── TBC Boots ────────────────────────────────────────────────────
  [2656, "Vitality"],
  [2939, "Cat's Swiftness (Minor Speed and +6 Agility)"],
  [2940, "Boar's Speed (Minor Speed and +9 Stamina)"],

  // ─── TBC Weapons ──────────────────────────────────────────────────
  [2667, "Savagery"],
  [2671, "Sunfire"],
  [2672, "Soulfrost"],
  [2673, "Mongoose"],
  [2674, "Spellsurge"],
  [2675, "Battlemaster"],
  [3225, "Executioner"],
  [3273, "Deathfrost"],

  // (era-corrected: found in 3.4.5.63697 (WotLK Classic))
  [3239, "Icebreaker (Icebreaker Weapon)"],

  // (era-corrected: found in 3.4.5.63697 (WotLK Classic))
  [3241, "Lifeward"],

  // ─── TBC Shield ───────────────────────────────────────────────────
  [2653, "Tough Shield (+18 Block Value)"],
  [3229, "Resilience (+12 Resilience Rating)"],
  [2654, "Intellect (+12 Intellect)"],
  [903, "Resistance (+3 All Resistances)"],
  [1888, "Greater Resistance (+5 All Resistances)"],
  [2655, "Enchant Shield (+15 Shield Block Rating)"],

  // ─── WotLK Head Arcanums ──────────────────────────────────────────
  [3817, "Arcanum of Torment (+50 Attack Power and +20 Critical Strike Rating)"],
  [3812, "Arcanum of the Frosty Soul (+25 Frost Resistance and +30 Stamina)"],
  [3819, "Arcanum of Blissful Mending (+30 Spell Power and 10 mana per 5 seconds.)"],
  [3815, "Arcanum of the Eclipsed Moon (+25 Arcane Resistance and +30 Stamina)"],
  [3795, "Arcanum of Triumph (+50 Attack Power and +20 Resilience Rating)"],
  [3796, "Arcanum of Dominance (+29 Spell Power and +20 Resilience Rating)"],
  [3797, "Arcanum of Dominance (+29 Spell Power and +20 Resilience Rating)"],
  [3818, "Arcanum of the Stalwart Protector (+37 Stamina and +20 Defense Rating)"],
  [3820, "Arcanum of Burning Mysteries (+30 Spell Power and 20 Critical strike rating.)"],

  // ─── WotLK Shoulder Inscriptions ──────────────────────────────────
  [3875, "Inscription of the Axe (+30 Attack Power and +10 Critical Strike Rating)"],
  [3806, "Inscription of the Storm (+18 Spell Power and +10 Critical Strike Rating)"],
  [3807, "Inscription of the Crag (+18 Spell Power and +5 Mana per 5 sec)"],
  [3808, "Greater Inscription of the Axe (+40 Attack Power and +15 Crit Rating)"],
  [3809, "Greater Inscription of the Crag (+24 Spell Power and +8 Mana per 5 sec)"],
  [3810, "Greater Inscription of the Storm (+24 Spell Power and +15 Critical Strike Rating)"],
  [3811, "Greater Inscription of the Pinnacle (+20 Dodge Rating and +15 Defense Rating)"],
  [3876, "Inscription of the Pinnacle (+15 Dodge Rating and +10 Defense Rating)"],
  [3793, "Inscription of Triumph (+40 Attack Power and +15 Resilience Rating)"],
  [3794, "Inscription of Dominance (+23 Spell Power and +15 Resilience Rating)"],
  [3835, "Master's Inscription of the Axe (+120 Attack Power and +15 Crit Rating)"],
  [3836, "Master's Inscription of the Crag (+70 Spell Power and +8 Mana/5 seconds)"],
  [3837, "Master's Inscription of the Pinnacle (+60 Dodge Rating and +15 Defense Rating)"],
  [3838, "Master's Inscription of the Storm (+70 Spell Power and +15 Crit Rating)"],
  [3852, "Greater Inscription of the Gladiator (+30 Stamina and +15 Resilience Rating)"],

  // ─── WotLK Chest ──────────────────────────────────────────────────
  [3252, "Super Stats (+8 All Stats)"],
  [3233, "Exceptional Mana (+250 Mana)"],
  [3236, "Mighty Health (+200 Health)"],
  [3245, "Exceptional Resilience (+20 Resilience Rating)"],
  [3297, "Super Health (+275 Health)"],
  [884, "Greater Defense (+50 Armor)"],
  [1953, "Greater Defense (+22 Defense Rating)"],
  [3832, "Powerful Stats (+10 All Stats)"],

  // ─── WotLK Cloak ──────────────────────────────────────────────────
  [983, "Superior Agility (+16 Agility)"],
  [3230, "Superior Frost Resistance (+20 Frost Resistance)"],
  [3243, "Spell Piercing (+35 Spell Penetration)"],
  [3256, "Shadow Armor (Increased Stealth and +10 Agility)"],
  [3296, "Wisdom (+10 Spirit and 2% Reduced Threat)"],
  [3294, "Mighty Armor (+225 Armor)"],
  [3825, "Speed (+15 Haste Rating)"],
  [3831, "Greater Speed (+23 Haste Rating)"],
  [3859, "Springy Arachnoweave (+27 Spell Power)"],
  [3605, "Flexweave Underlay"],

  // ─── WotLK Bracers ───────────────────────────────────────────────
  [3231, "Expertise (+15 Expertise Rating)"],
  [2332, "Superior Spellpower (+30 Spell Power)"],
  [3757, "Fur Lining - Stamina (+102 Stamina)"],
  [1119, "Enchant Template (+16 Intellect)"],
  [3758, "Fur Lining - Spell Power (+76 Spell Power)"],
  [1597, "Greater Assault (+32 Attack Power)"],
  [3829, "Greater Assault (+35 Attack Power)"],
  [3845, "Greater Assault (+50 Attack Power)"],
  [1071, "Major Stamina (+18 Stamina)"],
  [3850, "Major Stamina (+40 Stamina)"],
  [3756, "Fur Lining - Attack Power (+130 Attack Power)"],

  // ─── WotLK Gloves ────────────────────────────────────────────────
  [3234, "Precision (+20 Hit Rating)"],
  [3246, "Exceptional Spellpower (+28 Spell Power)"],
  [3830, "Exceptional Spellpower (+50 Spell Power)"],
  [1603, "Crusher (+44 Attack Power)"],
  [3253, "Armsman (+2% Threat and 10 Parry Rating)"],
  [3604, "Hyperspeed Accelerators"],
  [3603, "Hand-Mounted Pyro Rocket"],
  [3860, "Reticulated Armor Webbing (+885 Armor)"],

  // ─── WotLK Legs ──────────────────────────────────────────────────
  [3823, "Icescale Leg Armor (+75 Attack Power and +22 Critical Strike Rating)"],
  [3325, "Jormungar Leg Armor (+45 Stamina and +15 Agility)"],
  [3822, "Frosthide Leg Armor (+55 Stamina and +22 Agility)"],
  [3326, "Nerubian Leg Armor (+55 Attack Power and +15 Critical Strike Rating)"],
  [3853, "Earthen Leg Armor (+40 Resilience Rating and +28 Stamina)"],
  [3719, "Brilliant Spellthread (+50 Spell Power and +20 Spirit)"],
  [3718, "Shining Spellthread (+35 Spell Power and +12 Spirit)"],
  [3721, "Sapphire Spellthread (+50 Spell Power and +30 Stamina)"],
  [3720, "Azure Spellthread (+35 Spell Power and +20 Stamina)"],

  // ─── WotLK Boots ─────────────────────────────────────────────────
  [3232, "Tuskarr's Vitality (+15 Stamina and Minor Speed Increase)"],
  [1075, "Greater Fortitude (+22 Stamina)"],
  [3244, "Greater Vitality (+7 Health and Mana every 5 sec)"],
  [3826, "Icewalker (+12 Hit Rating and +12 Critical Strike Rating)"],
  [3824, "Assault (+24 Attack Power)"],
  [907, "Greater Spirit (+7 Spirit)"],
  [3606, "Nitro Boosts (+24 Critical Strike Rating)"],

  // ─── WotLK Weapons ───────────────────────────────────────────────
  [3788, "Accuracy (+25 Hit Rating and +25 Critical Strike Rating)"],
  [3789, "Berserking"],
  [3790, "Black Magic"],
  [3840, "Greater Spellpower (+23 Spell Power)"],
  [3854, "Greater Spellpower (+81 Spell Power)"],
  [3828, "Greater Savagery (+85 Attack Power)"],
  [3827, "Massacre (+110 Attack Power)"],
  [3833, "Superior Potency (+65 Attack Power)"],
  [3834, "Mighty Spellpower (+63 Spell Power)"],
  [3844, "Exceptional Spirit (+45 Spirit)"],
  [3869, "Blade Ward"],
  [3870, "Blood Draining"],

  // ─── WotLK Shield ────────────────────────────────────────────────
  [848, "Defense (+30 Armor)"],
  [1951, "Defense (+16 Defense Rating)"],
  [1952, "Defense (+20 Defense Rating)"],
  [3748, "Titanium Shield Spike (Titanium Spike (45-67))"],
  [3849, "Titanium Plating"],

  // ─── Cata Head Arcanums ───────────────────────────────────────────
  [4206, "Arcanum of the Earthern Ring (+90 Stamina and 35 Dodge rating)"],
  [4207, "Arcanum of Hyjal (+60 Intellect and 35 Critical Strike rating)"],
  [4208, "Arcanum of the Highlands (+60 Strength and 35 mastery rating)"],
  [4209, "Arcanum of Ramkahen (+60 Agility and 35 Haste rating)"],
  [4246, "Arcanum of Vicious Agility (+60 Agility and 35 Resilience rating)"],
  [4247, "Arcanum of Vicious Strength (+60 Strength and 35 Resilience rating)"],
  [4245, "Arcanum of Vicious Intellect (+60 Intellect and 35 Resilience rating)"],
  [4248, "Greater Inscription of Vicious Intellect (+50 Intellect and +25 Resilience Rating)"],

  // ─── Cata Shoulder Inscriptions ───────────────────────────────────
  [4200, "Greater Inscription of Charged Lodestone (+50 Intellect and +25 Haste Rating)"],
  [4193, "Swiftsteel Inscription (+130 Agility and +25 Mastery Rating)"],
  [4202, "Greater Inscription of Jagged Stone (+50 Strength and +25 Critical Strike Rating)"],
  [4194, "Lionsmane Inscription (+130 Strength and +25 Critical Strike Rating)"],
  [4204, "Greater Inscription of Shattered Crystal (+50 Agility and +25 Mastery Rating)"],
  [4195, "Inscription of the Earth Prince (+195 Stamina and +25 Dodge Rating)"],
  [4198, "Greater Inscription of Unbreakable Quartz (+75 Stamina and +25 Dodge Rating)"],
  [4196, "Felfire Inscription (+130 Intellect and +25 Haste Rating)"],
  [4199, "Inscription of Charged Lodestone (+30 Intellect and +20 Haste Rating)"],
  [4197, "Inscription of Unbreakable Quartz (+45 Stamina and +20 Dodge Rating)"],
  [4201, "Inscription of Jagged Stone (+30 Strength and +20 Critical Strike Rating)"],
  [4203, "Inscription of Shattered Crystal (+30 Agility and +20 Mastery Rating)"],
  [4205, "Inscription of Shattered Crystal (+30 Agility and +20 Mastery Rating)"],
  [4270, "Drakehide Leg Armor (+145 Stamina and +55 Dodge Rating)"],
  [4273, "+50 Hit Rating"],

  // ─── Cata Chest ───────────────────────────────────────────────────
  [4102, "Peerless Stats (+20 All Stats)"],
  [4063, "Mighty Stats (+15 All Stats)"],
  [4088, "Exceptional Spirit (+40 Spirit)"],
  [4093, "Exceptional Spirit (+50 Spirit)"],
  [4070, "Stamina (+55 Stamina)"],
  [929, "Greater Stamina (+7 Stamina)"],
  [4081, "Greater Stamina (+60 Stamina)"],
  [4103, "Greater Stamina (+75 Stamina)"],
  [4077, "Mighty Resilience (+40 Resilience Rating)"],

  // ─── Cata Cloak ───────────────────────────────────────────────────
  [4073, "Protection (+160 Armor)"],
  [4090, "Protection (+250 Armor)"],
  [4064, "Greater Spell Piercing (+70 Spell Penetration)"],
  [905, "Intellect (+5 Intellect)"],
  [4072, "Intellect (+30 Intellect)"],
  [4080, "Intellect (+40 Intellect)"],
  [4087, "Critical Strike (+50 Critical Strike Rating)"],
  [1128, "Greater Intellect (+25 Intellect)"],
  [1883, "Greater Intellect (+7 Intellect)"],
  [4096, "Greater Intellect (+50 Intellect)"],
  [4100, "Greater Critical Strike (+65 Critical Strike Rating)"],
  [4101, "Greater Critical Strike (+65 Critical Strike Rating)"],

  // ─── Cata Bracers ─────────────────────────────────────────────────
  [4108, "Greater Speed (+65 Haste Rating)"],
  [4071, "Critical Strike (+50 Critical Strike Rating)"],
  [4065, "Speed (+50 Haste Rating)"],
  [2568, "Mighty Intellect (+22 Intellect)"],
  [4257, "Mighty Intellect (+50 Intellect)"],
  [4256, "Major Strength (+50 Strength)"],
  [4082, "Greater Expertise (+50 Expertise Rating)"],
  [4095, "Greater Expertise (+50 Expertise Rating)"],
  [4258, "Agility (+50 Agility)"],
  [4089, "Precision (+50 Hit Rating)"],
  [4092, "Precision (+50 Hit Rating)"],

  // ─── Cata Gloves ──────────────────────────────────────────────────
  [4061, "Mastery (+50 Mastery Rating)"],
  [4085, "Mastery (+50 Mastery Rating)"],
  [4094, "Mastery (+50 Mastery Rating)"],
  [4068, "Haste (+50 Haste Rating)"],
  [4107, "Greater Mastery (+65 Mastery Rating)"],
  [4075, "Exceptional Strength (+35 Strength)"],
  [4106, "Mighty Strength (+50 Strength)"],
  [4069, "Haste (+50 Haste Rating)"],

  // ─── Cata Legs ────────────────────────────────────────────────────
  [4110, "Powerful Ghostly Spellthread (+95 Intellect and +55 Spirit)"],
  [4109, "Ghostly Spellthread (+55 Intellect and +45 Spirit)"],
  [4112, "Powerful Enchanted Spellthread (+95 Intellect and +80 Stamina)"],
  [4126, "Dragonscale Leg Armor (+190 Attack Power and +55 Critical Strike Rating)"],
  [4111, "Enchanted Spellthread (+55 Intellect and +65 Stamina)"],
  [4127, "Charscale Leg Armor (+145 Stamina and +55 Agility)"],
  [4113, "Master's Spellthread (+95 Intellect and +80 Stamina)"],

  // ─── Cata Boots ───────────────────────────────────────────────────
  [4062, "Earthen Vitality (+30 Stamina and Minor Movement Speed)"],
  [4105, "Assassin's Step (+25 Agility and Minor Movement Speed)"],
  [4076, "Major Agility (+35 Agility)"],
  [4104, "Lavawalker (+35 Mastery Rating and Minor Movement Speed)"],
  [4086, "Superior Dodge (+50 Dodge Rating)"],
  [1099, "Major Agility (+22 Agility)"],

  // ─── Cata Weapons ─────────────────────────────────────────────────
  [4067, "Avalanche"],
  [4066, "Mending"],
  [4097, "Power Torrent"],
  [4074, "Elemental Slayer"],
  [4083, "Hurricane"],
  [4084, "Heartsong"],
  [4099, "Landslide"],
  [4098, "Windwalk"],

  // ─── MoP Enchants ─────────────────────────────────────────────────
  [4806, "Greater Crane Wing Inscription (+200 Intellect and +100 Critical Strike)"],
  [5055, "Greater Crane Wing Inscription (+15 Intellect and +8 Critical Strike)"],
  [5091, "Greater Crane Wing Inscription (+11 Intellect and +6 Critical Strike)"],
  [4803, "Greater Tiger Fang Inscription (+200 Strength and +100 Critical Strike)"],
  [4805, "Greater Ox Horn Inscription (+300 Stamina and +100 Dodge)"],
  [4804, "Greater Tiger Claw Inscription (+200 Agility and +100 Critical Strike)"],
  [4419, "Glorious Stats (+80 All Stats)"],
  [5111, "Glorious Stats (+3 All Stats)"],
  [4417, "Super Resilience (+200 PvP Resilience)"],
  [5076, "Super Resilience (+14 PvP Resilience)"],
  [5099, "Super Resilience (+8 PvP Resilience)"],
  [4412, "Major Dodge (+170 Dodge)"],
  [2567, "Mighty Spirit (+20 Spirit)"],
  [4418, "Mighty Spirit (+200 Spirit)"],
  [4420, "Superior Stamina (+300 Stamina)"],
  [4414, "Super Intellect (+180 Intellect)"],
  [4091, "Superior Intellect (+40 Intellect)"],
  [4423, "Superior Intellect (+180 Intellect)"],
  [5056, "Superior Intellect (+14 Intellect)"],
  [5092, "Superior Intellect (+8 Intellect)"],
  [4424, "Superior Critical Strike (+180 Critical Strike)"],
  [4421, "Accuracy (+180 Hit)"],
  [4359, "Greater Agility (+160 Agility)"],
  [4416, "Greater Agility (+180 Agility)"],
  [5258, "Greater Agility (+12 Agility)"],
  [4415, "Exceptional Strength (+180 Strength)"],
  [4992, "Exceptional Strength (Scaling) (+0 Strength (Scaling))"],
  [5057, "Super Intellect (+14 Intellect)"],
  [5093, "Super Intellect (+8 Intellect)"],
  [5112, "Super Intellect (+7 Intellect)"],
  [4426, "Greater Haste (+175 Haste)"],
  [4430, "Greater Haste (+170 Haste)"],
  [5058, "Greater Haste (+14 Haste)"],
  [5094, "Greater Haste (+8 Haste)"],
  [4433, "Superior Mastery (+170 Mastery)"],
  [5080, "Superior Mastery (+12 Mastery)"],
  [5100, "Superior Mastery (+7 Mastery)"],
  [4431, "Superior Expertise (+170 Expertise)"],
  [4432, "Super Strength (+170 Strength)"],
  [1885, "Superior Strength (+9 Strength)"],
  [4823, "Angerhide Leg Armor (+285 Strength and +165 Critical Strike)"],
  [4822, "Shadowleather Leg Armor (+285 Agility and +165 Critical Strike)"],
  [4824, "Ironscale Leg Armor (+430 Stamina and +165 Dodge)"],
  [4869, "Sha Armor Kit (+150 Stamina)"],
  [4826, "Greater Pearlescent Spellthread (+285 Intellect and +165 Spirit)"],
  [4825, "Greater Cerulean Spellthread (+285 Intellect and +165 Critical Strike)"],
  [5059, "Greater Cerulean Spellthread (+22 Intellect and +14 Critical Strike)"],
  [5095, "Greater Cerulean Spellthread (+13 Intellect and +8 Critical Strike)"],
  [4429, "Pandaren's Step (+140 Mastery & Minor Speed Increase)"],
  [4427, "Greater Precision (+175 Hit)"],
  [4428, "Blurred Speed (+140 Agility & Minor Speed Increase)"],
  [5060, "Pandaren's Step (+10 Mastery & Minor Speed Increase)"],
  [5096, "Pandaren's Step (+6 Mastery & Minor Speed Increase)"],
  [4441, "Windsong"],
  [4443, "Elemental Force"],
  [4444, "Dancing Steel"],
  [4445, "Colossus"],
  [4446, "River's Song"],
  [4442, "Jade Spirit"],
  [5062, "Jade Spirit"],
  [5098, "Jade Spirit"],
]);

// ─── Gem Name Database ──────────────────────────────────────────────
// Maps gem item IDs to display names (supplements GEM_STAT_DB for display).
// IDs + names verified against client ItemSparse data (wago.tools):
// Classic+TBC = 2.5.6.69546, WotLK = 3.4.5.63697, Cata = 4.4.2.60895, MoP = 5.5.4.69585.

export const GEM_NAME_DB = new Map<number, string>([
  // ─── Classic Gems ─────────────────────────────────────────────────
  // (none)

  // ─── TBC Uncommon Gems ────────────────────────────────────────────
  [23095, "Bold Blood Garnet"],
  [23094, "Teardrop Blood Garnet"],
  [23097, "Delicate Blood Garnet"],
  [23096, "Runed Blood Garnet"],
  [28595, "Bright Blood Garnet"],
  [23098, "Inscribed Flame Spessarite"],
  [23099, "Luminous Flame Spessarite"],
  [23118, "Solid Azure Moonstone"],
  [23109, "Royal Shadow Draenite"],
  [23119, "Sparkling Azure Moonstone"],
  [23110, "Shifting Shadow Draenite"],
  [23121, "Lustrous Azure Moonstone"],
  [23111, "Sovereign Shadow Draenite"],
  [23120, "Stormy Azure Moonstone"],
  [23116, "Rigid Golden Draenite"],
  [23114, "Gleaming Golden Draenite"],
  [23113, "Brilliant Golden Draenite"],
  [23115, "Thick Golden Draenite"],
  [31860, "Great Golden Draenite"],
  [28290, "Smooth Golden Draenite"],
  [23101, "Potent Flame Spessarite"],
  [23100, "Glinting Flame Spessarite"],
  [23104, "Jagged Deep Peridot"],
  [23103, "Radiant Deep Peridot"],
  [23105, "Enduring Deep Peridot"],
  [23106, "Dazzling Deep Peridot"],
  [23108, "Glowing Shadow Draenite"],

  // ─── TBC Red Gems ─────────────────────────────────────────────────
  [24027, "Bold Living Ruby"],
  [32193, "Bold Crimson Spinel"],
  [24028, "Delicate Living Ruby"],
  [32194, "Delicate Crimson Spinel"],
  [32195, "Teardrop Crimson Spinel"],
  [35489, "Teardrop Crimson Spinel"],
  [24030, "Runed Living Ruby"],
  [32196, "Runed Crimson Spinel"],
  [35488, "Runed Crimson Spinel"],
  [24031, "Bright Living Ruby"],
  [32197, "Bright Crimson Spinel"],
  [35487, "Bright Crimson Spinel"],
  [24032, "Subtle Living Ruby"],
  [32198, "Subtle Crimson Spinel"],
  [24036, "Flashing Living Ruby"],
  [32199, "Flashing Crimson Spinel"],
  [32200, "Solid Empyrean Sapphire"],
  [24029, "Teardrop Living Ruby"],
  [32201, "Sparkling Empyrean Sapphire"],

  // ─── TBC Blue Gems ────────────────────────────────────────────────
  [24033, "Solid Star of Elune"],
  [32202, "Lustrous Empyrean Sapphire"],
  [24035, "Sparkling Star of Elune"],
  [32203, "Stormy Empyrean Sapphire"],
  [24037, "Lustrous Star of Elune"],
  [32204, "Brilliant Lionseye"],
  [24039, "Stormy Star of Elune"],
  [32205, "Smooth Lionseye"],
  [32206, "Rigid Lionseye"],

  // ─── TBC Yellow Gems ──────────────────────────────────────────────
  [24050, "Gleaming Dawnstone"],
  [32207, "Gleaming Lionseye"],
  [31861, "Great Dawnstone"],
  [32210, "Great Lionseye"],
  [24051, "Rigid Dawnstone"],
  [32215, "Glowing Shadowsong Amethyst"],
  [24048, "Smooth Dawnstone"],
  [32209, "Mystic Lionseye"],
  [24053, "Mystic Dawnstone"],
  [32212, "Shifting Shadowsong Amethyst"],
  [35501, "Eternal Earthstorm Diamond"],
  [35503, "Ember Skyfire Diamond"],
  [35707, "Regal Nightseye"],

  // ─── TBC Orange Gems ──────────────────────────────────────────────
  [24060, "Luminous Noble Topaz"],
  [32211, "Sovereign Shadowsong Amethyst"],
  [24058, "Inscribed Noble Topaz"],
  [32217, "Inscribed Pyrestone"],
  [24059, "Potent Noble Topaz"],
  [32218, "Potent Pyrestone"],
  [31867, "Veiled Noble Topaz"],
  [32219, "Luminous Pyrestone"],
  [24061, "Glinting Noble Topaz"],
  [32220, "Glinting Pyrestone"],
  [31868, "Wicked Noble Topaz"],
  [32221, "Veiled Pyrestone"],
  [32222, "Wicked Pyrestone"],
  [35758, "Steady Seaspray Emerald"],
  [35759, "Forceful Seaspray Emerald"],
  [35760, "Reckless Pyrestone"],
  [35761, "Quick Lionseye"],

  // ─── TBC Green Gems ───────────────────────────────────────────────
  [24062, "Enduring Talasite"],
  [32208, "Thick Lionseye"],
  [24067, "Jagged Talasite"],
  [32213, "Balanced Shadowsong Amethyst"],
  [24066, "Radiant Talasite"],
  [32224, "Radiant Seaspray Emerald"],
  [24065, "Dazzling Talasite"],
  [32225, "Dazzling Seaspray Emerald"],
  [32223, "Enduring Seaspray Emerald"],
  [32226, "Jagged Seaspray Emerald"],

  // ─── TBC Purple Gems ──────────────────────────────────────────────
  [24056, "Glowing Nightseye"],
  [32214, "Infused Shadowsong Amethyst"],
  [24055, "Shifting Nightseye"],
  [32216, "Royal Shadowsong Amethyst"],
  [24054, "Sovereign Nightseye"],
  [32836, "Purified Shadow Pearl"],

  // ─── TBC Meta Gems ────────────────────────────────────────────────
  [34220, "Chaotic Skyfire Diamond"],
  [25893, "Mystical Skyfire Diamond"],
  [25901, "Insightful Earthstorm Diamond"],
  [32409, "Relentless Earthstorm Diamond"],
  [25897, "Bracing Earthstorm Diamond"],

  // ─── WotLK Uncommon Gems ────────────────────────────────────────
  [39900, "Bold Bloodstone"],
  [39905, "Delicate Bloodstone"],
  [39910, "Precise Bloodstone"],
  [39908, "Flashing Bloodstone"],
  [39909, "Fractured Bloodstone"],
  [39911, "Runed Bloodstone"],
  [39907, "Subtle Bloodstone"],
  [39906, "Bright Bloodstone"],
  [39919, "Solid Chalcedony"],
  [39915, "Rigid Sun Crystal"],
  [39920, "Sparkling Chalcedony"],
  [39927, "Lustrous Chalcedony"],
  [39932, "Stormy Chalcedony"],
  [39914, "Smooth Sun Crystal"],
  [39917, "Mystic Sun Crystal"],
  [39916, "Thick Sun Crystal"],
  [39918, "Quick Sun Crystal"],
  [39933, "Puissant Shadow Crystal"],
  [39947, "Inscribed Huge Citrine"],
  [39946, "Luminous Huge Citrine"],
  [39948, "Etched Huge Citrine"],
  [39953, "Glinting Huge Citrine"],
  [39949, "Champion's Huge Citrine"],
  [39957, "Veiled Huge Citrine"],
  [39950, "Resplendent Huge Citrine"],
  [39956, "Potent Huge Citrine"],
  [39951, "Fierce Huge Citrine"],
  [39952, "Deadly Huge Citrine"],
  [39959, "Reckless Huge Citrine"],
  [39954, "Lucent Huge Citrine"],
  [39955, "Deft Huge Citrine"],
  [39966, "Accurate Huge Citrine"],
  [39960, "Wicked Huge Citrine"],
  [39958, "Durable Huge Citrine"],
  [39974, "Jagged Dark Jade"],
  [39976, "Enduring Dark Jade"],
  [39935, "Shifting Shadow Crystal"],
  [39978, "Forceful Dark Jade"],
  [39936, "Glowing Shadow Crystal"],
  [39975, "Vivid Dark Jade"],
  [39938, "Regal Shadow Crystal"],
  [39982, "Turbid Dark Jade"],
  [39939, "Defender's Shadow Crystal"],
  [39977, "Steady Dark Jade"],
  [39940, "Guardian's Shadow Crystal"],
  [39934, "Sovereign Shadow Crystal"],
  [39941, "Purified Shadow Crystal"],
  [39942, "Tenuous Shadow Crystal"],
  [39943, "Royal Shadow Crystal"],
  [39944, "Infused Shadow Crystal"],
  [39945, "Mysterious Shadow Crystal"],

  // ─── WotLK Rare Red Gems ─────────────────────────────────────────
  [39996, "Bold Scarlet Ruby"],
  [39997, "Delicate Scarlet Ruby"],
  [39998, "Runed Scarlet Ruby"],
  [39999, "Bright Scarlet Ruby"],
  [40000, "Subtle Scarlet Ruby"],
  [40001, "Flashing Scarlet Ruby"],
  [40002, "Fractured Scarlet Ruby"],
  [40003, "Precise Scarlet Ruby"],
  [40111, "Bold Cardinal Ruby"],
  [40112, "Delicate Cardinal Ruby"],
  [40113, "Runed Cardinal Ruby"],
  [40114, "Bright Cardinal Ruby"],
  [40115, "Subtle Cardinal Ruby"],
  [40116, "Flashing Cardinal Ruby"],
  [40117, "Fractured Cardinal Ruby"],
  [40118, "Precise Cardinal Ruby"],

  // ─── WotLK Blue Gems ─────────────────────────────────────────────
  [37430, "Solid Sky Sapphire (Unused)"],
  [40008, "Solid Sky Sapphire"],
  [40009, "Sparkling Sky Sapphire"],
  [40010, "Lustrous Sky Sapphire"],
  [40119, "Solid Majestic Zircon"],
  [40120, "Sparkling Majestic Zircon"],

  // ─── WotLK Yellow Gems ───────────────────────────────────────────
  [40014, "Rigid Autumn's Glow"],
  [40015, "Thick Autumn's Glow"],
  [40013, "Smooth Autumn's Glow"],
  [40016, "Mystic Autumn's Glow"],
  [40017, "Quick Autumn's Glow"],
  [40123, "Brilliant King's Amber"],
  [40124, "Smooth King's Amber"],
  [40125, "Rigid King's Amber"],
  [40126, "Thick King's Amber"],
  [40127, "Mystic King's Amber"],
  [40128, "Quick King's Amber"],

  // ─── WotLK Orange Gems ───────────────────────────────────────────
  [40049, "Veiled Monarch Topaz"],
  [40023, "Shifting Twilight Opal"],
  [40048, "Potent Monarch Topaz"],
  [40024, "Tenuous Twilight Opal"],
  [40047, "Luminous Monarch Topaz"],
  [40025, "Glowing Twilight Opal"],
  [40037, "Inscribed Monarch Topaz"],
  [40026, "Purified Twilight Opal"],
  [40044, "Glinting Monarch Topaz"],
  [40032, "Defender's Twilight Opal"],
  [40038, "Etched Monarch Topaz"],
  [40153, "Veiled Ametrine"],
  [40133, "Purified Dreadstone"],
  [40152, "Potent Ametrine"],
  [40142, "Inscribed Ametrine"],
  [40143, "Etched Ametrine"],
  [40144, "Champion's Ametrine"],
  [40148, "Glinting Ametrine"],
  [40147, "Deadly Ametrine"],
  [40162, "Accurate Ametrine"],
  [40149, "Lucent Ametrine"],
  [40146, "Fierce Ametrine"],
  [40150, "Deft Ametrine"],
  [40155, "Reckless Ametrine"],
  [40154, "Durable Ametrine"],
  [40156, "Wicked Ametrine"],
  [40159, "Stark Ametrine"],
  [40157, "Pristine Ametrine"],

  // ─── WotLK Purple Gems ───────────────────────────────────────────
  [40011, "Stormy Sky Sapphire"],
  [40022, "Sovereign Twilight Opal"],
  [40027, "Royal Twilight Opal"],
  [40029, "Balanced Twilight Opal"],
  [40130, "Shifting Dreadstone"],
  [40129, "Sovereign Dreadstone"],
  [40131, "Tenuous Dreadstone"],
  [40132, "Glowing Dreadstone"],
  [40141, "Guardian's Dreadstone"],
  [40134, "Royal Dreadstone"],

  // ─── WotLK Green Gems ────────────────────────────────────────────
  [40086, "Jagged Forest Emerald"],
  [40088, "Vivid Forest Emerald"],
  [40089, "Enduring Forest Emerald"],
  [40091, "Forceful Forest Emerald"],
  [40094, "Dazzling Forest Emerald"],
  [40105, "Energized Forest Emerald"],
  [40095, "Misty Forest Emerald"],
  [40165, "Jagged Eye of Zul"],
  [40167, "Enduring Eye of Zul"],
  [40106, "Shattered Forest Emerald"],

  // ─── WotLK Meta Gems ─────────────────────────────────────────────
  [41285, "Chaotic Skyflare Diamond"],
  [41333, "Ember Skyflare Diamond"],
  [41376, "Revitalizing Skyflare Diamond"],
  [41380, "Austere Earthsiege Diamond"],
  [41389, "Beaming Earthsiege Diamond"],
  [41401, "Insightful Earthsiege Diamond"],
  [41395, "Bracing Earthsiege Diamond"],
  [41398, "Relentless Earthsiege Diamond"],

  // ─── Cata Uncommon Gems ─────────────────────────────────────────
  [52081, "Bold Carnelian"],
  [52082, "Delicate Carnelian"],
  [52084, "Brilliant Carnelian"],
  [52083, "Flashing Carnelian"],
  [52085, "Precise Carnelian"],
  [52086, "Solid Zephyrite"],
  [52087, "Sparkling Zephyrite"],
  [52089, "Rigid Zephyrite"],
  [52088, "Stormy Zephyrite"],
  [52091, "Smooth Alicite"],
  [52090, "Subtle Alicite"],
  [52094, "Fractured Alicite"],
  [52093, "Quick Alicite"],
  [52092, "Mystic Alicite"],
  [52108, "Inscribed Hessonite"],
  [52095, "Sovereign Nightstone"],
  [52110, "Potent Hessonite"],
  [52096, "Shifting Nightstone"],
  [52111, "Fierce Hessonite"],
  [52097, "Defender's Nightstone"],
  [52112, "Deft Hessonite"],
  [52098, "Timeless Nightstone"],
  [52113, "Reckless Hessonite"],
  [52099, "Guardian's Nightstone"],
  [52109, "Deadly Hessonite"],
  [52100, "Purified Nightstone"],
  [52117, "Artful Hessonite"],
  [52101, "Etched Nightstone"],
  [52118, "Keen Hessonite"],
  [52102, "Glinting Nightstone"],
  [52116, "Fine Hessonite"],
  [52103, "Retaliating Nightstone"],
  [52106, "Polished Hessonite"],
  [52104, "Veiled Nightstone"],
  [52121, "Jagged Jasper"],
  [52119, "Regal Jasper"],
  [52122, "Piercing Jasper"],
  [52120, "Nimble Jasper"],
  [52124, "Forceful Jasper"],
  [52125, "Lightning Jasper"],
  [52126, "Puissant Jasper"],
  [52123, "Steady Jasper"],
  [52127, "Zen Jasper"],
  [52128, "Sensei's Jasper"],
  [52107, "Resolute Hessonite"],

  // ─── Cata Rare Orange Gems ────────────────────────────────────────
  [52222, "Inscribed Ember Topaz"],
  [52215, "Fine Ember Topaz"],
  [52239, "Potent Ember Topaz"],
  [52216, "Flashing Inferno Ruby"],
  [52214, "Fierce Ember Topaz"],
  [52217, "Veiled Demonseye"],
  [52211, "Deft Ember Topaz"],
  [52218, "Forceful Dream Emerald"],
  [52208, "Reckless Ember Topaz"],
  [52219, "Fractured Amberjewel"],
  [52209, "Deadly Ember Topaz"],
  [52220, "Glinting Demonseye"],
  [52205, "Artful Ember Topaz"],
  [52204, "Adept Ember Topaz"],
  [52224, "Keen Ember Topaz"],

  // ─── Cata Rare Green Gems ─────────────────────────────────────────
  [52223, "Jagged Dream Emerald"],
  [52225, "Lightning Dream Emerald"],
  [52227, "Nimble Dream Emerald"],
  [52231, "Puissant Dream Emerald"],
  [52228, "Piercing Dream Emerald"],
  [52250, "Zen Dream Emerald"],
  [52229, "Polished Ember Topaz"],
  [52237, "Sensei's Dream Emerald"],
  [52233, "Regal Dream Emerald"],
  [52236, "Purified Demonseye"],
  [52245, "Steady Dream Emerald"],

  // ─── Cata Rare Purple Gems ────────────────────────────────────────
  [52243, "Sovereign Demonseye"],
  [52234, "Retaliating Demonseye"],
  [52238, "Shifting Demonseye"],
  [52248, "Timeless Demonseye"],
  [52221, "Guardian's Demonseye"],
  [52240, "Skillful Ember Topaz"],
  [52246, "Stormy Ocean Sapphire"],
  [52213, "Etched Demonseye"],
  [52247, "Subtle Amberjewel"],
  [52203, "Accurate Demonseye"],

  // ─── Cata Meta Gems ──────────────────────────────────────────────
  [52291, "Chaotic Shadowspirit Diamond"],
  [52294, "Austere Shadowspirit Diamond"],
  [52293, "Eternal Shadowspirit Diamond"],
  [52296, "Ember Shadowspirit Diamond"],
  [52295, "Effulgent Shadowspirit Diamond"],
  [52297, "Revitalizing Shadowspirit Diamond"],
  [52298, "Destructive Shadowspirit Diamond"],
  [52299, "Powerful Shadowspirit Diamond"],
  [52300, "Enigmatic Shadowspirit Diamond"],
  [52301, "Impassive Shadowspirit Diamond"],
  [68778, "Agile Shadowspirit Diamond"],
  [68779, "Reverberating Shadowspirit Diamond"],
  [68780, "Burning Shadowspirit Diamond"],

  // ─── Cata Red Gems ────────────────────────────────────────────────
  [52206, "Bold Inferno Ruby"],
  [52207, "Brilliant Inferno Ruby"],
  [52212, "Delicate Inferno Ruby"],
  [52210, "Defender's Demonseye"],
  [52230, "Precise Inferno Ruby"],
  [71879, "Delicate Queen's Garnet"],
  [71878, "Mystic Lightstone"],
  [77134, "Mystic Lightstone"],
  [71881, "Brilliant Queen's Garnet"],
  [71883, "Bold Queen's Garnet"],
  [71880, "Precise Queen's Garnet"],

  // ─── Cata Blue Gems ───────────────────────────────────────────────
  [52235, "Rigid Ocean Sapphire"],
  [52242, "Solid Ocean Sapphire"],
  [52244, "Sparkling Ocean Sapphire"],
  [71820, "Solid Deepholm Iolite"],
  [71819, "Sparkling Deepholm Iolite"],
  [71823, "Piercing Elven Peridot"],

  // ─── Cata Yellow Gems ─────────────────────────────────────────────
  [52232, "Quick Amberjewel"],
  [52241, "Smooth Amberjewel"],
  [52226, "Mystic Amberjewel"],

  // ─── MoP Red Gems ────────────────────────────────────────────────
  [76696, "Bold Primordial Ruby"],
  [76693, "Precise Primordial Ruby"],
  [76692, "Delicate Primordial Ruby"],
  [76694, "Brilliant Primordial Ruby"],
  [97313, "Brilliant Primordial Ruby"],
  [98094, "Brilliant Primordial Ruby"],
  [76695, "Flashing Primordial Ruby"],
  [76697, "Smooth Sun's Radiance"],
  [98026, "Smooth Sun's Radiance"],
  [98027, "Smooth Sun's Radiance"],

  // ─── MoP Blue Gems ───────────────────────────────────────────────
  [76639, "Solid River's Heart"],
  [76698, "Subtle Sun's Radiance"],
  [76636, "Rigid River's Heart"],
  [98090, "Rigid River's Heart"],
  [76699, "Quick Sun's Radiance"],
  [97311, "Quick Sun's Radiance"],
  [76638, "Sparkling River's Heart"],
  [97307, "Sparkling River's Heart"],
  [76700, "Fractured Sun's Radiance"],
  [98088, "Fractured Sun's Radiance"],

  // ─── MoP Yellow Gems ─────────────────────────────────────────────
  [76701, "Mystic Sun's Radiance"],
  [97535, "Mystic Sun's Radiance"],
  [97938, "Mystic Sun's Radiance"],

  // ─── MoP Orange Gems ─────────────────────────────────────────────
  [76661, "Inscribed Vermilion Onyx"],
  [76660, "Potent Vermilion Onyx"],
  [98051, "Potent Vermilion Onyx"],
  [76669, "Fierce Vermilion Onyx"],
  [76666, "Deft Vermilion Onyx"],
  [76668, "Reckless Vermilion Onyx"],
  [76658, "Deadly Vermilion Onyx"],
  [76672, "Artful Vermilion Onyx"],
  [76671, "Keen Vermilion Onyx"],
  [98089, "Keen Vermilion Onyx"],
  [76670, "Adept Vermilion Onyx"],
  [76667, "Wicked Vermilion Onyx"],
  [76677, "Willful Vermilion Onyx"],
  [76714, "Perfect Rigid River's Heart"],
  [76678, "Splendid Vermilion Onyx"],
  [76679, "Resplendent Vermilion Onyx"],
  [76675, "Lucent Vermilion Onyx"],
  [76676, "Tenuous Vermilion Onyx"],

  // ─── MoP Green Gems ──────────────────────────────────────────────
  [76652, "Jagged Wild Jade"],
  [76641, "Piercing Wild Jade"],
  [98025, "Piercing Wild Jade"],
  [76654, "Forceful Wild Jade"],
  [76642, "Lightning Wild Jade"],
  [76656, "Puissant Wild Jade"],
  [76645, "Zen Wild Jade"],
  [76643, "Sensei's Wild Jade"],
  [76644, "Effulgent Wild Jade"],
  [76649, "Radiant Wild Jade"],

  // ─── MoP Purple Gems ─────────────────────────────────────────────
  [76691, "Sovereign Imperial Amethyst"],
  [76687, "Shifting Imperial Amethyst"],
  [76689, "Timeless Imperial Amethyst"],
  [76686, "Purified Imperial Amethyst"],
  [97310, "Purified Imperial Amethyst"],
  [76688, "Guardian's Imperial Amethyst"],
  [76681, "Accurate Imperial Amethyst"],
  [76682, "Veiled Imperial Amethyst"],
  [76684, "Etched Imperial Amethyst"],
  [76680, "Glinting Imperial Amethyst"],

  // ─── MoP Meta Gems ───────────────────────────────────────────────
  [76884, "Agile Primal Diamond"],
  [76886, "Reverberating Primal Diamond"],
  [76885, "Burning Primal Diamond"],
  [97534, "Burning Primal Diamond"],
  [97937, "Burning Primal Diamond"],
  [76895, "Austere Primal Diamond"],
  [76887, "Fleet Primal Diamond"],
  [76879, "Ember Primal Diamond"],
  [76888, "Revitalizing Primal Diamond"],
  [97306, "Revitalizing Primal Diamond"],
  [76890, "Destructive Primal Diamond"],
  [76891, "Powerful Primal Diamond"],
  [76892, "Enigmatic Primal Diamond"],
  [76893, "Impassive Primal Diamond"],
  [76894, "Forlorn Primal Diamond"],
  [95345, "Courageous Primal Diamond"],
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
// Stat types derived from each gem's enchantment text in client data
// (ItemSparse -> GemProperties -> SpellItemEnchantment); the trailing comment
// on each entry is the gem's actual stat line in that game version.

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
  [24051, { name: "Rigid Dawnstone", statType: "hit", badForRoles: [] }], // +8 Hit Rating
  [32206, { name: "Rigid Lionseye", statType: "hit", badForRoles: [] }], // +10 Hit Rating
  [24030, { name: "Runed Living Ruby", statType: "spell_power", badForRoles: ["Physical"] }], // +9 Spell Damage
  [32196, { name: "Runed Crimson Spinel", statType: "spell_power", badForRoles: ["Physical"] }], // +12 Spell Damage
  [35488, { name: "Runed Crimson Spinel", statType: "spell_power", badForRoles: ["Physical"] }], // +12 Spell Damage
  [24060, { name: "Luminous Noble Topaz", statType: "spell_power", badForRoles: ["Physical"] }], // +9 Healing +3 Spell Damage and +4 Intellect
  [32219, { name: "Luminous Pyrestone", statType: "spell_power", badForRoles: ["Physical"] }], // +11 Healing +4 Spell Damage and +5 Intellect
  [24027, { name: "Bold Living Ruby", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +8 Strength
  [32193, { name: "Bold Crimson Spinel", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +10 Strength
  [24058, { name: "Inscribed Noble Topaz", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +4 Critical Strike Rating and +4 Strength
  [32217, { name: "Inscribed Pyrestone", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +5 Critical Strike Rating and +5 Strength
  [24052, { name: "Thick Dawnstone", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +8 Defense Rating
  [32208, { name: "Thick Lionseye", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +10 Defense Rating
  [24062, { name: "Enduring Talasite", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +4 Defense Rating and +6 Stamina
  [32223, { name: "Enduring Seaspray Emerald", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +5 Defense Rating and +7 Stamina

  // ─── WotLK Gems ───────────────────────────────────────────────────
  [39998, { name: "Runed Scarlet Ruby", statType: "spell_power", badForRoles: ["Physical"] }], // +19 Spell Power
  [40113, { name: "Runed Cardinal Ruby", statType: "spell_power", badForRoles: ["Physical"] }], // +23 Spell Power
  [39996, { name: "Bold Scarlet Ruby", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +16 Strength
  [40111, { name: "Bold Cardinal Ruby", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +20 Strength
  [39900, { name: "Bold Bloodstone", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +12 Strength
  [40014, { name: "Rigid Autumn's Glow", statType: "hit", badForRoles: [] }], // +16 Hit Rating
  [40125, { name: "Rigid King's Amber", statType: "hit", badForRoles: [] }], // +20 Hit Rating
  [40049, { name: "Veiled Monarch Topaz", statType: "spell_power", badForRoles: ["Physical"] }], // +9 Spell Power and +8 Hit Rating
  [40153, { name: "Veiled Ametrine", statType: "spell_power", badForRoles: ["Physical"] }], // +12 Spell Power and +10 Hit Rating
  [40015, { name: "Thick Autumn's Glow", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +16 Defense Rating
  [40126, { name: "Thick King's Amber", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +20 Defense Rating
  [40089, { name: "Enduring Forest Emerald", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +8 Defense Rating and +12 Stamina
  [40167, { name: "Enduring Eye of Zul", statType: "defense", badForRoles: ["Physical", "Caster", "Healer"] }], // +10 Defense Rating and +15 Stamina
  [40000, { name: "Subtle Scarlet Ruby", statType: "dodge", badForRoles: ["Physical", "Caster", "Healer"] }], // +16 Dodge Rating
  [40115, { name: "Subtle Cardinal Ruby", statType: "dodge", badForRoles: ["Physical", "Caster", "Healer"] }], // +20 Dodge Rating
  [40001, { name: "Flashing Scarlet Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }], // +16 Parry Rating
  [40116, { name: "Flashing Cardinal Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }], // +20 Parry Rating
  [37430, { name: "Solid Sky Sapphire (Unused)", statType: "stamina", badForRoles: [] }], // +21 Stamina
  [40008, { name: "Solid Sky Sapphire", statType: "stamina", badForRoles: [] }], // +24 Stamina
  [40119, { name: "Solid Majestic Zircon", statType: "stamina", badForRoles: [] }], // +30 Stamina
  [40002, { name: "Fractured Scarlet Ruby", statType: "armor_penetration", badForRoles: [] }], // +16 Armor Penetration Rating
  [40117, { name: "Fractured Cardinal Ruby", statType: "armor_penetration", badForRoles: [] }], // +20 Armor Penetration Rating
  [40009, { name: "Sparkling Sky Sapphire", statType: "spirit", badForRoles: [] }], // +16 Spirit
  [40120, { name: "Sparkling Majestic Zircon", statType: "spirit", badForRoles: [] }], // +20 Spirit
  [40012, { name: "Brilliant Autumn's Glow", statType: "intellect", badForRoles: [] }], // +16 Intellect
  [40123, { name: "Brilliant King's Amber", statType: "intellect", badForRoles: [] }], // +20 Intellect

  // ─── Cata Gems ────────────────────────────────────────────────────
  [52207, { name: "Brilliant Inferno Ruby", statType: "intellect", badForRoles: [] }], // +40 Intellect
  [71881, { name: "Brilliant Queen's Garnet", statType: "intellect", badForRoles: [] }], // +50 Intellect
  [52206, { name: "Bold Inferno Ruby", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +40 Strength
  [71883, { name: "Bold Queen's Garnet", statType: "strength", badForRoles: ["Caster", "Healer"] }], // +50 Strength
  [52212, { name: "Delicate Inferno Ruby", statType: "agility", badForRoles: ["Caster", "Healer"] }], // +40 Agility
  [71879, { name: "Delicate Queen's Garnet", statType: "agility", badForRoles: ["Caster", "Healer"] }], // +50 Agility
  [52216, { name: "Flashing Inferno Ruby", statType: "parry", badForRoles: ["Physical", "Caster", "Healer"] }], // +40 Parry Rating
  [52242, { name: "Solid Ocean Sapphire", statType: "stamina", badForRoles: [] }], // +60 Stamina
  [71820, { name: "Solid Deepholm Iolite", statType: "stamina", badForRoles: [] }], // +75 Stamina
  [52244, { name: "Sparkling Ocean Sapphire", statType: "spirit", badForRoles: [] }], // +40 Spirit
  [71819, { name: "Sparkling Deepholm Iolite", statType: "spirit", badForRoles: [] }], // +50 Spirit
]);

// ─── Talent Point Expectations ───────────────────────────────────────

export const EXPECTED_TALENT_POINTS: Record<string, number> = {
  classic: 51,
  tbc: 61,
  wrath: 71,
  cata: 41,
  mists: 6,
};
