"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Children, useEffect, useMemo, useState } from "react";
import { uploadMediaFile } from "@/services/media";
import {
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
  teachers?: Array<{ subject?: string | null; teacher?: { id?: string; name?: string | null; email?: string | null } | null }>;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

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

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token") || window.localStorage.getItem("accessToken");
}

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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error((await response.text().catch(() => "")) || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
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
  if (isAcademicHead) return batch.role === "Subject Teacher";
  return true;
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
  const visibleLibraryMaterials = activeLibraryRecords.filter(
    (item) =>
      !isFolderMaterial(item) &&
      (item.subject || item.folder || "General") === activeLibrarySubject &&
      (item.topic || "General") === activeLibraryTopic &&
      (!librarySearch.trim() ||
        [item.title, item.lessonName, item.type, item.fileName, item.url, item.description, item.subject, item.topic]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(librarySearch.trim().toLowerCase())),
  );
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

  async function loadTeachingPlan() {
    setLoadingPlan(true);
    setMessage(null);
    try {
      const [data, liveData] = await Promise.all([
        apiGet<TeachingPlan | AssignedClass[]>(["/api/academy/my-teaching-plan", "/api/academy/teacher-assignments"]),
        apiGet<{ liveClasses?: LiveClassRecord[] }>(["/api/live-classes"]).catch(() => null),
      ]);
      const assigned = normalizeAssignedClasses(data);
      const plannedCalendar = Array.isArray(data) ? [] : data?.calendar ?? [];
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
    setLibraryPage(1);
  }, [activeLibrarySubject, activeLibraryTopic, librarySearch, showArchivedLibrary]);

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

  function setAllAttendance(status: "PRESENT" | "ABSENT" | "LEAVE") {
    setAttendance(Object.fromEntries(selectedStudents.map((entry, index) => [studentId(entry, index), status])));
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
        text: `Hello ${user?.name || "Teacher"}. What exam would you like to create today? Share the topic, notes, PDF, Word document, photos, syllabus content, or an existing question bank.`,
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
          ? "Noted. I will keep this correction with the draft. You can ask for more changes or publish when ready."
          : "Got it. Fill any missing exam fields on the right, then click Generate Question Bank.",
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
        text: `Hello ${user?.name || "Teacher"}. What assignment would you like to create today? Share the topic, notes, PDF, Word document, images, or reference links.`,
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
        text: "Noted. I have added that to the assignment instructions. You can generate a draft or publish after review.",
      },
    ]);
    setAssignmentForm((form) => ({
      ...form,
      instructions: [form.instructions, text].filter(Boolean).join("\n"),
      title: form.title || (form.topic ? `${form.topic} Assignment` : ""),
    }));
    setAssignmentChatInput("");
  }

  function generateAssignmentDraft() {
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
    setAssignmentForm((form) => ({ ...form, title, topic, instructions: form.instructions || draftText }));
    setAssignmentChatMessages((messages) => [...messages, { id: `guru-draft-${Date.now()}`, role: "guru", text: draftText }]);
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
      setAssignmentChatInput("");
      setShowAssignmentCreator(false);
      setAssignmentMessage("Assignment published to the selected batch.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : "Could not publish assignment.");
    }
  }

  async function publishLibraryMaterial() {
    if (!selectedClass) return;
    setLibraryMessage(null);
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/study-materials"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        course: programName(selectedClass),
        folder: libraryForm.folder || activeLibrarySubject,
        subject: libraryForm.subject || activeLibrarySubject,
        topic: libraryForm.topic || activeLibraryTopic,
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
      setLibraryMessage("Material published for review.");
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
    setLibraryMessage("Uploading file to secure storage...");
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
      setLibraryMessage("Upload complete. Review the lesson details, then publish.");
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
    try {
      const draft = await apiPost<ExamDraft>(["/api/academy/exams/ai-draft"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        subject: selectedClass.subject,
        course: programName(selectedClass),
        title: examForm.title,
        topic: examForm.topic || examForm.subject,
        questionCount: Number(examForm.questionCount || 20),
        duration: Number(examForm.duration || 30),
        difficulty: examForm.difficulty,
        instructions: [
          examForm.instructions,
          examForm.examType ? `Exam type: ${examForm.examType}` : "",
          examForm.subject ? `Subject: ${examForm.subject}` : "",
          examForm.totalMarks ? `Total marks: ${examForm.totalMarks}` : "",
          examForm.pastedQuestions ? `Pasted source questions:\n${examForm.pastedQuestions}` : "",
          examSourceName ? `Source attached: ${examSourceName}` : "",
        ].filter(Boolean).join("\n"),
      });
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
    setExamMessage(null);
    try {
      await apiPost<{ ok?: boolean }>(["/api/academy/exams"], {
        batchId: selectedClass.id,
        batchName: selectedClass.name,
        subject: selectedClass.subject,
        course: programName(selectedClass),
        title: examForm.title,
        topic: examForm.topic || examForm.subject,
        questionCount: Number(examForm.questionCount || 20),
        duration: Number(examForm.duration || 30),
        durationMinutes: Number(examForm.duration || 30),
        difficulty: examForm.difficulty,
        instructions: [
          examForm.instructions,
          examForm.examType ? `Exam type: ${examForm.examType}` : "",
          examForm.subject ? `Subject: ${examForm.subject}` : "",
          examForm.totalMarks ? `Total marks: ${examForm.totalMarks}` : "",
          examForm.pastedQuestions ? `Pasted source questions:\n${examForm.pastedQuestions}` : "",
          examForm.publishDate ? `Scheduled date: ${examForm.publishDate}` : "",
          examForm.publishTime ? `Scheduled time: ${examForm.publishTime}` : "",
          examSourceName ? `Source attached: ${examSourceName}` : "",
        ].filter(Boolean).join("\n"),
        draft: examDraft,
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
      setShowExamCreator(false);
      setExamChatInput("");
      setExamMessage("Exam published to students.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not publish exam.");
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
                <h2 className="mt-2 text-3xl font-black">Create, review, publish and manage student assessments.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Start with NIDUS GURU, review the generated question bank, then schedule the exam for the selected program and batch.</p>
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
          description="Question banks being prepared or waiting for teacher review."
          empty="No draft exams yet. Create a new exam with NIDUS GURU."
        >
          {localDraftExam ? <ExamWorkflowCard exam={localDraftExam} courseName={selectedProgram?.name ?? "Program pending"} batchName={selectedClass?.name ?? "Batch pending"} mode="draft" onPrimary={openExamCreator} /> : null}
          {draftExamCards.map((exam) => (
            <ExamWorkflowCard key={exam.id} exam={exam} batchName={exam.batchName ?? selectedClass?.name ?? "Batch"} courseName={exam.course ?? selectedProgram?.name ?? "Program"} mode="draft" onPrimary={openExamCreator} />
          ))}
        </ExamWorkflowSection>
        <ExamWorkflowSection
          title="Scheduled Exams"
          description="Published exams waiting for students to attempt."
          empty="No scheduled exams yet. Publish an exam from NIDUS GURU to place it here."
        >
          {scheduledExamCards.map((exam) => (
            <ExamWorkflowCard key={exam.id} exam={exam} batchName={exam.batchName ?? selectedClass?.name ?? "Batch"} courseName={exam.course ?? selectedProgram?.name ?? "Program"} mode="scheduled" onPrimary={openExamCreator} />
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
                <h2 className="mt-2 text-3xl font-black">Create and manage assignments.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Use NIDUS GURU to prepare assignments, publish to the selected batch, then track submitted and pending students.</p>
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

      {view === "attendance" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Attendance" title="Mark present and absent" description="Select program and batch, then mark each student with comments if needed." icon={<ClipboardCheck size={20} />} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <Input label="Date" type="date" value={attendanceDate} onChange={setAttendanceDate} />
          <button type="button" onClick={() => setAllAttendance("PRESENT")} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Mark all present</button>
          <button type="button" onClick={() => setAllAttendance("ABSENT")} className="rounded-xl bg-rose-700 px-4 py-3 text-sm font-black text-white">Mark all absent</button>
          <button type="button" onClick={() => void saveAttendance()} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black">Save Attendance</button>
        </div>
        {attendanceMessage ? <Notice text={attendanceMessage} /> : null}
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {selectedStudents.map((entry, index) => {
            const id = studentId(entry, index);
            const current = attendance[id] ?? "PRESENT";
            return (
              <div key={id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <h3 className="font-black">{entry.student?.name || entry.student?.email || "Student"}</h3>
                <div className="mt-3 flex gap-2">
                  <AttendanceButton active={current === "PRESENT"} color="green" onClick={() => setAttendance((value) => ({ ...value, [id]: "PRESENT" }))}>Present</AttendanceButton>
                  <AttendanceButton active={current === "ABSENT"} color="red" onClick={() => setAttendance((value) => ({ ...value, [id]: "ABSENT" }))}>Absent</AttendanceButton>
                  <AttendanceButton active={current === "LEAVE"} color="amber" onClick={() => setAttendance((value) => ({ ...value, [id]: "LEAVE" }))}>Leave</AttendanceButton>
                </div>
                <input value={attendanceComments[id] ?? ""} onChange={(event) => setAttendanceComments((value) => ({ ...value, [id]: event.target.value }))} placeholder="Comment" className="mt-3 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" />
              </div>
            );
          })}
          {!selectedStudents.length ? <EmptyState text="Select a batch with students to mark attendance." /> : null}
        </div>
      </section> : null}

      {view === "library" ? <section className="grid gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
              <Library size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Library</p>
              <h2 className="mt-2 text-3xl font-black">Course content manager.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Program to subject folder to topic folder to learning materials.</p>
            </div>
          </div>
        </div>
        <LibraryProgramSelector programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total Videos" value={libraryStats.videos} />
          <SummaryCard label="Total Documents" value={libraryStats.documents} />
          <SummaryCard label="Total Topics" value={libraryStats.topics} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Explorer Controls</p>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Create folders, archive safely, restore when needed, and permanently delete only with confirmation.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">
            <input type="checkbox" checked={showArchivedLibrary} onChange={(event) => setShowArchivedLibrary(event.target.checked)} />
            Show archived
          </label>
        </div>
        <div className="grid gap-4 lg:grid-cols-[280px_280px_1fr]">
          <FolderColumn title="Subject Folders" emptyText="Create the first subject folder.">
            {librarySubjects.map((subject) => (
              <FolderCard
                key={subject.name}
                title={subject.name}
                subtitle={`${subject.materials.filter((item) => !isFolderMaterial(item)).length} lesson(s)`}
                active={activeLibrarySubject === subject.name}
                archived={subject.folderRecord?.status === "ARCHIVED"}
                onClick={() => { setLibrarySubject(subject.name); setLibraryTopic(null); setShowLibraryUpload(false); }}
                onRename={() => void renameLibraryFolder("SUBJECT", subject.name)}
                onArchive={() => void archiveLibraryFolder("SUBJECT", subject.name)}
                onRestore={() => void restoreLibraryFolder("SUBJECT", subject.name)}
                onDelete={() => void deleteLibraryFolder("SUBJECT", subject.name)}
              />
            ))}
            <FolderCreateBox
              label="+ Create Subject Folder"
              placeholder="Mathematics"
              value={libraryForm.subject}
              onChange={(value) => setLibraryForm((form) => ({ ...form, subject: value, folder: value }))}
              onCreate={() => {
                if (!libraryForm.subject.trim()) return;
                void createLibraryFolder("SUBJECT", libraryForm.subject);
              }}
            />
          </FolderColumn>
          <FolderColumn title="Topic / Lesson Folders" emptyText="Select a subject, then create the first topic folder.">
            {libraryTopics.map((topic) => (
              <FolderCard
                key={topic.name}
                title={topic.name}
                subtitle={`${topic.materials.filter((item) => !isFolderMaterial(item)).length} lesson(s)`}
                active={activeLibraryTopic === topic.name}
                archived={topic.folderRecord?.status === "ARCHIVED"}
                onClick={() => { setLibraryTopic(topic.name); setShowLibraryUpload(false); }}
                onRename={() => void renameLibraryFolder("TOPIC", topic.name)}
                onArchive={() => void archiveLibraryFolder("TOPIC", topic.name)}
                onRestore={() => void restoreLibraryFolder("TOPIC", topic.name)}
                onDelete={() => void deleteLibraryFolder("TOPIC", topic.name)}
              />
            ))}
            {activeLibrarySubject ? (
              <FolderCreateBox
                label="+ Create Topic Folder"
                placeholder="Algebra"
                value={libraryForm.topic}
                onChange={(value) => setLibraryForm((form) => ({ ...form, topic: value, subject: form.subject || activeLibrarySubject, folder: form.folder || activeLibrarySubject }))}
                onCreate={() => {
                  if (!libraryForm.topic.trim()) return;
                  void createLibraryFolder("TOPIC", libraryForm.topic);
                }}
              />
            ) : null}
          </FolderColumn>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Learning Materials</p>
                <h3 className="mt-2 text-2xl font-black">{activeLibraryTopic || "Select topic folder"}</h3>
              </div>
              {activeLibraryTopic ? <button type="button" onClick={() => setShowLibraryUpload((value) => !value)} className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-950 !bg-slate-950 px-4 py-3 text-sm font-black !text-white"><FolderPlus size={16} /> Add Material</button> : null}
            </div>
            <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search materials..." className="mt-4 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 text-sm font-bold outline-none" />
            {showLibraryUpload && activeLibraryTopic ? (
              <LibraryUploadPanel
                form={libraryForm}
                activeSubject={activeLibrarySubject}
                activeTopic={activeLibraryTopic}
                onChange={setLibraryForm}
                onUploadMaterial={(file) => void uploadLibraryFile(file)}
                onUploadThumbnail={(file) => void uploadLibraryThumbnail(file)}
                onPublish={() => void publishLibraryMaterial()}
              />
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pagedLibraryMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onArchive={() => void archiveLibraryMaterial(material.id)}
                  onRestore={() => void restoreLibraryMaterial(material.id)}
                  onDelete={() => void deleteLibraryMaterial(material.id)}
                />
              ))}
              {!activeLibraryTopic ? <EmptyState text="Select a topic folder to view or upload materials." /> : null}
              {activeLibraryTopic && !visibleLibraryMaterials.length ? <EmptyState text="No material in this topic yet." /> : null}
            </div>
            {visibleLibraryMaterials.length > libraryPageSize ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm font-black">
                <button type="button" disabled={libraryPage <= 1} onClick={() => setLibraryPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 disabled:opacity-50">Previous</button>
                <span>Page {libraryPage} / {libraryTotalPages}</span>
                <button type="button" disabled={libraryPage >= libraryTotalPages} onClick={() => setLibraryPage((page) => Math.min(libraryTotalPages, page + 1))} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 disabled:opacity-50">Next</button>
              </div>
            ) : null}
          </div>
        </div>
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
}: {
  exam: Partial<ExamRecord> & { id: string };
  courseName: string;
  batchName: string;
  mode: ExamWorkflowMode;
  onPrimary: () => void;
}) {
  const status = mode === "draft" ? "Draft" : mode === "scheduled" ? "Scheduled" : "Completed";
  const scheduledDate = exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : "Date pending";
  const primaryLabel = mode === "draft" ? "Continue with NIDUS GURU" : mode === "scheduled" ? "View" : "View Results";
  const secondaryActions = mode === "draft" ? ["Open", "Edit", "Delete"] : mode === "scheduled" ? ["Edit", "Cancel", "Publish Changes"] : ["Export Results"];

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
        {secondaryActions.map((action) => (
          <button key={action} type="button" className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-xs font-black">{action}</button>
        ))}
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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">NIDUS Guru</p>
            <h2 className="text-2xl font-black">AI Exam Review Workspace</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Prepare, clean, review and publish an exam from existing questions and source files.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close exam creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Section 1" title="Exam Target" description="Select where this assessment will be published." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Select label="Batch" value={selectedClassId ?? ""} onChange={onBatch}>
                  <option value="">Select batch</option>
                  {(activeProgram?.classes ?? []).map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </Select>
                <Input label="Subject" value={examForm.subject} onChange={(value) => setExamForm((form) => ({ ...form, subject: value, topic: form.topic || value }))} />
                <Select label="Exam Type" value={examForm.examType} onChange={(value) => setExamForm((form) => ({ ...form, examType: value }))}>
                  <option value="Weekly Test">Weekly Test</option>
                  <option value="Revision Test">Revision Test</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Grand Test">Grand Test</option>
                  <option value="Previous Year Style">Previous Year Style</option>
                </Select>
                <Input label="Date" type="date" value={examForm.publishDate} onChange={(value) => setExamForm((form) => ({ ...form, publishDate: value }))} />
                <Input label="Duration" type="number" value={examForm.duration} onChange={(value) => setExamForm((form) => ({ ...form, duration: value }))} />
                <Input label="Total Marks" type="number" value={examForm.totalMarks} onChange={(value) => setExamForm((form) => ({ ...form, totalMarks: value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Exam Title" value={examForm.title} onChange={(value) => setExamForm((form) => ({ ...form, title: value }))} />
                <Input label="Time" type="time" value={examForm.publishTime} onChange={(value) => setExamForm((form) => ({ ...form, publishTime: value }))} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Section 2" title="Source Material" description="Paste or attach the questions teachers already prepared elsewhere." icon={<FileText size={20} />} />
              <div className="mt-4">
                <Textarea label="Paste Questions" value={examForm.pastedQuestions} onChange={(value) => setExamForm((form) => ({ ...form, pastedQuestions: value }))} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <FileInput label="Upload PDF" accept=".pdf" onChange={appendSourceName("PDF")} />
                <FileInput label="Upload Word" accept=".doc,.docx" onChange={appendSourceName("Word")} />
                <FileInput label="Upload Image" accept="image/*" onChange={appendSourceName("Image")} />
                <FileInput label="Upload Question Bank" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" onChange={appendSourceName("Question bank")} />
              </div>
              {examSourceName ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {examSourceName}</p> : null}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Section 5" title="Exam Preview" description="Review and edit the detected question list before publishing." icon={<BookOpen size={20} />} />
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
                  </div>
                ))}
                {!draftQuestions.length ? <EmptyState text="Generate a draft or paste questions to let NIDUS GURU prepare the preview." /> : null}
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Section 3" title="NIDUS GURU Review Panel" description="Academic quality checks before the exam goes to students." icon={<GraduationCap size={20} />} />
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
              <SectionHeader eyebrow="Section 4" title="AI Actions" description="Ask NIDUS GURU to improve the paper academically." icon={<Plus size={20} />} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Balance Difficulty", "Remove Duplicates", "Improve Language", "Add Answer Key", "Add Explanations", "Convert MCQ", "Convert Descriptive"].map((action) => (
                  <button key={action} type="button" onClick={() => addInstruction(action)} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-3 text-left text-xs font-black hover:bg-white">
                    {action}
                  </button>
                ))}
              </div>
              <button type="button" onClick={onDraft} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Run NIDUS GURU Review</button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="AI Assistant" title="Optional Instructions" description="Use this only for corrections like changing question 5." icon={<FileText size={20} />} />
              <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} rows={4} placeholder="Example: Make question 5 easier and add explanations for all MCQs." className="mt-4 min-h-28 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={onSend} className="mt-3 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black">Add Instruction</button>
              <div className="mt-3 grid gap-2">
                {messages.slice(-2).map((message) => (
                  <p key={message.id} className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs leading-5 text-[var(--muted-blue)]">{message.text}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Section 6" title="Workflow Status" description="Human review remains mandatory before publish." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black">
                {["Draft", "Review", "Approve", "Publish"].map((step, index) => (
                  <span key={step} className={`rounded-xl border px-2 py-3 ${index === 0 || examDraft ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>{step}</span>
                ))}
              </div>
              <Textarea label="Instructions and exam rules" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={onPublish} className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Exam</button>
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
}: {
  assignment: AssignmentRecord;
  courseName: string;
  batchName: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:bg-[var(--page-bg)]">
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
      <span className="mt-4 inline-flex rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">Open Details</span>
    </button>
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
  selectedProgramName: string;
  selectedBatchName: string;
  assignmentSourceName: string;
}) {
  const assignmentLines = assignmentForm.pastedContent
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const instructionLines = assignmentForm.instructions
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const detectedTasks = assignmentLines.length || instructionLines.filter((line) => /^\d+[\).\s-]/.test(line)).length || 0;
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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">NIDUS Guru</p>
            <h2 className="text-2xl font-black">Assignment Builder</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">Create, review and publish classroom work without a chat-heavy flow.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close assignment creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 1" title="Assignment Details" description="Set the class, subject and deadline first." icon={<ClipboardCheck size={20} />} />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Batch</p>
                  <p className="mt-2 font-black">{selectedBatchName}</p>
                  <p className="mt-1 text-xs text-[var(--muted-blue)]">{selectedProgramName}</p>
                </div>
                <Input label="Subject" value={assignmentForm.subject} onChange={(value) => setAssignmentForm((form) => ({ ...form, subject: value }))} />
                <Input label="Topic" value={assignmentForm.topic} onChange={(value) => setAssignmentForm((form) => ({ ...form, topic: value, title: form.title || `${value} Assignment` }))} />
                <Input label="Assignment Title" value={assignmentForm.title} onChange={(value) => setAssignmentForm((form) => ({ ...form, title: value }))} />
                <Input label="Due Date" type="date" value={assignmentForm.dueDate} onChange={(value) => setAssignmentForm((form) => ({ ...form, dueDate: value }))} />
                <Select label="Difficulty" value={assignmentForm.difficulty} onChange={(value) => setAssignmentForm((form) => ({ ...form, difficulty: value }))}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 2" title="Source Material" description="Most teachers can paste ChatGPT questions or attach prepared files." icon={<FileText size={20} />} />
              <div className="mt-4">
                <Textarea label="Paste assignment content here" value={assignmentForm.pastedContent} onChange={(value) => setAssignmentForm((form) => ({ ...form, pastedContent: value }))} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FileInput label="Upload PDF" accept=".pdf" onChange={appendAssignmentSource("PDF")} />
                <FileInput label="Upload Word" accept=".doc,.docx" onChange={appendAssignmentSource("Word")} />
                <FileInput label="Upload PPT" accept=".ppt,.pptx" onChange={appendAssignmentSource("PPT")} />
                <FileInput label="Upload Notes" accept=".txt,.pdf,.doc,.docx" onChange={appendAssignmentSource("Notes")} />
                <FileInput label="Upload Images" accept="image/*" onChange={appendAssignmentSource("Images")} />
              </div>
              <Input label="Reference link" value={assignmentForm.link} onChange={(value) => setAssignmentForm((form) => ({ ...form, link: value }))} />
              {assignmentSourceName ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {assignmentSourceName}</p> : null}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 4" title="Assignment Preview" description="This is how students will read the assignment before submission." icon={<BookOpen size={20} />} />
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
                {assignmentForm.link || assignmentSourceName ? (
                  <div className="mt-4 grid gap-2 text-sm text-[var(--muted-blue)]">
                    {assignmentForm.link ? <p><b>Reference:</b> {assignmentForm.link}</p> : null}
                    {assignmentSourceName ? <p><b>Attachments:</b> {assignmentSourceName}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <SectionHeader eyebrow="Step 3" title="NIDUS GURU Assistant" description="Academic review actions without making chat the main screen." icon={<GraduationCap size={20} />} />
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
              <button type="button" onClick={onDraft} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-5 py-3 font-black text-white">Generate Draft</button>
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
              <SectionHeader eyebrow="Step 5" title="Publish" description="Teacher approval is required before students receive it." icon={<ClipboardCheck size={20} />} />
              <Textarea label="Instructions and evaluation criteria" value={assignmentForm.instructions} onChange={(value) => setAssignmentForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={onPublish} className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Assignment</button>
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
  onChange,
  onUploadMaterial,
  onUploadThumbnail,
  onPublish,
}: {
  form: typeof initialLibraryForm;
  activeSubject: string | null;
  activeTopic: string | null;
  onChange: React.Dispatch<React.SetStateAction<typeof initialLibraryForm>>;
  onUploadMaterial: (file: File) => void;
  onUploadThumbnail: (file: File) => void;
  onPublish: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Add material</p>
          <h4 className="mt-2 text-lg font-black">{activeSubject || "Subject"} / {activeTopic || "Topic"}</h4>
        </div>
        <MaterialPreview title={form.title} type={form.type} thumbnailName={form.thumbnailName} />
      </div>
      <FormGrid>
        <Input label="Lesson Name" value={form.lessonName} onChange={(value) => onChange((current) => ({ ...current, lessonName: value, title: current.title || value }))} />
        <Input label="Title" value={form.title} onChange={(value) => onChange((current) => ({ ...current, title: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder, topic: activeTopic || current.topic }))} />
        <Select label="Material type" value={form.type} onChange={(value) => onChange((current) => ({ ...current, type: value }))}>
          <option value="VIDEO">Recorded Video</option>
          <option value="PDF">PDF</option>
          <option value="PPT">PPT</option>
          <option value="WORD">Word Document</option>
          <option value="LINK">External Link</option>
          <option value="NOTE">Notes</option>
          <option value="IMAGE">Image</option>
          <option value="FILE">File</option>
        </Select>
        <Input label="External link" value={form.cloudinaryPublicId ? "Upload complete" : form.url} onChange={(value) => onChange((current) => ({ ...current, url: value, cloudinaryPublicId: "" }))} />
        <FileInput label="Upload File" accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,image/*,.txt" onChange={(value, file) => file ? onUploadMaterial(file) : onChange((current) => ({ ...current, fileName: value }))} />
        <FileInput label="Thumbnail preview" accept="image/*" onChange={(value, file) => file ? onUploadThumbnail(file) : onChange((current) => ({ ...current, thumbnailName: value }))} />
        <Textarea label="Description / notes" value={form.description} onChange={(value) => onChange((current) => ({ ...current, description: value }))} />
      </FormGrid>
      {form.fileName ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black">Upload Complete: {form.fileName}</p> : null}
      <button type="button" onClick={onPublish} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white"><FolderPlus size={16} /> Publish Material</button>
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
