"use client";

import { Activity, AlertTriangle, BarChart3, Server, Timer } from "lucide-react";
import { SystemHealthCard } from "@/components/admin-center/SystemHealthCard";
import { OperationsOsWorkspace } from "@/components/operations/operations-os-workspace";
import { WorkflowOsWorkspace, workflowIcons } from "@/components/workflow/workflow-os-workspace";
import { useAdminOperations } from "@/hooks/use-admin-center";

const labels: Record<string, string> = {
  activeUsers: "Active users",
  newUsers24h: "New users 24h",
  cbtAttempts24h: "CBT attempts 24h",
  aiRequests24h: "AI requests 24h",
  failedAi24h: "AI failures 24h",
  payments24h: "Payments 24h",
  paymentFailures24h: "Payment failures 24h",
  revenue30d: "Revenue 30d",
  dailyIssues30d: "Daily Intelligence 30d",
  failedQueueLogs24h: "Failed jobs 24h",
  auditEvents24h: "Audit events 24h"
};

export default function OperationsPage() {
  const operations = useAdminOperations();
  const data = operations.data;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Production Operations</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Beta Readiness</h1>
            <p className="mt-2 text-sm text-muted">Live deployment health, queues, infrastructure, payments, AI, CBT and platform usage.</p>
          </div>
          {data && <span className="rounded bg-white/10 px-3 py-2 text-xs text-muted">Updated every 30s</span>}
        </div>

        <div className="mt-6">
          <OperationsOsWorkspace
            title="Administration Operations"
            description="Assets, inventory, maintenance, branches, academic resources and compliance are organized around the existing admin operations center."
            metrics={[
              { label: "Assets", value: data ? data.analytics.activeUsers : "...", note: "Active platform users as operational load", tone: "info" },
              { label: "Maintenance", value: data ? data.analytics.failedQueueLogs24h : "...", note: "Failed queue logs in 24h", tone: data?.analytics.failedQueueLogs24h ? "warning" : "success" },
              { label: "Compliance", value: data ? data.analytics.auditEvents24h : "...", note: "Audit events in 24h", tone: "info" },
              { label: "Branch Resources", value: data ? String(data.infrastructure.database) : "...", note: "Database and branch resource posture", tone: data?.infrastructure.database ? "success" : "warning" },
            ]}
            alerts={[
              { title: "Operational risks", detail: data ? `${data.analytics.paymentFailures24h} payment failure(s), ${data.analytics.failedAi24h} AI failure(s), ${data.analytics.failedQueueLogs24h} failed job(s).` : "Operations data is loading.", href: "/admin-center/operations", tone: data && (data.analytics.paymentFailures24h || data.analytics.failedAi24h || data.analytics.failedQueueLogs24h) ? "warning" : "success" },
              { title: "Audit history", detail: data ? `${data.analytics.auditEvents24h} audit event(s) recorded in the last 24h.` : "Audit data is loading.", href: "/admin-center/audit-logs", tone: "info" },
              { title: "Branch controls", detail: "Branch resources remain managed through the existing admin center branch tools.", href: "/admin-center/branches", tone: "info" },
            ]}
          />
        </div>

        <div className="mt-6">
          <WorkflowOsWorkspace
            title="Automation And Queue Workflow"
            description="Queue workers, Redis, retry posture, failed jobs, audit logs and notification queues stay in the existing infrastructure while being visible as one workflow health layer."
            metrics={[
              { label: "Workflow Health", value: data ? data.runtime.phase : "...", note: data?.runtime.ready ? "Runtime ready" : "Runtime loading or degraded", tone: data?.runtime.ready ? "success" : "warning" },
              { label: "Failed Jobs", value: data ? data.analytics.failedQueueLogs24h : "...", note: "Queue job failures in 24h", tone: data?.analytics.failedQueueLogs24h ? "warning" : "success" },
              { label: "Automation Status", value: data ? String(data.environment.queueWorkersEnabled) : "...", note: "Existing queue worker flag", tone: data?.environment.queueWorkersEnabled ? "success" : "warning" },
              { label: "System Activity", value: data ? data.analytics.auditEvents24h : "...", note: "Audit events in 24h", tone: "info" },
            ]}
            approvals={(data?.queueHealth ?? []).slice(0, 4).map((queue) => ({
              title: queue.queueName,
              detail: `${queue.waiting} waiting, ${queue.active} active, ${queue.failed} failed, ${queue.delayed} delayed.`,
              href: "/admin-center/operations",
              icon: queue.failed ? workflowIcons.reminder : workflowIcons.automation,
              tone: queue.failed ? "warning" : "success",
            }))}
            recent={[
              { title: "Audit history", detail: data ? `${data.analytics.auditEvents24h} audit event(s) in the last 24h.` : "Audit data loading.", href: "/admin-center/audit-logs", icon: workflowIcons.task, tone: "info" },
              { title: "Redis and workers", detail: data ? `Redis ${String(data.infrastructure.redis)} / workers ${String(data.environment.queueWorkersEnabled)}.` : "Infrastructure data loading.", href: "/admin-center/operations", icon: workflowIcons.automation, tone: data?.infrastructure.redis ? "success" : "warning" },
              { title: "Notification queues", detail: "Email, push and notification jobs remain in the existing backend queue system.", href: "/dashboard/director/notifications", icon: workflowIcons.notification, tone: "info" },
            ]}
          />
        </div>

        {operations.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-white/10" />)}</div>}

        {data && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <SystemHealthCard label="runtime" status={data.runtime.phase} value={data.runtime.ready ? "Ready" : data.runtime.phase} />
              <SystemHealthCard label="database" status={String(data.infrastructure.database)} />
              <SystemHealthCard label="redis" status={String(data.infrastructure.redis)} />
              <SystemHealthCard label="memory" status="MONITORED" value={`${data.infrastructure.memoryMb} MB`} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
              <section className="premium-surface rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink">Queue health</h2>
                  <Server className="h-5 w-5 text-gold-soft" />
                </div>
                <div className="mt-5 grid gap-3">
                  {data.queueHealth.map((queue) => (
                    <div key={queue.queueName} className="rounded border border-white/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{queue.queueName}</p>
                        <span className={`rounded px-2 py-1 text-xs ${queue.status === "HEALTHY" ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100"}`}>{queue.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted sm:grid-cols-6">
                        <span>Waiting {queue.waiting}</span>
                        <span>Active {queue.active}</span>
                        <span>Done {queue.completed}</span>
                        <span>Failed {queue.failed}</span>
                        <span>Delayed {queue.delayed}</span>
                        <span>Paused {queue.paused}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="grid gap-4">
                <div className="premium-surface rounded-lg p-5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-ink"><Timer className="h-5 w-5 text-gold-soft" /> Runtime</div>
                  <div className="mt-4 space-y-2 text-sm text-muted">
                    <p>Role: {String(data.environment.processRole)}</p>
                    <p>Uptime: {data.runtime.uptimeSeconds}s</p>
                    <p>Maintenance: {String(data.environment.maintenanceMode)}</p>
                    <p>Sentry: {String(data.environment.sentryConfigured)}</p>
                  </div>
                </div>
                {data.runtime.lastError && (
                  <div className="premium-surface rounded-lg p-5">
                    <div className="flex items-center gap-3 text-sm font-semibold text-amber-100"><AlertTriangle className="h-5 w-5" /> Last runtime error</div>
                    <p className="mt-3 text-sm text-muted">{data.runtime.lastError}</p>
                  </div>
                )}
              </aside>
            </div>

            <section className="mt-6 premium-surface rounded-lg p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Production analytics</h2>
                <BarChart3 className="h-5 w-5 text-gold-soft" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(data.analytics).map(([key, value]) => (
                  <div key={key} className="rounded border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">{labels[key] ?? key}</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 premium-surface rounded-lg p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-ink"><Activity className="h-5 w-5 text-gold-soft" /> Railway deployment posture</div>
              <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.environment).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
