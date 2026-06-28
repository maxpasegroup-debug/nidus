"use client";

import Link from "next/link";
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
  Megaphone,
  Presentation,
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

export function MyWorkspace({ role }: { role: WorkspaceRole }) {
  const academicHead = role === "ACADEMIC_HEAD";
  const base = academicHead ? "/dashboard/academic-head" : "/dashboard/teacher";
  const teacherTools: WorkspaceTool[] = [
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
  ];

  const hodTools: WorkspaceTool[] = [
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
  ];

  const pendingActions = academicHead
    ? [
        { title: "Review academic approvals", text: "Exam and assignment reviews appear here once Phase 3 live counts are connected.", href: `${base}/hod/approvals` },
        { title: "Check timetable gaps", text: "Open timetable control to verify today and this week.", href: `${base}/hod/timetable` },
        { title: "Monitor at-risk batches", text: "Use HOD reports for attendance, syllabus and activity issues.", href: `${base}/hod/reports` },
      ]
    : [
        { title: "Prepare today's class", text: "Open My Classes, choose batch and subject, then teach from the classroom.", href: `${base}/my-classes` },
        { title: "Create work for students", text: "Use exam, assignment or lesson upload tools when needed.", href: `${base}/assignments` },
        { title: "Complete class records", text: "Open calendar to mark class logs and attendance after teaching.", href: `${base}/academic-calendar` },
      ];

  const recentItems = [
    { title: "Last opened class", text: "Connect to live activity in Phase 3.", icon: History },
    { title: "Recent lesson", text: "Connect to latest upload in Phase 3.", icon: Library },
    { title: "Recent homework", text: "Connect to latest assignment in Phase 3.", icon: RotateCcw },
  ];

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

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Pending My Action</p>
            <h2 className="mt-1 text-2xl font-black">Start here</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">Live counts in Phase 3</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {pendingActions.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-slate-950">
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <WorkspaceSection eyebrow="Teaching Tools" title="Create, upload, mark and review" tools={teacherTools} />

      {academicHead ? <WorkspaceSection eyebrow="HOD Controls" title="Academic Head add-ons" tools={hodTools} /> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Recently Used</p>
        <h2 className="mt-1 text-2xl font-black">Return to recent work</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {recentItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4">
                <Icon size={20} className="text-[var(--gold-dark)]" />
                <h3 className="mt-3 font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function WorkspaceSection({ eyebrow, title, tools }: { eyebrow: string; title: string; tools: WorkspaceTool[] }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{tools.length} tool(s)</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={`${eyebrow}-${tool.title}`}
              href={tool.href}
              className={`group flex min-h-44 flex-col rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 ${
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
    </section>
  );
}
