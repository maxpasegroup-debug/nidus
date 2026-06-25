"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDirectorDashboard } from "@/hooks/use-dashboard";
import type { DirectorDashboardData } from "@/services/dashboard";

type LaunchCheck = {
  title: string;
  detail: string;
  value: string | number;
  status: "PASS" | "PARTIAL" | "FAIL";
  href: string;
  icon: LucideIcon;
};

type RoleLane = {
  role: string;
  score: number;
  status: LaunchCheck["status"];
  detail: string;
  href: string;
};

const quickLinks = [
  { title: "Director Control Room", href: "/dashboard/director", icon: Building2 },
  { title: "Admissions", href: "/dashboard/director/admissions", icon: UserPlus },
  { title: "Academics", href: "/dashboard/director/academic", icon: GraduationCap },
  { title: "Administrative Officer", href: "/dashboard/admission-cell", icon: ClipboardCheck },
  { title: "Team And Credentials", href: "/dashboard/director/management", icon: Users },
  { title: "Finance", href: "/dashboard/director/accounts", icon: ShieldCheck },
  { title: "Reports", href: "/dashboard/director/reports", icon: BarChart3 },
  { title: "Teaching Mode", href: "/dashboard/director/teaching", icon: BookOpen },
];

function statusFromCount(count: number, minimum = 1): LaunchCheck["status"] {
  if (count >= minimum) return "PASS";
  if (count > 0) return "PARTIAL";
  return "FAIL";
}

function buildChecks(data?: DirectorDashboardData): LaunchCheck[] {
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
    {
      title: "Active batches",
      detail: "At least one academy batch must be running before launch.",
      value: activeBatches,
      status: statusFromCount(activeBatches),
      href: "/dashboard/director/academic/batches",
      icon: GraduationCap,
    },
    {
      title: "Active learners",
      detail: "Students must be activated into batches, not stuck as applicants.",
      value: activeStudents,
      status: statusFromCount(activeStudents),
      href: "/dashboard/director/academic/student-progress",
      icon: Users,
    },
    {
      title: "Teacher coverage",
      detail: "Academic faculty must exist for live classes, attendance, exams and library.",
      value: teachers,
      status: statusFromCount(teachers),
      href: "/dashboard/director/management",
      icon: BadgeCheck,
    },
    {
      title: "Academic head coverage",
      detail: "Academic Heads must be available for timetable, HOD and academic control.",
      value: academicHeads,
      status: statusFromCount(academicHeads),
      href: "/dashboard/director/academic/teacher-performance",
      icon: ShieldCheck,
    },
    {
      title: "Physical training team",
      detail: "Physical trainers must be visible for defence academy operations.",
      value: trainers,
      status: statusFromCount(trainers),
      href: "/dashboard/director/management",
      icon: Users,
    },
    {
      title: "AO readiness",
      detail: "Admission Officer must be available for approvals, fees and batch activation.",
      value: ao,
      status: statusFromCount(ao),
      href: "/dashboard/admission-cell",
      icon: ClipboardCheck,
    },
    {
      title: "BDE readiness",
      detail: "BDE team must be available for lead follow-up and admission handoff.",
      value: bde,
      status: statusFromCount(bde),
      href: "/dashboard/director/admissions",
      icon: UserPlus,
    },
    {
      title: "Learning materials",
      detail: "Published library items prove students can start learning after activation.",
      value: lessons,
      status: statusFromCount(lessons),
      href: "/dashboard/director/materials",
      icon: BookOpen,
    },
    {
      title: "Assignments",
      detail: "Published homework records prove assignment workflow is usable.",
      value: assignments,
      status: statusFromCount(assignments),
      href: "/dashboard/director/teaching/assignments",
      icon: ClipboardCheck,
    },
    {
      title: "Exams",
      detail: "Published exams prove CBT flow is ready for learners.",
      value: exams,
      status: statusFromCount(exams),
      href: "/dashboard/director/exams",
      icon: BarChart3,
    },
    {
      title: "Fee collection",
      detail: "At least one recorded payment proves AO to finance handoff works.",
      value: `Rs ${feeCollected.toLocaleString()}`,
      status: feeCollected > 0 ? "PASS" : "PARTIAL",
      href: "/dashboard/director/accounts",
      icon: ShieldCheck,
    },
    {
      title: "Pending admissions",
      detail: "Admissions waiting should be handled before public launch.",
      value: pendingAdmissions,
      status: pendingAdmissions === 0 ? "PASS" : "PARTIAL",
      href: "/dashboard/director/admissions",
      icon: AlertTriangle,
    },
    {
      title: "Batch allocation queue",
      detail: "Activated learners should not remain without batch allocation.",
      value: pendingBatch,
      status: pendingBatch === 0 ? "PASS" : "FAIL",
      href: "/dashboard/director/academic/batches",
      icon: AlertTriangle,
    },
  ];
}

function readinessLabel(score: number) {
  if (score >= 90) return "Production ready";
  if (score >= 75) return "Controlled pilot ready";
  if (score >= 55) return "Internal testing only";
  return "Not launch ready";
}

function verdictText(score: number, failed: number) {
  if (failed > 0) return "NOT READY FOR PUBLIC LAUNCH";
  if (score >= 90) return "READY FOR CONTROLLED PRODUCTION";
  if (score >= 75) return "READY FOR CONTROLLED PILOT";
  return "NOT READY FOR LAUNCH";
}

function buildRoleLanes(data: DirectorDashboardData | undefined, checks: LaunchCheck[]): RoleLane[] {
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
  const hasNoFailedChecks = checks.every((check) => check.status !== "FAIL");

  const lane = (role: string, score: number, detail: string, href: string): RoleLane => ({
    role,
    score,
    status: score >= 85 ? "PASS" : score >= 60 ? "PARTIAL" : "FAIL",
    detail,
    href,
  });

  return [
    lane("Director", hasNoFailedChecks ? 95 : 70, "Command center, launch QA, reports and team controls are connected.", "/dashboard/director"),
    lane("Administrative Officer", ao > 0 && activeStudents > 0 ? 95 : ao > 0 ? 70 : 0, `${ao} AO account(s), ${activeStudents} active learner(s).`, "/dashboard/admission-cell"),
    lane("Academic Head", academicHeads > 0 && activeBatches > 0 ? 95 : academicHeads > 0 ? 70 : 0, `${academicHeads} academic head(s), ${activeBatches} active batch(es).`, "/dashboard/director/academic"),
    lane("Teachers", teachers > 0 && lessons > 0 ? 90 : teachers > 0 ? 70 : 0, `${teachers} teacher(s), ${lessons} published library item(s).`, "/dashboard/director/teaching"),
    lane("Physical Trainers", trainers > 0 ? 90 : 0, `${trainers} trainer(s) available for defence fitness operations.`, "/dashboard/director/management"),
    lane("Students", activeStudents > 0 && (assignments > 0 || exams > 0 || lessons > 0) ? 90 : activeStudents > 0 ? 65 : 0, `${activeStudents} learner(s), ${assignments} assignment(s), ${exams} exam(s).`, "/dashboard/director/academic/student-progress"),
    lane("Parent Handoff", activeStudents > 0 ? 75 : 0, "Parent visibility depends on linked learner invitations and active students.", "/dashboard/parent"),
    lane("Finance", feeCollected > 0 ? 90 : 60, `Rs ${feeCollected.toLocaleString()} collected in live finance signals.`, "/dashboard/director/accounts"),
    lane("BDE / CRM", bde > 0 ? 90 : 0, `${bde} BDE account(s) for lead follow-up and handoff.`, "/dashboard/director/admissions"),
  ];
}

function statusTone(status: LaunchCheck["status"]) {
  if (status === "PASS") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "PARTIAL") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-900";
}

export default function DirectorLaunchQaPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDirectorDashboard();
  const checks = buildChecks(data);
  const passed = checks.filter((check) => check.status === "PASS").length;
  const partial = checks.filter((check) => check.status === "PARTIAL").length;
  const failed = checks.filter((check) => check.status === "FAIL").length;
  const readinessScore = Math.round(((passed + partial * 0.5) / checks.length) * 100);
  const roleLanes = buildRoleLanes(data, checks);
  const blockers = checks.filter((check) => check.status !== "PASS");
  const finalVerdict = verdictText(readinessScore, failed);
  const lastUpdatedAt = data?.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString() : "Live refresh pending";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Live Launch QA</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Production readiness board</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                This board reads the live Director dashboard contract and turns CRM, LMS, staff and finance signals into a launch score.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => window.print()} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
                  Print launch report
                </button>
                <span className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">
                  Last checked: {lastUpdatedAt}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Launch Score</p>
              <p className="mt-3 text-5xl font-black">{isLoading ? "..." : `${readinessScore}%`}</p>
              <p className="mt-2 text-sm font-black">{isLoading ? "Checking live data" : readinessLabel(readinessScore)}</p>
              <p className={`mt-4 rounded-xl border px-3 py-2 text-xs font-black ${failed ? statusTone("FAIL") : statusTone(readinessScore >= 75 ? "PASS" : "PARTIAL")}`}>
                {isLoading ? "VERDICT PENDING" : finalVerdict}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black"
              >
                {isFetching ? "Refreshing..." : "Refresh live check"}
              </button>
            </div>
          </div>
        </section>

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            Director readiness data could not be loaded. Backend login/session should be checked before launch.
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard title="Passed" value={passed} tone="PASS" />
          <SummaryCard title="Partial" value={partial} tone="PARTIAL" />
          <SummaryCard title="Failed" value={failed} tone="FAIL" />
          <SummaryCard title="Total Checks" value={checks.length} tone="PASS" />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Role Certification</p>
              <h2 className="mt-2 text-3xl font-black">Who can operate tomorrow?</h2>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-sm font-black">
              {roleLanes.filter((lane) => lane.status === "PASS").length}/{roleLanes.length} green
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleLanes.map((lane) => (
              <RoleLaneCard key={lane.role} lane={lane} loading={isLoading} />
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Action Queue</p>
            <h2 className="mt-2 text-3xl font-black">What blocks launch?</h2>
            <div className="mt-5 grid gap-3">
              {blockers.map((check) => (
                <BlockerRow key={check.title} check={check} loading={isLoading} />
              ))}
              {!blockers.length ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900">
                  No live blockers found in the Director launch board.
                </div>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Launch Handoff</p>
            <h2 className="mt-2 text-3xl font-black">Director instructions</h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted-blue)]">
              <p><b className="text-[var(--navy)]">Morning:</b> Open this page, refresh live check, clear failed rows first.</p>
              <p><b className="text-[var(--navy)]">Admissions:</b> AO clears fee, document and batch allocation queue before classes begin.</p>
              <p><b className="text-[var(--navy)]">Academics:</b> Academic Head verifies timetable, teacher coverage and student visibility.</p>
              <p><b className="text-[var(--navy)]">Public launch:</b> Proceed only when no failed checks remain and the score is at least 90%.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <QuickLink key={link.title} link={link} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {checks.map((check) => (
            <CheckCard key={check.title} check={check} loading={isLoading} />
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black">Green signal rule</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Use this page after deployment. Public launch needs no failed checks, a working Director login, and successful frontend build,
                backend build, Prisma validation and migration deploy.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: LaunchCheck["status"] }) {
  return (
    <div className={`rounded-2xl border p-5 ${statusTone(tone)}`}>
      <p className="text-xs font-black uppercase tracking-[0.28em]">{title}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function QuickLink({ link }: { link: { title: string; href: string; icon: LucideIcon } }) {
  const Icon = link.icon;
  return (
    <Link className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl" href={link.href}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-lg font-black">{link.title}</h2>
      <span className="mt-4 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}

function RoleLaneCard({ lane, loading }: { lane: RoleLane; loading: boolean }) {
  return (
    <Link href={lane.href} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{lane.role}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{lane.detail}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(lane.status)}`}>
          {loading ? "..." : `${lane.score}%`}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${loading ? 0 : lane.score}%` }} />
      </div>
    </Link>
  );
}

function BlockerRow({ check, loading }: { check: LaunchCheck; loading: boolean }) {
  const StatusIcon = check.status === "FAIL" ? XCircle : AlertTriangle;
  return (
    <Link href={check.href} className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${statusTone(check.status)}`}>
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

function CheckCard({ check, loading }: { check: LaunchCheck; loading: boolean }) {
  const Icon = check.icon;
  const StatusIcon = check.status === "PASS" ? CheckCircle2 : check.status === "PARTIAL" ? AlertTriangle : XCircle;
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
            <Icon className="h-6 w-6 text-[var(--navy)]" />
          </div>
          <div>
            <h2 className="text-xl font-black">{check.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{check.detail}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${statusTone(check.status)}`}>
            <StatusIcon className="h-4 w-4" />
            {loading ? "CHECKING" : check.status}
          </span>
          <span className="text-2xl font-black">{loading ? "..." : check.value}</span>
        </div>
      </div>
      <Link href={check.href} className="mt-5 inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
        Open source module
      </Link>
    </article>
  );
}
