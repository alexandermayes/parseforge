import { describe, it, expect } from "vitest";
import {
  buildCLAResult,
  analyzeConsumables,
  analyzeGearIssues,
} from "./cla-engine";
import type { WCLBuffEntry, WCLCombatantInfoEvent, WCLPlayerDetails } from "./wcl-types";
import demoRaidOverview from "./__fixtures__/demo-raid-overview.json";
import demoRaidCombatantInfo from "./__fixtures__/demo-raid-combatant-info.json";

// Driven by the recorded fixtures from plan 02-01: demo-raid-overview.json
// (playerDetails, fight bounds) and demo-raid-combatant-info.json (real
// per-player gear/gems/auras/talents for report ZjKgNYxVcAqR8pGJ, fight 23 —
// "The Lurker Below"). See lib/__fixtures__/README.md for provenance and
// lib/__fixtures__/README.md's Findings section for the enchant/gem data
// this behaviour depends on (post-02-06 cutover to lib/generated/).

const report = demoRaidOverview.reportData.report;
const FIGHT = report.fights[0];

const PLAYER_DETAILS = (
  Object.values(
    (report.playerDetails as unknown as { data: { playerDetails: Record<string, WCLPlayerDetails[]> } })
      .data.playerDetails,
  ).flat()
) as WCLPlayerDetails[];

const COMBATANT_EVENTS = demoRaidCombatantInfo.reportData.report.combatantInfo
  .data as unknown as WCLCombatantInfoEvent[];

function combatantFor(sourceId: number): WCLCombatantInfoEvent {
  const event = COMBATANT_EVENTS.find((e) => e.sourceID === sourceId);
  if (!event) throw new Error(`fixture missing combatant info for source ${sourceId}`);
  return event;
}

// ─── Missing-enchant detection by slot name (real recorded gear) ─────────
// Verified directly against the fixture: Samkin's gear[7]/[8]/[14] (Feet,
// Wrist, Back) each carry no `permanentEnchant` field; Zulakeyah's gear
// carries a permanentEnchant on every enchantable slot except Back (slot 14).

describe("analyzeGearIssues — missing enchants", () => {
  it("flags every enchantable slot with no permanent enchant, by slot name, matching the recorded gear exactly", () => {
    // Samkin (source 12) — the demo report's own featured DPS player.
    const samkin = combatantFor(12);
    const issues = analyzeGearIssues(samkin, undefined, "tbc");
    const missing = issues.filter((i) => i.issueType === "missing_enchant");
    expect(missing).toHaveLength(3);
    expect(missing.map((i) => i.slotName).sort()).toEqual(["Back", "Feet", "Wrist"]);
    expect(missing.every((i) => i.severity === "error")).toBe(true);
  });

  it("flags exactly one missing-enchant slot for a player whose recorded gear has only one real gap", () => {
    // Zulakeyah (source 32, Restoration Shaman).
    const zulakeyah = combatantFor(32);
    const issues = analyzeGearIssues(zulakeyah, undefined, "tbc");
    const missing = issues.filter((i) => i.issueType === "missing_enchant");
    expect(missing).toHaveLength(1);
    expect(missing[0].slotName).toBe("Back");
  });
});

// ─── Flask/food presence (synthetic — no fixture records a buff-uptime table) ─
// None of the six 02-01 fixtures record the Buffs query — `analyzeConsumables`
// reads `WCLBuffEntry[]` (name/guid/totalUptime/totalUses), which is a
// different shape from `combatantInfo.auras` (a bare id list with no uptime
// data used elsewhere in this file for gear/gem/class-buff checks) and cannot
// stand in for it. These two cases are therefore small synthetic inputs built
// from a real production flask id (17626, "Flask of Supreme Power" — see
// lib/constants.ts FLASK_BUFF_IDS), not fixture-derived ones.

describe("analyzeConsumables — flask presence", () => {
  const FIGHT_DURATION = FIGHT.endTime - FIGHT.startTime;

  it("does not flag a missing flask when the buffs table carries a real flask id", () => {
    const buffs: WCLBuffEntry[] = [
      {
        name: "Flask of Supreme Power",
        guid: 17626,
        type: 1,
        abilityIcon: "spell_nature_elementalabsorption.jpg",
        totalUptime: FIGHT_DURATION,
        totalUses: 1,
      },
    ];
    const result = analyzeConsumables(buffs, FIGHT_DURATION);
    expect(result.flask.present).toBe(true);
    expect(result.flask.spellId).toBe(17626);
  });

  it("flags a missing flask when the buffs table carries no flask/elixir id at all", () => {
    const result = analyzeConsumables([], FIGHT_DURATION);
    expect(result.flask.present).toBe(false);
  });
});

// ─── Full engine run over the recorded fixture ────────────────────────────
// No 02-01 fixture recorded a per-player buff-uptime table (see above), so
// buffData is genuinely empty here — this only affects analyzeConsumables'
// output inside buildCLAResult (every player's consumables show as absent,
// an honest reflection of what was actually recorded, not a bug). Gear, gem
// and class-buff analysis below reads combatantInfo gear/gems/auras directly
// and is unaffected by the empty buffData.

const FIGHTS = [{ id: FIGHT.id, name: FIGHT.name, duration: FIGHT.endTime - FIGHT.startTime }];
const COMBATANT_DATA = { [FIGHT.id]: COMBATANT_EVENTS };
const BUFF_DATA = { [FIGHT.id]: {} };

const CLA_RESULT = buildCLAResult({
  playerDetails: PLAYER_DETAILS,
  fights: FIGHTS,
  buffData: BUFF_DATA,
  combatantData: COMBATANT_DATA,
  wowheadDomain: "tbc",
});

function playerResult(sourceId: number) {
  const player = CLA_RESULT.players.find((p) => p.sourceId === sourceId);
  if (!player) throw new Error(`no CLA player result for source ${sourceId}`);
  return player;
}

describe("gem type mismatch detection (via buildCLAResult, real recorded gems)", () => {
  it("reports a gem whose stat type is penalised for the player's role as a mismatch", () => {
    // Ileria (source 7, Protection Paladin -> Physical role) has a real
    // recorded spell-power gem (Infused Amethyst, id 31116) in the Shoulder
    // slot, which lib/generated/'s GEM_STAT_DB flags bad for Physical.
    const ileria = playerResult(7);
    const gemIssues = ileria.gearIssues.filter((i) => i.issueType === "wrong_gem_type");
    expect(gemIssues).toHaveLength(1);
    expect(gemIssues[0].description).toContain("spell power");
  });

  it("stays silent for a player whose recorded gems carry no role-penalised stat", () => {
    // Ricoshams (source 15, Restoration Shaman / Healer role) — no gem in
    // their recorded gear has a statType penalised for Healer.
    const ricoshams = playerResult(15);
    expect(ricoshams.gearIssues.some((i) => i.issueType === "wrong_gem_type")).toBe(false);
  });
});

describe("class buff availability (via buildCLAResult, real recorded auras)", () => {
  it("reports a class-buff family the raid composition provides as available", () => {
    // Zulakeyah's recorded combatantInfo auras include a Blessing of Kings id.
    const zulakeyah = playerResult(32);
    const kings = zulakeyah.classBuffs.find((b) => b.buffFamily === "Blessing of Kings");
    expect(kings).toBeTruthy();
    expect(kings!.present).toBe(true);
    expect(kings!.severity).toBe("ok");
  });

  it("reports a class-buff family the raid composition cannot provide as missing", () => {
    // No Priest in this raid cast Power Word: Fortitude on Zulakeyah before
    // the recorded pull — none of that family's spell ids appear in her auras.
    const zulakeyah = playerResult(32);
    const fort = zulakeyah.classBuffs.find((b) => b.buffFamily === "Power Word: Fortitude");
    expect(fort).toBeTruthy();
    expect(fort!.present).toBe(false);
    expect(fort!.severity).toBe("missing");
  });
});

describe("buildCLAResult snapshot", () => {
  it("matches the full recorded-fixture output", () => {
    expect(CLA_RESULT).toMatchSnapshot();
  });
});
