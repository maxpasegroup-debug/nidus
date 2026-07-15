"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getAcademicCalendar,
  getAcademicCalendarMonitor,
  getAcademyToday,
  getAcademyBatches,
  getAcademyTeachers,
  getAssignmentSummary,
  getAttendanceSummary,
  getExamSummary,
  getMaterialSummary,
  getStudentProgressSummary,
  getSyllabusSummary,
  getTeacherPerformanceSummary,
  runAcademyTodayAction,
} from "@/services/academy";
import type { AcademyTodayTask } from "@/services/academy";
import { QuickActionDock } from "@/components/dashboard/quick-action-dock";

type HodTab = "TODAY" | "BATCHES" | "TIMETABLE" | "ALLOCATION" | "APPROVALS" | "MONITORING" | "REPORTS";
type HodTodayTask = {
  id: string;
  time: string;
  endTime?: string | null;
  type: string;
  title: string;
  detail: string;
  done: boolean;
  href: string;
  actions?: Array<{ key: string; label: string; href: string }>;
};

const tabs: Array<{ key: HodTab; label: string }> = [
  { key: "TODAY", label: "Today" },
  { key: "BATCHES", label: "Batches" },
  { key: "TIMETABLE", label: "Timetable" },
  { key: "ALLOCATION", label: "Teacher Allocation" },
  { key: "APPROVALS", label: "Approvals" },
  { key: "MONITORING", label: "Monitoring" },
  { key: "REPORTS", label: "Reports" },
];

function localDateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function statusTone(status?: string | null) {
  const value = String(status || "").toUpperCase();
  if (["GREEN", "HEALTHY", "COMPLETED", "PUBLISHED", "APPROVED"].includes(value)) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (["RED", "CRITICAL", "DELAYED", "MISSED", "REJECTED"].includes(value)) return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="min-w-0 border-b border-[var(--border)] py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--muted-blue)]">{note}</p> : null}
    </div>
  );
}

function Empty({ children }: { children: string }) {
  const [title, ...rest] = children.split(". ");
  const detail = rest.join(". ").trim();
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-5 text-sm text-[var(--muted-blue)]">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--gold-dark)]">
          <CheckCircle2 size={16} />
        </span>
        <div>
          <p className="font-black text-[var(--ink)]">{title}</p>
          {detail ? <p className="mt-1 leading-6">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ActionLink({ href, icon: Icon, title, note }: { href: string; icon: LucideIcon; title: string; note: string }) {
  return (
    <Link href={href} className="group flex min-h-24 items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-4 transition hover:border-slate-950">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--page-bg)]"><Icon size={18} /></span>
      <span className="min-w-0 flex-1"><strong className="block font-black">{title}</strong><span className="mt-1 block text-sm leading-5 text-[var(--muted-blue)]">{note}</span></span>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 opacity-40 transition group-hover:opacity-100" />
    </Link>
  );
}

function displayTaskTime(value?: string | null) {
  if (!value) return "Today";
  if (!value.includes(":")) return value;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function hodActionHref(actionKey: string, task: AcademyTodayTask) {
  if (actionKey === "REVIEW" && task.type === "ASSIGNMENT_REVIEW") return "/dashboard/academic-head/hod/approvals";
  if (actionKey === "REVIEW" && task.type === "EXAM_REVIEW") return "/dashboard/academic-head/hod/approvals";
  if (actionKey === "ATTENDANCE") return "/dashboard/academic-head/hod/reports";
  if (actionKey === "ASSIGNMENT") return "/dashboard/academic-head/assignments";
  if (actionKey === "EXAM") return "/dashboard/academic-head/exams";
  if (actionKey === "LIBRARY") return "/dashboard/academic-head/library";
  if (actionKey === "LIVE_CLASS") return "/dashboard/academic-head/classes";
  return task.batchId ? `/dashboard/academic-head/classes/assigned-program/${task.batchId}` : "/dashboard/academic-head/hod/timetable";
}

function academyTaskToHodTask(task: AcademyTodayTask): HodTodayTask {
  const defaultHref = task.type === "ASSIGNMENT_REVIEW" || task.type === "EXAM_REVIEW"
    ? "/dashboard/academic-head/hod/approvals"
    : task.batchId
      ? `/dashboard/academic-head/classes/assigned-program/${task.batchId}`
      : "/dashboard/academic-head/hod/timetable";
  return {
    id: task.id,
    time: displayTaskTime(task.time),
    endTime: task.endTime,
    type: String(task.type || "TASK").replaceAll("_", " "),
    title: task.title || `${task.batchName || "Academy"} / ${task.subject || "Task"}`,
    detail: task.detail || task.topic || "Action needed",
    done: task.done,
    href: defaultHref,
    actions: task.actions?.map((action) => ({ ...action, href: hodActionHref(action.key, task) })) ?? [],
  };
}

export function HodControlCenter({ initialTab = "TODAY" }: { initialTab?: HodTab }) {
  const [tab, setTab] = useState<HodTab>(initialTab);
  const batchesQuery = useQuery({ queryKey: ["hod", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["hod", "teachers"], queryFn: getAcademyTeachers });
  const calendarQuery = useQuery({ queryKey: ["hod", "calendar"], queryFn: () => getAcademicCalendar() });
  const attendanceQuery = useQuery({ queryKey: ["hod", "attendance"], queryFn: () => getAttendanceSummary() });
  const assignmentsQuery = useQuery({ queryKey: ["hod", "assignments"], queryFn: () => getAssignmentSummary() });
  const examsQuery = useQuery({ queryKey: ["hod", "exams"], queryFn: () => getExamSummary() });
  const materialsQuery = useQuery({ queryKey: ["hod", "materials"], queryFn: () => getMaterialSummary() });
  const syllabusQuery = useQuery({ queryKey: ["hod", "syllabus"], queryFn: () => getSyllabusSummary() });
  const teachersPerformanceQuery = useQuery({ queryKey: ["hod", "teacher-performance"], queryFn: getTeacherPerformanceSummary });
  const studentsProgressQuery = useQuery({ queryKey: ["hod", "student-progress"], queryFn: getStudentProgressSummary });
  const monitorQuery = useQuery({ queryKey: ["hod", "calendar-monitor"], queryFn: getAcademicCalendarMonitor });
  const todayQuery = useQuery({ queryKey: ["hod", "today"], queryFn: () => getAcademyToday() });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const assignments = assignmentsQuery.data?.assignments ?? [];
  const exams = examsQuery.data?.exams ?? [];
  const teacherPerformance = teachersPerformanceQuery.data?.teachers ?? [];
  const batchProgress = studentsProgressQuery.data?.batches ?? [];
  const monitor = monitorQuery.data?.items ?? [];
  const today = localDateKey();
  const todayClasses = useMemo(
    () => calendar.filter((item) => item.plannedDate.slice(0, 10) === today).sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || ""))),
    [calendar, today],
  );
  const activeBatches = batches.filter((batch) => batch.status === "ACTIVE");
  const totalStudents = activeBatches.reduce((total, batch) => total + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const completedToday = todayClasses.filter((item) => String(item.completionStatus || item.status).toUpperCase() === "COMPLETED").length;
  const pendingAttendance = Math.max(0, todayClasses.length - (attendanceQuery.data?.attendance.filter((item) => item.date.slice(0, 10) === today).length ?? 0));
  const pendingAssignments = assignments.filter((item) => ["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED"].includes(item.status.toUpperCase()));
  const pendingExams = exams.filter((item) => ["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED", "APPROVED"].includes(item.status.toUpperCase()));
  const attentionBatches = batchProgress.filter((item) => item.overallStatus !== "Healthy");
  const attentionTeachers = teacherPerformance.filter((item) => item.status !== "GREEN");
  const uncoveredBatches = activeBatches.filter((batch) => !(batch.teachers?.length ?? batch._count?.teachers ?? 0));
  const classIssues = monitor.reduce((total, item) => total + item.delayedClasses + item.missedClasses, 0);
  const loading = batchesQuery.isLoading || calendarQuery.isLoading || teachersQuery.isLoading;

  const fallbackTodayTasks = useMemo<HodTodayTask[]>(() => {
    const classTasks = todayClasses.map((item) => ({
      id: `calendar-${item.id}`,
      time: displayTaskTime(item.startTime),
      endTime: item.endTime,
      type: String(item.classType || "CLASS").replaceAll("_", " "),
      title: `${item.batchName} / ${item.subject}`,
      detail: item.topic || "Topic pending",
      done: [item.completionStatus, item.status].some((value) => String(value).toUpperCase() === "COMPLETED"),
      href: "/dashboard/academic-head/hod/timetable",
    }));
    const reviewTasks = [
      ...pendingAssignments.map((item) => ({ id: `assignment-${item.id}`, time: "Today", type: "ASSIGNMENT REVIEW", title: item.title, detail: `${item.batchName || "Batch"} / ${item.subject || "Subject"}`, done: false, href: "/dashboard/academic-head/hod/approvals" })),
      ...pendingExams.map((item) => ({ id: `exam-${item.id}`, time: "Today", type: "EXAMINATION REVIEW", title: item.title, detail: `${item.batchName || "Batch"} / ${item.subject || "Subject"}`, done: false, href: "/dashboard/academic-head/hod/approvals" })),
    ];
    if (pendingAttendance > 0) {
      reviewTasks.push({ id: "attendance-pending", time: "Today", type: "ATTENDANCE", title: `${pendingAttendance} attendance ${pendingAttendance === 1 ? "entry" : "entries"} pending`, detail: "Complete today's class attendance.", done: false, href: "/dashboard/academic-head/hod/reports" });
    }
    return [...classTasks, ...reviewTasks];
  }, [pendingAssignments, pendingAttendance, pendingExams, todayClasses]);
  const todayTasks = useMemo<HodTodayTask[]>(() => {
    if (todayQuery.data) return todayQuery.data.todayTasks.map(academyTaskToHodTask);
    return fallbackTodayTasks;
  }, [fallbackTodayTasks, todayQuery.data]);
  const nextUpcomingTask = todayQuery.data?.nextUpcomingTask ? academyTaskToHodTask(todayQuery.data.nextUpcomingTask) : null;
  const todayEmptyReason = todayQuery.data?.diagnostics.emptyReason;

  async function refreshHodToday() {
    await Promise.all([
      todayQuery.refetch(),
      calendarQuery.refetch(),
      attendanceQuery.refetch(),
      assignmentsQuery.refetch(),
      examsQuery.refetch(),
      monitorQuery.refetch(),
    ]);
  }

  async function runHodTodayAction(item: HodTodayTask, action: { key: string; label: string; href: string }) {
    const calendarId = item.id.replace(/^calendar-/, "");
    const source = todayQuery.data?.todayTasks.find((task) => task.id === item.id)
      ?? todayQuery.data?.upcomingTasks.find((task) => task.id === item.id)
      ?? todayQuery.data?.nextUpcomingTask;
    if (!source || source.id !== item.id) return;
    const basePayload = {
      taskId: source.id,
      calendarId,
      batchId: source.batchId || undefined,
      subject: source.subject || undefined,
      topic: source.topic || undefined,
      date: source.date,
      startTime: source.time || undefined,
      endTime: source.endTime || undefined,
    };
    if (action.key === "COMPLETE") {
      const teacherLog = window.prompt("What academic work is completed?", source.topic || source.detail || "Completed.");
      if (teacherLog === null) return;
      await runAcademyTodayAction({ ...basePayload, action: "COMPLETE", teacherLog, completionStatus: "COMPLETED" });
      await refreshHodToday();
      return;
    }
    if (action.key === "ATTENDANCE") {
      if (!window.confirm(`Mark all students present for ${source.batchName || "this batch"} / ${source.subject || "this subject"}?`)) return;
      await runAcademyTodayAction({ ...basePayload, action: "MARK_ATTENDANCE" });
      await refreshHodToday();
      return;
    }
    if (action.key === "LIVE_CLASS") {
      await runAcademyTodayAction({ ...basePayload, action: "START_LIVE_CLASS" });
      await refreshHodToday();
      return;
    }
    if (action.key === "RECORDING_UPLOADED") {
      const recordingUrl = window.prompt("Paste the uploaded recording URL");
      if (!recordingUrl) return;
      await runAcademyTodayAction({ ...basePayload, action: "RECORDING_UPLOADED", recordingUrl });
      await refreshHodToday();
    }
  }

  if (tab === "TODAY") {
    const remaining = todayTasks.filter((item) => !item.done).length;
    return (
      <main className="mx-auto grid w-full max-w-4xl gap-4 pb-20">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Today</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">Academic to-do list</h1>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">Only the academic work that needs attention today.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{remaining} remaining</span>
          </div>
        </header>

        {nextUpcomingTask ? (
          <section className="rounded-2xl border border-slate-950 bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Next academic action</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-[110px_1fr_auto] sm:items-center">
              <div>
                <p className="text-2xl font-black">{nextUpcomingTask.time}</p>
                {nextUpcomingTask.endTime ? <p className="text-xs text-white/70">to {displayTaskTime(nextUpcomingTask.endTime)}</p> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">{nextUpcomingTask.type}</p>
                <h2 className="mt-1 text-xl font-black">{nextUpcomingTask.title}</h2>
                <p className="mt-1 text-sm text-white/75">{nextUpcomingTask.detail}</p>
              </div>
              <Link href={nextUpcomingTask.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-slate-950">Open</Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-3">
          {todayTasks.map((item) => (
            <article key={item.id} className={`grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[96px_1fr_auto] sm:items-center ${item.done ? "border-emerald-200 bg-emerald-50/60" : "border-[var(--border)] bg-white"}`}>
              <div>
                <strong className="text-sm">{item.time}</strong>
                {item.endTime ? <p className="mt-1 text-xs text-[var(--muted-blue)]">to {displayTaskTime(item.endTime)}</p> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">{item.type}</p>
                <Link href={item.href} className="mt-1 block font-black hover:underline">{item.title}</Link>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.detail}</p>
                {item.actions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.actions.map((action) => ["COMPLETE", "ATTENDANCE", "LIVE_CLASS", "RECORDING_UPLOADED"].includes(action.key) ? (
                      <button key={`${item.id}-${action.key}`} type="button" onClick={() => runHodTodayAction(item, action)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black hover:border-slate-950">
                        {action.label}
                      </button>
                    ) : (
                      <Link key={`${item.id}-${action.key}`} href={action.href} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black hover:border-slate-950">
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${item.done ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                <CheckCircle2 size={14} /> {item.done ? "Done" : "To do"}
              </span>
            </article>
          ))}
          {!todayTasks.length && !loading && !todayQuery.isLoading ? <Empty>{todayEmptyReason === "NO_CALENDAR_IN_RANGE" ? "No timetable is generated for the next two weeks." : "Nothing is assigned for today."}</Empty> : null}
          {loading || todayQuery.isLoading ? <Empty>Loading today&apos;s academic work.</Empty> : null}
        </section>
        <QuickActionDock role="ACADEMIC_HEAD" />
      </main>
    );
  }

  return (
    <main className="grid gap-5 pb-20">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Academic Operations</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Run classes, batches and faculty from one place</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Run batches, timetable, faculty allocation, approvals and academic follow-up from one live workspace.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link href="/dashboard/academic-head/hod/timetable" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 px-4 text-sm font-black"><CalendarDays size={17} /> Plan Timetable</Link>
            <Link href="/dashboard/academic-head/hod/teacher-allocation" style={{ color: "#ffffff" }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black"><Users size={17} /> Allocate Teacher</Link>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-white px-5 shadow-sm">
        <div className="grid sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Active Batches" value={loading ? "..." : activeBatches.length} note={`${totalStudents} students`} />
          <Metric label="Classes Today" value={calendarQuery.isLoading ? "..." : todayClasses.length} note={`${completedToday} completed`} />
          <Metric label="Attendance Pending" value={attendanceQuery.isLoading ? "..." : pendingAttendance} />
          <Metric label="Assignment Reviews" value={assignmentsQuery.isLoading ? "..." : pendingAssignments.length} />
          <Metric label="Exam Reviews" value={examsQuery.isLoading ? "..." : pendingExams.length} />
          <Metric label="Academic Issues" value={monitorQuery.isLoading ? "..." : classIssues} note="delayed or missed" />
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm" aria-label="HOD workspaces">
        {tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-black ${tab === item.key ? "bg-slate-950 text-white" : "hover:bg-[var(--page-bg)]"}`}>{item.label}</button>)}
      </nav>

      {tab === "BATCHES" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Batch Control</p><h2 className="mt-2 text-2xl font-black">Active academic batches</h2></div><Link href="/dashboard/academic-head/hod/batches" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Manage Batches</Link></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeBatches.map((batch) => {
              const teacherCount = batch.teachers?.length ?? batch._count?.teachers ?? 0;
              const subjects = new Set((batch.teachers ?? []).map((item) => item.subject).filter(Boolean));
              return <article key={batch.id} className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">{batch.course?.title || batch.programSlug}</p><h3 className="mt-2 text-lg font-black">{batch.name}</h3><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><span className="rounded-lg bg-[var(--page-bg)] p-2"><b className="block text-base">{batch._count?.students ?? batch.students?.length ?? 0}</b>Students</span><span className="rounded-lg bg-[var(--page-bg)] p-2"><b className="block text-base">{teacherCount}</b>Teachers</span><span className="rounded-lg bg-[var(--page-bg)] p-2"><b className="block text-base">{subjects.size}</b>Subjects</span></div><span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-black ${teacherCount ? statusTone("HEALTHY") : statusTone("RED")}`}>{teacherCount ? "Staffed" : "Allocation needed"}</span></article>;
            })}
            {!activeBatches.length ? <Empty>No active batches are available.</Empty> : null}
          </div>
        </section>
      ) : null}

      {tab === "TIMETABLE" ? <WorkspaceGrid items={[
        { href: "/dashboard/academic-head/hod/timetable", icon: CalendarDays, title: "Plan Timetable", note: "Generate recurring weekly sessions and assign faculty." },
        { href: "/dashboard/academic-head/hod/timetable", icon: CalendarClock, title: "Academic Calendar", note: "Open day, week and month execution views." },
        { href: "/dashboard/academic-head/hod/calendar-monitor", icon: CheckCircle2, title: "Class Completion", note: "Track completed, delayed and missed sessions." },
      ]} /> : null}

      {tab === "ALLOCATION" ? (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <WorkspaceGrid items={[{ href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users, title: "Allocate Teachers", note: "Assign teacher, subject and batch or update existing allocations." }]} />
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Coverage</p><h2 className="mt-2 text-2xl font-black">Faculty workload</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{teacherPerformance.slice(0, 12).map((teacher) => <article key={teacher.teacherId} className="rounded-xl border border-[var(--border)] p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-black">{teacher.teacherName}</h3><span className={`h-3 w-3 rounded-full ${teacher.status === "GREEN" ? "bg-emerald-500" : teacher.status === "RED" ? "bg-rose-500" : "bg-amber-500"}`} /></div><p className="mt-2 text-sm text-[var(--muted-blue)]">{teacher.assignedBatches} batches / {teacher.assignedSubjects.length} subjects</p></article>)}{!teacherPerformance.length ? <Empty>No faculty performance records are available.</Empty> : null}</div>{uncoveredBatches.length ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800">{uncoveredBatches.length} active batches currently have no teacher allocation.</p> : null}</div>
        </section>
      ) : null}

      {tab === "APPROVALS" ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <ApprovalPanel title="Assignments awaiting action" href="/dashboard/academic-head/hod/approvals" items={pendingAssignments.map((item) => ({ id: item.id, title: item.title, meta: `${item.batchName || "Batch"} / ${item.subject || "Subject"}`, status: item.status }))} />
          <ApprovalPanel title="Exams awaiting action" href="/dashboard/academic-head/hod/approvals" items={pendingExams.map((item) => ({ id: item.id, title: item.title, meta: `${item.batchName || "Batch"} / ${item.subject || "Subject"}`, status: item.status }))} />
        </section>
      ) : null}

      {tab === "MONITORING" ? <WorkspaceGrid items={[
        { href: "/dashboard/academic-head/hod/teacher-monitoring", icon: Users, title: "Teacher Monitoring", note: `${attentionTeachers.length} teachers currently need follow-up.` },
        { href: "/dashboard/academic-head/hod/student-monitoring", icon: GraduationCap, title: "Student Monitoring", note: `${attentionBatches.reduce((total, item) => total + item.riskStudentCount, 0)} students are currently flagged.` },
        { href: "/dashboard/academic-head/hod/syllabus", icon: BarChart3, title: "Syllabus Progress", note: `${syllabusQuery.data?.summary.completionPercentage ?? 0}% overall completion.` },
        { href: "/dashboard/academic-head/hod/reports", icon: Library, title: "Library Delivery", note: `${materialsQuery.data?.summary.total ?? 0} learning materials available.` },
      ]} /> : null}

      {tab === "REPORTS" ? <WorkspaceGrid items={[
        { href: "/dashboard/academic-head/hod/reports", icon: BarChart3, title: "Academic Reports", note: "Attendance, assignment, exam, syllabus and material health." },
        { href: "/dashboard/academic-head/hod/calendar-monitor", icon: CalendarClock, title: "Class Execution Report", note: `${classIssues} delayed or missed class records.` },
        { href: "/dashboard/academic-head/hod/student-monitoring", icon: GraduationCap, title: "Batch & Student Report", note: `${attentionBatches.length} batches need academic attention.` },
      ]} /> : null}
      <QuickActionDock role="ACADEMIC_HEAD" />
    </main>
  );
}

function WorkspaceGrid({ items }: { items: Array<{ href: string; icon: LucideIcon; title: string; note: string }> }) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ActionLink key={item.href} {...item} />)}</section>;
}

function ApprovalPanel({ title, href, items }: { title: string; href: string; items: Array<{ id: string; title: string; meta: string; status: string }> }) {
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><div className="flex items-end justify-between gap-3"><h2 className="text-xl font-black">{title}</h2><Link href={href} className="text-sm font-black text-[var(--gold-dark)]">View queue</Link></div><div className="mt-5 grid gap-3">{items.slice(0, 8).map((item) => <Link href={href} key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted-blue)]">{item.meta}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusTone(item.status)}`}>{item.status.replaceAll("_", " ")}</span></div></Link>)}{!items.length ? <Empty>No records are waiting for approval.</Empty> : null}</div></section>;
}
