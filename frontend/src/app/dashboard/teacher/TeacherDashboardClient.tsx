"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Children, useEffect, useMemo, useState } from "react";
import { uploadMediaFile } from "@/services/media";
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
  batchId?: string | null;
  batchName?: string | null;
  status?: string;
  completionStatus?: string;
  teacherLog?: string | null;
  nextAction?: string | null;
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
  date?: string;
  subject?: string | null;
  records?: Array<{ studentId?: string; studentName?: string; status?: string; remarks?: string }>;
};

type AssignmentRecord = {
  id: string;
  batchName?: string | null;
  course?: string | null;
  title?: string;
  topic?: string | null;
  instructions?: string | null;
  dueDate?: string | null;
  status?: string;
  createdAt?: string;
  submissionStats?: { submitted?: number; pending?: number; totalStudents?: number };
  submissions?: Array<{ id?: string; studentId?: string; studentName?: string; status?: string; marks?: number | null; feedback?: string | null; submittedAt?: string | null }>;
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
  batchName?: string | null;
  course?: string | null;
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

export type TeacherView = "classes" | "exams" | "assignments" | "attendance" | "library" | "academic-calendar";

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

function sameDate(value: Date, isoDate?: string) {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  return date.getFullYear() === value.getFullYear() && date.getMonth() === value.getMonth() && date.getDate() === value.getDate();
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
  const [selectedProgramKey, setSelectedProgramKey] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentModalId, setStudentModalId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState("ALL");
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
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
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "LEAVE">>({});
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});
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
  const [classWorkspace, setClassWorkspace] = useState<ClassWorkspace>(emptyWorkspace);
  const [calendarLog, setCalendarLog] = useState({ completionStatus: "COMPLETED", teacherLog: "", nextAction: "" });
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
  const isAcademicHead = isAcademicHeadRoute || user?.role?.toUpperCase() === "ACADEMIC_HEAD" || dashboardTemplate === "ACADEMIC_HEAD";
  const dashboardBasePath = isAcademicHead ? "/dashboard/academic-head" : "/dashboard/teacher";
  const activeClasses = useMemo(() => classes.filter((batch) => isTeacherClassAllocation(batch, isAcademicHead)), [classes, isAcademicHead]);
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
  const activeLibraryRecords = useMemo(
    () => classWorkspace.materials.filter((item) => showArchivedLibrary || item.status !== "ARCHIVED"),
    [classWorkspace.materials, showArchivedLibrary],
  );
  const librarySubjects = useMemo<LibraryFolderItem[]>(() => {
    const map = new Map<string, LibraryFolderItem>();
    for (const item of activeLibraryRecords) {
      const subject = item.subject || item.folder || "General";
      const current = map.get(subject) ?? { name: subject, materials: [] };
      current.materials.push(item);
      if (isFolderMaterial(item) && item.topic === "__SUBJECT__") current.folderRecord = item;
      map.set(subject, current);
    }
    if (libraryForm.subject && !map.has(libraryForm.subject)) map.set(libraryForm.subject, { name: libraryForm.subject, materials: [] });
    return Array.from(map.values());
  }, [activeLibraryRecords, libraryForm.subject]);
  const activeLibrarySubject = librarySubject ?? librarySubjects[0]?.name ?? null;
  const libraryTopics = useMemo<LibraryFolderItem[]>(() => {
    const map = new Map<string, LibraryFolderItem>();
    for (const item of activeLibraryRecords.filter((entry) => (entry.subject || entry.folder || "General") === activeLibrarySubject)) {
      const topic = item.topic && item.topic !== "__SUBJECT__" ? item.topic : "General";
      const current = map.get(topic) ?? { name: topic, materials: [] };
      current.materials.push(item);
      if (isFolderMaterial(item) && item.topic !== "__SUBJECT__") current.folderRecord = item;
      map.set(topic, current);
    }
    if (libraryForm.topic && libraryForm.subject === activeLibrarySubject && !map.has(libraryForm.topic)) map.set(libraryForm.topic, { name: libraryForm.topic, materials: [] });
    return Array.from(map.values());
  }, [activeLibraryRecords, activeLibrarySubject, libraryForm.subject, libraryForm.topic]);
  const activeLibraryTopic = libraryTopic ?? libraryTopics[0]?.name ?? null;
  const visibleLibraryMaterials = activeLibraryRecords
    .filter(
      (item) =>
        !isFolderMaterial(item) &&
        (item.subject || item.folder || "General") === activeLibrarySubject &&
        (!librarySearch.trim() ||
          [item.title, item.lessonName, item.type, item.fileName, item.url, item.description, item.subject, item.topic]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(librarySearch.trim().toLowerCase())),
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
  const attendancePresentCount = Math.max(0, selectedStudents.length - attendanceAbsentCount - attendanceLeaveCount);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.id]);

  useEffect(() => {
    if (!selectedProgramKey && programGroups[0]) setSelectedProgramKey(programGroups[0].key);
  }, [programGroups, selectedProgramKey]);

  useEffect(() => {
    if (activeBatchId && selectedClassId !== activeBatchId) setSelectedClassId(activeBatchId);
  }, [activeBatchId, selectedClassId]);

  useEffect(() => {
    if (view !== "library" || !selectedClass) return;
    const subjects = subjectsForBatch(selectedClass);
    if (!librarySubject || !subjects.includes(librarySubject)) setLibrarySubject(subjects[0] ?? "General");
  }, [librarySubject, selectedClass, view]);

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
      topic: "",
    });
    setLibraryMessage(null);
    setShowLibraryUpload(true);
  }

  function setAllAttendance(status: "PRESENT" | "ABSENT" | "LEAVE") {
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
    setShowAssignmentCreator(true);
    setAssignmentMessage(null);
    setAssignmentChatInput("");
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
      await apiPost<{ ok?: boolean }>(["/api/academy/attendance"], {
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
      });
      setAttendanceMessage("Attendance saved.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "Could not save attendance.");
    }
  }

  async function submitCalendarLog() {
    if (!selectedCalendarItem) return;
    setCalendarMessage(null);
    try {
      await apiPatch<CalendarItem>([`/api/academy/academic-calendar/${selectedCalendarItem.id}`], {
        completionStatus: calendarLog.completionStatus,
        teacherLog: calendarLog.teacherLog,
        nextAction: calendarLog.nextAction,
        status: calendarLog.completionStatus === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      });
      setCalendarMessage("Calendar log saved.");
      await loadTeachingPlan();
      if (selectedClass?.id) await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setCalendarMessage(error instanceof Error ? error.message : "Could not save calendar log.");
    }
  }

  async function publishAssignment() {
    if (!selectedClass) return;
    if (!assignmentWorkflow?.requestId || !assignmentWorkflow.draftId) {
      setAssignmentMessage("Generate a NIDUS GURU draft first. Draft, review and approval are mandatory before publish.");
      return;
    }
    setAssignmentMessage(null);
    try {
      await apiPost<{ id?: string }>([`/api/ai/workflow/drafts/${assignmentWorkflow.draftId}/reviews`], {
        reviewType: "TEACHER_REVIEW",
        status: "APPROVED",
        notes: "Teacher reviewed assignment preview in the NIDUS dashboard.",
        correctionJson: {
          title: assignmentForm.title,
          instructions: assignmentForm.instructions,
          pastedContent: assignmentForm.pastedContent,
        },
      });
      await apiPost<{ id?: string }>([`/api/ai/workflow/drafts/${assignmentWorkflow.draftId}/approvals`], {
        approvalType: "ASSIGNMENT_DRAFT_APPROVAL",
        notes: "Teacher approved assignment draft for publishing.",
      });
      const publication = await apiPost<{ id?: string }>([`/api/ai/workflow/requests/${assignmentWorkflow.requestId}/publications`], {
        draftId: assignmentWorkflow.draftId,
        targetType: "ASSIGNMENT",
        publishPayloadJson: {
          batchId: selectedClass.id,
          title: assignmentForm.title,
          dueDate: assignmentForm.dueDate,
          humanApprovalRequired: true,
        },
      });
      if (publication?.id) {
        await apiPost<{ id?: string }>([`/api/ai/workflow/publications/${publication.id}/approve`], {
          approvalType: "ASSIGNMENT_PUBLISH_APPROVAL",
          notes: "Teacher approved assignment publish target.",
        });
      }
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
      });
      if (publication?.id) {
        await apiPost<{ id?: string }>([`/api/ai/workflow/publications/${publication.id}/mark-published`], {});
      }
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
      setAssignmentMessage("Assignment sent through approval workflow and published to the selected batch.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not publish assignment.");
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

  const viewTitles: Record<TeacherView, string> = {
    classes: "Classes",
    exams: "Exams",
    assignments: "Assignments",
    attendance: "Attendance",
    library: "Library",
    "academic-calendar": "Academic Calendar",
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Teacher Dashboard</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--ink)]">{viewTitles[view]}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAcademicHead ? <Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black" href="/dashboard/director/academic">HOD</Link> : null}
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
            <>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <SectionHeader eyebrow="Classes" title="Teaching workspace" description="Only assigned batches appear here. Use each card to take attendance, start live classes, view students or check the schedule." icon={<GraduationCap size={20} />} />
              </div>
              {liveClassMessage ? <Notice text={liveClassMessage} /> : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeClasses.map((batch) => (
                  <TeachingWorkspaceCard
                    key={batch.id}
                    batch={batch}
                    href={`${dashboardBasePath}/classes/${programKey(batch)}/${batch.id}`}
                    attendanceHref={`${dashboardBasePath}/attendance`}
                    scheduleHref={`${dashboardBasePath}/academic-calendar`}
                    upcomingClass={(liveClassesByBatch.get(batch.id) ?? [])[0]}
                    calendarItem={calendar.find((item) => item.batchId === batch.id)}
                    onStartLive={() => openLiveClassCreator(batch)}
                    onRemember={() => chooseBatch(batch.id)}
                  />
                ))}
                {!activeClasses.length ? <ClassesEmptyState /> : null}
              </div>
            </>
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

      {view === "exams" ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
                <BookOpen size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Exams</p>
                <h2 className="mt-2 text-3xl font-black">Create tomorrow's exam in minutes.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Select batch, select subject, upload or paste the question paper, let NIDUS GURU review it, then send for approval.</p>
              </div>
            </div>
            <button type="button" onClick={openExamCreator} className="relative z-10 inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-950 !bg-slate-950 px-6 py-4 text-base font-black !text-white shadow-sm transition hover:-translate-y-0.5">
              <Plus size={20} /> Create New Exam
            </button>
          </div>
        </div>
        {examMessage ? <Notice text={examMessage} /> : null}
        <ExamWorkflowSection
          title="Draft Exams"
          description="Question papers being prepared or waiting for teacher review."
          empty="No draft exams yet. Upload, paste or create a question paper."
        >
          {localDraftExam ? <ExamWorkflowCard exam={localDraftExam} courseName={selectedProgram?.name ?? "Program pending"} batchName={selectedClass?.name ?? "Batch pending"} mode="draft" onPrimary={openExamCreator} /> : null}
          {draftExamCards.map((exam) => (
            <ExamWorkflowCard key={exam.id} exam={exam} batchName={exam.batchName ?? selectedClass?.name ?? "Batch"} courseName={exam.course ?? selectedProgram?.name ?? "Program"} mode="draft" onPrimary={openExamCreator} onEdit={() => void editExamRecord(exam)} onCancel={() => void cancelExamRecord(exam)} onPublishChanges={() => void publishExamRecordChanges(exam)} />
          ))}
        </ExamWorkflowSection>
        <ExamWorkflowSection
          title="Scheduled Exams"
          description="Approved exams waiting for students to attempt."
          empty="No scheduled exams yet. Send a reviewed paper for approval first."
        >
          {scheduledExamCards.map((exam) => (
            <ExamWorkflowCard key={exam.id} exam={exam} batchName={exam.batchName ?? selectedClass?.name ?? "Batch"} courseName={exam.course ?? selectedProgram?.name ?? "Program"} mode="scheduled" onPrimary={() => void editExamRecord(exam)} onEdit={() => void editExamRecord(exam)} onCancel={() => void cancelExamRecord(exam)} onPublishChanges={() => void publishExamRecordChanges(exam)} />
          ))}
        </ExamWorkflowSection>
        <ExamWorkflowSection
          title="Completed Exams"
          description="Attempts, average marks and result actions."
          empty="Completed exams will appear after students submit attempts."
        >
          {completedExamCards.map((exam) => (
            <ExamWorkflowCard key={exam.id} exam={exam} batchName={exam.batchName ?? selectedClass?.name ?? "Batch"} courseName={exam.course ?? selectedProgram?.name ?? "Program"} mode="completed" onPrimary={openExamCreator} />
          ))}
        </ExamWorkflowSection>
        {showExamCreator ? (
          <ExamGuruModal
            messages={examChatMessages}
            chatInput={examChatInput}
            setChatInput={setExamChatInput}
            onSend={sendExamChatMessage}
            onClose={() => setShowExamCreator(false)}
            onDraft={() => void createExamDraft()}
            onPublish={() => void publishExam()}
            examDraft={examDraft}
            examForm={examForm}
            setExamForm={setExamForm}
            setExamDraft={setExamDraft}
            setExamSourceName={setExamSourceName}
            programGroups={programGroups}
            selectedProgramKey={selectedProgram?.key}
            selectedClassId={selectedClass?.id}
            onProgram={chooseProgram}
            onBatch={chooseBatch}
            selectedProgramName={selectedProgram?.name ?? "Course"}
            selectedBatchName={selectedClass?.name ?? "Batch"}
            examSourceName={examSourceName}
          />
        ) : null}
      </section> : null}

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
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Select batch, select subject, upload a worksheet or paste questions, review, then send for approval.</p>
              </div>
            </div>
            <button type="button" onClick={openAssignmentCreator} className="relative z-10 inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-950 !bg-slate-950 px-6 py-4 text-base font-black !text-white shadow-sm transition hover:-translate-y-0.5">
              <Plus size={20} /> Create Assignment
            </button>
          </div>
        </div>
        {assignmentMessage ? <Notice text={assignmentMessage} /> : null}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black">Assignment cards</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">Open any assignment to review submissions, marks and feedback.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{classWorkspace.assignments.length} assignment(s)</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classWorkspace.assignments.map((assignment) => (
              <AssignmentWorkflowCard
                key={assignment.id}
                assignment={assignment}
                batchName={selectedClass?.name ?? assignment.batchName ?? "Batch"}
                courseName={selectedProgram?.name ?? assignment.course ?? "Course"}
                onOpen={() => setSelectedAssignmentId(assignment.id)}
                onEdit={() => void editAssignmentRecord(assignment)}
                onCancel={() => void cancelAssignmentRecord(assignment)}
                onPublishChanges={() => void publishAssignmentRecordChanges(assignment)}
              />
            ))}
            {!classWorkspace.assignments.length ? <AssignmentEmptyState onCreate={openAssignmentCreator} /> : null}
          </div>
        </div>
        {showAssignmentCreator ? (
          <AssignmentGuruModal
            messages={assignmentChatMessages}
            chatInput={assignmentChatInput}
            setChatInput={setAssignmentChatInput}
            onSend={sendAssignmentChatMessage}
            onClose={() => setShowAssignmentCreator(false)}
            onDraft={generateAssignmentDraft}
            onPublish={() => void publishAssignment()}
            assignmentForm={assignmentForm}
            setAssignmentForm={setAssignmentForm}
            setAssignmentSourceName={setAssignmentSourceName}
            programGroups={programGroups}
            selectedProgramKey={selectedProgram?.key}
            selectedClassId={selectedClass?.id}
            onProgram={chooseProgram}
            onBatch={chooseBatch}
            selectedProgramName={selectedProgram?.name ?? "Course"}
            selectedBatchName={selectedClass?.name ?? "Batch"}
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
          />
        ) : null}
      </section> : null}

      {view === "attendance" ? <section className="grid gap-5">
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
            {attendanceMessage ? <Notice text={attendanceMessage} /> : null}
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
      </section> : null}

      {view === "library" ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
                <Library size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">My Teaching Library</p>
                <h2 className="mt-2 text-3xl font-black">Upload a class for students to watch.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Select batch, choose subject, upload lesson. NIDUS handles folders, file type and storage in the background.</p>
              </div>
            </div>
            {selectedClass && activeLibrarySubject ? (
              <button type="button" onClick={openLibraryUpload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 !bg-slate-950 px-5 py-3 text-sm font-black !text-white">
                <Plus size={18} /> Upload Lesson
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Videos" value={libraryStats.videos} />
          <SummaryCard label="Files & Notes" value={libraryStats.documents} />
          <SummaryCard label="Topics" value={libraryStats.topics} />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Assigned Batches</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeClasses.map((batch) => {
              const subjects = subjectsForBatch(batch);
              const lessonCount = selectedClass?.id === batch.id ? activeLibraryRecords.filter((item) => !isFolderMaterial(item)).length : classWorkspace.materials.filter((item) => item.batchId === batch.id && !isFolderMaterial(item)).length;
              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => chooseBatch(batch.id)}
                  className={`min-h-40 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-1 ${selectedClass?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                >
                  <p className={`text-xs font-black uppercase tracking-[0.24em] ${selectedClass?.id === batch.id ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>{programName(batch)}</p>
                  <h3 className="mt-3 text-xl font-black">{batch.name}</h3>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-current/20 px-3 py-1">{batch.batchType || "Batch"}</span>
                    <span className="rounded-full border border-current/20 px-3 py-1">{batch._count?.students ?? batch.students?.length ?? 0} students</span>
                    <span className="rounded-full border border-current/20 px-3 py-1">{subjects.length} subjects</span>
                    <span className="rounded-full border border-current/20 px-3 py-1">{lessonCount} lessons</span>
                  </div>
                </button>
              );
            })}
            {!activeClasses.length ? <EmptyState text="No assigned batches yet. Classes assigned by the Academic Head or Director will appear here." /> : null}
          </div>
        </div>

        {selectedClass ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Subjects Assigned To Me</p>
                <h3 className="mt-2 text-2xl font-black">{selectedClass.name}</h3>
              </div>
              <p className="text-sm font-bold text-[var(--muted-blue)]">Choose the subject you taught.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {subjectsForBatch(selectedClass).map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => { setLibrarySubject(subject); setLibraryTopic(null); setShowLibraryUpload(false); }}
                  className={`min-h-12 rounded-xl border px-5 py-3 text-sm font-black ${activeLibrarySubject === subject ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {selectedClass && activeLibrarySubject ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Lessons</p>
                <h3 className="mt-2 text-3xl font-black">{activeLibrarySubject}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{programName(selectedClass)} / {selectedClass.name}</p>
              </div>
              <button type="button" onClick={openLibraryUpload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 !bg-slate-950 px-5 py-3 text-sm font-black !text-white">
                <Plus size={18} /> Upload Lesson
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search lessons..." className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 text-sm font-bold outline-none md:max-w-md" />
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
                  onArchive={() => void archiveLibraryMaterial(material.id)}
                  onRestore={() => void restoreLibraryMaterial(material.id)}
                  onDelete={() => void deleteLibraryMaterial(material.id)}
                />
              ))}
              {!visibleLibraryMaterials.length ? <EmptyState text="No lessons yet. Upload the first class recording or note for this subject." /> : null}
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

      {view === "academic-calendar" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Academic Calendar" title="Calendar and class logs" description="Click a date/topic, update completion, and management sees progress." icon={<CalendarDays size={20} />} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-black">{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">Prev</button>
                <button type="button" onClick={() => setCalendarMonth(monthStartDate(new Date()))} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">Today</button>
                <button type="button" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">Next</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayItems = day ? selectedCalendarItems.filter((item) => sameDate(day, item.plannedDate)) : [];
                return (
                  <div key={day?.toISOString() ?? `empty-${index}`} className="min-h-28 rounded-2xl border border-[var(--border)] bg-white p-2">
                    {day ? <p className="text-xs font-black">{day.getDate()}</p> : null}
                    <div className="mt-2 grid gap-1">
                      {dayItems.slice(0, 2).map((item) => (
                        <button key={item.id} type="button" onClick={() => { setSelectedCalendarId(item.id); setCalendarLog({ completionStatus: item.completionStatus || "COMPLETED", teacherLog: item.teacherLog || "", nextAction: item.nextAction || "" }); }} className={`rounded-lg px-2 py-1 text-left text-[0.68rem] font-black ${statusTone(item.completionStatus)}`}>
                          {item.topic || "Topic"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {!selectedCalendarItems.length ? <EmptyState text="No timetable or syllabus plan is assigned yet." /> : null}
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <h3 className="font-black">Class completion log</h3>
            <p className="mt-2 text-sm text-[var(--muted-blue)]">{selectedCalendarItem?.topic || "Select a calendar item to update."}</p>
            <div className="mt-4 grid gap-3">
              <Select label="Completion" value={calendarLog.completionStatus} onChange={(value) => setCalendarLog((form) => ({ ...form, completionStatus: value }))}><option value="COMPLETED">Completed</option><option value="PARTIAL">Partial</option><option value="PENDING">Pending</option></Select>
              <Textarea label="Teacher report / class log" value={calendarLog.teacherLog} onChange={(value) => setCalendarLog((form) => ({ ...form, teacherLog: value }))} />
              <Textarea label="Next action / support needed" value={calendarLog.nextAction} onChange={(value) => setCalendarLog((form) => ({ ...form, nextAction: value }))} />
              <button type="button" onClick={() => void submitCalendarLog()} className="rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Save Calendar Log</button>
            </div>
            {calendarMessage ? <Notice text={calendarMessage} /> : null}
          </div>
        </div>
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
            const upcomingClass = (liveClassesByBatch.get(batch.id) ?? [])[0];
            const calendarItem = calendar.find((item) => item.batchId === batch.id);
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

function TeachingWorkspaceCard({
  batch,
  href,
  attendanceHref,
  scheduleHref,
  upcomingClass,
  calendarItem,
  onStartLive,
  onRemember,
}: {
  batch: AssignedClass;
  href: string;
  attendanceHref: string;
  scheduleHref: string;
  upcomingClass?: LiveClassRecord;
  calendarItem?: CalendarItem;
  onStartLive: () => void;
  onRemember: () => void;
}) {
  const subjects = Array.from(new Set([batch.subject, ...(batch.teachers?.map((teacher) => teacher.subject) ?? [])].filter(Boolean))) as string[];
  const mode = batch.batchType || (batch.name.toUpperCase().includes("ONLINE") ? "ONLINE" : "OFFLINE");
  const studentCount = batch.students?.length ?? batch._count?.students ?? 0;
  const upcoming = upcomingClass
    ? `${upcomingClass.subject || "Class"} / ${new Date(upcomingClass.scheduledAt).toLocaleString()}`
    : calendarItem
      ? `${calendarItem.subject || "Class"} / ${calendarItem.plannedDate ? new Date(calendarItem.plannedDate).toLocaleDateString() : "planned"}`
      : "No upcoming class";
  const status = upcomingClass?.status || calendarItem?.status || "Planning pending";

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{programName(batch)}</p>
          <h3 className="mt-3 text-2xl font-black">{batch.name}</h3>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{mode}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricPill label="Students" value={studentCount} />
        <MetricPill label="Subjects" value={subjects.length || "Pending"} />
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm">
        <p className="font-black">Assigned Subjects</p>
        <p className="mt-1 text-[var(--muted-blue)]">{subjects.join(", ") || batch.subject || "Subject allocation pending"}</p>
      </div>
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm">
        <p className="font-black">Upcoming Class</p>
        <p className="mt-1 text-[var(--muted-blue)]">{upcoming}</p>
        <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black">{status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link onClick={onRemember} href={attendanceHref} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-center text-xs font-black">Take Attendance</Link>
        <button type="button" onClick={onStartLive} className="rounded-xl bg-[var(--ink)] px-3 py-3 text-xs font-black text-white">Start Live Class</button>
        <Link onClick={onRemember} href={href} className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-center text-xs font-black">View Students</Link>
        <Link onClick={onRemember} href={scheduleHref} className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-center text-xs font-black">View Schedule</Link>
      </div>
    </article>
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f5ef] text-[var(--ink)]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Exams V3</p>
            <h2 className="text-2xl font-black">Question paper first exam creator</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Select batch, subject, upload or paste the paper, review, then send for approval.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close exam creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 1" title="Select batch" description="Choose the batch that should receive this exam." icon={<Users size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {programGroups.flatMap((program) => program.classes.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => { onProgram(program.key); onBatch(batch.id); }}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedClassId === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                  >
                    <p className={`text-xs font-black uppercase tracking-[0.22em] ${selectedClassId === batch.id ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>{program.name}</p>
                    <h3 className="mt-2 text-lg font-black">{batch.name}</h3>
                    <p className="mt-2 text-xs font-bold opacity-80">{batch.students?.length ?? batch._count?.students ?? 0} students</p>
                  </button>
                )))}
                {!programGroups.length ? <EmptyState text="No assigned batches are available yet." /> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 2" title="Select subject" description="Show only the subjects assigned to this batch." icon={<BookOpen size={20} />} />
              <div className="mt-4 flex flex-wrap gap-3">
                {assignedSubjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setExamForm((form) => ({ ...form, subject, topic: form.topic || subject }))}
                    className={`min-h-12 rounded-xl border px-5 py-3 text-sm font-black ${examForm.subject === subject ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 3" title="Create exam" description="Only the basics teachers need before adding the question paper." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input label="Exam Name" value={examForm.title} onChange={(value) => setExamForm((form) => ({ ...form, title: value }))} />
                <Select label="Exam Type" value={examForm.examType} onChange={(value) => setExamForm((form) => ({ ...form, examType: value }))}>
                  <option value="Class Test">Class Test</option>
                  <option value="Unit Test">Unit Test</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Final Exam">Final Exam</option>
                </Select>
                <Input label="Marks" type="number" value={examForm.totalMarks} onChange={(value) => setExamForm((form) => ({ ...form, totalMarks: value }))} />
                <Input label="Duration" type="number" value={examForm.duration} onChange={(value) => setExamForm((form) => ({ ...form, duration: value }))} />
                <Input label="Date" type="date" value={examForm.publishDate} onChange={(value) => setExamForm((form) => ({ ...form, publishDate: value }))} />
                <Input label="Time" type="time" value={examForm.publishTime} onChange={(value) => setExamForm((form) => ({ ...form, publishTime: value }))} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 4" title="Add questions" description="Choose the fastest way to prepare tomorrow's exam." icon={<FileText size={20} />} />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <h3 className="text-lg font-black">Upload Question Paper</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">PDF, Word or image. NIDUS GURU structures the questions.</p>
                  <div className="mt-4 grid gap-2">
                    <FileInput label="Upload PDF" accept=".pdf" onChange={appendSourceName("PDF")} />
                    <FileInput label="Upload Word" accept=".doc,.docx" onChange={appendSourceName("Word")} />
                    <FileInput label="Upload Image" accept="image/*" onChange={appendSourceName("Image")} />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <h3 className="text-lg font-black">Paste Questions</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">Paste questions from ChatGPT, WhatsApp, Word or notes.</p>
                  <textarea value={examForm.pastedQuestions} onChange={(event) => setExamForm((form) => ({ ...form, pastedQuestions: event.target.value }))} rows={8} placeholder={"1. Question...\n2. Question...\n3. Question..."} className="mt-4 min-h-44 w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none" />
                </div>
                <div className="rounded-2xl border border-slate-950 bg-slate-950 p-4 text-white">
                  <h3 className="text-lg font-black">Create With NIDUS GURU</h3>
                  <p className="mt-2 text-sm text-white/75">Use only when the teacher wants AI to generate the paper.</p>
                  <div className="mt-4 grid gap-3">
                    <Input label="Topic" value={examForm.topic} onChange={(value) => setExamForm((form) => ({ ...form, topic: value }))} />
                    <Select label="Difficulty" value={examForm.difficulty} onChange={(value) => setExamForm((form) => ({ ...form, difficulty: value }))}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </Select>
                    <Input label="Question Count" type="number" value={examForm.questionCount} onChange={(value) => setExamForm((form) => ({ ...form, questionCount: value }))} />
                    <button type="button" onClick={onDraft} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950">Generate</button>
                  </div>
                </div>
              </div>
              {examSourceName ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {examSourceName}</p> : null}
              <button type="button" onClick={onDraft} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Review Question Paper With NIDUS GURU</button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 5" title="Exam Review" description="Review the student-facing question paper before sending for approval." icon={<BookOpen size={20} />} />
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
              <SectionHeader eyebrow="Step 6" title="Send for approval" description="Draft, review, approval and publish workflow remains mandatory." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black">
                {["Draft", "Review", "Approve", "Publish"].map((step, index) => (
                  <span key={step} className={`rounded-xl border px-2 py-3 ${index === 0 || examDraft ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>{step}</span>
                ))}
              </div>
              <Textarea label="Instructions and exam rules" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={onPublish} className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Send For Review</button>
            </div>
          </aside>
        </div>
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

function AssignmentWorkflowCard({
  assignment,
  courseName,
  batchName,
  onOpen,
  onEdit,
  onCancel,
  onPublishChanges,
}: {
  assignment: AssignmentRecord;
  courseName: string;
  batchName: string;
  onOpen: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onPublishChanges: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(assignment.status)}`}>{assignment.status || "PUBLISHED"}</span>
        <span className="text-xs font-black text-[var(--gold-dark)]">{assignment.dueDate ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}` : "Due date pending"}</span>
      </div>
      <h3 className="mt-4 text-xl font-black">{assignment.title || "Untitled assignment"}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{courseName} / {batchName}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{assignment.topic || "Topic pending"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{assignment.submissionStats?.submitted ?? 0} submitted</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{assignment.submissionStats?.pending ?? 0} pending</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{assignment.submissionStats?.totalStudents ?? 0} total</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onOpen} className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">Open Details</button>
        <button type="button" onClick={onEdit} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">Edit</button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">Cancel</button>
        <button type="button" onClick={onPublishChanges} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Publish Changes</button>
      </div>
    </article>
  );
}

function AssignmentEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-8 text-center">
      <h3 className="text-2xl font-black">No assignments created yet</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-blue)]">Create an assignment with NIDUS GURU, review the generated tasks, then publish it to students.</p>
      <button type="button" onClick={onCreate} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-950 !bg-slate-950 px-6 py-3 text-sm font-black !text-white">
        <Plus size={18} /> Create Assignment
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
}: {
  assignment: AssignmentRecord;
  students: NonNullable<AssignedClass["students"]>;
  courseName: string;
  batchName: string;
  onClose: () => void;
}) {
  const submissions = assignment.submissions ?? [];
  const submittedStudentIds = new Set(submissions.map((submission) => submission.studentId).filter(Boolean));
  const submittedNames = new Set(submissions.map((submission) => submission.studentName).filter(Boolean));
  const pendingStudents = submissions.length
    ? students.filter((entry) => !submittedStudentIds.has(entry.student?.id) && !submittedNames.has(entry.student?.name))
    : [];

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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{submission.status || "SUBMITTED"}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">Marks: {typeof submission.marks === "number" ? submission.marks : "Pending"}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">Feedback: {submission.feedback || "No feedback yet"}</p>
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
      </div>
    </div>
  );
}

function AssignmentGuruModal({
  messages,
  chatInput,
  setChatInput,
  onSend,
  onClose,
  onDraft,
  onPublish,
  assignmentForm,
  setAssignmentForm,
  setAssignmentSourceName,
  programGroups,
  selectedProgramKey,
  selectedClassId,
  onProgram,
  onBatch,
  selectedProgramName,
  selectedBatchName,
  assignmentSourceName,
}: {
  messages: AssignmentChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  onDraft: () => void;
  onPublish: () => void;
  assignmentForm: AssignmentForm;
  setAssignmentForm: React.Dispatch<React.SetStateAction<AssignmentForm>>;
  setAssignmentSourceName: (value: string) => void;
  programGroups: Array<{ key: string; name: string; classes: AssignedClass[] }>;
  selectedProgramKey?: string;
  selectedClassId?: string;
  onProgram: (key: string) => void;
  onBatch: (batchId: string) => void;
  selectedProgramName: string;
  selectedBatchName: string;
  assignmentSourceName: string;
}) {
  const [guruQuestionCount, setGuruQuestionCount] = useState("10");
  const activeProgram = programGroups.find((program) => program.key === selectedProgramKey) ?? programGroups[0] ?? null;
  const activeBatch = activeProgram?.classes.find((batch) => batch.id === selectedClassId) ?? activeProgram?.classes[0] ?? null;
  const assignedSubjects = subjectsForBatch(activeBatch);
  const assignmentLines = assignmentForm.pastedContent
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const instructionLines = assignmentForm.instructions
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const detectedTasks = assignmentLines.length || instructionLines.filter((line) => /^\d+[\).\s-]/.test(line)).length || 0;
  const estimatedCompletion = `${Math.max(10, (detectedTasks || Number(guruQuestionCount) || 4) * 5)} min`;
  const addAssignmentAction = (action: string) => {
    setAssignmentForm((form) => ({
      ...form,
      instructions: [form.instructions, `NIDUS GURU action: ${action}`].filter(Boolean).join("\n"),
    }));
  };
  const appendAssignmentSource = (label: string) => (value: string) => {
    if (!value) return;
    setAssignmentSourceName([assignmentSourceName, `${label}: ${value}`].filter(Boolean).join(" | "));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f5ef] text-[var(--ink)]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Assignments V3</p>
            <h2 className="text-2xl font-black">Homework first assignment creator</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Select batch, choose subject, upload or paste homework, review, then send for approval.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close assignment creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 1" title="Select batch" description="Show the teacher only assigned batches. No dropdown-first workflow." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {programGroups.flatMap((program) => program.classes.map((batch) => {
                  const active = batch.id === selectedClassId;
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => {
                        onProgram(program.key);
                        onBatch(batch.id);
                      }}
                      className={`min-h-32 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                    >
                      <p className={`text-xs font-black uppercase tracking-[0.22em] ${active ? "text-[#e7c873]" : "text-[var(--gold-dark)]"}`}>{program.name}</p>
                      <h3 className="mt-2 text-lg font-black">{batch.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full border border-current/20 px-3 py-1">{batch.batchType || "Batch"}</span>
                        <span className="rounded-full border border-current/20 px-3 py-1">{batch._count?.students ?? batch.students?.length ?? 0} students</span>
                        <span className="rounded-full border border-current/20 px-3 py-1">{subjectsForBatch(batch).length} subjects</span>
                      </div>
                    </button>
                  );
                }))}
                {!programGroups.length ? <EmptyState text="No assigned batches yet. Assignments can be created after Academic Head or Director allocation." /> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 2" title="Select subject" description="Pick from subjects assigned to this batch." icon={<BookOpen size={20} />} />
              <div className="mt-4 flex flex-wrap gap-3">
                {assignedSubjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setAssignmentForm((form) => ({ ...form, subject, title: form.title || `${subject} Homework` }))}
                    className={`min-h-12 rounded-xl border px-5 py-3 text-sm font-black ${assignmentForm.subject === subject ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]"}`}
                  >
                    {subject}
                  </button>
                ))}
                {!assignedSubjects.length ? <EmptyState text="No subjects are assigned to the selected batch yet." /> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 3" title="Create assignment" description="Keep the initial form small: title, due date and instructions." icon={<FileText size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input label="Assignment Title" value={assignmentForm.title} onChange={(value) => setAssignmentForm((form) => ({ ...form, title: value }))} />
                <Input label="Due Date" type="date" value={assignmentForm.dueDate} onChange={(value) => setAssignmentForm((form) => ({ ...form, dueDate: value }))} />
                <div className="md:col-span-2">
                  <Textarea label="Instructions" value={assignmentForm.instructions} onChange={(value) => setAssignmentForm((form) => ({ ...form, instructions: value }))} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 4" title="Add homework" description="Choose the fastest path: upload worksheet, paste questions, upload a file, or create with NIDUS GURU." icon={<FileText size={20} />} />
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Upload Worksheet</p>
                  <h3 className="mt-2 text-xl font-black">PDF, DOCX, image or worksheet</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">Students receive the worksheet directly after approval.</p>
                  <div className="mt-4">
                    <FileInput label="Choose Worksheet" accept=".pdf,.doc,.docx,image/*" onChange={appendAssignmentSource("Worksheet")} />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Paste Questions</p>
                  <h3 className="mt-2 text-xl font-black">Paste ChatGPT or typed questions</h3>
                  <Textarea label="Paste questions here" value={assignmentForm.pastedContent} onChange={(value) => setAssignmentForm((form) => ({ ...form, pastedContent: value }))} />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Upload PDF / DOCX</p>
                  <h3 className="mt-2 text-xl font-black">Assignment sheet, practice work or reading</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <FileInput label="Assignment Sheet" accept=".pdf,.doc,.docx" onChange={appendAssignmentSource("Assignment Sheet")} />
                    <FileInput label="Practice File" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={appendAssignmentSource("Practice File")} />
                  </div>
                  <Input label="Reference link" value={assignmentForm.link} onChange={(value) => setAssignmentForm((form) => ({ ...form, link: value }))} />
                </div>
                <div className="rounded-2xl border border-slate-950 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Create With NIDUS GURU</p>
                  <h3 className="mt-2 text-xl font-black">Generate simple homework</h3>
                  <div className="mt-4 grid gap-3">
                    <Input label="Topic" value={assignmentForm.topic} onChange={(value) => setAssignmentForm((form) => ({ ...form, topic: value, title: form.title || `${value} Homework` }))} />
                    <Select label="Difficulty" value={assignmentForm.difficulty} onChange={(value) => setAssignmentForm((form) => ({ ...form, difficulty: value }))}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </Select>
                    <Input label="Question Count" value={guruQuestionCount} onChange={setGuruQuestionCount} />
                    <button
                      type="button"
                      onClick={() => {
                        addAssignmentAction(`Create ${guruQuestionCount || "10"} ${assignmentForm.difficulty.toLowerCase()} questions on ${assignmentForm.topic || "selected topic"}`);
                        onDraft();
                      }}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                    >
                      Generate Homework
                    </button>
                  </div>
                </div>
              </div>
              {assignmentSourceName ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {assignmentSourceName}</p> : null}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 5" title="Assignment review" description="Check the student-facing homework before it enters approval." icon={<BookOpen size={20} />} />
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <ReviewMetric label="Program" value={activeProgram?.name ?? selectedProgramName} />
                <ReviewMetric label="Batch" value={activeBatch?.name ?? selectedBatchName} />
                <ReviewMetric label="Subject" value={assignmentForm.subject || "Pending"} tone={assignmentForm.subject ? "ok" : "warn"} />
                <ReviewMetric label="Questions" value={detectedTasks || "Pending"} tone={detectedTasks ? "ok" : "warn"} />
                <ReviewMetric label="Attachments" value={assignmentSourceName ? "Attached" : "Optional"} tone={assignmentSourceName ? "ok" : "neutral"} />
                <ReviewMetric label="Due Date" value={assignmentForm.dueDate || "Pending"} tone={assignmentForm.dueDate ? "ok" : "warn"} />
                <ReviewMetric label="Est. Time" value={estimatedCompletion} />
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{assignmentForm.subject || "Subject"} / {assignmentForm.difficulty}</p>
                    <h3 className="mt-2 text-2xl font-black">{assignmentForm.title || "Assignment title pending"}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{assignmentForm.topic || "Topic pending"} / Due {assignmentForm.dueDate || "not set"}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{detectedTasks || "No"} task(s) detected</span>
                </div>
                <div className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-7">
                  {assignmentForm.pastedContent || assignmentForm.instructions || "Paste content, upload material, or generate a NIDUS GURU draft to preview the assignment."}
                </div>
                {assignmentLines.length ? (
                  <div className="mt-4 grid gap-2">
                    {assignmentLines.slice(0, 8).map((line, index) => (
                      <div key={`${line}-${index}`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                        <b>Question {index + 1}.</b> {line.replace(/^\d+[\).\s-]*/, "")}
                      </div>
                    ))}
                  </div>
                ) : null}
                {assignmentForm.link || assignmentSourceName ? (
                  <div className="mt-4 grid gap-2 text-sm text-[var(--muted-blue)]">
                    {assignmentForm.link ? <p><b>Reference:</b> {assignmentForm.link}</p> : null}
                    {assignmentSourceName ? <p><b>Attachments:</b> {assignmentSourceName}</p> : null}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setAssignmentForm((form) => ({ ...form, pastedContent: [form.pastedContent, `${detectedTasks + 1}. New homework question`].filter(Boolean).join("\n") }))} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Add</button>
                  <button type="button" onClick={() => setAssignmentForm((form) => ({ ...form, pastedContent: "" }))} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Delete Questions</button>
                  <button type="button" onClick={() => addAssignmentAction("Teacher previewed assignment before review")} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Preview</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Assistant" title="NIDUS GURU tools" description="Use AI only when the teacher needs help improving the homework." icon={<GraduationCap size={20} />} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ReviewMetric label="Content lines" value={assignmentLines.length || "Pending"} />
                <ReviewMetric label="Detected tasks" value={detectedTasks || "Pending"} />
                <ReviewMetric label="Syllabus mismatch" value={assignmentForm.topic || assignmentForm.subject ? "Check ready" : "Topic missing"} tone={assignmentForm.topic || assignmentForm.subject ? "ok" : "warn"} />
                <ReviewMetric label="Rubric" value={assignmentForm.instructions.toLowerCase().includes("rubric") ? "Included" : "Suggested"} tone={assignmentForm.instructions.toLowerCase().includes("rubric") ? "ok" : "warn"} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Review Assignment", "Improve Questions", "Simplify Language", "Increase Difficulty", "Add Model Answers", "Generate Evaluation Rubric", "Convert To MCQ", "Convert To Descriptive"].map((action) => (
                  <button key={action} type="button" onClick={() => addAssignmentAction(action)} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-left text-xs font-black hover:bg-white">
                    {action}
                  </button>
                ))}
              </div>
              <button type="button" onClick={onDraft} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Create Homework Draft</button>
            </div>

            <details className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-black">Optional AI instruction chat</summary>
              <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} rows={4} placeholder="Example: Make this suitable for weaker students and add model answers." className="mt-4 min-h-28 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={onSend} className="mt-3 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black">Add Instruction</button>
              <div className="mt-3 grid gap-2">
                {messages.slice(-2).map((message) => (
                  <p key={message.id} className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs leading-5 text-[var(--muted-blue)]">{message.text}</p>
                ))}
              </div>
            </details>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 6" title="Send for review" description="Existing Draft -> Review -> Approval -> Publish workflow remains mandatory." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[0.68rem] font-black">
                {["Draft", "Review", "Approve", "Publish"].map((step, index) => (
                  <span key={step} className={`rounded-full px-2 py-2 ${index === 0 || assignmentForm.instructions || assignmentForm.pastedContent ? "bg-emerald-50 text-emerald-700" : "bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>{step}</span>
                ))}
              </div>
              <button type="button" onClick={onPublish} className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Send For Review</button>
              <p className="mt-3 text-xs leading-5 text-[var(--muted-blue)]">The teacher cannot skip the approval workflow. A NIDUS GURU draft is required before this action succeeds.</p>
            </div>
          </aside>
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Upload Lesson</p>
            <h4 className="mt-2 text-2xl font-black">Add recorded class</h4>
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

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4">
          <Input label="Lesson Title" value={form.title} onChange={(value) => onChange((current) => ({ ...current, title: value, lessonName: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder }))} />
          <Input label="Topic (Optional)" value={form.topic} onChange={(value) => onChange((current) => ({ ...current, topic: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder }))} />
          <div className="min-w-0 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-5">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-base font-black text-[var(--ink)]">Upload class file</p>
              <p className="text-xs font-bold leading-5 text-[var(--muted-blue)]">Video, PDF, DOCX, PPTX, image or notes. NIDUS handles file type, thumbnail and storage.</p>
            </div>
            <div className="mt-4 min-w-0">
              <FileInput label="Choose file" accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,image/*,.txt" onChange={(_value, file) => file ? onUploadMaterial(file) : undefined} />
            </div>
            {form.fileName ? <p className="mt-3 break-all rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700">Upload Complete: {form.fileName}</p> : null}
          </div>
          <Textarea label="Lesson Notes (Optional)" value={form.description} onChange={(value) => onChange((current) => ({ ...current, description: value }))} />
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
  onArchive,
  onRestore,
  onDelete,
}: {
  material: MaterialRecord;
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
          <p className="mt-2 text-xs font-black text-[var(--muted-blue)]">{[fileSize, duration].filter(Boolean).join(" / ") || "File metadata pending"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(material.reviewStatus || material.status)}`}>{material.reviewStatus || material.status || "LIVE"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {material.url ? (
          <a href={material.url} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">View</a>
        ) : (
          <button type="button" disabled className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-500">View</button>
        )}
        <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-black">Edit</button>
        {archived ? (
          <button type="button" onClick={onRestore} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700">Restore</button>
        ) : (
          <button type="button" onClick={onArchive} className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-black text-amber-700">Archive</button>
        )}
        <button type="button" onClick={onDelete} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700">Delete</button>
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
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          onChange(file?.name ?? "", file);
        }}
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal"
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
