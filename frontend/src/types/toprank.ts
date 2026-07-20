export const TOPRANK_ROLES = ["TOPRANK_STUDENT", "TOPRANK_MENTOR", "TOPRANK_ADMIN", "TOPRANK_SUPER_ADMIN"] as const;

export type TopRankRole = (typeof TOPRANK_ROLES)[number];

export type TopRankGatewayStatus = "ADMISSIONS_OPEN" | "COMING_SOON";

export type TopRankGateway = {
  id: string;
  title: string;
  slug: string;
  badge: string;
  description: string;
  status: TopRankGatewayStatus;
  href: string;
  symbol: string;
};

export type TopRankUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TopRankRole;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type TopRankAuthLoginDto = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type TopRankAuthRegisterDto = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  state: string;
  district: string;
  language: string;
  acceptTerms: boolean;
};

export type TopRankProgram = {
  id: string;
  gatewayId: string;
  title: string;
  duration: string;
  fee: string;
  status: "DRAFT" | "ACTIVE" | "COMING_SOON";
};

export type TopRankDashboardCard = {
  title: string;
  description: string;
  status?: string;
  href?: string;
};

export type TopRankStudentProfile = {
  id?: string;
  userId?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  education?: string;
  currentOccupation?: string;
  preferredLanguage?: string;
  previousAgniveerAttempts?: number;
  runningExperience?: string;
  pushUpExperience?: string;
  sitUpExperience?: string;
  currentPreparationLevel?: string;
  dailyStudyHours?: number;
  internetAvailability?: string;
  deviceType?: string;
  learningPreference?: string;
  careerGoal?: string;
  completionPercentage?: number;
};

export type TopRankBatch = {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
};

export type TopRankEnrollment = {
  id: string;
  userId: string;
  programId: string;
  batchId?: string | null;
  status: string;
  currentStep: string;
  enrollmentDate: string;
  completedAt?: string | null;
};

export type TopRankOnboardingStatus = {
  enrollment: TopRankEnrollment;
  profile: TopRankStudentProfile | null;
  selectedBatch: TopRankBatch | null;
  agreement: { accepted: boolean; acceptedAt?: string | null } | null;
};

export type TopRankAPR = {
  id: string;
  userId: string;
  assessmentId: string;
  academicScore: number;
  physicalScore: number;
  learningScore: number;
  disciplineScore: number;
  careerScore: number;
  overallScore: number;
  status: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  summary?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  assessment?: {
    id: string;
    completedAt: string;
    overallScore: number;
  };
};

export type TopRankAssessmentStatus = {
  completed: boolean;
  assessment: { id: string; completedAt: string; overallScore: number } | null;
  apr: TopRankAPR | null;
};

export type TopRankMissionTask = {
  id: string;
  missionId: string;
  title: string;
  taskType: string;
  durationMinutes: number;
  sequence: number;
  completed: boolean;
};

export type TopRankMission = {
  id: string;
  userId: string;
  title: string;
  description: string;
  missionType: string;
  difficulty: string;
  priority: number;
  estimatedMinutes: number;
  dueDate: string;
  dayNumber: number;
  weekNumber: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED" | "RESCHEDULED";
  objectives: string[];
  resources?: unknown;
  metadata?: Record<string, unknown> | null;
  tasks?: TopRankMissionTask[];
};

export type TopRankMissionDashboard = {
  todayMissions: TopRankMission[];
  upcomingMission: TopRankMission | null;
  progress: { total: number; completed: number; pending: number; missed: number; completion: number };
  weekly: Array<{ weekNumber: number; status: string; _count: { id: number } }>;
};

export type TopRankMissionCalendarEntry = {
  id: string;
  calendarDate: string;
  weekNumber: number;
  dayNumber: number;
  status: string;
  mission: TopRankMission;
};
