"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Children, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderPlus,
  GraduationCap,
  Library,
  Plus,
  RefreshCw,
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
  subject?: string | null;
  role?: string | null;
  status?: string | null;
  course?: { title?: string | null; name?: string | null; slug?: string | null } | null;
  _count?: { students?: number; teachers?: number } | null;
  students?: Array<{ id?: string; student?: AssignedStudent | null; status?: string | null }>;
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
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  title?: string;
  description?: string | null;
  type?: string | null;
  url?: string | null;
  fileName?: string | null;
  thumbnailName?: string | null;
  createdAt?: string;
  status?: string;
  reviewStatus?: string | null;
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
  topic: string;
  questionCount: string;
  duration: string;
  difficulty: string;
  instructions: string;
  publishDate: string;
  publishTime: string;
};

type AssignmentForm = {
  title: string;
  topic: string;
  instructions: string;
  dueDate: string;
  attachmentName: string;
  link: string;
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
  const [attendanceDate, setAttendanceDate] = useState(todayDate());
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "LEAVE">>({});
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});
  const [showExamCreator, setShowExamCreator] = useState(false);
  const [showAssignmentCreator, setShowAssignmentCreator] = useState(false);
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
  const [showLibraryUpload, setShowLibraryUpload] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStartDate(new Date()));
  const [classWorkspace, setClassWorkspace] = useState<ClassWorkspace>(emptyWorkspace);
  const [calendarLog, setCalendarLog] = useState({ completionStatus: "COMPLETED", teacherLog: "", nextAction: "" });
  const [libraryForm, setLibraryForm] = useState(initialLibraryForm);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({ title: "", topic: "", instructions: "", dueDate: "", attachmentName: "", link: "" });
  const [examForm, setExamForm] = useState<ExamForm>({
    title: "",
    topic: "",
    questionCount: "20",
    duration: "30",
    difficulty: "MEDIUM",
    instructions: "",
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
  const librarySubjects = useMemo(() => {
    const subjects = new Set(classWorkspace.materials.map((item) => item.subject || item.folder || "General"));
    if (libraryForm.subject) subjects.add(libraryForm.subject);
    return Array.from(subjects);
  }, [classWorkspace.materials, libraryForm.subject]);
  const activeLibrarySubject = librarySubject ?? librarySubjects[0] ?? null;
  const libraryTopics = useMemo(() => {
    const topics = new Set(
      classWorkspace.materials
        .filter((item) => (item.subject || item.folder || "General") === activeLibrarySubject)
        .map((item) => item.topic || "General"),
    );
    if (libraryForm.topic && libraryForm.subject === activeLibrarySubject) topics.add(libraryForm.topic);
    return Array.from(topics);
  }, [activeLibrarySubject, classWorkspace.materials, libraryForm.subject, libraryForm.topic]);
  const activeLibraryTopic = libraryTopic ?? libraryTopics[0] ?? null;
  const visibleLibraryMaterials = classWorkspace.materials.filter(
    (item) =>
      (item.subject || item.folder || "General") === activeLibrarySubject &&
      (item.topic || "General") === activeLibraryTopic &&
      (!librarySearch.trim() ||
        [item.title, item.type, item.fileName, item.url, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(librarySearch.trim().toLowerCase())),
  );
  const libraryStats = useMemo(() => {
    const materials = classWorkspace.materials.filter((item) => (item.subject || item.folder || "General") === activeLibrarySubject);
    const videos = materials.filter((item) => (item.type || "").toUpperCase().includes("VIDEO")).length;
    const documents = materials.filter((item) => ["PDF", "PPT", "PPTX", "WORD", "DOC", "DOCX", "NOTE", "NOTES"].includes((item.type || "").toUpperCase())).length;
    return { videos, documents, topics: libraryTopics.length };
  }, [activeLibrarySubject, classWorkspace.materials, libraryTopics.length]);
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
      const data = await apiGet<TeachingPlan | AssignedClass[]>(["/api/academy/my-teaching-plan", "/api/academy/teacher-assignments"]);
      const assigned = normalizeAssignedClasses(data);
      const plannedCalendar = Array.isArray(data) ? [] : data?.calendar ?? [];
      setClasses(assigned);
      setCalendar(plannedCalendar);
      setSelectedProgramKey((current) => current ?? (assigned[0] ? programKey(assigned[0]) : null));
      setSelectedClassId((current) => current ?? assigned[0]?.id ?? null);
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
        apiGet<{ materials?: MaterialRecord[] }>([`/api/academy/study-materials?batchId=${batchId}`]),
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

  function chooseProgram(key: string) {
    const program = programGroups.find((item) => item.key === key);
    setSelectedProgramKey(key);
    setSelectedClassId(program?.classes[0]?.id ?? null);
    setStudentModalId(null);
    setSelectedAssignmentId(null);
    setLibrarySubject(null);
    setLibraryTopic(null);
    setShowLibraryUpload(false);
  }

  function chooseBatch(batchId: string) {
    setSelectedClassId(batchId);
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
      `Topic: ${topic}`,
      assignmentForm.dueDate ? `Due date: ${assignmentForm.dueDate}` : "Due date: not set",
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
      assignmentForm.instructions ? `Teacher instructions: ${assignmentForm.instructions}` : "Teacher instructions can be added in the chat.",
    ].join("\n");
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
        subject: selectedClass.subject,
        course: programName(selectedClass),
        title: assignmentForm.title,
        topic: assignmentForm.topic,
        instructions: assignmentForm.instructions,
        dueDate: assignmentForm.dueDate || undefined,
        attachmentName: assignmentForm.attachmentName || assignmentSourceName || undefined,
        link: assignmentForm.link || undefined,
      });
      setAssignmentForm({ title: "", topic: "", instructions: "", dueDate: "", attachmentName: "", link: "" });
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
        thumbnailName: libraryForm.thumbnailName || undefined,
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
        topic: examForm.topic,
        questionCount: Number(examForm.questionCount || 20),
        duration: Number(examForm.duration || 30),
        difficulty: examForm.difficulty,
        instructions: [examForm.instructions, examSourceName ? `Source attached: ${examSourceName}` : ""].filter(Boolean).join("\n"),
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
        topic: examForm.topic,
        questionCount: Number(examForm.questionCount || 20),
        duration: Number(examForm.duration || 30),
        durationMinutes: Number(examForm.duration || 30),
        difficulty: examForm.difficulty,
        instructions: [
          examForm.instructions,
          examForm.publishDate ? `Scheduled date: ${examForm.publishDate}` : "",
          examForm.publishTime ? `Scheduled time: ${examForm.publishTime}` : "",
          examSourceName ? `Source attached: ${examSourceName}` : "",
        ].filter(Boolean).join("\n"),
        draft: examDraft,
      });
      setExamForm({ title: "", topic: "", questionCount: "20", duration: "30", difficulty: "MEDIUM", instructions: "", publishDate: "", publishTime: "" });
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
            <SectionHeader eyebrow="Classes" title="Assigned programs" description="Only programs assigned by the Academic Head or Director appear here." icon={<GraduationCap size={20} />} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programGroups.map((program) => (
              <Link key={program.key} href={`${dashboardBasePath}/classes/${program.key}`} className="min-h-56 rounded-2xl border border-[var(--border)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:bg-[var(--page-bg)]">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Assigned program</p>
                <h3 className="mt-5 text-2xl font-black">{program.name}</h3>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <MetricPill label="Students" value={program.classes.reduce((total, batch) => total + (batch.students?.length ?? batch._count?.students ?? 0), 0)} />
                  <MetricPill label="Batches" value={program.classes.length} />
                </div>
                <span className="mt-6 inline-flex rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white">Open Program</span>
              </Link>
            ))}
            {!programGroups.length ? <ClassesEmptyState /> : null}
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
          </div>
        )}
      </section> : null}

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
            <button type="button" onClick={openExamCreator} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-4 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5">
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
            <button type="button" onClick={openAssignmentCreator} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-4 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5">
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
        <div className="grid gap-4 lg:grid-cols-[280px_280px_1fr]">
          <FolderColumn title="Subject Folders" emptyText="Create the first subject folder.">
            {librarySubjects.map((subject) => (
              <FolderCard key={subject} title={subject} subtitle={`${classWorkspace.materials.filter((item) => (item.subject || item.folder || "General") === subject).length} material(s)`} active={activeLibrarySubject === subject} onClick={() => { setLibrarySubject(subject); setLibraryTopic(null); setShowLibraryUpload(false); }} />
            ))}
            <FolderCreateBox
              label="+ Create Subject Folder"
              placeholder="Mathematics"
              value={libraryForm.subject}
              onChange={(value) => setLibraryForm((form) => ({ ...form, subject: value, folder: value }))}
              onCreate={() => {
                if (!libraryForm.subject.trim()) return;
                setLibrarySubject(libraryForm.subject.trim());
                setLibraryTopic(null);
                setShowLibraryUpload(false);
              }}
            />
          </FolderColumn>
          <FolderColumn title="Topic / Lesson Folders" emptyText="Select a subject, then create the first topic folder.">
            {libraryTopics.map((topic) => (
              <FolderCard key={topic} title={topic} subtitle={`${classWorkspace.materials.filter((item) => (item.subject || item.folder || "General") === activeLibrarySubject && (item.topic || "General") === topic).length} material(s)`} active={activeLibraryTopic === topic} onClick={() => { setLibraryTopic(topic); setShowLibraryUpload(false); }} />
            ))}
            {activeLibrarySubject ? (
              <FolderCreateBox
                label="+ Create Topic Folder"
                placeholder="Algebra"
                value={libraryForm.topic}
                onChange={(value) => setLibraryForm((form) => ({ ...form, topic: value, subject: form.subject || activeLibrarySubject, folder: form.folder || activeLibrarySubject }))}
                onCreate={() => {
                  if (!libraryForm.topic.trim()) return;
                  setLibraryTopic(libraryForm.topic.trim());
                  setShowLibraryUpload(false);
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
              {activeLibraryTopic ? <button type="button" onClick={() => setShowLibraryUpload((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white"><FolderPlus size={16} /> Add Material</button> : null}
            </div>
            <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search materials..." className="mt-4 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 text-sm font-bold outline-none" />
            {showLibraryUpload && activeLibraryTopic ? (
              <LibraryUploadPanel
                form={libraryForm}
                activeSubject={activeLibrarySubject}
                activeTopic={activeLibraryTopic}
                onChange={setLibraryForm}
                onPublish={() => void publishLibraryMaterial()}
              />
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleLibraryMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} onDelete={() => void archiveLibraryMaterial(material.id)} />
              ))}
              {!activeLibraryTopic ? <EmptyState text="Select a topic folder to view or upload materials." /> : null}
              {activeLibraryTopic && !visibleLibraryMaterials.length ? <EmptyState text="No material in this topic yet." /> : null}
            </div>
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
        {!students.length ? <p className="py-10 text-center text-sm text-emerald-100">Students will appear after Admission Cell approval and batch assignment.</p> : null}
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

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f5ef] text-[var(--ink)]">
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">NIDUS Guru</p>
            <h2 className="text-xl font-black">Create exam</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close exam creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="mx-auto grid max-w-3xl gap-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "teacher" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "teacher" ? "bg-[var(--ink)] text-white" : "border border-[var(--border)] bg-white text-[var(--ink)]"}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
                {examDraft ? <DraftBox draft={examDraft} /> : null}
              </div>
            </div>
            <div className="border-t border-[var(--border)] bg-white px-4 py-3">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-2">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                  rows={2}
                  placeholder="Ask NIDUS Guru, or say: change question 5..."
                  className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button type="button" onClick={onSend} className="rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-black text-white">
                  Send
                </button>
              </div>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-[var(--border)] bg-white p-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Publish target</p>
              <div className="mt-3 grid gap-3">
                <Select label="Program" value={activeProgram?.key ?? ""} onChange={onProgram}>
                  <option value="">Select program</option>
                  {programGroups.map((program) => (
                    <option key={program.key} value={program.key}>{program.name}</option>
                  ))}
                </Select>
                <Select label="Batch" value={selectedClassId ?? ""} onChange={onBatch}>
                  <option value="">Select batch</option>
                  {(activeProgram?.classes ?? []).map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </Select>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted-blue)]">{selectedProgramName} / {selectedBatchName}</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Input label="Exam topic" value={examForm.topic} onChange={(value) => setExamForm((form) => ({ ...form, topic: value, title: form.title || `${value} Test` }))} />
              <Input label="Exam title" value={examForm.title} onChange={(value) => setExamForm((form) => ({ ...form, title: value }))} />
              <Input label="Questions" type="number" value={examForm.questionCount} onChange={(value) => setExamForm((form) => ({ ...form, questionCount: value }))} />
              <Input label="Timer in minutes" type="number" value={examForm.duration} onChange={(value) => setExamForm((form) => ({ ...form, duration: value }))} />
              <Select label="Difficulty" value={examForm.difficulty} onChange={(value) => setExamForm((form) => ({ ...form, difficulty: value }))}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
              <Input label="Publish date" type="date" value={examForm.publishDate} onChange={(value) => setExamForm((form) => ({ ...form, publishDate: value }))} />
              <Input label="Publish time" type="time" value={examForm.publishTime} onChange={(value) => setExamForm((form) => ({ ...form, publishTime: value }))} />
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4">
                <p className="text-sm font-black">Upload source material</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">PDF, Word, photos, notes, question bank or syllabus content for NIDUS GURU to analyse.</p>
                <div className="mt-3">
                  <FileInput label="Attach source file" onChange={setExamSourceName} />
                </div>
              </div>
              {examSourceName ? <p className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {examSourceName}</p> : null}
              <Textarea label="Instructions and exam rules" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
              {examDraft ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="text-sm font-black">Review tools</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={onDraft} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Regenerate</button>
                    <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Add question</button>
                    <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Edit question</button>
                    <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">Delete question</button>
                  </div>
                </div>
              ) : null}
              <button type="button" onClick={onDraft} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Generate Question Bank</button>
              <button type="button" onClick={onPublish} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Exam</button>
            </div>
          </aside>
        </div>
      </div>
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
      <button type="button" onClick={onCreate} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-3 text-sm font-black text-white">
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
  return (
    <div className="fixed inset-0 z-50 bg-[#f7f5ef] text-[var(--ink)]">
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">NIDUS Guru</p>
            <h2 className="text-xl font-black">Create assignment</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close assignment creator">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="mx-auto grid max-w-3xl gap-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "teacher" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "teacher" ? "bg-[var(--ink)] text-white" : "border border-[var(--border)] bg-white text-[var(--ink)]"}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--border)] bg-white px-4 py-3">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-2">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                  rows={2}
                  placeholder="Ask NIDUS Guru, or say: make it easier..."
                  className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button type="button" onClick={onSend} className="rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-black text-white">
                  Send
                </button>
              </div>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-[var(--border)] bg-white p-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Selected class</p>
              <h3 className="mt-2 font-black">{selectedProgramName}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedBatchName}</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Input label="Assignment topic" value={assignmentForm.topic} onChange={(value) => setAssignmentForm((form) => ({ ...form, topic: value, title: form.title || `${value} Assignment` }))} />
              <Input label="Assignment title" value={assignmentForm.title} onChange={(value) => setAssignmentForm((form) => ({ ...form, title: value }))} />
              <Input label="Due date" type="date" value={assignmentForm.dueDate} onChange={(value) => setAssignmentForm((form) => ({ ...form, dueDate: value }))} />
              <Input label="Reference link" value={assignmentForm.link} onChange={(value) => setAssignmentForm((form) => ({ ...form, link: value }))} />
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4">
                <p className="text-sm font-black">Upload source material</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">Notes, PDF, Word documents, images, question bank or supporting material for NIDUS GURU to analyse.</p>
                <div className="mt-3">
                  <FileInput label="Attach source file" onChange={setAssignmentSourceName} />
                </div>
              </div>
              {assignmentSourceName ? <p className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {assignmentSourceName}</p> : null}
              <Textarea label="Notes, instructions and evaluation criteria" value={assignmentForm.instructions} onChange={(value) => setAssignmentForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={onDraft} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Generate Assignment Draft</button>
              <button type="button" onClick={onPublish} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Assignment</button>
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

function FolderCard({ title, subtitle, active, onClick }: { title: string; subtitle: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
      <p className="text-lg font-black">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted-blue)]">{subtitle}</p>
    </button>
  );
}

function FolderCreateBox({ label, placeholder, value, onChange, onCreate }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-4">
      <p className="text-sm font-black">{label}</p>
      <div className="mt-3 flex gap-2">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm outline-none" />
        <button type="button" onClick={onCreate} className="rounded-xl bg-[var(--ink)] px-4 text-sm font-black text-white">Create</button>
      </div>
    </div>
  );
}

function LibraryUploadPanel({
  form,
  activeSubject,
  activeTopic,
  onChange,
  onPublish,
}: {
  form: typeof initialLibraryForm;
  activeSubject: string | null;
  activeTopic: string | null;
  onChange: React.Dispatch<React.SetStateAction<typeof initialLibraryForm>>;
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
        <Input label="Title" value={form.title} onChange={(value) => onChange((current) => ({ ...current, title: value, subject: activeSubject || current.subject, folder: activeSubject || current.folder, topic: activeTopic || current.topic }))} />
        <Select label="Material type" value={form.type} onChange={(value) => onChange((current) => ({ ...current, type: value }))}>
          <option value="VIDEO">Recorded Video</option>
          <option value="PDF">PDF</option>
          <option value="PPT">PPT</option>
          <option value="WORD">Word Document</option>
          <option value="LINK">External Link</option>
          <option value="NOTE">Notes</option>
        </Select>
        <Input label="External link" value={form.url} onChange={(value) => onChange((current) => ({ ...current, url: value }))} />
        <FileInput label="Upload material file" onChange={(value) => onChange((current) => ({ ...current, fileName: value }))} />
        <FileInput label="Thumbnail preview" accept="image/*" onChange={(value) => onChange((current) => ({ ...current, thumbnailName: value }))} />
        <Textarea label="Description / notes" value={form.description} onChange={(value) => onChange((current) => ({ ...current, description: value }))} />
      </FormGrid>
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

function MaterialCard({ material, onDelete }: { material: MaterialRecord; onDelete: () => void }) {
  const type = material.type || "Material";
  const date = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : "Upload date pending";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="grid aspect-video place-items-center rounded-xl bg-white text-center text-xs font-black text-[var(--muted-blue)]">
        {material.thumbnailName || material.fileName || type}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-black">{material.title || "Untitled material"}</h4>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{type} / {date}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(material.reviewStatus || material.status)}`}>{material.reviewStatus || material.status || "LIVE"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-black text-white">View</button>
        <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-black">Edit</button>
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

function FileInput({ label, accept, onChange }: { label: string; accept?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0]?.name ?? "")} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal" />
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
