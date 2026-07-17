"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarCheck, ClipboardList, FileText, Library, MonitorPlay, Users } from "lucide-react";
import { AcademicEngineRoleActions } from "@/components/academy/academic-engine-workspace";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { WorkflowOsWorkspace, workflowIcons } from "@/components/workflow/workflow-os-workspace";
import { getAcademyToday } from "@/services/academy";

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskHref(task?: { batchId?: string | null } | null) {
  if (!task?.batchId) return "/dashboard/teacher/classes";
  return `/dashboard/teacher/classes/assigned-program/${task.batchId}`;
}

export default function TeacherDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["teacher", "starter-today"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const nextTask = today?.nextUpcomingTask ?? today?.todayTasks.find((task) => !task.done) ?? today?.upcomingTasks[0] ?? null;
  const remaining = today?.todayTasks.filter((task) => !task.done).length ?? 0;
  const pendingEvaluation = today?.todayTasks.filter((task) => !task.done && String(task.type || "").toUpperCase().includes("EXAM")).length ?? 0;

  return (
    <WorkspaceDashboard
      roleTitle="Teacher Workspace"
      greeting="Today's Classes"
      subtitle="Open class, mark attendance, assign homework, evaluate pending work and share resources."
      focus={[
        {
          label: "Next Class",
          title: nextTask ? nextTask.batchName || "Assigned class" : "No class assigned",
          detail: nextTask ? `${displayTime(nextTask.time)}${nextTask.endTime ? ` to ${displayTime(nextTask.endTime)}` : ""} / ${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "Your next class appears here when the timetable is published.",
          href: taskHref(nextTask),
          icon: MonitorPlay,
          tone: nextTask ? "info" : "default",
        },
        {
          label: "Attendance",
          title: `${remaining} remaining`,
          detail: "Finish today's class completion and attendance work.",
          href: "/dashboard/teacher/attendance?action=mark-attendance",
          icon: CalendarCheck,
          tone: remaining ? "warning" : "success",
        },
        {
          label: "Homework",
          title: "Assignments",
          detail: "Create homework, check submissions and publish student work.",
          href: "/dashboard/teacher/assignments",
          icon: ClipboardList,
          tone: "info",
        },
      ]}
      actions={[
        { label: "Open Class", href: taskHref(nextTask), icon: MonitorPlay },
        { label: "Mark Attendance", href: "/dashboard/teacher/attendance?action=mark-attendance", icon: CalendarCheck },
        { label: "Give Homework", href: "/dashboard/teacher/assignments", icon: ClipboardList },
        { label: "Evaluate Exams", href: "/dashboard/teacher/exams", icon: FileText },
        { label: "Upload Resource", href: "/dashboard/teacher/library?action=upload-lesson", icon: Library },
        { label: "View Students", href: "/dashboard/teacher/students", icon: Users },
      ]}
      metrics={[
        { label: "Classes Today", value: todayQuery.isLoading ? "..." : today?.todayTasks.length ?? 0 },
        { label: "Remaining", value: todayQuery.isLoading ? "..." : remaining, tone: remaining ? "warning" : "success" },
        { label: "Upcoming", value: todayQuery.isLoading ? "..." : today?.upcomingTasks.length ?? 0 },
        { label: "Pending Evaluation", value: todayQuery.isLoading ? "..." : pendingEvaluation },
      ]}
      activity={(today?.todayTasks ?? []).slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Class task",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: task.done ? "Done" : displayTime(task.time),
      }))}
      upcoming={(today?.upcomingTasks ?? []).slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Upcoming class",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: displayTime(task.time),
      }))}
    >
      <section>
        <p className="ds-text-label mb-3 text-[var(--ds-color-primary)]">Daily Academic Flow</p>
        <AcademicEngineRoleActions role="TEACHER" />
      </section>
      <WorkflowOsWorkspace
        title="Teacher Workflow"
        description="Today's tasks, attendance reminder, lesson reminder, assignment reminder and quiz reminder are organized from the existing teacher academic workflow."
        metrics={[
          { label: "Today's Tasks", value: todayQuery.isLoading ? "..." : today?.todayTasks.length ?? 0, note: "Loaded from Academy Today", tone: "info" },
          { label: "Attendance Reminder", value: remaining, note: "Remaining class workflow items", tone: remaining ? "warning" : "success" },
          { label: "Assignment Reminder", value: "Ready", note: "Publish and review through assignments", tone: "info" },
          { label: "Quiz Reminder", value: pendingEvaluation, note: "Exam/evaluation tasks visible today", tone: pendingEvaluation ? "warning" : "success" },
        ]}
        approvals={[
          { title: "Complete lesson workflow", detail: nextTask ? `${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "No active lesson reminder is visible.", href: taskHref(nextTask), icon: workflowIcons.task, tone: nextTask ? "warning" : "success" },
          { title: "Attendance lock", detail: `${remaining} task(s) remain before the day is fully closed.`, href: "/dashboard/teacher/attendance?action=mark-attendance", icon: workflowIcons.reminder, tone: remaining ? "warning" : "success" },
          { title: "Assignment and quiz follow-up", detail: "Homework and quiz workflows continue in existing teacher modules.", href: "/dashboard/teacher/assignments", icon: workflowIcons.assignment, tone: "info" },
        ]}
        recent={(today?.todayTasks ?? []).slice(0, 3).map((task) => ({
          title: task.title || task.batchName || "Teacher task",
          detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Workflow pending"}`,
          href: taskHref(task),
          icon: task.done ? workflowIcons.approval : workflowIcons.task,
          tone: task.done ? "success" : "warning",
        }))}
      />
    </WorkspaceDashboard>
  );
}
