import type { RaidRole } from "./wcl-types";

// ─── CLA Request / Response ─────────────────────────────────────────

export interface CLARequest {
  reportCode: string;
  fightIds: number[];
}

export interface CLAResult {
  fights: CLAFightMeta[];
  players: CLAPlayerResult[];
  wowheadDomain: string;
}

export interface CLAFightMeta {
  id: number;
  name: string;
  duration: number; // ms
}

// ─── Per-Player Results ─────────────────────────────────────────────

export interface CLAPlayerResult {
  sourceId: number;
  name: string;
  className: string;
  spec: string;
  role: RaidRole;
  fightData: CLAPlayerFightData[];
  gearIssues: CLAGearIssue[];
  gearSnapshot: CLAGearSlot[];
  classBuffs: CLAClassBuff[];
  talentIssue: { expected: number; actual: number } | null;
}

// ─── Class Buff Audit ──────────────────────────────────────────────

export interface CLAClassBuff {
  buffFamily: string;
  present: boolean;
  spellId: number;
  spellName: string;
  severity: "ok" | "missing" | "warning";
  reason: string;
}

export interface CLAPlayerFightData {
  fightId: number;
  consumables: CLAConsumableRow;
}

// ─── Consumable Tracking ────────────────────────────────────────────

export interface CLAConsumableRow {
  flask: CLAConsumableDetail;
  battleElixir: CLAConsumableDetail;
  guardianElixir: CLAConsumableDetail;
  food: CLAConsumableDetail;
  weaponEnhancement: CLAConsumableDetail;
  scrolls: CLAConsumableDetail[];
  averageUptime: number; // 0-100
}

export interface CLAConsumableDetail {
  present: boolean;
  uptimePercent: number; // 0-100
  spellId: number;
  spellName: string;
  isSuboptimal: boolean;
  suboptimalReason: string;
}

// ─── Gear Issues ────────────────────────────────────────────────────

export type GearIssueSeverity = "error" | "warning" | "info";
export type GearIssueType = "missing_enchant" | "missing_gem" | "empty_socket" | "low_ilvl" | "missing_weapon_enhancement" | "wrong_gem_type";

export interface CLAGearIssue {
  slotIndex: number;
  slotName: string;
  itemId: number;
  itemName: string;
  issueType: GearIssueType;
  severity: GearIssueSeverity;
  description: string;
}

// ─── Gear Snapshot ──────────────────────────────────────────────────

export interface CLAGearSlot {
  slotIndex: number;
  slotName: string;
  itemId: number;
  itemName: string;
  itemLevel: number;
  enchantId: number;
  enchantName: string;
  gems: Array<{ id: number; itemLevel: number; name?: string }>;
  wowheadUrl: string;
}
