export type AIInterviewSession = {
  id: string;
  userId: string;
  examType: string;
  interviewType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  overallScore?: number;
  aiFeedback?: string;
  questions?: AIInterviewQuestion[];
};

export type AIInterviewQuestion = {
  id: string;
  sessionId: string;
  question: string;
  userAnswer?: string;
  aiAnalysis?: string;
  score?: number;
  createdAt: string;
};

export type DoubtQuery = {
  id: string;
  userId: string;
  question: string;
  subject: string;
  aiResponse: string;
  createdAt: string;
};

export type AIRecommendation = {
  id: string;
  userId: string;
  category: string;
  recommendation: string;
  priority: string;
  createdAt: string;
};

export type OfficerPotential = {
  id: string;
  userId: string;
  leadershipScore: number;
  communicationScore: number;
  disciplineScore: number;
  confidenceScore: number;
  officerReadiness: number;
  aiSummary: string;
  updatedAt: string;
};
