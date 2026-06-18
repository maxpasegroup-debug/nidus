export type TopRankBand = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "ELITE";
export type TopRankTrend = "RISING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
export type TopRankGrowthClassification = "RAPID_GROWTH" | "HEALTHY_GROWTH" | "SLOW_GROWTH" | "FLAT" | "DECLINING";
export type TopRankRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type TopRankSignalScope = {
  userId: string;
  batchId?: string;
};

export type TopRankSignalBundle = {
  userId: string;
  batchId?: string;
  programSlug?: string;
  attendance: {
    total: number;
    present: number;
    absent: number;
    percentage: number | null;
    teacherSessions: number;
  };
  assignments: {
    assigned: number;
    submitted: number;
    reviewed: number;
    averageScore: number | null;
    completionPercentage: number | null;
  };
  exams: {
    records: number;
    published: number;
    teacherExamAverage: number | null;
  };
  tests: {
    available: number;
    attempts: number;
    submitted: number;
    averageScore: number | null;
  };
  liveClasses: {
    scheduled: number;
    completed: number;
    recordings: number;
  };
  fitness: {
    profileCount: number;
    logCount: number;
    ptAttendanceCount: number;
    latestFitnessLevel?: string;
    averageDailyScore: number | null;
  };
  progress: {
    lectureProgressCount: number;
    lectureCompleted: number;
    guruProgressCount: number;
    enrollmentProgress: number | null;
  };
  teachers: {
    allocatedTeachers: number;
    allocatedSubjects: number;
  };
  sourceCounts: Record<string, number>;
};

export type TopRankComponentScores = {
  attendanceDiscipline: number;
  assignmentDiscipline: number;
  practiceDiscipline: number;
  fitnessDiscipline: number;
  consistencyDiscipline: number;
  academicPerformance: number;
  learningProgress: number;
  liveClassParticipation: number;
};

export type TopRankReadinessResult = {
  score: number;
  band: TopRankBand;
  explanation: string;
  academicScore: number;
  disciplineScore: number;
  performanceScore: number;
  growthScore: number;
  riskScore: number;
  components: TopRankComponentScores;
};

export type TopRankRiskSignalResult = {
  riskType: string;
  riskLevel: TopRankRiskLevel;
  riskScore: number;
  reason: string;
};
