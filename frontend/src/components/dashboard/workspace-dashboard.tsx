"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, CalendarDays, ChevronRight, UserRound } from "lucide-react";
import { Button, Card, MetricCard, Panel, StatusChip } from "@/components/design-system";

export type WorkspaceFocusCard = {
  label: string;
  title: ReactNode;
  detail?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type WorkspaceAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

export type WorkspaceMetric = {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type WorkspaceListItem = {
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  href?: string;
};

type WorkspaceDashboardProps = {
  roleTitle: string;
  greeting: ReactNode;
  subtitle?: ReactNode;
  focus: WorkspaceFocusCard[];
  actions: WorkspaceAction[];
  metrics: WorkspaceMetric[];
  notificationHref?: string;
  activity?: WorkspaceListItem[];
  upcoming?: WorkspaceListItem[];
  children?: ReactNode;
};

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

export function WorkspaceDashboard({
  actions,
  activity = [],
  children,
  focus,
  greeting,
  metrics,
  notificationHref = "/notifications",
  roleTitle,
  subtitle,
  upcoming = [],
}: WorkspaceDashboardProps) {
  return (
    <main className="min-h-screen bg-[var(--ds-color-background)] px-4 py-5 text-[var(--ds-color-text)] md:px-6">
      <section className="mx-auto grid w-full max-w-[1500px] gap-5">
        <WorkspaceHeader greeting={greeting} notificationHref={notificationHref} roleTitle={roleTitle} subtitle={subtitle} />

        <section aria-labelledby="today-focus-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="ds-text-label text-[var(--ds-color-primary)]">Today&apos;s Focus</p>
              <h2 id="today-focus-title" className="mt-1 text-2xl font-black text-[var(--ds-color-text)]">
                What should I do today?
              </h2>
            </div>
            <StatusChip tone="info">{focus.length} priorities</StatusChip>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {focus.slice(0, 3).map((item) => (
              <FocusCard key={String(item.label)} item={item} />
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="ds-text-label text-[var(--ds-color-primary)]">Quick Actions</p>
                <h2 className="mt-1 text-xl font-black">Start work</h2>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--ds-color-muted)]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {actions.slice(0, 10).map((action) => {
                const Icon = action.icon;
                return (
                  <Button key={action.label} href={action.href} variant="secondary" className="justify-start">
                    {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </Panel>

          <section aria-labelledby="performance-title">
            <div className="mb-3">
              <p className="ds-text-label text-[var(--ds-color-primary)]">Performance Snapshot</p>
              <h2 id="performance-title" className="mt-1 text-xl font-black">
                Metrics only
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ListPanel eyebrow="Recent Activity" title="Latest movement" items={activity} empty="No recent activity to show yet." />
          <ListPanel eyebrow="Upcoming Items" title="Coming next" items={upcoming} empty="No upcoming items are scheduled yet." />
        </section>

        {children}
      </section>
    </main>
  );
}

function WorkspaceHeader({ greeting, notificationHref, roleTitle, subtitle }: { greeting: ReactNode; notificationHref: string; roleTitle: string; subtitle?: ReactNode }) {
  return (
    <header className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-5 shadow-[var(--ds-shadow-soft)] md:p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_520px] xl:items-center">
        <div>
          <p className="ds-text-label text-[var(--ds-color-primary)]">{roleTitle}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--ds-color-text)] md:text-5xl">{greeting}</h1>
          {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)] md:text-base">{subtitle}</p> : null}
          <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] px-3 py-2 text-sm font-semibold text-[var(--ds-color-muted)]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {dateLabel}
          </div>
        </div>
        <div className="flex items-center gap-3 xl:justify-end">
          <Link href={notificationHref} className="grid h-12 w-12 place-items-center rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-raised)]">
            <span className="sr-only">Notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href="/dashboard/settings" className="grid h-12 w-12 place-items-center rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-raised)]">
            <span className="sr-only">Profile</span>
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function FocusCard({ item }: { item: WorkspaceFocusCard }) {
  const Icon = item.icon;
  const content = (
    <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-medium)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-[var(--ds-radius-large)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
          {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : <ChevronRight className="h-5 w-5" aria-hidden="true" />}
        </div>
        <StatusChip tone={item.tone ?? "default"}>{item.label}</StatusChip>
      </div>
      <h3 className="mt-5 text-2xl font-black leading-tight text-[var(--ds-color-text)]">{item.title}</h3>
      {item.detail ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</p> : null}
      {item.href ? <span className="mt-5 inline-flex items-center gap-2 text-sm font-black">Open <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span> : null}
    </Card>
  );

  if (!item.href) return content;
  return <Link href={item.href}>{content}</Link>;
}

function ListPanel({ empty, eyebrow, items, title }: { empty: string; eyebrow: string; items: WorkspaceListItem[]; title: string }) {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.slice(0, 5).map((item, index) => {
          const row = (
            <div className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-[var(--ds-color-text)]">{item.title}</p>
                  {item.detail ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--ds-color-muted)]">{item.detail}</p> : null}
                </div>
                {item.meta ? <span className="shrink-0 rounded-[var(--ds-radius-full)] bg-[var(--ds-color-muted-soft)] px-3 py-1 text-xs font-black text-[var(--ds-color-muted)]">{item.meta}</span> : null}
              </div>
            </div>
          );
          return item.href ? <Link key={`${String(item.title)}-${index}`} href={item.href}>{row}</Link> : <div key={`${String(item.title)}-${index}`}>{row}</div>;
        })}
        {!items.length ? <div className="rounded-[var(--ds-radius-large)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] p-5 text-sm font-semibold text-[var(--ds-color-muted)]">{empty}</div> : null}
      </div>
    </Panel>
  );
}
