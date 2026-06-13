"use client";

import Link from "next/link";
import { Children, useEffect, useMemo, useState } from "react";
import {
  Bell,
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
  title?: string;
  topic?: string | null;
  instructions?: string | null;
  dueDate?: string | null;
  status?: string;
  submissionStats?: { submitted?: number; pending?: number; totalStudents?: number };
};

type MaterialRecord = {
  id: string;
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  title?: string;
  type?: string | null;
  url?: string | null;
  fileName?: string | null;
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

export type TeacherView = "today" | "classes" | "exams" | "assignments" | "attendance" | "library" | "academic-calendar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const emptyWorkspace: ClassWorkspace = {
  attendance: [],
  assignments: [],
  materials: [],
  exams: [],
  progress: [],
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

export default function TeacherDashboardClient({ view, courseKey }: { view: TeacherView; courseKey?: string }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [selectedProgramKey, setSelectedProgramKey] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentModalId, setStudentModalId] = useState<string | null>(null);
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
  const [examDateFilter, setExamDateFilter] = useState("");
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
  const [librarySubject, setLibrarySubject] = useState<string | null>(null);
  const [libraryTopic, setLibraryTopic] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStartDate(new Date()));
  const [classWorkspace, setClassWorkspace] = useState<ClassWorkspace>(emptyWorkspace);
  const [calendarLog, setCalendarLog] = useState({ completionStatus: "COMPLETED", teacherLog: "", nextAction: "" });
  const [libraryForm, setLibraryForm] = useState({
    folder: "",
    subject: "",
    topic: "",
    title: "",
    description: "",
    type: "VIDEO",
    url: "",
    fileName: "",
    thumbnailName: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", topic: "", instructions: "", dueDate: "", attachmentName: "", link: "" });
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
  const isAcademicHead = user?.role?.toUpperCase() === "ACADEMIC_HEAD" || dashboardTemplate === "ACADEMIC_HEAD";
  const activeClasses = useMemo(() => classes.filter((item) => item.status !== "ARCHIVED"), [classes]);
  const activeCourseKey = courseKey ? decodeURIComponent(courseKey) : null;
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
  const selectedClass = activeClasses.find((item) => item.id === selectedClassId) ?? programClasses[0] ?? activeClasses[0] ?? null;
  const selectedStudents = selectedClass?.students ?? [];
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
  const pendingAssignments = classWorkspace.assignments.reduce((total, item) => total + Number(item.submissionStats?.pending ?? 0), 0);
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
      (item.topic || "General") === activeLibraryTopic,
  );
  const visibleExams = classWorkspace.exams.filter((exam) => {
    if (!examDateFilter) return true;
    return exam.createdAt?.slice(0, 10) === examDateFilter;
  });
  const examGroups = useMemo(() => {
    const groups = new Map<string, ExamRecord[]>();
    for (const exam of visibleExams) {
      const date = exam.createdAt ? exam.createdAt.slice(0, 10) : "Date not set";
      const key = `${programName(selectedClass ?? activeClasses[0] ?? { id: "", name: "" })} / ${selectedClass?.name ?? exam.batchName ?? "Batch"} / ${date}`;
      groups.set(key, [...(groups.get(key) ?? []), exam]);
    }
    return Array.from(groups.entries()).map(([label, exams]) => ({ label, exams }));
  }, [activeClasses, selectedClass, visibleExams]);
  const calendarDays = useMemo(() => {
    const first = monthStartDate(calendarMonth);
    const startOffset = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return Array.from({ length: startOffset + daysInMonth }, (_, index) => {
      if (index < startOffset) return null;
      return new Date(first.getFullYear(), first.getMonth(), index - startOffset + 1);
    });
  }, [calendarMonth]);
  const pendingCalendarItems = calendar.filter((item) => item.completionStatus !== "COMPLETED").length;
  const attendanceMarkedToday = classWorkspace.attendance.some((item) => item.date?.slice(0, 10) === attendanceDate);
  const notificationItems = [
    {
      title: "Pending assignments",
      detail: pendingAssignments ? `${pendingAssignments} student submission(s) need attention.` : "No pending assignment review for the selected batch.",
      href: "/dashboard/teacher/assignments",
      icon: FileText,
    },
    {
      title: "Syllabus completion",
      detail: pendingCalendarItems ? `${pendingCalendarItems} calendar topic(s) need completion update.` : "Calendar logs are clear right now.",
      href: "/dashboard/teacher/academic-calendar",
      icon: CalendarDays,
    },
    {
      title: "Attendance",
      detail: attendanceMarkedToday ? "Attendance is saved for the selected date." : selectedStudents.length ? "Mark attendance for today's class." : "Select a batch with students to mark attendance.",
      href: "/dashboard/teacher/attendance",
      icon: ClipboardCheck,
    },
    {
      title: "Management notes",
      detail: selectedCalendarItem?.nextAction || "Notifications from Academic Head or Director will appear here.",
      href: "/dashboard/teacher/academic-calendar",
      icon: Bell,
    },
  ];

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

  function chooseProgram(key: string) {
    const program = programGroups.find((item) => item.key === key);
    setSelectedProgramKey(key);
    setSelectedClassId(program?.classes[0]?.id ?? null);
    setStudentModalId(null);
    setLibrarySubject(null);
    setLibraryTopic(null);
  }

  function chooseBatch(batchId: string) {
    setSelectedClassId(batchId);
    setStudentModalId(null);
    setLibrarySubject(null);
    setLibraryTopic(null);
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
        text: "Hello Teacher. Tell me the exam topic, batch, question count, difficulty, date, time and timer. You can also attach a PDF, Word file, photo or question bank.",
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
        folder: libraryForm.folder,
        subject: libraryForm.subject,
        topic: libraryForm.topic,
        title: libraryForm.title,
        type: libraryForm.type,
        url: libraryForm.url || undefined,
        fileName: libraryForm.fileName || undefined,
      });
      setLibraryForm({ folder: "", subject: "", topic: "", title: "", description: "", type: "VIDEO", url: "", fileName: "", thumbnailName: "" });
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
    if (!selectedClass) return;
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
    today: "Today",
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

      {view === "today" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Today</p>
            <h2 className="mt-2 text-2xl font-black">Reminders and notifications</h2>
          </div>
          <p className="rounded-full bg-[var(--page-bg)] px-4 py-2 text-sm font-black">{selectedClass ? selectedClass.name : "No batch selected"}</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {notificationItems.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.title} href={item.href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <Icon size={20} className="text-[var(--gold-dark)]" />
                <h3 className="mt-3 font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.detail}</p>
              </a>
            );
          })}
        </div>
      </section> : null}

      {view === "classes" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        {!activeCourseKey ? (
          <>
          <SectionHeader eyebrow="Classes" title="Assigned courses" description="Only courses assigned by the Academic Head or Director appear here." icon={<GraduationCap size={20} />} />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {programGroups.map((program) => (
              <Link key={program.key} href={`/dashboard/teacher/classes/${program.key}`} className="min-h-44 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Program</p>
                <h3 className="mt-4 text-2xl font-black">{program.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-xl bg-white px-3 py-2 font-black">{program.classes.length} batch(es)</span>
                  <span className="rounded-xl bg-white px-3 py-2 font-black">
                    {program.classes.reduce((total, batch) => total + (batch.students?.length ?? batch._count?.students ?? 0), 0)} students
                  </span>
                </div>
                <p className="mt-4 text-sm font-black text-[var(--gold-dark)]">Open course</p>
              </Link>
            ))}
            {!programGroups.length ? <EmptyState text="No classes assigned yet. Academic Head or Director will assign your courses." /> : null}
          </div>
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href="/dashboard/teacher/classes" className="text-sm font-black text-[var(--gold-dark)]">Back to assigned courses</Link>
                <h2 className="mt-2 text-3xl font-black">{selectedProgram?.name ?? "Course not assigned"}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                  Course workspace: batches, students, syllabus tracker, exams and assignments.
                </p>
              </div>
              <span className="rounded-full bg-[var(--page-bg)] px-4 py-2 text-sm font-black">{programClasses.length} assigned batch(es)</span>
            </div>
            {!selectedProgram && !loadingPlan ? <EmptyState text="This course is not assigned to this teacher." /> : null}
            <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Batches</p>
                <div className="mt-3 grid gap-3">
                  {programClasses.map((batch) => (
                    <button key={batch.id} type="button" onClick={() => chooseBatch(batch.id)} className={`rounded-2xl border p-4 text-left ${selectedClass?.id === batch.id ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-white/70"}`}>
                      <h3 className="font-black">{batch.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.subject || "Subject"} / {batch.students?.length ?? batch._count?.students ?? 0} students</p>
                    </button>
                  ))}
                  {!programClasses.length ? <EmptyState text="No batch is assigned under this course." /> : null}
                </div>
              </div>
              <div className="grid gap-4">
                <CourseSummaryCards students={selectedStudents.length} progress={classWorkspace.progress.length} exams={classWorkspace.exams.length} assignments={classWorkspace.assignments.length} />
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-black">Students</h3>
                    <p className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{selectedClass?.name ?? "Select batch"}</p>
                  </div>
                  <FootballStudentGrid
                    students={selectedStudents}
                    selectedStudentId={studentModalId}
                    onSelect={(id) => {
                      setStudentModalId(id);
                    }}
                  />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <ProgressPanel title="Syllabus plan and tracker" items={classWorkspace.progress.map((item) => ({ id: item.id, title: item.topic || "Topic", meta: item.subject || "Subject", status: item.completionStatus || item.progressColor || "PENDING" }))} empty="No syllabus progress is recorded for this batch yet." />
                  <ProgressPanel title="Exams conducted" items={classWorkspace.exams.map((item) => ({ id: item.id, title: item.title || "Exam", meta: `${item.questionCount ?? 0} questions / ${item.durationMinutes ?? 0} min`, status: item.status || "PUBLISHED" }))} empty="No exams conducted for this batch yet." />
                  <ProgressPanel title="Upcoming exams" items={classWorkspace.exams.filter((item) => !item.attemptStats?.submitted).map((item) => ({ id: `${item.id}-upcoming`, title: item.title || "Exam", meta: item.topic || selectedClass?.subject || "Topic", status: "LIVE" }))} empty="No upcoming exam is listed for this batch." />
                  <ProgressPanel title="Assignments" items={classWorkspace.assignments.map((item) => ({ id: item.id, title: item.title || "Assignment", meta: `Submitted ${item.submissionStats?.submitted ?? 0} / ${item.submissionStats?.totalStudents ?? selectedStudents.length}`, status: item.status || "PUBLISHED" }))} empty="No assignments published for this batch yet." />
                </div>
              </div>
            </div>
            {modalStudent ? (
              <StudentProgressModal
                student={modalStudent}
                attendance={modalStudentAttendance}
                attendancePercent={modalAttendancePercent}
                assignments={classWorkspace.assignments}
                exams={classWorkspace.exams}
                progress={classWorkspace.progress}
                onClose={() => setStudentModalId(null)}
              />
            ) : null}
          </div>
        )}
      </section> : null}

      {view === "exams" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Exams" title="Published exams" description="Created exams are shown by assigned course, batch and date." icon={<BookOpen size={20} />} action={<button type="button" onClick={openExamCreator} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-4 text-base font-black text-white shadow-sm"><Plus size={20} /> Create Exam</button>} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <Input label="Date" type="date" value={examDateFilter} onChange={setExamDateFilter} />
          {examDateFilter ? <button type="button" onClick={() => setExamDateFilter("")} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Clear date</button> : null}
          <span className="rounded-xl bg-white px-4 py-3 text-sm font-black">{visibleExams.length} exam(s)</span>
        </div>
        {examMessage ? <Notice text={examMessage} /> : null}
        <div className="mt-5 grid gap-5">
          {examGroups.map((group) => (
            <div key={group.label} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">{group.label}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.exams.map((exam) => (
                  <ExamThumbnail key={exam.id} exam={exam} batchName={selectedClass?.name ?? exam.batchName ?? "Batch"} courseName={selectedProgram?.name ?? exam.course ?? "Course"} />
                ))}
              </div>
            </div>
          ))}
          {!visibleExams.length ? <EmptyState text="No exam created for this batch yet. Use Create Exam to open NIDUS Guru." /> : null}
        </div>
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
            selectedProgramName={selectedProgram?.name ?? "Course"}
            selectedBatchName={selectedClass?.name ?? "Batch"}
            examSourceName={examSourceName}
          />
        ) : null}
      </section> : null}

      {view === "assignments" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Assignments" title="Assignment board" description="Create one task, publish it, then track submitted and pending work." icon={<FileText size={20} />} action={<button type="button" onClick={() => setShowAssignmentCreator((value) => !value)} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-4 text-base font-black text-white shadow-sm"><Plus size={20} /> Create Assignment</button>} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        {showAssignmentCreator ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-black">New assignment</p>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">Add the task, attach a file or link, then publish to the selected batch.</p>
            </div>
            <FormGrid>
              <Input label="Assignment title" value={assignmentForm.title} onChange={(value) => setAssignmentForm((form) => ({ ...form, title: value }))} />
              <Input label="Topic" value={assignmentForm.topic} onChange={(value) => setAssignmentForm((form) => ({ ...form, topic: value }))} />
              <Input label="Due date" type="date" value={assignmentForm.dueDate} onChange={(value) => setAssignmentForm((form) => ({ ...form, dueDate: value }))} />
              <Input label="Link" value={assignmentForm.link} onChange={(value) => setAssignmentForm((form) => ({ ...form, link: value }))} />
              <FileInput label="Attachment" onChange={setAssignmentSourceName} />
              <Textarea label="Instructions" value={assignmentForm.instructions} onChange={(value) => setAssignmentForm((form) => ({ ...form, instructions: value }))} />
            </FormGrid>
            <button type="button" onClick={() => void publishAssignment()} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Assignment</button>
          </div>
        ) : null}
        {assignmentMessage ? <Notice text={assignmentMessage} /> : null}
        <CardGrid>
          {classWorkspace.assignments.map((assignment) => (
            <SimpleCard key={assignment.id} eyebrow={assignment.status || "Assignment"} title={assignment.title || "Untitled assignment"}>
              <p>{assignment.topic || "Topic"}</p>
              <p>Submitted {assignment.submissionStats?.submitted ?? 0} / {assignment.submissionStats?.totalStudents ?? selectedStudents.length}</p>
              <p>Pending {assignment.submissionStats?.pending ?? 0}</p>
            </SimpleCard>
          ))}
          {!classWorkspace.assignments.length ? <EmptyState text="No assignment published for this batch yet." /> : null}
        </CardGrid>
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

      {view === "library" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Library" title="Class resource folders" description="Open a subject folder, then a lesson folder, then manage videos, PDFs and links." icon={<Library size={20} />} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[260px_260px_1fr]">
          <FolderColumn title="Subjects" emptyText="Create the first subject folder below.">
            {librarySubjects.map((subject) => (
              <button key={subject} type="button" onClick={() => { setLibrarySubject(subject); setLibraryTopic(null); }} className={`rounded-2xl border p-4 text-left ${activeLibrarySubject === subject ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                <p className="font-black">{subject}</p>
                <p className="mt-1 text-xs text-[var(--muted-blue)]">Subject folder</p>
              </button>
            ))}
          </FolderColumn>
          <FolderColumn title="Lessons" emptyText="No lesson folder yet.">
            {libraryTopics.map((topic) => (
              <button key={topic} type="button" onClick={() => setLibraryTopic(topic)} className={`rounded-2xl border p-4 text-left ${activeLibraryTopic === topic ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                <p className="font-black">{topic}</p>
                <p className="mt-1 text-xs text-[var(--muted-blue)]">Topic folder</p>
              </button>
            ))}
          </FolderColumn>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Materials</p>
            <div className="mt-4 grid gap-3">
              {visibleLibraryMaterials.map((material) => (
                <SimpleCard key={material.id} eyebrow={material.reviewStatus || material.status || "Material"} title={material.title || "Untitled material"}>
                  <p>{material.fileName || material.url || "No file link"}</p>
                  <button type="button" onClick={() => void archiveLibraryMaterial(material.id)} className="mt-3 text-sm font-black text-rose-700">Archive</button>
                </SimpleCard>
              ))}
              {!visibleLibraryMaterials.length ? <EmptyState text="No material in this folder yet." /> : null}
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <p className="mb-4 font-black">Add material or create folder</p>
          <FormGrid>
            <Input label="Subject folder" value={libraryForm.subject} onChange={(value) => setLibraryForm((form) => ({ ...form, subject: value, folder: value }))} />
            <Input label="Lesson / topic folder" value={libraryForm.topic} onChange={(value) => setLibraryForm((form) => ({ ...form, topic: value }))} />
            <Input label="Video title" value={libraryForm.title} onChange={(value) => setLibraryForm((form) => ({ ...form, title: value }))} />
            <Input label="Video link" value={libraryForm.url} onChange={(value) => setLibraryForm((form) => ({ ...form, url: value }))} />
            <FileInput label="Recorded video file" onChange={(value) => setLibraryForm((form) => ({ ...form, fileName: value }))} />
            <FileInput label="Thumbnail" accept="image/*" onChange={(value) => setLibraryForm((form) => ({ ...form, thumbnailName: value }))} />
            <Textarea label="Description" value={libraryForm.description} onChange={(value) => setLibraryForm((form) => ({ ...form, description: value }))} />
          </FormGrid>
          <button type="button" onClick={() => void publishLibraryMaterial()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white"><FolderPlus size={16} /> Publish Material</button>
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

function FootballStudentGrid({
  students,
  selectedStudentId,
  onSelect,
}: {
  students: NonNullable<AssignedClass["students"]>;
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
                return (
                  <button key={id} type="button" onClick={() => onSelect(id)} className={`w-36 rounded-2xl border p-3 text-center ${active ? "border-white bg-white text-emerald-950" : "border-white/25 bg-white/10 text-white"}`}>
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white font-black text-emerald-950">{(entry.student?.name || entry.student?.email || "?").slice(0, 1).toUpperCase()}</span>
                    <span className="mt-3 block truncate text-sm font-black">{entry.student?.name || entry.student?.email || "Student"}</span>
                    <span className="mt-2 block rounded-full border border-current px-2 py-1 text-[0.65rem] font-black">{entry.status || "Active"}</span>
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

function ExamThumbnail({ exam, courseName, batchName }: { exam: ExamRecord; courseName: string; batchName: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(exam.status)}`}>{exam.status || "PUBLISHED"}</span>
        <span className="text-xs font-black text-[var(--gold-dark)]">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : "Date pending"}</span>
      </div>
      <h3 className="mt-4 text-xl font-black">{exam.title || "Untitled exam"}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{courseName} / {batchName}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.topic || "Topic pending"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{exam.questionCount ?? 0} Qs</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{exam.durationMinutes ?? 0} min</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{exam.attemptStats?.submitted ?? 0} done</span>
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
  selectedProgramName: string;
  selectedBatchName: string;
  examSourceName: string;
}) {
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
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Selected class</p>
              <h3 className="mt-2 font-black">{selectedProgramName}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedBatchName}</p>
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
              <FileInput label="Attach PDF / Word / photo / question bank" onChange={setExamSourceName} />
              {examSourceName ? <p className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">Attached: {examSourceName}</p> : null}
              <Textarea label="Teacher notes" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
              <button type="button" onClick={onDraft} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Generate Question Bank</button>
              <button type="button" onClick={onPublish} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Publish Exam</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StudentProgressModal({
  student,
  attendance,
  attendancePercent,
  assignments,
  exams,
  progress,
  onClose,
}: {
  student: AssignedStudent;
  attendance: Array<{ date?: string; subject?: string | null; status?: string; remarks?: string }>;
  attendancePercent: number;
  assignments: AssignmentRecord[];
  exams: ExamRecord[];
  progress: SyllabusProgressRecord[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Student Progress Card</p>
            <h2 className="mt-2 text-2xl font-black">{student.name || student.email || "Student"}</h2>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{student.email || student.mobile || "Profile details pending"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3" aria-label="Close student progress">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Attendance" value={`${attendancePercent}%`} />
          <SummaryCard label="Attendance Logs" value={attendance.length} />
          <SummaryCard label="Assignments" value={assignments.length} />
          <SummaryCard label="Exams" value={exams.length} />
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
