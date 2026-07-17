"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Layers3,
  Library,
  ListChecks,
  PlayCircle,
  Repeat2,
  Upload,
  Video,
} from "lucide-react";
import { Card, Panel, Progress, StatusChip } from "@/components/design-system";

export type LearningEngineRole = "DIRECTOR" | "ACADEMIC_HEAD" | "TEACHER" | "STUDENT";

type Metric = {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

type Action = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const learningSteps = [
  "Programme",
  "Course",
  "Subject",
  "Chapter",
  "Topic",
  "Lesson",
  "Recorded Video",
  "Study Material",
  "Practice",
  "Assignment",
  "Quiz",
  "Weekly Test",
  "Monthly Test",
  "Revision",
  "Completed",
];

const roleActions: Record<LearningEngineRole, Action[]> = {
  DIRECTOR: [
    { label: "Learning Overview", href: "/dashboard/director/materials", icon: BarChart3, description: "Review content coverage, weak subjects and student learning readiness." },
    { label: "Course Completion", href: "/dashboard/director/academic/student-progress", icon: CheckCircle2, description: "Track batch and student completion from the academic engine." },
    { label: "Faculty Coverage", href: "/dashboard/director/academic/teacher-performance", icon: GraduationCap, description: "Check faculty output, materials and class coverage." },
    { label: "Content Status", href: "/dashboard/director/materials", icon: Library, description: "Approve, reject or archive batch learning materials." },
  ],
  ACADEMIC_HEAD: [
    { label: "Course Coverage", href: "/dashboard/academic-head/hod/syllabus", icon: Layers3, description: "Review programme, subject and syllabus coverage." },
    { label: "Lesson Completion", href: "/dashboard/academic-head/lesson-planner", icon: BookOpenCheck, description: "Plan lessons and follow pending teaching coverage." },
    { label: "Content Review", href: "/dashboard/academic-head/library", icon: Library, description: "Review resources uploaded for batches and lessons." },
    { label: "Assignments", href: "/dashboard/academic-head/assignments", icon: ClipboardCheck, description: "Review homework and learning follow-up." },
  ],
  TEACHER: [
    { label: "Today's Lessons", href: "/dashboard/teacher/my-classes", icon: BookOpenCheck, description: "Open assigned classes and continue the lesson flow." },
    { label: "Lesson Completion", href: "/dashboard/teacher/lesson-planner", icon: CheckCircle2, description: "Plan, complete and log lessons against batch topics." },
    { label: "Upload Material", href: "/dashboard/teacher/library", icon: Upload, description: "Attach notes, PDFs, videos and links to the batch library." },
    { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardCheck, description: "Create homework and follow-up practice work." },
    { label: "Quiz", href: "/dashboard/teacher/exams", icon: ListChecks, description: "Open quizzes, weekly tests and monthly tests." },
  ],
  STUDENT: [
    { label: "Continue Learning", href: "/dashboard/student/learning", icon: PlayCircle, description: "Resume the assigned programme learning path." },
    { label: "Downloads", href: "/dashboard/student/learning", icon: Download, description: "Open assigned PDFs, notes, videos and learning links." },
    { label: "Assignments", href: "/dashboard/student/assignments", icon: ClipboardCheck, description: "Complete homework connected to your lessons." },
    { label: "Quizzes", href: "/dashboard/student/exams", icon: ListChecks, description: "Attempt quizzes, weekly tests and monthly tests." },
    { label: "Progress", href: "/dashboard/student/progress", icon: BarChart3, description: "Check learning progress and revision status." },
    { label: "Revision", href: "/dashboard/student/top-rank", icon: Repeat2, description: "Revise and strengthen exam readiness." },
  ],
};

const recordedGroups = [
  { label: "Videos", icon: Video },
  { label: "PDF", icon: FileText },
  { label: "Notes", icon: FileText },
  { label: "Presentations", icon: Layers3 },
  { label: "Downloads", icon: Download },
];

export function LearningEngineBanner({
  description = "One hierarchy connects academics, courses, lessons, resources, assignments, tests and completion.",
  metrics,
  role,
  title = "Learning Engine",
}: {
  description?: ReactNode;
  metrics?: Metric[];
  role: LearningEngineRole;
  title?: ReactNode;
}) {
  return (
    <Panel className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="info">{roleLabel(role)}</StatusChip>
          <StatusChip>Single Learning Flow</StatusChip>
        </div>
        <h2 className="mt-4 text-2xl font-black text-[var(--ds-color-text)] md:text-3xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(metrics ?? defaultMetrics(role)).map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="ds-text-label text-[var(--ds-color-muted)]">{metric.label}</p>
              <p className="mt-2 text-2xl font-black text-[var(--ds-color-text)]">{metric.value}</p>
              <StatusChip tone={metric.tone ?? "default"} className="mt-3">{metric.tone ?? "live"}</StatusChip>
            </Card>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4">
        <p className="ds-text-label text-[var(--ds-color-primary)]">Learning hierarchy</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {learningSteps.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2 rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] px-3 py-2 text-xs font-black text-[var(--ds-color-text)]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--ds-color-primary)] text-[10px] text-[var(--ds-color-primary-foreground)]">{index + 1}</span>
              {step}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function LearningRoleActions({ role }: { role: LearningEngineRole }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ds-text-label text-[var(--ds-color-primary)]">Role workflow</p>
          <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">{roleLabel(role)} learning tools</h2>
        </div>
        <StatusChip tone="success">Existing modules reused</StatusChip>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roleActions[role].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="group rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-black text-[var(--ds-color-text)]">{action.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ds-color-muted)]">{action.description}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function LearningContentGroups() {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Recorded content</p>
      <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">One resource library</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">Videos, PDFs, notes, presentations and downloads continue to use the existing upload, media and Cloudinary-backed resource flow.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {recordedGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.label} className="p-4">
              <Icon className="h-5 w-5 text-[var(--ds-color-primary)]" aria-hidden="true" />
              <p className="mt-3 font-black text-[var(--ds-color-text)]">{group.label}</p>
            </Card>
          );
        })}
      </div>
    </Panel>
  );
}

export function LearningProgressPanel({
  assignmentCount = 0,
  lessonCount = 0,
  materialCount = 0,
  quizCount = 0,
}: {
  assignmentCount?: number;
  lessonCount?: number;
  materialCount?: number;
  quizCount?: number;
}) {
  const total = lessonCount + materialCount + assignmentCount + quizCount;
  const complete = lessonCount ? Math.round((Math.min(materialCount, lessonCount) / lessonCount) * 100) : 0;

  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Learning progress</p>
      <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">Lesson to completion</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">The existing tracking remains connected as Lesson, Assignment, Quiz, Progress and Completion.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Lessons" value={lessonCount} />
        <MiniMetric label="Materials" value={materialCount} />
        <MiniMetric label="Assignments" value={assignmentCount} />
        <MiniMetric label="Quizzes" value={quizCount} />
      </div>
      <Progress className="mt-5" label={total ? "Current coverage signal" : "Coverage starts after lessons are assigned"} value={complete} />
    </Panel>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="p-4">
      <p className="ds-text-label text-[var(--ds-color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--ds-color-text)]">{value}</p>
    </Card>
  );
}

function defaultMetrics(role: LearningEngineRole): Metric[] {
  if (role === "DIRECTOR") {
    return [
      { label: "Course Completion", value: "Live", tone: "info" },
      { label: "Faculty Coverage", value: "Tracked", tone: "success" },
      { label: "Weak Subjects", value: "Visible", tone: "warning" },
      { label: "Content Status", value: "Review", tone: "info" },
    ];
  }
  if (role === "ACADEMIC_HEAD") {
    return [
      { label: "Course Coverage", value: "Live", tone: "info" },
      { label: "Faculty Progress", value: "Tracked", tone: "success" },
      { label: "Pending Lessons", value: "Visible", tone: "warning" },
      { label: "Content Review", value: "Ready", tone: "info" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { label: "Today's Lessons", value: "Ready", tone: "info" },
      { label: "Completion Log", value: "Required", tone: "warning" },
      { label: "Materials", value: "Upload", tone: "info" },
      { label: "Quiz", value: "Connected", tone: "success" },
    ];
  }
  return [
    { label: "Continue Learning", value: "Ready", tone: "info" },
    { label: "Downloads", value: "Assigned", tone: "success" },
    { label: "Practice", value: "Open", tone: "info" },
    { label: "Revision", value: "Planned", tone: "warning" },
  ];
}

function roleLabel(role: LearningEngineRole) {
  return role === "ACADEMIC_HEAD" ? "Academic Head" : role.charAt(0) + role.slice(1).toLowerCase();
}
