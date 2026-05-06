export type StudyPlan = {
  id: string;
  targetExam: string;
  studyHoursPerDay: number;
  targetDate: string;
  strengths: string[];
  weaknesses: string[];
  generatedPlan: Array<{ day: string; focus: string; hours: number; mission: string }>;
  createdAt: string;
};

export type PerformanceAnalytics = {
  testAccuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  averageScore: number;
  studyConsistency: number;
  revisionRate: number;
  aiSuggestions: string[];
};

export type RevisionSchedule = {
  id: string;
  topic: string;
  revisionDate: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};
