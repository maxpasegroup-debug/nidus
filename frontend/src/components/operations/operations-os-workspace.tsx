"use client";

import Link from "next/link";
import { memo } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  ReceiptText,
  ShieldCheck,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Card, Panel, StatusChip } from "@/components/design-system";

type OperationTone = "default" | "success" | "warning" | "danger" | "info";

export type OperationMetric = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: OperationTone;
};

export type OperationAlert = {
  title: ReactNode;
  detail: ReactNode;
  href?: string;
  tone?: OperationTone;
};

type OperationLink = {
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
};

type OperationsOsWorkspaceProps = {
  alerts?: OperationAlert[];
  children?: ReactNode;
  description?: ReactNode;
  metrics: OperationMetric[];
  title?: ReactNode;
};

const hrFlow: OperationLink[] = [
  { title: "Recruitment", detail: "Create staff and assign roles.", href: "/dashboard/director/management?mode=add", icon: UserCheck },
  { title: "Employee Profile", detail: "Manage employee directory and access.", href: "/dashboard/director/management?mode=manage", icon: Users },
  { title: "Documents", detail: "Keep staff and compliance files organized.", href: "/documents", icon: FileText },
  { title: "Attendance & Leave", detail: "Review leave and attendance workflows.", href: "/admin-center/operations#leave", icon: ClipboardCheck },
  { title: "Payroll", detail: "Open payroll summary without changing calculations.", href: "/staff-hr", icon: WalletCards },
  { title: "Exit", detail: "Archive inactive staff into history.", href: "/dashboard/director/management?mode=archive", icon: Archive },
];

const financeFlow: OperationLink[] = [
  { title: "Fee Collection", detail: "Today's collections and pending fees.", href: "/dashboard/director/accounts#pending-fees", icon: BadgeIndianRupee },
  { title: "Invoices", detail: "Generate and review receipts.", href: "/dashboard/director/accounts?mode=invoices#receipts", icon: ReceiptText },
  { title: "Payments", detail: "Existing online and manual payment records.", href: "/payments", icon: WalletCards },
  { title: "Refunds", detail: "Use the existing payment/refund workflow.", href: "/payments", icon: Landmark },
  { title: "Expenses", detail: "Teacher and academic expense claims.", href: "/dashboard/director/accounts?mode=reports#finance-reports", icon: FileCheck2 },
  { title: "Reports", detail: "Finance reports and executive intelligence.", href: "/dashboard/director/reports?mode=finance", icon: BarChart3 },
];

const adminFlow: OperationLink[] = [
  { title: "Assets", detail: "Academic resources and platform assets.", href: "/admin-center/operations", icon: Boxes },
  { title: "Inventory", detail: "Inventory and branch resource posture.", href: "/admin-center/operations", icon: Boxes },
  { title: "Maintenance", detail: "Operational issues and queue health.", href: "/admin-center/operations", icon: AlertTriangle },
  { title: "Branches", detail: "Branch resources and controls.", href: "/admin-center/branches", icon: Building2 },
  { title: "Academic Resources", detail: "Materials, rooms and learning resources.", href: "/dashboard/director/materials", icon: GraduationCap },
  { title: "Compliance", detail: "Audit logs and admin controls.", href: "/admin-center/audit-logs", icon: ShieldCheck },
];

export const OperationsOsWorkspace = memo(function OperationsOsWorkspace({ alerts = [], children, description, metrics, title = "Operations Operating System" }: OperationsOsWorkspaceProps) {
  return (
    <Panel>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <StatusChip tone="info">Operations OS</StatusChip>
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

      {alerts.length ? (
        <section className="mt-5">
          <p className="ds-text-label text-[var(--ds-color-primary)]">Operational alerts</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {alerts.map((alert, index) => {
              const card = (
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[var(--ds-color-text)]">{alert.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ds-color-muted)]">{alert.detail}</p>
                    </div>
                    <StatusChip tone={alert.tone ?? "default"}>{alert.tone ?? "review"}</StatusChip>
                  </div>
                </Card>
              );
              return alert.href ? <Link key={index} href={alert.href}>{card}</Link> : <div key={index}>{card}</div>;
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <OperationFlow title="HR" subtitle="Recruitment to exit" items={hrFlow} />
        <OperationFlow title="Finance" subtitle="Collection to reports" items={financeFlow} />
        <OperationFlow title="Administration" subtitle="Assets to compliance" items={adminFlow} />
      </div>

      {children}
    </Panel>
  );
});

const OperationFlow = memo(function OperationFlow({ items, subtitle, title }: { items: OperationLink[]; subtitle: string; title: string }) {
  return (
    <section>
      <p className="ds-text-label text-[var(--ds-color-primary)]">{title}</p>
      <h3 className="mt-1 font-black text-[var(--ds-color-text)]">{subtitle}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4 transition hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-black text-[var(--ds-color-text)]">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
