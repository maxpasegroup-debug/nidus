"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  GraduationCap,
  Layers3,
  Library,
  ListChecks,
  Medal,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Card, Panel, Progress, StatusChip } from "@/components/design-system";

export type ExaminationEngineRole = "DIRECTOR" | "ACADEMIC_HEAD" | "TEACHER" | "STUDENT";

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

const examinationSteps = [
  "Programme",
  "Course",
  "Subject",
  "Chapter",
  "Topic",
  "Question Bank",
  "Collections",
  "Daily Quiz",
  "Assignment Quiz",
  "Weekly Test",
  "Monthly Test",
  "Mock Test",
  "Grand Mock",
  "CBT Attempt",
  "Evaluation",
  "Analytics",
  "Student Report",
];

const questionHierarchy = [
  "Subject",
  "Chapter",
  "Topic",
  "Difficulty",
  "Question",
  "Explanation",
  "Video Solution",
  "Tags",
  "Previous Year",
];

const examTypes = [
  "Daily Quiz",
  "Assignment Quiz",
  "Weekly Test",
  "Monthly Test",
  "Mock Test",
  "Grand Mock",
  "CBT",
  "Practice Test",
  "AI Generated Test",
];

const roleActions: Record<ExaminationEngineRole, Action[]> = {
  DIRECTOR: [
    { label: "Exam Overview", href: "/dashboard/director/exams", icon: BarChart3, description: "Review exam readiness, test completion, performance and upcoming papers." },
    { label: "Question Bank Health", href: "/examination-center/question-bank", icon: FileQuestion, description: "Open the single question bank used by all tests." },
    { label: "Batch Performance", href: "/examination-center/analytics", icon: Gauge, description: "Inspect analytics without changing scoring logic." },
    { label: "Upcoming Exams", href: "/examination-center/published", icon: CalendarClock, description: "See published and scheduled CBT papers." },
    { label: "Student Reports", href: "/examination-center/results", icon: Trophy, description: "Review attempt results and released reports." },
  ],
  ACADEMIC_HEAD: [
    { label: "Question Bank", href: "/dashboard/academic-head/question-bank", icon: FileQuestion, description: "Review faculty question sets and reusable papers." },
    { label: "Exam Schedule", href: "/dashboard/academic-head/exams", icon: CalendarClock, description: "Create, review and publish tests from one flow." },
    { label: "Pending Reviews", href: "/dashboard/academic-head/hod/approvals", icon: ClipboardCheck, description: "Handle exam and question approvals." },
    { label: "Student Performance", href: "/dashboard/academic-head/hod/student-monitoring", icon: BarChart3, description: "Follow performance signals from attempts and reports." },
  ],
  TEACHER: [
    { label: "Create Test", href: "/dashboard/teacher/exams", icon: ClipboardCheck, description: "Build quiz, weekly test, mock or CBT paper." },
    { label: "Question Bank", href: "/dashboard/teacher/question-bank", icon: FileQuestion, description: "Reuse previous questions and faculty sets." },
    { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ListChecks, description: "Connect assignment quizzes and homework practice." },
    { label: "Review Results", href: "/dashboard/teacher/exams", icon: Trophy, description: "Open submitted attempts and release results." },
    { label: "Weak Students", href: "/dashboard/teacher/students", icon: Target, description: "Use results to identify support needs." },
  ],
  STUDENT: [
    { label: "Today's Quiz", href: "/dashboard/student/exams", icon: PlayCircle, description: "Start live quiz or scheduled CBT paper." },
    { label: "Upcoming Exam", href: "/dashboard/student/calendar", icon: CalendarClock, description: "Check exam windows and reminders." },
    { label: "Mock Tests", href: "/tests", icon: ShieldCheck, description: "Open available practice and mock test routes." },
    { label: "Exam History", href: "/dashboard/student/exams", icon: Trophy, description: "Review attended attempts and released results." },
    { label: "Performance", href: "/dashboard/student/progress", icon: BarChart3, description: "Track accuracy, scores and recommendations." },
    { label: "Leaderboard", href: "/leaderboard", icon: Medal, description: "Compare rank and practice momentum." },
  ],
};

export function ExaminationEngineBanner({
  description = "One visible engine connects the question bank, exam builder, CBT attempts, evaluation, analytics and reports.",
  metrics,
  role,
  title = "Examination Engine",
}: {
  description?: ReactNode;
  metrics?: Metric[];
  role: ExaminationEngineRole;
  title?: ReactNode;
}) {
  return (
    <Panel className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="info">{roleLabel(role)}</StatusChip>
          <StatusChip>Unified Exam Flow</StatusChip>
          <StatusChip tone="success">CBT preserved</StatusChip>
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
        <p className="ds-text-label text-[var(--ds-color-primary)]">Examination flow</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {examinationSteps.map((step, index) => (
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

export function ExaminationRoleActions({ role }: { role: ExaminationEngineRole }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ds-text-label text-[var(--ds-color-primary)]">Role workflow</p>
          <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">{roleLabel(role)} examination tools</h2>
        </div>
        <StatusChip tone="success">Existing routes reused</StatusChip>
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

export function QuestionBankHierarchyPanel({ questionCount = 0 }: { questionCount?: number }) {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Question Bank</p>
      <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">One question hierarchy</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">Questions stay organized by subject, chapter, topic, difficulty, explanations, video solutions, tags and previous-year metadata.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {questionHierarchy.map((item) => (
          <div key={item} className="rounded-[var(--ds-radius-medium)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-2 text-sm font-black text-[var(--ds-color-text)]">
            {item}
          </div>
        ))}
      </div>
      <Progress className="mt-5" label={questionCount ? "Question bank signal" : "Question bank fills through existing exam/question routes"} value={questionCount ? 100 : 0} />
    </Panel>
  );
}

export function ExamTypePanel() {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Exam Types</p>
      <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">Supported test formats</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {examTypes.map((type) => (
          <StatusChip key={type} tone={type.includes("AI") ? "info" : type.includes("CBT") ? "success" : "default"}>{type}</StatusChip>
        ))}
      </div>
    </Panel>
  );
}

export function ExamReportingPanel({
  attempts = 0,
  averageScore = 0,
  reports = 0,
}: {
  attempts?: number;
  averageScore?: number;
  reports?: number;
}) {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Reporting</p>
      <h2 className="mt-1 text-xl font-black text-[var(--ds-color-text)]">Exam to recommendations</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">Existing reporting remains connected as Exam, Attempt, Evaluation, Performance and Recommendations.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Attempts" value={attempts} />
        <MiniMetric label="Average" value={`${Math.round(averageScore || 0)}%`} />
        <MiniMetric label="Reports" value={reports} />
      </div>
      <div className="mt-5 grid gap-2">
        {["Exam", "Attempt", "Evaluation", "Performance", "Recommendations"].map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-[var(--ds-radius-medium)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-3">
            <CheckCircle2 className="h-4 w-4 text-[var(--ds-color-success)]" aria-hidden="true" />
            <span className="text-sm font-black text-[var(--ds-color-text)]">{index + 1}. {step}</span>
          </div>
        ))}
      </div>
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

function defaultMetrics(role: ExaminationEngineRole): Metric[] {
  if (role === "DIRECTOR") {
    return [
      { label: "Exam Overview", value: "Live", tone: "info" },
      { label: "Question Bank", value: "Single", tone: "success" },
      { label: "Weak Subjects", value: "Tracked", tone: "warning" },
      { label: "Upcoming Exams", value: "Visible", tone: "info" },
    ];
  }
  if (role === "ACADEMIC_HEAD") {
    return [
      { label: "Question Bank", value: "Review", tone: "info" },
      { label: "Exam Schedule", value: "Open", tone: "success" },
      { label: "Pending Reviews", value: "Visible", tone: "warning" },
      { label: "Performance", value: "Tracked", tone: "info" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { label: "Create Test", value: "Ready", tone: "info" },
      { label: "Question Bank", value: "Reusable", tone: "success" },
      { label: "Publish Quiz", value: "Open", tone: "info" },
      { label: "Review Results", value: "Connected", tone: "success" },
    ];
  }
  return [
    { label: "Today's Quiz", value: "Ready", tone: "info" },
    { label: "Mock Tests", value: "Open", tone: "success" },
    { label: "History", value: "Tracked", tone: "info" },
    { label: "Leaderboard", value: "Live", tone: "warning" },
  ];
}

function roleLabel(role: ExaminationEngineRole) {
  if (role === "ACADEMIC_HEAD") return "Academic Head";
  return role.charAt(0) + role.slice(1).toLowerCase();
}
