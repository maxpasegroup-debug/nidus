export type ReadinessBand = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "ELITE";

export type ScoreBand = {
  band: ReadinessBand;
  score: number;
  label: string;
  description: string;
};

export type ScoringAnswerInput = {
  questionId?: string;
  traitId: string;
  traitName: string;
  dimensionId: string;
  dimensionName: string;
  rawScore: number;
  maxScore?: number;
  flags?: {
    heroAnswer?: boolean;
    overclaimSignal?: boolean;
    contradictionProbe?: boolean;
    riskSignal?: boolean;
    socialDesirability?: boolean;
  };
};

export type DimensionScoreInput = {
  dimensionId: string;
  dimensionName: string;
  traitId: string;
  weight?: number;
  answers: ScoringAnswerInput[];
};

export type TraitScoreInput = {
  traitId: string;
  traitName: string;
  weight?: number;
  isCritical?: boolean;
  dimensions: DimensionScoreInput[];
};

export type ScoringInput = {
  attemptId?: string;
  persist?: boolean;
  totalQuestions?: number;
  answeredQuestions?: number;
  traits: TraitScoreInput[];
};

export type DimensionScoreResult = {
  dimensionId: string;
  dimensionName: string;
  traitId: string;
  rawScore: number;
  weightedScore: number;
  confidenceScore: number;
  answered: number;
};

export type TraitScoreResult = {
  traitId: string;
  traitName: string;
  rawScore: number;
  weightedScore: number;
  confidenceScore: number;
  isCritical: boolean;
  dimensions: DimensionScoreResult[];
};

export type IntegrityFlag = {
  type: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  penalty: number;
  reason: string;
};

export type RiskSignal = {
  riskType: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  score: number;
  reason: string;
};
