"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Printer,
  RefreshCcw,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDirectorDashboard } from "@/hooks/use-dashboard";
import {
  getDirectorLaunchCertification,
  getDirectorOpsReadiness,
  getDirectorSecurityReadiness,
  type DirectorDashboardData,
  type DirectorOpsReadinessData,
  type DirectorSecurityReadinessData,
} from "@/services/dashboard";

type CheckStatus = "PASS" | "PARTIAL" | "FAIL";
type ReadinessState = "ready" | "attention" | "blocked";

type ReadinessCheck = {
  title: string;
  detail: string;
  value: string | number;
  status: CheckStatus;
  href: string;
  icon: LucideIcon;
};

const actionLinks = [
  { title: "Admissions", href: "/dashboard/director/admissions", icon: UserPlus },
  { title: "Academics", href: "/dashboard/director/academic", icon: GraduationCap },
  { title: "Students", href: "/dashboard/director/students", icon: Users },
  { title: "Staff & Access", href: "/dashboard/director/management", icon: ShieldCheck },
  { title: "Accounts", href: "/dashboard/director/accounts", icon: BarChart3 },
  { title: "Reports", href: "/dashboard/director/reports", icon: ClipboardCheck },
];

function statusFromCount(count: number, minimum = 1): CheckStatus {
  if (count >= minimum) return "PASS";
  if (count > 0) return "PARTIAL";
  return "FAIL";
}

function buildChecks(data?: DirectorDashboardData): ReadinessCheck[] {
  const command = data?.commandCenter;
  const staff = command?.staff;
  const activeBatches = command?.academics.activeBatches ?? data?.academyArchitecture.batches ?? 0;
  const activeStudents = command?.students.active ?? data?.instituteAnalytics.students ?? 0;
  const teachers = command?.academics.teachers ?? data?.instituteAnalytics.teachers ?? 0;
  const academicHeads = command?.academics.academicHeads ?? staff?.academicHeads.active ?? 0;
  const trainers = staff?.physicalTrainers.active ?? 0;
  const ao = staff?.administrativeOfficers.active ?? 0;
  const bde = staff?.businessDevelopmentExecutives.active ?? 0;
  const lessons = command?.learning.lessonsUploaded ?? 0;
  const assignments = command?.learning.assignmentsPublished ?? 0;
  const exams = command?.learning.examsPublished ?? 0;
  const feeCollected = command?.finance.feesCollected ?? data?.revenueAnalytics.collected ?? 0;
  const pendingAdmissions = command?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingBatch = command?.operationalAlerts.pendingBatchAllocation ?? 0;

  return [
    { title: "Batches ready", detail: "At least one academy batch is running.", value: activeBatches, status: statusFromCount(activeBatches), href: "/dashboard/director/academic/batches", icon: GraduationCap },
    { title: "Students active", detail: "Students are activated and visible for classes.", value: activeStudents, status: statusFromCount(activeStudents), href: "/dashboard/director/students", icon: Users },
    { title: "Teachers ready", detail: "Faculty exists for classes, attendance and exams.", value: teachers, status: statusFromCount(teachers), href: "/dashboard/director/management", icon: ShieldCheck },
    { title: "Academic Head ready", detail: "Academic Head is available for timetable and monitoring.", value: academicHeads, status: statusFromCount(academicHeads), href: "/dashboard/director/academic", icon: GraduationCap },
    { title: "PT ready", detail: "Physical trainers are available for fitness operations.", value: trainers, status: statusFromCount(trainers), href: "/dashboard/director/management", icon: Users },
    { title: "AO ready", detail: "Admission Officer is available for admission activation.", value: ao, status: statusFromCount(ao), href: "/dashboard/director/admissions", icon: ClipboardCheck },
    { title: "BDE ready", detail: "BDE team is available for lead follow-up.", value: bde, status: statusFromCount(bde), href: "/dashboard/business-development", icon: UserPlus },
    { title: "Learning content", detail: "Published learning material is available.", value: lessons, status: statusFromCount(lessons), href: "/dashboard/director/materials", icon: GraduationCap },
    { title: "Assignments", detail: "Assignment workflow has published records.", value: assignments, status: assignments > 0 ? "PASS" : "PARTIAL", href: "/dashboard/director/academic/reports", icon: ClipboardCheck },
    { title: "Exams", detail: "Exam workflow has published records.", value: exams, status: exams > 0 ? "PASS" : "PARTIAL", href: "/dashboard/director/exams", icon: BarChart3 },
    { title: "Fee handoff", detail: "Finance has at least one recorded payment.", value: `Rs ${feeCollected.toLocaleString("en-IN")}`, status: feeCollected > 0 ? "PASS" : "PARTIAL", href: "/dashboard/director/accounts", icon: BarChart3 },
    { title: "Admission queue", detail: "Pending admissions should be reviewed before launch.", value: pendingAdmissions, status: pendingAdmissions === 0 ? "PASS" : "PARTIAL", href: "/dashboard/director/admissions", icon: AlertTriangle },
    { title: "Batch allocation", detail: "Activated students should not remain unallocated.", value: pendingBatch, status: pendingBatch === 0 ? "PASS" : "FAIL", href: "/dashboard/director/academic/batches", icon: AlertTriangle },
  ];
}

function stateFrom(score: number, failed: number, partial: number): ReadinessState {
  if (failed > 0 || score < 65) return "blocked";
  if (partial > 0 || score < 90) return "attention";
  return "ready";
}

function stateLabel(state: ReadinessState) {
  if (state === "ready") return "Ready";
  if (state === "attention") return "Needs Attention";
  return "Blocked";
}

function toneForStatus(status: CheckStatus) {
  if (status === "PASS") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "PARTIAL") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-900";
}

function toneForState(state: ReadinessState) {
  if (state === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (state === "attention") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-900";
}

export default function DirectorLaunchQaPage() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDirectorDashboard();
  const opsQuery = useQuery({ queryKey: ["dashboard", "director", "ops-readiness"], queryFn: getDirectorOpsReadiness });
  const securityQuery = useQuery({ queryKey: ["dashboard", "director", "security-readiness"], queryFn: getDirectorSecurityReadiness });
  const certificationQuery = useQuery({ queryKey: ["dashboard", "director", "launch-certification"], queryFn: getDirectorLaunchCertification });
  const checks = buildChecks(data);
  const passed = checks.filter((check) => check.status === "PASS").length;
  const partial = checks.filter((check) => check.status === "PARTIAL").length;
  const failed = checks.filter((check) => check.status === "FAIL").length;
  const academyScore = Math.round(((passed + partial * 0.5) / checks.length) * 100);
  const opsFailed = opsQuery.data?.summary.fail ?? 0;
  const securityFailed = securityQuery.data?.summary.fail ?? 0;
  const overallScore = certificationQuery.data?.scores.overall ?? Math.round((academyScore + (opsQuery.data?.score ?? academyScore) + (securityQuery.data?.score ?? academyScore)) / 3);
  const readinessState = stateFrom(overallScore, failed + opsFailed + securityFailed, partial + (opsQuery.data?.summary.partial ?? 0) + (securityQuery.data?.summary.partial ?? 0));
  const attentionChecks = checks.filter((check) => check.status !== "PASS");
  const lastUpdatedAt = data?.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString() : "Live refresh pending";
  const certification = certificationQuery.data;

  const downloadCertificate = () => {
    if (!certification) return;
    const blob = new Blob([JSON.stringify(certification, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${certification.certificationId.toLowerCase()}-readiness.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = () => {
    refetch();
    opsQuery.refetch();
    securityQuery.refetch();
    certificationQuery.refetch();
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Readiness</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-4xl">Readiness</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                One launch signal for the Director. Clear blocked items first, then review attention items before public use.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={refreshAll} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <span className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 text-sm font-black">
                  Last checked: {lastUpdatedAt}
                </span>
              </div>
            </div>
            <div className={`rounded-2xl border p-4 ${toneForState(readinessState)}`}>
              <p className="text-xs font-black uppercase tracking-[0.24em]">Current Signal</p>
              <p className="mt-3 text-4xl font-black">{isLoading || certificationQuery.isLoading ? "..." : stateLabel(readinessState)}</p>
              <p className="mt-2 text-sm font-black">{overallScore}% overall readiness</p>
            </div>
          </div>
        </header>

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            Director readiness data could not be loaded. Check backend session and API health before launch.
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard title="Ready" value={passed} tone="PASS" />
          <SummaryCard title="Needs Attention" value={partial} tone="PARTIAL" />
          <SummaryCard title="Blocked" value={failed + opsFailed + securityFailed} tone="FAIL" />
          <SummaryCard title="Overall" value={`${overallScore}%`} tone={readinessState === "ready" ? "PASS" : readinessState === "attention" ? "PARTIAL" : "FAIL"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="What Needs Attention?" eyebrow="Action list">
            <div className="grid gap-3">
              {attentionChecks.map((check) => (
                <ReadinessRow key={check.title} check={check} loading={isLoading} />
              ))}
              {!attentionChecks.length && !opsFailed && !securityFailed ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900">
                  No academy readiness blockers found.
                </div>
              ) : null}
              {opsFailed || securityFailed ? (
                <button type="button" onClick={() => setAdvancedOpen(true)} className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-sm font-black text-red-900">
                  Technical readiness has {opsFailed + securityFailed} blocked item(s). Open advanced details.
                </button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Director Instructions" eyebrow="Go-live rule">
            <div className="grid gap-3 text-sm leading-6 text-[var(--muted-blue)]">
              <Instruction title="Ready" text="All checks are green. Refresh once more, print the certificate, then proceed with controlled production use." />
              <Instruction title="Needs Attention" text="The system can be used internally, but clear yellow items before public launch." />
              <Instruction title="Blocked" text="Do not launch publicly. Open the blocked row, fix it, redeploy if needed, then refresh this page." />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={downloadCertificate} disabled={!certification} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-50">
                <Download className="h-4 w-4" />
                Download Certificate
              </button>
              <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                {advancedOpen ? "Hide Advanced" : "Show Advanced"}
              </button>
            </div>
          </Panel>
        </section>

        <Panel title="Open Action Page" eyebrow="Fix from here">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {actionLinks.map((link) => (
              <QuickLink key={link.title} link={link} />
            ))}
          </div>
        </Panel>

        {advancedOpen ? (
          <section className="grid gap-4">
            <Panel title="Advanced Technical Details" eyebrow="Developer evidence">
              <div className="grid gap-3 md:grid-cols-3">
                <ScoreCard title="Academy" value={academyScore} />
                <ScoreCard title="Operations" value={opsQuery.data?.score ?? 0} />
                <ScoreCard title="Security" value={securityQuery.data?.score ?? 0} />
              </div>
            </Panel>

            <section className="grid gap-4 xl:grid-cols-2">
              <Panel title="Operations Checks" eyebrow={opsQuery.isLoading ? "Checking" : opsQuery.data?.verdict ?? "Unavailable"}>
                <div className="grid gap-3">
                  {(opsQuery.data?.checks ?? []).map((check) => <TechnicalRow key={check.key} check={check} />)}
                  {opsQuery.isLoading ? <Empty text="Operations readiness is loading." /> : null}
                </div>
              </Panel>
              <Panel title="Security Checks" eyebrow={securityQuery.isLoading ? "Checking" : securityQuery.data?.verdict ?? "Unavailable"}>
                <div className="grid gap-3">
                  {(securityQuery.data?.checks ?? []).map((check) => <TechnicalRow key={check.key} check={check} />)}
                  {securityQuery.isLoading ? <Empty text="Security readiness is loading." /> : null}
                </div>
              </Panel>
            </section>

            <Panel title="Academy Checks" eyebrow="Source evidence">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {checks.map((check) => <CheckCard key={check.title} check={check} loading={isLoading} />)}
              </div>
            </Panel>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: string | number; tone: CheckStatus }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneForStatus(tone)}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReadinessRow({ check, loading }: { check: ReadinessCheck; loading: boolean }) {
  const StatusIcon = check.status === "FAIL" ? XCircle : AlertTriangle;
  return (
    <Link href={check.href} className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${toneForStatus(check.status)}`}>
      <div className="flex gap-3">
        <StatusIcon className="mt-1 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-black">{check.title}</h3>
          <p className="mt-1 text-sm leading-6">{check.detail}</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-current bg-white/60 px-3 py-1 text-sm font-black">
        {loading ? "..." : check.value}
      </span>
    </Link>
  );
}

function Instruction({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
      <p className="font-black text-[var(--navy)]">{title}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function QuickLink({ link }: { link: { title: string; href: string; icon: LucideIcon } }) {
  const Icon = link.icon;
  return (
    <Link href={link.href} className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black transition hover:border-[var(--gold-border)]">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      {link.title}
    </Link>
  );
}

function ScoreCard({ title, value }: { title: string; value: number }) {
  const tone = value >= 90 ? "PASS" : value >= 65 ? "PARTIAL" : "FAIL";
  return (
    <div className={`rounded-2xl border p-4 ${toneForStatus(tone)}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}%</p>
    </div>
  );
}

function TechnicalRow({ check }: { check: DirectorOpsReadinessData["checks"][number] | DirectorSecurityReadinessData["checks"][number] }) {
  const StatusIcon = check.status === "PASS" ? CheckCircle2 : check.status === "PARTIAL" ? AlertTriangle : XCircle;
  return (
    <article className={`rounded-2xl border p-4 ${toneForStatus(check.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{check.title}</h3>
          <p className="mt-1 text-sm leading-6">{check.detail}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-black">
          <StatusIcon className="h-4 w-4" />
          {check.status}
        </span>
      </div>
    </article>
  );
}

function CheckCard({ check, loading }: { check: ReadinessCheck; loading: boolean }) {
  const Icon = check.icon;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <h3 className="mt-3 font-black">{check.title}</h3>
      <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{check.detail}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneForStatus(check.status)}`}>{check.status}</span>
        <span className="font-black">{loading ? "..." : check.value}</span>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-blue)]">{text}</div>;
}
