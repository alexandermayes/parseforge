export interface ReportFight {
  id: number;
  name: string;
  kill: boolean;
  difficulty: number;
  bossPercentage: number;
  duration: number;
}

export interface ReportPlayer {
  id: number;
  name: string;
  type: string;
  subType: string;
  icon: string;
}

export interface ReportMeta {
  title: string;
  owner: string;
  zone: string;
  fights: ReportFight[];
  players: ReportPlayer[];
}

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
  throughput: number;
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

export interface DpsData {
  playerDps: number;
  medianDps: number;
  topDps: number;
  percentile: number;
  gapToMedian: number;
  gapToTop: number;
  fightDuration: number;
}

export interface GearData {
  playerAvgIlvl: number;
  topAvgIlvl: number;
  missingEnchants: number;
  missingGems: number;
}

export interface ImprovementSuggestion {
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  estimatedImpact?: string;
}

export interface MetricPercentile {
  metric: string;
  label: string;
  playerValue: number;
  topAvgValue: number;
  percentile: number;
  grade: "S" | "A" | "B" | "C" | "D";
  description: string;
}

export interface AnalysisResult {
  playerName: string;
  playerClass: string;
  playerSpec: string;
  playerRole: "dps" | "healer";
  encounterName: string;
  fightDuration: number;
  dps: DpsData;
  gear: GearData;
  consumables: ConsumableStatus;
  suggestions: ImprovementSuggestion[];
  topPlayerName: string;
  metricPercentiles: {
    metrics: MetricPercentile[];
    overallScore: number;
    overallGrade: "S" | "A" | "B" | "C" | "D";
  };
}
