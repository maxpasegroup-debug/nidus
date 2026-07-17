"use client";

import Link from "next/link";
import { memo } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ListChecks,
  Mail,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Card, Panel, StatusChip } from "@/components/design-system";

type WorkflowTone = "default" | "success" | "warning" | "danger" | "info";

export type WorkflowMetric = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: WorkflowTone;
};

export type WorkflowItem = {
  title: ReactNode;
  detail: ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: WorkflowTone;
};

type WorkflowOsWorkspaceProps = {
  approvals?: WorkflowItem[];
  children?: ReactNode;
  description?: ReactNode;
  metrics: WorkflowMetric[];
  recent?: WorkflowItem[];
  title?: ReactNode;
};

const workflowChains: WorkflowItem[] = [
  {
    title: "Admission approved",
    detail: "Assign batch, create student profile, invite parent, assign planner, enable dashboard and send welcome notification.",
    href: "/dashboard/admission-cell#activation",
    icon: UserPlus,
    tone: "success",
  },
  {
    title: "Lesson completed",
    detail: "Lock attendance, publish homework, open quiz, update progress and notify parent.",
    href: "/dashboard/teacher/classes",
    icon: CalendarCheck,
    tone: "info",
  },
  {
    title: "Exam completed",
    detail: "Evaluate attempt, update analytics, publish student report, summarize to parent and alert academics.",
    href: "/examination-center/results",
    icon: GraduationCap,
    tone: "info",
  },
  {
    title: "Fee received",
    detail: "Generate receipt, update ledger, notify parent and refresh finance dashboard.",
    href: "/dashboard/director/accounts",
    icon: ReceiptText,
    tone: "success",
  },
];

const notificationChannels: WorkflowItem[] = [
  { title: "Dashboard", detail: "Existing notification records and announcement history.", href: "/notifications", icon: Bell, tone: "success" },
  { title: "Push", detail: "Queued through the current push notification flow.", href: "/dashboard/director/notifications", icon: Send, tone: "info" },
  { title: "Email", detail: "Uses the existing email queue and communication services.", href: "/email-center", icon: Mail, tone: "info" },
  { title: "WhatsApp/SMS", detail: "CRM reminders reuse the current notification integration hooks.", href: "/crm/followups", icon: MessageCircle, tone: "info" },
];

export const WorkflowOsWorkspace = memo(function WorkflowOsWorkspace({ approvals = [], children, description, metrics, recent = [], title = "Workflow Operating System" }: WorkflowOsWorkspaceProps) {
  return (
    <Panel>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <StatusChip tone="info">Workflow OS</StatusChip>
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <WorkflowPanel eyebrow="Automation chains" title="Natural next steps" items={workflowChains} />
        <WorkflowPanel eyebrow="Notification channels" title="One notification layer" items={notificationChannels} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <WorkflowPanel eyebrow="Approval queue" title="Needs human review" items={approvals} empty="No pending approval signal is visible here." />
        <WorkflowPanel eyebrow="Recent activity" title="Latest workflow movement" items={recent} empty="No recent workflow activity is visible here." />
      </div>

      {children}
    </Panel>
  );
});

const WorkflowPanel = memo(function WorkflowPanel({ empty, eyebrow, items, title }: { empty?: string; eyebrow: string; items: WorkflowItem[]; title: string }) {
  return (
    <section>
      <p className="ds-text-label text-[var(--ds-color-primary)]">{eyebrow}</p>
      <h3 className="mt-1 font-black text-[var(--ds-color-text)]">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item, index) => {
          const Icon = item.icon ?? ListChecks;
          const content = (
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-[var(--ds-color-text)]">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</span>
                </span>
                <StatusChip tone={item.tone ?? "default"}>{item.tone ?? "flow"}</StatusChip>
              </div>
            </Card>
          );
          return item.href ? <Link key={index} href={item.href}>{content}</Link> : <div key={index}>{content}</div>;
        })}
        {!items.length ? (
          <Card className="border-dashed p-5 text-sm leading-6 text-[var(--ds-color-muted)]">
            <CheckCircle2 className="mb-2 h-5 w-5 text-[var(--ds-color-success)]" aria-hidden="true" />
            {empty}
          </Card>
        ) : null}
      </div>
    </section>
  );
});

export const workflowIcons = {
  approval: ShieldCheck,
  assignment: ClipboardCheck,
  automation: RefreshCw,
  exam: FileText,
  fee: WalletCards,
  notification: Bell,
  reminder: AlertTriangle,
  task: Sparkles,
};
