"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Children, useEffect, useMemo, useState } from "react";
import { uploadMediaFile } from "@/services/media";
import { TeacherTodayView, type TeacherTodayScheduleItem } from "@/components/teacher/teacher-today-view";
import { TeacherStudentsView, type TeacherRosterBatch } from "@/components/teacher/teacher-students-view";
import { TeacherSimpleCalendar } from "@/components/teacher/teacher-simple-calendar";
import { TeacherExamWorkspace, type TeacherExamBatch } from "@/components/teacher/teacher-exam-workspace";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Folder,
  FolderPlus,
  GraduationCap,
  Library,
  Plus,
  PlayCircle,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  roleMetadata?: Record<string, unknown> | null;
};

type AssignedStudent = {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  photoUrl?: string | null;
  avatarUrl?: string | null;
  rollNumber?: string | null;
};

type AssignedClass = {
  id: string;
  name: string;
  batchType?: string | null;
  subject?: string | null;
  role?: string | null;
  status?: string | null;
  course?: { title?: string | null; name?: string | null; slug?: string | null } | null;
  _count?: { students?: number; teachers?: number } | null;
  students?: Array<{ id?: string; student?: AssignedStudent | null; status?: string | null }>;
  teachers?: Array<{ subject?: string | null; role?: string | null; teacher?: { id?: string; name?: string | null; email?: string | null } | null }>;
};

type CalendarItem = {
  id: string;
  plannedDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  subject?: string;
  topic?: string;
  classType?: string | null;
  batchId?: string | null;
  batchName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  status?: string;
  completionStatus?: string;
  teacherLog?: string | null;
  nextAction?: string | null;
};

type CalendarMonitorItem = {
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

type TeacherPerformanceItem = {
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

type BatchProgressItem = {
  batchId: string;
  batchName: string;
  programSlug?: string | null;
  studentCount: number;
  batchHealthScore: number | null;
  attendancePercentage: number | null;
  assignmentCompletionPercentage: number | null;
  examAveragePercentage: number | null;
  materialCount: number;
  riskStudentCount: number;
  overallStatus: "Healthy" | "Attention Needed" | "Critical" | "No Data";
};

type CalendarTab = "TODAY" | "WEEK" | "MONTH" | "LOGS" | "FACULTY" | "BATCHES";

type CompletionReportForm = {
  topicCovered: string;
  subtopicCovered: string;
  completionPercentage: string;
  homeworkGiven: string;
  participation: string;
  studentsNeedingAttention: string;
  supportRequired: string;
  teacherRemarks: string;
  completionStatus: string;
};

type LiveClassRecord = {
  id: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  instructorName?: string | null;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  isLive?: boolean;
  batchId?: string | null;
  programSlug?: string | null;
  subject?: string | null;
  topic?: string | null;
  teacherId?: string | null;
  status?: string | null;
  recordingUrl?: string | null;
};

type TeachingPlan = {
  batches?: AssignedClass[];
  assignments?: AssignedClass[];
  calendar?: CalendarItem[];
};

type AttendanceRecord = {
  id: string;
  batchId: string;
  batchName?: string | null;
  date?: string;
  subject?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  status?: string | null;
  createdAt?: string;
  records?: Array<{ studentId?: string; studentName?: string; status?: string; remarks?: string }>;
};

type LeaveRequestRecord = {
  id: string;
  studentId: string;
  studentName?: string | null;
  batchId?: string | null;
  batchName?: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  status: string;
  reviewNote?: string | null;
  createdAt?: string;
};

type AssignmentRecord = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  course?: string | null;
  subject?: string | null;
  title?: string;
  topic?: string | null;
  instructions?: string | null;
  dueDate?: string | null;
  status?: string;
  createdAt?: string;
  submissionStats?: { submitted?: number; pending?: number; totalStudents?: number };
  submissions?: Array<{ id?: string; studentId?: string; studentName?: string; status?: string; reviewStatus?: string | null; score?: number | null; marks?: number | null; feedback?: string | null; answerText?: string | null; attachmentName?: string | null; link?: string | null; submittedAt?: string | null }>;
};

type MaterialRecord = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  title?: string;
  description?: string | null;
  type?: string | null;
  url?: string | null;
  fileName?: string | null;
  thumbnailName?: string | null;
  cloudinaryPublicId?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  fileSize?: number | null;
  durationSeconds?: number | null;
  lessonName?: string | null;
  createdAt?: string;
  status?: string;
  reviewStatus?: string | null;
};

type LibraryFolderItem = {
  name: string;
  materials: MaterialRecord[];
  folderRecord?: MaterialRecord;
};

type ExamRecord = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  course?: string | null;
  subject?: string | null;
  title?: string;
  topic?: string | null;
  questionCount?: number;
  durationMinutes?: number;
  difficulty?: string | null;
  status?: string;
  createdAt?: string;
  attemptStats?: { attempts?: number; submitted?: number; averageScore?: number };
};

type SyllabusProgressRecord = {
  id: string;
  subject?: string | null;
  topic?: string | null;
  completionStatus?: string;
  progressColor?: string | null;
  remarks?: string | null;
};

type ClassWorkspace = {
  attendance: AttendanceRecord[];
  assignments: AssignmentRecord[];
  materials: MaterialRecord[];
  exams: ExamRecord[];
  progress: SyllabusProgressRecord[];
};

type CalendarDayTask = {
  id: string;
  kind: "CLASS" | "LIVE_CLASS" | "ASSIGNMENT" | "EXAM" | "MEETING" | "ACTIVITY";
  title: string;
  subtitle?: string;
  date?: string | null;
  time?: string | null;
  endTime?: string | null;
  status?: string | null;
  sourceId?: string;
};

type ExamDraft = {
  draft?: string;
  title?: string;
  topic?: string;
  duration?: number;
  questions?: Array<{ question: string; options?: string[]; answer?: string; marks?: number; difficultyLevel?: string }>;
};

type ExamWorkflowState = {
  requestId: string;
  draftId: string;
  contextId?: string;
};

type AssignmentWorkflowState = {
  requestId: string;
  draftId: string;
  contextId?: string;
};

type ExamChatMessage = {
  id: string;
  role: "guru" | "teacher";
  text: string;
};

type AssignmentChatMessage = {
  id: string;
  role: "guru" | "teacher";
  text: string;
};

type ExamForm = {
  title: string;
  subject: string;
  examType: string;
  topic: string;
  questionCount: string;
  duration: string;
  totalMarks: string;
  difficulty: string;
  instructions: string;
  pastedQuestions: string;
  publishDate: string;
  publishTime: string;
};

type AssignmentForm = {
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  instructions: string;
  pastedContent: string;
  dueDate: string;
  attachmentName: string;
  link: string;
};

type LiveClassForm = {
  subject: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  meetingLink: string;
};

export type TeacherView = "classes" | "students" | "exams" | "assignments" | "attendance" | "library" | "academic-calendar";

function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const trimmed = configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && trimmed) {
    try {
      const configuredUrl = new URL(trimmed);
      const currentHost = window.location.hostname;
      if (currentHost === "nidusacademy.in" && configuredUrl.hostname !== currentHost) {
        return "";
      }
    } catch {
      return "";
    }
  }
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

const API_BASE = resolveApiBase();

const emptyWorkspace: ClassWorkspace = {
  attendance: [],
  assignments: [],
  materials: [],
  exams: [],
  progress: [],
};

const initialLibraryForm = {
  folder: "",
  subject: "",
  topic: "",
  title: "",
  description: "",
  type: "VIDEO",
  url: "",
  fileName: "",
  thumbnailName: "",
  cloudinaryPublicId: "",
  thumbnailUrl: "",
  thumbnailPublicId: "",
  fileSize: "",
  durationSeconds: "",
  lessonName: "",
};

function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error((await response.text().catch(() => "")) || `Request failed: ${response.status}`);
  }
  return unwrapApiPayload<T>(await response.json());
}

async function apiGet<T>(paths: string[]): Promise<T | null> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await requestJson<T>(path);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function apiPost<T>(paths: string[], body: unknown): Promise<T | null> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await requestJson<T>(path, { method: "POST", body: JSON.stringify(body) });
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function apiPatch<T>(paths: string[], body: unknown): Promise<T | null> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await requestJson<T>(path, { method: "PATCH", body: JSON.stringify(body) });
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function apiDelete<T>(paths: string[]): Promise<T | null> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await requestJson<T>(path, { method: "DELETE" });
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

function normalizeAssignedClasses(data: TeachingPlan | AssignedClass[] | null): AssignedClass[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.batches ?? data.assignments ?? [];
}

function programName(batch: AssignedClass) {
  return batch.course?.title || batch.course?.name || batch.course?.slug?.toUpperCase() || "Assigned Program";
}

function programKey(batch: AssignedClass) {
  return batch.course?.slug || programName(batch).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "program";
}

function studentId(entry: NonNullable<AssignedClass["students"]>[number], index: number) {
  return entry.student?.id || entry.id || `student-${index}`;
}

function subjectsForBatch(batch: AssignedClass | null) {
  if (!batch) return ["General"];
  const subjects = new Set<string>();
  if (batch.subject) subjects.add(batch.subject);
  for (const teacher of batch.teachers ?? []) {
    if (teacher.subject) subjects.add(teacher.subject);
  }
  const fromSchedule = (batch as AssignedClass & { schedule?: { subjects?: string[] } | null }).schedule?.subjects;
  if (Array.isArray(fromSchedule)) {
    for (const subject of fromSchedule) {
      if (subject) subjects.add(subject);
    }
  }
  return Array.from(subjects).filter(Boolean).length ? Array.from(subjects).filter(Boolean) : ["General"];
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function calendarMonthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  from.setDate(from.getDate() - 7);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  to.setDate(to.getDate() + 7);
  return {
    from: dateKey(from),
    to: dateKey(to),
  };
}

function startOfWeek(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = value.getDay();
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function calendarStatus(item: CalendarItem) {
  const status = String(item.completionStatus || item.status || "PENDING").toUpperCase();
  if (status === "PARTIAL") return "PARTIALLY_COMPLETED";
  if (["PLANNED", "SCHEDULED", "UPCOMING"].includes(status)) return "PENDING";
  return status;
}

function calendarStatusTone(status?: string | null) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (normalized === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized === "PARTIAL" || normalized === "PARTIALLY_COMPLETED" || normalized === "RESCHEDULED") return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized === "CANCELLED") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function sameDate(value: Date, isoDate?: string) {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  return date.getFullYear() === value.getFullYear() && date.getMonth() === value.getMonth() && date.getDate() === value.getDate();
}

function dateKey(value?: string | Date | null) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureOrToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function nextCalendarForBatch(calendar: CalendarItem[], batchId: string) {
  return calendar
    .filter((item) => item.batchId === batchId && isFutureOrToday(item.plannedDate))
    .sort((a, b) => {
      const dayCompare = dateKey(a.plannedDate).localeCompare(dateKey(b.plannedDate));
      return dayCompare || String(a.startTime || "").localeCompare(String(b.startTime || ""));
    })[0];
}

function taskKindLabel(kind: CalendarDayTask["kind"]) {
  if (kind === "LIVE_CLASS") return "Live Class";
  if (kind === "ASSIGNMENT") return "Assignment";
  if (kind === "EXAM") return "Exam";
  if (kind === "MEETING") return "Meeting";
  if (kind === "CLASS") return "Class";
  return "Activity";
}

function taskKindTone(kind: CalendarDayTask["kind"]) {
  if (kind === "EXAM") return "border-rose-200 bg-rose-50 text-rose-800";
  if (kind === "ASSIGNMENT") return "border-amber-200 bg-amber-50 text-amber-800";
  if (kind === "LIVE_CLASS") return "border-blue-200 bg-blue-50 text-blue-800";
  if (kind === "MEETING") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function statusTone(status?: string | null) {
  const normalized = status?.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "PUBLISHED" || normalized === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (normalized === "PARTIAL" || normalized === "PENDING_REVIEW") return "bg-amber-50 text-amber-700";
  if (normalized === "ABSENT" || normalized === "ARCHIVED") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function isFolderMaterial(item: MaterialRecord) {
  return (item.type || "").toUpperCase() === "FOLDER";
}

function folderName(item: MaterialRecord) {
  return item.lessonName || item.title || item.topic || item.subject || item.folder || "Folder";
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function calculateBatchHealth(students: NonNullable<AssignedClass["students"]>, workspace: ClassWorkspace) {
  const totalStudents = students.length;
  const attendanceEntries = workspace.attendance.flatMap((record) => record.records ?? []);
  const presentEntries = attendanceEntries.filter((entry) => entry.status === "PRESENT").length;
  const assignmentSubmitted = workspace.assignments.reduce((total, assignment) => total + Number(assignment.submissionStats?.submitted ?? 0), 0);
  const assignmentTotal = workspace.assignments.reduce((total, assignment) => total + Number(assignment.submissionStats?.totalStudents ?? totalStudents), 0);
  const examAttempts = workspace.exams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? exam.attemptStats?.attempts ?? 0), 0);
  const examTotal = workspace.exams.length * totalStudents;
  const averageScoreSource = workspace.exams.filter((exam) => typeof exam.attemptStats?.averageScore === "number");
  const examAverage = averageScoreSource.length ? Math.round(averageScoreSource.reduce((total, exam) => total + Number(exam.attemptStats?.averageScore ?? 0), 0) / averageScoreSource.length) : 0;

  return {
    students: totalStudents,
    attendance: percent(presentEntries, attendanceEntries.length),
    assignments: percent(assignmentSubmitted, assignmentTotal),
    exams: examAverage || percent(examAttempts, examTotal),
  };
}

function studentProgressMetrics(student: AssignedStudent | null | undefined, workspace: ClassWorkspace, totalStudents: number) {
  const attendanceEntries = workspace.attendance.flatMap((record) =>
    (record.records ?? []).filter((entry) => entry.studentId === student?.id || entry.studentName === student?.name),
  );
  const presentEntries = attendanceEntries.filter((entry) => entry.status === "PRESENT").length;
  const attendance = attendanceEntries.length ? percent(presentEntries, attendanceEntries.length) : 0;
  const assignments = workspace.assignments.length
    ? Math.round(workspace.assignments.reduce((total, assignment) => total + percent(Number(assignment.submissionStats?.submitted ?? 0), Number(assignment.submissionStats?.totalStudents ?? totalStudents)), 0) / workspace.assignments.length)
    : 0;
  const exams = workspace.exams.length
    ? Math.round(workspace.exams.reduce((total, exam) => total + Number(exam.attemptStats?.averageScore ?? percent(Number(exam.attemptStats?.submitted ?? 0), totalStudents)), 0) / workspace.exams.length)
    : 0;
  const signals = [attendance, assignments, exams].filter((value) => value > 0);
  const overall = signals.length ? Math.round(signals.reduce((total, value) => total + value, 0) / signals.length) : 0;
  return { attendance, assignments, exams, overall };
}

function isTeacherClassAllocation(batch: AssignedClass, isAcademicHead: boolean) {
  if (batch.status === "ARCHIVED") return false;
  if (batch.role === "ACADEMIC_HEAD" && batch.subject === "Academic Coordination") return false;
  if (isAcademicHead) return true;
  return true;
}

function teacherNameForBatch(batch: AssignedClass, subject?: string | null) {
  const exact = batch.teachers?.find((entry) => entry.subject === subject && entry.teacher?.name)?.teacher?.name;
  return exact || batch.teachers?.find((entry) => entry.teacher?.name)?.teacher?.name || "Teacher pending";
}

function classStatus(item: CalendarItem | LiveClassRecord) {
  const status = ("status" in item ? item.status : undefined)?.toUpperCase();
  if (status === "CANCELLED") return "Cancelled";
  if (status === "COMPLETED") return "Completed";
  if ("isLive" in item && item.isLive) return "Live";
  if ("scheduledAt" in item) {
    const start = new Date(item.scheduledAt).getTime();
    const end = start + Number(item.duration || 60) * 60 * 1000;
    const now = Date.now();
    if (now >= start && now <= end) return "Live";
    if (now > end && status !== "COMPLETED") return "Delayed";
    return "Upcoming";
  }
  if (status === "DELAYED" || status === "MISSED") return "Delayed";
  return status ? status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "Upcoming";
}

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function displayDate(value?: string | null) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function teacherCategory(subjects: string[], roles: string[] = []) {
  const combined = [...subjects, ...roles].join(" ").toLowerCase();
  if (combined.includes("physical")) return "Physical Trainers";
  if (combined.includes("academic_head") || combined.includes("academic head") || combined.includes("academic coordination")) return "Academic Heads";
  return "Subject Teachers";
}

function teacherCategoryOrder(category: string) {
  if (category === "Academic Heads") return 0;
  if (category === "Subject Teachers") return 1;
  if (category === "Physical Trainers") return 2;
  return 3;
}

function isTemporaryActivationCalendarItem(item: CalendarItem) {
  const topic = (item.topic || "").trim().toLowerCase();
  const nextAction = (item.nextAction || "").trim().toLowerCase();
  return (
    nextAction === "conduct class and mark attendance" ||
    ["number system basics", "modern india basics", "motion basics", "indian geography basics", "grammar foundation"].includes(topic)
  );
}

function statusHealth(value: number) {
  if (value >= 75) return "Healthy";
  if (value >= 45) return "Attention Needed";
  return "Delayed";
}

export default function TeacherDashboardClient({ view, courseKey, batchId }: { view: TeacherView; courseKey?: string; batchId?: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [calendarAssignments, setCalendarAssignments] = useState<AssignmentRecord[]>([]);
  const [selectedProgramKey, setSelectedProgramKey] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentModalId, setStudentModalId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentWorkspaceTab, setAssignmentWorkspaceTab] = useState<"assignments" | "students" | "attendance" | "library">("assignments");
  const [studentSearch, setStudentSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState("ALL");
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [examMessage, setExamMessage] = useState<string | null>(null);
  const [liveClassMessage, setLiveClassMessage] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayDate());
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY">>({});
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});
  const [attendanceRegisterOpen, setAttendanceRegisterOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [showExamCreator, setShowExamCreator] = useState(false);
  const [showAssignmentCreator, setShowAssignmentCreator] = useState(false);
  const [showLiveClassCreator, setShowLiveClassCreator] = useState(false);
  const [examDraft, setExamDraft] = useState<ExamDraft | null>(null);
  const [examWorkflow, setExamWorkflow] = useState<ExamWorkflowState | null>(null);
  const [examChatInput, setExamChatInput] = useState("");
  const [examChatMessages, setExamChatMessages] = useState<ExamChatMessage[]>([
    {
      id: "welcome",
      role: "guru",
      text: "Hello Teacher. Tell me the exam topic, batch, question count, difficulty, date, time and timer. You can also attach a PDF, Word file, photo or question bank.",
    },
  ]);
  const [examSourceName, setExamSourceName] = useState("");
  const [assignmentSourceName, setAssignmentSourceName] = useState("");
  const [assignmentWorkflow, setAssignmentWorkflow] = useState<AssignmentWorkflowState | null>(null);
  const [assignmentChatInput, setAssignmentChatInput] = useState("");
  const [assignmentChatMessages, setAssignmentChatMessages] = useState<AssignmentChatMessage[]>([
    {
      id: "welcome",
      role: "guru",
      text: "Hello Teacher. What assignment would you like to create today? Share the topic, notes, PDF, Word document, images, or reference links. I will prepare objectives, tasks, instructions and evaluation criteria.",
    },
  ]);
  const [librarySubject, setLibrarySubject] = useState<string | null>(null);
  const [libraryTopic, setLibraryTopic] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryPage, setLibraryPage] = useState(1);
  const [librarySort, setLibrarySort] = useState<"LATEST" | "OLDEST">("LATEST");
  const [showArchivedLibrary, setShowArchivedLibrary] = useState(false);
  const [showLibraryUpload, setShowLibraryUpload] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStartDate(new Date()));
  const [calendarWeek, setCalendarWeek] = useState(() => startOfWeek(new Date()));
  const [calendarTab, setCalendarTab] = useState<CalendarTab>("TODAY");
  const [calendarBatchFilter, setCalendarBatchFilter] = useState("ALL");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarStatusFilter, setCalendarStatusFilter] = useState("ALL");
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [calendarMonitor, setCalendarMonitor] = useState<CalendarMonitorItem[]>([]);
  const [facultyProgress, setFacultyProgress] = useState<TeacherPerformanceItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgressItem[]>([]);
  const [calendarAnalyticsLoading, setCalendarAnalyticsLoading] = useState(false);
  const [classWorkspace, setClassWorkspace] = useState<ClassWorkspace>(emptyWorkspace);
  const [completionReport, setCompletionReport] = useState<CompletionReportForm>({
    topicCovered: "",
    subtopicCovered: "",
    completionPercentage: "100",
    homeworkGiven: "",
    participation: "Good",
    studentsNeedingAttention: "",
    supportRequired: "",
    teacherRemarks: "",
    completionStatus: "COMPLETED",
  });
  const [libraryForm, setLibraryForm] = useState(initialLibraryForm);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({ title: "", subject: "", topic: "", difficulty: "MEDIUM", instructions: "", pastedContent: "", dueDate: "", attachmentName: "", link: "" });
  const [liveClassForm, setLiveClassForm] = useState<LiveClassForm>({ subject: "", topic: "", date: todayDate(), time: "", duration: "60", description: "", meetingLink: "" });
  const [examForm, setExamForm] = useState<ExamForm>({
    title: "",
    subject: "",
    examType: "Weekly Test",
    topic: "",
    questionCount: "20",
    duration: "30",
    totalMarks: "100",
    difficulty: "MEDIUM",
    instructions: "",
    pastedQuestions: "",
    publishDate: "",
    publishTime: "",
  });

  const dashboardTemplate = typeof user?.roleMetadata?.dashboardTemplate === "string" ? user.roleMetadata.dashboardTemplate.toUpperCase() : "";
  const isAcademicHeadRoute = pathname?.startsWith("/dashboard/academic-head") ?? false;
  const isDirectorTeachingRoute = pathname?.startsWith("/dashboard/director/teaching") ?? false;
  const isAcademicHead = isAcademicHeadRoute || user?.role?.toUpperCase() === "ACADEMIC_HEAD" || dashboardTemplate === "ACADEMIC_HEAD";
  const dashboardBasePath = isDirectorTeachingRoute ? "/dashboard/director/teaching" : isAcademicHead ? "/dashboard/academic-head" : "/dashboard/teacher";
  const activeClasses = useMemo(() => classes.filter((batch) => isTeacherClassAllocation(batch, isAcademicHead)), [classes, isAcademicHead]);
  const teacherRosterBatches = useMemo<TeacherRosterBatch[]>(() => activeClasses.map((batch) => {
    const students = (batch.students ?? []).flatMap((entry) => {
      const student = entry.student;
      if (!student?.id) return [];
      return [{
        id: student.id,
        name: student.name || student.email || "Student",
        email: student.email,
        mobile: student.mobile,
      }];
    });
    return {
      id: batch.id,
      name: batch.name,
      program: programName(batch),
      subjects: subjectsForBatch(batch).length ? subjectsForBatch(batch) : [batch.subject || "General"],
      students,
    };
  }), [activeClasses]);
  const teacherExamBatches = useMemo<TeacherExamBatch[]>(() => activeClasses.map((batch) => ({
    id: batch.id,
    name: batch.name,
    program: programName(batch),
    studentCount: batch._count?.students ?? batch.students?.length ?? 0,
    subjects: subjectsForBatch(batch),
  })), [activeClasses]);
  const activeCourseKey = courseKey ? decodeURIComponent(courseKey) : null;
  const activeBatchId = batchId ? decodeURIComponent(batchId) : null;
  const programGroups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; classes: AssignedClass[] }>();
    for (const batch of activeClasses) {
      const key = programKey(batch);
      const current = map.get(key) ?? { key, name: programName(batch), classes: [] };
      current.classes.push(batch);
      map.set(key, current);
    }
    return Array.from(map.values());
  }, [activeClasses]);
  const selectedProgram =
    programGroups.find((program) => program.key === activeCourseKey) ??
    programGroups.find((program) => program.key === selectedProgramKey) ??
    programGroups[0] ??
    null;
  const programClasses = selectedProgram?.classes ?? [];
  const selectedClass = selectedProgram
    ? programClasses.find((item) => item.id === activeBatchId) ?? programClasses.find((item) => item.id === selectedClassId) ?? programClasses[0] ?? null
    : activeClasses.find((item) => item.id === selectedClassId) ?? (!activeCourseKey ? activeClasses[0] : null) ?? null;
  const selectedStudents = useMemo(() => selectedClass?.students ?? [], [selectedClass?.students]);
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return selectedStudents.filter((entry, index) => {
      const student = entry.student;
      const id = studentId(entry, index);
      const metrics = studentProgressMetrics(student, classWorkspace, selectedStudents.length);
      const haystack = [student?.name, student?.email, student?.mobile, student?.rollNumber, id].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesProgress =
        progressFilter === "ALL" ||
        (progressFilter === "STRONG" && metrics.overall >= 80) ||
        (progressFilter === "NEEDS_ATTENTION" && metrics.overall < 60) ||
        (progressFilter === "STEADY" && metrics.overall >= 60 && metrics.overall < 80);
      return matchesQuery && matchesProgress;
    });
  }, [classWorkspace, progressFilter, selectedStudents, studentSearch]);
  const batchHealth = calculateBatchHealth(selectedStudents, classWorkspace);
  const modalStudentEntry = selectedStudents.find((entry, index) => studentId(entry, index) === studentModalId) ?? null;
  const modalStudent = modalStudentEntry?.student ?? null;
  const modalStudentAttendance = classWorkspace.attendance
    .flatMap((record) =>
      (record.records ?? [])
        .filter((entry) => entry.studentId === modalStudent?.id || entry.studentName === modalStudent?.name)
        .map((entry) => ({ ...entry, date: record.date, subject: record.subject })),
    )
    .slice(0, 20);
  const modalPresent = modalStudentAttendance.filter((entry) => entry.status === "PRESENT").length;
  const modalAttendancePercent = modalStudentAttendance.length ? Math.round((modalPresent / modalStudentAttendance.length) * 100) : 0;
  const selectedCalendarItems = selectedClass?.id
    ? calendar.filter((item) => !item.batchId || item.batchId === selectedClass.id)
    : calendar;
  const selectedCalendarItem =
    selectedCalendarItems.find((item) => item.id === selectedCalendarId) ??
    selectedCalendarItems.find((item) => item.batchId === selectedClass?.id) ??
    selectedCalendarItems[0] ??
    null;
  const calendarScopeItems = useMemo(() => {
    const query = calendarSearch.trim().toLowerCase();
    return calendar.filter((item) => {
      const matchesBatch = calendarBatchFilter === "ALL" || item.batchId === calendarBatchFilter;
      const matchesStatus = calendarStatusFilter === "ALL" || calendarStatus(item) === calendarStatusFilter;
      const matchesSearch = !query || [item.subject, item.topic, item.batchName, item.teacherName, item.classType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
      return matchesBatch && matchesStatus && matchesSearch;
    });
  }, [calendar, calendarBatchFilter, calendarSearch, calendarStatusFilter]);
  const todayCalendarItems = useMemo(
    () => calendarScopeItems.filter((item) => dateKey(item.plannedDate) === todayDate()).sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || ""))),
    [calendarScopeItems],
  );
  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, index) => addDays(calendarWeek, index)), [calendarWeek]);
  const weekCalendarItems = useMemo(() => {
    const keys = new Set(weekDays.map((day) => dateKey(day)));
    return calendarScopeItems.filter((item) => keys.has(dateKey(item.plannedDate)));
  }, [calendarScopeItems, weekDays]);
  const weekTimeSlots = useMemo(
    () => Array.from(new Set(weekCalendarItems.map((item) => `${item.startTime || "Time pending"}|${item.endTime || ""}`))).sort(),
    [weekCalendarItems],
  );
  const completedCalendarItems = useMemo(
    () => calendarScopeItems.filter((item) => ["COMPLETED", "PARTIALLY_COMPLETED", "PARTIAL", "RESCHEDULED", "CANCELLED"].includes(calendarStatus(item))),
    [calendarScopeItems],
  );
  const calendarSummary = useMemo(() => {
    const completed = todayCalendarItems.filter((item) => calendarStatus(item) === "COMPLETED").length;
    const cancelled = todayCalendarItems.filter((item) => calendarStatus(item) === "CANCELLED").length;
    const pending = Math.max(0, todayCalendarItems.length - completed - cancelled);
    const attendancePending = todayCalendarItems.filter((item) => {
      const recordDate = dateKey(item.plannedDate);
      return !classWorkspace.attendance.some((record) => record.batchId === item.batchId && dateKey(record.date) === recordDate);
    }).length;
    return {
      today: todayCalendarItems.length,
      completed,
      pending,
      cancelled,
      attendancePending,
      assignmentPending: classWorkspace.assignments.filter((item) => ["DRAFT", "PENDING_REVIEW"].includes(String(item.status || "").toUpperCase())).length,
      examPending: classWorkspace.exams.filter((item) => ["DRAFT", "PENDING_REVIEW"].includes(String(item.status || "").toUpperCase())).length,
      reportingPending: todayCalendarItems.filter((item) => calendarStatus(item) !== "COMPLETED" && new Date(item.plannedDate || "").getTime() < Date.now()).length,
    };
  }, [classWorkspace.assignments, classWorkspace.attendance, classWorkspace.exams, todayCalendarItems]);
  const batchCalendarProgress = useMemo(() => {
    const grouped = new Map<string, { batchId: string; batchName: string; planned: number; completed: number; cancelled: number }>();
    for (const item of calendarMonitor) {
      if (!item.batchId) continue;
      const current = grouped.get(item.batchId) ?? { batchId: item.batchId, batchName: item.batchName || "Batch", planned: 0, completed: 0, cancelled: 0 };
      current.planned += item.plannedClasses;
      current.completed += item.completedClasses;
      grouped.set(item.batchId, current);
    }
    return Array.from(grouped.values());
  }, [calendarMonitor]);
  const liveClassesByBatch = useMemo(() => {
    const map = new Map<string, LiveClassRecord[]>();
    for (const item of liveClasses) {
      if (!item.batchId) continue;
      const items = map.get(item.batchId) ?? [];
      items.push(item);
      map.set(item.batchId, items);
    }
    for (const items of map.values()) {
      items.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [liveClasses]);
  const selectedBatchLiveClasses = selectedClass?.id ? liveClassesByBatch.get(selectedClass.id) ?? [] : [];
  const selectedDayTasks = useMemo<CalendarDayTask[]>(() => {
    const tasks: CalendarDayTask[] = [];
    for (const item of calendarScopeItems) {
      const classType = (item.classType || "").toUpperCase();
      tasks.push({
        id: `calendar-${item.id}`,
        kind: classType.includes("MEETING") ? "MEETING" : classType.includes("EXAM") || classType.includes("TEST") || classType.includes("MOCK") ? "EXAM" : "CLASS",
        title: item.topic || item.subject || item.classType || "Scheduled class",
        subtitle: [item.subject, item.batchName || selectedClass?.name, item.classType].filter(Boolean).join(" / "),
        date: item.plannedDate,
        time: item.startTime,
        endTime: item.endTime,
        status: item.completionStatus || item.status,
        sourceId: item.id,
      });
    }
    for (const item of liveClasses.filter((entry) => entry.batchId && activeClasses.some((batch) => batch.id === entry.batchId))) {
      const batch = activeClasses.find((entry) => entry.id === item.batchId);
      tasks.push({
        id: `live-${item.id}`,
        kind: "LIVE_CLASS",
        title: item.title || item.topic || "Live class",
        subtitle: [item.subject, item.topic, batch?.name, item.instructorName].filter(Boolean).join(" / "),
        date: item.scheduledAt,
        time: displayTime(item.scheduledAt),
        status: classStatus(item),
        sourceId: item.id,
      });
    }
    for (const item of calendarAssignments) {
      const batch = activeClasses.find((entry) => entry.id === item.batchId);
      tasks.push({
        id: `assignment-${item.id}`,
        kind: "ASSIGNMENT",
        title: item.title || "Assignment due",
        subtitle: [item.subject, item.topic, item.batchName || batch?.name, item.instructions ? "Homework" : null].filter(Boolean).join(" / "),
        date: item.dueDate,
        status: item.status || "PUBLISHED",
        sourceId: item.id,
      });
    }
    return tasks.sort((a, b) => {
      const dateDiff = dateKey(a.date).localeCompare(dateKey(b.date));
      if (dateDiff) return dateDiff;
      return String(a.time || "").localeCompare(String(b.time || ""));
    });
  }, [activeClasses, calendarAssignments, calendarScopeItems, liveClasses]);
  const selectedDayTaskMap = useMemo(() => {
    const map = new Map<string, CalendarDayTask[]>();
    for (const task of selectedDayTasks) {
      const key = dateKey(task.date);
      if (!key) continue;
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    }
    return map;
  }, [selectedDayTasks]);
  const activeDayTasks = selectedTaskDate ? selectedDayTaskMap.get(selectedTaskDate) ?? [] : [];
  useEffect(() => {
    if (!selectedClass?.id || !selectedDayTasks.length) return;
    const firstTaskDate = selectedDayTasks.find((task) => dateKey(task.date))?.date;
    if (!firstTaskDate) return;
    const parsed = new Date(firstTaskDate);
    if (!Number.isNaN(parsed.getTime())) setCalendarMonth(monthStartDate(parsed));
  }, [selectedClass?.id]);
  const activeLibraryRecords = useMemo(
    () => classWorkspace.materials.filter((item) => showArchivedLibrary || item.status !== "ARCHIVED"),
    [classWorkspace.materials, showArchivedLibrary],
  );
  const librarySubjects = useMemo<LibraryFolderItem[]>(() => {
    const map = new Map<string, LibraryFolderItem>();
    for (const subject of selectedClass ? subjectsForBatch(selectedClass) : []) {
      if (subject) map.set(subject, { name: subject, materials: [] });
    }
    for (const item of activeLibraryRecords) {
      const subject = item.subject || item.folder || "General";
      const current = map.get(subject) ?? { name: subject, materials: [] };
      current.materials.push(item);
      if (isFolderMaterial(item) && item.topic === "__SUBJECT__") current.folderRecord = item;
      map.set(subject, current);
    }
    if (libraryForm.subject && !map.has(libraryForm.subject)) map.set(libraryForm.subject, { name: libraryForm.subject, materials: [] });
    return Array.from(map.values());
  }, [activeLibraryRecords, libraryForm.subject, selectedClass]);
  const activeLibrarySubject = librarySubject && librarySubjects.some((subject) => subject.name === librarySubject) ? librarySubject : null;
  const libraryTopics = useMemo<LibraryFolderItem[]>(() => {
    const map = new Map<string, LibraryFolderItem>();
    for (const item of activeLibraryRecords.filter((entry) => (entry.subject || entry.folder || "General") === activeLibrarySubject)) {
      const topic = item.topic && item.topic !== "__SUBJECT__" ? item.topic : "General Lessons";
      const current = map.get(topic) ?? { name: topic, materials: [] };
      current.materials.push(item);
      if (isFolderMaterial(item) && item.topic !== "__SUBJECT__") current.folderRecord = item;
      map.set(topic, current);
    }
    if (activeLibrarySubject && !map.size) map.set("General Lessons", { name: "General Lessons", materials: [] });
    if (libraryForm.topic && libraryForm.subject === activeLibrarySubject && !map.has(libraryForm.topic)) map.set(libraryForm.topic, { name: libraryForm.topic, materials: [] });
    return Array.from(map.values());
  }, [activeLibraryRecords, activeLibrarySubject, libraryForm.subject, libraryForm.topic]);
  const activeLibraryTopic = libraryTopic && libraryTopics.some((topic) => topic.name === libraryTopic) ? libraryTopic : null;
  const visibleLibraryMaterials = activeLibraryRecords
    .filter(
      (item) => {
        const itemTopic = item.topic && item.topic !== "__SUBJECT__" ? item.topic : "General Lessons";
        return !isFolderMaterial(item) &&
        (item.subject || item.folder || "General") === activeLibrarySubject &&
        (!activeLibraryTopic || itemTopic === activeLibraryTopic) &&
        (!librarySearch.trim() ||
          [item.title, item.lessonName, item.type, item.fileName, item.url, item.description, item.subject, item.topic]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(librarySearch.trim().toLowerCase()));
      },
    )
    .sort((a, b) => {
      const first = new Date(a.createdAt || 0).getTime();
      const second = new Date(b.createdAt || 0).getTime();
      return librarySort === "LATEST" ? second - first : first - second;
    });
  const libraryPageSize = 12;
  const pagedLibraryMaterials = visibleLibraryMaterials.slice((libraryPage - 1) * libraryPageSize, libraryPage * libraryPageSize);
  const libraryTotalPages = Math.max(1, Math.ceil(visibleLibraryMaterials.length / libraryPageSize));
  const libraryStats = useMemo(() => {
    const materials = activeLibraryRecords.filter((item) => !isFolderMaterial(item) && (item.subject || item.folder || "General") === activeLibrarySubject);
    const videos = materials.filter((item) => (item.type || "").toUpperCase().includes("VIDEO")).length;
    const documents = materials.filter((item) => ["PDF", "PPT", "PPTX", "WORD", "DOC", "DOCX", "NOTE", "NOTES"].includes((item.type || "").toUpperCase())).length;
    return { videos, documents, topics: libraryTopics.length };
  }, [activeLibraryRecords, activeLibrarySubject, libraryTopics.length]);
  const visibleExams = classWorkspace.exams;
  const draftExamCards = visibleExams.filter((exam) => (exam.status || "").toUpperCase() === "DRAFT");
  const scheduledExamCards = visibleExams.filter((exam) => {
    const status = (exam.status || "").toUpperCase();
    return status !== "DRAFT" && status !== "COMPLETED" && !exam.attemptStats?.submitted;
  });
  const completedExamCards = visibleExams.filter((exam) => (exam.status || "").toUpperCase() === "COMPLETED" || Number(exam.attemptStats?.submitted ?? 0) > 0);
  const localDraftExam = examDraft
    ? {
        id: "local-nidus-guru-draft",
        title: examDraft.title || examForm.title || "NIDUS Guru Exam Draft",
        topic: examDraft.topic || examForm.topic || "Topic pending",
        questionCount: examDraft.questions?.length || Number(examForm.questionCount || 0),
        durationMinutes: examDraft.duration || Number(examForm.duration || 0),
        difficulty: examForm.difficulty,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
      }
    : null;
  const selectedAssignment = classWorkspace.assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null;
  const calendarDays = useMemo(() => {
    const first = monthStartDate(calendarMonth);
    const startOffset = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return Array.from({ length: startOffset + daysInMonth }, (_, index) => {
      if (index < startOffset) return null;
      return new Date(first.getFullYear(), first.getMonth(), index - startOffset + 1);
    });
  }, [calendarMonth]);
  const todayOperations = useMemo(() => {
    const today = todayDate();
    const calendarOps = calendar
      .filter((item) => (item.plannedDate || "").slice(0, 10) === today)
      .map((item) => {
        const batch = activeClasses.find((entry) => entry.id === item.batchId);
        return {
          id: `calendar-${item.id}`,
          batchId: batch?.id || item.batchId || "",
          date: displayDate(item.plannedDate),
          time: displayTime(item.startTime || item.plannedDate),
          batchName: item.batchName || batch?.name || "Batch pending",
          programName: batch ? programName(batch) : "Program",
          subject: item.subject || batch?.subject || "Subject",
          topic: item.topic || "Topic pending",
          teacherName: batch ? teacherNameForBatch(batch, item.subject) : "Teacher pending",
          status: classStatus(item),
        };
      });
    return calendarOps.sort((a, b) => a.time.localeCompare(b.time));
  }, [activeClasses, calendar]);
  const teacherScheduleItems = useMemo<TeacherTodayScheduleItem[]>(() => {
    const items: TeacherTodayScheduleItem[] = [];
    for (const item of calendar) {
      if (!item.plannedDate || !item.batchId) continue;
      const batch = activeClasses.find((entry) => entry.id === item.batchId);
      if (!batch) continue;
      items.push({
        id: item.id,
        batchId: batch.id,
        date: item.plannedDate,
        startTime: item.startTime,
        endTime: item.endTime,
        batchName: item.batchName || batch.name,
        programName: programName(batch),
        subject: item.subject || batch.subject || "Assigned activity",
        topic: item.topic || "Topic to be updated",
        classType: item.classType || "LECTURE",
        status: item.status || "SCHEDULED",
        completionStatus: item.completionStatus || "PENDING",
        href: `${dashboardBasePath}/classes/${programKey(batch)}/${batch.id}`,
      });
    }
    return items.sort((first, second) => {
      const dateCompare = dateKey(first.date).localeCompare(dateKey(second.date));
      return dateCompare || String(first.startTime || "").localeCompare(String(second.startTime || ""));
    });
  }, [activeClasses, calendar, dashboardBasePath]);
  const teacherTodayItems = useMemo(
    () => teacherScheduleItems.filter((item) => dateKey(item.date) === todayDate()),
    [teacherScheduleItems],
  );
  const teacherUpcomingItems = useMemo(
    () => teacherScheduleItems.filter((item) => dateKey(item.date) > todayDate() && !["COMPLETED", "CANCELLED"].includes(String(item.status || item.completionStatus).toUpperCase())),
    [teacherScheduleItems],
  );
  const academicOperationsStats = useMemo(() => {
    const completed = todayOperations.filter((item) => item.status === "Completed").length;
    const live = todayOperations.filter((item) => item.status === "Live").length;
    const delayed = todayOperations.filter((item) => item.status === "Delayed").length;
    const pending = todayOperations.filter((item) => item.status === "Upcoming").length;
    const attendancePending = activeClasses.filter((batch) => !classWorkspace.attendance.some((record) => record.batchId === batch.id && record.date === todayDate())).length;
    const assignmentPending = classWorkspace.assignments.filter((item) => ["DRAFT", "PENDING_REVIEW"].includes((item.status || "").toUpperCase())).length;
    const examPending = classWorkspace.exams.filter((item) => ["DRAFT", "PENDING_REVIEW"].includes((item.status || "").toUpperCase())).length;
    return {
      activeBatches: activeClasses.length,
      scheduledToday: todayOperations.length,
      completed,
      live,
      pending,
      delayed,
      attendancePending,
      assignmentPending,
      examPending,
    };
  }, [activeClasses, classWorkspace.attendance, classWorkspace.assignments, classWorkspace.exams, todayOperations]);
  const todaysAttendanceClasses = todayOperations.filter((item) => item.batchId);
  const attendanceAbsentCount = selectedStudents.filter((entry, index) => (attendance[studentId(entry, index)] ?? "PRESENT") === "ABSENT").length;
  const attendanceLeaveCount = selectedStudents.filter((entry, index) => (attendance[studentId(entry, index)] ?? "PRESENT") === "LEAVE").length;
  const attendanceHalfDayCount = selectedStudents.filter((entry, index) => (attendance[studentId(entry, index)] ?? "PRESENT") === "HALF_DAY").length;
  const attendancePresentCount = Math.max(0, selectedStudents.length - attendanceAbsentCount - attendanceLeaveCount - attendanceHalfDayCount);
  const selectedAttendanceRate = selectedStudents.length ? Math.round((attendancePresentCount / selectedStudents.length) * 100) : 0;
  const lowAttendanceStudents = selectedStudents
    .map((entry, index) => {
      const metrics = studentProgressMetrics(entry.student, classWorkspace, selectedStudents.length);
      return { entry, index, attendance: metrics.attendance };
    })
    .filter((item) => item.attendance > 0 && item.attendance < 75)
    .slice(0, 6);
  const teacherOperations = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      subjects: Set<string>;
      batches: Set<string>;
      classesConducted: number;
      attendanceEntries: number;
      assignmentsPublished: number;
      examsPublished: number;
      materialsUploaded: number;
      lastActivity: string;
      roles: Set<string>;
    }>();
    for (const batch of activeClasses) {
      for (const allocation of batch.teachers ?? []) {
        const teacher = allocation.teacher;
        if (!teacher?.id && !teacher?.name) continue;
        const id = teacher.id || teacher.name || "teacher";
        const current = map.get(id) ?? {
          id,
          name: teacher.name || teacher.email || "Teacher",
          subjects: new Set<string>(),
          batches: new Set<string>(),
          classesConducted: 0,
          attendanceEntries: 0,
          assignmentsPublished: 0,
          examsPublished: 0,
          materialsUploaded: 0,
          lastActivity: "No activity yet",
          roles: new Set<string>(),
        };
        current.batches.add(batch.name);
        if (allocation.subject) current.subjects.add(allocation.subject);
        if (allocation.role) current.roles.add(allocation.role);
        map.set(id, current);
      }
    }
    const selectedTeacherIds = new Set((selectedClass?.teachers ?? []).map((entry) => entry.teacher?.id || entry.teacher?.name).filter(Boolean));
    for (const entry of map.values()) {
      if (selectedTeacherIds.has(entry.id) || selectedClass?.teachers?.some((teacher) => teacher.teacher?.name === entry.name)) {
        entry.classesConducted = classWorkspace.progress.filter((item) => (item.completionStatus || "").toUpperCase() === "COMPLETED").length;
        entry.attendanceEntries = classWorkspace.attendance.length;
        entry.assignmentsPublished = classWorkspace.assignments.length;
        entry.examsPublished = classWorkspace.exams.length;
        entry.materialsUploaded = classWorkspace.materials.filter((item) => !isFolderMaterial(item)).length;
        entry.lastActivity = [classWorkspace.materials[0]?.createdAt, classWorkspace.assignments[0]?.createdAt, classWorkspace.exams[0]?.createdAt].filter(Boolean).sort().at(-1) || "No activity yet";
      }
    }
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      subjects: Array.from(entry.subjects),
      batches: Array.from(entry.batches),
      roles: Array.from(entry.roles),
      category: teacherCategory(Array.from(entry.subjects), Array.from(entry.roles)),
      status: entry.classesConducted || entry.attendanceEntries || entry.assignmentsPublished || entry.examsPublished || entry.materialsUploaded ? "Active" : "Needs Attention",
    })).sort((a, b) => teacherCategoryOrder(a.category) - teacherCategoryOrder(b.category) || a.name.localeCompare(b.name));
  }, [activeClasses, classWorkspace, selectedClass]);

  async function loadTeachingPlan() {
    setLoadingPlan(true);
    setMessage(null);
    try {
      const [data, liveData] = await Promise.all([
        apiGet<TeachingPlan | AssignedClass[]>(["/api/academy/my-teaching-plan", "/api/academy/teacher-assignments"]),
        apiGet<{ liveClasses?: LiveClassRecord[] }>(["/api/live-classes"]).catch(() => null),
      ]);
      const assigned = normalizeAssignedClasses(data);
      const plannedCalendar = (Array.isArray(data) ? [] : data?.calendar ?? []).filter((item) => !isTemporaryActivationCalendarItem(item));
      const rememberedBatchId = typeof window !== "undefined" ? window.localStorage.getItem("teacherSelectedBatchId") : null;
      const rememberedBatch = rememberedBatchId ? assigned.find((batch) => batch.id === rememberedBatchId) : null;
      setClasses(assigned);
      setCalendar(plannedCalendar);
      setLiveClasses(liveData?.liveClasses ?? []);
      setSelectedProgramKey((current) => current ?? (rememberedBatch ? programKey(rememberedBatch) : assigned[0] ? programKey(assigned[0]) : null));
      setSelectedClassId((current) => current ?? rememberedBatch?.id ?? assigned[0]?.id ?? null);
      setSelectedCalendarId((current) => current ?? plannedCalendar[0]?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load teacher plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  async function loadCalendarMonth(targetMonth: Date) {
    const range = calendarMonthRange(targetMonth);
    const data = await apiGet<CalendarItem[]>([
      `/api/academy/academic-calendar?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
    ]);
    setCalendar((data ?? []).filter((item) => !isTemporaryActivationCalendarItem(item)));
  }

  async function loadTeacherCalendarActivities() {
    const assignmentData = await apiGet<{ assignments?: AssignmentRecord[] }>(["/api/academy/assignments"]);
    setCalendarAssignments((assignmentData?.assignments ?? []).filter((item) => Boolean(item.dueDate) && item.status !== "ARCHIVED"));
  }

  async function loadClassWorkspace(batchId: string) {
    setWorkspaceLoading(true);
    try {
      const [attendanceData, assignmentData, materialData, examData, progressData] = await Promise.all([
        apiGet<{ attendance?: AttendanceRecord[] }>([`/api/academy/attendance?batchId=${batchId}`]),
        apiGet<{ assignments?: AssignmentRecord[] }>([`/api/academy/assignments?batchId=${batchId}`]),
        apiGet<{ materials?: MaterialRecord[] }>([`/api/academy/study-materials?batchId=${batchId}&includeArchived=true`]),
        apiGet<{ exams?: ExamRecord[] }>([`/api/academy/exams?batchId=${batchId}`]),
        apiGet<{ progress?: SyllabusProgressRecord[] }>([`/api/academy/syllabus-progress?batchId=${batchId}`]),
      ]);
      setClassWorkspace({
        attendance: attendanceData?.attendance ?? [],
        assignments: assignmentData?.assignments ?? [],
        materials: materialData?.materials ?? [],
        exams: examData?.exams ?? [],
        progress: progressData?.progress ?? [],
      });
    } catch {
      setClassWorkspace(emptyWorkspace);
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function loadCalendarAnalytics() {
    setCalendarAnalyticsLoading(true);
    try {
      const [monitorData, facultyData, batchData] = await Promise.all([
        apiGet<{ items?: CalendarMonitorItem[] }>(["/api/academy/academic-calendar-monitor"]),
        isAcademicHead ? apiGet<{ teachers?: TeacherPerformanceItem[] }>(["/api/academy/teacher-performance-summary"]) : Promise.resolve(null),
        isAcademicHead ? apiGet<{ batches?: BatchProgressItem[] }>(["/api/academy/student-progress-summary"]) : Promise.resolve(null),
      ]);
      setCalendarMonitor(monitorData?.items ?? []);
      setFacultyProgress(facultyData?.teachers ?? []);
      setBatchProgress(batchData?.batches ?? []);
    } catch (error) {
      setCalendarMessage(error instanceof Error ? error.message : "Could not load academic progress summaries.");
    } finally {
      setCalendarAnalyticsLoading(false);
    }
  }

  async function loadLeaveRequests(batchId?: string) {
    try {
      const suffix = batchId ? `?batchId=${encodeURIComponent(batchId)}` : "";
      const data = await apiGet<{ leaves?: LeaveRequestRecord[] }>([`/api/academy/leave-requests${suffix}`]);
      setLeaveRequests(data?.leaves ?? []);
    } catch {
      setLeaveRequests([]);
    }
  }

  useEffect(() => {
    setUser(readStoredUser());
    void loadTeachingPlan();
  }, []);

  useEffect(() => {
    if (!selectedClass?.id) return;
    setAttendance(
      Object.fromEntries(selectedStudents.map((entry, index) => [studentId(entry, index), attendance[studentId(entry, index)] ?? "PRESENT"])),
    );
    void loadClassWorkspace(selectedClass.id);
    if (view === "attendance") void loadLeaveRequests(isAcademicHead ? undefined : selectedClass.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.id, view, isAcademicHead]);

  useEffect(() => {
    if (view === "academic-calendar") {
      void loadCalendarAnalytics();
      void loadTeacherCalendarActivities().catch(() => setCalendarAssignments([]));
      void loadCalendarMonth(calendarMonth).catch((error) => {
        setCalendarMessage(error instanceof Error ? error.message : "Could not load the academic calendar.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isAcademicHead, calendarMonth]);

  useEffect(() => {
    if (!selectedProgramKey && programGroups[0]) setSelectedProgramKey(programGroups[0].key);
  }, [programGroups, selectedProgramKey]);

  useEffect(() => {
    if (activeBatchId && selectedClassId !== activeBatchId) setSelectedClassId(activeBatchId);
  }, [activeBatchId, selectedClassId]);

  useEffect(() => {
    if (view !== "library" || !selectedClass) return;
    const subjects = subjectsForBatch(selectedClass);
    if (librarySubject && !subjects.includes(librarySubject)) {
      setLibrarySubject(null);
      setLibraryTopic(null);
    }
  }, [librarySubject, selectedClass, view]);

  useEffect(() => {
    if (!attendanceRegisterOpen || editingAttendanceId || !selectedClass?.id) return;
    const target = new Date(`${attendanceDate}T00:00:00`);
    const approvedStudentIds = new Set(
      leaveRequests
        .filter((leave) => leave.status === "APPROVED" && leave.batchId === selectedClass.id && target >= new Date(leave.fromDate) && target <= new Date(leave.toDate))
        .map((leave) => leave.studentId),
    );
    setAttendance(Object.fromEntries(selectedStudents.map((entry, index) => {
      const id = studentId(entry, index);
      return [id, approvedStudentIds.has(entry.student?.id || id) ? "LEAVE" : "PRESENT"];
    })));
  }, [attendanceDate, attendanceRegisterOpen, editingAttendanceId, leaveRequests, selectedClass?.id, selectedStudents]);

  useEffect(() => {
    setLibraryPage(1);
  }, [activeLibrarySubject, activeLibraryTopic, librarySearch, librarySort, showArchivedLibrary]);

  function chooseProgram(key: string) {
    const program = programGroups.find((item) => item.key === key);
    setSelectedProgramKey(key);
    const nextBatchId = program?.classes[0]?.id ?? null;
    setSelectedClassId(nextBatchId);
    if (nextBatchId && typeof window !== "undefined") window.localStorage.setItem("teacherSelectedBatchId", nextBatchId);
    setStudentModalId(null);
    setSelectedAssignmentId(null);
    setLibrarySubject(null);
    setLibraryTopic(null);
    setShowLibraryUpload(false);
  }

  function chooseBatch(batchId: string) {
    setSelectedClassId(batchId);
    if (typeof window !== "undefined") window.localStorage.setItem("teacherSelectedBatchId", batchId);
    setStudentModalId(null);
    setSelectedAssignmentId(null);
    setLibrarySubject(null);
    setLibraryTopic(null);
    setShowLibraryUpload(false);
  }

  function openLibraryUpload() {
    const subject = activeLibrarySubject || (selectedClass ? subjectsForBatch(selectedClass)[0] : "") || "General";
    setLibraryForm({
      ...initialLibraryForm,
      folder: subject,
      subject,
      topic: activeLibraryTopic && activeLibraryTopic !== "General Lessons" ? activeLibraryTopic : "",
    });
    setLibraryMessage(null);
    setShowLibraryUpload(true);
  }

  function setAllAttendance(status: "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY") {
    setAttendance(Object.fromEntries(selectedStudents.map((entry, index) => [studentId(entry, index), status])));
  }

  function resetAttendance() {
    setAllAttendance("PRESENT");
    setAttendanceComments({});
  }

  function toggleAbsence(id: string) {
    setAttendance((value) => ({
      ...value,
      [id]: value[id] === "ABSENT" ? "PRESENT" : "ABSENT",
    }));
  }

  function setStudentAttendance(id: string, status: "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY") {
    setAttendance((value) => ({ ...value, [id]: status }));
  }

  function openAttendanceRegister(batchId: string, date = todayDate()) {
    chooseBatch(batchId);
    setAttendanceDate(date);
    setEditingAttendanceId(null);
    setAttendanceRegisterOpen(true);
    setAttendanceComments({});
  }

  function openAttendanceHistoryRecord(record: AttendanceRecord) {
    if (record.batchId) chooseBatch(record.batchId);
    setAttendanceDate(record.date ? record.date.slice(0, 10) : todayDate());
    setEditingAttendanceId(record.id);
    setAttendanceRegisterOpen(true);
    setAttendance(
      Object.fromEntries((record.records ?? []).map((entry) => [entry.studentId || entry.studentName || "", (entry.status || "PRESENT") as "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY"])),
    );
    setAttendanceComments(Object.fromEntries((record.records ?? []).map((entry) => [entry.studentId || entry.studentName || "", entry.remarks || ""])));
  }

  function openExamCreator() {
    setShowExamCreator(true);
    setExamMessage(null);
    setExamDraft(null);
    setExamChatInput("");
    setExamChatMessages([
      {
        id: "welcome",
        role: "guru",
        text: `Hello ${user?.name || "Teacher"}. Select a batch, subject, exam basics, then upload or paste the question paper. I will review and structure it for approval.`,
      },
    ]);
  }

  function sendExamChatMessage() {
    const text = examChatInput.trim();
    if (!text) return;
    setExamChatMessages((messages) => [
      ...messages,
      { id: `teacher-${Date.now()}`, role: "teacher", text },
      {
        id: `guru-${Date.now()}`,
        role: "guru",
        text: examDraft
          ? "Noted. I will keep this correction with the draft. Review the paper and send it for approval when ready."
          : "Got it. Add the paper by upload, paste, or Guru generation, then run NIDUS GURU Review.",
      },
    ]);
    setExamForm((form) => ({
      ...form,
      instructions: [form.instructions, text].filter(Boolean).join("\n"),
      title: form.title || (form.topic ? `${form.topic} Test` : ""),
    }));
    setExamChatInput("");
  }

  function openAssignmentCreator() {
    const defaultSubject = selectedClass ? subjectsForBatch(selectedClass)[0] : "";
    setShowAssignmentCreator(true);
    setAssignmentMessage(null);
    setAssignmentChatInput("");
    setAssignmentForm((form) => ({
      ...form,
      title: form.title || "Homework",
      subject: form.subject || defaultSubject,
      dueDate: form.dueDate || todayDate(),
      difficulty: "MEDIUM",
    }));
    setAssignmentChatMessages([
      {
        id: "welcome",
        role: "guru",
        text: `Hello ${user?.name || "Teacher"}. Select the batch and subject, then upload a worksheet, paste homework questions, or ask me to create a simple assignment draft.`,
      },
    ]);
  }

  function openLiveClassCreator(batch?: AssignedClass) {
    const target = batch ?? selectedClass;
    if (target) chooseBatch(target.id);
    setLiveClassMessage(null);
    setLiveClassForm({
      subject: target?.subject || "",
      topic: "",
      date: todayDate(),
      time: "",
      duration: "60",
      description: "",
      meetingLink: "",
    });
    setShowLiveClassCreator(true);
  }

  async function publishLiveClass() {
    if (!selectedClass) {
      setLiveClassMessage("Select an assigned batch before publishing a live class.");
      return;
    }
    if (!liveClassForm.subject || !liveClassForm.topic || !liveClassForm.date || !liveClassForm.time || !liveClassForm.meetingLink) {
      setLiveClassMessage("Subject, topic, date, time and meeting link are required.");
      return;
    }
    setLiveClassMessage(null);
    try {
      const scheduledAt = new Date(`${liveClassForm.date}T${liveClassForm.time}`).toISOString();
      const response = await apiPost<{ liveClass?: LiveClassRecord }>(["/api/live-classes"], {
        title: `${liveClassForm.subject} - ${liveClassForm.topic}`,
        description: liveClassForm.description || `${programName(selectedClass)} / ${selectedClass.name}`,
        examType: programName(selectedClass),
        instructorName: user?.name || user?.email || "NIDUS Teacher",
        scheduledAt,
        duration: Number(liveClassForm.duration || 60),
        meetingLink: liveClassForm.meetingLink,
        batchId: selectedClass.id,
        programSlug: selectedClass.course?.slug || programKey(selectedClass),
        subject: liveClassForm.subject,
        topic: liveClassForm.topic,
        teacherId: user?.id,
        status: "SCHEDULED",
      });
      if (response?.liveClass) {
        setLiveClasses((items) => [...items.filter((item) => item.id !== response.liveClass?.id), response.liveClass as LiveClassRecord]);
      } else {
        await loadTeachingPlan();
      }
      setShowLiveClassCreator(false);
      setLiveClassMessage("Live class published to assigned students.");
    } catch (error) {
      setLiveClassMessage(error instanceof Error ? error.message : "Could not publish live class.");
    }
  }

  async function saveLiveRecordingToLibrary(item: LiveClassRecord) {
    const targetBatch = activeClasses.find((batch) => batch.id === item.batchId) ?? selectedClass;
    if (!targetBatch) {
      setLiveClassMessage("Select a batch before saving the recording to Library.");
      return;
    }
    const recordingUrl = item.recordingUrl || item.meetingLink;
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/study-materials"], {
        batchId: targetBatch.id,
        batchName: targetBatch.name,
        course: programName(targetBatch),
        folder: item.subject || targetBatch.subject || "Recorded Classes",
        subject: item.subject || targetBatch.subject || "General",
        topic: item.topic || "Live Class",
        title: item.title,
        description: item.description || "Live class recording saved to Library.",
        type: "VIDEO",
        url: recordingUrl,
        fileName: `${item.title}.recording`,
        reviewStatus: "PENDING_REVIEW",
      });
      setLiveClassMessage("Recording saved to Library as a video lesson.");
      await loadClassWorkspace(targetBatch.id);
    } catch (error) {
      setLiveClassMessage(error instanceof Error ? error.message : "Could not save recording to Library.");
    }
  }

  function sendAssignmentChatMessage() {
    const text = assignmentChatInput.trim();
    if (!text) return;
    setAssignmentChatMessages((messages) => [
      ...messages,
      { id: `teacher-${Date.now()}`, role: "teacher", text },
      {
        id: `guru-${Date.now()}`,
        role: "guru",
        text: "Noted. I have added that to the homework instructions. Generate the draft, review it, then send it through the approval flow.",
      },
    ]);
    setAssignmentForm((form) => ({
      ...form,
      instructions: [form.instructions, text].filter(Boolean).join("\n"),
      title: form.title || (form.topic ? `${form.topic} Assignment` : ""),
    }));
    setAssignmentChatInput("");
  }

  async function generateAssignmentDraft() {
    if (!selectedClass) {
      setAssignmentMessage("Select a batch before generating an assignment draft.");
      return;
    }
    const title = assignmentForm.title || (assignmentForm.topic ? `${assignmentForm.topic} Assignment` : "Class Assignment");
    const topic = assignmentForm.topic || "selected topic";
    const draftText = [
      `Draft ready: ${title}`,
      assignmentForm.subject ? `Subject: ${assignmentForm.subject}` : "",
      `Topic: ${topic}`,
      assignmentForm.dueDate ? `Due date: ${assignmentForm.dueDate}` : "Due date: not set",
      `Difficulty: ${assignmentForm.difficulty}`,
      "Suggested structure:",
      "Objectives:",
      "1. Understand the core concept from the supplied material.",
      "2. Apply the concept in short written responses.",
      "Tasks:",
      "1. Read the given material carefully.",
      "2. Answer the task questions clearly.",
      "3. Submit before the due date.",
      "Evaluation criteria:",
      "1. Accuracy of answer.",
      "2. Clarity and structure.",
      "3. Timely submission.",
      assignmentForm.pastedContent ? `Source content reviewed:\n${assignmentForm.pastedContent}` : "",
      assignmentForm.instructions ? `Teacher instructions: ${assignmentForm.instructions}` : "Teacher instructions can be added in the chat.",
    ].filter(Boolean).join("\n");
    setAssignmentMessage("NIDUS GURU is preparing assignment workflow draft...");
    setAssignmentWorkflow(null);
    try {
      const request = await apiPost<{ id: string }>(["/api/ai/workflow/requests"], {
        agentType: "ASSIGNMENT_CREATOR",
        requestType: "ASSIGNMENT_DRAFT_GENERATION",
        targetType: "BATCH",
        targetId: selectedClass.id,
        actingMode: isAcademicHead ? "HOD_MODE" : "TEACHER_MODE",
        status: "REQUESTED",
        inputJson: {
          batchId: selectedClass.id,
          batchName: selectedClass.name,
          program: programName(selectedClass),
          subject: assignmentForm.subject || selectedClass.subject,
          topic,
          title,
          difficulty: assignmentForm.difficulty,
          dueDate: assignmentForm.dueDate,
          pastedContent: assignmentForm.pastedContent,
          sourceMaterial: assignmentSourceName,
          teacherInstructions: assignmentChatMessages.map((message) => message.text),
        },
        metadataJson: { surface: "teacher_assignment_builder", humanApprovalRequired: true },
      });
      const context = request?.id
        ? await apiPost<{ id: string }>([`/api/ai/workflow/requests/${request.id}/context`], {
            scope: "ASSIGNMENT_CREATOR_CONTEXT",
            batchId: selectedClass.id,
            teacherId: user?.id,
            contextJson: {
              batch: { id: selectedClass.id, name: selectedClass.name, program: programName(selectedClass), studentCount: selectedStudents.length },
              subject: assignmentForm.subject || selectedClass.subject || "General",
              topic,
              sourceMaterial: assignmentSourceName,
              pastedContent: assignmentForm.pastedContent,
              rule: "Teacher approval is mandatory before publish.",
            },
            summaryText: `${programName(selectedClass)} / ${selectedClass.name} / ${assignmentForm.subject || selectedClass.subject || "General"} / ${topic}`,
            sources: [
              { sourceType: "BATCH", sourceId: selectedClass.id, sourceLabel: selectedClass.name, sourceJson: { batchId: selectedClass.id } },
              assignmentForm.pastedContent ? { sourceType: "TEACHER_SOURCE", sourceLabel: "Pasted assignment content", sourceJson: { content: assignmentForm.pastedContent } } : null,
              assignmentSourceName ? { sourceType: "TEACHER_SOURCE", sourceLabel: "Attached source names", sourceJson: { attachments: assignmentSourceName } } : null,
            ].filter(Boolean),
          })
        : null;
      const draft = request?.id
        ? await apiPost<{ id: string }>([`/api/ai/workflow/requests/${request.id}/drafts`], {
            draftType: "ASSIGNMENT_DRAFT",
            targetType: "BATCH",
            targetId: selectedClass.id,
            title,
            status: "DRAFT",
            draftJson: {
              title,
              program: programName(selectedClass),
              batch: selectedClass.name,
              subject: assignmentForm.subject || selectedClass.subject || "General",
              topic,
              difficulty: assignmentForm.difficulty,
              dueDate: assignmentForm.dueDate,
              instructions: draftText,
              pastedContent: assignmentForm.pastedContent,
              sourceMaterial: assignmentSourceName,
              teacherReviewRequired: true,
            },
            validationJson: {
              contentLines: assignmentForm.pastedContent.split(/\n+/).filter(Boolean).length,
              hasRubric: true,
              humanApprovalRequired: true,
            },
            sourceReferencesJson: { contextId: context?.id },
          })
        : null;
      if (request?.id && draft?.id) {
        setAssignmentWorkflow({ requestId: request.id, draftId: draft.id, contextId: context?.id });
      }
      setAssignmentForm((form) => ({ ...form, title, topic, instructions: form.instructions || draftText }));
      setAssignmentChatMessages((messages) => [...messages, { id: `guru-draft-${Date.now()}`, role: "guru", text: draftText }]);
      setAssignmentMessage("NIDUS GURU assignment draft ready. Review it, then send for approval.");
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not generate assignment workflow draft.");
    }
  }

  async function saveAttendance() {
    if (!selectedClass) return;
    setAttendanceMessage(null);
    try {
      const payload = {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        subject: selectedClass.subject,
        date: attendanceDate,
        records: selectedStudents.map((entry, index) => {
          const id = studentId(entry, index);
          return {
            studentId: entry.student?.id ?? id,
            studentName: entry.student?.name ?? entry.student?.email ?? "Student",
            status: attendance[id] ?? "PRESENT",
            remarks: attendanceComments[id] || undefined,
          };
        }),
      };
      if (editingAttendanceId) {
        await apiPatch<{ ok?: boolean }>([`/api/academy/attendance/${editingAttendanceId}`], payload);
      } else {
        await apiPost<{ ok?: boolean }>(["/api/academy/attendance"], payload);
      }
      setAttendanceMessage(editingAttendanceId ? "Attendance record updated." : "Attendance saved.");
      setAttendanceRegisterOpen(false);
      setEditingAttendanceId(null);
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "Could not save attendance.");
    }
  }

  async function reviewLeaveRequest(leaveId: string, status: "APPROVED" | "REJECTED") {
    setAttendanceMessage(null);
    try {
      await apiPatch<{ ok?: boolean }>([`/api/academy/leave-requests/${leaveId}`], { status });
      setAttendanceMessage(status === "APPROVED" ? "Leave request approved." : "Leave request rejected.");
      await loadLeaveRequests();
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "Could not update leave request.");
    }
  }

  function openCalendarClass(item: CalendarItem) {
    setSelectedCalendarId(item.id);
    if (item.batchId) {
      setSelectedClassId(item.batchId);
      setCalendarBatchFilter((current) => current === "ALL" ? current : item.batchId || current);
    }
    setCompletionReport({
      topicCovered: item.topic || "",
      subtopicCovered: "",
      completionPercentage: calendarStatus(item) === "COMPLETED" ? "100" : "",
      homeworkGiven: "",
      participation: "Good",
      studentsNeedingAttention: "",
      supportRequired: item.nextAction || "",
      teacherRemarks: item.teacherLog || "",
      completionStatus: item.completionStatus || "COMPLETED",
    });
    setShowClassDetails(true);
  }

  async function submitCompletionReport() {
    if (!selectedCalendarItem) return;
    setCalendarMessage(null);
    const teacherLog = [
      `Topic covered: ${completionReport.topicCovered || selectedCalendarItem.topic || "Not recorded"}`,
      `Subtopic covered: ${completionReport.subtopicCovered || "Not recorded"}`,
      `Completion: ${completionReport.completionPercentage || "0"}%`,
      `Homework: ${completionReport.homeworkGiven || "None"}`,
      `Participation: ${completionReport.participation || "Not recorded"}`,
      `Students needing attention: ${completionReport.studentsNeedingAttention || "None"}`,
      `Teacher remarks: ${completionReport.teacherRemarks || "None"}`,
    ].join("\n");
    try {
      await apiPatch<CalendarItem>([`/api/academy/academic-calendar/${selectedCalendarItem.id}`], {
        topic: completionReport.topicCovered || selectedCalendarItem.topic,
        completionStatus: completionReport.completionStatus,
        teacherLog,
        nextAction: completionReport.supportRequired || null,
        status: completionReport.completionStatus === "COMPLETED" ? "COMPLETED" : completionReport.completionStatus,
      });
      setCalendarMessage("Class completion report saved.");
      setShowCompletionReport(false);
      setShowClassDetails(false);
      await Promise.all([loadTeachingPlan(), loadCalendarAnalytics()]);
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setCalendarMessage(error instanceof Error ? error.message : "Could not save the completion report.");
    }
  }

  async function publishAssignment(status: "DRAFT" | "PUBLISHED" = "PUBLISHED") {
    if (!selectedClass) return;
    if (!assignmentForm.title.trim()) {
      setAssignmentMessage("Assignment title is required.");
      return;
    }
    if (!assignmentForm.subject) {
      setAssignmentMessage("Select a subject before saving the assignment.");
      return;
    }
    if (!assignmentForm.instructions.trim() && !assignmentForm.pastedContent.trim() && !assignmentSourceName && !assignmentForm.link.trim()) {
      setAssignmentMessage("Add instructions, questions or an attachment before saving.");
      return;
    }
    setAssignmentMessage(null);
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/assignments"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        subject: assignmentForm.subject || selectedClass.subject,
        course: programName(selectedClass),
        title: assignmentForm.title,
        topic: assignmentForm.topic,
        instructions: [
          assignmentForm.instructions,
          assignmentForm.difficulty ? `Difficulty: ${assignmentForm.difficulty}` : "",
          assignmentForm.pastedContent ? `Pasted assignment content:\n${assignmentForm.pastedContent}` : "",
        ].filter(Boolean).join("\n"),
        dueDate: assignmentForm.dueDate || undefined,
        attachmentName: assignmentForm.attachmentName || assignmentSourceName || undefined,
        link: assignmentForm.link || undefined,
        status,
      });
      setAssignmentForm({
        title: "",
        subject: "",
        topic: "",
        difficulty: "MEDIUM",
        instructions: "",
        pastedContent: "",
        dueDate: "",
        attachmentName: "",
        link: "",
      });
      setAssignmentSourceName("");
      setAssignmentWorkflow(null);
      setAssignmentChatInput("");
      setShowAssignmentCreator(false);
      setAssignmentMessage(status === "DRAFT" ? "Assignment saved as draft." : "Assignment published to students.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not save assignment.");
    }
  }

  async function reviewAssignmentSubmission(submissionId: string, reviewStatus: "REVIEWED" | "RETURNED") {
    try {
      await apiPatch<{ ok?: boolean }>([`/api/academy/assignment-submissions/${submissionId}`], {
        reviewStatus,
        feedback: reviewStatus === "RETURNED" ? "Needs correction. Please revise and resubmit." : "Approved.",
      });
      setAssignmentMessage(reviewStatus === "RETURNED" ? "Submission returned for correction." : "Submission approved.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not update submission review.");
    }
  }

  async function publishLibraryMaterial() {
    if (!selectedClass) return;
    if (!libraryForm.title.trim()) {
      setLibraryMessage("Lesson title is required.");
      return;
    }
    if (!libraryForm.url && !libraryForm.fileName) {
      setLibraryMessage("Upload a video, PDF, document, image or file before publishing.");
      return;
    }
    setLibraryMessage(null);
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/study-materials"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        course: programName(selectedClass),
        folder: libraryForm.folder || activeLibrarySubject,
        subject: libraryForm.subject || activeLibrarySubject,
        topic: libraryForm.topic.trim() || "General Lessons",
        title: libraryForm.title,
        description: libraryForm.description,
        type: libraryForm.type,
        url: libraryForm.url || undefined,
        fileName: libraryForm.fileName || undefined,
        cloudinaryPublicId: libraryForm.cloudinaryPublicId || undefined,
        thumbnailUrl: libraryForm.thumbnailUrl || undefined,
        thumbnailPublicId: libraryForm.thumbnailPublicId || undefined,
        fileSize: libraryForm.fileSize ? Number(libraryForm.fileSize) : undefined,
        durationSeconds: libraryForm.durationSeconds ? Number(libraryForm.durationSeconds) : undefined,
        lessonName: libraryForm.lessonName || libraryForm.title || undefined,
      });
      setLibraryForm(initialLibraryForm);
      setShowLibraryUpload(false);
      setLibraryMessage("Lesson published for students.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not publish material.");
    }
  }

  async function archiveLibraryMaterial(materialId: string) {
    if (!selectedClass) return;
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/study-materials/${materialId}/archive`], {});
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not archive material.");
    }
  }

  async function restoreLibraryMaterial(materialId: string) {
    if (!selectedClass) return;
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/study-materials/${materialId}/restore`], {});
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage("Restored to Library.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not restore material.");
    }
  }

  async function deleteLibraryMaterial(materialId: string) {
    if (!selectedClass) return;
    if (typeof window !== "undefined" && !window.confirm("Delete permanently and remove Cloudinary file?")) return;
    try {
      await apiDelete<{ ok?: boolean }>([`/api/academy/study-materials/${materialId}`]);
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage("Deleted permanently.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not delete material.");
    }
  }

  async function renameLibraryMaterial(material: MaterialRecord) {
    if (!selectedClass) return;
    const currentName = material.title || material.lessonName || material.fileName || "Lesson";
    const nextName = typeof window !== "undefined" ? window.prompt("Rename lesson", currentName) : null;
    if (!nextName?.trim() || nextName.trim() === currentName) return;
    try {
      await apiPatch<{ ok?: boolean }>([`/api/academy/study-materials/${material.id}`], {
        batchId: material.batchId,
        title: nextName.trim(),
        lessonName: nextName.trim(),
      });
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage("Lesson renamed.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not rename lesson.");
    }
  }

  async function createLibraryFolder(kind: "SUBJECT" | "TOPIC", name: string) {
    if (!selectedClass || !name.trim()) return;
    const subject = kind === "SUBJECT" ? name.trim() : activeLibrarySubject || "General";
    const topic = kind === "SUBJECT" ? "__SUBJECT__" : name.trim();
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/study-materials"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        course: programName(selectedClass),
        folder: subject,
        subject,
        topic,
        title: name.trim(),
        lessonName: name.trim(),
        description: `${kind === "SUBJECT" ? "Subject" : "Topic"} folder`,
        type: "FOLDER",
        status: "PUBLISHED",
        reviewStatus: "APPROVED",
      });
      if (kind === "SUBJECT") {
        setLibrarySubject(name.trim());
        setLibraryTopic(null);
      } else {
        setLibraryTopic(name.trim());
      }
      setLibraryForm((form) => ({ ...form, subject: kind === "SUBJECT" ? "" : form.subject, topic: kind === "TOPIC" ? "" : form.topic }));
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not create folder.");
    }
  }

  async function renameLibraryFolder(kind: "SUBJECT" | "TOPIC", currentName: string) {
    if (!selectedClass) return;
    const nextName = typeof window !== "undefined" ? window.prompt(`Rename ${kind.toLowerCase()} folder`, currentName) : null;
    if (!nextName?.trim() || nextName.trim() === currentName) return;
    const updates = activeLibraryRecords.filter((item) => {
      const subject = item.subject || item.folder || "General";
      const topic = item.topic && item.topic !== "__SUBJECT__" ? item.topic : "General";
      return kind === "SUBJECT" ? subject === currentName : subject === activeLibrarySubject && topic === currentName;
    });
    try {
      await Promise.all(updates.map((item) => apiPatch<{ ok?: boolean }>([`/api/academy/study-materials/${item.id}`], {
        batchId: item.batchId,
        folder: kind === "SUBJECT" ? nextName.trim() : item.folder,
        subject: kind === "SUBJECT" ? nextName.trim() : item.subject,
        topic: kind === "TOPIC" ? nextName.trim() : item.topic,
        title: isFolderMaterial(item) ? nextName.trim() : item.title,
        lessonName: isFolderMaterial(item) ? nextName.trim() : item.lessonName,
      })));
      if (kind === "SUBJECT") setLibrarySubject(nextName.trim());
      if (kind === "TOPIC") setLibraryTopic(nextName.trim());
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage("Folder renamed.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not rename folder.");
    }
  }

  function libraryFolderRecords(kind: "SUBJECT" | "TOPIC", folderName: string) {
    return classWorkspace.materials.filter((item) => {
      const subject = item.subject || item.folder || "General";
      const topic = item.topic && item.topic !== "__SUBJECT__" ? item.topic : "General";
      return kind === "SUBJECT" ? subject === folderName : subject === activeLibrarySubject && topic === folderName;
    });
  }

  async function archiveLibraryFolder(kind: "SUBJECT" | "TOPIC", folderName: string) {
    if (!selectedClass) return;
    const records = libraryFolderRecords(kind, folderName).filter((item) => item.status !== "ARCHIVED");
    if (!records.length) return;
    try {
      await Promise.all(records.map((item) => apiPost<{ ok?: boolean }>([`/api/academy/study-materials/${item.id}/archive`], {})));
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage(`${folderName} archived.`);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not archive folder.");
    }
  }

  async function restoreLibraryFolder(kind: "SUBJECT" | "TOPIC", folderName: string) {
    if (!selectedClass) return;
    const records = libraryFolderRecords(kind, folderName).filter((item) => item.status === "ARCHIVED");
    if (!records.length) return;
    try {
      await Promise.all(records.map((item) => apiPost<{ ok?: boolean }>([`/api/academy/study-materials/${item.id}/restore`], {})));
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage(`${folderName} restored.`);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not restore folder.");
    }
  }

  async function deleteLibraryFolder(kind: "SUBJECT" | "TOPIC", folderName: string) {
    if (!selectedClass) return;
    const records = libraryFolderRecords(kind, folderName);
    if (!records.length) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete ${folderName} and every lesson inside it permanently?`)) return;
    try {
      await Promise.all(records.map((item) => apiDelete<{ ok?: boolean }>([`/api/academy/study-materials/${item.id}`])));
      if (kind === "SUBJECT" && activeLibrarySubject === folderName) {
        setLibrarySubject(null);
        setLibraryTopic(null);
      }
      if (kind === "TOPIC" && activeLibraryTopic === folderName) setLibraryTopic(null);
      await loadClassWorkspace(selectedClass.id);
      setLibraryMessage(`${folderName} deleted permanently.`);
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not delete folder.");
    }
  }

  async function uploadLibraryFile(file: File) {
    setLibraryMessage("Uploading...");
    try {
      const uploaded = await uploadMediaFile({ file });
      const normalizedType = uploaded.fileType.startsWith("video/")
        ? "VIDEO"
        : uploaded.fileType.includes("pdf")
          ? "PDF"
          : uploaded.fileType.includes("presentation") || uploaded.originalName.toLowerCase().endsWith(".ppt") || uploaded.originalName.toLowerCase().endsWith(".pptx")
            ? "PPT"
            : uploaded.fileType.includes("word") || uploaded.originalName.toLowerCase().endsWith(".doc") || uploaded.originalName.toLowerCase().endsWith(".docx")
              ? "WORD"
              : uploaded.fileType.startsWith("image/")
                ? "IMAGE"
                : "FILE";
      setLibraryForm((form) => ({
        ...form,
        title: form.title || uploaded.originalName.replace(/\.[^.]+$/, ""),
        lessonName: form.lessonName || uploaded.originalName.replace(/\.[^.]+$/, ""),
        type: normalizedType,
        url: uploaded.cloudinaryUrl,
        fileName: uploaded.originalName,
        cloudinaryPublicId: uploaded.publicId,
        fileSize: String(uploaded.fileSize),
      }));
      setLibraryMessage("Upload complete.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not upload file.");
    }
  }

  async function uploadLibraryThumbnail(file: File) {
    setLibraryMessage("Uploading thumbnail...");
    try {
      const uploaded = await uploadMediaFile({ file });
      setLibraryForm((form) => ({
        ...form,
        thumbnailName: uploaded.originalName,
        thumbnailUrl: uploaded.cloudinaryUrl,
        thumbnailPublicId: uploaded.publicId,
      }));
      setLibraryMessage("Thumbnail uploaded.");
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Could not upload thumbnail.");
    }
  }

  async function createExamDraft() {
    if (!selectedClass) return;
    setExamMessage(null);
    setExamDraft(null);
    setExamWorkflow(null);
    try {
      const response = await apiPost<{
        requestId: string;
        contextId?: string;
        draftId: string;
        status: string;
        draft?: {
          title?: string;
          topic?: string;
          durationMinutes?: number;
          sections?: Array<{
            questions?: Array<{
              questionText?: string;
              optionA?: string;
              optionB?: string;
              optionC?: string;
              optionD?: string;
              correctAnswer?: string;
              marks?: number;
              difficultyLevel?: string;
            }>;
          }>;
        };
        validation?: { questionCount?: number };
      }>(["/api/ai/exam/create"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        program: programName(selectedClass),
        subject: examForm.subject || selectedClass.subject,
        examType: examForm.examType,
        title: examForm.title,
        topic: examForm.topic || examForm.subject,
        questionCount: Number(examForm.questionCount || 20),
        durationMinutes: Number(examForm.duration || 30),
        totalMarks: Number(examForm.totalMarks || 100),
        difficulty: examForm.difficulty,
        prompt: examChatMessages.concat(examChatInput ? [{ id: "current", role: "teacher" as const, text: examChatInput }] : []).map((message) => message.text).join("\n"),
        sourceMaterial: [
          examForm.pastedQuestions ? { type: "PASTED_QUESTIONS", title: "Teacher pasted questions", content: examForm.pastedQuestions } : null,
          examSourceName ? { type: "ATTACHMENT_NAMES", title: "Attached source material", content: examSourceName } : null,
        ].filter(Boolean),
        instructions: [
          examForm.instructions,
          examForm.examType ? `Exam type: ${examForm.examType}` : "",
          examForm.subject ? `Subject: ${examForm.subject}` : "",
          examForm.totalMarks ? `Total marks: ${examForm.totalMarks}` : "",
          examForm.pastedQuestions ? `Pasted source questions:\n${examForm.pastedQuestions}` : "",
          examSourceName ? `Source attached: ${examSourceName}` : "",
        ].filter(Boolean).join("\n"),
      });
      const workflowDraft = response?.draft;
      const questions = (workflowDraft?.sections ?? []).flatMap((section) =>
        (section.questions ?? []).map((question) => ({
          question: question.questionText || "Question pending",
          options: [question.optionA, question.optionB, question.optionC, question.optionD].filter((option): option is string => Boolean(option)),
          answer: question.correctAnswer,
          marks: question.marks,
          difficultyLevel: question.difficultyLevel,
        })),
      );
      const draft: ExamDraft = {
        draft: `NIDUS GURU prepared ${questions.length || response?.validation?.questionCount || 0} question(s) through the approved AI workflow.`,
        title: workflowDraft?.title,
        topic: workflowDraft?.topic,
        duration: workflowDraft?.durationMinutes,
        questions,
      };
      if (response?.requestId && response.draftId) {
        setExamWorkflow({ requestId: response.requestId, draftId: response.draftId, contextId: response.contextId });
      }
      setExamDraft(draft);
      setExamChatMessages((messages) => [
        ...messages,
        {
          id: `guru-draft-${Date.now()}`,
          role: "guru",
          text: draft?.draft || `Question bank prepared with ${draft?.questions?.length ?? examForm.questionCount} question(s). Please review it below.`,
        },
      ]);
      setExamMessage("NIDUS GURU draft ready. Review it, correct if needed, then publish.");
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not create AI exam draft.");
    }
  }

  async function publishExam() {
    if (!selectedClass) {
      setExamMessage("Select a program and batch inside NIDUS Guru before publishing.");
      return;
    }
    if (!examWorkflow?.requestId || !examWorkflow.draftId) {
      setExamMessage("Run NIDUS GURU Review first. Draft, review and approval are mandatory before publish.");
      return;
    }
    setExamMessage(null);
    try {
      await apiPost<{ draftId?: string }>(["/api/ai/exam/review"], {
        draftId: examWorkflow.draftId,
        status: "APPROVED",
        notes: "Teacher reviewed the generated exam preview in the NIDUS dashboard.",
        correctedDraft: examDraft ? {
          title: examForm.title || examDraft.title,
          program: programName(selectedClass),
          batch: selectedClass.name,
          examType: examForm.examType,
          subject: examForm.subject || selectedClass.subject || "General",
          topic: examForm.topic || examForm.subject || "General",
          durationMinutes: Number(examForm.duration || examDraft.duration || 30),
          totalMarks: Number(examForm.totalMarks || 100),
          negativeMarking: false,
          difficultyMix: { easy: 40, medium: 40, hard: 20 },
          includedTopics: [examForm.topic || examForm.subject || "General"],
          excludedTopics: [],
          instructions: examForm.instructions ? examForm.instructions.split("\n").filter(Boolean) : ["Teacher approved exam."],
          sections: [{
            title: "Section A",
            questionType: "MCQ",
            marks: Number(examForm.totalMarks || 100),
            questions: (examDraft.questions ?? []).map((question) => ({
              questionText: question.question,
              optionA: question.options?.[0] || "Option A",
              optionB: question.options?.[1] || "Option B",
              optionC: question.options?.[2] || "Option C",
              optionD: question.options?.[3] || "Option D",
              correctAnswer: question.answer || "A",
              explanation: "Teacher reviewed answer.",
              marks: Number(question.marks || 1),
              negativeMarks: 0,
              difficultyLevel: question.difficultyLevel || examForm.difficulty,
              topic: examForm.topic || examForm.subject || "General",
            })),
          }],
          teacherReviewRequired: true,
        } : undefined,
      });
      await apiPost<{ approvalId?: string }>(["/api/ai/exam/approve"], {
        draftId: examWorkflow.draftId,
        notes: "Teacher approved exam draft after review.",
      });
      await apiPost<{ status?: string }>(["/api/ai/exam/publish"], {
        requestId: examWorkflow.requestId,
        draftId: examWorkflow.draftId,
        batchId: selectedClass.id,
        durationMinutes: Number(examForm.duration || 30),
        date: examForm.publishDate || undefined,
        time: examForm.publishTime || undefined,
        instructions: [
          examForm.instructions,
          examForm.examType ? `Exam type: ${examForm.examType}` : "",
        ].filter(Boolean).join("\n"),
        rules: { teacherApprovalMandatory: true, sourceMaterialReviewed: Boolean(examForm.pastedQuestions || examSourceName) },
      });
      setExamForm({
        title: "",
        subject: "",
        examType: "Weekly Test",
        topic: "",
        questionCount: "20",
        duration: "30",
        totalMarks: "100",
        difficulty: "MEDIUM",
        instructions: "",
        pastedQuestions: "",
        publishDate: "",
        publishTime: "",
      });
      setExamSourceName("");
      setExamDraft(null);
      setExamWorkflow(null);
      setShowExamCreator(false);
      setExamChatInput("");
      setExamMessage("Exam published to students.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not publish exam.");
    }
  }

  async function editExamRecord(exam: ExamRecord) {
    const title = window.prompt("Exam title", exam.title || "");
    if (title === null) return;
    const topic = window.prompt("Topic", exam.topic || "");
    if (topic === null) return;
    const duration = window.prompt("Duration in minutes", String(exam.durationMinutes ?? 30));
    if (duration === null) return;
    setExamMessage(null);
    try {
      await apiPatch<{ ok?: boolean }>([`/api/academy/exams/${exam.id}`], {
        title: title.trim() || exam.title,
        topic: topic.trim() || exam.topic,
        durationMinutes: Number(duration) || exam.durationMinutes || 30,
        status: exam.status || "PUBLISHED",
      });
      setExamMessage("Exam updated.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not update exam.");
    }
  }

  async function cancelExamRecord(exam: ExamRecord) {
    if (!window.confirm(`Cancel ${exam.title || "this exam"}?`)) return;
    setExamMessage(null);
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/exams/${exam.id}/archive`], {});
      setExamMessage("Exam cancelled.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not cancel exam.");
    }
  }

  async function publishExamRecordChanges(exam: ExamRecord) {
    setExamMessage(null);
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/exams/${exam.id}/publish`], {});
      setExamMessage("Exam changes published.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not publish exam changes.");
    }
  }

  async function editAssignmentRecord(assignment: AssignmentRecord) {
    const title = window.prompt("Assignment title", assignment.title || "");
    if (title === null) return;
    const topic = window.prompt("Topic", assignment.topic || "");
    if (topic === null) return;
    const instructions = window.prompt("Instructions", assignment.instructions || "");
    if (instructions === null) return;
    setAssignmentMessage(null);
    try {
      await apiPatch<{ ok?: boolean }>([`/api/academy/assignments/${assignment.id}`], {
        title: title.trim() || assignment.title,
        topic: topic.trim() || assignment.topic,
        instructions: instructions.trim() || assignment.instructions,
        dueDate: assignment.dueDate || undefined,
        status: assignment.status || "PUBLISHED",
      });
      setAssignmentMessage("Assignment updated.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not update assignment.");
    }
  }

  async function cancelAssignmentRecord(assignment: AssignmentRecord) {
    if (!window.confirm(`Cancel ${assignment.title || "this assignment"}?`)) return;
    setAssignmentMessage(null);
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/assignments/${assignment.id}/archive`], {});
      setAssignmentMessage("Assignment cancelled.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not cancel assignment.");
    }
  }

  async function publishAssignmentRecordChanges(assignment: AssignmentRecord) {
    setAssignmentMessage(null);
    try {
      await apiPost<{ ok?: boolean }>([`/api/academy/assignments/${assignment.id}/publish`], {});
      setAssignmentMessage("Assignment changes published.");
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not publish assignment changes.");
    }
  }

  async function markRosterAttendance(input: { batchId: string; subject: string; studentId: string; status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"; remarks: string; date: string }) {
    const response = await apiPatch<{ ok?: boolean }>(["/api/academy/attendance/student"], input);
    if (!response?.ok) throw new Error("Attendance could not be saved.");
    if (selectedClass?.id === input.batchId) await loadClassWorkspace(input.batchId);
  }

  const viewTitles: Record<TeacherView, string> = {
    classes: "Today",
    students: "My Students",
    exams: "Exams",
    assignments: "Assignments",
    attendance: "Attendance",
    library: "Library",
    "academic-calendar": "Calendar",
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Teacher Dashboard</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--ink)]">{viewTitles[view]}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAcademicHead ? <Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black" href="/dashboard/academic-head/hod">HOD</Link> : null}
          <button type="button" onClick={() => void loadTeachingPlan()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {message ? <Notice text={message} tone="error" /> : null}
      {loadingPlan ? <Notice text="Loading assigned programs and batches..." /> : null}

      {view === "classes" ? <section className="grid gap-5">
        {!activeCourseKey ? (
          <>
          {isAcademicHead ? (
            <AcademicOperationsCommandCenter
              stats={academicOperationsStats}
              operations={todayOperations}
              batches={activeClasses}
              calendar={calendar}
              liveClassesByBatch={liveClassesByBatch}
              selectedBatchId={selectedClass?.id}
              selectedBatchHealth={batchHealth}
              selectedWorkspace={classWorkspace}
              teachers={teacherOperations}
              dashboardBasePath={dashboardBasePath}
              onOpenBatch={chooseBatch}
              onStartLive={openLiveClassCreator}
            />
          ) : (
            <TeacherTodayView
              today={teacherTodayItems}
              upcoming={teacherUpcomingItems}
              loading={loadingPlan}
              onStartLive={(batchId) => {
                const batch = activeClasses.find((item) => item.id === batchId);
                if (batch) openLiveClassCreator(batch);
              }}
            />
          )}
          </>
        ) : activeCourseKey && !activeBatchId ? (
          <div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`${dashboardBasePath}/classes`} className="text-sm font-black text-[var(--gold-dark)]">Back to assigned programs</Link>
                  <h2 className="mt-3 text-3xl font-black">{selectedProgram?.name ?? "Program not assigned"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Open an assigned batch to view students, class health and progress.</p>
                </div>
                <span className="rounded-full bg-[var(--page-bg)] px-4 py-2 text-sm font-black">{programClasses.length} assigned batch(es)</span>
              </div>
            </div>
            {!selectedProgram && !loadingPlan ? <EmptyState text="This course is not assigned to this teacher." /> : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {programClasses.map((batch) => (
                <BatchCard key={batch.id} batch={batch} href={`${dashboardBasePath}/classes/${selectedProgram?.key ?? activeCourseKey}/${batch.id}`} />
              ))}
              {!programClasses.length ? <EmptyState text="No batch is assigned under this program." /> : null}
            </div>
          </div>
        ) : (
          <div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`${dashboardBasePath}/classes/${activeCourseKey}`} className="text-sm font-black text-[var(--gold-dark)]">Back to assigned batches</Link>
                  <h2 className="mt-3 text-3xl font-black">{selectedClass?.name ?? "Batch not assigned"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{selectedProgram?.name ?? "Program"} / {selectedClass?.subject || "Subject"}</p>
                </div>
                <span className="rounded-full bg-[var(--page-bg)] px-4 py-2 text-sm font-black">{selectedStudents.length} students</span>
              </div>
            </div>
            {!selectedClass && !loadingPlan ? <EmptyState text="This batch is not assigned to this teacher." /> : null}
            <BatchHealthOverview health={batchHealth} />
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Students</p>
                  <h3 className="mt-2 text-2xl font-black">Student formation</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search student or roll number" className="min-h-11 w-64 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm font-bold outline-none" />
                  <select value={progressFilter} onChange={(event) => setProgressFilter(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm font-bold outline-none">
                    <option value="ALL">All progress</option>
                    <option value="STRONG">Strong progress</option>
                    <option value="STEADY">Steady progress</option>
                    <option value="NEEDS_ATTENTION">Needs attention</option>
                  </select>
                </div>
              </div>
              <div className="mt-5">
                <FootballStudentGrid
                  students={filteredStudents}
                  workspace={classWorkspace}
                  totalStudents={selectedStudents.length}
                  selectedStudentId={studentModalId}
                  onSelect={(id) => {
                    setStudentModalId(id);
                  }}
                />
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <ProgressPanel title="Syllabus plan and tracker" items={classWorkspace.progress.map((item) => ({ id: item.id, title: item.topic || "Topic", meta: item.subject || "Subject", status: item.completionStatus || item.progressColor || "PENDING" }))} empty="No syllabus progress is recorded for this batch yet." />
              <ProgressPanel title="Exams conducted" items={classWorkspace.exams.map((item) => ({ id: item.id, title: item.title || "Exam", meta: `${item.questionCount ?? 0} questions / ${item.durationMinutes ?? 0} min`, status: item.status || "PUBLISHED" }))} empty="No exams conducted for this batch yet." />
              <ProgressPanel title="Upcoming exams" items={classWorkspace.exams.filter((item) => !item.attemptStats?.submitted).map((item) => ({ id: `${item.id}-upcoming`, title: item.title || "Exam", meta: item.topic || selectedClass?.subject || "Topic", status: "LIVE" }))} empty="No upcoming exam is listed for this batch." />
              <ProgressPanel title="Assignments" items={classWorkspace.assignments.map((item) => ({ id: item.id, title: item.title || "Assignment", meta: `Submitted ${item.submissionStats?.submitted ?? 0} / ${item.submissionStats?.totalStudents ?? selectedStudents.length}`, status: item.status || "PUBLISHED" }))} empty="No assignments published for this batch yet." />
            </div>
            {modalStudent ? (
              <StudentProgressModal
                student={modalStudent}
                programName={selectedProgram?.name ?? "Program"}
                batchName={selectedClass?.name ?? "Batch"}
                attendance={modalStudentAttendance}
                attendancePercent={modalAttendancePercent}
                assignments={classWorkspace.assignments}
                materials={classWorkspace.materials}
                exams={classWorkspace.exams}
                progress={classWorkspace.progress}
                onClose={() => setStudentModalId(null)}
              />
            ) : null}
            {liveClassMessage ? <Notice text={liveClassMessage} /> : null}
            <LiveClassStrip items={selectedBatchLiveClasses} onSaveRecording={saveLiveRecordingToLibrary} />
          </div>
        )}
      </section> : null}
      {showLiveClassCreator ? (
        <LiveClassCreatorModal
          form={liveClassForm}
          setForm={setLiveClassForm}
          batchName={selectedClass?.name ?? "Batch"}
          programName={selectedClass ? programName(selectedClass) : "Program"}
          onClose={() => setShowLiveClassCreator(false)}
          onPublish={() => void publishLiveClass()}
          message={liveClassMessage}
        />
      ) : null}

      {view === "students" ? (
        <TeacherStudentsView batches={teacherRosterBatches} loading={loadingPlan} onMarkAttendance={markRosterAttendance} />
      ) : null}

      {view === "exams" ? (
        <TeacherExamWorkspace
          batches={teacherExamBatches}
          selectedBatchId={selectedClass?.id ?? null}
          exams={classWorkspace.exams}
          loading={workspaceLoading}
          onSelectBatch={chooseBatch}
          onRefresh={async () => {
            if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
          }}
        />
      ) : null}

      {view === "assignments" ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
                <FileText size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Assignments</p>
                <h2 className="mt-2 text-3xl font-black">Give homework in 60 seconds.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose a class, write instructions, attach worksheet if needed, then publish to students.</p>
              </div>
            </div>
            <button type="button" onClick={openAssignmentCreator} disabled={!selectedClass} className="relative z-10 inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-950 !bg-slate-950 px-6 py-4 text-base font-black !text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50">
              <Plus size={20} /> New Homework
            </button>
          </div>
        </div>
        {assignmentMessage ? <Notice text={assignmentMessage} /> : null}

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">My Classes</p>
              <h3 className="mt-2 text-2xl font-black">Select class</h3>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{activeClasses.length} class(es)</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {activeClasses.map((batch) => (
              <AssignmentClassTile
                key={batch.id}
                batch={batch}
                active={selectedClass?.id === batch.id}
                onOpen={() => chooseBatch(batch.id)}
              />
            ))}
            {!activeClasses.length ? <EmptyState text="No assigned classes are available yet." /> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Homework</p>
              <h3 className="mt-2 text-3xl font-black">{selectedClass?.name ?? "Open a class"}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                {selectedClass ? `${selectedStudents.length} students / ${subjectsForBatch(selectedClass).join(", ")}` : "Select a class above to create and track homework."}
              </p>
            </div>
            <button type="button" onClick={openAssignmentCreator} disabled={!selectedClass} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <Plus size={18} /> New Homework
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {classWorkspace.assignments.map((assignment) => (
              <AssignmentListItem
                key={assignment.id}
                assignment={assignment}
                onOpen={() => setSelectedAssignmentId(assignment.id)}
              />
            ))}
            {!classWorkspace.assignments.length ? <AssignmentEmptyState onCreate={openAssignmentCreator} /> : null}
          </div>
        </div>

        {showAssignmentCreator ? (
          <AssignmentCreateModal
            onClose={() => setShowAssignmentCreator(false)}
            onSaveDraft={() => void publishAssignment("DRAFT")}
            onPublish={() => void publishAssignment("PUBLISHED")}
            assignmentForm={assignmentForm}
            setAssignmentForm={setAssignmentForm}
            setAssignmentSourceName={setAssignmentSourceName}
            selectedClass={selectedClass}
            selectedBatchName={selectedClass?.name ?? "Batch"}
            selectedStudentCount={selectedStudents.length}
            assignmentSourceName={assignmentSourceName}
          />
        ) : null}
        {selectedAssignment ? (
          <AssignmentDetailsModal
            assignment={selectedAssignment}
            students={selectedStudents}
            courseName={selectedProgram?.name ?? selectedAssignment.course ?? "Course"}
            batchName={selectedClass?.name ?? selectedAssignment.batchName ?? "Batch"}
            onClose={() => setSelectedAssignmentId(null)}
            onReview={reviewAssignmentSubmission}
          />
        ) : null}
      </section> : null}

      {view === "attendance" ? (
        <AttendanceWorkspace
          isAcademicHead={isAcademicHead}
          todayClasses={todaysAttendanceClasses}
          activeClasses={activeClasses}
          selectedClass={selectedClass}
          students={selectedStudents}
          facultyName={user?.name || user?.email || "Teacher"}
          date={attendanceDate}
          attendance={attendance}
          comments={attendanceComments}
          registerOpen={attendanceRegisterOpen}
          editing={Boolean(editingAttendanceId)}
          history={classWorkspace.attendance}
          leaveRequests={leaveRequests}
          message={attendanceMessage}
          onOpenRegister={openAttendanceRegister}
          onOpenHistory={openAttendanceHistoryRecord}
          onChooseBatch={chooseBatch}
          onDate={setAttendanceDate}
          onStatus={setStudentAttendance}
          onComment={(id, value) => setAttendanceComments((current) => ({ ...current, [id]: value }))}
          onAllPresent={() => setAllAttendance("PRESENT")}
          onAllAbsent={() => setAllAttendance("ABSENT")}
          onReset={resetAttendance}
          onSave={() => void saveAttendance()}
          onCloseRegister={() => {
            setAttendanceRegisterOpen(false);
            setEditingAttendanceId(null);
          }}
          onReviewLeave={(id, status) => void reviewLeaveRequest(id, status)}
        />
      ) : null}

      {false ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
                <ClipboardCheck size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Attendance V3</p>
                <h2 className="mt-2 text-3xl font-black">{isAcademicHead ? "Attendance overview." : "Mark absentees only."}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                  {isAcademicHead ? "Monitor batch attendance, pending entries and low attendance students without entering records." : "All students are present by default. Tap only the absent students, then save attendance."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <span className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">Present {attendancePresentCount}</span>
              <span className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">Absent {attendanceAbsentCount}</span>
              <span className="rounded-xl bg-[var(--page-bg)] px-4 py-3 text-[var(--ink)]">{selectedAttendanceRate}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Today's Classes</p>
              <h3 className="mt-2 text-2xl font-black">{isAcademicHead ? "Attendance monitoring" : "Open a class and mark absentees"}</h3>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{todaysAttendanceClasses.length || activeClasses.length} class(es)</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(todaysAttendanceClasses.length ? todaysAttendanceClasses : activeClasses.map((batch) => ({
              id: `batch-${batch.id}`,
              batchId: batch.id,
              time: "Today",
              batchName: batch.name,
              programName: programName(batch),
              subject: batch.subject || subjectsForBatch(batch)[0] || "Subject",
              topic: "Attendance",
              teacherName: teacherNameForBatch(batch),
              status: "Upcoming",
            }))).map((item) => {
              const batch = activeClasses.find((entry) => entry.id === item.batchId);
              const studentCount = batch?._count?.students ?? batch?.students?.length ?? 0;
              const active = selectedClass?.id === item.batchId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.batchId) chooseBatch(item.batchId);
                    setAttendanceDate(todayDate());
                    resetAttendance();
                  }}
                  className={`min-h-44 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-xs font-black uppercase tracking-[0.24em] ${active ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>{item.time}</p>
                    <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-black">{item.status}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-black">{item.batchName}</h3>
                  <p className={`mt-2 text-sm ${active ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{item.programName} / {item.subject}</p>
                  <p className={`mt-1 text-sm ${active ? "text-white/75" : "text-[var(--muted-blue)]"}`}>Teacher: {item.teacherName}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-current/20 px-3 py-1">{studentCount} students</span>
                    <span className="rounded-full border border-current/20 px-3 py-1">{isAcademicHead ? "View Attendance" : "Mark Attendance"}</span>
                  </div>
                </button>
              );
            })}
            {!activeClasses.length ? <EmptyState text="No assigned classes are available for attendance yet." /> : null}
          </div>
        </div>

        {isAcademicHead ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Academic Head" title="Batch attendance overview" description="Real attendance data appears as teachers save class records." icon={<BarChart3 size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeClasses.map((batch) => {
                  const isCurrent = selectedClass?.id === batch.id;
                  const rate = isCurrent && selectedStudents.length ? selectedAttendanceRate : null;
                  const status = rate === null ? "Data pending" : rate >= 85 ? "Healthy" : rate >= 75 ? "Attention Needed" : "Critical";
                  return (
                    <button key={batch.id} type="button" onClick={() => chooseBatch(batch.id)} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-left">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{programName(batch)}</p>
                      <h3 className="mt-2 text-lg font-black">{batch.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-white px-3 py-1">Attendance {rate === null ? "pending" : `${rate}%`}</span>
                        <span className={`rounded-full px-3 py-1 ${status === "Healthy" ? "bg-emerald-50 text-emerald-700" : status === "Critical" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Alerts" title="Students below 75%" description="Low attendance students from the selected batch." icon={<Bell size={20} />} />
              <div className="mt-4 grid gap-3">
                {lowAttendanceStudents.map(({ entry, index, attendance: studentAttendance }) => (
                  <button key={studentId(entry, index)} type="button" onClick={() => setStudentModalId(studentId(entry, index))} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-left">
                    <p className="font-black">{entry.student?.name || entry.student?.email || "Student"}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedClass?.name || "Batch"} / {studentAttendance}% attendance</p>
                  </button>
                ))}
                {!lowAttendanceStudents.length ? <EmptyState text="No low-attendance students found in the selected batch." /> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Attendance Entry</p>
                <h3 className="mt-2 text-3xl font-black">{selectedClass?.name || "Select class"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedProgram?.name || "Program"} / {selectedClass?.subject || subjectsForBatch(selectedClass)[0] || "Subject"} / Date {attendanceDate}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input label="Date" type="date" value={attendanceDate} onChange={setAttendanceDate} />
                <button type="button" onClick={() => setAllAttendance("PRESENT")} className="min-h-12 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Mark All Present</button>
                <button type="button" onClick={() => setAllAttendance("ABSENT")} className="min-h-12 rounded-xl bg-rose-700 px-4 py-3 text-sm font-black text-white">Mark All Absent</button>
                <button type="button" onClick={resetAttendance} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Reset</button>
                <button type="button" onClick={() => void saveAttendance()} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Attendance</button>
              </div>
            </div>
            {attendanceMessage ? <Notice text={attendanceMessage || ""} /> : null}
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedStudents.map((entry, index) => {
                const id = studentId(entry, index);
                const current = attendance[id] ?? "PRESENT";
                const absent = current === "ABSENT";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAbsence(id)}
                    className={`min-h-20 rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${absent ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black ${absent ? "bg-rose-700 text-white" : "bg-emerald-700 text-white"}`}>{absent ? "x" : "✓"}</span>
                      <div>
                        <h3 className="font-black">{entry.student?.name || entry.student?.email || "Student"}</h3>
                        <p className="mt-1 text-xs font-black">{absent ? "Absent" : "Present"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {!selectedStudents.length ? <EmptyState text="No students are assigned to this batch yet." /> : null}
            </div>
            <details className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <summary className="cursor-pointer text-sm font-black">Absent student comments</summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedStudents.map((entry, index) => {
                  const id = studentId(entry, index);
                  if ((attendance[id] ?? "PRESENT") !== "ABSENT") return null;
                  return (
                    <label key={id} className="grid gap-2 text-sm font-black">
                      {entry.student?.name || entry.student?.email || "Student"}
                      <input value={attendanceComments[id] ?? ""} onChange={(event) => setAttendanceComments((value) => ({ ...value, [id]: event.target.value }))} placeholder="Optional reason or note" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-normal" />
                    </label>
                  );
                })}
                {!attendanceAbsentCount ? <p className="text-sm text-[var(--muted-blue)]">No absentees selected.</p> : null}
              </div>
            </details>
          </div>
        )}

        {modalStudent ? (
          <StudentProgressModal
            student={modalStudent!}
            programName={selectedProgram?.name ?? "Program"}
            batchName={selectedClass?.name ?? "Batch"}
            attendance={modalStudentAttendance}
            attendancePercent={modalAttendancePercent}
            assignments={classWorkspace.assignments}
            materials={classWorkspace.materials}
            exams={classWorkspace.exams}
            progress={classWorkspace.progress}
            onClose={() => setStudentModalId(null)}
          />
        ) : null}
      </section> : null}

      {view === "library" ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
                <Library size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">My Library</p>
                <h2 className="mt-2 text-3xl font-black">Teaching files</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Open batch folder, subject folder and topic folder. Upload videos, notes and worksheets like a simple computer drive.</p>
              </div>
            </div>
            {selectedClass && activeLibrarySubject ? (
              <button type="button" onClick={openLibraryUpload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 !bg-slate-950 px-5 py-3 text-sm font-black !text-white">
                <Plus size={18} /> Upload
              </button>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">
            <button type="button" onClick={() => { setSelectedClassId(null); setLibrarySubject(null); setLibraryTopic(null); }} className="text-[var(--ink)]">My Library</button>
            {selectedClass ? <><span className="text-[var(--muted-blue)]">/</span><button type="button" onClick={() => { setLibrarySubject(null); setLibraryTopic(null); }} className="text-[var(--ink)]">{selectedClass.name}</button></> : null}
            {activeLibrarySubject ? <><span className="text-[var(--muted-blue)]">/</span><button type="button" onClick={() => setLibraryTopic(null)} className="text-[var(--ink)]">{activeLibrarySubject}</button></> : null}
            {activeLibraryTopic ? <><span className="text-[var(--muted-blue)]">/</span><span className="text-[var(--gold-dark)]">{activeLibraryTopic}</span></> : null}
          </div>
        </div>

        {!selectedClass ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">This PC</p>
                <h3 className="mt-2 text-2xl font-black">Batch folders</h3>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{activeClasses.length} folder(s)</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {activeClasses.map((batch) => {
                const subjects = subjectsForBatch(batch);
                return (
                  <ExplorerFolder
                    key={batch.id}
                    title={batch.name}
                    subtitle={`${batch._count?.students ?? batch.students?.length ?? 0} students / ${subjects.length} subject folders`}
                    active={false}
                    onOpen={() => chooseBatch(batch.id)}
                  />
                );
              })}
              {!activeClasses.length ? <EmptyState text="No assigned batches yet." /> : null}
            </div>
          </div>
        ) : null}

        {selectedClass && !activeLibrarySubject ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Batch Folder</p>
                <h3 className="mt-2 text-2xl font-black">{selectedClass.name}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{programName(selectedClass)} / Open the subject you taught.</p>
              </div>
              <button type="button" onClick={() => { setSelectedClassId(null); setLibrarySubject(null); setLibraryTopic(null); }} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">Back to Batches</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {librarySubjects.map((subject) => {
                const materials = subject.materials.filter((item) => !isFolderMaterial(item));
                const archived = subject.materials.length > 0 && subject.materials.every((item) => item.status === "ARCHIVED");
                return (
                  <ExplorerFolder
                    key={subject.name}
                    title={subject.name}
                    subtitle={`${materials.length} file(s)`}
                    active={false}
                    archived={archived}
                    onOpen={() => { setLibrarySubject(subject.name); setLibraryTopic(null); setShowLibraryUpload(false); }}
                    onRename={subject.materials.length ? () => void renameLibraryFolder("SUBJECT", subject.name) : undefined}
                    onArchive={subject.materials.length ? () => void archiveLibraryFolder("SUBJECT", subject.name) : undefined}
                    onRestore={subject.materials.some((item) => item.status === "ARCHIVED") ? () => void restoreLibraryFolder("SUBJECT", subject.name) : undefined}
                    onDelete={subject.materials.length ? () => void deleteLibraryFolder("SUBJECT", subject.name) : undefined}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {selectedClass && activeLibrarySubject && !activeLibraryTopic ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Subject Folder</p>
                <h3 className="mt-2 text-2xl font-black">{activeLibrarySubject}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedClass.name} / Open a topic folder or create one.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setLibrarySubject(null)} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">Back to Subjects</button>
                <button type="button" onClick={openLibraryUpload} className="rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white">Upload Lesson</button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
              <FolderCreateBox label="New topic folder" placeholder="Example: Algebra" value={libraryForm.topic} onChange={(value) => setLibraryForm((form) => ({ ...form, subject: activeLibrarySubject, folder: activeLibrarySubject, topic: value }))} onCreate={() => void createLibraryFolder("TOPIC", libraryForm.topic)} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {libraryTopics.map((topic) => {
                  const files = topic.materials.filter((item) => !isFolderMaterial(item));
                  const archived = topic.materials.length > 0 && topic.materials.every((item) => item.status === "ARCHIVED");
                  return (
                    <ExplorerFolder
                      key={topic.name}
                      title={topic.name}
                      subtitle={`${files.length} file(s)`}
                      active={false}
                      archived={archived}
                      onOpen={() => { setLibraryTopic(topic.name); setShowLibraryUpload(false); }}
                      onRename={() => void renameLibraryFolder("TOPIC", topic.name)}
                      onArchive={topic.materials.length ? () => void archiveLibraryFolder("TOPIC", topic.name) : undefined}
                      onRestore={topic.materials.some((item) => item.status === "ARCHIVED") ? () => void restoreLibraryFolder("TOPIC", topic.name) : undefined}
                      onDelete={topic.materials.length ? () => void deleteLibraryFolder("TOPIC", topic.name) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {selectedClass && activeLibrarySubject && activeLibraryTopic ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Topic Folder</p>
                <h3 className="mt-2 text-2xl font-black">{activeLibraryTopic}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedClass.name} / {activeLibrarySubject}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setLibraryTopic(null)} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">Back to Topics</button>
                <button type="button" onClick={openLibraryUpload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-black text-white">
                  <Plus size={18} /> Upload Lesson
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search this folder..." className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 text-sm font-bold outline-none md:max-w-md" />
              <select value={librarySort} onChange={(event) => setLibrarySort(event.target.value as "LATEST" | "OLDEST")} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                <option value="LATEST">Sort Latest</option>
                <option value="OLDEST">Sort Oldest</option>
              </select>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedLibraryMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onRename={() => void renameLibraryMaterial(material)}
                  onArchive={() => void archiveLibraryMaterial(material.id)}
                  onRestore={() => void restoreLibraryMaterial(material.id)}
                  onDelete={() => void deleteLibraryMaterial(material.id)}
                />
              ))}
              {!visibleLibraryMaterials.length ? <EmptyState text="This folder is empty. Upload a recorded class, PDF, DOCX, PPTX or image." /> : null}
            </div>
            {visibleLibraryMaterials.length > libraryPageSize ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm font-black">
                <button type="button" disabled={libraryPage <= 1} onClick={() => setLibraryPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 disabled:opacity-50">Previous</button>
                <span>Page {libraryPage} / {libraryTotalPages}</span>
                <button type="button" disabled={libraryPage >= libraryTotalPages} onClick={() => setLibraryPage((page) => Math.min(libraryTotalPages, page + 1))} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 disabled:opacity-50">Next</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {showLibraryUpload && selectedClass && activeLibrarySubject ? (
          <LibraryUploadPanel
            form={libraryForm}
            activeSubject={activeLibrarySubject}
            activeTopic={activeLibraryTopic}
            onClose={() => setShowLibraryUpload(false)}
            onChange={setLibraryForm}
            onUploadMaterial={(file) => void uploadLibraryFile(file)}
            onPublish={() => void publishLibraryMaterial()}
          />
        ) : null}
        {libraryMessage ? <Notice text={libraryMessage} /> : null}
      </section> : null}

      {view === "academic-calendar" ? <section>
        {isAcademicHead ? (
          <AcademicCalendarOperationsCenter
            isAcademicHead={isAcademicHead}
            dashboardBasePath={dashboardBasePath}
            tab={calendarTab}
            onTab={setCalendarTab}
            batches={activeClasses}
            batchFilter={calendarBatchFilter}
            onBatchFilter={setCalendarBatchFilter}
            search={calendarSearch}
            onSearch={setCalendarSearch}
            statusFilter={calendarStatusFilter}
            onStatusFilter={setCalendarStatusFilter}
            todayItems={todayCalendarItems}
            weekDays={weekDays}
            weekItems={weekCalendarItems}
            weekTimeSlots={weekTimeSlots}
            week={calendarWeek}
            onWeek={setCalendarWeek}
            month={calendarMonth}
            onMonth={setCalendarMonth}
            monthDays={calendarDays}
            dayTaskMap={selectedDayTaskMap}
            calendarItems={calendarScopeItems}
            completedItems={completedCalendarItems}
            summary={calendarSummary}
            facultyProgress={facultyProgress}
            batchProgress={batchProgress}
            batchCalendarProgress={batchCalendarProgress}
            monitor={calendarMonitor}
            loading={loadingPlan || calendarAnalyticsLoading}
            onOpenClass={openCalendarClass}
            onOpenDay={setSelectedTaskDate}
          />
        ) : (
          <TeacherSimpleCalendar
            month={calendarMonth}
            onMonth={setCalendarMonth}
            tasks={selectedDayTaskMap}
            loading={loadingPlan}
            onOpenClass={(calendarId) => {
              const item = calendarScopeItems.find((entry) => entry.id === calendarId);
              if (item) openCalendarClass(item);
            }}
          />
        )}
        {calendarMessage ? <Notice text={calendarMessage} /> : null}
        {isAcademicHead && selectedTaskDate ? (
          <CalendarDayTasksModal
            date={selectedTaskDate}
            batchName={calendarBatchFilter === "ALL" ? "All assigned batches" : activeClasses.find((batch) => batch.id === calendarBatchFilter)?.name}
            tasks={activeDayTasks}
            onClose={() => setSelectedTaskDate(null)}
            onSelectClass={(calendarId) => {
              const item = calendarScopeItems.find((entry) => entry.id === calendarId);
              if (!item) return;
              setSelectedTaskDate(null);
              openCalendarClass(item);
            }}
          />
        ) : null}
        {showClassDetails && selectedCalendarItem ? (
          <CalendarClassDetailsModal
            item={selectedCalendarItem}
            batch={activeClasses.find((batch) => batch.id === selectedCalendarItem.batchId) ?? selectedClass}
            workspace={classWorkspace}
            dashboardBasePath={dashboardBasePath}
            onClose={() => setShowClassDetails(false)}
            onComplete={() => setShowCompletionReport(true)}
          />
        ) : null}
        {showCompletionReport && selectedCalendarItem ? (
          <ClassCompletionReportModal
            item={selectedCalendarItem}
            form={completionReport}
            onChange={setCompletionReport}
            onClose={() => setShowCompletionReport(false)}
            onSave={() => void submitCompletionReport()}
          />
        ) : null}
      </section> : null}

      {workspaceLoading ? <p className="mt-4 text-sm text-[var(--muted-blue)]">Refreshing selected batch data...</p> : null}
    </div>
  );
}

function AcademicOperationsCommandCenter({
  stats,
  operations,
  batches,
  calendar,
  liveClassesByBatch,
  selectedBatchId,
  selectedBatchHealth,
  selectedWorkspace,
  teachers,
  dashboardBasePath,
  onOpenBatch,
  onStartLive,
}: {
  stats: {
    activeBatches: number;
    scheduledToday: number;
    completed: number;
    live: number;
    pending: number;
    delayed: number;
    attendancePending: number;
    assignmentPending: number;
    examPending: number;
  };
  operations: Array<{ id: string; date: string; time: string; batchName: string; programName: string; subject: string; topic: string; teacherName: string; status: string }>;
  batches: AssignedClass[];
  calendar: CalendarItem[];
  liveClassesByBatch: Map<string, LiveClassRecord[]>;
  selectedBatchId?: string;
  selectedBatchHealth: ReturnType<typeof calculateBatchHealth>;
  selectedWorkspace: ClassWorkspace;
  teachers: Array<{
    id: string;
    name: string;
    subjects: string[];
    batches: string[];
    classesConducted: number;
    attendanceEntries: number;
    assignmentsPublished: number;
    examsPublished: number;
    materialsUploaded: number;
    lastActivity: string;
    roles: string[];
    category: string;
    status: string;
  }>;
  dashboardBasePath: string;
  onOpenBatch: (batchId: string) => void;
  onStartLive: (batch: AssignedClass) => void;
}) {
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? batches[0] ?? null;
  const selectedLiveClasses = selectedBatch ? liveClassesByBatch.get(selectedBatch.id) ?? [] : [];
  const selectedAverage = Math.round((selectedBatchHealth.attendance + selectedBatchHealth.assignments + selectedBatchHealth.exams) / 3);
  const teacherOperationGroups = useMemo(() => {
    const map = new Map<string, typeof teachers>();
    for (const teacher of teachers) {
      const current = map.get(teacher.category) ?? [];
      current.push(teacher);
      map.set(teacher.category, current);
    }
    return Array.from(map.entries()).sort(([a], [b]) => teacherCategoryOrder(a) - teacherCategoryOrder(b));
  }, [teachers]);

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeader
            eyebrow="Today's Academic Operations"
            title="Academic command center"
            description="See today's classes, active batches, teacher activity and academic health from one practical control room."
            icon={<GraduationCap size={20} />}
          />
          <div className="flex flex-wrap gap-2">
            <Link href={`${dashboardBasePath}/academic-calendar`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">Calendar</Link>
            <Link href={`${dashboardBasePath}/attendance`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">Attendance</Link>
            <Link href="/dashboard/director/academic/teachers" className="rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white">Teacher Allocation</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Active Batches" value={stats.activeBatches} />
        <SummaryCard label="Classes Today" value={stats.scheduledToday} />
        <SummaryCard label="Completed" value={stats.completed} />
        <SummaryCard label="Live Now" value={stats.live} />
        <SummaryCard label="Delayed" value={stats.delayed} />
        <SummaryCard label="Pending Classes" value={stats.pending} />
        <SummaryCard label="Attendance Pending" value={stats.attendancePending} />
        <SummaryCard label="Assignments Review" value={stats.assignmentPending} />
        <SummaryCard label="Exams Publication" value={stats.examPending} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Today</p>
              <h2 className="mt-2 text-2xl font-black">Class timeline</h2>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{operations.length} class(es)</span>
          </div>
          <div className="mt-5 grid gap-3">
            {operations.map((item) => (
              <article key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 md:grid-cols-[110px_1fr_auto] md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{item.date}</p>
                  <p className="mt-1 text-xl font-black">{item.time}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{item.programName}</p>
                  <h3 className="mt-1 text-lg font-black">{item.batchName}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.subject} / {item.topic} / Teacher: {item.teacherName}</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>{item.status}</span>
              </article>
            ))}
            {!operations.length ? <EmptyState text="No class is scheduled for today. Use Calendar or Start Live Class to create one." /> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Academic Health</p>
          <h2 className="mt-2 text-2xl font-black">Action needed</h2>
          <div className="mt-4 grid gap-3">
            <HealthSignal label="Batch Status" value={statusHealth(selectedAverage)} />
            <HealthSignal label="Attendance" value={`${selectedBatchHealth.attendance}%`} />
            <HealthSignal label="Assignments" value={`${selectedBatchHealth.assignments}%`} />
            <HealthSignal label="Exams" value={`${selectedBatchHealth.exams}%`} />
            <HealthSignal label="Library Uploads" value={selectedWorkspace.materials.filter((item) => !isFolderMaterial(item)).length} />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Batches</p>
            <h2 className="mt-2 text-2xl font-black">Active academic batches</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{batches.length} batch(es)</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const subjects = subjectsForBatch(batch);
            const students = batch.students?.length ?? batch._count?.students ?? 0;
            const upcomingClass = (liveClassesByBatch.get(batch.id) ?? []).find((item) => isFutureOrToday(item.scheduledAt));
            const calendarItem = nextCalendarForBatch(calendar, batch.id);
            const selected = selectedBatch?.id === batch.id;
            const completion = selected ? selectedAverage : 0;
            return (
              <article key={batch.id} className={`rounded-2xl border p-5 shadow-sm ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}>
                <p className={`text-xs font-black uppercase tracking-[0.24em] ${selected ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>{programName(batch)}</p>
                <h3 className="mt-3 text-2xl font-black">{batch.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
                  <span className="rounded-xl border border-current/20 px-3 py-2">{batch.batchType || "Mode pending"}</span>
                  <span className="rounded-xl border border-current/20 px-3 py-2">{students} students</span>
                  <span className="rounded-xl border border-current/20 px-3 py-2">{subjects.length} subjects</span>
                </div>
                <div className="mt-4 rounded-xl border border-current/20 p-3 text-sm">
                  <p className="font-black">Upcoming Class</p>
                  <p className="mt-1 opacity-80">{upcomingClass?.subject || calendarItem?.subject || "Not scheduled"}</p>
                </div>
                <div className="mt-4">
                  <ProgressBar label="Completion" value={completion} mutedLabel={selected ? statusHealth(completion) : "Open batch to calculate"} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    onClick={() => onOpenBatch(batch.id)}
                    href={`${dashboardBasePath}/classes/${programKey(batch)}/${batch.id}`}
                    className="rounded-xl border border-slate-950 bg-white px-3 py-3 text-center text-xs font-black !text-slate-950 shadow-sm transition hover:bg-slate-100"
                  >
                    Open Batch
                  </Link>
                  <button type="button" onClick={() => { onOpenBatch(batch.id); onStartLive(batch); }} className="rounded-xl border border-current/20 px-3 py-3 text-xs font-black">Start Live</button>
                  <Link onClick={() => onOpenBatch(batch.id)} href={`${dashboardBasePath}/academic-calendar`} className="rounded-xl border border-current/20 px-3 py-3 text-center text-xs font-black">View Schedule</Link>
                  <Link onClick={() => onOpenBatch(batch.id)} href={`${dashboardBasePath}/attendance`} className="rounded-xl border border-current/20 px-3 py-3 text-center text-xs font-black">Attendance</Link>
                </div>
              </article>
            );
          })}
          {!batches.length ? <ClassesEmptyState /> : null}
        </div>
      </section>

      {selectedBatch ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Batch Command Center</p>
              <h2 className="mt-2 text-3xl font-black">{selectedBatch.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">{programName(selectedBatch)} / {selectedBatch.batchType || "Mode pending"}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-black ${statusTone(statusHealth(selectedAverage))}`}>{statusHealth(selectedAverage)}</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ProgressPanel
              title="Assigned teachers"
              items={(selectedBatch.teachers ?? []).map((entry, index) => ({
                id: entry.teacher?.id || `${selectedBatch.id}-teacher-${index}`,
                title: entry.teacher?.name || "Teacher pending",
                meta: `${teacherCategory([entry.subject || ""], [entry.role || ""])} / ${entry.subject || "Subject pending"} / ${entry.teacher?.email || "No email"}`,
                status: "Active",
              }))}
              empty="No teacher allocation found for this batch."
            />
            <ProgressPanel
              title="Upcoming schedule"
              items={[
                ...selectedLiveClasses.map((item) => ({
                  id: item.id,
                  title: item.subject || item.title,
                  meta: `${new Date(item.scheduledAt).toLocaleString()} / ${item.duration} min`,
                  status: classStatus(item),
                })),
                ...calendar.filter((item) => item.batchId === selectedBatch.id).slice(0, 6).map((item) => ({
                  id: item.id,
                  title: item.subject || "Class",
                  meta: `${item.plannedDate || "Date pending"} / ${item.startTime || "Time pending"}`,
                  status: classStatus(item),
                })),
              ]}
              empty="No upcoming schedule found for this batch."
            />
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            <Link href={`${dashboardBasePath}/academic-calendar`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Schedule Class</Link>
            <Link href="/dashboard/director/academic/teachers" className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Allocate Teacher</Link>
            <Link href={`${dashboardBasePath}/library`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Study Material</Link>
            <Link href={`${dashboardBasePath}/assignments`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Assignment</Link>
            <Link href={`${dashboardBasePath}/exams`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Exam</Link>
            <button type="button" onClick={() => onStartLive(selectedBatch)} className="rounded-xl bg-[var(--ink)] px-3 py-3 text-xs font-black text-white">Start Live</button>
            <Link href={`${dashboardBasePath}/attendance`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Attendance</Link>
            <Link href={`${dashboardBasePath}/classes/${programKey(selectedBatch)}/${selectedBatch.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Reports</Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Teacher Monitoring</p>
            <h2 className="mt-2 text-2xl font-black">Teaching activity</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{teachers.length} teacher(s)</span>
        </div>
        <div className="mt-5 grid gap-5">
          {teacherOperationGroups.map(([category, group]) => (
            <div key={category}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">{category}</h3>
                <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{group.length}</span>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.map((teacher) => (
                  <article key={teacher.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-black">{teacher.name}</h4>
                        <p className="mt-1 text-sm text-[var(--muted-blue)]">{teacher.subjects.join(", ") || "Subject pending"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(teacher.status)}`}>{teacher.status}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
                      <span className="rounded-xl bg-white p-2">{teacher.batches.length} batches</span>
                      <span className="rounded-xl bg-white p-2">{teacher.classesConducted} classes</span>
                      <span className="rounded-xl bg-white p-2">{teacher.attendanceEntries} attendance</span>
                      <span className="rounded-xl bg-white p-2">{teacher.assignmentsPublished} assignments</span>
                      <span className="rounded-xl bg-white p-2">{teacher.examsPublished} exams</span>
                      <span className="rounded-xl bg-white p-2">{teacher.materialsUploaded} materials</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          {!teachers.length ? <EmptyState text="No teacher allocations are available yet." /> : null}
        </div>
      </section>
    </>
  );
}

function HealthSignal({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm">
      <span className="font-bold text-[var(--muted-blue)]">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, icon, action }: { eyebrow: string; title: string; description: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--page-bg)] text-[var(--gold-dark)]">{icon}</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-xl bg-[var(--page-bg)] px-3 py-3">
      <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-1 block text-xl font-black">{value}</span>
    </span>
  );
}

function ClassesEmptyState() {
  return (
    <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center shadow-sm">
      <h3 className="text-2xl font-black">No classes assigned yet</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-blue)]">
        Programs and batches assigned by the Academic Head or Director will appear here.
      </p>
      <p className="mt-2 text-sm font-black text-[var(--gold-dark)]">Please contact administration if you believe this is incorrect.</p>
    </div>
  );
}

function BatchCard({ batch, href }: { batch: AssignedClass; href: string }) {
  const students = batch.students?.length ?? batch._count?.students ?? 0;

  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:bg-[var(--page-bg)]">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Assigned batch</p>
      <h3 className="mt-4 text-2xl font-black">{batch.name}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{batch.subject || "Subject"} / {students} students</p>
      <div className="mt-5 grid gap-3">
        <ProgressBar label="Attendance" value={0} mutedLabel="Open batch to view records" />
        <ProgressBar label="Assignment Completion" value={0} mutedLabel="Open batch to view records" />
        <ProgressBar label="Exam Completion" value={0} mutedLabel="Open batch to view records" />
      </div>
      <span className="mt-5 inline-flex rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white">Open Batch</span>
    </Link>
  );
}

function BatchHealthOverview({ health }: { health: ReturnType<typeof calculateBatchHealth> }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <SummaryCard label="Total Students" value={health.students} />
      <HealthCard label="Attendance" value={health.attendance} />
      <HealthCard label="Assignments" value={health.assignments} />
      <HealthCard label="Exams" value={health.exams} />
    </div>
  );
}

function LiveClassStrip({ items, onSaveRecording }: { items: LiveClassRecord[]; onSaveRecording: (item: LiveClassRecord) => void }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Live Classes</p>
          <h3 className="mt-2 text-2xl font-black">Upcoming and recorded sessions</h3>
        </div>
        <span className="rounded-full bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{items.length} class(es)</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white">
                <PlayCircle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{item.subject || "Live Class"}</p>
                <h4 className="mt-1 text-lg font-black">{item.topic || item.title}</h4>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{new Date(item.scheduledAt).toLocaleString()} / {item.duration} min</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={item.meetingLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">Join</a>
                  <button type="button" onClick={() => onSaveRecording(item)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-black">Save Recording To Library</button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {!items.length ? <EmptyState text="No live classes are scheduled for this batch yet." /> : null}
      </div>
    </div>
  );
}

function LiveClassCreatorModal({
  form,
  setForm,
  batchName,
  programName,
  onClose,
  onPublish,
  message,
}: {
  form: LiveClassForm;
  setForm: React.Dispatch<React.SetStateAction<LiveClassForm>>;
  batchName: string;
  programName: string;
  onClose: () => void;
  onPublish: () => void;
  message?: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Classes</p>
            <h2 className="mt-2 text-3xl font-black">Start Live Class</h2>
            <p className="mt-2 text-sm text-[var(--muted-blue)]">{programName} / {batchName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close live class creator">
            <X size={18} />
          </button>
        </div>

        {message ? <Notice text={message} /> : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Subject" value={form.subject} onChange={(value) => setForm((current) => ({ ...current, subject: value }))} />
          <Input label="Topic" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} />
          <Input label="Date" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
          <Input label="Time" type="time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
          <Input label="Duration" type="number" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} />
          <Input label="Meeting Link" value={form.meetingLink} onChange={(value) => setForm((current) => ({ ...current, meetingLink: value }))} />
        </div>
        <div className="mt-4">
          <Textarea label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black">Cancel</button>
          <button type="button" onClick={onPublish} className="rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-black text-white">Publish Live Class</button>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}%</p>
      <ProgressBar label={label} value={value} compact />
    </div>
  );
}

function ProgressBar({ label, value, compact, mutedLabel }: { label: string; value: number; compact?: boolean; mutedLabel?: string }) {
  return (
    <div>
      {!compact ? (
        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black">
          <span>{label}</span>
          <span className="text-[var(--muted-blue)]">{mutedLabel ?? `${value}%`}</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FootballStudentGrid({
  students,
  workspace,
  totalStudents,
  selectedStudentId,
  onSelect,
}: {
  students: NonNullable<AssignedClass["students"]>;
  workspace: ClassWorkspace;
  totalStudents: number;
  selectedStudentId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = [students.slice(0, 1), students.slice(1, 3), students.slice(3, 6), students.slice(6, 8), students.slice(8)];

  return (
    <div className="rounded-[28px] border border-emerald-900 bg-emerald-950 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">Football Team View</p>
          <h3 className="mt-2 text-2xl font-black">Students</h3>
        </div>
        <span className="rounded-full border border-white/30 px-4 py-2 text-sm font-black">{students.length} students</span>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/25 bg-emerald-900/70 p-4">
        <div className="grid gap-5">
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex flex-wrap justify-center gap-4">
              {row.map((entry, index) => {
                const id = studentId(entry, rowIndex * 4 + index);
                const active = selectedStudentId === id;
                const metrics = studentProgressMetrics(entry.student, workspace, totalStudents);
                return (
                  <button key={id} type="button" onClick={() => onSelect(id)} className={`w-48 rounded-2xl border p-3 text-left ${active ? "border-white bg-white text-emerald-950" : "border-white/25 bg-white/10 text-white"}`}>
                    <span className="flex items-center gap-3">
                      <StudentAvatar student={entry.student} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{entry.student?.name || entry.student?.email || "Student"}</span>
                        <span className="mt-1 block truncate text-[0.68rem] font-black opacity-80">Roll {entry.student?.rollNumber || id.slice(-5)}</span>
                      </span>
                    </span>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[0.65rem] font-black">
                      <span>Att {metrics.attendance}%</span>
                      <span>Assn {metrics.assignments}%</span>
                      <span>Exam {metrics.exams}%</span>
                      <span>All {metrics.overall}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${metrics.overall}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {!students.length ? <p className="py-10 text-center text-sm text-emerald-100">Learners will appear after Administrative Officer approval and batch assignment.</p> : null}
      </div>
    </div>
  );
}

function StudentAvatar({ student }: { student?: AssignedStudent | null }) {
  const photo = student?.photoUrl || student?.avatarUrl;
  if (photo) {
    return <span className="h-12 w-12 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />;
  }
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white font-black text-emerald-950">{(student?.name || student?.email || "?").slice(0, 1).toUpperCase()}</span>;
}

function CourseSummaryCards({ students, progress, exams, assignments }: { students: number; progress: number; exams: number; assignments: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <SummaryCard label="Students" value={students} />
      <SummaryCard label="Syllabus Topics" value={progress} />
      <SummaryCard label="Exams" value={exams} />
      <SummaryCard label="Assignments" value={assignments} />
    </div>
  );
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY";

function AttendanceWorkspace({
  isAcademicHead,
  todayClasses,
  activeClasses,
  selectedClass,
  students,
  facultyName,
  date,
  attendance,
  comments,
  registerOpen,
  editing,
  history,
  leaveRequests,
  message,
  onOpenRegister,
  onOpenHistory,
  onChooseBatch,
  onDate,
  onStatus,
  onComment,
  onAllPresent,
  onAllAbsent,
  onReset,
  onSave,
  onCloseRegister,
  onReviewLeave,
}: {
  isAcademicHead: boolean;
  todayClasses: Array<{ id: string; batchId?: string | null; time: string; batchName: string; subject: string; teacherName: string }>;
  activeClasses: AssignedClass[];
  selectedClass: AssignedClass | null;
  students: NonNullable<AssignedClass["students"]>;
  facultyName: string;
  date: string;
  attendance: Record<string, AttendanceStatus>;
  comments: Record<string, string>;
  registerOpen: boolean;
  editing: boolean;
  history: AttendanceRecord[];
  leaveRequests: LeaveRequestRecord[];
  message: string | null;
  onOpenRegister: (batchId: string, date?: string) => void;
  onOpenHistory: (record: AttendanceRecord) => void;
  onChooseBatch: (batchId: string) => void;
  onDate: (value: string) => void;
  onStatus: (id: string, status: AttendanceStatus) => void;
  onComment: (id: string, value: string) => void;
  onAllPresent: () => void;
  onAllAbsent: () => void;
  onReset: () => void;
  onSave: () => void;
  onCloseRegister: () => void;
  onReviewLeave: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
  const selectedHistory = history.filter((record) => !date || record.date?.slice(0, 10) === date);
  const pendingLeaves = leaveRequests.filter((leave) => leave.status === "PENDING");
  const allRecords = history.flatMap((record) => record.records ?? []);
  const present = allRecords.filter((record) => record.status === "PRESENT").length;
  const overallRate = allRecords.length ? Math.round((present / allRecords.length) * 100) : 0;

  return (
    <section className="grid gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)]"><ClipboardCheck size={22} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">{isAcademicHead ? "Academic Head Attendance" : "Attendance Register"}</p>
            <h2 className="mt-2 text-3xl font-black">{isAcademicHead ? "Attendance reports and leave requests." : "Mark the class register."}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{isAcademicHead ? "Monitoring and approvals stay separate from the teacher's attendance entry." : "Open today's class, mark exceptions, and save."}</p>
          </div>
        </div>
      </div>
      {message ? <Notice text={message} /> : null}

      {!isAcademicHead ? (
        <>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Today's Classes</p>
                <h3 className="mt-2 text-2xl font-black">Choose a class</h3>
              </div>
              <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black">{todayClasses.length} class(es)</span>
            </div>
            <div className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
              {todayClasses.map((item) => {
                const batch = activeClasses.find((entry) => entry.id === item.batchId);
                const studentCount = batch?._count?.students ?? batch?.students?.length ?? 0;
                return (
                  <div key={item.id} className="grid gap-4 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="text-sm font-black text-[var(--gold-dark)]">{item.time}</p>
                      <h4 className="mt-1 text-xl font-black">{item.batchName}</h4>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.subject} / {studentCount} students</p>
                    </div>
                    <button type="button" onClick={() => item.batchId && onOpenRegister(item.batchId)} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white">Mark Attendance</button>
                  </div>
                );
              })}
              {!todayClasses.length ? <EmptyState text="No class is scheduled for today in the academic calendar." /> : null}
            </div>
          </div>

          {registerOpen ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">{editing ? "Edit Attendance" : "Attendance Register"}</p>
                    <h3 className="mt-2 text-3xl font-black">{selectedClass?.name || "Class"}</h3>
                    <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedClass?.subject || subjectsForBatch(selectedClass)[0] || "Subject"} / {facultyName} / {students.length} students</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onAllPresent} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Mark All Present</button>
                    <button type="button" onClick={onAllAbsent} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">Mark All Absent</button>
                    <button type="button" onClick={onReset} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-sm font-black">Reset</button>
                    <button type="button" onClick={onCloseRegister} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Close</button>
                  </div>
                </div>
                <div className="mt-4 max-w-xs"><Input label="Date" type="date" value={date} onChange={onDate} /></div>
              </div>

              <div className="hidden grid-cols-[5rem_minmax(12rem,1fr)_repeat(4,5.5rem)_minmax(10rem,1fr)] border-b border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] md:grid">
                <span>Roll No</span><span>Student Name</span><span>Present</span><span>Absent</span><span>Leave</span><span>Half Day</span><span>Remarks</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {students.map((entry, index) => {
                  const id = studentId(entry, index);
                  const current = attendance[id] ?? "PRESENT";
                  const studentRecords = history.flatMap((record) => (record.records ?? []).filter((item) => item.studentId === entry.student?.id));
                  const studentPresent = studentRecords.filter((record) => record.status === "PRESENT").length;
                  const studentRate = studentRecords.length ? Math.round((studentPresent / studentRecords.length) * 100) : 0;
                  return (
                    <div key={id} className="grid gap-3 p-4 md:grid-cols-[5rem_minmax(12rem,1fr)_repeat(4,5.5rem)_minmax(10rem,1fr)] md:items-center">
                      <span className="text-sm font-black">{entry.student?.rollNumber || index + 1}</span>
                      <details>
                        <summary className="cursor-pointer list-none font-black">{entry.student?.name || entry.student?.email || "Student"}</summary>
                        <p className="mt-1 text-xs text-[var(--muted-blue)]">{studentRate}% / {studentPresent} present / {studentRecords.filter((record) => record.status === "ABSENT").length} absent / {studentRecords.filter((record) => record.status === "LEAVE").length} leave</p>
                      </details>
                      {(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"] as AttendanceStatus[]).map((status) => (
                        <button key={status} type="button" onClick={() => onStatus(id, status)} className={`min-h-11 rounded-xl border px-2 text-xs font-black ${current === status ? status === "PRESENT" ? "border-emerald-700 bg-emerald-700 text-white" : status === "ABSENT" ? "border-rose-700 bg-rose-700 text-white" : status === "LEAVE" ? "border-amber-600 bg-amber-500 text-white" : "border-blue-700 bg-blue-700 text-white" : "border-[var(--border)] bg-white text-[var(--ink)]"}`}>
                          {status === "HALF_DAY" ? "Half Day" : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                      <input value={comments[id] ?? ""} onChange={(event) => onComment(id, event.target.value)} placeholder="Optional remark" className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none" />
                    </div>
                  );
                })}
                {!students.length ? <EmptyState text="No students are assigned to this batch." /> : null}
              </div>
              <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-white p-5">
                <p className="text-sm font-black">
                  {Object.values(attendance).filter((value) => value === "PRESENT").length} present / {Object.values(attendance).filter((value) => value === "ABSENT").length} absent / {Object.values(attendance).filter((value) => value === "LEAVE").length} leave / {Object.values(attendance).filter((value) => value === "HALF_DAY").length} half day
                </p>
                <button type="button" onClick={onSave} className="min-h-12 rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white">{editing ? "Update Attendance" : "Save Attendance"}</button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Attendance History</p>
                <h3 className="mt-2 text-2xl font-black">{selectedClass?.name || "Selected batch"}</h3>
              </div>
              <Input label="Select Date" type="date" value={date} onChange={onDate} />
            </div>
            <div className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
              {selectedHistory.map((record) => (
                <button key={record.id} type="button" onClick={() => onOpenHistory(record)} className="grid w-full gap-2 bg-white p-4 text-left hover:bg-[var(--page-bg)] md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-black">{record.subject || "Class Attendance"}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{record.date ? new Date(record.date).toLocaleDateString() : "Date pending"} / {record.records?.length ?? 0} students / {record.teacherName || "Teacher"}</p>
                  </div>
                  <span className="text-sm font-black">Open & Edit</span>
                </button>
              ))}
              {!selectedHistory.length ? <EmptyState text="No attendance record found for this date." /> : null}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard label="Overall Attendance" value={`${overallRate}%`} />
            <SummaryCard label="Pending Entries" value={Math.max(0, todayClasses.length - history.filter((record) => record.date?.slice(0, 10) === todayDate()).length)} />
            <SummaryCard label="Pending Leave" value={pendingLeaves.length} />
            <SummaryCard label="Recorded Sessions" value={history.length} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Leave Requests</p>
                <h3 className="mt-2 text-2xl font-black">Review student leave</h3>
              </div>
              <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black">{pendingLeaves.length} pending</span>
            </div>
            <div className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
              {leaveRequests.map((leave) => (
                <div key={leave.id} className="grid gap-4 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black">{leave.studentName || "Student"}</h4>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(leave.status)}`}>{leave.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{leave.batchName || "Batch"} / {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm">{leave.reason}</p>
                    {leave.attachmentName ? <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">Attachment: {leave.attachmentName}</p> : null}
                  </div>
                  {leave.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onReviewLeave(leave.id, "APPROVED")} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Approve</button>
                      <button type="button" onClick={() => onReviewLeave(leave.id, "REJECTED")} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">Reject</button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!leaveRequests.length ? <EmptyState text="No leave requests are available." /> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Batch Attendance</p>
            <h3 className="mt-2 text-2xl font-black">Select a batch</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeClasses.map((batch) => (
                <button key={batch.id} type="button" onClick={() => onChooseBatch(batch.id)} className={`rounded-xl border px-4 py-3 text-sm font-black ${selectedClass?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>{batch.name}</button>
              ))}
            </div>
            <div className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
              {history.map((record) => (
                <div key={record.id} className="grid gap-2 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-black">{record.subject || "Attendance"}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{record.date ? new Date(record.date).toLocaleDateString() : "Date pending"} / Marked by {record.teacherName || "Faculty"}</p>
                  </div>
                  <span className="text-sm font-black">{record.records?.length ?? 0} students</span>
                </div>
              ))}
              {!history.length ? <EmptyState text="No attendance entries are recorded for this batch." /> : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function ProgressPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: string; title: string; meta: string; status: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-black">{item.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>{item.status}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.meta}</p>
          </div>
        ))}
        {!items.length ? <EmptyState text={empty} /> : null}
      </div>
    </div>
  );
}

type ExamWorkflowMode = "draft" | "scheduled" | "completed";

function ExamWorkflowSection({ title, description, empty, children }: { title: string; description: string; empty: string; children: React.ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  const count = items.length;
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{description}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{count} item(s)</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items}
        {!count ? <EmptyState text={empty} /> : null}
      </div>
    </section>
  );
}

function ExamWorkflowCard({
  exam,
  courseName,
  batchName,
  mode,
  onPrimary,
  onEdit,
  onCancel,
  onPublishChanges,
}: {
  exam: Partial<ExamRecord> & { id: string };
  courseName: string;
  batchName: string;
  mode: ExamWorkflowMode;
  onPrimary: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onPublishChanges?: () => void;
}) {
  const status = mode === "draft" ? "Draft" : mode === "scheduled" ? "Scheduled" : "Completed";
  const scheduledDate = exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : "Date pending";
  const primaryLabel = mode === "draft" ? "Continue with NIDUS GURU" : mode === "scheduled" ? "View" : "View Results";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(status)}`}>{status}</span>
        <span className="text-xs font-black text-[var(--gold-dark)]">{scheduledDate}</span>
      </div>
      <h3 className="mt-4 text-xl font-black">{exam.title || "Untitled exam"}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{courseName} / {batchName}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.topic || "Topic pending"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{exam.questionCount ?? 0} Qs</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{exam.durationMinutes ?? 0} min</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{mode === "completed" ? `${exam.attemptStats?.averageScore ?? 0} avg` : `${exam.attemptStats?.submitted ?? 0} done`}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onPrimary} className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">{primaryLabel}</button>
        {mode !== "completed" && onEdit ? <button type="button" onClick={onEdit} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">Edit</button> : null}
        {mode !== "completed" && onCancel ? <button type="button" onClick={onCancel} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">Cancel</button> : null}
        {mode !== "completed" && onPublishChanges ? <button type="button" onClick={onPublishChanges} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Publish Changes</button> : null}
        {mode === "completed" ? <button type="button" onClick={onPrimary} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">Export Results</button> : null}
      </div>
    </div>
  );
}

function ExamGuruModal({
  messages,
  chatInput,
  setChatInput,
  onSend,
  onClose,
  onDraft,
  onPublish,
  examDraft,
  examForm,
  setExamForm,
  setExamDraft,
  setExamSourceName,
  programGroups,
  selectedProgramKey,
  selectedClassId,
  onProgram,
  onBatch,
  selectedProgramName,
  selectedBatchName,
  examSourceName,
}: {
  messages: ExamChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  onDraft: () => void;
  onPublish: () => void;
  examDraft: ExamDraft | null;
  examForm: ExamForm;
  setExamForm: React.Dispatch<React.SetStateAction<ExamForm>>;
  setExamDraft: React.Dispatch<React.SetStateAction<ExamDraft | null>>;
  setExamSourceName: (value: string) => void;
  programGroups: Array<{ key: string; name: string; classes: AssignedClass[] }>;
  selectedProgramKey?: string;
  selectedClassId?: string;
  onProgram: (key: string) => void;
  onBatch: (batchId: string) => void;
  selectedProgramName: string;
  selectedBatchName: string;
  examSourceName: string;
}) {
  const [examStep, setExamStep] = useState<1 | 2 | 3 | 4>(1);
  const activeProgram = programGroups.find((program) => program.key === selectedProgramKey) ?? programGroups[0] ?? null;
  const activeBatch = activeProgram?.classes.find((batch) => batch.id === selectedClassId) ?? activeProgram?.classes[0] ?? null;
  const assignedSubjects = subjectsForBatch(activeBatch);
  const draftQuestions = examDraft?.questions ?? [];
  const pastedQuestionCount = examForm.pastedQuestions
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean).length;
  const detectedQuestionCount = draftQuestions.length || pastedQuestionCount || Number(examForm.questionCount || 0);
  const duplicateCount = Math.max(0, draftQuestions.length - new Set(draftQuestions.map((item) => item.question.trim().toLowerCase())).size);
  const difficultyCounts = draftQuestions.reduce<Record<string, number>>((counts, item) => {
    const key = (item.difficultyLevel || examForm.difficulty || "MEDIUM").toUpperCase();
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const markTotal = draftQuestions.reduce((total, item) => total + Number(item.marks ?? 0), 0) || Number(examForm.totalMarks || 0);
  const addInstruction = (instruction: string) => {
    setExamForm((form) => ({
      ...form,
      instructions: [form.instructions, `AI action: ${instruction}`].filter(Boolean).join("\n"),
    }));
  };
  const updateDraftQuestion = (index: number, value: string) => {
    setExamDraft((draft) => {
      if (!draft?.questions) return draft;
      return {
        ...draft,
        questions: draft.questions.map((question, currentIndex) => currentIndex === index ? { ...question, question: value } : question),
      };
    });
  };
  const appendSourceName = (label: string) => (value: string) => {
    if (!value) return;
    setExamSourceName([examSourceName, `${label}: ${value}`].filter(Boolean).join(" | "));
  };
  const stepItems = [
    { id: 1 as const, label: "Create Exam" },
    { id: 2 as const, label: "Add Questions" },
    { id: 3 as const, label: "Preview Paper" },
    { id: 4 as const, label: "Publish" },
  ];
  const hasQuestionSource = Boolean(examSourceName || examForm.pastedQuestions.trim() || examDraft?.questions?.length);
  const basicsReady = Boolean(selectedClassId && (examForm.subject || assignedSubjects.length) && examForm.title && examForm.publishDate && examForm.publishTime && examForm.duration && examForm.totalMarks);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f5ef] text-[var(--ink)]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Exams V3</p>
            <h2 className="text-2xl font-black">Create an exam</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Start with the few details a teacher naturally knows. Builder tools appear only after that.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close exam creator">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 grid gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm md:grid-cols-4">
          {stepItems.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setExamStep(step.id)}
              className={`rounded-xl px-4 py-3 text-sm font-black ${examStep === step.id ? "bg-slate-950 text-white" : "bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {examStep === 1 ? (
          <section className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <SectionHeader eyebrow="Step 1" title="Create Exam" description="A teacher should finish this screen in under one minute." icon={<ClipboardCheck size={20} />} />
            <div className="mt-5 grid gap-4">
              <Select label="Batch" value={selectedClassId ?? activeBatch?.id ?? ""} onChange={(value) => {
                const program = programGroups.find((item) => item.classes.some((batch) => batch.id === value));
                if (program) onProgram(program.key);
                onBatch(value);
              }}>
                {programGroups.flatMap((program) => program.classes.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                )))}
              </Select>
              <Select label="Subject" value={examForm.subject || assignedSubjects[0] || ""} onChange={(value) => setExamForm((form) => ({ ...form, subject: value, topic: form.topic || value }))}>
                {assignedSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </Select>
              <Input label="Exam Name" value={examForm.title} onChange={(value) => setExamForm((form) => ({ ...form, title: value }))} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Date" type="date" value={examForm.publishDate} onChange={(value) => setExamForm((form) => ({ ...form, publishDate: value }))} />
                <Input label="Time" type="time" value={examForm.publishTime} onChange={(value) => setExamForm((form) => ({ ...form, publishTime: value }))} />
                <Input label="Duration in minutes" type="number" value={examForm.duration} onChange={(value) => setExamForm((form) => ({ ...form, duration: value }))} />
                <Input label="Total Marks" type="number" value={examForm.totalMarks} onChange={(value) => setExamForm((form) => ({ ...form, totalMarks: value }))} />
                <Select label="Exam Type" value={examForm.examType} onChange={(value) => setExamForm((form) => ({ ...form, examType: value }))}>
                  <option value="Class Test">Class Test</option>
                  <option value="Unit Test">Unit Test</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Final Exam">Final Exam</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!examForm.subject && assignedSubjects[0]) setExamForm((form) => ({ ...form, subject: assignedSubjects[0], topic: form.topic || assignedSubjects[0] }));
                  setExamStep(2);
                }}
                disabled={!basicsReady}
                className="rounded-xl bg-emerald-700 px-5 py-4 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Exam
              </button>
            </div>
          </section>
        ) : null}

        {examStep === 2 ? (
          <section className="mx-auto max-w-6xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <SectionHeader eyebrow="Step 2" title="How do you want to create questions?" description="Choose one simple path. NIDUS handles the structure later." icon={<FileText size={20} />} />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <h3 className="text-lg font-black">Upload PDF</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Use a ready question paper.</p>
                <div className="mt-auto pt-5">
                  <FileInput label="Choose PDF" accept=".pdf" onChange={appendSourceName("PDF")} />
                </div>
              </div>
              <div className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <h3 className="text-lg font-black">Upload Word</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">DOC or DOCX from staff notes.</p>
                <div className="mt-auto pt-5">
                  <FileInput label="Choose Word" accept=".doc,.docx" onChange={appendSourceName("Word")} />
                </div>
              </div>
              <div className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <h3 className="text-lg font-black">Paste Questions</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Paste from WhatsApp, Word or notes.</p>
                <textarea value={examForm.pastedQuestions} onChange={(event) => setExamForm((form) => ({ ...form, pastedQuestions: event.target.value }))} rows={5} placeholder={"1. Question...\n2. Question...\n3. Question..."} className="mt-4 min-h-28 w-full flex-1 resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <h3 className="text-lg font-black">Generate with AI</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Use when no paper is ready.</p>
                <div className="mt-4 grid gap-3">
                  <Input label="Topic" value={examForm.topic} onChange={(value) => setExamForm((form) => ({ ...form, topic: value }))} />
                  <Select label="Difficulty" value={examForm.difficulty} onChange={(value) => setExamForm((form) => ({ ...form, difficulty: value }))}>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                  <Input label="Question Count" type="number" value={examForm.questionCount} onChange={(value) => setExamForm((form) => ({ ...form, questionCount: value }))} />
                </div>
              </div>
            </div>
            {examSourceName ? <p className="mt-4 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {examSourceName}</p> : null}
            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button type="button" onClick={() => setExamStep(1)} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Back</button>
              <button type="button" onClick={() => { void onDraft(); setExamStep(3); }} disabled={!hasQuestionSource && !examForm.topic} className="flex-1 rounded-xl bg-slate-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Prepare Question Paper</button>
            </div>
          </section>
        ) : null}

        {examStep === 3 ? (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 3" title="Preview paper" description="Now review the exam paper. AI tools appear here only after questions exist." icon={<BookOpen size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ReviewMetric label="Batch" value={selectedBatchName} />
                <ReviewMetric label="Subject" value={examForm.subject || "Subject pending"} />
                <ReviewMetric label="Questions" value={detectedQuestionCount || "Pending"} />
                <ReviewMetric label="Marks" value={markTotal || examForm.totalMarks || "Pending"} />
                <ReviewMetric label="Duration" value={`${examForm.duration || 0} min`} />
                <ReviewMetric label="Difficulty" value={examForm.difficulty} />
              </div>
              <div className="mt-4 grid gap-3">
                {draftQuestions.map((question, index) => (
                  <div key={`${question.question}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-dark)]">Question {index + 1}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{question.difficultyLevel || examForm.difficulty} / {question.marks ?? 1} mark(s)</span>
                    </div>
                    <textarea value={question.question} onChange={(event) => updateDraftQuestion(index, event.target.value)} className="mt-3 min-h-20 w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none" />
                    {question.options?.length ? <p className="mt-2 text-xs text-[var(--muted-blue)]">Options: {question.options.join(" / ")}</p> : null}
                    {question.answer ? <p className="mt-1 text-xs font-bold text-emerald-700">Answer: {question.answer}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => addInstruction(`Edit question ${index + 1}`)} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Edit</button>
                      <button type="button" onClick={() => setExamDraft((draft) => draft?.questions ? { ...draft, questions: draft.questions.filter((_, currentIndex) => currentIndex !== index) } : draft)} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Delete</button>
                      <button type="button" onClick={() => addInstruction(`Reorder question ${index + 1}`)} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Reorder</button>
                    </div>
                  </div>
                ))}
                {!draftQuestions.length ? <EmptyState text="Generate a draft or paste questions to let NIDUS GURU prepare the preview." /> : null}
                <button type="button" onClick={() => setExamDraft((draft) => ({ ...(draft ?? {}), questions: [...(draft?.questions ?? []), { question: "New question", marks: 1, difficultyLevel: examForm.difficulty }] }))} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Add Question</button>
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <button type="button" onClick={() => setExamStep(2)} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Back</button>
                <button type="button" onClick={() => setExamStep(4)} className="flex-1 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Preview Looks Good</button>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="NIDUS GURU" title="Review panel" description="Academic quality checks before this paper goes for approval." icon={<GraduationCap size={20} />} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ReviewMetric label="Questions detected" value={detectedQuestionCount || "Pending"} />
                <ReviewMetric label="Duplicate questions" value={duplicateCount} tone={duplicateCount ? "warn" : "ok"} />
                <ReviewMetric label="Syllabus mismatch" value={examForm.topic || examForm.subject ? "Check ready" : "Topic missing"} tone={examForm.topic || examForm.subject ? "ok" : "warn"} />
                <ReviewMetric label="Difficulty analysis" value={Object.entries(difficultyCounts).map(([key, value]) => `${key} ${value}`).join(", ") || examForm.difficulty} />
                <ReviewMetric label="Topic coverage" value={examForm.topic || examForm.subject || "Pending"} />
                <ReviewMetric label="Estimated duration" value={`${examForm.duration || 0} min`} />
              </div>
              <p className="mt-3 text-xs text-[var(--muted-blue)]">Total marks target: {markTotal || "Pending"}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Quick Fixes" title="AI actions" description="Use these only after a paper is uploaded, pasted or generated." icon={<Plus size={20} />} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Balance Difficulty", "Remove Duplicates", "Improve Language", "Add Answer Key", "Add Explanations", "Convert MCQ", "Convert Descriptive"].map((action) => (
                  <button key={action} type="button" onClick={() => addInstruction(action)} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-left text-xs font-black hover:bg-white">
                    {action}
                  </button>
                ))}
              </div>
              <button type="button" onClick={onDraft} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Run Review</button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Optional" title="Teacher instructions" description="Use this only for corrections like changing question 5." icon={<FileText size={20} />} />
              <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} rows={4} placeholder="Example: Make question 5 easier and add explanations for all MCQs." className="mt-4 min-h-28 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={onSend} className="mt-3 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black">Add Instruction</button>
              <div className="mt-3 grid gap-2">
                {messages.slice(-2).map((message) => (
                  <p key={message.id} className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs leading-5 text-[var(--muted-blue)]">{message.text}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Next" title="Ready for Academic Head review" description="When the paper looks correct, send it forward. NIDUS handles the internal approval steps." icon={<ClipboardCheck size={20} />} />
              <Textarea label="Instructions and exam rules" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={() => setExamStep(4)} className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Go To Publish</button>
            </div>
          </aside>
        </div>
        ) : null}

        {examStep === 4 ? (
          <section className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <SectionHeader eyebrow="Step 4" title="Submit for approval" description="The teacher only needs to submit. NIDUS handles Draft to Review in the background." icon={<ClipboardCheck size={20} />} />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ReviewMetric label="Batch" value={selectedBatchName} />
              <ReviewMetric label="Subject" value={examForm.subject || "Subject pending"} />
              <ReviewMetric label="Exam" value={examForm.title || "Untitled exam"} />
              <ReviewMetric label="Questions" value={detectedQuestionCount || "Pending"} />
              <ReviewMetric label="Date" value={examForm.publishDate || "Date pending"} />
              <ReviewMetric label="Duration" value={`${examForm.duration || 0} min`} />
            </div>
            <Textarea label="Optional instructions for Academic Head" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button type="button" onClick={() => setExamStep(3)} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Back To Preview</button>
              <button type="button" onClick={onPublish} className="flex-1 rounded-xl bg-emerald-700 px-5 py-4 text-base font-black text-white">Submit For Approval</button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ReviewMetric({ label, value, tone = "neutral" }: { label: string; value: React.ReactNode; tone?: "neutral" | "ok" | "warn" }) {
  const toneClass = tone === "ok" ? "bg-emerald-50 text-emerald-800" : tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-[var(--page-bg)] text-[var(--ink)]";
  return (
    <div className={`rounded-2xl border border-[var(--border)] p-3 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function AssignmentClassTile({ batch, active, onOpen }: { batch: AssignedClass; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`aspect-[1.45] rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.24em] ${active ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>Class</p>
          <h3 className="mt-2 text-lg font-black leading-tight">{batch.name}</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className={`rounded-full border px-3 py-1 ${active ? "border-white/30 text-white" : "border-[var(--border)] text-[var(--ink)]"}`}>{batch._count?.students ?? batch.students?.length ?? 0} students</span>
          <span className={`rounded-full border px-3 py-1 ${active ? "border-white/30 text-white" : "border-[var(--border)] text-[var(--ink)]"}`}>{subjectsForBatch(batch).length} subjects</span>
        </div>
      </div>
    </button>
  );
}

function AssignmentListItem({
  assignment,
  onOpen,
}: {
  assignment: AssignmentRecord;
  onOpen: () => void;
}) {
  const submitted = assignment.submissionStats?.submitted ?? assignment.submissions?.length ?? 0;
  const total = assignment.submissionStats?.totalStudents ?? 0;
  const dueLabel = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date";

  return (
    <article className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 md:grid-cols-[1fr_auto] md:items-center">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(assignment.status)}`}>{assignment.status || "PUBLISHED"}</span>
          <span className="text-sm font-black text-[var(--muted-blue)]">Due {dueLabel}</span>
        </div>
        <h4 className="mt-2 text-xl font-black">{assignment.title || "Untitled assignment"}</h4>
        <p className="mt-1 text-sm text-[var(--muted-blue)]">{assignment.subject || "Subject"} / {assignment.topic || "Homework"}</p>
      </button>
      <div className="flex flex-col gap-3 md:items-end">
        <p className="text-sm font-black">{submitted}/{total || "?"} submitted</p>
        <button type="button" onClick={onOpen} className="min-h-10 rounded-xl border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-black text-white">Open Submissions</button>
      </div>
    </article>
  );
}

function AssignmentEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-[var(--page-bg)] p-8 text-center">
      <h3 className="text-2xl font-black">No homework yet</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-blue)]">Create the first assignment for this batch. Add a title, due date, instructions and optional attachment.</p>
      <button type="button" onClick={onCreate} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-950 !bg-slate-950 px-6 py-3 text-sm font-black !text-white">
        <Plus size={18} /> New Homework
      </button>
    </div>
  );
}

function AssignmentDetailsModal({
  assignment,
  students,
  courseName,
  batchName,
  onClose,
  onReview,
}: {
  assignment: AssignmentRecord;
  students: NonNullable<AssignedClass["students"]>;
  courseName: string;
  batchName: string;
  onClose: () => void;
  onReview: (submissionId: string, reviewStatus: "REVIEWED" | "RETURNED") => void;
}) {
  const submissions = assignment.submissions ?? [];
  const submittedStudentIds = new Set(submissions.map((submission) => submission.studentId).filter(Boolean));
  const submittedNames = new Set(submissions.map((submission) => submission.studentName).filter(Boolean));
  const pendingStudents = students.filter((entry) => !submittedStudentIds.has(entry.student?.id) && !submittedNames.has(entry.student?.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Assignment Details</p>
            <h2 className="mt-2 text-2xl font-black">{assignment.title || "Untitled assignment"}</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{courseName} / {batchName} / {assignment.dueDate ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}` : "Due date pending"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close assignment details">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Submitted" value={assignment.submissionStats?.submitted ?? submissions.length} />
          <SummaryCard label="Pending" value={assignment.submissionStats?.pending ?? pendingStudents.length} />
          <SummaryCard label="Students" value={assignment.submissionStats?.totalStudents ?? students.length} />
          <SummaryCard label="Status" value={assignment.status || "PUBLISHED"} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <h3 className="text-xl font-black">Submitted students</h3>
            <div className="mt-4 grid gap-3">
              {submissions.map((submission, index) => (
                <div key={submission.id ?? `${submission.studentName}-${index}`} className="rounded-xl border border-[var(--border)] bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-black">{submission.studentName || "Student"}</p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{submission.reviewStatus || submission.status || "SUBMITTED"}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Time pending"}</p>
                  {submission.answerText ? <p className="mt-2 rounded-xl bg-[var(--page-bg)] p-3 text-sm leading-6">{submission.answerText}</p> : null}
                  {submission.attachmentName || submission.link ? <p className="mt-2 text-sm text-[var(--muted-blue)]">Attachment: {submission.attachmentName || submission.link}</p> : null}
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">Marks: {typeof submission.score === "number" ? submission.score : typeof submission.marks === "number" ? submission.marks : "Pending"}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">Feedback: {submission.feedback || "No feedback yet"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.id ? <button type="button" onClick={() => onReview(submission.id as string, "REVIEWED")} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Approve</button> : null}
                    {submission.id ? <button type="button" onClick={() => onReview(submission.id as string, "RETURNED")} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Needs Correction</button> : null}
                  </div>
                </div>
              ))}
              {!submissions.length ? <EmptyState text="Student submission records are not available yet." /> : null}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <h3 className="text-xl font-black">Pending students</h3>
            <div className="mt-4 grid gap-3">
              {pendingStudents.map((entry, index) => (
                <div key={studentId(entry, index)} className="rounded-xl border border-[var(--border)] bg-white p-3">
                  <p className="font-black">{entry.student?.name || entry.student?.email || "Student"}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">Submission pending</p>
                </div>
              ))}
              {!pendingStudents.length ? <EmptyState text={submissions.length ? "No pending students found from available submission records." : "Pending student list will appear when submission records are available."} /> : null}
            </div>
          </div>
        </div>
        <details className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <summary className="cursor-pointer text-sm font-black">Advanced Tools</summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {["Review Assignment", "Improve Questions", "Simplify Language", "Generate Rubric", "Convert To MCQ", "Convert To Descriptive", "Generate Model Answers"].map((action) => (
              <button key={action} type="button" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-left text-xs font-black hover:bg-[var(--page-bg)]">
                {action}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function AssignmentCreateModal({
  onClose,
  onSaveDraft,
  onPublish,
  assignmentForm,
  setAssignmentForm,
  setAssignmentSourceName,
  selectedClass,
  selectedBatchName,
  selectedStudentCount,
  assignmentSourceName,
}: {
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  assignmentForm: AssignmentForm;
  setAssignmentForm: React.Dispatch<React.SetStateAction<AssignmentForm>>;
  setAssignmentSourceName: (value: string) => void;
  selectedClass: AssignedClass | null;
  selectedBatchName: string;
  selectedStudentCount: number;
  assignmentSourceName: string;
}) {
  const assignedSubjects = subjectsForBatch(selectedClass);
  const appendAssignmentSource = (label: string) => (value: string) => {
    if (!value) return;
    setAssignmentSourceName([assignmentSourceName, `${label}: ${value}`].filter(Boolean).join(" | "));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3 py-5 text-[var(--ink)]">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">New Homework</p>
            <h2 className="mt-2 text-2xl font-black">{selectedBatchName}</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedStudentCount} students will receive this homework.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close assignment creator">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4">
            <label className="grid min-w-0 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-black">
              <span>Assignment Title</span>
              <input value={assignmentForm.title} onChange={(event) => setAssignmentForm((form) => ({ ...form, title: event.target.value }))} placeholder="English Grammar Worksheet" className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-3 text-base font-bold outline-none focus:border-[var(--ink)]" />
            </label>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-black">
                <span>Subject</span>
                <select value={assignmentForm.subject} onChange={(event) => setAssignmentForm((form) => ({ ...form, subject: event.target.value }))} className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]">
                  <option value="">Select subject</option>
                  {assignedSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-black">
                <span>Due Date</span>
                <input type="date" value={assignmentForm.dueDate} onChange={(event) => setAssignmentForm((form) => ({ ...form, dueDate: event.target.value }))} className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]" />
              </label>
            </div>

            <label className="grid min-w-0 gap-2 text-sm font-black">
              <span>Instructions</span>
              <textarea value={assignmentForm.instructions} onChange={(event) => setAssignmentForm((form) => ({ ...form, instructions: event.target.value }))} rows={4} placeholder="Write the homework instructions students should follow." className="w-full min-w-0 resize-y rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]" />
            </label>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-sm font-black">Attachment</p>
              <p className="mt-1 text-xs text-[var(--muted-blue)]">Upload a worksheet, notes file or image for students.</p>
              <div className="mt-4">
                <FileInput label="PDF / DOCX / Image" accept=".pdf,.doc,.docx,image/*" onChange={(value) => {
                  setAssignmentForm((form) => ({ ...form, attachmentName: value }));
                  appendAssignmentSource("Attachment")(value);
                }} />
              </div>
              {assignmentSourceName ? <p className="mt-3 truncate rounded-xl bg-white px-3 py-2 text-xs font-black">Attached: {assignmentSourceName}</p> : null}
            </div>

            <details className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <summary className="cursor-pointer text-sm font-black">Advanced Tools</summary>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Review Assignment", "Improve Questions", "Simplify Language", "Generate Rubric", "Convert To MCQ", "Convert To Descriptive", "Generate Model Answers"].map((action) => (
                  <button key={action} type="button" onClick={() => setAssignmentForm((form) => ({ ...form, instructions: [form.instructions, `Advanced tool requested: ${action}`].filter(Boolean).join("\n") }))} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-left text-xs font-black hover:bg-white">
                    {action}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="grid shrink-0 gap-3 border-t border-[var(--border)] bg-white p-5 sm:grid-cols-2">
          <button type="button" onClick={onSaveDraft} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-5 py-3 text-sm font-black text-[var(--ink)]">Save Draft</button>
          <button type="button" onClick={onPublish} className="min-h-12 w-full rounded-xl border border-emerald-700 bg-emerald-700 px-5 py-3 text-sm font-black text-white">Publish To Students</button>
        </div>
      </div>
    </div>
  );
}

function StudentProgressModal({
  student,
  programName,
  batchName,
  attendance,
  attendancePercent,
  assignments,
  materials,
  exams,
  progress,
  onClose,
}: {
  student: AssignedStudent;
  programName: string;
  batchName: string;
  attendance: Array<{ date?: string; subject?: string | null; status?: string; remarks?: string }>;
  attendancePercent: number;
  assignments: AssignmentRecord[];
  materials: MaterialRecord[];
  exams: ExamRecord[];
  progress: SyllabusProgressRecord[];
  onClose: () => void;
}) {
  const presentDays = attendance.filter((item) => item.status === "PRESENT").length;
  const absentDays = attendance.filter((item) => item.status === "ABSENT").length;
  const completedAssignments = assignments.reduce((total, assignment) => total + Number(assignment.submissionStats?.submitted ?? 0), 0);
  const pendingAssignments = assignments.reduce((total, assignment) => total + Number(assignment.submissionStats?.pending ?? 0), 0);
  const examAttempts = exams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? exam.attemptStats?.attempts ?? 0), 0);
  const averageScore = exams.length ? Math.round(exams.reduce((total, exam) => total + Number(exam.attemptStats?.averageScore ?? 0), 0) / exams.length) : 0;
  const completedTopics = progress.filter((item) => item.completionStatus === "COMPLETED").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
          <div className="flex gap-3">
            <StudentAvatar student={student} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Student Profile</p>
              <h2 className="mt-2 text-2xl font-black">{student.name || student.email || "Student"}</h2>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{programName} / {batchName} / Roll {student.rollNumber || student.id || "Pending"}</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{student.email || student.mobile || "Profile details pending"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close student progress">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Attendance" value={`${attendancePercent}%`} />
          <SummaryCard label="Present Days" value={presentDays} />
          <SummaryCard label="Absent Days" value={absentDays} />
          <SummaryCard label="Average Score" value={`${averageScore}%`} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SimpleCard eyebrow="Assignments" title={`${completedAssignments} completed`}>
            <p>{pendingAssignments} pending</p>
          </SimpleCard>
          <SimpleCard eyebrow="Exams" title={`${examAttempts} attempts`}>
            <p>Average score {averageScore}%</p>
          </SimpleCard>
          <SimpleCard eyebrow="Library Progress" title={`${materials.length} materials`}>
            <p>{completedTopics} topics completed</p>
          </SimpleCard>
          <SimpleCard eyebrow="Teacher Notes" title="Academic notes">
            <p>Notes entered by teachers will appear here.</p>
          </SimpleCard>
        </div>

        <div className="mt-5 grid gap-4">
          <ProgressPanel
            title="Attendance history"
            items={attendance.map((item, index) => ({
              id: `${item.date}-${index}`,
              title: item.date ? new Date(item.date).toLocaleDateString() : "Attendance",
              meta: `${item.subject || "Subject"}${item.remarks ? ` / ${item.remarks}` : ""}`,
              status: item.status || "PRESENT",
            }))}
            empty="No attendance records found for this student."
          />
          <ProgressPanel
            title="Syllabus progress"
            items={progress.map((item) => ({
              id: item.id,
              title: item.topic || "Topic",
              meta: item.subject || "Subject",
              status: item.completionStatus || item.progressColor || "PENDING",
            }))}
            empty="No syllabus progress recorded yet."
          />
          <ProgressPanel
            title="Assignments"
            items={assignments.map((item) => ({
              id: item.id,
              title: item.title || "Assignment",
              meta: `Submitted ${item.submissionStats?.submitted ?? 0} / ${item.submissionStats?.totalStudents ?? 0}, pending ${item.submissionStats?.pending ?? 0}`,
              status: item.status || "PUBLISHED",
            }))}
            empty="No assignments published yet."
          />
          <ProgressPanel
            title="Exams"
            items={exams.map((item) => ({
              id: item.id,
              title: item.title || "Exam",
              meta: `${item.topic || "Topic"} / average ${item.attemptStats?.averageScore ?? 0}`,
              status: item.status || "PUBLISHED",
            }))}
            empty="No exams conducted yet."
          />
          <ProgressPanel
            title="Recent activity"
            items={[
              ...attendance.slice(0, 3).map((item, index) => ({
                id: `activity-attendance-${index}`,
                title: item.date ? `Attendance ${new Date(item.date).toLocaleDateString()}` : "Attendance",
                meta: item.remarks || item.subject || "Class attendance",
                status: item.status || "PRESENT",
              })),
              ...assignments.slice(0, 3).map((item) => ({
                id: `activity-assignment-${item.id}`,
                title: item.title || "Assignment",
                meta: item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString()}` : "Due date pending",
                status: item.status || "PUBLISHED",
              })),
            ]}
            empty="No recent activity recorded yet."
          />
          <ProgressPanel
            title="Progress timeline"
            items={progress.map((item) => ({
              id: `timeline-${item.id}`,
              title: item.topic || "Topic",
              meta: item.remarks || item.subject || "Syllabus progress",
              status: item.completionStatus || "PENDING",
            }))}
            empty="Progress timeline will appear after syllabus logs are recorded."
          />
        </div>
      </div>
    </div>
  );
}

function LibraryProgramSelector({
  programGroups,
  selectedProgramKey,
  selectedClassId,
  onProgram,
  onBatch,
}: {
  programGroups: Array<{ key: string; name: string; classes: AssignedClass[] }>;
  selectedProgramKey?: string;
  selectedClassId?: string;
  onProgram: (key: string) => void;
  onBatch: (batchId: string) => void;
}) {
  const selectedProgram = programGroups.find((program) => program.key === selectedProgramKey) ?? programGroups[0] ?? null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Program</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {programGroups.map((program) => (
          <button key={program.key} type="button" onClick={() => onProgram(program.key)} className={`rounded-2xl border p-4 text-left ${selectedProgram?.key === program.key ? "border-[var(--ink)] bg-[var(--page-bg)] shadow-sm" : "border-[var(--border)] bg-white"}`}>
            <h3 className="font-black">{program.name}</h3>
            <p className="mt-2 text-sm text-[var(--muted-blue)]">{program.classes.length} batch(es)</p>
          </button>
        ))}
        {!programGroups.length ? <EmptyState text="No assigned program is available yet." /> : null}
      </div>
      {selectedProgram ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedProgram.classes.map((batch) => (
            <button key={batch.id} type="button" onClick={() => onBatch(batch.id)} className={`rounded-full border px-4 py-2 text-sm font-black ${selectedClassId === batch.id ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
              {batch.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FolderCard({
  title,
  subtitle,
  active,
  archived,
  onClick,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  archived?: boolean;
  onClick: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${active ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"} ${archived ? "opacity-65" : ""}`}>
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-center gap-2">
          <Folder size={18} className="text-[var(--gold-dark)]" />
          <p className="text-lg font-black">{title}</p>
        </div>
        <p className="mt-1 text-xs text-[var(--muted-blue)]">{archived ? "Archived / " : ""}{subtitle}</p>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        {onRename ? <button type="button" onClick={onRename} className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-black">Rename</button> : null}
        {archived && onRestore ? <button type="button" onClick={onRestore} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-black text-emerald-700">Restore</button> : null}
        {!archived && onArchive ? <button type="button" onClick={onArchive} className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[10px] font-black text-amber-700">Archive</button> : null}
        {onDelete ? <button type="button" onClick={onDelete} className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-black text-rose-700">Delete</button> : null}
      </div>
    </div>
  );
}

function ExplorerFolder({
  title,
  subtitle,
  active,
  archived,
  onOpen,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  archived?: boolean;
  onOpen: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"} ${archived ? "opacity-60" : ""}`}>
      <button type="button" onClick={onOpen} className="grid w-full gap-3 text-left">
        <div className="relative h-24">
          <div className={`absolute left-0 top-3 h-16 w-28 rounded-lg border ${active ? "border-white/20 bg-white/20" : "border-amber-300 bg-amber-100"}`} />
          <div className={`absolute left-2 top-0 h-6 w-14 rounded-t-lg border ${active ? "border-white/20 bg-white/20" : "border-amber-300 bg-amber-200"}`} />
          <div className={`absolute left-0 top-5 grid h-16 w-32 place-items-center rounded-lg border text-xs font-black ${active ? "border-white/20 bg-white/10 text-white" : "border-amber-400 bg-amber-200 text-amber-950"}`}>
            <Folder size={28} />
          </div>
        </div>
        <div>
          <h4 className="line-clamp-2 text-lg font-black">{title}</h4>
          <p className={`mt-1 text-xs font-bold ${active ? "text-white/70" : "text-[var(--muted-blue)]"}`}>{archived ? "Archived / " : ""}{subtitle}</p>
        </div>
      </button>
      {(onRename || onArchive || onRestore || onDelete) ? (
        <details className="relative mt-4 border-t border-current/10 pt-3">
          <summary className={`inline-flex min-h-9 cursor-pointer list-none items-center justify-center rounded-lg border px-3 text-xs font-black ${active ? "border-white/30 text-white" : "border-[var(--border)] bg-white text-[var(--ink)]"}`}>More</summary>
          <div className="absolute left-0 z-20 mt-2 grid min-w-40 gap-1 rounded-xl border border-[var(--border)] bg-white p-2 text-slate-950 shadow-xl">
            {onRename ? <button type="button" onClick={onRename} className="rounded-lg px-3 py-2 text-left text-xs font-black hover:bg-[var(--page-bg)]">Rename</button> : null}
            {archived && onRestore ? <button type="button" onClick={onRestore} className="rounded-lg px-3 py-2 text-left text-xs font-black text-emerald-700 hover:bg-emerald-50">Restore</button> : null}
            {!archived && onArchive ? <button type="button" onClick={onArchive} className="rounded-lg px-3 py-2 text-left text-xs font-black text-amber-700 hover:bg-amber-50">Archive</button> : null}
            {onDelete ? <button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-left text-xs font-black text-rose-700 hover:bg-rose-50">Delete</button> : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function FolderCreateBox({ label, placeholder, value, onChange, onCreate }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-4">
      <p className="text-sm font-black">{label}</p>
      <div className="mt-3 flex gap-2">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm outline-none" />
        <button type="button" onClick={onCreate} className="rounded-xl border border-slate-950 !bg-slate-950 px-4 text-sm font-black !text-white">Create</button>
      </div>
    </div>
  );
}

function LibraryUploadPanel({
  form,
  activeSubject,
  activeTopic,
  onClose,
  onChange,
  onUploadMaterial,
  onPublish,
}: {
  form: typeof initialLibraryForm;
  activeSubject: string | null;
  activeTopic: string | null;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<typeof initialLibraryForm>>;
  onUploadMaterial: (file: File) => void;
  onPublish: () => void;
}) {
  const selectedSubject = activeSubject || form.subject || "Selected subject";
  const selectedTopic = form.topic.trim() || activeTopic || "General Lessons";
  const [localPreview, setLocalPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  useEffect(() => {
    return () => {
      if (localPreview?.url) URL.revokeObjectURL(localPreview.url);
    };
  }, [localPreview?.url]);
  const previewUrl = form.url || localPreview?.url || "";
  const previewName = form.fileName || localPreview?.name || "";
  const previewType = (form.type || localPreview?.type || "").toUpperCase();
  const isPreviewVideo = previewType.includes("VIDEO") || (localPreview?.type || "").startsWith("video/");
  const isPreviewPdf = previewType.includes("PDF") || (localPreview?.type || "").includes("pdf") || previewName.toLowerCase().endsWith(".pdf");
  const isPreviewImage = previewType.includes("IMAGE") || (localPreview?.type || "").startsWith("image/");
  const isPreviewPresentation = previewType.includes("PPT") || previewName.toLowerCase().endsWith(".ppt") || previewName.toLowerCase().endsWith(".pptx");
  const isPreviewWord = previewType.includes("WORD") || previewName.toLowerCase().endsWith(".doc") || previewName.toLowerCase().endsWith(".docx");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Upload Lesson</p>
            <h4 className="mt-2 text-2xl font-black">Upload lesson</h4>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs font-black">
              <span className="max-w-full rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--ink)]">
                Subject: <span className="break-words">{selectedSubject}</span>
              </span>
              <span className="max-w-full rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--muted-blue)]">
                Topic: <span className="break-words">{selectedTopic}</span>
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)]" aria-label="Close upload lesson">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid min-w-0 gap-4">
            <Input label="Lesson Title" value={form.title} onChange={(value) => onChange((current) => ({ ...current, title: value, lessonName: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder }))} />
            <Input label="Topic (Optional)" value={form.topic} onChange={(value) => onChange((current) => ({ ...current, topic: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder }))} />
            <div className="min-w-0 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-base font-black text-[var(--ink)]">Upload class file</p>
                <p className="text-xs font-bold leading-5 text-[var(--muted-blue)]">Video, PDF, DOCX, PPTX, image or notes. Preview appears before publishing.</p>
              </div>
              <div className="mt-4 min-w-0">
                <FileInput
                  label="Choose file"
                  accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,image/*,.txt"
                  onChange={(_value, file) => {
                    if (!file) return;
                    if (localPreview?.url) URL.revokeObjectURL(localPreview.url);
                    setLocalPreview({ url: URL.createObjectURL(file), name: file.name, type: file.type });
                    onUploadMaterial(file);
                  }}
                />
              </div>
              {previewName ? <p className="mt-3 break-all rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700">{form.url ? "Upload Complete" : "Preview Ready"}: {previewName}</p> : null}
            </div>
            <Textarea label="Lesson Notes (Optional)" value={form.description} onChange={(value) => onChange((current) => ({ ...current, description: value }))} />
          </div>
          <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Preview</p>
                <h5 className="mt-1 text-xl font-black">Check before publishing</h5>
              </div>
              {previewName ? <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{previewType || "FILE"}</span> : null}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
              {previewUrl && isPreviewVideo ? (
                <video className="aspect-video w-full bg-black" controls src={previewUrl} />
              ) : previewUrl && isPreviewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewName || "Lesson preview"} className="max-h-[420px] w-full object-contain bg-white" />
              ) : previewUrl && isPreviewPdf ? (
                <iframe src={previewUrl} title="PDF preview" className="h-[420px] w-full bg-white" />
              ) : previewUrl && (isPreviewPresentation || isPreviewWord) ? (
                <div className="grid min-h-[280px] place-items-center p-6 text-center">
                  <FileText className="mx-auto h-10 w-10 text-[var(--gold-dark)]" />
                  <h6 className="mt-3 text-lg font-black">Document selected</h6>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Word and PowerPoint files may not preview inside every browser. Open the file to verify it before publishing.</p>
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-4 rounded-xl border border-slate-950 bg-white px-4 py-3 text-sm font-black text-slate-950">Open File</a>
                </div>
              ) : (
                <div className="grid min-h-[280px] place-items-center p-6 text-center">
                  <FileText className="mx-auto h-10 w-10 text-[var(--gold-dark)]" />
                  <h6 className="mt-3 text-lg font-black">No file selected yet</h6>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Choose a video, PDF, image, Word or PowerPoint file. The teacher preview will appear here.</p>
                </div>
              )}
            </div>
            {previewUrl && !isPreviewVideo ? (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black text-[var(--ink)]">Open in new tab</a>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onPublish} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">
            <Plus size={18} /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}

function MaterialPreview({ title, type, thumbnailName }: { title: string; type: string; thumbnailName: string }) {
  return (
    <div className="w-44 rounded-2xl border border-[var(--border)] bg-white p-3">
      <div className="grid aspect-video place-items-center rounded-xl bg-[var(--page-bg)] text-center text-xs font-black text-[var(--muted-blue)]">
        {thumbnailName || "Thumbnail preview"}
      </div>
      <p className="mt-2 truncate text-sm font-black">{title || "Material title"}</p>
      <p className="text-xs text-[var(--muted-blue)]">{type || "Type"}</p>
    </div>
  );
}

function MaterialCard({
  material,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}: {
  material: MaterialRecord;
  onRename: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const type = material.type || "Material";
  const date = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : "Upload date pending";
  const archived = material.status === "ARCHIVED";
  const isVideo = type.toUpperCase().includes("VIDEO");
  const fileSize = material.fileSize ? `${(material.fileSize / 1024 / 1024).toFixed(1)} MB` : null;
  const duration = material.durationSeconds ? `${Math.max(1, Math.round(material.durationSeconds / 60))} min` : null;

  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 ${archived ? "opacity-65" : ""}`}>
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-white text-center text-xs font-black text-[var(--muted-blue)]">
        {material.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isVideo ? <PlayCircle size={26} /> : <FileText size={24} />}
            <span>{material.fileName || type}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ink)]">{type}</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-black">{material.title || "Untitled material"}</h4>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{material.lessonName || material.topic || "Lesson"} / {date}</p>
          {material.description ? <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-blue)]">{material.description}</p> : null}
          <p className="mt-2 text-xs font-black text-[var(--muted-blue)]">{[fileSize, duration].filter(Boolean).join(" / ") || "Details pending"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(material.reviewStatus || material.status)}`}>{material.reviewStatus || material.status || "LIVE"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {material.url ? (
          <a href={material.url} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">View</a>
        ) : (
          <button type="button" disabled className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-500">View</button>
        )}
        <button type="button" onClick={onRename} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-black">Rename</button>
        <details className="relative">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black">More</summary>
          <div className="absolute right-0 z-20 mt-2 grid min-w-36 gap-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">
            {archived ? (
              <button type="button" onClick={onRestore} className="rounded-lg px-3 py-2 text-left text-xs font-black text-emerald-700 hover:bg-emerald-50">Restore</button>
            ) : (
              <button type="button" onClick={onArchive} className="rounded-lg px-3 py-2 text-left text-xs font-black text-amber-700 hover:bg-amber-50">Archive</button>
            )}
            <button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-left text-xs font-black text-rose-700 hover:bg-rose-50">Delete</button>
          </div>
        </details>
      </div>
    </div>
  );
}

function AcademicCalendarOperationsCenter({
  isAcademicHead,
  dashboardBasePath,
  tab,
  onTab,
  batches,
  batchFilter,
  onBatchFilter,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  todayItems,
  weekDays,
  weekItems,
  weekTimeSlots,
  week,
  onWeek,
  month,
  onMonth,
  monthDays,
  dayTaskMap,
  calendarItems,
  completedItems,
  summary,
  facultyProgress,
  batchProgress,
  batchCalendarProgress,
  monitor,
  loading,
  onOpenClass,
  onOpenDay,
}: {
  isAcademicHead: boolean;
  dashboardBasePath: string;
  tab: CalendarTab;
  onTab: (tab: CalendarTab) => void;
  batches: AssignedClass[];
  batchFilter: string;
  onBatchFilter: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatusFilter: (value: string) => void;
  todayItems: CalendarItem[];
  weekDays: Date[];
  weekItems: CalendarItem[];
  weekTimeSlots: string[];
  week: Date;
  onWeek: (value: Date) => void;
  month: Date;
  onMonth: (value: Date) => void;
  monthDays: Array<Date | null>;
  dayTaskMap: Map<string, CalendarDayTask[]>;
  calendarItems: CalendarItem[];
  completedItems: CalendarItem[];
  summary: { today: number; completed: number; pending: number; cancelled: number; attendancePending: number; assignmentPending: number; examPending: number; reportingPending: number };
  facultyProgress: TeacherPerformanceItem[];
  batchProgress: BatchProgressItem[];
  batchCalendarProgress: Array<{ batchId: string; batchName: string; planned: number; completed: number; cancelled: number }>;
  monitor: CalendarMonitorItem[];
  loading: boolean;
  onOpenClass: (item: CalendarItem) => void;
  onOpenDay: (date: string) => void;
}) {
  const tabs: Array<{ key: CalendarTab; label: string }> = [
    { key: "TODAY", label: "Today" },
    { key: "WEEK", label: "This Week" },
    { key: "MONTH", label: "Month Calendar" },
    { key: "LOGS", label: "Class Logs" },
    ...(isAcademicHead ? [{ key: "FACULTY" as CalendarTab, label: "Faculty Progress" }, { key: "BATCHES" as CalendarTab, label: "Batch Progress" }] : []),
  ];
  const selectedBatch = batchFilter === "ALL" ? null : batches.find((batch) => batch.id === batchFilter) ?? null;
  const selectedStudentCount = selectedBatch?.students?.length ?? selectedBatch?._count?.students ?? 0;

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Academic Operations</p>
            <h1 className="mt-2 text-3xl font-black">{isAcademicHead ? "Academic operations center" : "My teaching timetable"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted-blue)]">Classes first. Open any session to take attendance, add work, start a live class, or complete the teaching log.</p>
          </div>
          <label className="grid gap-1 text-sm font-black lg:min-w-80">
            Batch
            <select value={batchFilter} onChange={(event) => onBatchFilter(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
              <option value="ALL">All assigned batches</option>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-2">
          {tabs.map((item) => (
            <button key={item.key} type="button" onClick={() => onTab(item.key)} className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-black ${tab === item.key ? "bg-slate-950 text-white" : "bg-[var(--page-bg)] text-slate-800"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isAcademicHead && tab === "TODAY" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            ["Today's Classes", summary.today], ["Completed", summary.completed], ["Pending", summary.pending], ["Cancelled", summary.cancelled],
            ["Attendance Pending", summary.attendancePending], ["Assignments Pending", summary.assignmentPending], ["Exam Reviews", summary.examPending], ["Logs Pending", summary.reportingPending],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[var(--border)] bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
        </div>
      ) : null}

      {tab === "TODAY" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Today</p><h2 className="mt-2 text-2xl font-black">{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</h2></div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{todayItems.length} class(es)</span>
            </div>
            <div className="mt-5 grid gap-3">
              {todayItems.map((item) => {
                const batch = batches.find((entry) => entry.id === item.batchId);
                const students = batch?.students?.length ?? batch?._count?.students ?? 0;
                return <CalendarClassCard key={item.id} item={item} students={students} onOpen={() => onOpenClass(item)} />;
              })}
              {!todayItems.length ? <EmptyState text={loading ? "Loading today's timetable..." : "No classes are scheduled for today in the selected batch."} /> : null}
            </div>
          </section>
          <aside className="grid content-start gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Current Scope</p>
              <h3 className="mt-2 text-xl font-black">{selectedBatch?.name || "All assigned batches"}</h3>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedBatch ? `${selectedStudentCount} students` : `${batches.length} active batches`}</p>
            </div>
            {isAcademicHead ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-700">Needs Attention</p>
                <div className="mt-4 grid gap-3 text-sm font-bold">
                  <p className="flex justify-between"><span>Classes not conducted</span><b>{summary.reportingPending}</b></p>
                  <p className="flex justify-between"><span>Missing attendance</span><b>{summary.attendancePending}</b></p>
                  <p className="flex justify-between"><span>Low progress groups</span><b>{monitor.filter((item) => item.status === "RED").length}</b></p>
                  <p className="flex justify-between"><span>Faculty follow-up</span><b>{facultyProgress.filter((item) => item.status === "RED").length}</b></p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {tab === "WEEK" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">This Week</p><h2 className="mt-2 text-2xl font-black">{week.toLocaleDateString([], { day: "numeric", month: "short" })} - {addDays(week, 5).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</h2></div>
            <div className="flex gap-2"><button type="button" onClick={() => onWeek(addDays(week, -7))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Prev</button><button type="button" onClick={() => onWeek(startOfWeek(new Date()))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Today</button><button type="button" onClick={() => onWeek(addDays(week, 7))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Next</button></div>
          </div>
          <div className="mt-5 hidden overflow-x-auto md:block">
            <div className="min-w-[980px] overflow-hidden rounded-xl border border-[var(--border)]">
              <div className="grid grid-cols-[110px_repeat(6,minmax(140px,1fr))] bg-slate-950 text-white"><div className="p-3 text-xs font-black uppercase">Time</div>{weekDays.map((day) => <div key={dateKey(day)} className="border-l border-white/20 p-3 text-center text-sm font-black">{day.toLocaleDateString([], { weekday: "short", day: "numeric" })}</div>)}</div>
              {weekTimeSlots.map((slot) => {
                const [start, end] = slot.split("|");
                return <div key={slot} className="grid min-h-28 grid-cols-[110px_repeat(6,minmax(140px,1fr))] border-t border-[var(--border)]"><div className="bg-[var(--page-bg)] p-3 text-sm font-black">{start}<br/><span className="text-xs text-[var(--muted-blue)]">{end}</span></div>{weekDays.map((day) => { const items = weekItems.filter((item) => dateKey(item.plannedDate) === dateKey(day) && `${item.startTime || "Time pending"}|${item.endTime || ""}` === slot); return <div key={dateKey(day)} className="grid content-start gap-2 border-l border-[var(--border)] p-2">{items.map((item) => <button key={item.id} type="button" onClick={() => onOpenClass(item)} className={`rounded-lg border p-2 text-left text-xs ${calendarStatusTone(calendarStatus(item))}`}><b className="block">{item.subject}</b><span className="mt-1 block">{item.batchName}</span><span className="mt-1 block opacity-75">{item.teacherName || "Teacher pending"}</span></button>)}</div>; })}</div>;
              })}
              {!weekTimeSlots.length ? <EmptyState text="No classes are scheduled for this week." /> : null}
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:hidden">{weekDays.map((day) => { const items = weekItems.filter((item) => dateKey(item.plannedDate) === dateKey(day)).sort((a,b) => String(a.startTime).localeCompare(String(b.startTime))); return <div key={dateKey(day)}><h3 className="mb-2 font-black">{day.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })}</h3><div className="grid gap-2">{items.map((item) => <CalendarClassCard key={item.id} item={item} students={batches.find((batch) => batch.id === item.batchId)?.students?.length ?? 0} compact onOpen={() => onOpenClass(item)} />)}{!items.length ? <p className="rounded-xl bg-[var(--page-bg)] p-3 text-sm text-[var(--muted-blue)]">No class</p> : null}</div></div>; })}</div>
        </section>
      ) : null}

      {tab === "MONTH" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2><div className="flex gap-2"><button type="button" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Prev</button><button type="button" onClick={() => onMonth(monthStartDate(new Date()))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Today</button><button type="button" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-[var(--border)] px-3 py-2 font-black">Next</button></div></div>
          <div className="mt-5 overflow-x-auto"><div className="min-w-[700px]"><div className="grid grid-cols-7 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day)=><span key={day} className="p-2">{day}</span>)}</div><div className="grid grid-cols-7 border-l border-t border-[var(--border)]">{monthDays.map((day,index) => { const key=day?dateKey(day):""; const tasks=key?dayTaskMap.get(key)??[]:[]; const classes=day?calendarItems.filter((item)=>sameDate(day,item.plannedDate)):[]; const completed=classes.filter((item)=>calendarStatus(item)==="COMPLETED").length; const pending=Math.max(0,classes.length-completed-classes.filter((item)=>calendarStatus(item)==="CANCELLED").length); return <button key={day?.toISOString()??`empty-${index}`} type="button" disabled={!day} onClick={()=>day&&onOpenDay(key)} className="min-h-28 border-b border-r border-[var(--border)] bg-white p-2 text-left disabled:bg-slate-50"><b>{day?.getDate()}</b>{day?<div className="mt-3 grid gap-1 text-xs"><span className="font-black">{classes.length} Classes</span>{completed?<span className="text-emerald-700">Completed {completed}</span>:null}{pending?<span className="text-amber-700">Pending {pending}</span>:null}{tasks.length>classes.length?<span className="text-blue-700">+{tasks.length-classes.length} activities</span>:null}</div>:null}</button>; })}</div></div></div>
        </section>
      ) : null}

      {tab === "LOGS" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Class Logs</p><h2 className="mt-2 text-2xl font-black">Teaching completion reports</h2></div><div className="grid gap-2 sm:grid-cols-2"><input value={search} onChange={(event)=>onSearch(event.target.value)} placeholder="Search batch, subject or teacher" className="min-h-11 rounded-lg border border-[var(--border)] px-3"/><select value={statusFilter} onChange={(event)=>onStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] px-3"><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option><option value="PARTIALLY_COMPLETED">Partially completed</option><option value="RESCHEDULED">Rescheduled</option><option value="CANCELLED">Cancelled</option></select></div></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-left text-sm"><thead><tr className="border-b border-[var(--border)] text-xs uppercase tracking-[0.1em] text-[var(--muted-blue)]">{["Date","Time","Batch","Subject","Teacher","Completion","Status",""] .map((head)=><th key={head} className="p-3">{head}</th>)}</tr></thead><tbody>{completedItems.map((item)=><tr key={item.id} className="border-b border-[var(--border)]"><td className="p-3 font-bold">{displayDate(item.plannedDate)}</td><td className="p-3">{item.startTime || "-"}</td><td className="p-3">{item.batchName || "-"}</td><td className="p-3 font-black">{item.subject}</td><td className="p-3">{item.teacherName || "Teacher pending"}</td><td className="p-3">{completionPercentFromLog(item.teacherLog, calendarStatus(item)==="COMPLETED"?100:0)}%</td><td className="p-3"><span className={`rounded-full border px-3 py-1 text-xs font-black ${calendarStatusTone(calendarStatus(item))}`}>{calendarStatus(item).replace(/_/g," ")}</span></td><td className="p-3"><button type="button" onClick={()=>onOpenClass(item)} className="rounded-lg border border-slate-950 px-3 py-2 font-black">View Report</button></td></tr>)}</tbody></table>{!completedItems.length?<EmptyState text="No completion reports match the current filters."/>:null}</div>
        </section>
      ) : null}

      {tab === "FACULTY" && isAcademicHead ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Faculty Progress</p><h2 className="mt-2 text-2xl font-black">Teaching delivery</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{facultyProgress.map((teacher)=><article key={teacher.teacherId} className="rounded-xl border border-[var(--border)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black">{teacher.teacherName}</h3><p className="mt-1 text-sm text-[var(--muted-blue)]">{teacher.assignedBatches} batches / {teacher.assignedSubjects.length} subjects</p></div><span className={`h-3 w-3 rounded-full ${teacher.status==="GREEN"?"bg-emerald-500":teacher.status==="ORANGE"?"bg-amber-500":"bg-rose-500"}`}/></div><div className="mt-4 grid gap-2 text-sm"><p className="flex justify-between"><span>Classes conducted</span><b>{teacher.classesConducted}</b></p><p className="flex justify-between"><span>Syllabus completion</span><b>{teacher.syllabusCompletionPercentage ?? 0}%</b></p><p className="flex justify-between"><span>Attendance submitted</span><b>{teacher.attendanceMarkingPercentage ?? 0}%</b></p><p className="flex justify-between"><span>Assignments</span><b>{teacher.assignmentsPublished}</b></p><p className="flex justify-between"><span>Exams</span><b>{teacher.examsPublished}</b></p></div></article>)}{!facultyProgress.length?<EmptyState text={loading?"Loading faculty progress...":"No faculty progress records are available."}/>:null}</div></section>
      ) : null}

      {tab === "BATCHES" && isAcademicHead ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Batch Progress</p><h2 className="mt-2 text-2xl font-black">Planned versus delivered</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{batchCalendarProgress.map((calendarBatch)=>{const health=batchProgress.find((item)=>item.batchId===calendarBatch.batchId);const progress=calendarBatch.planned?Math.round(calendarBatch.completed/calendarBatch.planned*100):0;return <article key={calendarBatch.batchId} className="rounded-xl border border-[var(--border)] p-4"><h3 className="text-lg font-black">{calendarBatch.batchName}</h3><p className="mt-1 text-sm text-[var(--muted-blue)]">{health?.studentCount ?? batches.find((batch)=>batch.id===calendarBatch.batchId)?.students?.length ?? 0} students</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${progress>=75?"bg-emerald-500":progress>=50?"bg-amber-500":"bg-rose-500"}`} style={{width:`${Math.min(100,progress)}%`}}/></div><div className="mt-4 grid gap-2 text-sm"><p className="flex justify-between"><span>Classes planned</span><b>{calendarBatch.planned}</b></p><p className="flex justify-between"><span>Completed</span><b>{calendarBatch.completed}</b></p><p className="flex justify-between"><span>Progress</span><b>{progress}%</b></p><p className="flex justify-between"><span>Attendance</span><b>{health?.attendancePercentage ?? 0}%</b></p><p className="flex justify-between"><span>Assignments</span><b>{health?.assignmentCompletionPercentage ?? 0}%</b></p><p className="flex justify-between"><span>Exam average</span><b>{health?.examAveragePercentage ?? 0}%</b></p></div></article>;})}{!batchCalendarProgress.length?<EmptyState text={loading?"Loading batch progress...":"No batch timetable progress is available."}/>:null}</div></section>
      ) : null}
    </div>
  );
}

function CalendarClassCard({ item, students, onOpen, compact = false }: { item: CalendarItem; students: number; onOpen: () => void; compact?: boolean }) {
  const status = calendarStatus(item);
  return (
    <article className={`rounded-xl border border-[var(--border)] bg-[var(--page-bg)] ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4"><div className="w-28 shrink-0"><p className="font-black">{item.startTime || "Time pending"}</p><p className="text-xs text-[var(--muted-blue)]">{item.endTime || ""}</p></div><div className="min-w-0"><h3 className={`${compact ? "text-base" : "text-xl"} font-black`}>{item.subject || "Scheduled class"}</h3><p className="mt-1 text-sm font-bold">{item.batchName || "Batch pending"}</p><p className="mt-1 text-sm text-[var(--muted-blue)]">{item.teacherName || "Teacher pending"} / {students} students</p>{item.topic?<p className="mt-1 text-sm text-[var(--muted-blue)]">{item.topic}</p>:null}</div></div>
        <div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${calendarStatusTone(status)}`}>{status.replace(/_/g," ")}</span><button type="button" onClick={onOpen} className="rounded-lg border border-slate-950 bg-white px-3 py-2 text-sm font-black text-slate-950">View Details</button></div>
      </div>
    </article>
  );
}

function completionPercentFromLog(log?: string | null, fallback = 0) {
  const match = String(log || "").match(/Completion:\s*(\d+)%/i);
  return match ? Number(match[1]) : fallback;
}

function CalendarClassDetailsModal({
  item,
  batch,
  workspace,
  dashboardBasePath,
  onClose,
  onComplete,
}: {
  item: CalendarItem;
  batch: AssignedClass | null;
  workspace: ClassWorkspace;
  dashboardBasePath: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const date = dateKey(item.plannedDate);
  const attendance = workspace.attendance.find((record) => record.batchId === item.batchId && dateKey(record.date) === date);
  const present = attendance?.records?.filter((record) => record.status === "PRESENT").length ?? 0;
  const totalStudents = batch?.students?.length ?? batch?._count?.students ?? 0;
  const assignments = workspace.assignments.filter((record) => !item.subject || record.subject === item.subject);
  const exams = workspace.exams.filter((record) => !item.subject || record.topic === item.topic || record.course === item.subject);
  const syllabus = workspace.progress.find((record) => record.subject === item.subject && record.topic === item.topic);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 md:p-5">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-white p-5">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Class Details</p><h2 className="mt-2 text-2xl font-black">{item.subject}</h2><p className="mt-1 text-sm text-[var(--muted-blue)]">{item.topic || "Topic pending"}</p></div>
          <button type="button" onClick={onClose} aria-label="Close class details" className="rounded-lg border border-[var(--border)] p-3"><X size={18}/></button>
        </div>
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Batch", item.batchName || batch?.name || "Pending"],
              ["Teacher", item.teacherName || "Teacher pending"],
              ["Date", new Date(item.plannedDate || "").toLocaleDateString()],
              ["Time", `${item.startTime || "Pending"}${item.endTime ? ` - ${item.endTime}` : ""}`],
              ["Students", totalStudents],
              ["Attendance", attendance ? `${present}/${attendance.records?.length ?? totalStudents}` : "Pending"],
              ["Assignments", assignments.length],
              ["Exams", exams.length],
            ].map(([label,value])=><div key={String(label)} className="rounded-xl bg-[var(--page-bg)] p-3"><p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">{label}</p><p className="mt-2 font-black">{value}</p></div>)}
          </div>
          <div className="mt-4 rounded-xl border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">Syllabus Progress</p><p className="mt-2 font-black">{syllabus?.completionStatus || item.completionStatus || "Pending"}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${calendarStatusTone(calendarStatus(item))}`}>{calendarStatus(item).replace(/_/g," ")}</span></div>{item.teacherLog?<pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-[var(--muted-blue)]">{item.teacherLog}</pre>:null}</div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`${dashboardBasePath}/classes`} className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">Start Live Class</Link>
            <Link href={`${dashboardBasePath}/attendance`} className="rounded-xl border border-slate-950 px-4 py-3 text-center text-sm font-black">Open Attendance</Link>
            <Link href={`${dashboardBasePath}/assignments`} className="rounded-xl border border-slate-950 px-4 py-3 text-center text-sm font-black">Create Assignment</Link>
            <Link href={`${dashboardBasePath}/exams`} className="rounded-xl border border-slate-950 px-4 py-3 text-center text-sm font-black">Create Exam</Link>
            <Link href={`${dashboardBasePath}/library`} className="rounded-xl border border-slate-950 px-4 py-3 text-center text-sm font-black">Open Library</Link>
            <button type="button" onClick={onComplete} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Mark Completed / Save Log</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassCompletionReportModal({ item, form, onChange, onClose, onSave }: { item: CalendarItem; form: CompletionReportForm; onChange: (form: CompletionReportForm) => void; onClose: () => void; onSave: () => void }) {
  const update = (key: keyof CompletionReportForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-3 md:p-5">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-white p-5"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Completion Report</p><h2 className="mt-2 text-2xl font-black">{item.subject} / {item.batchName}</h2></div><button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] p-3" aria-label="Close completion report"><X size={18}/></button></div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input label="Topic Covered" value={form.topicCovered} onChange={(value)=>update("topicCovered",value)} />
          <Input label="Subtopic Covered" value={form.subtopicCovered} onChange={(value)=>update("subtopicCovered",value)} />
          <Input label="Completion Percentage" type="number" value={form.completionPercentage} onChange={(value)=>update("completionPercentage",value)} />
          <Select label="Status" value={form.completionStatus} onChange={(value)=>update("completionStatus",value)}><option value="COMPLETED">Completed</option><option value="PARTIAL">Partially Completed</option><option value="RESCHEDULED">Rescheduled</option><option value="CANCELLED">Cancelled</option></Select>
          <div className="md:col-span-2"><Textarea label="Homework Given" value={form.homeworkGiven} onChange={(value)=>update("homeworkGiven",value)} /></div>
          <Select label="Student Participation" value={form.participation} onChange={(value)=>update("participation",value)}><option>Excellent</option><option>Good</option><option>Average</option><option>Low</option></Select>
          <Input label="Students Needing Attention" value={form.studentsNeedingAttention} onChange={(value)=>update("studentsNeedingAttention",value)} />
          <div className="md:col-span-2"><Textarea label="Support Required" value={form.supportRequired} onChange={(value)=>update("supportRequired",value)} /></div>
          <div className="md:col-span-2"><Textarea label="Teacher Remarks" value={form.teacherRemarks} onChange={(value)=>update("teacherRemarks",value)} /></div>
          <div className="flex gap-2 md:col-span-2 md:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] px-5 py-3 font-black">Cancel</button><button type="button" onClick={onSave} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white">Save Completion Report</button></div>
        </div>
      </div>
    </div>
  );
}

function FolderColumn({ title, emptyText, children }: { title: string; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{title}</p>
      <div className="mt-4 grid gap-3">{Children.count(children) ? children : <EmptyState text={emptyText} />}</div>
    </div>
  );
}

function CalendarDayTasksModal({
  date,
  batchName,
  tasks,
  onClose,
  onSelectClass,
}: {
  date: string;
  batchName?: string;
  tasks: CalendarDayTask[];
  onClose: () => void;
  onSelectClass: (calendarId: string) => void;
}) {
  const display = new Date(date).toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Today's Task</p>
            <h3 className="mt-2 text-2xl font-black">{display}</h3>
            <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{batchName || "Selected batch"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close day tasks">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${taskKindTone(task.kind)}`}>{taskKindLabel(task.kind)}</span>
                  <h4 className="mt-3 text-lg font-black">{task.title}</h4>
                  {task.subtitle ? <p className="mt-1 text-sm text-[var(--muted-blue)]">{task.subtitle}</p> : null}
                </div>
                <div className="text-right text-sm font-black">
                  <p>{task.time || "Time pending"}{task.endTime ? ` - ${task.endTime}` : ""}</p>
                  <p className="mt-1 text-xs text-[var(--muted-blue)]">{task.status || "Planned"}</p>
                </div>
              </div>
              {task.kind === "CLASS" && task.sourceId ? (
                <button type="button" onClick={() => onSelectClass(task.sourceId!)} className="mt-4 rounded-xl border border-slate-950 bg-white px-4 py-2 text-sm font-black text-slate-950">
                  Open Class Log
                </button>
              ) : null}
            </div>
          ))}
          {!tasks.length ? <EmptyState text="No classes, exams, assignments, live classes or announcements are scheduled for this date." /> : null}
        </div>
      </div>
    </div>
  );
}

function ProgramBatchPicker({
  programGroups,
  selectedProgramKey,
  selectedClassId,
  onProgram,
  onBatch,
}: {
  programGroups: Array<{ key: string; name: string; classes: AssignedClass[] }>;
  selectedProgramKey?: string;
  selectedClassId?: string;
  onProgram: (key: string) => void;
  onBatch: (batchId: string) => void;
}) {
  const selectedProgram = programGroups.find((program) => program.key === selectedProgramKey) ?? programGroups[0] ?? null;

  return (
    <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Choose class</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {programGroups.map((program) => (
          <button
            key={program.key}
            type="button"
            onClick={() => onProgram(program.key)}
            className={`min-w-40 rounded-2xl border px-4 py-3 text-left ${selectedProgram?.key === program.key ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}
          >
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Program</span>
            <span className="mt-2 block font-black">{program.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(selectedProgram?.classes ?? []).map((batch) => (
          <button
            key={batch.id}
            type="button"
            onClick={() => onBatch(batch.id)}
            className={`rounded-2xl border p-4 text-left ${selectedClassId === batch.id ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-white/70"}`}
          >
            <p className="font-black">{batch.name}</p>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.students?.length ?? batch._count?.students ?? 0} students</p>
          </button>
        ))}
      </div>
      {!programGroups.length ? <p className="text-sm text-[var(--muted-blue)] md:col-span-2">No assigned program is available yet. Only Academic Head or Director allocations will appear here.</p> : null}
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]" />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]">
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black md:col-span-2 xl:col-span-3">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--ink)]" />
    </label>
  );
}

function FileInput({ label, accept, onChange }: { label: string; accept?: string; onChange: (value: string, file?: File) => void }) {
  const [fileName, setFileName] = useState("");
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black">
      <span>{label}</span>
      <span className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black text-[var(--ink)]">
        Choose File
      </span>
      {fileName ? <span className="truncate text-xs font-bold text-[var(--muted-blue)]">{fileName}</span> : <span className="text-xs font-bold text-[var(--muted-blue)]">No file chosen</span>}
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setFileName(file?.name ?? "");
          onChange(file?.name ?? "", file);
        }}
        className="sr-only"
      />
    </label>
  );
}

function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "error" }) {
  return <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[var(--border)] bg-white text-[var(--muted-blue)]"}`}>{text}</p>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}

function SimpleCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone(eyebrow)}`}>{eyebrow}</span>
      <h3 className="mt-3 text-lg font-black">{title}</h3>
      <div className="mt-3 grid gap-1 text-sm text-[var(--muted-blue)]">{children}</div>
    </div>
  );
}

function DraftBox({ draft }: { draft: ExamDraft }) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="font-black">AI review draft</p>
      <p className="mt-2 text-sm text-[var(--muted-blue)]">{draft.draft || "Draft prepared for teacher review."}</p>
      <div className="mt-3 grid gap-2">
        {(draft.questions ?? []).slice(0, 4).map((question, index) => (
          <div key={`${question.question}-${index}`} className="rounded-xl bg-[var(--page-bg)] p-3 text-sm">
            <span className="font-black">Q{index + 1}.</span> {question.question}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceButton({ active, color, onClick, children }: { active: boolean; color: "green" | "red" | "amber"; onClick: () => void; children: React.ReactNode }) {
  const activeClass = color === "green" ? "bg-emerald-700 text-white" : color === "red" ? "bg-rose-700 text-white" : "bg-amber-600 text-white";
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-black ${active ? activeClass : "bg-white text-[var(--ink)]"}`}>
      {children}
    </button>
  );
}
