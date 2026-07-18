"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CalendarClock, ClipboardCheck, GraduationCap, ListChecks, Users } from "lucide-react";
import { AcademicEngineRoleActions } from "@/components/academy/academic-engine-workspace";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { getAcademyToday, type AcademyTodayTask } from "@/services/academy";

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskHref(task?: AcademyTodayTask | null) {
  if (!task?.batchId) return "/dashboard/academic-head/hod/timetable";
  return `/dashboard/academic-head/classes/assigned-program/${task.batchId}`;
}

export default function AcademicHeadDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["academic-head", "simple-dashboard"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const tasks = today?.todayTasks ?? [];
  const upcoming = today?.upcomingTasks ?? [];
  const nextTask = today?.nextUpcomingTask ?? tasks.find((task) => !task.done) ?? upcoming[0] ?? null;
  const pending = tasks.filter((task) => !task.done);
  const pendingReviews = today?.diagnostics.pendingAssignmentReviews ?? 0;
  const pendingExamReviews = today?.diagnostics.pendingExamReviews ?? 0;
  const attendancePending = today?.diagnostics.attendancePendingCount ?? 0;

  return (
    <WorkspaceDashboard
      roleTitle="Academic Head Workspace"
      greeting="Today's Classes"
      subtitle="Planner progress, faculty status and pending reviews in one simple academic view."
      focus={[
        {
          label: "Classes",
          title: nextTask ? nextTask.batchName || "Class pending" : "No class pending",
          detail: nextTask ? `${displayTime(nextTask.time)} / ${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "Published timetable tasks will appear here.",
          href: taskHref(nextTask),
          icon: CalendarClock,
          tone: nextTask ? "info" : "success",
        },
        {
          label: "Reviews",
          title: `${pendingReviews + pendingExamReviews} pending`,
          detail: "Assignments and exams waiting for academic review.",
          href: "/dashboard/academic-head/hod/approvals",
          icon: ClipboardCheck,
          tone: pendingReviews + pendingExamReviews ? "warning" : "success",
        },
        {
          label: "Planner",
          title: `${pending.length} open task(s)`,
          detail: "Check timetable, syllabus progress and weak batches.",
          href: "/dashboard/academic-head/hod/timetable",
          icon: BookOpenCheck,
          tone: pending.length ? "warning" : "success",
        },
      ]}
      actions={[
        { label: "Open Planner", href: "/dashboard/academic-head/hod/timetable", icon: BookOpenCheck },
        { label: "My Classes", href: "/dashboard/academic-head/my-classes", icon: CalendarClock },
        { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users },
        { label: "Students", href: "/dashboard/academic-head/students", icon: GraduationCap },
        { label: "Reviews", href: "/dashboard/academic-head/hod/approvals", icon: ClipboardCheck },
        { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: ListChecks },
      ]}
      metrics={[
        { label: "Classes Today", value: todayQuery.isLoading ? "..." : tasks.length },
        { label: "Open Tasks", value: todayQuery.isLoading ? "..." : pending.length, tone: pending.length ? "warning" : "success" },
        { label: "Attendance Pending", value: todayQuery.isLoading ? "..." : attendancePending, tone: attendancePending ? "warning" : "success" },
        { label: "Reviews", value: todayQuery.isLoading ? "..." : pendingReviews + pendingExamReviews, tone: pendingReviews + pendingExamReviews ? "warning" : "success" },
      ]}
      activity={tasks.slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Academic task",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: task.done ? "Done" : displayTime(task.time),
      }))}
      upcoming={upcoming.slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Upcoming class",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: displayTime(task.time),
      }))}
    >
      <section>
        <p className="ds-text-label mb-3 text-[var(--ds-color-primary)]">Academic Flow</p>
        <AcademicEngineRoleActions role="ACADEMIC_HEAD" />
      </section>
    </WorkspaceDashboard>
  );
}
