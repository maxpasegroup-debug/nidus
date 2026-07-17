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
  FileText,
  GraduationCap,
  Lightbulb,
  MessageSquareText,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Card, Panel, StatusChip } from "@/components/design-system";

export type AiOperatingRole =
  | "DIRECTOR"
  | "ACADEMIC_HEAD"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ADMISSION_CELL"
  | "BUSINESS_DEVELOPMENT"
  | "VIDEO_EDITOR";

export type AiAssistantItem = {
  title: ReactNode;
  detail: ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

type AiOperatingLayerProps = {
  title?: ReactNode;
  description?: ReactNode;
  role: AiOperatingRole;
  items: AiAssistantItem[];
  compact?: boolean;
};

const roleDefaults: Record<AiOperatingRole, { title: string; description: string; icon: LucideIcon }> = {
  DIRECTOR: {
    title: "AI attention brief",
    description: "A quiet operating layer for academy risk, forecast, faculty and revenue signals.",
    icon: BarChart3,
  },
  ACADEMIC_HEAD: {
    title: "AI academic brief",
    description: "Planner completion, weak batches, faculty workload and academic risk signals.",
    icon: GraduationCap,
  },
  TEACHER: {
    title: "AI teaching assistant",
    description: "Lesson notes, homework ideas, quizzes and weak-student suggestions inside the class workflow.",
    icon: Lightbulb,
  },
  STUDENT: {
    title: "AI study companion",
    description: "Doubts, revision, study plan, practice and motivation without leaving learning.",
    icon: BrainCircuit,
  },
  PARENT: {
    title: "AI parent summary",
    description: "Child progress, attendance, homework, fees and performance concerns in simple language.",
    icon: Users,
  },
  ADMISSION_CELL: {
    title: "AI admission assistant",
    description: "Lead summaries, follow-up suggestions and admission probability signals inside admissions.",
    icon: PhoneCall,
  },
  BUSINESS_DEVELOPMENT: {
    title: "AI growth assistant",
    description: "Lead priority, campaign suggestions and conversion insights inside the sales workflow.",
    icon: TrendingUp,
  },
  VIDEO_EDITOR: {
    title: "AI content assistant",
    description: "Recording summaries, titles, descriptions and chapter suggestions inside content publishing.",
    icon: Video,
  },
};

const invisibleLayerSteps = [
  "Observe workflow",
  "Summarize signals",
  "Suggest next action",
  "Reuse existing AI",
  "Keep user in context",
];

export function AiOperatingLayer({ compact = false, description, items, role, title }: AiOperatingLayerProps) {
  const defaults = roleDefaults[role];
  const Icon = defaults.icon;
  const visibleItems = compact ? items.slice(0, 3) : items;

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ds-radius-large)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone="info">AI Operating Layer</StatusChip>
              <StatusChip tone="success">Existing services reused</StatusChip>
            </div>
            <h2 className="mt-3 text-xl font-black text-[var(--ds-color-text)] md:text-2xl">{title ?? defaults.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)]">{description ?? defaults.description}</p>
          </div>
        </div>
        {!compact ? (
          <div className="flex max-w-xl flex-wrap gap-2">
            {invisibleLayerSteps.map((step) => (
              <span key={step} className="rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-2 text-xs font-black text-[var(--ds-color-muted)]">
                {step}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item, index) => (
          <AiAssistantCard key={`${String(item.title)}-${index}`} item={item} />
        ))}
      </div>
    </Panel>
  );
}

export function AiSuggestionStrip({ items, role }: { items: AiAssistantItem[]; role: AiOperatingRole }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.slice(0, 3).map((item, index) => (
        <AiAssistantCard key={`${role}-${String(item.title)}-${index}`} item={item} compact />
      ))}
    </div>
  );
}

export function aiRoleActions(role: AiOperatingRole): AiAssistantItem[] {
  if (role === "TEACHER") {
    return [
      { title: "Improve lesson plan", detail: "Use the existing lesson planner draft flow before class.", href: "/dashboard/teacher/lesson-planner", icon: Lightbulb, tone: "info" },
      { title: "Suggest homework", detail: "Turn today's topic into a focused assignment.", href: "/dashboard/teacher/assignments", icon: ClipboardCheck, tone: "success" },
      { title: "Generate quiz", detail: "Use the existing exam creator and AI draft review.", href: "/dashboard/teacher/exams", icon: FileText, tone: "warning" },
    ];
  }
  if (role === "STUDENT") {
    return [
      { title: "Ask a doubt", detail: "Open the existing doubt solver for topic explanation.", href: "/ai-doubt-solver", icon: MessageSquareText, tone: "info" },
      { title: "Study plan", detail: "Use the existing AI planner to organize revision.", href: "/ai-study-planner", icon: CalendarClock, tone: "success" },
      { title: "Practice recommendation", detail: "Continue through exams, practice and progress.", href: "/dashboard/student/exams", icon: CheckCircle2, tone: "warning" },
    ];
  }
  return [
    { title: "Recommendations", detail: "Open the existing recommendations feed when deeper AI context is needed.", href: "/ai-recommendations", icon: Sparkles, tone: "info" },
    { title: "AI workflow", detail: "This surface shows insights inside the user's current work.", icon: BrainCircuit, tone: "success" },
    { title: "No duplicate module", detail: "AI remains an operating layer, not another dashboard.", icon: CheckCircle2, tone: "default" },
  ];
}

function AiAssistantCard({ compact = false, item }: { compact?: boolean; item: AiAssistantItem }) {
  const Icon = item.icon ?? Sparkles;
  const content = (
    <Card className={`h-full p-4 ${compact ? "" : "transition hover:-translate-y-0.5 hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-soft)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <StatusChip tone={item.tone ?? "default"}>{item.tone ?? "signal"}</StatusChip>
      </div>
      <h3 className="mt-4 font-black text-[var(--ds-color-text)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</p>
    </Card>
  );

  if (!item.href) return content;
  return <Link href={item.href}>{content}</Link>;
}
