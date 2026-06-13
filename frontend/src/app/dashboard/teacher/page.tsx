"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  RefreshCw,
  Users,
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
  course?: {
    title?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  _count?: {
    students?: number;
    teachers?: number;
  } | null;
  students?: Array<{
    id?: string;
    student?: AssignedStudent | null;
    status?: string | null;
  }>;
};

type TeachingPlan = {
  batches?: AssignedClass[];
  assignments?: AssignedClass[];
  calendar?: Array<{
    id: string;
    plannedDate?: string;
    subject?: string;
    topic?: string;
    batchName?: string;
    status?: string;
    completionStatus?: string;
    teacherLog?: string;
    nextAction?: string;
  }>;
};

type CalendarItem = NonNullable<TeachingPlan["calendar"]>[number];

type AttendanceRecord = {
  id: string;
  batchId: string;
  date?: string;
  subject?: string | null;
  records?: Array<{
    studentId?: string;
    studentName?: string;
    status?: "PRESENT" | "ABSENT" | "LEAVE" | string;
  }>;
  createdAt?: string;
};

type AssignmentRecord = {
  id: string;
  title: string;
  topic?: string | null;
  dueDate?: string | null;
  status?: string | null;
  createdAt?: string;
  submissionStats?: {
    totalStudents: number;
    submitted: number;
    pending: number;
    reviewed: number;
  };
};

type MaterialRecord = {
  id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  type?: string | null;
  url?: string | null;
  reviewStatus?: string | null;
  createdAt?: string;
};

type ExamRecord = {
  id: string;
  testId?: string | null;
  title: string;
  topic?: string | null;
  questionCount?: number;
  durationMinutes?: number;
  status?: string | null;
  createdAt?: string;
  attemptStats?: {
    attempts: number;
    submitted: number;
    averageScore: number;
  };
};

type SyllabusProgressRecord = {
  id: string;
  subject: string;
  topic: string;
  completionStatus?: string | null;
  progressColor?: string | null;
  remarks?: string | null;
  updatedAt?: string;
};

type ClassWorkspace = {
  attendance: AttendanceRecord[];
  assignments: AssignmentRecord[];
  materials: MaterialRecord[];
  exams: ExamRecord[];
  progress: SyllabusProgressRecord[];
};

const tokenKeys = ["token", "accessToken", "authToken", "nidus_token"];
const userKeys = ["user", "nidus_user", "authUser"];

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of userKeys) {
    const value = window.localStorage.getItem(key);
    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value) as StoredUser & {
        user?: StoredUser;
        data?: { user?: StoredUser };
      };
      return parsed.user ?? parsed.data?.user ?? parsed;
    } catch {
      continue;
    }
  }

  return null;
}

async function apiGet<T>(paths: string[]): Promise<T | null> {
  const token = getStoredToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch {
      continue;
    }
  }

  return null;
}

async function apiPatch<T>(paths: string[], body: unknown): Promise<T | null> {
  const token = getStoredToken();
  const headers = new Headers({ "Content-Type": "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch {
      continue;
    }
  }

  return null;
}

async function apiPost<T>(paths: string[], body: unknown): Promise<T | null> {
  const token = getStoredToken();
  const headers = new Headers({ "Content-Type": "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeAssignedClasses(data: TeachingPlan | AssignedClass[] | null): AssignedClass[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.batches ?? data.assignments ?? [];
}

const modules = [
  {
    id: "today",
    title: "Today",
    text: "Immediate class actions, pending attendance, calendar logs and teacher tasks.",
    icon: CalendarDays,
  },
  {
    id: "classes",
    title: "Classes",
    text: "Only the batches and subjects allocated by Director or HOD appear here.",
    icon: GraduationCap,
  },
  {
    id: "exams",
    title: "Exams",
    text: "Create exams from assigned class topics. AI drafting and publishing comes in the exam phase.",
    icon: ClipboardCheck,
  },
  {
    id: "assignments",
    title: "Assignments",
    text: "Prepare homework and topic tasks for assigned classes.",
    icon: FileText,
  },
  {
    id: "attendance",
    title: "Attendance",
    text: "Mark class attendance and review leave requests.",
    icon: Users,
  },
  {
    id: "library",
    title: "Library",
    text: "Batch-wise folders for recorded classes, notes, links and reference files.",
    icon: Library,
  },
  {
    id: "academic-calendar",
    title: "Academic Calendar",
    text: "View planned topics and submit daily teaching completion logs.",
    icon: BookOpen,
  },
];

export default function TeacherDashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [calendarLog, setCalendarLog] = useState({
    completionStatus: "COMPLETED",
    teacherLog: "",
    nextAction: "",
  });
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "LEAVE">>({});
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null);
  const [libraryForm, setLibraryForm] = useState({
    folder: "",
    subject: "",
    topic: "",
    title: "",
    type: "PDF",
    url: "",
    fileName: "",
  });
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    topic: "",
    instructions: "",
    dueDate: "",
    attachmentName: "",
    link: "",
  });
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    title: "",
    topic: "",
    questionCount: "10",
    duration: "20",
    difficulty: "MEDIUM",
    instructions: "",
  });
  const [examDraft, setExamDraft] = useState<string | null>(null);
  const [examMessage, setExamMessage] = useState<string | null>(null);
  const [classWorkspace, setClassWorkspace] = useState<ClassWorkspace>({
    attendance: [],
    assignments: [],
    materials: [],
    exams: [],
    progress: [],
  });
  const [classWorkspaceLoading, setClassWorkspaceLoading] = useState(false);
  const [classWorkspaceMessage, setClassWorkspaceMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dashboardTemplate =
    user?.roleMetadata && typeof user.roleMetadata.dashboardTemplate === "string"
      ? user.roleMetadata.dashboardTemplate
      : null;

  const isAcademicHead =
    user?.role?.toUpperCase() === "ACADEMIC_HEAD" || dashboardTemplate?.toUpperCase() === "ACADEMIC_HEAD";

  const activeClasses = useMemo(
    () => classes.filter((item) => (item.status ?? "ACTIVE").toUpperCase() !== "ARCHIVED"),
    [classes],
  );

  const totalStudents = useMemo(
    () =>
      activeClasses.reduce((sum, item) => {
        if (typeof item._count?.students === "number") {
          return sum + item._count.students;
        }

        return sum + (item.students?.length ?? 0);
      }, 0),
    [activeClasses],
  );

  const selectedClass = useMemo(
    () => activeClasses.find((item) => item.id === selectedClassId) ?? activeClasses[0] ?? null,
    [activeClasses, selectedClassId],
  );

  const selectedStudents = useMemo(() => selectedClass?.students ?? [], [selectedClass?.students]);
  const selectedStudentEntry = useMemo(
    () =>
      selectedStudents.find((entry) => {
        const id = entry.student?.id ?? entry.id;
        return id === selectedStudentId;
      }) ??
      selectedStudents[0] ??
      null,
    [selectedStudentId, selectedStudents],
  );
  const selectedStudent = selectedStudentEntry?.student ?? null;
  const selectedStudentRecordId = selectedStudent?.id;
  const selectedCalendarItem = useMemo(
    () => calendar.find((item) => item.id === selectedCalendarId) ?? calendar[0] ?? null,
    [calendar, selectedCalendarId],
  );
  const selectedStudentAttendance = useMemo(() => {
    if (!selectedStudentRecordId) {
      return { present: 0, total: 0, percentage: 0 };
    }

    const total = classWorkspace.attendance.reduce((sum, session) => {
      const record = session.records?.find((item) => item.studentId === selectedStudentRecordId);
      return record ? sum + 1 : sum;
    }, 0);
    const present = classWorkspace.attendance.reduce((sum, session) => {
      const record = session.records?.find((item) => item.studentId === selectedStudentRecordId);
      return record?.status === "PRESENT" ? sum + 1 : sum;
    }, 0);

    return {
      present,
      total,
      percentage: total ? Math.round((present / total) * 100) : 0,
    };
  }, [classWorkspace.attendance, selectedStudentRecordId]);
  const classActivityItems = useMemo(
    () => [
      { label: "Attendance", value: classWorkspace.attendance.length },
      { label: "Assignments", value: classWorkspace.assignments.length },
      { label: "Materials", value: classWorkspace.materials.length },
      { label: "Exams", value: classWorkspace.exams.length },
      { label: "Progress Logs", value: classWorkspace.progress.length },
    ],
    [classWorkspace],
  );
  const todayActions = useMemo(
    () => [
      {
        title: selectedClass ? `Teach ${selectedClass.name}` : "Class allocation pending",
        text: selectedClass
          ? `${selectedClass.subject ?? "Subject"} · ${selectedClass._count?.students ?? selectedStudents.length} students`
          : "Director or HOD must assign a class first.",
        href: selectedClass ? "#class-detail" : "#classes",
        status: selectedClass ? "Ready" : "Pending",
      },
      {
        title: selectedCalendarItem ? "Update today's topic log" : "Academic calendar pending",
        text: selectedCalendarItem
          ? selectedCalendarItem.topic ?? "Planned topic selected"
          : "HOD calendar topics will appear here.",
        href: "#academic-calendar",
        status: selectedCalendarItem ? "Action" : "Pending",
      },
      {
        title: "Mark attendance",
        text: selectedStudents.length ? `${selectedStudents.length} students ready for attendance` : "Students not assigned yet.",
        href: "#attendance",
        status: selectedStudents.length ? "Action" : "Waiting",
      },
      {
        title: "Create class exam or assignment",
        text: selectedClass ? "Use the selected class for quick publishing." : "Select a class first.",
        href: selectedClass ? "#exams" : "#classes",
        status: selectedClass ? "Ready" : "Pending",
      },
    ],
    [selectedCalendarItem, selectedClass, selectedStudents.length],
  );
  const readinessItems = useMemo(
    () => [
      {
        title: "Class allocation",
        ready: activeClasses.length > 0,
        text: activeClasses.length
          ? `${activeClasses.length} assigned class(es) loaded.`
          : "Director or HOD must assign classes first.",
      },
      {
        title: "Student list",
        ready: selectedStudents.length > 0,
        text: selectedStudents.length
          ? `${selectedStudents.length} student(s) available in selected class.`
          : "Students appear after Admission Cell approval and batch assignment.",
      },
      {
        title: "Academic calendar",
        ready: calendar.length > 0,
        text: calendar.length
          ? `${calendar.length} planned topic(s) available.`
          : "HOD calendar planning is pending for this teacher.",
      },
      {
        title: "Teacher actions",
        ready: Boolean(selectedClass),
        text: selectedClass
          ? "Attendance, assignments, exams and library actions are connected to selected class."
          : "Select or assign a class to activate actions.",
      },
    ],
    [activeClasses.length, calendar.length, selectedClass, selectedStudents.length],
  );

  async function loadTeachingPlan() {
    setLoading(true);
    setError(null);

    const data = await apiGet<TeachingPlan | AssignedClass[]>(["/api/academy/my-teaching-plan"]);

    if (!data) {
      setClasses([]);
      setCalendar([]);
      setError("No teaching allocation found yet. Director or HOD must assign classes first.");
      setLoading(false);
      return;
    }

    const assignedClasses = normalizeAssignedClasses(data);
    const plannedCalendar = Array.isArray(data) ? [] : data.calendar ?? [];
    setClasses(assignedClasses);
    setCalendar(plannedCalendar);
    setSelectedClassId((current) => current ?? assignedClasses[0]?.id ?? null);
    setSelectedCalendarId((current) => current ?? plannedCalendar[0]?.id ?? null);
    setLoading(false);
  }

  async function loadClassWorkspace(batchId: string) {
    setClassWorkspaceLoading(true);
    setClassWorkspaceMessage(null);

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
    setClassWorkspaceMessage(
      attendanceData || assignmentData || materialData || examData || progressData
        ? "Class workspace loaded from server."
        : "Class workspace could not load. Check academy API access.",
    );
    setClassWorkspaceLoading(false);
  }

  async function submitCalendarLog() {
    if (!selectedCalendarItem) {
      setCalendarMessage("Select a planned topic first.");
      return;
    }

    setCalendarMessage("Saving class log...");

    const payload = {
      completionStatus: calendarLog.completionStatus,
      teacherLog: calendarLog.teacherLog,
      nextAction: calendarLog.nextAction,
      status: "UPDATED_BY_TEACHER",
    };

    const saved = await apiPatch<CalendarItem>(
      [
        `/api/academy/academic-calendar/${selectedCalendarItem.id}`,
        `/api/academy/calendar/${selectedCalendarItem.id}`,
      ],
      payload,
    );

    if (!saved) {
      setCalendarMessage("Could not save to server yet. Please check backend calendar endpoint.");
      return;
    }

    setCalendar((items) =>
      items.map((item) =>
        item.id === selectedCalendarItem.id
          ? {
              ...item,
              ...payload,
            }
          : item,
      ),
    );
    setCalendarMessage("Class log saved.");
    if (selectedClass?.id) {
      void loadClassWorkspace(selectedClass.id);
    }
  }

  function markAllAttendance(status: "PRESENT" | "ABSENT" | "LEAVE") {
    const next: Record<string, "PRESENT" | "ABSENT" | "LEAVE"> = {};

    selectedStudents.forEach((entry, index) => {
      const id = entry.student?.id ?? entry.id ?? String(index);
      next[id] = status;
    });

    setAttendance(next);
  }

  function updateAttendance(studentId: string, status: "PRESENT" | "ABSENT" | "LEAVE") {
    setAttendance((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  async function saveAttendance() {
    if (!selectedClass) {
      setAttendanceMessage("Select a class first.");
      return;
    }

    if (!selectedStudents.length) {
      setAttendanceMessage("No students are assigned to this class yet.");
      return;
    }

    setAttendanceMessage("Saving attendance...");

    const records = selectedStudents.map((entry, index) => {
      const student = entry.student;
      const studentId = student?.id ?? entry.id ?? String(index);
      return {
        studentId,
        studentName: student?.name,
        status: attendance[studentId] ?? "PRESENT",
      };
    });

    const saved = await apiPost<{ ok?: boolean }>(["/api/academy/attendance"], {
      batchId: selectedClass.id,
      batchName: selectedClass.name,
      subject: selectedClass.subject,
      date: attendanceDate,
      records,
    });

    if (!saved) {
      setAttendanceMessage("Could not save to server yet. Please check backend attendance endpoint.");
      return;
    }

    setAttendanceMessage("Attendance saved.");
    void loadClassWorkspace(selectedClass.id);
  }

  async function publishLibraryMaterial() {
    if (!selectedClass) {
      setLibraryMessage("Select a class first.");
      return;
    }

    if (!libraryForm.title.trim()) {
      setLibraryMessage("Enter a material title.");
      return;
    }

    setLibraryMessage("Publishing material...");

    const saved = await apiPost<{ ok?: boolean }>(["/api/academy/study-materials"], {
      batchId: selectedClass.id,
      batchName: selectedClass.name,
      course: selectedClass.course?.title ?? selectedClass.course?.name,
      folder: libraryForm.folder || selectedClass.course?.title || selectedClass.name,
      subject: libraryForm.subject || selectedClass.subject,
      topic: libraryForm.topic,
      title: libraryForm.title,
      type: libraryForm.type,
      url: libraryForm.url,
      fileName: libraryForm.fileName,
      status: "PUBLISHED",
    });

    if (!saved) {
      setLibraryMessage("Could not publish to server yet. Please check backend library/material endpoint.");
      return;
    }

    setLibraryMessage("Material published to the selected class.");
    void loadClassWorkspace(selectedClass.id);
    setLibraryForm({
      folder: "",
      subject: "",
      topic: "",
      title: "",
      type: "PDF",
      url: "",
      fileName: "",
    });
  }

  async function archiveLibraryMaterial(materialId: string) {
    if (!selectedClass) {
      setLibraryMessage("Select a class first.");
      return;
    }
    setLibraryMessage("Archiving material...");
    const archived = await apiPost<{ ok?: boolean }>([`/api/academy/study-materials/${materialId}/archive`], {});
    if (!archived) {
      setLibraryMessage("Could not archive material.");
      return;
    }
    setLibraryMessage("Material archived.");
    void loadClassWorkspace(selectedClass.id);
  }

  async function createExamDraft() {
    if (!selectedClass) {
      setExamMessage("Select a class first.");
      return;
    }

    if (!examForm.topic.trim()) {
      setExamMessage("Enter the exam topic.");
      return;
    }

    setExamMessage("Preparing NIDUS AI exam draft...");

    const draft = await apiPost<{ draft?: string; questions?: unknown[] }>(["/api/academy/exams/ai-draft"], {
      batchId: selectedClass.id,
      batchName: selectedClass.name,
      subject: selectedClass.subject,
      topic: examForm.topic,
      questionCount: Number(examForm.questionCount),
      duration: Number(examForm.duration),
      difficulty: examForm.difficulty,
    });

    if (draft?.draft) {
      setExamDraft(draft.draft);
      setExamMessage("AI draft ready for teacher review.");
      return;
    }

    setExamDraft(
      `Draft request prepared for ${examForm.questionCount} ${examForm.difficulty.toLowerCase()} questions on "${
        examForm.topic
      }". Publish will create the live CBT test for this batch.`,
    );
    setExamMessage("Draft request prepared. Publish will create the class test.");
  }

  async function publishExam() {
    if (!selectedClass) {
      setExamMessage("Select a class first.");
      return;
    }

    if (!examForm.title.trim()) {
      setExamMessage("Enter exam title.");
      return;
    }

    if (!examForm.topic.trim()) {
      setExamMessage("Enter exam topic.");
      return;
    }

    setExamMessage("Publishing exam...");

    const saved = await apiPost<{ ok?: boolean }>(["/api/academy/exams"], {
      batchId: selectedClass.id,
      batchName: selectedClass.name,
      subject: selectedClass.subject,
      course: selectedClass.course?.title ?? selectedClass.course?.name,
      title: examForm.title,
      topic: examForm.topic,
      questionCount: Number(examForm.questionCount),
      durationMinutes: Number(examForm.duration),
      difficulty: examForm.difficulty,
      instructions: examForm.instructions,
      draft: examDraft,
      status: "PUBLISHED",
    });

    if (!saved) {
      setExamMessage("Could not publish to server yet. Please check backend exam endpoint.");
      return;
    }

    setExamMessage("Exam published to the selected class and added to student CBT.");
    void loadClassWorkspace(selectedClass.id);
    setExamForm({
      title: "",
      topic: "",
      questionCount: "10",
      duration: "20",
      difficulty: "MEDIUM",
      instructions: "",
    });
    setExamDraft(null);
  }

  async function publishAssignment() {
    if (!selectedClass) {
      setAssignmentMessage("Select a class first.");
      return;
    }

    if (!assignmentForm.title.trim()) {
      setAssignmentMessage("Enter an assignment title.");
      return;
    }

    if (!assignmentForm.instructions.trim()) {
      setAssignmentMessage("Enter simple instructions for students.");
      return;
    }

    setAssignmentMessage("Publishing assignment...");

    const saved = await apiPost<{ ok?: boolean }>(["/api/academy/assignments"], {
      batchId: selectedClass.id,
      batchName: selectedClass.name,
      subject: selectedClass.subject,
      course: selectedClass.course?.title ?? selectedClass.course?.name,
      title: assignmentForm.title,
      topic: assignmentForm.topic,
      instructions: assignmentForm.instructions,
      dueDate: assignmentForm.dueDate,
      attachmentName: assignmentForm.attachmentName,
      link: assignmentForm.link,
      status: "PUBLISHED",
    });

    if (!saved) {
      setAssignmentMessage("Could not publish to server yet. Please check backend assignment endpoint.");
      return;
    }

    setAssignmentMessage("Assignment published to the selected class.");
    void loadClassWorkspace(selectedClass.id);
    setAssignmentForm({
      title: "",
      topic: "",
      instructions: "",
      dueDate: "",
      attachmentName: "",
      link: "",
    });
  }

  useEffect(() => {
    setUser(readStoredUser());
    void loadTeachingPlan();
  }, []);

  useEffect(() => {
    if (!selectedClass?.id) {
      setClassWorkspace({
        attendance: [],
        assignments: [],
        materials: [],
        exams: [],
        progress: [],
      });
      return;
    }

    void loadClassWorkspace(selectedClass.id);
  }, [selectedClass?.id]);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section id="today" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Teacher Desk</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Welcome{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Your dashboard is now connected to real class allocation. Only batches and subjects assigned by the
                Director or Academic Head will appear here.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAcademicHead ? (
                <Link
                  href="/dashboard/academic-head"
                  className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
                >
                  Switch to HOD Mode
                </Link>
              ) : null}
              <button
                type="button"
                onClick={loadTeachingPlan}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black text-[var(--ink)]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Assigned Classes</p>
              <p className="mt-2 text-3xl font-black text-[var(--gold-dark)]">{activeClasses.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Students</p>
              <p className="mt-2 text-3xl font-black text-[var(--gold-dark)]">{totalStudents}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Data Status</p>
              <p className="mt-2 text-lg font-black">{loading ? "Loading" : error ? "Needs Allocation" : "Live"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {todayActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    {action.status}
                  </span>
                  <span className="text-xs font-black text-[var(--gold-dark)]">Open</span>
                </div>
                <h2 className="mt-4 text-lg font-black">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{action.text}</p>
              </a>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">
                  Production Readiness
                </p>
                <h2 className="mt-2 text-2xl font-black">Teacher workspace status</h2>
              </div>
              <span className="rounded-full border border-[var(--gold-border)] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                Real data only
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {readinessItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                      item.ready
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.ready ? "Ready" : "Awaiting data"}
                  </span>
                  <h3 className="mt-4 font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
              </a>
            );
          })}
        </section>

        <section id="classes" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Classes</p>
              <h2 className="mt-2 text-3xl font-black">Assigned batches and subjects</h2>
            </div>
            <p className="text-sm font-bold text-[var(--muted)]">{activeClasses.length} live allocation(s)</p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-[var(--muted)]">
              Loading your assigned classes...
            </div>
          ) : activeClasses.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeClasses.map((item) => {
                const isSelected = selectedClass?.id === item.id;
                return (
                <article
                  key={item.id}
                  className={`rounded-3xl border p-5 transition ${
                    isSelected
                      ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-lg"
                      : "border-[var(--border)] bg-[var(--page-bg)] hover:-translate-y-1 hover:shadow-lg"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">
                    {item.subject ?? "Subject not set"}
                  </p>
                  <h3 className="mt-3 text-2xl font-black">{item.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.course?.title ?? item.course?.name ?? "Course details will appear after HOD setup."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2">
                      {item._count?.students ?? item.students?.length ?? 0} students
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2">
                      {item.role ?? "Teacher"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassId(item.id);
                      setSelectedStudentId(null);
                    }}
                    className="mt-5 w-full rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--ink)] shadow"
                  >
                    Open Class
                  </button>
                </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--gold-border)] bg-[var(--gold-soft)] p-6">
              <h3 className="text-xl font-black">No assigned class yet</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Ask the Director or Academic Head to assign a batch, subject and timetable. Once assigned, this area
                will automatically show the teacher’s real teaching workspace.
              </p>
            </div>
          )}
        </section>

        <section id="class-detail" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Class Room</p>
              <h2 className="mt-2 text-3xl font-black">
                {selectedClass ? selectedClass.name : "Select a class"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {selectedClass
                  ? `${selectedClass.course?.title ?? selectedClass.course?.name ?? "Academy program"} · ${
                      selectedClass.subject ?? "Subject not set"
                    }`
                  : "Open a class thumbnail to see students, timetable and quick actions."}
              </p>
            </div>
            {selectedClass ? (
              <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                {selectedClass.role ?? "Teacher"}
              </span>
            ) : null}
          </div>

          {selectedClass ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">
                      Students
                    </p>
                    <h3 className="mt-2 text-2xl font-black">Batch students</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-black">
                    {selectedStudents.length || selectedClass._count?.students || 0} students
                  </span>
                </div>

                {selectedStudents.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedStudents.map((entry, index) => {
                      const student = entry.student;
                      const studentId = student?.id ?? entry.id ?? String(index);
                      const isSelectedStudent = studentId === (selectedStudent?.id ?? selectedStudentEntry?.id);
                      return (
                        <button
                          type="button"
                          key={entry.id ?? student?.id ?? index}
                          onClick={() => setSelectedStudentId(studentId)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelectedStudent
                              ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow"
                              : "border-[var(--border)] bg-white hover:-translate-y-1 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-black text-[var(--gold)]">
                              {(student?.name ?? "S").slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <h4 className="truncate font-black">{student?.name ?? "Student"}</h4>
                              <p className="truncate text-xs text-[var(--muted)]">{student?.email ?? "Profile pending"}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
                            <span className="rounded-full bg-[var(--page-bg)] px-3 py-1">{entry.status ?? "Active"}</span>
                            {student?.mobile ? (
                              <span className="rounded-full bg-[var(--page-bg)] px-3 py-1">{student.mobile}</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
                    Students will appear here after Admission Cell approves applications and the Director/HOD assigns
                    them to this batch.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div id="student-profile" className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">
                    Student Profile
                  </p>
                  {selectedStudent ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-lg font-black text-[var(--gold)]">
                          {(selectedStudent.name ?? "S").slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-2xl font-black">{selectedStudent.name ?? "Student"}</h3>
                          <p className="truncate text-sm text-[var(--muted)]">{selectedStudent.email ?? "Email pending"}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm">
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)]">Contact</p>
                          <p className="mt-2 font-bold">{selectedStudent.mobile ?? "Mobile number pending"}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)]">Class Status</p>
                          <p className="mt-2 font-bold">{selectedStudentEntry?.status ?? "Active"}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)]">Attendance</p>
                          <p className="mt-2 font-bold">
                            {selectedStudentAttendance.total
                              ? `${selectedStudentAttendance.percentage}% - ${selectedStudentAttendance.present}/${selectedStudentAttendance.total}`
                              : "No marked sessions yet"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <a
                          href={`/digital-profile?studentId=${selectedStudent.id ?? ""}`}
                          className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-center text-sm font-black text-[var(--ink)] shadow"
                        >
                          Open Digital Profile
                        </a>
                        <a
                          href="#attendance"
                          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black"
                        >
                          View Attendance
                        </a>
                        <a
                          href="#exams"
                          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black"
                        >
                          View Exam Performance
                        </a>
                        <a
                          href="#assignments"
                          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black"
                        >
                          View Assignments
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      Select a student from the class list. If no students are listed, Admission Cell must approve and
                      assign students to this batch first.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Quick Actions</p>
                  <div className="mt-4 grid gap-3">
                    <a href="#attendance" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
                      Mark Attendance
                    </a>
                    <a href="#academic-calendar" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
                      Open Today&apos;s Topic
                    </a>
                    <a href="#exams" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
                      Create Quick Exam
                    </a>
                    <a href="#library" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
                      Upload Material
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">
                        Class Activity
                      </p>
                      <h3 className="mt-2 text-2xl font-black">Live workspace</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectedClass?.id && loadClassWorkspace(selectedClass.id)}
                      className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {classActivityItems.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{item.label}</p>
                        <p className="mt-2 text-2xl font-black text-[var(--gold-dark)]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {classWorkspace.progress.length ? (
                    <div className="mt-4 space-y-3">
                      {classWorkspace.progress.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-black">{item.topic}</p>
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]">
                              {item.progressColor ?? "ORANGE"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {item.subject} - {item.completionStatus ?? "PENDING"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                      Syllabus progress appears after teachers save calendar completion logs for this class.
                    </p>
                  )}

                  {classWorkspaceMessage ? (
                    <p className="mt-4 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-xs font-bold text-[var(--muted)]">
                      {classWorkspaceLoading ? "Loading class workspace..." : classWorkspaceMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-[var(--muted)]">
              No class selected.
            </div>
          )}
        </section>

        <section id="academic-calendar" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">
                Academic Calendar
              </p>
              <h2 className="mt-2 text-3xl font-black">Daily teaching plan and completion log</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                This is the Director/HOD-prepared plan. Teachers click a topic, update completion, add remarks and
                submit the next action in one place.
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {calendar.length} planned topic(s)
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Planned topics</h3>
              {calendar.length ? (
                <div className="mt-4 space-y-3">
                  {calendar.map((item) => {
                    const selected = selectedCalendarItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedCalendarId(item.id);
                          setCalendarLog({
                            completionStatus: item.completionStatus ?? "COMPLETED",
                            teacherLog: item.teacherLog ?? "",
                            nextAction: item.nextAction ?? "",
                          });
                          setCalendarMessage(null);
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow"
                            : "border-[var(--border)] bg-white hover:shadow-md"
                        }`}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">
                          {item.plannedDate ?? "Date pending"}
                        </p>
                        <h4 className="mt-2 font-black">{item.topic ?? "Topic pending"}</h4>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.batchName ?? selectedClass?.name ?? "Batch"} · {item.subject ?? "Subject"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
                  No calendar plan is assigned yet. Director or Academic Head should prepare the class calendar first.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Completion report</h3>
              {selectedCalendarItem ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)]">Selected topic</p>
                    <p className="mt-2 font-black">{selectedCalendarItem.topic ?? "Topic pending"}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{selectedCalendarItem.subject ?? "Subject pending"}</p>
                  </div>

                  <label className="block">
                    <span className="text-sm font-black">Completion status</span>
                    <select
                      value={calendarLog.completionStatus}
                      onChange={(event) =>
                        setCalendarLog((value) => ({ ...value, completionStatus: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]"
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="PARTIAL">Partially completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black">Class log / remarks</span>
                    <textarea
                      value={calendarLog.teacherLog}
                      onChange={(event) => setCalendarLog((value) => ({ ...value, teacherLog: event.target.value }))}
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                      placeholder="What was taught? Any student response, difficulty or note?"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black">Next action</span>
                    <input
                      value={calendarLog.nextAction}
                      onChange={(event) => setCalendarLog((value) => ({ ...value, nextAction: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                      placeholder="Example: give 10 MCQ practice / revise map work / upload notes"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={submitCalendarLog}
                    className="w-full rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
                  >
                    Save Class Log
                  </button>

                  {calendarMessage ? (
                    <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
                      {calendarMessage}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Select a planned topic to add completion status and teacher remarks.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="attendance" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Attendance</p>
              <h2 className="mt-2 text-3xl font-black">One-click class attendance</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Select the class from the Classes section, choose the date, mark students and save. Default status is
                Present so teachers can finish attendance quickly.
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)]">Date</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="mt-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]"
              />
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black">{selectedClass?.name ?? "Select a class"}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selectedClass?.subject ?? "Subject"} · {selectedStudents.length} student(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markAllAttendance("PRESENT")}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAllAttendance("ABSENT")}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-800"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {selectedStudents.length ? (
              <div className="mt-5 space-y-3">
                {selectedStudents.map((entry, index) => {
                  const student = entry.student;
                  const studentId = student?.id ?? entry.id ?? String(index);
                  const current = attendance[studentId] ?? "PRESENT";

                  return (
                    <div
                      key={entry.id ?? student?.id ?? index}
                      className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-black text-[var(--gold)]">
                          {(student?.name ?? "S").slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-black">{student?.name ?? "Student"}</p>
                          <p className="truncate text-xs text-[var(--muted)]">{student?.email ?? "Profile pending"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(["PRESENT", "ABSENT", "LEAVE"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateAttendance(studentId, status)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black ${
                              current === status
                                ? "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--ink)]"
                                : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted)]"
                            }`}
                          >
                            {status === "PRESENT" ? "Present" : status === "ABSENT" ? "Absent" : "Leave"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
                No students are assigned to this class yet. Attendance will become active after Admission Cell approval
                and batch assignment.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={saveAttendance}
                className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
              >
                Save Attendance
              </button>
              {attendanceMessage ? (
                <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
                  {attendanceMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-black">Attendance history</h4>
                <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
                  {classWorkspace.attendance.length} saved
                </span>
              </div>
              {classWorkspace.attendance.length ? (
                <div className="mt-4 space-y-3">
                  {classWorkspace.attendance.slice(0, 5).map((session) => (
                    <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                      <p className="font-black">{session.date?.slice(0, 10) ?? "Date pending"}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {session.subject ?? selectedClass?.subject ?? "Subject"} - {session.records?.length ?? 0} student records
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">No attendance has been saved for this class yet.</p>
              )}
            </div>
          </div>
        </section>

        <section id="library" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Library</p>
              <h2 className="mt-2 text-3xl font-black">Batch study material folders</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Upload or link recorded classes, notes, PDFs and reference files. Materials are published only to the
                selected class.
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {selectedClass?.name ?? "No class selected"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Folder Path</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Course</p>
                  <p className="mt-2 font-black">
                    {selectedClass?.course?.title ?? selectedClass?.course?.name ?? "Course pending"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Batch</p>
                  <p className="mt-2 font-black">{selectedClass?.name ?? "Select a class"}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Subject</p>
                  <p className="mt-2 font-black">{libraryForm.subject || selectedClass?.subject || "Subject pending"}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Topic</p>
                  <p className="mt-2 font-black">{libraryForm.topic || "Topic will appear after entry"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Publish material</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black">Folder name</span>
                  <input
                    value={libraryForm.folder}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, folder: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: NDA Foundation"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Subject</span>
                  <input
                    value={libraryForm.subject}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, subject: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder={selectedClass?.subject ?? "Subject"}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Topic</span>
                  <input
                    value={libraryForm.topic}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, topic: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Medieval India"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Material type</span>
                  <select
                    value={libraryForm.type}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, type: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]"
                  >
                    <option value="PDF">PDF</option>
                    <option value="RECORDED_CLASS">Recorded class</option>
                    <option value="NOTES">Notes</option>
                    <option value="IMAGE">Photo / Image</option>
                    <option value="LINK">External link</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Title</span>
                  <input
                    value={libraryForm.title}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Medieval India quick revision notes"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">File</span>
                  <input
                    type="file"
                    onChange={(event) =>
                      setLibraryForm((value) => ({ ...value, fileName: event.target.files?.[0]?.name ?? "" }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                  />
                  {libraryForm.fileName ? (
                    <p className="mt-2 text-xs font-bold text-[var(--muted)]">Selected: {libraryForm.fileName}</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-sm font-black">Link</span>
                  <input
                    value={libraryForm.url}
                    onChange={(event) => setLibraryForm((value) => ({ ...value, url: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Paste video/class/reference link"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={publishLibraryMaterial}
                  className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
                >
                  Publish to Class
                </button>
                {libraryMessage ? (
                  <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
                    {libraryMessage}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black">Published materials</h4>
                  <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
                    {classWorkspace.materials.length} item(s)
                  </span>
                </div>
                {classWorkspace.materials.length ? (
                  <div className="mt-4 space-y-3">
                    {classWorkspace.materials.slice(0, 5).map((material) => (
                      <div key={material.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-black">{material.title}</p>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">
                            {material.reviewStatus ?? "PENDING_REVIEW"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {material.type ?? "Material"} - {material.topic ?? material.subject ?? "Topic pending"}
                        </p>
                        <button
                          type="button"
                          onClick={() => archiveLibraryMaterial(material.id)}
                          className="mt-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-black text-[var(--muted)]"
                        >
                          Archive
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">No materials published for this class yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="assignments" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Assignments</p>
              <h2 className="mt-2 text-3xl font-black">Create and publish class work</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Keep it simple: select the class from Classes, write the task, add due date and publish. Students will
                receive it under their assigned batch.
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {selectedClass?.name ?? "No class selected"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Assignment Flow</p>
              <div className="mt-4 space-y-3">
                {[
                  "Choose the assigned class",
                  "Write task in simple language",
                  "Attach file or link if needed",
                  "Set due date",
                  "Publish to students",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-soft)] text-sm font-black">
                      {index + 1}
                    </span>
                    <p className="font-bold">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Assignment details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Title</span>
                  <input
                    value={assignmentForm.title}
                    onChange={(event) => setAssignmentForm((value) => ({ ...value, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Medieval India 10-question practice"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Topic</span>
                  <input
                    value={assignmentForm.topic}
                    onChange={(event) => setAssignmentForm((value) => ({ ...value, topic: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Delhi Sultanate"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Due date</span>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(event) => setAssignmentForm((value) => ({ ...value, dueDate: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Instructions</span>
                  <textarea
                    value={assignmentForm.instructions}
                    onChange={(event) =>
                      setAssignmentForm((value) => ({ ...value, instructions: event.target.value }))
                    }
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Explain exactly what students should do."
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Attachment</span>
                  <input
                    type="file"
                    onChange={(event) =>
                      setAssignmentForm((value) => ({
                        ...value,
                        attachmentName: event.target.files?.[0]?.name ?? "",
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                  />
                  {assignmentForm.attachmentName ? (
                    <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                      Selected: {assignmentForm.attachmentName}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-sm font-black">Reference link</span>
                  <input
                    value={assignmentForm.link}
                    onChange={(event) => setAssignmentForm((value) => ({ ...value, link: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Paste a study link if needed"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={publishAssignment}
                  className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
                >
                  Publish Assignment
                </button>
                {assignmentMessage ? (
                  <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
                    {assignmentMessage}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black">Published assignments</h4>
                  <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
                    {classWorkspace.assignments.length} task(s)
                  </span>
                </div>
                {classWorkspace.assignments.length ? (
                  <div className="mt-4 space-y-3">
                    {classWorkspace.assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-black">{assignment.title}</p>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">
                            {assignment.status ?? "PUBLISHED"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {assignment.topic ?? "Topic pending"}
                          {assignment.dueDate ? ` - Due ${assignment.dueDate.slice(0, 10)}` : ""}
                        </p>
                        {assignment.submissionStats ? (
                          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                            Submitted {assignment.submissionStats.submitted}/{assignment.submissionStats.totalStudents} / Pending {assignment.submissionStats.pending}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">No assignments published for this class yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="exams" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Exams</p>
              <h2 className="mt-2 text-3xl font-black">Create quick class exams</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Teacher enters the topic and timing. NIDUS AI prepares a question draft, teacher reviews it, then
                publishes to the selected class.
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {selectedClass?.name ?? "No class selected"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Exam Flow</p>
              <div className="mt-4 space-y-3">
                {[
                  "Select class from Classes",
                  "Enter topic, question count and time",
                  "Ask NIDUS AI to draft questions",
                  "Teacher reviews and approves",
                  "Publish to students",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-soft)] text-sm font-black">
                      {index + 1}
                    </span>
                    <p className="font-bold">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Exam details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Exam title</span>
                  <input
                    value={examForm.title}
                    onChange={(event) => setExamForm((value) => ({ ...value, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: NDA Foundation Test 01"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Topic</span>
                  <input
                    value={examForm.topic}
                    onChange={(event) => setExamForm((value) => ({ ...value, topic: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Medieval India"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Difficulty</span>
                  <select
                    value={examForm.difficulty}
                    onChange={(event) => setExamForm((value) => ({ ...value, difficulty: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black">Questions</span>
                  <input
                    type="number"
                    min="1"
                    value={examForm.questionCount}
                    onChange={(event) => setExamForm((value) => ({ ...value, questionCount: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Time in minutes</span>
                  <input
                    type="number"
                    min="1"
                    value={examForm.duration}
                    onChange={(event) => setExamForm((value) => ({ ...value, duration: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Teacher instructions</span>
                  <textarea
                    value={examForm.instructions}
                    onChange={(event) => setExamForm((value) => ({ ...value, instructions: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)]"
                    placeholder="Example: Include 4 options, one correct answer and explanation."
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={createExamDraft}
                  className="rounded-xl border border-[var(--gold-border)] bg-white px-5 py-3 text-sm font-black text-[var(--ink)]"
                >
                  Ask NIDUS AI
                </button>
                <button
                  type="button"
                  onClick={publishExam}
                  className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
                >
                  Publish Exam
                </button>
              </div>

              {examDraft ? (
                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">AI Draft</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{examDraft}</p>
                </div>
              ) : null}

              {examMessage ? (
                <p className="mt-4 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
                  {examMessage}
                </p>
              ) : null}

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black">Published exams</h4>
                  <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
                    {classWorkspace.exams.length} exam(s)
                  </span>
                </div>
                {classWorkspace.exams.length ? (
                  <div className="mt-4 space-y-3">
                    {classWorkspace.exams.slice(0, 5).map((exam) => (
                      <div key={exam.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-black">{exam.title}</p>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">
                            {exam.status ?? "PUBLISHED"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {exam.topic ?? "Topic pending"} - {exam.questionCount ?? 0} questions - {exam.durationMinutes ?? 0} min
                        </p>
                        <div className="mt-3 grid gap-2 text-xs font-black text-[var(--muted)] sm:grid-cols-3">
                          <span>Attempts: {exam.attemptStats?.attempts ?? 0}</span>
                          <span>Submitted: {exam.attemptStats?.submitted ?? 0}</span>
                          <span>Avg score: {exam.attemptStats?.averageScore ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">No exams published for this class yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="profile" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Profile</p>
              <h2 className="mt-2 text-3xl font-black">Teaching profile</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                A simple profile for the teacher’s identity, assigned subjects and current teaching responsibility.
              </p>
            </div>
            {isAcademicHead ? (
              <Link
                href="/dashboard/academic-head"
                className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-center text-sm font-black text-[var(--ink)] shadow"
              >
                Switch to HOD Mode
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Teacher</p>
              <h3 className="mt-3 text-2xl font-black">{user?.name ?? "Teacher"}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{user?.email ?? "Email not available"}</p>
              <p className="mt-4 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.2em]">
                {user?.role ?? "TEACHER"}
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Assigned Work</p>
              <h3 className="mt-3 text-2xl font-black">{activeClasses.length} class(es)</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Subjects and batches are controlled by Director or Academic Head allocation.
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Current Focus</p>
              <h3 className="mt-3 text-2xl font-black">{selectedClass?.subject ?? "Subject pending"}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {selectedClass?.name ?? "Class allocation will appear after setup."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
