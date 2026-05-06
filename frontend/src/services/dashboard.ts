import { apiClient } from "@/services/api";
import type { AuthRole, AuthUser } from "@/services/auth";

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
