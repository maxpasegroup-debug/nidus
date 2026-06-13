"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  title?: string;
  topic?: string | null;
  questionCount?: number;
  durationMinutes?: number;
  difficulty?: string | null;
  status?: string;
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

function statusTone(status?: string | null) {
  const normalized = status?.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "PUBLISHED" || normalized === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (normalized === "PARTIAL" || normalized === "PENDING_REVIEW") return "bg-amber-50 text-amber-700";
  if (normalized === "ABSENT" || normalized === "ARCHIVED") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

export default function TeacherDashboardClient({ view }: { view: TeacherView }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [selectedProgramKey, setSelectedProgramKey] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
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
  const [examSourceName, setExamSourceName] = useState("");
  const [assignmentSourceName, setAssignmentSourceName] = useState("");
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
  const [examForm, setExamForm] = useState({
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
  const selectedProgram = programGroups.find((program) => program.key === selectedProgramKey) ?? programGroups[0] ?? null;
  const programClasses = selectedProgram?.classes ?? [];
  const selectedClass = activeClasses.find((item) => item.id === selectedClassId) ?? programClasses[0] ?? activeClasses[0] ?? null;
  const selectedStudents = selectedClass?.students ?? [];
  const selectedStudentEntry = selectedStudents.find((entry, index) => studentId(entry, index) === selectedStudentId) ?? selectedStudents[0] ?? null;
  const selectedStudent = selectedStudentEntry?.student ?? null;
  const selectedCalendarItems = selectedClass?.id
    ? calendar.filter((item) => !item.batchId || item.batchId === selectedClass.id)
    : calendar;
  const selectedCalendarItem =
    selectedCalendarItems.find((item) => item.id === selectedCalendarId) ??
    selectedCalendarItems.find((item) => item.batchId === selectedClass?.id) ??
    selectedCalendarItems[0] ??
    null;
  const pendingAssignments = classWorkspace.assignments.reduce((total, item) => total + Number(item.submissionStats?.pending ?? 0), 0);
  const pendingCalendarItems = calendar.filter((item) => item.completionStatus !== "COMPLETED").length;
  const attendanceMarkedToday = classWorkspace.attendance.some((item) => item.date?.slice(0, 10) === attendanceDate);
  const selectedStudentAttendance = classWorkspace.attendance
    .flatMap((record) =>
      (record.records ?? [])
        .filter((entry) => entry.studentId === selectedStudent?.id)
        .map((entry) => ({ ...entry, date: record.date, subject: record.subject })),
    )
    .slice(0, 5);
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
    setSelectedStudentId(null);
  }

  function chooseBatch(batchId: string) {
    setSelectedClassId(batchId);
    setSelectedStudentId(null);
  }

  function setAllAttendance(status: "PRESENT" | "ABSENT" | "LEAVE") {
    setAttendance(Object.fromEntries(selectedStudents.map((entry, index) => [studentId(entry, index), status])));
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
      setExamMessage("Exam published to students.");
      await loadClassWorkspace(selectedClass.id);
    } catch (error) {
      setExamMessage(error instanceof Error ? error.message : "Could not publish exam.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[var(--gold-dark)]">Teacher Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Simple class control</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-blue)]">
            Program, batch, students, attendance, assignments, exams, library and calendar logs in one small-academy workflow.
          </p>
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
        <SectionHeader eyebrow="Classes" title="Programs, batches and students" description="Choose the program first, then open the batch and student progress." icon={<GraduationCap size={20} />} />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {programGroups.map((program) => (
            <button key={program.key} type="button" onClick={() => chooseProgram(program.key)} className={`rounded-2xl border p-4 text-left ${selectedProgram?.key === program.key ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
              <p className="text-xs font-black uppercase tracking-[0.25em] opacity-70">Program</p>
              <h3 className="mt-3 text-xl font-black">{program.name}</h3>
              <p className="mt-2 text-sm opacity-80">{program.classes.length} batch(es)</p>
            </button>
          ))}
          {!programGroups.length ? <EmptyState text="No program is assigned yet. Academic Head or Director should assign batches to this teacher." /> : null}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div>
            <h3 className="font-black">Batches</h3>
            <div className="mt-3 grid gap-3">
              {programClasses.map((batch) => (
                <button key={batch.id} type="button" onClick={() => chooseBatch(batch.id)} className={`rounded-2xl border p-4 text-left ${selectedClass?.id === batch.id ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{batch.subject || "Subject"}</p>
                  <h4 className="mt-2 font-black">{batch.name}</h4>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">{batch.students?.length ?? batch._count?.students ?? 0} students</p>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-emerald-900 bg-emerald-950 p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">Team View</p>
                <h3 className="mt-2 text-2xl font-black">{selectedClass?.name ?? "Select a batch"}</h3>
              </div>
              <span className="rounded-full border border-white/30 px-4 py-2 text-sm font-black">{selectedStudents.length} students</span>
            </div>
            <div className="mt-5 rounded-[24px] border border-white/25 bg-emerald-900/70 p-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {selectedStudents.map((entry, index) => {
                  const id = studentId(entry, index);
                  const active = selectedStudentId === id;
                  return (
                    <button key={id} type="button" onClick={() => setSelectedStudentId(id)} className={`flex flex-col items-center rounded-2xl border p-4 text-center ${active ? "border-white bg-white text-emerald-950" : "border-white/25 bg-white/10 text-white"}`}>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-black text-emerald-950">{(entry.student?.name || entry.student?.email || "?").slice(0, 1).toUpperCase()}</span>
                      <span className="mt-3 text-sm font-black">{entry.student?.name || entry.student?.email || "Student"}</span>
                      <span className="mt-1 text-xs opacity-75">{entry.status || "Active"}</span>
                    </button>
                  );
                })}
              </div>
              {!selectedStudents.length ? <p className="py-10 text-center text-sm text-emerald-100">Students will appear after Admission Cell approval and batch assignment.</p> : null}
            </div>
            {selectedStudent ? (
              <div className="mt-4 rounded-2xl bg-white p-4 text-[var(--ink)]">
                <h4 className="font-black">{selectedStudent.name || selectedStudent.email}</h4>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedStudent.email || selectedStudent.mobile || "Student profile"}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniMetric label="Attendance" value={`${selectedStudentAttendance.length} logs`} />
                  <MiniMetric label="Assignments" value={`${classWorkspace.assignments.length}`} />
                  <MiniMetric label="Progress" value={`${classWorkspace.progress.length} topics`} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section> : null}

      {view === "exams" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Exams" title="Create and publish exams" description="NIDUS GURU prepares a draft from topic notes, files, photos or a question bank. Teacher reviews before publishing." icon={<BookOpen size={20} />} action={<button type="button" onClick={() => setShowExamCreator((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Create New Exam</button>} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        {showExamCreator ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <FormGrid>
              <Input label="Exam title" value={examForm.title} onChange={(value) => setExamForm((form) => ({ ...form, title: value }))} />
              <Input label="Topic details" value={examForm.topic} onChange={(value) => setExamForm((form) => ({ ...form, topic: value }))} />
              <Input label="Questions" type="number" value={examForm.questionCount} onChange={(value) => setExamForm((form) => ({ ...form, questionCount: value }))} />
              <Input label="Timer in minutes" type="number" value={examForm.duration} onChange={(value) => setExamForm((form) => ({ ...form, duration: value }))} />
              <Input label="Publish date" type="date" value={examForm.publishDate} onChange={(value) => setExamForm((form) => ({ ...form, publishDate: value }))} />
              <Input label="Publish time" type="time" value={examForm.publishTime} onChange={(value) => setExamForm((form) => ({ ...form, publishTime: value }))} />
              <Select label="Difficulty" value={examForm.difficulty} onChange={(value) => setExamForm((form) => ({ ...form, difficulty: value }))}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></Select>
              <FileInput label="PDF / Word / photo / question bank" onChange={setExamSourceName} />
              <Textarea label="Instructions for NIDUS GURU" value={examForm.instructions} onChange={(value) => setExamForm((form) => ({ ...form, instructions: value }))} />
            </FormGrid>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void createExamDraft()} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black">Ask NIDUS GURU</button>
              <button type="button" onClick={() => void publishExam()} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Confirm and Publish</button>
            </div>
            {examDraft ? <DraftBox draft={examDraft} /> : null}
          </div>
        ) : null}
        {examMessage ? <Notice text={examMessage} /> : null}
        <CardGrid>
          {classWorkspace.exams.map((exam) => (
            <SimpleCard key={exam.id} eyebrow={exam.status || "Exam"} title={exam.title || "Untitled exam"}>
              <p>{exam.topic || selectedClass?.subject || "Topic"}</p>
              <p>{exam.questionCount ?? 0} questions / {exam.durationMinutes ?? 0} minutes</p>
              <p>{exam.attemptStats?.submitted ?? 0} submitted</p>
            </SimpleCard>
          ))}
          {!classWorkspace.exams.length ? <EmptyState text="No exam created for this batch yet." /> : null}
        </CardGrid>
      </section> : null}

      {view === "assignments" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Assignments" title="Create and track assignments" description="Same simple flow as exams: add task, attach file or link, publish to selected batch." icon={<FileText size={20} />} action={<button type="button" onClick={() => setShowAssignmentCreator((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Create Assignment</button>} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        {showAssignmentCreator ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
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
        <SectionHeader eyebrow="Library" title="Folders, topics and recorded videos" description="Create a subject folder, add lesson or topic folder, then upload or link the class material." icon={<Library size={20} />} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
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
        <CardGrid>
          {classWorkspace.materials.map((material) => (
            <SimpleCard key={material.id} eyebrow={material.reviewStatus || material.status || "Material"} title={material.title || "Untitled material"}>
              <p>{material.subject || material.folder || "Subject"} / {material.topic || "Topic"}</p>
              <p>{material.fileName || material.url || "No file link"}</p>
              <button type="button" onClick={() => void archiveLibraryMaterial(material.id)} className="mt-3 text-sm font-black text-rose-700">Archive</button>
            </SimpleCard>
          ))}
          {!classWorkspace.materials.length ? <EmptyState text="No library material uploaded for this batch yet." /> : null}
        </CardGrid>
      </section> : null}

      {view === "academic-calendar" ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <SectionHeader eyebrow="Academic Calendar" title="Timetable, syllabus progress and teacher logs" description="This is the main connection between teacher and management. Update class completion here." icon={<CalendarDays size={20} />} />
        <ProgramBatchPicker programGroups={programGroups} selectedProgramKey={selectedProgram?.key} selectedClassId={selectedClass?.id} onProgram={chooseProgram} onBatch={chooseBatch} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-2">
            {selectedCalendarItems.map((item) => (
              <button key={item.id} type="button" onClick={() => { setSelectedCalendarId(item.id); setCalendarLog({ completionStatus: item.completionStatus || "COMPLETED", teacherLog: item.teacherLog || "", nextAction: item.nextAction || "" }); }} className={`rounded-2xl border p-4 text-left ${selectedCalendarItem?.id === item.id ? "border-[var(--ink)] bg-white shadow-sm" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{item.plannedDate ? new Date(item.plannedDate).toLocaleDateString() : "Planned"}{item.startTime ? ` / ${item.startTime}` : ""}</p>
                <h3 className="mt-2 font-black">{item.topic || "Topic pending"}</h3>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.batchName || selectedClass?.name || "Batch"} / {item.subject || "Subject"}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone(item.completionStatus)}`}>{item.completionStatus || "PENDING"}</span>
              </button>
            ))}
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
    <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 md:grid-cols-2">
      <Select label="Program" value={selectedProgram?.key ?? ""} onChange={onProgram}>
        <option value="">Select program</option>
        {programGroups.map((program) => (
          <option key={program.key} value={program.key}>
            {program.name}
          </option>
        ))}
      </Select>
      <Select label="Batch" value={selectedClassId ?? ""} onChange={onBatch}>
        <option value="">Select batch</option>
        {(selectedProgram?.classes ?? []).map((batch) => (
          <option key={batch.id} value={batch.id}>
            {batch.name} {batch.subject ? `- ${batch.subject}` : ""}
          </option>
        ))}
      </Select>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--page-bg)] p-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
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
