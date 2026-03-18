// ─── WCL API Response Types ──────────────────────────────────────────

export interface WCLFight {
  id: number;
  name: string;
  encounterID: number;
  kill: boolean;
  startTime: number;
  endTime: number;
  difficulty: number;
  bossPercentage: number;
  fightPercentage: number;
}

export interface WCLActor {
  id: number;
  name: string;
  type: string;
  subType: string;
  server?: string;
  icon?: string;
}

export interface WCLReportData {
  title: string;
  owner: { name: string };
  startTime: number;
  endTime: number;
  zone: { id: number; name: string };
  fights: WCLFight[];
  masterData: {
    actors: WCLActor[];
  };
}

export interface WCLGearItem {
  id: number;
  slot: number;
  quality: number | string;
  icon: string;
  name?: string;
  itemLevel?: number;
  permanentEnchant?: number;
  permanentEnchantName?: string;
  temporaryEnchant?: number;
  temporaryEnchantName?: string;
  gems?: Array<{ id: number; itemLevel: number; icon?: string; name?: string }>;
  setID?: number;
}

export interface WCLTalent {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  points: number;
}

// Raw CombatantInfo event from WCL events API
export interface WCLCombatantInfoEvent {
  timestamp: number;
  type: string;
  sourceID: number;
  gear: Array<{
    id: number;
    quality: number;
    icon: string;
    itemLevel?: number;
    permanentEnchant?: number;
    temporaryEnchant?: number;
    gems?: Array<{ id: number; itemLevel: number; icon?: string }>;
    setID?: number;
  }>;
  talents: Array<{ id: number; icon: string }>;
  talentTree?: Array<{ id: number; icon: string }>;
  specID?: number;
}

// Rankings gear item (different format from events API)
export interface WCLRankingGearItem {
  name: string;
  quality: string;
  id: number;
  icon: string;
}

// Rankings talent item
export interface WCLRankingTalent {
  name: string;
  id: number;
  icon: string;
}

export interface WCLCombatantInfo {
  stats: {
    Speed?: { min: number };
    Stamina?: { min: number };
    Intellect?: { min: number };
    Strength?: { min: number };
    Agility?: { min: number };
    Armor?: { min: number };
    [key: string]: { min: number } | undefined;
  };
  talents: WCLTalent[];
  gear: WCLGearItem[];
  specIDs: number[];
}

export interface WCLDamageEntry {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  total: number;
  totalReduced: number;
  uses?: number;
}

export interface WCLBuffEntry {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  totalUptime: number;
  totalUses: number;
  bands?: Array<{ startTime: number; endTime: number }>;
}

export interface WCLCastEntry {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  total: number;
}

export interface WCLPlayerDetails {
  name: string;
  id: number;
  guid: number;
  type: string;
  icon: string;
  specs: (string | { spec: string; count: number })[];
  minItemLevel: number;
  maxItemLevel: number;
  combatantInfo: WCLCombatantInfo;
}

export interface WCLRanking {
  name: string;
  class: string;
  spec: string;
  amount: number;
  duration: number;
  startTime: number;
  report: { code: string; fightID: number; startTime: number };
  guild?: { name: string; faction: number };
  server?: { name: string; region: string };
  bracketData?: number;
  best?: boolean;
  talents?: WCLRankingTalent[];
  gear?: WCLRankingGearItem[];
}

export interface WCLRankingsData {
  page: number;
  hasMorePages: boolean;
  count: number;
  rankings: WCLRanking[];
}

// ─── Top N Player Types ─────────────────────────────────────────────

export interface TopPlayerFullData {
  name: string;
  ranking: WCLRanking;
  duration: number;
  throughputEntries: WCLDamageEntry[];
  buffEntries: WCLBuffEntry[];
  castEntries: WCLCastEntry[];
}

export interface TalentConsensusEntry {
  name: string;
  id: number;
  icon: string;
  frequency: number;
  totalPlayers: number;
  percentage: number;
  playerHasTalent: boolean;
}

export interface TalentConsensusAnalysis {
  talents: TalentConsensusEntry[];
  playerSpec: string;
  sampleSize: number;
  matchPercentage: number;
}

export interface GearPopularityItem {
  id: number;
  name: string;
  icon: string;
  quality: string;
  count: number;
  percentage: number;
}

export interface GearSlotPopularity {
  slot: number;
  slotName: string;
  playerItemId: number | null;
  playerItemName: string | null;
  playerUsesPopular: boolean;
  items: GearPopularityItem[];
  totalPlayers: number;
}

export interface GearPopularityAnalysis {
  slots: GearSlotPopularity[];
  sampleSize: number;
  popularMatchCount: number;
  totalSlots: number;
}

export interface AbilityPriorityEntry {
  name: string;
  guid: number;
  icon: string;
  playerShare: number;
  avgTopShare: number;
  minTopShare: number;
  maxTopShare: number;
  shareDeviation: number;
  rank: number;
  playerRank: number;
}

export interface MetricPercentile {
  metric: string;
  label: string;
  playerValue: number;
  topAvgValue: number;
  percentile: number;
  grade: string;
  description: string;
}

export interface MetricPercentileAnalysis {
  metrics: MetricPercentile[];
  overallScore: number;
  overallGrade: string;
}

// ─── Analysis Types ──────────────────────────────────────────────────

export interface DpsComparison {
  playerDps: number;
  medianDps: number;
  topDps: number;
  percentile: number;
  gapToMedian: number;
  gapToTop: number;
  fightDuration: number;
}

export interface GearSlotComparison {
  slot: number;
  slotName: string;
  playerItem: WCLGearItem | null;
  topItem: WCLGearItem | null;
  isSame: boolean;
  playerEnchant: string | null;
  playerEnchantId: number | null;
  topEnchant: string | null;
  missingEnchant: boolean;
}

export interface GearAnalysis {
  slots: GearSlotComparison[];
  playerAvgIlvl: number;
  topAvgIlvl: number;
  missingEnchants: number;
  missingGems: number;
  wowheadDomain: string;
}

export interface TalentDiff {
  name: string;
  guid: number;
  icon: string;
  playerPoints: number;
  topPoints: number;
  diff: number;
}

export interface TalentTreeSummary {
  playerDistribution: number[]; // e.g. [40, 0, 21]
  topDistribution: number[];
  treeNames: string[]; // e.g. ["Affliction", "Demonology", "Destruction"]
}

export interface TalentAnalysis {
  diffs: TalentDiff[];
  playerSpec: string;
  topSpec: string;
  totalDiffs: number;
  treeSummary?: TalentTreeSummary;
}

export interface BuffComparison {
  name: string;
  guid: number;
  icon: string;
  playerUptime: number;
  topUptime: number;
  gap: number;
  isMissing: boolean;
}

export interface BuffAnalysis {
  buffs: BuffComparison[];
  missingBuffs: string[];
  lowUptimeBuffs: string[];
}

export interface CastComparison {
  name: string;
  guid: number;
  icon: string;
  playerCasts: number;
  playerCpm: number;
  topCasts: number;
  topCpm: number;
  cpmDiff: number;
}

export interface CastAnalysis {
  casts: CastComparison[];
  playerActiveTime: number;
  topActiveTime: number;
}

export interface AbilityShare {
  name: string;
  guid: number;
  icon: string;
  playerShare: number;
  topShare: number;
  playerTotal: number;
  topTotal: number;
}

export interface ImprovementSuggestion {
  category: "dps" | "hps" | "gear" | "consumables" | "casts";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  estimatedImpact?: string;
}

export interface AnalysisResult {
  playerName: string;
  playerClass: string;
  playerSpec: string;
  playerRole: "dps" | "healer";
  encounterName: string;
  fightDuration: number;
  dps: DpsComparison;
  gear: GearAnalysis;
  talents: TalentAnalysis;
  buffs: BuffAnalysis;
  casts: CastAnalysis;
  abilities: AbilityShare[];
  suggestions: ImprovementSuggestion[];
  consumables: ConsumableStatus;
  topPlayerName: string;
  topPlayerRank: number;
  topPlayerNames: string[];
  topPlayersCount: number;
  talentConsensus: TalentConsensusAnalysis;
  gearPopularity: GearPopularityAnalysis;
  abilityPriority: AbilityPriorityEntry[];
  metricPercentiles: MetricPercentileAnalysis;
}

// ─── Raid Overview (RPB) Types ───────────────────────────────────────

export type RaidRole = "Tank" | "Healer" | "Caster" | "Physical";

export interface ConsumableStatus {
  flask: boolean;
  food: boolean;
  weaponEnhancement: boolean;
}

export interface RaidPlayerMetrics {
  sourceId: number;
  name: string;
  className: string;
  spec: string;
  role: RaidRole;
  throughput: number; // DPS or HPS
  deaths: number;
  avoidableDamage: number;
  activityPercent: number;
  consumables: ConsumableStatus;
  missingEnchants: number;
  avgItemLevel: number;
}

export interface RaidOverviewResult {
  encounterName: string;
  fightDuration: number;
  players: RaidPlayerMetrics[];
}

// ─── Request / Response Types ────────────────────────────────────────

export interface AnalyzeRequest {
  reportCode: string;
  fightId: number;
  sourceId: number;
}

export interface ParsedWCLUrl {
  code: string;
  fightId?: number;
  sourceId?: number;
}

export interface ReportMeta {
  title: string;
  owner: string;
  zone: string;
  fights: Array<{
    id: number;
    name: string;
    kill: boolean;
    difficulty: number;
    bossPercentage: number;
    duration: number;
  }>;
  players: Array<{
    id: number;
    name: string;
    type: string;
    subType: string;
    icon: string;
  }>;
}
