"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  HandCoins,
  Library,
  Presentation,
  UserPlus,
  Umbrella,
} from "lucide-react";

type WorkspaceRole = "TEACHER" | "ACADEMIC_HEAD";

export function MyWorkspace({ role }: { role: WorkspaceRole }) {
  const academicHead = role === "ACADEMIC_HEAD";
  const base = academicHead ? "/dashboard/academic-head" : "/dashboard/teacher";
  const tools = [
    {
      title: "Exams",
      description: "Create papers, publish exams and track results.",
      icon: BookOpenCheck,
      href: `${base}/exams`,
      label: "Exam ecosystem",
    },
    {
      title: "Assignments",
      description: "Give homework and review student submissions.",
      icon: ClipboardList,
      href: `${base}/assignments`,
      label: "Homework",
    },
    {
      title: "Lesson Planner",
      description: "Plan topics, classes and syllabus completion.",
      icon: CalendarRange,
      href: `${base}/academic-calendar`,
      label: "Teaching plan",
    },
    {
      title: "PPT Generator",
      description: "Prepare a classroom presentation with NIDUS Guru.",
      icon: Presentation,
      href: "/dashboard/nidus-guru",
      label: "AI assisted",
    },
    {
      title: "Leave Tracker",
      description: academicHead ? "Review student leave and attendance impact." : "Check leave requests connected to your classes.",
      icon: Umbrella,
      href: `${base}/attendance#leave`,
      label: academicHead ? "Review queue" : "Class leave",
    },
    {
      title: "Expense Claims",
      description: "Open staff records for expenses and reimbursement follow-up.",
      icon: HandCoins,
      href: "/staff-hr",
      label: "Staff record",
    },
    {
      title: "Admissions",
      description: academicHead ? "Check new-batch readiness and student allocation." : "Refer interested students to academy programs.",
      icon: UserPlus,
      href: academicHead ? "/dashboard/academic-head/hod/batches" : "/programs",
      label: academicHead ? "Batch readiness" : "Student referral",
    },
    {
      title: "Library Studio",
      description: "Upload recordings, PDFs, PPTs and lesson resources.",
      icon: Library,
      href: `${base}/library`,
      label: "Teaching content",
    },
    {
      title: "Question Bank",
      description: "Organize reusable questions for exams and practice.",
      icon: FileQuestion,
      href: "/examination-center/question-bank",
      label: "Reusable questions",
    },
  ];

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">My Workspace</p>
        <h1 className="mt-2 text-3xl font-black">Everything needed to prepare and teach</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-blue)]">Choose one tool. Advanced controls stay inside the tool, keeping this screen simple.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Teaching tools">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} href={tool.href} className="group flex min-h-44 flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 sm:min-h-48 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={20} /></span>
                <ChevronRight size={18} className="mt-3 opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
              <h2 className="mt-4 text-base font-black sm:text-xl">{tool.title}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted-blue)] sm:text-sm">{tool.description}</p>
              <span className="mt-auto pt-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">{tool.label}</span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
