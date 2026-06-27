import { apiClient } from "@/services/api";

export type AcademyBatch = {
  id: string;
  name: string;
  batchType: string;
  schedule?: Record<string, unknown> | null;
  programSlug: string;
  courseId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  course?: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    category: string;
  } | null;
  students?: Array<{
    id: string;
    status: string;
    remarks?: string | null;
    student: {
      id: string;
      name: string;
      email: string;
      mobile: string;
      role: string;
    };
  }>;
  teachers?: Array<{
    id: string;
    subject: string;
    role: string;
    status: string;
    teacher: {
      id: string;
      name: string;
      email: string;
      mobile: string;
      role: string;
    };
  }>;
  _count?: {
    students?: number;
    teachers?: number;
    tests?: number;
  };
};

export type AcademyTeacher = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  roleMetadata?: Record<string, unknown> | null;
};

function isDemoAcademyPerson(person?: { name?: string | null; email?: string | null; mobile?: string | null; roleMetadata?: Record<string, unknown> | null } | null) {
  if (!person) return false;
  const value = [person.name, person.email, person.mobile, JSON.stringify(person.roleMetadata ?? {})].join(" ").toLowerCase();
  return value.includes("maj. vikram") || value.includes("maj vikram") || value.includes("faculty.ssb@nidusacademy") || value.includes("ssb mentor");
}

function withoutDemoTeachers(batch: AcademyBatch): AcademyBatch {
  const teachers = (batch.teachers ?? []).filter((entry) => !isDemoAcademyPerson(entry.teacher));
  return {
    ...batch,
    teachers,
    _count: {
      ...(batch._count ?? {}),
      teachers: teachers.length,
    },
  };
}

export type AcademyTeacherPayload = {
  name: string;
  email: string;
  phone?: string;
  role: "TEACHER";
  designation?: string;
  department?: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "HOURLY" | "CONTRACT";
  hourlyRate?: number;
  subjects?: string[];
  dashboardTemplate?: string;
  password?: string;
};

export type AcademicCalendarItem = {
  id: string;
  batchId?: string | null;
  batchName: string;
  programSlug?: string | null;
  subject: string;
  topic: string;
  classType?: string | null;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  status: string;
  completionStatus: string;
  teacherLog?: string | null;
  nextAction?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademicCalendarPlannerSession = {
  dayOfWeek: number;
  subject: string;
  topic: string;
  classType?: string;
  startTime: string;
  endTime?: string;
  teacherId?: string;
};

export type AcademicCalendarPlannerResult = {
  batch: { id: string; name: string };
  createdCount: number;
  skippedCount: number;
  conflictCount: number;
  created: Array<Record<string, unknown>>;
  skipped: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
};

export type AcademyTodayTask = {
  id: string;
  source: string;
  sourceId?: string | null;
  type: string;
  date: string;
  time?: string | null;
  endTime?: string | null;
  title: string;
  detail: string;
  batchId?: string | null;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  status: string;
  done: boolean;
  actions: Array<{ key: string; label: string }>;
};

export type AcademyTodayResponse = {
  date: string;
  generatedAt: string;
  roleMode: "ACADEMIC_MANAGER" | "TEACHER";
  todayTasks: AcademyTodayTask[];
  upcomingTasks: AcademyTodayTask[];
  nextUpcomingTask: AcademyTodayTask | null;
  diagnostics: {
    emptyReason: string | null;
    batchCount: number;
    assignmentCount: number;
    rawCalendarRows: number;
    productionCalendarRows: number;
    rawTodayCalendarRows: number;
    visibleTodayCalendarRows: number;
    visibleUpcomingCalendarRows: number;
    pendingAssignmentReviews: number;
    pendingExamReviews: number;
    attendancePendingCount: number;
    window: {
      today: string;
      from: string;
      to: string;
    };
  };
};

export type AttendanceSummary = {
  sessions: number;
  records: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
  batches: Array<{
    batchId: string;
    batchName?: string | null;
    sessions: number;
    present: number;
    absent: number;
    leave: number;
    total: number;
    percentage: number;
  }>;
  students: Array<{
    studentId: string;
    studentName?: string | null;
    present: number;
    absent: number;
    leave: number;
    total: number;
    percentage: number;
  }>;
};

export type AttendanceSession = {
  id: string;
  batchId: string;
  batchName?: string | null;
  subject?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  date: string;
  records: Array<{ studentId?: string; studentName?: string; status?: string }>;
  status: string;
  createdAt: string;
};

export type AssignmentRecord = {
  id: string;
  batchId: string;
  batchName?: string | null;
  subject?: string | null;
  course?: string | null;
  title: string;
  topic?: string | null;
  instructions: string;
  dueDate?: string | null;
  attachmentName?: string | null;
  link?: string | null;
  status: string;
  createdAt: string;
  submissions?: AssignmentSubmissionRecord[];
  submissionStats?: {
    totalStudents: number;
    submitted: number;
    pending: number;
    reviewed: number;
  };
};

export type AssignmentSubmissionRecord = {
  id: string;
  assignmentId: string;
  batchId: string;
  studentId: string;
  studentName?: string | null;
  answerText?: string | null;
  attachmentName?: string | null;
  link?: string | null;
  status: string;
  submittedAt: string;
  reviewStatus: string;
  feedback?: string | null;
  score?: number | null;
};

export type AssignmentSummary = {
  assignments: number;
  totalExpected: number;
  submitted: number;
  pending: number;
  reviewed: number;
};

export type StudyMaterialRecord = {
  id: string;
  batchId: string;
  batchName?: string | null;
  course?: string | null;
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  title: string;
  type: string;
  url?: string | null;
  fileName?: string | null;
  status: string;
  reviewStatus?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaterialSummary = {
  total: number;
  published: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  links: number;
  files: number;
  byType?: Record<string, number>;
};

export type TeacherExamRecord = {
  id: string;
  batchId: string;
  batchName?: string | null;
  testId?: string | null;
  subject?: string | null;
  course?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  title: string;
  topic?: string | null;
  questionCount: number;
  durationMinutes: number;
  difficulty: string;
  instructions?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  attemptStats?: {
    attempts: number;
    submitted: number;
    averageScore: number;
  };
};

export type ExamSummary = {
  exams: number;
  liveTests: number;
  attempts: number;
  submitted: number;
  averageScore: number;
};

export type SyllabusProgressRecord = {
  id: string;
  batchId: string;
  batchName?: string | null;
  subject: string;
  topic: string;
  teacherId?: string | null;
  teacherName?: string | null;
  completionStatus: string;
  progressColor: string;
  remarks?: string | null;
  updatedAt: string;
};

export type SyllabusSummary = {
  total: number;
  green: number;
  orange: number;
  red: number;
  completed: number;
  partial: number;
  pending: number;
  completionPercentage: number;
};

export type SyllabusBatchSummary = SyllabusSummary & {
  batchId?: string | null;
  batchName?: string | null;
};

export type DirectorExpenseRecord = {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  note?: string | null;
  status: string;
  createdAt: string;
};

export type TeacherPerformanceCard = {
  teacherId: string;
  teacherName: string;
  assignedBatches: number;
  assignedSubjects: string[];
  classesConducted: number;
  syllabusCompletionPercentage: number | null;
  attendanceMarkingPercentage: number | null;
  assignmentsPublished: number;
  examsPublished: number;
  libraryMaterialsUploaded: number;
  status: "GREEN" | "ORANGE" | "RED";
};

export type AcademicCalendarMonitorItem = {
  batchId?: string | null;
  batchName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  subject: string;
  plannedClasses: number;
  completedClasses: number;
  delayedClasses: number;
  missedClasses: number;
  completionPercentage: number;
  status: "GREEN" | "ORANGE" | "RED";
};

export type StudentProgressBatchCard = {
  batchId: string;
  batchName: string;
  programSlug?: string | null;
  studentCount: number;
  batchHealthScore: number | null;
  attendancePercentage: number | null;
  assignmentCompletionPercentage: number | null;
  examAveragePercentage: number | null;
  libraryUsagePercentage: number | null;
  materialCount: number;
  riskStudentCount: number;
  overallStatus: "Healthy" | "Attention Needed" | "Critical" | "No Data";
};

export type AcademicAssessmentEcosystemSummary = {
  exams: number;
  mockTests: number;
  assignments: number;
  questionBanks: number;
  aiGeneratedAssessments: number;
};

export type BatchFilters = {
  programSlug?: string;
  batchType?: string;
  status?: string;
};

export async function getAcademyBatches(filters: BatchFilters = {}) {
  const response = await apiClient.get<{ batches: AcademyBatch[] } | AcademyBatch[]>("/academy/batches", { params: filters });
  const batches = Array.isArray(response.data) ? response.data : response.data.batches;
  return batches.map(withoutDemoTeachers);
}

export async function getAcademyTeachers() {
  const response = await apiClient.get<{ teachers: AcademyTeacher[] } | AcademyTeacher[]>("/academy/teachers");
  const teachers = Array.isArray(response.data) ? response.data : response.data.teachers;
  return teachers.filter((teacher) => !isDemoAcademyPerson(teacher));
}

export async function createAcademyTeacher(payload: AcademyTeacherPayload) {
  const response = await apiClient.post<{ employee: AcademyTeacher; credentials: { email: string; temporaryPassword: string } }>("/academy/employees", payload);
  return response.data;
}

export async function createAcademyBatch(payload: {
  name: string;
  batchType: string;
  programSlug: string;
  programName?: string;
  programType?: string;
  learningMode?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.post<{ batch: AcademyBatch } | AcademyBatch>("/academy/batches", payload);
  return "batch" in response.data ? response.data.batch : response.data;
}

export async function updateAcademyBatch(batchId: string, payload: Partial<{
  name: string;
  batchType: string;
  programSlug: string;
  programName: string;
  programType: string;
  learningMode: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}>) {
  const response = await apiClient.patch<{ batch: AcademyBatch } | AcademyBatch>(`/academy/batches/${batchId}`, payload);
  return "batch" in response.data ? response.data.batch : response.data;
}

export async function assignTeacherToBatch(batchId: string, payload: { teacherId: string; subject?: string; subjects?: string[]; role?: string; status?: string }) {
  const response = await apiClient.post(`/academy/batches/${batchId}/teachers`, payload);
  return response.data;
}

export async function getAcademicCalendar(filters: { batchId?: string; status?: string } = {}) {
  const response = await apiClient.get<{ items: AcademicCalendarItem[] }>("/academy/academic-calendar", { params: filters });
  return response.data.items;
}

export async function getAcademyToday(filters: { date?: string } = {}) {
  const response = await apiClient.get<AcademyTodayResponse>("/academy/today", { params: filters });
  return response.data;
}

export async function runAcademyTodayAction(payload: {
  action: string;
  taskId?: string;
  calendarId?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  completionStatus?: string;
  teacherLog?: string;
  nextAction?: string;
  homeworkGiven?: string;
  supportNeeded?: string;
  meetingLink?: string;
  recordingUrl?: string;
  records?: Array<{ studentId?: string; studentName?: string; status?: string; remarks?: string }>;
}) {
  const response = await apiClient.post<{ ok: boolean; action: string; [key: string]: unknown }>("/academy/today/actions", payload);
  return response.data;
}

export async function getAttendanceSummary(filters: { batchId?: string } = {}) {
  const response = await apiClient.get<{ summary: AttendanceSummary; attendance: AttendanceSession[] }>("/academy/attendance-summary", { params: filters });
  return response.data;
}

export async function getAssignmentSummary(filters: { batchId?: string } = {}) {
  const response = await apiClient.get<{ summary: AssignmentSummary; assignments: AssignmentRecord[] }>("/academy/assignment-summary", { params: filters });
  return response.data;
}

export async function getMaterialSummary(filters: { batchId?: string } = {}) {
  const response = await apiClient.get<{ summary: MaterialSummary; materials: StudyMaterialRecord[] }>("/academy/material-summary", { params: filters });
  return response.data;
}

export async function getExamSummary(filters: { batchId?: string } = {}) {
  const response = await apiClient.get<{ summary: ExamSummary; exams: TeacherExamRecord[] }>("/academy/exam-summary", { params: filters });
  return response.data;
}

export async function getSyllabusSummary(filters: { batchId?: string } = {}) {
  const response = await apiClient.get<{
    summary: SyllabusSummary;
    batches: SyllabusBatchSummary[];
    progress: SyllabusProgressRecord[];
  }>("/academy/syllabus-summary", { params: filters });
  return response.data;
}

export async function getTeacherPerformanceSummary() {
  const response = await apiClient.get<{ teachers: TeacherPerformanceCard[] }>("/academy/teacher-performance-summary");
  return response.data;
}

export async function getAcademicCalendarMonitor() {
  const response = await apiClient.get<{ items: AcademicCalendarMonitorItem[] }>("/academy/academic-calendar-monitor");
  return response.data;
}

export async function getStudentProgressSummary() {
  const response = await apiClient.get<{ batches: StudentProgressBatchCard[] }>("/academy/student-progress-summary");
  return response.data;
}

export async function getAcademicAssessmentEcosystem() {
  const response = await apiClient.get<{ summary: AcademicAssessmentEcosystemSummary }>("/academy/assessment-ecosystem");
  return response.data;
}

export async function publishStudyMaterial(payload: {
  batchId: string;
  batchName?: string;
  course?: string;
  folder?: string;
  subject?: string;
  topic?: string;
  title: string;
  type?: string;
  url?: string;
  fileName?: string;
  status?: string;
}) {
  const response = await apiClient.post<{ material: StudyMaterialRecord }>("/academy/study-materials", payload);
  return response.data.material;
}

export async function reviewStudyMaterial(id: string, payload: { reviewStatus: string; reviewNote?: string }) {
  const response = await apiClient.patch<{ material: StudyMaterialRecord }>(`/academy/study-materials/${id}/review`, payload);
  return response.data.material;
}

export async function archiveStudyMaterial(id: string) {
  const response = await apiClient.post<{ material: StudyMaterialRecord }>(`/academy/study-materials/${id}/archive`);
  return response.data.material;
}

export async function createAcademicCalendarItem(payload: {
  batchId?: string;
  subject: string;
  topic: string;
  classType?: string;
  plannedDate: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
  status?: string;
  completionStatus?: string;
  teacherLog?: string;
  nextAction?: string;
}) {
  const response = await apiClient.post<{ item: AcademicCalendarItem }>("/academy/academic-calendar", payload);
  return response.data.item;
}

export async function updateAcademicCalendarItem(id: string, payload: Partial<Pick<AcademicCalendarItem, "status" | "completionStatus" | "teacherLog" | "nextAction" | "classType">>) {
  const response = await apiClient.patch<{ item: AcademicCalendarItem }>(`/academy/academic-calendar/${id}`, payload);
  return response.data.item;
}

export async function updateAcademicCalendarSchedule(id: string, payload: Partial<Pick<AcademicCalendarItem, "subject" | "topic" | "classType" | "plannedDate" | "startTime" | "endTime" | "teacherId" | "teacherName" | "status" | "completionStatus" | "teacherLog" | "nextAction">>) {
  const response = await apiClient.patch<{ item: AcademicCalendarItem }>(`/academy/academic-calendar/${id}`, payload);
  return response.data.item;
}

export async function generateAcademicCalendarPlan(payload: {
  batchId: string;
  startDate: string;
  endDate: string;
  academicYear?: string;
  sessions: AcademicCalendarPlannerSession[];
}) {
  const response = await apiClient.post<AcademicCalendarPlannerResult>("/academy/academic-calendar/generate", payload);
  return response.data;
}

export async function getDirectorExpenses() {
  const response = await apiClient.get<{
    summary: { total: number; active: number; archived: number; byCategory: Record<string, number> };
    expenses: DirectorExpenseRecord[];
  }>("/academy/director-expenses");
  return response.data;
}

export async function createDirectorExpense(payload: { title: string; category: string; amount: number; currency?: string; note?: string }) {
  const response = await apiClient.post<{ expense: DirectorExpenseRecord }>("/academy/director-expenses", payload);
  return response.data.expense;
}

export async function archiveDirectorExpense(id: string) {
  const response = await apiClient.post<{ expense: DirectorExpenseRecord }>(`/academy/director-expenses/${id}/archive`);
  return response.data.expense;
}
