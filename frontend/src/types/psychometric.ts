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
  access?: "FREE" | "CORE" | "PREMIUM";
  category?: string;
  isActive?: boolean;
  updatedAt?: string;
  createdAt: string;
  questions?: PsychometricQuestion[];
  _count?: { questions: number; attempts?: number };
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
    reportVersion?: string;
    score: number;
    level: string;
    executiveSummary?: string;
    simpleMeaning: string;
    percentileContext?: string;
    reportConfidence?: string;
    dimensionScores: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
    dimensionInsights?: Array<{ dimension: string; label: string; score: number; interpretation: string; action: string }>;
    strengths: string[];
    improvementAreas: string[];
    behaviourPattern: string;
    officerReadinessSignal: string;
    parentSummary: string;
    counsellorSummary: string;
    recommendedNextTest: string;
    recommendedGuruQuest: string;
    counsellingAction: string;
    integritySignals?: string[];
    riskReview?: string[];
    parentGuidance?: string[];
    sevenDayActionPlan: string[];
    thirtyDayPlan?: string[];
    ninetyDayPlan?: string[];
    mentorReviewChecklist?: string[];
    mentorNotes?: string[];
    disclaimer?: string;
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

export type PsychometricReportHistory = {
  summary: {
    totalAssessments: number;
    completedCount: number;
    reportReadyCount: number;
    profileAccuracy: number;
    averageScore: number;
    readinessBand: string;
    strongestReport: { attemptId: string; title: string; score: number; readinessBand: string } | null;
    latestReport: { attemptId: string; title: string; score: number; completedAt: string } | null;
  };
  reports: Array<{
    attemptId: string;
    testId: string;
    title: string;
    type: string;
    description: string;
    score: number;
    readinessBand: string;
    completedAt: string;
    answerCount: number;
    reportHref: string;
    pdfHref: string;
    aiAnalysis?: string | null;
    overallRemark?: string | null;
  }>;
};

export type PsychometricAttemptHistory = {
  testId: string;
  attempts: number;
  latestScore: number;
  bestScore: number;
  improvement: number;
  trend: Array<{
    attemptId: string;
    attemptNumber: number;
    score: number;
    readinessBand: string;
    completedAt: string;
    reportHref: string;
    pdfHref: string;
    answerCount: number;
    snapshotReady: boolean;
  }>;
};

export type PsychometricAdminOverview = {
  summary: {
    totalAssessments: number;
    totalStudents: number;
    totalAttempts: number;
    completedReports: number;
    activeStudents: number;
    adoptionRate: number;
    completionRate: number;
    averageScore: number;
    readinessBand: string;
    lowScoreCount: number;
  };
  topAssessments: Array<{
    testId: string;
    title: string;
    type: string;
    attempts: number;
    averageScore: number;
  }>;
  recentReports: Array<{
    attemptId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    testId: string;
    title: string;
    type: string;
    score: number;
    readinessBand: string;
    completedAt: string;
    answerCount: number;
    reportHref: string;
    pdfHref: string;
  }>;
};

export type PsychometricReadiness = {
  generatedAt: string;
  status: "READY" | "WATCH" | "NEEDS_FIX";
  minimumQuestions: number;
  expectedAssessments: number;
  readinessScore: number;
  summary: {
    totalAssessments: number;
    activeAssessments: number;
    questionReadyAssessments: number;
    totalAttempts: number;
    completedAttempts: number;
    reportSnapshots: number;
    reportSnapshotCoverage: number;
    accessMix: Record<"FREE" | "CORE" | "PREMIUM", number>;
    categoryMix: Record<string, number>;
  };
  issues: string[];
  checks: Array<{
    id: string;
    title: string;
    access: "FREE" | "CORE" | "PREMIUM";
    category: string;
    isActive: boolean;
    questionCount: number;
    attemptCount: number;
    questionReady: boolean;
    productionReady: boolean;
  }>;
};

export type PsychometricAnalytics = {
  generatedAt: string;
  sampleSize: number;
  summary: {
    totalAttempts: number;
    completedAttempts: number;
    completionRate: number;
    lowScoreReports: number;
    highReadinessReports: number;
  };
  readinessBands: Array<{ band: string; count: number }>;
  accessPerformance: Array<{ key: string; attempts: number; averageScore: number }>;
  categoryPerformance: Array<{ key: string; attempts: number; averageScore: number }>;
  dimensionAverages: Array<{ dimension: string; label: string; attempts: number; averageScore: number }>;
  dailyTrend: Array<{ date: string; attempts: number; averageScore: number }>;
  counsellingPriority: Array<{
    attemptId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    testTitle: string;
    score: number;
    readinessBand: string;
    completedAt: string;
    answerCount: number;
    reportHref: string;
  }>;
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
