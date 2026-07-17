"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  ListChecks,
  NotebookPen,
  Repeat,
  Users,
} from "lucide-react";
import { Card, Panel, StatusChip } from "@/components/design-system";

export type AcademicEngineRole = "DIRECTOR" | "ACADEMIC_HEAD" | "TEACHER";

type EngineLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const roleLinks: Record<AcademicEngineRole, EngineLink[]> = {
  DIRECTOR: [
    { label: "Program Planner", href: "/dashboard/director/academic/programs", icon: GraduationCap, description: "Build the master planner template for every program." },
    { label: "Batch Planner", href: "/dashboard/director/academic/batches", icon: Users, description: "Generate batch execution from the program planner." },
    { label: "Timetable", href: "/dashboard/director/academic/timetable", icon: CalendarDays, description: "Publish class dates and teacher schedules." },
    { label: "Syllabus Progress", href: "/dashboard/director/academic/syllabus", icon: BookOpenCheck, description: "Track chapter and topic completion." },
    { label: "Faculty Progress", href: "/dashboard/director/academic/teachers", icon: ClipboardCheck, description: "Monitor teacher allocation and delivery." },
    { label: "Performance", href: "/dashboard/director/academic/reports", icon: BarChart3, description: "Review attendance, exams, assignments and materials." },
  ],
  ACADEMIC_HEAD: [
    { label: "Today's Classes", href: "/dashboard/academic-head/my-classes", icon: CalendarDays, description: "Run the day from published planner sessions." },
    { label: "Planner", href: "/dashboard/academic-head/hod/timetable", icon: ListChecks, description: "Manage class schedule and timetable execution." },
    { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users, description: "Allocate teachers and check faculty delivery." },
    { label: "Pending Reviews", href: "/dashboard/academic-head/hod/approvals", icon: ClipboardCheck, description: "Review assignments, tests and academic work." },
    { label: "Weak Batches", href: "/dashboard/academic-head/hod/student-monitoring", icon: BarChart3, description: "Find batches needing academic support." },
    { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: FileText, description: "Read academic progress and completion reports." },
  ],
  TEACHER: [
    { label: "Today's Classes", href: "/dashboard/teacher/classes", icon: CalendarDays, description: "Open class from the generated timetable." },
    { label: "Mark Attendance", href: "/dashboard/teacher/attendance?action=mark-attendance", icon: ClipboardCheck, description: "Record attendance for the planned class." },
    { label: "Complete Lesson", href: "/dashboard/teacher/lesson-planner", icon: CheckCircle2, description: "Log lesson completion against chapter and topic." },
    { label: "Upload Material", href: "/dashboard/teacher/library?action=upload-lesson", icon: Library, description: "Attach notes, videos and study resources." },
    { label: "Assign Homework", href: "/dashboard/teacher/assignments", icon: NotebookPen, description: "Send homework from the completed lesson." },
    { label: "Open Quiz", href: "/dashboard/teacher/exams", icon: FileText, description: "Create quiz, weekly test or monthly test." },
    { label: "Finish", href: "/dashboard/teacher/reports", icon: CheckCircle2, description: "Review the class work and close the loop." },
  ],
};

const operatingModel = [
  "Program",
  "Batch",
  "Subject",
  "Chapter",
  "Topic",
  "Lesson",
  "Class Schedule",
  "Class Completed",
  "Attendance",
  "Material",
  "Assignment",
  "Quiz",
  "Weekly Test",
  "Monthly Test",
  "Revision",
  "Completed",
];

export function AcademicEngineBanner({
  role,
  title = "Academic Engine",
  description = "Every academic activity begins from the planner and moves through class execution, completion, resources, assessment and performance.",
  metrics,
}: {
  role: AcademicEngineRole;
  title?: string;
  description?: ReactNode;
  metrics?: Array<{ label: string; value: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" }>;
}) {
  return (
    <Panel className="bg-[var(--ds-color-surface)]">
      <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="info">Single Source of Truth</StatusChip>
            <StatusChip tone="success">Planner First</StatusChip>
          </div>
          <h2 className="mt-4 text-3xl font-black text-[var(--ds-color-text)]">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p>
          <AcademicFlowRail className="mt-5" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {(metrics ?? []).slice(0, 4).map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="ds-text-label text-[var(--ds-color-muted)]">{metric.label}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-2xl font-black">{metric.value}</p>
                <StatusChip tone={metric.tone ?? "default"}>{metric.label}</StatusChip>
              </div>
            </Card>
          ))}
          {!metrics?.length ? <AcademicEngineRoleActions role={role} compact /> : null}
        </div>
      </div>
    </Panel>
  );
}

export function AcademicEngineRoleActions({ role, compact = false }: { role: AcademicEngineRole; compact?: boolean }) {
  const links = roleLinks[role];
  return (
    <section className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
      {links.map((item, index) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4 shadow-[var(--ds-shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-medium)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ds-color-primary)]">Step {index + 1}</p>
                <h3 className="mt-1 text-base font-black text-[var(--ds-color-text)]">{item.label}</h3>
                {!compact ? <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">{item.description}</p> : null}
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function AcademicFlowRail({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`} aria-label="NIDUS academic operating model">
      <div className="flex min-w-max items-center gap-2">
        {operatingModel.map((stage, index) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] px-3 py-2 text-xs font-black text-[var(--ds-color-text)]">
              {stage}
            </span>
            {index < operatingModel.length - 1 ? <Repeat className="h-3.5 w-3.5 rotate-180 text-[var(--ds-color-muted)]" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
