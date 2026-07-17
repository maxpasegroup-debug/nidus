"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeIndianRupee, BarChart3, CalendarDays, GraduationCap, ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { AiOperatingLayer } from "@/components/ai/ai-operating-layer";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { WorkflowOsWorkspace, workflowIcons } from "@/components/workflow/workflow-os-workspace";
import { getDirectorDashboard } from "@/services/dashboard";

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "control-panel"], queryFn: getDirectorDashboard });
  const commandCenter = directorQuery.data?.commandCenter;
  const pendingAdmissions = commandCenter?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingFees = commandCenter?.operationalAlerts.pendingFees ?? 0;
  const activeStudents = commandCenter?.students.active ?? directorQuery.data?.instituteAnalytics.students ?? 0;
  const facultyCount =
    (commandCenter?.staff?.academicHeads.active ?? 0) +
    (commandCenter?.staff?.teachers.active ?? 0) +
    (commandCenter?.staff?.physicalTrainers.active ?? 0);
  const staffCount =
    facultyCount +
    (commandCenter?.staff?.administrativeOfficers.active ?? 0) +
    (commandCenter?.staff?.businessDevelopmentExecutives.active ?? 0);

  return (
    <WorkspaceDashboard
      roleTitle="Director Workspace"
      greeting="Today's Academy"
      subtitle="Admissions, revenue, faculty status, planner progress and alerts in one calm command view."
      focus={[
        {
          label: "Admissions",
          title: pendingAdmissions ? `${pendingAdmissions} pending` : "Admissions clear",
          detail: "Review admission activations and handovers from the admission cell.",
          href: "/dashboard/director/admissions",
          icon: UserPlus,
          tone: pendingAdmissions ? "warning" : "success",
        },
        {
          label: "Revenue",
          title: pendingFees ? `${pendingFees} dues` : "No fee alerts",
          detail: "Open receipts, pending fees and finance reports.",
          href: "/dashboard/director/accounts",
          icon: BadgeIndianRupee,
          tone: pendingFees ? "warning" : "success",
        },
        {
          label: "Planner",
          title: "Academic progress",
          detail: "Check programs, timetable, batches, syllabus and teacher allocation.",
          href: "/dashboard/director/academic",
          icon: GraduationCap,
          tone: "info",
        },
      ]}
      actions={[
        { label: "Open Academics", href: "/dashboard/director/academic", icon: GraduationCap },
        { label: "Admissions", href: "/dashboard/director/admissions", icon: UserPlus },
        { label: "Admin & HR", href: "/dashboard/director/management", icon: Users },
        { label: "Accounts", href: "/dashboard/director/accounts", icon: BadgeIndianRupee },
        { label: "Reports", href: "/dashboard/director/reports", icon: BarChart3 },
        { label: "Settings", href: "/dashboard/settings", icon: ShieldCheck },
      ]}
      metrics={[
        { label: "Active Students", value: directorQuery.isLoading ? "..." : activeStudents },
        { label: "Faculty", value: directorQuery.isLoading ? "..." : facultyCount },
        { label: "Staff", value: directorQuery.isLoading ? "..." : staffCount },
        { label: "Fee Alerts", value: directorQuery.isLoading ? "..." : pendingFees, tone: pendingFees ? "warning" : "success" },
      ]}
      activity={[
        { title: "Academics workspace", detail: "Programs, batches, timetable and planner controls.", href: "/dashboard/director/academic", meta: "Today" },
        { title: "Admissions workspace", detail: `${pendingAdmissions} admission item(s) need review.`, href: "/dashboard/director/admissions", meta: "Admissions" },
        { title: "Finance workspace", detail: `${pendingFees} fee item(s) are open.`, href: "/dashboard/director/accounts", meta: "Accounts" },
      ]}
      upcoming={[
        { title: "Academic reports", detail: "Review student progress, teacher performance and syllabus movement.", href: "/dashboard/director/reports", meta: "Reports" },
        { title: "Faculty status", detail: "Check academic heads, teachers and resource allocation.", href: "/dashboard/director/management", meta: "HR" },
        { title: "Alerts", detail: "Open notifications and academy messages.", href: "/dashboard/director/notifications", meta: "Alerts" },
      ]}
    >
      <AiOperatingLayer
        role="DIRECTOR"
        items={[
          {
            title: pendingAdmissions ? `${pendingAdmissions} admissions need attention` : "Admissions are calm",
            detail: "AI attention signal from the existing Director command-center admission queue.",
            href: "/dashboard/director/admissions",
            icon: UserPlus,
            tone: pendingAdmissions ? "warning" : "success",
          },
          {
            title: pendingFees ? `${pendingFees} fee risk item(s)` : "Revenue risk is low",
            detail: "Revenue forecast and fee alerts stay inside the Director workspace.",
            href: "/dashboard/director/accounts",
            icon: BadgeIndianRupee,
            tone: pendingFees ? "warning" : "success",
          },
          {
            title: "Faculty support watch",
            detail: `${facultyCount} faculty member(s) are part of the current academic operating signal.`,
            href: "/dashboard/director/academic/teacher-performance",
            icon: Users,
            tone: "info",
          },
        ]}
      />
      <WorkflowOsWorkspace
        title="Director Workflow Health"
        description="Approvals, automations, failed jobs, notifications, activity and operational queues are surfaced from existing workflows so the academy feels proactive."
        metrics={[
          { label: "Pending Approvals", value: pendingAdmissions, note: "Admission and activation items", tone: pendingAdmissions ? "warning" : "success" },
          { label: "Automation Status", value: "Active", note: "Existing admission, academic, payment and notification flows", tone: "success" },
          { label: "Notification Statistics", value: "Connected", note: "Dashboard, push, email and CRM reminder channels", tone: "info" },
          { label: "Operational Risks", value: pendingFees, note: "Fee and finance workflow alerts", tone: pendingFees ? "warning" : "success" },
        ]}
        approvals={[
          { title: "Admission approval queue", detail: `${pendingAdmissions} admission item(s) may need review or activation.`, href: "/dashboard/director/admissions", icon: workflowIcons.approval, tone: pendingAdmissions ? "warning" : "success" },
          { title: "Fee received workflow", detail: `${pendingFees} pending fee item(s) need collection or receipt follow-up.`, href: "/dashboard/director/accounts", icon: workflowIcons.fee, tone: pendingFees ? "warning" : "success" },
          { title: "System activity", detail: "Open admin operations to review queue health, failed jobs and audit history.", href: "/admin-center/operations", icon: workflowIcons.automation, tone: "info" },
        ]}
        recent={[
          { title: "Admission to student activation", detail: "Approval, batch assignment, profile creation and welcome notification remain in the current admission flow.", href: "/dashboard/admission-cell#activation", icon: workflowIcons.task, tone: "success" },
          { title: "Academic workflow", detail: "Lesson, attendance, homework, quiz and progress updates remain inside the academic engine.", href: "/dashboard/director/academic", icon: workflowIcons.assignment, tone: "info" },
          { title: "Notification center", detail: "Announcements and push notifications remain in the existing notification pages.", href: "/dashboard/director/notifications", icon: workflowIcons.notification, tone: "info" },
        ]}
      />
    </WorkspaceDashboard>
  );
}
