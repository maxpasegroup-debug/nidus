"use client";

import { Activity, AlertTriangle, CheckCircle2, Database, HardDrive, RefreshCw, Server, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminOperations } from "@/hooks/use-admin-center";

const analyticsLabels: Record<string, string> = {
  activeUsers: "Active users",
  newUsers24h: "New users",
  cbtAttempts24h: "Exam attempts",
  aiRequests24h: "AI requests",
  failedAi24h: "AI failures",
  payments24h: "Payments",
  paymentFailures24h: "Payment failures",
  revenue30d: "Revenue 30d",
  dailyIssues30d: "Daily intelligence",
  failedQueueLogs24h: "Failed jobs",
  auditEvents24h: "Audit events",
};

function healthTone(value?: string | boolean | number) {
  const text = String(value ?? "").toUpperCase();
  if (["CONNECTED", "READY", "TRUE", "OPERATIONAL", "HEALTHY"].includes(text)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (["FAILED", "FALSE", "DEGRADED", "ATTENTION"].includes(text)) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-white border-[var(--border)]";
}

export default function OperationsPage() {
  const operations = useAdminOperations();
  const data = operations.data;
  const hasRisk = data ? data.analytics.failedQueueLogs24h > 0 || data.analytics.failedAi24h > 0 || data.analytics.paymentFailures24h > 0 || !data.runtime.ready : false;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">CEO Platform Health</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Platform Health</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">A compact CEO view for runtime, database, Redis, queues and production counters.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-muted">
            <RefreshCw className="h-3.5 w-3.5" />
            Auto refresh 30s
          </span>
        </div>

        {operations.isLoading ? <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg bg-white/10" />)}</div> : null}

        {data ? (
          <>
            <section className={`rounded-lg border p-4 ${hasRisk ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
              <div className="flex flex-wrap items-center gap-3">
                {hasRisk ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                <div>
                  <h2 className="text-base font-semibold">{hasRisk ? "Attention required" : "Platform is healthy"}</h2>
                  <p className="mt-1 text-sm">
                    {hasRisk
                      ? `${data.analytics.failedQueueLogs24h} failed job(s), ${data.analytics.failedAi24h} AI failure(s), ${data.analytics.paymentFailures24h} payment failure(s).`
                      : "Runtime, infrastructure and queues are reporting normally."}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              <HealthCard icon={Timer} label="Runtime" value={data.runtime.ready ? "Ready" : data.runtime.phase} toneValue={data.runtime.ready} detail={`Uptime ${data.runtime.uptimeSeconds}s`} />
              <HealthCard icon={Database} label="Database" value={String(data.infrastructure.database)} toneValue={data.infrastructure.database} detail="Primary data store" />
              <HealthCard icon={Server} label="Redis" value={String(data.infrastructure.redis)} toneValue={data.infrastructure.redis} detail={`Workers ${String(data.environment.queueWorkersEnabled)}`} />
              <HealthCard icon={HardDrive} label="Memory" value={`${data.infrastructure.memoryMb} MB`} toneValue="MONITORED" detail="Server RSS usage" />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div className="premium-surface rounded-lg p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Queues</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink">Job Queues</h2>
                  </div>
                  <Server className="h-5 w-5 text-gold-soft" />
                </div>
                <div className="mt-4 grid gap-3">
                  {data.queueHealth.map((queue) => (
                    <article key={queue.queueName} className="rounded-lg border border-white/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-ink">{queue.queueName}</h3>
                        <span className={`rounded border px-2 py-1 text-xs ${healthTone(queue.status)}`}>{queue.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted sm:grid-cols-6">
                        <span>Waiting {queue.waiting}</span>
                        <span>Active {queue.active}</span>
                        <span>Done {queue.completed}</span>
                        <span>Failed {queue.failed}</span>
                        <span>Delayed {queue.delayed}</span>
                        <span>Paused {queue.paused}</span>
                      </div>
                    </article>
                  ))}
                  {!data.queueHealth.length ? <p className="text-sm text-muted">No queue records returned.</p> : null}
                </div>
              </div>

              <aside className="grid content-start gap-3">
                <div className="premium-surface rounded-lg p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Runtime</p>
                  <div className="mt-4 grid gap-2 text-sm text-muted">
                    <p>Phase: {data.runtime.phase}</p>
                    <p>Process: {String(data.environment.processRole)}</p>
                    <p>Maintenance: {String(data.environment.maintenanceMode)}</p>
                    <p>Queue available: {String(data.environment.queueAvailable)}</p>
                  </div>
                </div>
                {data.runtime.lastError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
                    <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" /> Last Error</div>
                    <p className="mt-2 text-sm">{data.runtime.lastError}</p>
                  </div>
                ) : null}
              </aside>
            </section>

            <section className="premium-surface rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Production Counters</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Last 24h / 30d</h2>
                </div>
                <Activity className="h-5 w-5 text-gold-soft" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(data.analytics).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">{analyticsLabels[key] ?? key}</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function HealthCard({
  detail,
  icon: Icon,
  label,
  toneValue,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  toneValue?: string | boolean | number;
  value: string;
}) {
  return (
    <article className="premium-surface rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
        <Icon className="h-5 w-5 text-gold-soft" />
      </div>
      <p className="mt-3 text-xl font-semibold text-ink">{value}</p>
      <span className={`mt-3 inline-flex rounded border px-2 py-1 text-xs ${healthTone(toneValue)}`}>{detail}</span>
    </article>
  );
}
