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
  CreditCard,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Library,
  Megaphone,
  Presentation,
  RefreshCw,
  ShieldAlert,
  Target,
  UserCheck,
  Users,
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
  plannedDate?: string | null;
  startTime?: string | null;
  status?: string | null;
  completionStatus?: string | null;
};

type WorkspaceRecord = {
  id: string;
  status?: string | null;
  reviewStatus?: string | null;
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
  const [loadedAt, setLoadedAt] = useState(0);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    const results = await Promise.allSettled([
      apiGet<unknown>("/academy/my-teaching-plan"),
      apiGet<unknown>("/academy/assignments"),
      apiGet<unknown>("/academy/exams"),
      apiGet<unknown>("/academy/study-materials?limit=100"),
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
    if (planResult.status === "rejected") {
      setWorkspaceError("Teaching allocation could not be loaded. Refresh once or check your login session.");
    } else if (failedSources === results.length) {
      setWorkspaceError("Workspace activity could not be loaded. Refresh to try again.");
    } else if (failedSources > 1) {
      setWorkspaceError("Some activity is temporarily unavailable. Tools still work.");
    }
    setLoadedAt(Date.now());
    setWorkspaceLoading(false);
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const teacherTools = useMemo<WorkspaceTool[]>(() => [
    {
      title: "Exams",
      description: "Host, edit, manage, delete and review exam history.",
      icon: BookOpenCheck,
      href: `${base}/exams`,
      label: "Exam",
      primary: true,
    },
    {
      title: "Assignments",
      description: "Create homework, attach files, publish and track submissions.",
      icon: ClipboardList,
      href: `${base}/assignments`,
      label: "Homework",
      primary: true,
    },
    {
      title: "Upload Lessons",
      description: "Upload recordings, PDFs, PPTs, images or YouTube lessons.",
      icon: Video,
      href: `${base}/library?action=upload-lesson`,
      label: "Library",
      primary: true,
    },
    { title: "Lesson Planner", description: "Plan topics, timetable and syllabus completion.", icon: CalendarRange, href: `${base}/lesson-planner`, label: "Plan" },
    { title: "Attendance", description: "Mark class attendance and review registers.", icon: CalendarCheck, href: `${base}/attendance?action=mark-attendance`, label: "Register" },
    { title: "My Students", description: "Open assigned students, progress and class notes.", icon: Users, href: `${base}/my-classes?action=students`, label: "Classroom" },
    { title: "NDP Entry", description: "Enter student progress-card ratings, scores and remarks.", icon: ClipboardCheck, href: `${base}/ndp`, label: "Progress" },
    { title: "Library", description: "Manage notes, videos and class resources.", icon: Library, href: `${base}/library`, label: "Resources" },
    { title: "Reports", description: "Open class, batch and student progress views.", icon: BarChart3, href: academicHead ? `${base}/hod/reports` : `${base}/reports`, label: "Review" },
    { title: "Announcements", description: "Read academy notices, updates and reminders.", icon: Megaphone, href: `${base}/communications`, label: "Updates" },
    { title: "Doubts", description: "Ask NIDUS Guru and review doubt-clearing history.", icon: FileText, href: `${base}/doubts`, label: "Support" },
    { title: "Leave Requests", description: "Apply for leave and track approval status.", icon: ClipboardCheck, href: `${base}/leave-requests`, label: "Leave" },
    { title: "Expenses", description: "Submit bills and track reimbursement requests.", icon: CreditCard, href: `${base}/expenses`, label: "Claims" },
    { title: "PPT Generator", description: "Use NIDUS Guru templates to draft teaching slides.", icon: Presentation, href: `${base}/ppt-generator`, label: "AI assisted" },
  ], [academicHead, base]);

  const hodTools = useMemo<WorkspaceTool[]>(() => [
    { title: "Review Exams", description: "Approve, request changes or publish exam papers.", icon: ClipboardCheck, href: `${base}/hod/approvals`, label: "Approval" },
    { title: "Review Assignments", description: "Review homework drafts and publication requests.", icon: ClipboardList, href: `${base}/hod/approvals`, label: "Approval" },
    { title: "Plan Timetable", description: "Create and update academic schedules.", icon: CalendarRange, href: `${base}/hod/timetable`, label: "Schedule" },
    { title: "Allocate Teachers", description: "Assign teacher, batch, subject and program.", icon: UserCheck, href: `${base}/hod/teacher-allocation`, label: "Faculty" },
    { title: "Batch Progress", description: "Monitor class delivery and syllabus movement.", icon: Target, href: `${base}/hod/syllabus`, label: "Batch" },
    { title: "Teacher Performance", description: "Track delivery, attendance, exams and uploads.", icon: Users, href: `${base}/hod/teacher-monitoring`, label: "Faculty" },
    { title: "Student Watchlist", description: "Spot attendance, performance and support risks.", icon: ShieldAlert, href: `${base}/hod/student-monitoring`, label: "Risk" },
    { title: "NDP Reviews", description: "Open student digital profile entries and progress cards.", icon: ClipboardCheck, href: `${base}/ndp`, label: "Progress" },
    { title: "Leave Approvals", description: "Approve or reject student leave requests.", icon: CalendarCheck, href: `${base}/attendance#leave`, label: "Leave" },
    { title: "Calendar Control", description: "Control calendar, class logs and missed sessions.", icon: CalendarRange, href: `${base}/academic-calendar`, label: "Calendar" },
    { title: "Library Review", description: "Review materials and teaching resources.", icon: Library, href: `${base}/library`, label: "Resources" },
    { title: "Workload", description: "Check allocation balance and overload risks.", icon: AlertCircle, href: `${base}/hod/teacher-monitoring`, label: "Load" },
    { title: "Batch Alerts", description: "Open delayed batches and action-needed signals.", icon: ShieldAlert, href: `${base}/hod/reports`, label: "Alerts" },
  ], [base]);

  const workspaceSummary = useMemo(() => {
    const now = loadedAt;
    const upcoming = workspace.calendar.filter((item) => {
      const status = String(item.completionStatus || item.status || "").toUpperCase();
      return !["COMPLETED", "CANCELLED"].includes(status) && calendarMoment(item) >= now;
    }).length;
    const openStatuses = new Set(["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED", "APPROVED"]);
    const pendingWork = [...workspace.assignments, ...workspace.exams].filter((item) => openStatuses.has(String(item.reviewStatus || item.status || "").toUpperCase())).length;
    return [
      { label: "batches", value: workspace.batches.length },
      { label: "sessions", value: upcoming },
      { label: "pending", value: pendingWork },
      { label: "library", value: workspace.materials.length },
    ];
  }, [loadedAt, workspace]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-7xl flex-col gap-3 overflow-hidden px-3 py-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">My Workspace</p>
          <h1 className="mt-1 text-2xl font-black md:text-3xl">{academicHead ? "Teacher + HOD tools" : "Teacher tools"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {workspaceSummary.map((item) => (
            <span key={item.label} className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs font-black">
              {workspaceLoading ? "--" : item.value} {item.label}
            </span>
          ))}
          <button type="button" onClick={() => void loadWorkspace()} disabled={workspaceLoading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black disabled:opacity-50">
            <RefreshCw size={14} className={workspaceLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {workspaceError ? <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">{workspaceError}</p> : null}

      <section className="min-h-0 flex-1 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Common Faculty Tools</p>
            <h2 className="text-xl font-black">Choose one action</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{teacherTools.length} tools</span>
        </div>
        <CompactToolGrid tools={teacherTools} />

        {academicHead ? (
          <>
            <div className="mb-3 mt-4 flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Academic Head Add-ons</p>
                <h2 className="text-xl font-black">HOD control</h2>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{hodTools.length} tools</span>
            </div>
            <CompactToolGrid tools={hodTools} />
          </>
        ) : null}
      </section>
    </main>
  );
}

function CompactToolGrid({ tools }: { tools: WorkspaceTool[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.title}
            href={tool.href}
            title={tool.description}
            className={`group flex min-h-[94px] flex-col justify-between rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${
              tool.primary ? "border-slate-950 bg-white text-[var(--ink)]" : "border-[var(--border)] bg-[var(--page-bg)]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tool.primary ? "bg-slate-950 text-white" : "border border-[var(--border)] bg-white text-slate-950"}`}>
                <Icon size={17} />
              </span>
              <ChevronRight size={15} className="mt-2 opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
            <div>
              <h3 className="line-clamp-2 text-sm font-black leading-5">{tool.title}</h3>
              <span className="mt-1 block truncate text-[9px] font-black uppercase tracking-[0.14em] text-[var(--gold-dark)]">{tool.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
