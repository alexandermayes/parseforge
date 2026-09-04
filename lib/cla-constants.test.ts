import { describe, it, expect } from "vitest";
import {
  CONSUMABLE_DB,
  ENCHANT_NAME_DB,
  GEM_NAME_DB,
  GEM_STAT_DB,
  BATTLE_ELIXIR_IDS,
  GUARDIAN_ELIXIR_IDS,
} from "./cla-constants";
import { WEAPON_ENHANCEMENT_IDS, FOOD_BUFF_IDS, FLASK_BUFF_IDS } from "./constants";

// Guards against the ID<->name misalignment that shipped originally (whole
// sections shifted by one). Pairings below are verified against client data:
// TBC Anniversary 2.5.6.69546 / WotLK 3.4.5 / Cata 4.4.2 (wago.tools).

describe("ENCHANT_NAME_DB", () => {
  it("maps well-known TBC enchant IDs to the right names", () => {
    expect(ENCHANT_NAME_DB.get(2673)).toBe("Mongoose");
    expect(ENCHANT_NAME_DB.get(2667)).toBe("Savagery");
    expect(ENCHANT_NAME_DB.get(684)).toContain("Major Strength"); // was mislabeled "Major Agility"
    expect(ENCHANT_NAME_DB.get(3003)).toContain("Glyph of Ferocity");
    expect(ENCHANT_NAME_DB.get(3012)).toContain("Nethercobra Leg Armor");
    expect(ENCHANT_NAME_DB.get(3013)).toContain("Nethercleft Leg Armor");
    expect(ENCHANT_NAME_DB.get(2564)).toContain("Agility"); // weapon +15 agi, was "Major Strength"
  });

  it("keeps enchant names consistent with their stat text", () => {
    expect(ENCHANT_NAME_DB.get(2933)).toContain("Resilience"); // TBC chest +15 resil
    expect(ENCHANT_NAME_DB.get(2661)).toContain("+6 All Stats"); // Exceptional Stats
  });
});

describe("CONSUMABLE_DB", () => {
  it("does not treat permanent-enchant proc buffs as consumables", () => {
    expect(CONSUMABLE_DB.has(28093)).toBe(false); // Lightning Speed (Mongoose proc)
    expect(CONSUMABLE_DB.has(28095)).toBe(false);
    expect(WEAPON_ENHANCEMENT_IDS.has(28093)).toBe(false);
    expect(WEAPON_ENHANCEMENT_IDS.has(28095)).toBe(false);
  });

  it("does not count mage Refreshment as food", () => {
    expect(CONSUMABLE_DB.has(57362)).toBe(false);
    expect(CONSUMABLE_DB.has(58067)).toBe(false);
    expect(FOOD_BUFF_IDS.has(57362)).toBe(false);
    expect(FOOD_BUFF_IDS.has(58067)).toBe(false);
  });

  it("maps TBC scroll rank V buff IDs correctly", () => {
    expect(CONSUMABLE_DB.get(33077)?.name).toBe("Scroll of Agility V");
    expect(CONSUMABLE_DB.get(33081)?.name).toBe("Scroll of Stamina V");
    expect(CONSUMABLE_DB.get(33079)?.name).toBe("Scroll of Protection V");
    // rank V is the top rank in TBC — must not be flagged suboptimal
    expect(CONSUMABLE_DB.get(33077)?.isSuboptimal).toBe(false);
  });

  it("categorizes Cata elixirs correctly", () => {
    expect(CONSUMABLE_DB.get(79474)?.name).toBe("Elixir of the Naga");
    expect(CONSUMABLE_DB.get(79477)?.name).toBe("Elixir of the Cobra");
    expect(CONSUMABLE_DB.get(79480)?.name).toBe("Elixir of Deep Earth");
    expect(GUARDIAN_ELIXIR_IDS.has(79480)).toBe(true);
    expect(BATTLE_ELIXIR_IDS.has(79480)).toBe(false);
  });

  it("treats Lesser Flask of Toughness as a flask, not a guardian elixir", () => {
    expect(CONSUMABLE_DB.get(53752)?.name).toBe("Lesser Flask of Toughness");
    expect(GUARDIAN_ELIXIR_IDS.has(53752)).toBe(false);
    expect(FLASK_BUFF_IDS.has(53752)).toBe(true);
  });
});

describe("GEM_NAME_DB / GEM_STAT_DB", () => {
  it("maps well-known TBC gem item IDs to the right names", () => {
    expect(GEM_NAME_DB.get(23097)).toBe("Delicate Blood Garnet");
    expect(GEM_NAME_DB.get(24027)).toBe("Bold Living Ruby");
    expect(GEM_NAME_DB.get(32196)).toBe("Runed Crimson Spinel");
    expect(GEM_NAME_DB.get(32200)).toBe("Solid Empyrean Sapphire"); // was "Thick Living Ruby"
  });

  it("keeps GEM_STAT_DB names in sync with GEM_NAME_DB", () => {
    for (const [id, info] of GEM_STAT_DB) {
      const name = GEM_NAME_DB.get(id);
      if (name) expect(name).toBe(info.name);
    }
  });

  it("classifies Runed (spell power) gems as bad for Physical", () => {
    expect(GEM_STAT_DB.get(32196)?.statType).toBe("spell_power");
    expect(GEM_STAT_DB.get(32196)?.badForRoles).toContain("Physical");
  });
});
