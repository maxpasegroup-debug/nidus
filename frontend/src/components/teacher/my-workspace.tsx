"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/services/api";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  FileText,
  History,
  Library,
  Search,
  Megaphone,
  Presentation,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Target,
  UserCheck,
  Users,
  UserSearch,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type WorkspaceRole = "TEACHER" | "ACADEMIC_HEAD";

type WorkspaceTool = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  label: string;
  primary?: boolean;
};

type WorkspaceBatch = {
  id: string;
  name?: string | null;
};

type WorkspaceCalendarItem = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  plannedDate?: string | null;
  startTime?: string | null;
  status?: string | null;
  completionStatus?: string | null;
};

type WorkspaceRecord = {
  id: string;
  title?: string | null;
  batchName?: string | null;
  subject?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
  createdAt?: string | null;
};

type WorkspaceData = {
  batches: WorkspaceBatch[];
  calendar: WorkspaceCalendarItem[];
  assignments: WorkspaceRecord[];
  exams: WorkspaceRecord[];
  materials: WorkspaceRecord[];
};

const EMPTY_WORKSPACE: WorkspaceData = { batches: [], calendar: [], assignments: [], exams: [], materials: [] };

function recordsFrom<T>(value: unknown, key: string): T[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  if (record.data && typeof record.data === "object" && Array.isArray((record.data as Record<string, unknown>)[key])) {
    return (record.data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function recordDate(record: WorkspaceRecord) {
  return record.createdAt || record.scheduledAt || record.dueDate || "";
}

function latestRecord(records: WorkspaceRecord[]) {
  return records
    .filter((record) => Number.isFinite(Date.parse(recordDate(record))))
    .sort((left, right) => Date.parse(recordDate(right)) - Date.parse(recordDate(left)))[0];
}

function displayDate(value?: string | null) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function calendarMoment(item: WorkspaceCalendarItem) {
  const date = item.plannedDate?.slice(0, 10);
  if (!date) return Number.POSITIVE_INFINITY;
  return Date.parse(`${date}T${item.startTime || "00:00"}`);
}

export function MyWorkspace({ role }: { role: WorkspaceRole }) {
  const academicHead = role === "ACADEMIC_HEAD";
  const base = academicHead ? "/dashboard/academic-head" : "/dashboard/teacher";
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [toolQuery, setToolQuery] = useState("");
  const [hodExpanded, setHodExpanded] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    const results = await Promise.allSettled([
      apiGet<unknown>("/api/academy/my-teaching-plan"),
      apiGet<unknown>("/api/academy/assignments"),
      apiGet<unknown>("/api/academy/exams"),
      apiGet<unknown>("/api/academy/study-materials?limit=100"),
    ]);
    const [planResult, assignmentResult, examResult, materialResult] = results;
    const plan = planResult.status === "fulfilled" ? planResult.value : null;
    const assignments = assignmentResult.status === "fulfilled" ? assignmentResult.value : null;
    const exams = examResult.status === "fulfilled" ? examResult.value : null;
    const materials = materialResult.status === "fulfilled" ? materialResult.value : null;
    setWorkspace({
      batches: recordsFrom<WorkspaceBatch>(plan, "batches"),
      calendar: recordsFrom<WorkspaceCalendarItem>(plan, "calendar"),
      assignments: recordsFrom<WorkspaceRecord>(assignments, "assignments"),
      exams: recordsFrom<WorkspaceRecord>(exams, "exams"),
      materials: recordsFrom<WorkspaceRecord>(materials, "materials"),
    });
    const failedSources = results.filter((result) => result.status === "rejected").length;
    if (failedSources === results.length) {
      setWorkspaceError("Workspace activity could not be loaded. Refresh to try again.");
    } else if (failedSources > 0) {
      setWorkspaceError("Some workspace activity is temporarily unavailable. The available records are shown below.");
    }
    setLoadedAt(Date.now());
    setWorkspaceLoading(false);
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);
  const teacherTools = useMemo<WorkspaceTool[]>(() => [
    {
      title: "Create Exam",
      description: "Prepare, preview and publish exams for assigned classes.",
      icon: BookOpenCheck,
      href: `${base}/exams?action=create-exam`,
      label: "Exam",
      primary: true,
    },
    {
      title: "Give Assignment",
      description: "Create homework, attach files and track submissions.",
      icon: ClipboardList,
      href: `${base}/assignments?action=create-assignment`,
      label: "Homework",
      primary: true,
    },
    {
      title: "Upload Lesson",
      description: "Upload recordings, PDFs, PPTs, images or YouTube lessons.",
      icon: Video,
      href: `${base}/library?action=upload-lesson`,
      label: "Library",
      primary: true,
    },
    {
      title: "Lesson Planner",
      description: "Plan topics, timetable and syllabus completion.",
      icon: CalendarRange,
      href: `${base}/academic-calendar?action=plan-class`,
      label: "Plan",
    },
    {
      title: "Attendance & Leave",
      description: "Mark attendance and review leave connected to classes.",
      icon: CalendarCheck,
      href: `${base}/attendance?action=mark-attendance#leave`,
      label: "Register",
    },
    {
      title: "Question Bank",
      description: "Open reusable questions for tests and practice.",
      icon: FileQuestion,
      href: "/examination-center/question-bank",
      label: "Questions",
    },
    {
      title: "PPT Generator",
      description: "Use NIDUS Guru to draft teaching slides.",
      icon: Presentation,
      href: "/dashboard/nidus-guru",
      label: "AI assisted",
    },
    {
      title: "Study Material Library",
      description: "Manage notes, videos and class resources.",
      icon: Library,
      href: `${base}/library`,
      label: "Resources",
    },
    {
      title: "My Students",
      description: "Open assigned students, progress and class notes.",
      icon: Users,
      href: `${base}/my-classes?action=students`,
      label: "Classroom",
    },
    {
      title: "Class Logs",
      description: "Complete class reports and teaching notes.",
      icon: FileText,
      href: `${base}/academic-calendar?action=class-logs`,
      label: "Logs",
    },
    {
      title: "Syllabus Tracker",
      description: "Track subject-wise completion and support needed.",
      icon: Target,
      href: `${base}/academic-calendar?action=syllabus`,
      label: "Progress",
    },
    {
      title: "Announcements",
      description: "Send simple updates to assigned batches.",
      icon: Megaphone,
      href: `${base}/my-classes?action=announcement`,
      label: "Batch update",
    },
    {
      title: "Doubts & Questions",
      description: "Review student questions and follow-up items.",
      icon: UserSearch,
      href: `${base}/students`,
      label: "Support",
    },
    {
      title: "Reports",
      description: "Open class, batch and student progress views.",
      icon: BarChart3,
      href: academicHead ? `${base}/hod/reports` : `${base}/students`,
      label: "Review",
    },
  ], [academicHead, base]);

  const hodTools = useMemo<WorkspaceTool[]>(() => [
    { title: "Review Exams", description: "Approve, request changes or publish exam papers.", icon: ClipboardCheck, href: `${base}/hod/approvals`, label: "Approval" },
    { title: "Review Assignments", description: "Review homework drafts and publication requests.", icon: ClipboardList, href: `${base}/hod/approvals`, label: "Approval" },
    { title: "Plan Timetable", description: "Create and update academic schedules.", icon: CalendarRange, href: `${base}/hod/timetable`, label: "Schedule" },
    { title: "Allocate Teachers", description: "Assign teacher, batch, subject and program.", icon: UserCheck, href: `${base}/hod/teacher-allocation`, label: "Faculty" },
    { title: "Batch Progress", description: "Monitor class delivery and syllabus movement.", icon: Target, href: `${base}/hod/syllabus`, label: "Batch health" },
    { title: "Teacher Performance", description: "Track delivery, attendance, exams and uploads.", icon: Users, href: `${base}/hod/teacher-monitoring`, label: "Faculty health" },
    { title: "Student Watchlist", description: "Spot attendance, performance and support risks.", icon: ShieldAlert, href: `${base}/hod/student-monitoring`, label: "Risk" },
    { title: "Leave Approvals", description: "Approve or reject student leave requests.", icon: CalendarCheck, href: `${base}/attendance#leave`, label: "Leave" },
    { title: "Academic Calendar Control", description: "Control calendar, class logs and missed sessions.", icon: CalendarRange, href: `${base}/academic-calendar`, label: "Calendar" },
    { title: "Library Review", description: "Review materials and teaching resources.", icon: Library, href: `${base}/library`, label: "Resources" },
    { title: "Faculty Workload", description: "Check allocation balance and overload risks.", icon: AlertCircle, href: `${base}/hod/teacher-monitoring`, label: "Workload" },
    { title: "Batch Health Alerts", description: "Open delayed batches and action-needed signals.", icon: ShieldAlert, href: `${base}/hod/reports`, label: "Alerts" },
  ], [base]);

  const normalizedToolQuery = toolQuery.trim().toLowerCase();
  const visibleTeacherTools = useMemo(
    () => teacherTools.filter((tool) => !normalizedToolQuery || `${tool.title} ${tool.description} ${tool.label}`.toLowerCase().includes(normalizedToolQuery)),
    [normalizedToolQuery, teacherTools],
  );
  const visibleHodTools = useMemo(
    () => hodTools.filter((tool) => !normalizedToolQuery || `${tool.title} ${tool.description} ${tool.label}`.toLowerCase().includes(normalizedToolQuery)),
    [hodTools, normalizedToolQuery],
  );

  const pendingActions = useMemo(() => {
    const now = loadedAt;
    const openStatuses = new Set(["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED", "APPROVED"]);
    const upcoming = workspace.calendar
      .filter((item) => !["COMPLETED", "CANCELLED"].includes(String(item.completionStatus || item.status || "").toUpperCase()))
      .filter((item) => calendarMoment(item) >= now)
      .sort((left, right) => calendarMoment(left) - calendarMoment(right));
    const pendingAssignments = workspace.assignments.filter((item) => openStatuses.has(String(item.reviewStatus || item.status || "").toUpperCase()));
    const pendingExams = workspace.exams.filter((item) => openStatuses.has(String(item.reviewStatus || item.status || "").toUpperCase()));
    const batchesWithoutSchedule = workspace.batches.filter((batch) => !workspace.calendar.some((item) => item.batchId === batch.id));
    const nextClass = upcoming[0];

    if (academicHead) {
      return [
        {
          title: `${pendingAssignments.length + pendingExams.length} approval${pendingAssignments.length + pendingExams.length === 1 ? "" : "s"} pending`,
          text: pendingAssignments.length + pendingExams.length ? `${pendingAssignments.length} assignment and ${pendingExams.length} exam item(s) need action.` : "No assignment or exam approvals are waiting.",
          href: `${base}/hod/approvals`,
        },
        {
          title: nextClass ? "Next academic session" : "No upcoming session",
          text: nextClass ? `${nextClass.subject || "Class"} · ${nextClass.batchName || "Assigned batch"} · ${displayDate(nextClass.plannedDate)}` : "The current teaching plan has no future session.",
          href: `${base}/hod/timetable`,
        },
        {
          title: `${batchesWithoutSchedule.length} batch${batchesWithoutSchedule.length === 1 ? "" : "es"} without schedule`,
          text: batchesWithoutSchedule.length ? "Open timetable control and complete the missing academic plan." : "Every assigned batch has calendar activity.",
          href: `${base}/hod/timetable`,
        },
      ];
    }

    return [
      {
        title: nextClass ? "Prepare next class" : "No upcoming class",
        text: nextClass ? `${nextClass.subject || "Class"} · ${nextClass.batchName || "Assigned batch"} · ${displayDate(nextClass.plannedDate)}` : "No future class is currently assigned in the calendar.",
        href: `${base}/my-classes`,
      },
      {
        title: `${pendingAssignments.length} assignment${pendingAssignments.length === 1 ? "" : "s"} in progress`,
        text: pendingAssignments.length ? "Open homework drafts and complete the next action." : "No assignment draft or review is pending.",
        href: `${base}/assignments`,
      },
      {
        title: `${pendingExams.length} exam${pendingExams.length === 1 ? "" : "s"} in progress`,
        text: pendingExams.length ? "Open exam drafts and complete the next action." : "No exam draft or review is pending.",
        href: `${base}/exams`,
      },
    ];
  }, [academicHead, base, loadedAt, workspace]);

  const recentItems = useMemo(() => {
    const recentClass = workspace.calendar
      .filter((item) => Number.isFinite(calendarMoment(item)))
      .sort((left, right) => calendarMoment(right) - calendarMoment(left))[0];
    const recentLesson = latestRecord(workspace.materials);
    const recentAssignment = latestRecord(workspace.assignments);
    return [
      {
        title: recentClass?.subject || "No class activity yet",
        text: recentClass ? `${recentClass.batchName || "Assigned batch"} · ${displayDate(recentClass.plannedDate)}` : "Calendar activity will appear here.",
        icon: History,
        href: `${base}/academic-calendar`,
      },
      {
        title: recentLesson?.title || "No lesson uploaded yet",
        text: recentLesson ? `${recentLesson.subject || "Study material"} · ${displayDate(recordDate(recentLesson))}` : "Your latest library upload will appear here.",
        icon: Library,
        href: `${base}/library`,
      },
      {
        title: recentAssignment?.title || "No assignment created yet",
        text: recentAssignment ? `${recentAssignment.subject || "Homework"} · ${displayDate(recordDate(recentAssignment))}` : "Your latest homework will appear here.",
        icon: RotateCcw,
        href: `${base}/assignments`,
      },
    ];
  }, [base, workspace]);

  const workspaceSummary = useMemo(() => {
    const now = loadedAt;
    const upcoming = workspace.calendar.filter((item) => {
      const status = String(item.completionStatus || item.status || "").toUpperCase();
      return !["COMPLETED", "CANCELLED"].includes(status) && calendarMoment(item) >= now;
    }).length;
    const openStatuses = new Set(["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED", "APPROVED"]);
    const pendingWork = [...workspace.assignments, ...workspace.exams].filter((item) => openStatuses.has(String(item.reviewStatus || item.status || "").toUpperCase())).length;
    return [
      { label: "Assigned batches", value: workspace.batches.length },
      { label: "Upcoming sessions", value: upcoming },
      { label: "Work in progress", value: pendingWork },
      { label: "Library items", value: workspace.materials.length },
    ];
  }, [loadedAt, workspace]);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">My Workspace</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-3xl font-black md:text-5xl">{academicHead ? "Teach and control academics from one place" : "Everything needed to prepare and teach"}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
              Choose one action. Teaching tools stay common for every faculty member; Academic Head controls appear as add-ons below.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-dark)]">Workspace Mode</p>
            <p className="mt-2 text-2xl font-black">{academicHead ? "Teacher + HOD" : "Teacher"}</p>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{academicHead ? "Common tools plus academic control." : "Simple teaching execution."}</p>
          </div>
        </div>
      </header>

      <section aria-label="Workspace summary" aria-busy={workspaceLoading} className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm lg:grid-cols-4">
        {workspaceSummary.map((item) => (
          <div key={item.label} className="min-w-0 border-b border-r border-[var(--border)] p-4 last:border-r-0 lg:border-b-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{item.label}</p>
            <p className="mt-2 text-2xl font-black" aria-live="polite">{workspaceLoading ? "--" : item.value}</p>
          </div>
        ))}
      </section>

      {!workspaceLoading && !workspace.batches.length ? (
        <section role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-black">No teaching batch is assigned</h2>
            <p className="mt-1 text-sm leading-6">Teaching tools remain available, but batch-linked work needs an active faculty allocation.</p>
          </div>
          <Link href={academicHead ? `${base}/hod/teacher-allocation` : `${base}/profile`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-900 px-4 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950">
            {academicHead ? "Open allocation" : "View profile"}
          </Link>
        </section>
      ) : null}

      <section aria-busy={workspaceLoading} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Pending My Action</p>
            <h2 className="mt-1 text-2xl font-black">Start here</h2>
          </div>
          <button type="button" onClick={() => void loadWorkspace()} disabled={workspaceLoading} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black disabled:opacity-50">
            <RefreshCw size={14} className={workspaceLoading ? "animate-spin" : ""} />
            {workspaceLoading ? "Loading" : "Refresh"}
          </button>
        </div>
        {workspaceError ? <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{workspaceError}</p> : null}
        {workspaceLoading ? <WorkspaceCardSkeletons /> : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {pendingActions.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-slate-950">
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.text}</p>
            </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <label htmlFor="workspace-tool-search" className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-dark)]">Find a tool</label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-200">
          <Search size={19} aria-hidden="true" />
          <input
            id="workspace-tool-search"
            value={toolQuery}
            onChange={(event) => setToolQuery(event.target.value)}
            placeholder="Search exams, attendance, timetable..."
            className="min-w-0 flex-1 bg-transparent py-3 text-sm font-bold outline-none placeholder:font-normal"
          />
          {toolQuery ? <button type="button" onClick={() => setToolQuery("")} className="rounded-lg px-2 py-1 text-xs font-black hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">Clear</button> : null}
        </div>
      </section>

      <WorkspaceSection eyebrow="Teaching Tools" title="Create, upload, mark and review" tools={visibleTeacherTools} emptyMessage="No teaching tool matches your search." />

      {academicHead ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setHodExpanded((current) => !current)}
            aria-expanded={hodExpanded}
            className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
          >
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">HOD Controls</span>
              <span className="mt-1 block text-2xl font-black">Academic Head add-ons</span>
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{hodExpanded ? "Hide" : "Show"}</span>
          </button>
          {hodExpanded ? <WorkspaceToolGrid eyebrow="HOD Controls" tools={visibleHodTools} emptyMessage="No HOD control matches your search." /> : null}
        </section>
      ) : null}

      <section aria-busy={workspaceLoading} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Recently Used</p>
        <h2 className="mt-1 text-2xl font-black">Return to recent work</h2>
        {workspaceLoading ? <WorkspaceCardSkeletons /> : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recentItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={`${item.title}-${item.href}`} href={item.href} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-slate-950">
                <Icon size={20} className="text-[var(--gold-dark)]" />
                <h3 className="mt-3 font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{item.text}</p>
              </Link>
            );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function WorkspaceCardSkeletons() {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Loading workspace activity">
      {[0, 1, 2].map((item) => (
        <div key={item} className="min-h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function WorkspaceSection({ eyebrow, title, tools, emptyMessage }: { eyebrow: string; title: string; tools: WorkspaceTool[]; emptyMessage: string }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{tools.length} tool(s)</span>
      </div>
      <WorkspaceToolGrid eyebrow={eyebrow} tools={tools} emptyMessage={emptyMessage} />
    </section>
  );
}

function WorkspaceToolGrid({ eyebrow, tools, emptyMessage }: { eyebrow: string; tools: WorkspaceTool[]; emptyMessage: string }) {
  if (!tools.length) {
    return <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-5 text-sm font-bold text-[var(--muted-blue)]">{emptyMessage}</p>;
  }
  return (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={`${eyebrow}-${tool.title}`}
              href={tool.href}
              className={`group flex min-h-40 flex-col rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 sm:min-h-44 ${
                tool.primary ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tool.primary ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`}>
                  <Icon size={20} />
                </span>
                <ChevronRight size={18} className="mt-3 opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
              <h3 className="mt-4 text-base font-black sm:text-xl">{tool.title}</h3>
              <p className={`mt-2 line-clamp-2 text-xs leading-5 sm:text-sm ${tool.primary ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{tool.description}</p>
              <span className={`mt-auto pt-3 text-[10px] font-black uppercase tracking-[0.15em] ${tool.primary ? "text-amber-200" : "text-[var(--gold-dark)]"}`}>{tool.label}</span>
            </Link>
          );
        })}
      </div>
  );
}
