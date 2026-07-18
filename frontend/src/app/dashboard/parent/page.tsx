"use client";

import { Bell, CalendarDays, ClipboardList, CreditCard, GraduationCap, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { RoleDashboardGuard, DashboardError, DashboardSkeleton } from "@/components/dashboard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { useParentDashboard } from "@/hooks/use-dashboard";

export default function ParentDashboardPage() {
  const dashboard = useParentDashboard();
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
