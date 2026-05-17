import { apiClient } from "@/services/api";
import type { AuthRole, AuthUser } from "@/services/auth.v2";

type DashboardResponse<T> = {
  role: AuthRole;
  data: T;
};

export type ChartPoint = {
  month: string;
  score?: number;
  attendance?: number;
};

export type StudentDashboardData = {
  profile: Pick<AuthUser, "id" | "name" | "email" | "mobile" | "role"> | null;
  enrolledCourses: Array<{ id: string; title: string; progress: number; nextLesson: string }>;
  upcomingTests: Array<{ id: string; title: string; date: string; durationMinutes: number }>;
  attendance: {
    percentage: number;
    present: number;
    total: number;
    trend: Array<{ month: string; attendance: number }>;
  };
  leaderboardRank: {
    rank: number;
    percentile: number;
    batch: string;
  };
  aiRecommendations: string[];
  fitnessProgress: {
    score: number;
    streakDays: number;
    focus: string;
  };
  recentActivities: string[];
};

export type ParentDashboardData = {
  linkedStudent: Pick<AuthUser, "id" | "name" | "email" | "mobile"> | null;
  monitoringPermissions?: Record<string, boolean> | null;
  studentPerformance: {
    averageScore: number;
    improvement: number;
    trend: ChartPoint[];
  };
  attendance: {
    percentage: number;
    present: number;
    total: number;
  };
  feeStatus: {
    status: string;
    dueAmount: number;
    nextDueDate: string;
  };
  notifications: string[];
  disciplineScore: {
    grade: string;
    score: number;
    notes: string;
  };
};

export type AdminDashboardData = {
  totalStudents: number;
  totalRevenue: {
    amount: number;
    currency: string;
    quarter: string;
  };
  attendanceAnalytics: {
    average: number;
    presentToday: number;
    totalMarked: number;
    trend: Array<{ month: string; attendance: number }>;
  };
  recentAdmissions: Array<Pick<AuthUser, "id" | "name" | "email" | "mobile" | "role" | "createdAt">>;
  staffSummary: {
    totalStaff: number;
    faculty: number;
    mentors: number;
    operations: number;
  };
  hostelStats: {
    occupancyPercentage: number;
    occupiedBeds: number;
    totalBeds: number;
  };
};

export type GuestDashboardData = {
  featuredCourses: Array<{ id: string; title: string; duration: string; level: string }>;
  freeTests: Array<{ id: string; title: string; questions: number }>;
  latestNews: string[];
};

export type TeacherDashboardData = {
  profile: (Pick<AuthUser, "id" | "name" | "email" | "mobile" | "role"> & { instituteId?: string | null; branchId?: string | null }) | null;
  subjects: string[];
  classPerformance: { averageScore: number; attendance: number; weakStudentCount: number; assignmentsDue: number };
  contentOps: { lectureUploads: number; notesUploads: number; pendingReviews: number; cbtDrafts: number };
  modules: Array<{ title: string; status: string; metric: string }>;
  weakStudentAlerts: string[];
  aiRecommendations: string[];
};

export type DirectorDashboardData = {
  scope: { instituteId: string | null; branchId: string | null };
  instituteAnalytics: { students: number; teachers: number; attendance: number; cbtCompletion: number };
  admissionsAnalytics: { leads: number; admissions: number; conversionRate: number };
  revenueAnalytics: { collected: number; pending: number; forecast: number };
  facultyAnalytics: { active: number; utilization: number; reviewDue: number };
  riskAlerts: string[];
  executiveInsights: string[];
  growthForecast: Array<{ month: string; forecast: number }>;
};

export type TelecallerDashboardData = {
  leadPipeline: { new: number; contacted: number; counselling: number; enrolled: number; lost: number; assignedLeads: number };
  scheduling: { callbacksToday: number; counselling: number; overdueFollowUps: number };
  performance: { callsToday: number; conversionRate: number; averageResponseTime: string; notesAdded: number };
  modules: string[];
  aiCallScripts: string[];
  whatsappShell: { status: string; templates: number; pendingOptIns: number };
};

export type MarketingDashboardData = {
  campaignTracking: { activeCampaigns: number; leadsGenerated: number; costPerLead: number; roi: number };
  attribution: Array<{ channel: string; leads: number; conversion: number }>;
  webinarRegistrations: { upcoming: number; registered: number; attendedLast: number };
  landingPageAnalytics: { visitors: number; conversionRate: number; topPage: string };
  roiAnalytics: Array<{ month: string; roi: number }>;
  publishingShell: { contentQueue: number; dailyIntelligenceShares: number; socialPosts: number };
  socialCampaignAnalytics: { reach: number; engagement: number; enquiries: number };
};

async function getDashboard<T>(path: string) {
  const response = await apiClient.get<DashboardResponse<T>>(path);
  return response.data.data;
}

export function getStudentDashboard() {
  return getDashboard<StudentDashboardData>("/dashboard/student");
}

export function getParentDashboard() {
  return getDashboard<ParentDashboardData>("/dashboard/parent");
}

export function getAdminDashboard() {
  return getDashboard<AdminDashboardData>("/dashboard/admin");
}

export function getGuestDashboard() {
  return getDashboard<GuestDashboardData>("/dashboard/guest");
}

export function getTeacherDashboard() {
  return getDashboard<TeacherDashboardData>("/dashboard/teacher");
}

export function getDirectorDashboard() {
  return getDashboard<DirectorDashboardData>("/dashboard/director");
}

export function getTelecallerDashboard() {
  return getDashboard<TelecallerDashboardData>("/dashboard/telecaller");
}

export function getMarketingDashboard() {
  return getDashboard<MarketingDashboardData>("/dashboard/marketing");
}
