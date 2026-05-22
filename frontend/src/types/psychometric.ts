export type PsychometricQuestion = {
  id: string;
  testId: string;
  questionText: string;
  imageUrl?: string | null;
  questionType: string;
  options?: string[] | null;
  order: number;
};

export type PsychometricTest = {
  id: string;
  title: string;
  type: "TAT" | "WAT" | "SRT" | "SD" | "OLQ" | "Personality" | "Cognitive";
  description: string;
  duration: number;
  instructions: string;
  createdAt: string;
  questions?: PsychometricQuestion[];
  _count?: { questions: number };
};

export type PsychometricAttempt = {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  completedAt?: string | null;
  score: number;
  aiAnalysis?: string | null;
  overallRemark?: string | null;
  test: PsychometricTest;
};

export type PsychometricResult = {
  attempt: PsychometricAttempt & {
    answers: Array<{
      id: string;
      answerText?: string | null;
      selectedOption?: string | null;
      score: number;
      question: PsychometricQuestion;
    }>;
  };
  recommendations: string[];
  report?: {
    score: number;
    level: string;
    simpleMeaning: string;
    dimensionScores: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
    strengths: string[];
    improvementAreas: string[];
    behaviourPattern: string;
    officerReadinessSignal: string;
    parentSummary: string;
    counsellorSummary: string;
    recommendedNextTest: string;
    recommendedGuruQuest: string;
    counsellingAction: string;
    sevenDayActionPlan: string[];
    answerSignals: Array<{
      question: string;
      answer: string;
      dimension: string;
      dimensionLabel: string;
      score: number;
      interpretation: string;
    }>;
  };
  scoring?: {
    score: number;
    qualityScore: number;
    completionScore: number;
    answered: number;
    totalQuestions: number;
    readinessBand: string;
    dimensionScores: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
    riskIndicators: string[];
    strongestDimensions: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
    weakestDimensions: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
  };
};

export type OLQReport = {
  score: Record<string, number | string>;
  insights: {
    officerReadinessScore: number;
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
};
