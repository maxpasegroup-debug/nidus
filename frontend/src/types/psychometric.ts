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
