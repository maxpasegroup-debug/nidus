"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, ClipboardList, CreditCard, Download, GraduationCap, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { RoleDashboardGuard, DashboardError, DashboardSkeleton } from "@/components/dashboard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { useParentDashboard } from "@/hooks/use-dashboard";
import { getMyNdpReviews, type NdpManualEntry } from "@/services/academy";

export default function ParentDashboardPage() {
  const dashboard = useParentDashboard();
  const ndpQuery = useQuery({ queryKey: ["parent", "ndp"], queryFn: getMyNdpReviews });
  const data = dashboard.data;

  if (dashboard.isLoading) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (dashboard.error || !data) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardError error={dashboard.error} onRefresh={() => dashboard.refetch()} />
      </RoleDashboardGuard>
    );
  }

  const studentName = data.linkedStudent?.name ?? "your child";
  const pendingAssignments = data.assignments?.pending ?? 0;
  const submittedAssignments = data.assignments?.submitted ?? 0;
  const assignmentTotal = data.assignments?.total ?? 0;
  const examAverage = data.exams?.averageScore ?? data.studentPerformance.averageScore ?? 0;
  const feeDue = data.feeStatus.dueAmount ?? 0;
  const feeClear = feeDue <= 0;
  const attendanceSafe = data.attendance.percentage >= 75;
  const latestNdp = ndpQuery.data?.reviews?.[0] ?? null;
  const ndpHighlights = latestNdp?.entries.filter((entry) => ["ACADEMIC_PERFORMANCE", "TEST_PERFORMANCE", "TEACHER_OBSERVATION", "NEXT_TERM_ACTION_PLAN"].includes(entry.category)).slice(0, 6) ?? [];

  return (
    <RoleDashboardGuard role="PARENT">
      <WorkspaceDashboard
        roleTitle="Parent Workspace"
        greeting={data.linkedStudent ? `${studentName}'s update` : "Link student account"}
        subtitle="Attendance, homework, exams, fees and academy messages in one simple parent view."
        focus={[
          {
            label: "Attendance",
            title: `${data.attendance.percentage}%`,
            detail: `${data.attendance.present}/${data.attendance.total} classes marked. Keep attendance above 75%.`,
            href: "/dashboard/parent#attendance",
            icon: CalendarDays,
            tone: attendanceSafe ? "success" : "warning",
          },
          {
            label: "Homework",
            title: pendingAssignments ? `${pendingAssignments} pending` : "Homework clear",
            detail: `${submittedAssignments}/${assignmentTotal} assignment(s) submitted.`,
            href: "/dashboard/parent#homework",
            icon: ClipboardList,
            tone: pendingAssignments ? "warning" : "success",
          },
          {
            label: "Fees",
            title: feeClear ? "Fees clear" : `Rs ${feeDue}`,
            detail: feeClear ? "No fee due is visible now." : `Next due date: ${data.feeStatus.nextDueDate}.`,
            href: "/dashboard/parent#fees",
            icon: CreditCard,
            tone: feeClear ? "success" : "warning",
          },
        ]}
        actions={[
          { label: "Attendance", href: "/dashboard/parent#attendance", icon: CalendarDays },
          { label: "Homework", href: "/dashboard/parent#homework", icon: ClipboardList },
          { label: "Exam Results", href: "/dashboard/parent#exams", icon: GraduationCap },
          { label: "NDP Report", href: "/dashboard/parent#ndp", icon: ShieldCheck },
          { label: "Fees", href: "/dashboard/parent#fees", icon: CreditCard },
          { label: "Messages", href: "/messages", icon: MessageCircle },
          { label: "Profile", href: "/dashboard/settings", icon: UserRound },
        ]}
        metrics={[
          { label: "Attendance", value: `${data.attendance.percentage}%`, tone: attendanceSafe ? "success" : "warning" },
          { label: "Homework", value: `${submittedAssignments}/${assignmentTotal}`, tone: pendingAssignments ? "warning" : "success" },
          { label: "Exam Average", value: `${examAverage}%`, tone: examAverage >= 70 ? "success" : "info" },
          { label: "Fee Due", value: feeClear ? "Clear" : `Rs ${feeDue}`, tone: feeClear ? "success" : "warning" },
        ]}
        activity={(data.notifications ?? []).slice(0, 5).map((message) => ({
          title: "Academy message",
          detail: message,
          href: "/notifications",
          meta: "Notice",
        }))}
        upcoming={[
          ...(data.assignments?.recent ?? []).slice(0, 3).map((assignment) => ({
            title: assignment.title,
            detail: `${assignment.status}${assignment.subject ? ` / ${assignment.subject}` : ""}`,
            href: "/dashboard/parent#homework",
            meta: assignment.score !== null && assignment.score !== undefined ? `${assignment.score}` : assignment.status,
          })),
          ...(data.exams?.recent ?? []).slice(0, 2).map((exam) => ({
            title: "Recent exam",
            detail: exam.status,
            href: "/dashboard/parent#exams",
            meta: exam.score !== null && exam.score !== undefined ? `${exam.score}%` : "Pending",
          })),
        ]}
      >
        {!data.linkedStudent ? (
          <section className="rounded-[var(--ds-radius-large)] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>Ask the student to send a parent invitation from the student account. After linking, attendance, homework, exams and fees will appear here.</p>
            </div>
          </section>
        ) : null}
        <section id="ndp" className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-white p-5 shadow-sm print:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--ds-color-primary)]">NIDUS Digital Profile</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--ds-color-ink)]">{latestNdp ? `${latestNdp.reviewPeriod} published report` : "Published NDP pending"}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ds-color-muted)]">
                {latestNdp
                  ? `Overall readiness ${latestNdp.scores?.overallReadiness ?? "--"}%. This is the parent-readable copy of the approved student NDP.`
                  : ndpQuery.isLoading
                    ? "Loading the latest published NDP report."
                    : "The report will appear after the teacher submits it and Academic Head publishes it."}
              </p>
            </div>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ds-color-border)] px-4 text-sm font-black print:hidden">
              <Download className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
          {latestNdp ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                <ParentNdpMetric label="Overall" value={latestNdp.scores?.overallReadiness} />
                <ParentNdpMetric label="Academic" value={latestNdp.scores?.academicReadiness} />
                <ParentNdpMetric label="Tests" value={latestNdp.scores?.testPerformance} />
                <ParentNdpMetric label="Skills" value={latestNdp.scores?.skillDevelopment} />
                <ParentNdpMetric label="Defence" value={latestNdp.scores?.defenceDevelopment} />
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {ndpHighlights.map((entry) => <ParentNdpEntry key={`${entry.category}-${entry.subject ?? ""}-${entry.item}`} entry={entry} />)}
              </div>
            </>
          ) : null}
        </section>
        <section id="attendance" className="sr-only" aria-label="Attendance section" />
        <section id="homework" className="sr-only" aria-label="Homework section" />
        <section id="exams" className="sr-only" aria-label="Exam section" />
        <section id="fees" className="sr-only" aria-label="Fees section" />
        <section id="messages" className="sr-only" aria-label="Messages section">
          <Bell />
        </section>
      </WorkspaceDashboard>
    </RoleDashboardGuard>
  );
}

function ParentNdpMetric({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="rounded-xl border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ds-color-muted)]">{label}</p>
      <p className="mt-1 text-xl font-black text-[var(--ds-color-ink)]">{value == null ? "--" : `${value}%`}</p>
    </div>
  );
}

function ParentNdpEntry({ entry }: { entry: NdpManualEntry }) {
  return (
    <article className="rounded-xl border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ds-color-primary)]">{entry.category.replaceAll("_", " ")}</p>
          <h3 className="mt-2 text-base font-black text-[var(--ds-color-ink)]">{entry.subject || entry.item}</h3>
        </div>
        <span className="rounded-full border border-[var(--ds-color-border)] bg-white px-3 py-1 text-xs font-black">{entry.score == null ? "--" : `${entry.score}%`}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black">
        <span>Term 1: {entry.term1 || "--"}</span>
        <span>Term 2: {entry.term2 || "--"}</span>
        <span>Term 3: {entry.term3 || "--"}</span>
      </div>
      <p className="mt-3 text-sm font-black text-[var(--ds-color-ink)]">{entry.rating || "Not rated"}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--ds-color-muted)]">{entry.remarks || "No teacher remark added."}</p>
    </article>
  );
}
