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
  academyProfile: {
    assignedBatches: Array<{
      id: string;
      name: string;
      type: string;
      programSlug: string;
      status: string;
      joinedAt: string;
      teachers: number;
      tests: number;
      course: { id: string; title: string; slug: string; category: string; examType: string; duration: string } | null;
    }>;
    todayClasses: Array<{ id: string; title: string; batch: string; subject: string; instructor: string; startTime: string; endTime: string; classroom: string }>;
    upcomingClasses: Array<{ id: string; title: string; batch: string; subject: string; instructor: string; startTime: string; endTime: string; classroom: string }>;
    librarySubjects: string[];
  };
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
  assessmentProfile?: {
    totalAssessments: number;
    completedCount: number;
    reportReadyCount: number;
    profileAccuracy: number;
    averageScore: number;
    readinessBand: string;
    strongestSignal: { title: string; score: number; attemptId: string } | null;
    latestReport: { title: string; score: number; attemptId: string; completedAt: string } | null;
    completed: Array<{
      id: string;
      title: string;
      type: string;
      score: number;
      completedAt: string;
      attemptId: string;
      reportHref: string;
      pdfHref: string;
      readinessBand: string;
      remark: string;
    }>;
  };
  recentActivities: string[];
};

export type AssessmentProfileData = NonNullable<StudentDashboardData["assessmentProfile"]>;

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
    recent?: Array<{ subject?: string | null; batchName?: string | null; date: string; status: string }>;
  };
  assignments?: {
    total: number;
    submitted: number;
    pending: number;
    recent: Array<{ id: string; title: string; subject?: string | null; batchName?: string | null; dueDate?: string | null; status: string; score?: number | null }>;
  };
  exams?: {
    published: number;
    submitted: number;
    averageScore: number;
    recent: Array<{ id: string; score?: number | null; submittedAt?: string | null; status: string }>;
  };
  feeStatus: {
    status: string;
    dueAmount: number;
    totalPaid?: number;
    latestReceiptNumber?: string | null;
    nextDueDate: string;
    installments?: Array<{ id: string; title: string; amount: number; paidAmount: number; dueAmount: number; dueDate: string; paidStatus: string }>;
    payments?: Array<{ id: string; amount: number; currency: string; method?: string | null; receiptNumber?: string | null; receiptUrl?: string | null; paidAt: string; status: string }>;
    receipts?: Array<{ id: string; documentNumber?: string | null; fileUrl?: string | null; status: string; createdAt: string }>;
  };
  fitness?: {
    bmi: number;
    runningTime: number;
    staminaScore: number;
    fitnessLevel: string;
    recentLogs: Array<{ id: string; runningDistance: number; workoutDuration: number; notes?: string | null; createdAt: string }>;
  } | null;
  notifications: string[];
  disciplineScore: {
    grade: string;
    score: number;
    notes: string;
  };
  assessmentProfile?: AssessmentProfileData;
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
  customDashboard: StaffDashboardProfile;
  academySummary: { programs: number; batches: number; teacherAssignments: number; timetableSlots: number; draftTests: number; liveTests: number };
  admissionProgramPipeline: Array<{ courseId: string; title: string; category: string; status: string; count: number }>;
  leadProgramPipeline: Array<{ program: string; count: number }>;
};

export type TeacherDashboardData = {
  profile: (Pick<AuthUser, "id" | "name" | "email" | "mobile" | "role"> & { instituteId?: string | null; branchId?: string | null }) | null;
  customDashboard: StaffDashboardProfile;
  subjects: string[];
  assignedBatches: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    subject: string;
    role: string;
    programSlug: string;
    students: number;
    tests: number;
    schedule: unknown;
    course: { id: string; title: string; slug: string; category: string; examType: string; duration: string } | null;
  }>;
  teachingPlan: {
    today: Array<{ id: string; title: string; batch: string; subject: string; startTime: string; endTime: string; classroom: string }>;
    upcoming: Array<{ id: string; title: string; batch: string; subject: string; startTime: string; endTime: string; classroom: string }>;
  };
  classPerformance: { averageScore: number; attendance: number; weakStudentCount: number; assignmentsDue: number };
  contentOps: { lectureUploads: number; notesUploads: number; pendingReviews: number; cbtDrafts: number };
  physicalTraining?: { schedules: number; attendanceMarked: number; fitnessProfiles: number; eligibilityReviews: number; dailyLogs: number };
  modules: Array<{ title: string; status: string; metric: string }>;
  weakStudentAlerts: string[];
  aiRecommendations: string[];
};

export type DirectorDashboardData = {
  lastUpdatedAt?: string;
  scope: { instituteId: string | null; branchId: string | null };
  customDashboard: StaffDashboardProfile;
  instituteAnalytics: { students: number; teachers: number; attendance: number; cbtCompletion: number };
  admissionsAnalytics: { leads: number; admissions: number; conversionRate: number };
  revenueAnalytics: { collected: number; pending: number; forecast: number };
  facultyAnalytics: { active: number; utilization: number; reviewDue: number };
  commandCenter?: {
    admissions: { newLeads: number; readyForAdmission: number; activatedStudents: number };
    academics: { activePrograms: number; activeBatches: number; teachers: number; academicHeads: number };
    learning: { liveClasses: number; lessonsUploaded: number; examsPublished: number; assignmentsPublished: number };
    staff: {
      academicHeads: { active: number; onLeave: number; archived: number };
      teachers: { active: number; onLeave: number; archived: number };
      physicalTrainers: { active: number; onLeave: number; archived: number };
      administrativeOfficers: { active: number; onLeave: number; archived: number };
      businessDevelopmentExecutives: { active: number; onLeave: number; archived: number };
      archived: number;
    };
    students: {
      total: number;
      active: number;
      batchDistribution: Array<{ program: string; count: number }>;
      programDistribution: Array<{ courseId: string; count: number }>;
    };
    operationalAlerts: {
      pendingAdmissions: number;
      pendingDocuments: number;
      pendingFees: number;
      pendingBatchAllocation: number;
      lowAttendanceAlerts: number;
      examPublicationDelays: number;
    };
    finance: { feesCollected: number; pendingFees: number; installmentsPending: number };
    reports: string[];
  };
  academyArchitecture: {
    programs: number;
    batches: number;
    teacherAssignments: number;
    timetableSlots: number;
    draftTests: number;
    liveTests: number;
    batchTypes: Array<{ type: string; count: number }>;
    verticals: Array<{ category: string; count: number }>;
  };
  riskAlerts: string[];
  executiveInsights: string[];
  growthForecast: Array<{ month: string; forecast: number }>;
};

export type BusinessDevelopmentDashboardData = {
  leadPipeline: { new: number; contacted: number; counselling: number; enrolled: number; lost: number; assignedLeads: number };
  scheduling: { callbacksToday: number; counselling: number; overdueFollowUps: number };
  performance: { callsToday: number; conversionRate: number; averageResponseTime: string; notesAdded: number };
  customDashboard: StaffDashboardProfile;
  modules: string[];
  aiCallScripts: string[];
  whatsappShell: { status: string; templates: number; pendingOptIns: number };
};

export type StaffDashboardProfile = {
  designation: string;
  department: string;
  dashboardTemplate: string;
  subject: string | null;
  focusAreas: string[];
  permissions: string[];
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

export function getTeacherDashboard() {
  return getDashboard<TeacherDashboardData>("/dashboard/teacher");
}

export function getDirectorDashboard() {
  return getDashboard<DirectorDashboardData>("/dashboard/director");
}

export function getBusinessDevelopmentDashboard() {
  return getDashboard<BusinessDevelopmentDashboardData>("/dashboard/business-development");
}
