"use client";

import Link from "next/link";
import { memo, useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Search,
  Send,
  Share2,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Button, Card, Input, Panel, SearchBox, StatusChip } from "@/components/design-system";

export type IntelligenceRole = "DIRECTOR" | "ACADEMIC_HEAD" | "TEACHER" | "STUDENT" | "PARENT" | "ADMISSION_CELL" | "ACCOUNTS" | "BUSINESS_DEVELOPMENT";

export type IntelligenceMetric = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type IntelligenceInsight = {
  title: ReactNode;
  detail: ReactNode;
  href?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type ReportModule = {
  title: string;
  detail: string;
  href: string;
  icon?: LucideIcon;
  status?: ReactNode;
};

export type ReportCommandState = {
  batch?: string;
  branch?: string;
  from: string;
  programme?: string;
  search?: string;
  to: string;
};

type ReportCommandBarProps = {
  id: string;
  state: ReportCommandState;
  onStateChange: (state: ReportCommandState) => void;
  onBookmark?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  onPrint?: () => void;
  shareHref?: string;
};

type ExecutiveIntelligenceSystemProps = {
  children?: ReactNode;
  description?: ReactNode;
  insights: IntelligenceInsight[];
  metrics: IntelligenceMetric[];
  modules?: ReportModule[];
  role: IntelligenceRole;
  title: ReactNode;
};

const roleLabels: Record<IntelligenceRole, string> = {
  ACADEMIC_HEAD: "Academic Head",
  ACCOUNTS: "Accounts",
  ADMISSION_CELL: "Admission Cell",
  BUSINESS_DEVELOPMENT: "Business Development",
  DIRECTOR: "Director",
  PARENT: "Parent",
  STUDENT: "Student",
  TEACHER: "Teacher",
};

const roleReportMaps: Record<IntelligenceRole, ReportModule[]> = {
  DIRECTOR: [
    { title: "Executive Dashboard", detail: "Platform health, growth metrics and risk alerts.", href: "/dashboard/director/reports", icon: BarChart3 },
    { title: "Admissions", detail: "Lead funnel, conversions and pending admissions.", href: "/dashboard/director/admissions", icon: Users },
    { title: "Academic Performance", detail: "Planner, attendance, completion and exam analytics.", href: "/dashboard/director/academic/reports", icon: GraduationCap },
    { title: "Revenue", detail: "Collection, outstanding fees, income and monthly summary.", href: "/dashboard/director/accounts?tab=reports", icon: WalletCards },
  ],
  ACADEMIC_HEAD: [
    { title: "Planner Completion", detail: "Subject completion, weak batches and lesson reviews.", href: "/dashboard/academic-head/hod/reports", icon: GraduationCap },
    { title: "Faculty Productivity", detail: "Workload, delivery and pending academic reviews.", href: "/dashboard/academic-head/hod/teacher-monitoring", icon: Users },
    { title: "Exam Performance", detail: "Tests, reviews and student performance signals.", href: "/dashboard/academic-head/exams", icon: FileText },
  ],
  TEACHER: [
    { title: "My Classes", detail: "Attendance trends, lesson completion and weak students.", href: "/dashboard/teacher/reports", icon: GraduationCap },
    { title: "Assignments", detail: "Assignment completion and pending evaluations.", href: "/dashboard/teacher/assignments", icon: FileText },
    { title: "Quiz Results", detail: "Exam results and top performers.", href: "/dashboard/teacher/exams", icon: BarChart3 },
  ],
  STUDENT: [
    { title: "Learning Progress", detail: "Learning, attendance, assignments and exam performance.", href: "/dashboard/student/progress", icon: TrendingUp },
    { title: "Exam History", detail: "Quiz history, exam performance and improvement areas.", href: "/dashboard/student/exams", icon: FileText },
    { title: "Achievements", detail: "Top Rank, assessments and readiness profile.", href: "/dashboard/student/top-rank", icon: BarChart3 },
  ],
  PARENT: [
    { title: "Child Progress", detail: "Attendance, academic trends and homework completion.", href: "/dashboard/parent#progress", icon: Users },
    { title: "Exam Results", detail: "Exam outcomes and teacher feedback.", href: "/dashboard/parent#exams", icon: FileText },
    { title: "Fees", detail: "Fee status and receipt watch.", href: "/dashboard/parent#fees", icon: WalletCards },
  ],
  ADMISSION_CELL: [
    { title: "Lead Funnel", detail: "Pending admissions, counselling outcomes and conversions.", href: "/dashboard/admission-cell#reports", icon: Users },
    { title: "Revenue Forecast", detail: "Fees pending and activation-ready files.", href: "/dashboard/admission-cell#fees", icon: WalletCards },
    { title: "Counselling Outcomes", detail: "Applications and AO-ready handovers.", href: "/dashboard/admission-cell#applications", icon: BarChart3 },
  ],
  ACCOUNTS: [
    { title: "Fee Collection", detail: "Collections, pending fees and receipts.", href: "/dashboard/director/accounts?tab=collect", icon: WalletCards },
    { title: "Finance Reports", detail: "Collection, pending dues and monthly summaries.", href: "/dashboard/director/accounts?tab=reports", icon: BarChart3 },
    { title: "Payroll", detail: "Payroll and staff finance summary.", href: "/dashboard/director/hrm", icon: Users },
  ],
  BUSINESS_DEVELOPMENT: [
    { title: "Lead Funnel", detail: "Lead source, status movement and conversion signals.", href: "/dashboard/business-development?tab=PIPELINE", icon: Users },
    { title: "Campaign Performance", detail: "Campaigns, follow-ups and counsellor handovers.", href: "/dashboard/business-development?tab=REPORTS", icon: BarChart3 },
    { title: "Follow-ups", detail: "Today, overdue and recovery queue.", href: "/dashboard/business-development?tab=FOLLOWUPS", icon: CalendarDays },
  ],
};

export const ExecutiveIntelligenceSystem = memo(function ExecutiveIntelligenceSystem({ children, description, insights, metrics, modules, role, title }: ExecutiveIntelligenceSystemProps) {
  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="info">Executive Intelligence</StatusChip>
            <StatusChip>{roleLabels[role]}</StatusChip>
          </div>
          <h2 className="mt-3 text-2xl font-black text-[var(--ds-color-text)] md:text-3xl">{title}</h2>
          {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <p className="ds-text-label text-[var(--ds-color-muted)]">{metric.label}</p>
            <p className="mt-2 text-2xl font-black text-[var(--ds-color-text)]">{metric.value}</p>
            {metric.note ? <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">{metric.note}</p> : null}
            <StatusChip tone={metric.tone ?? "default"} className="mt-3">{metric.tone ?? "signal"}</StatusChip>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <section>
          <p className="ds-text-label text-[var(--ds-color-primary)]">What needs attention?</p>
          <div className="mt-3 grid gap-3">
            {insights.map((insight, index) => {
              const row = (
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[var(--ds-color-text)]">{insight.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ds-color-muted)]">{insight.detail}</p>
                    </div>
                    <StatusChip tone={insight.tone ?? "default"}>{insight.tone ?? "review"}</StatusChip>
                  </div>
                </Card>
              );
              return insight.href ? <Link key={index} href={insight.href}>{row}</Link> : <div key={index}>{row}</div>;
            })}
          </div>
        </section>

        <section>
          <p className="ds-text-label text-[var(--ds-color-primary)]">Connected reports</p>
          <div className="mt-3 grid gap-3">
            {(modules ?? roleReportMaps[role]).map((module) => {
              const Icon = module.icon ?? BarChart3;
              return (
                <Link key={module.title} href={module.href} className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4 transition hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-soft)]">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-black text-[var(--ds-color-text)]">{module.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-[var(--ds-color-muted)]">{module.detail}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {children}
    </Panel>
  );
});

export function ReportCommandBar({ id, onBookmark, onExportCsv, onExportJson, onPrint, onStateChange, shareHref, state }: ReportCommandBarProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("nidus-report-bookmarks") || "[]") as string[];
      setBookmarked(saved.includes(id));
    } catch {
      setBookmarked(false);
    }
  }, [id]);

  function update(next: Partial<ReportCommandState>) {
    onStateChange({ ...state, ...next });
  }

  function bookmark() {
    try {
      const saved = JSON.parse(window.localStorage.getItem("nidus-report-bookmarks") || "[]") as string[];
      const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
      window.localStorage.setItem("nidus-report-bookmarks", JSON.stringify(next));
      setBookmarked(next.includes(id));
    } catch {
      setBookmarked((value) => !value);
    }
    onBookmark?.();
  }

  return (
    <Card className="p-4">
      <div className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
        <Input label="From" type="date" value={state.from} onChange={(event) => update({ from: event.target.value })} />
        <Input label="To" type="date" value={state.to} onChange={(event) => update({ to: event.target.value })} />
        <Input label="Branch" value={state.branch ?? ""} onChange={(event) => update({ branch: event.target.value })} placeholder="All branches" />
        <Input label="Programme" value={state.programme ?? ""} onChange={(event) => update({ programme: event.target.value })} placeholder="All programmes" />
        <Input label="Batch" value={state.batch ?? ""} onChange={(event) => update({ batch: event.target.value })} placeholder="All batches" />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <SearchBox label="Search reports" value={state.search ?? ""} onChange={(event) => update({ search: event.target.value })} placeholder="Search report, metric or student" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onExportCsv} icon={<Download className="h-4 w-4" />}>CSV</Button>
          <Button variant="secondary" onClick={onExportJson} icon={<Download className="h-4 w-4" />}>JSON</Button>
          <Button variant="secondary" onClick={onPrint} icon={<Printer className="h-4 w-4" />}>Print</Button>
          {shareHref ? <Button variant="secondary" href={shareHref} icon={<Share2 className="h-4 w-4" />}>Share</Button> : null}
          <Button variant={bookmarked ? "primary" : "secondary"} onClick={bookmark} icon={<Bookmark className="h-4 w-4" />}>{bookmarked ? "Saved" : "Bookmark"}</Button>
        </div>
      </div>
    </Card>
  );
}

export function ReportQuestionCards() {
  const questions = [
    { title: "What happened?", detail: "Metric cards and trends show the current state.", icon: BarChart3 },
    { title: "Why did it happen?", detail: "Insights connect the metric to attendance, completion, revenue or workflow movement.", icon: Search },
    { title: "What needs attention?", detail: "Risk cards show priority work by role.", icon: CalendarDays },
    { title: "What should I do next?", detail: "Connected reports point the user to the source workflow.", icon: Send },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {questions.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="p-4">
            <Icon className="h-5 w-5 text-[var(--ds-color-primary)]" aria-hidden="true" />
            <p className="mt-3 font-black text-[var(--ds-color-text)]">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</p>
          </Card>
        );
      })}
    </div>
  );
}
