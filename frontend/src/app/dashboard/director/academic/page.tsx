"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileArchive,
  GraduationCap,
  PieChart,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "./_components";
import {
  getAcademicCalendar,
  getAcademicCalendarMonitor,
  getAcademyBatches,
  getAcademyTeachers,
  getAssignmentSummary,
  getExamSummary,
  getMaterialSummary,
  getStudentProgressSummary,
  getSyllabusSummary,
  getTeacherPerformanceSummary,
} from "@/services/academy";

type AcademicModule = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
};

const modules: AcademicModule[] = [
  {
    title: "Programs & Courses",
    text: "View offline and online academy programs. Add new courses from one simple page.",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
  },
  {
    title: "Batches",
    text: "Create and manage active academy batches.",
    href: "/dashboard/director/academic/batches",
    icon: Users,
  },
  {
    title: "Teachers",
    text: "Add teachers, trainers, heads and allocate subjects.",
    href: "/dashboard/director/academic/teachers",
    icon: UserCheck,
  },
  {
    title: "Timetable",
    text: "Plan daily classes and teacher schedules.",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
  },
  {
    title: "Syllabus",
    text: "Track completion with green, orange and red signals.",
    href: "/dashboard/director/academic/syllabus",
    icon: BarChart3,
  },
  {
    title: "Exams & Tests",
    text: "Create, approve, publish and monitor exams.",
    href: "/dashboard/director/exams",
    icon: ClipboardCheck,
  },
  {
    title: "Study Materials",
    text: "Control notes, recorded classes and batch library.",
    href: "/dashboard/director/materials",
    icon: FileArchive,
  },
  {
    title: "Reports",
    text: "Attendance, assignments, exams, materials and academic health.",
    href: "/dashboard/director/academic/reports",
    icon: ClipboardCheck,
  },
  {
    title: "Student Progress",
    text: "Review batch health and risk students.",
    href: "/dashboard/director/academic/student-progress",
    icon: PieChart,
  },
  {
    title: "Teacher Performance",
    text: "Monitor teaching quality and delivery.",
    href: "/dashboard/director/academic/teacher-performance",
    icon: UserCheck,
  },
  {
    title: "Calendar Monitor",
    text: "Track class execution and syllabus completion.",
    href: "/dashboard/director/academic/calendar-monitor",
    icon: CalendarCheck,
  },
];

export default function DirectorAcademicDepartmentPage() {
  const batchesQuery = useQuery({ queryKey: ["director", "academic", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["director", "academic", "teachers"], queryFn: getAcademyTeachers });
  const calendarQuery = useQuery({ queryKey: ["director", "academic", "calendar"], queryFn: () => getAcademicCalendar() });
  const calendarMonitorQuery = useQuery({ queryKey: ["director", "academic", "calendar-monitor"], queryFn: getAcademicCalendarMonitor });
  const teacherPerformanceQuery = useQuery({ queryKey: ["director", "academic", "teacher-performance"], queryFn: getTeacherPerformanceSummary });
  const studentProgressQuery = useQuery({ queryKey: ["director", "academic", "student-progress"], queryFn: getStudentProgressSummary });
  const syllabusQuery = useQuery({ queryKey: ["director", "academic", "syllabus"], queryFn: () => getSyllabusSummary() });
  const assignmentQuery = useQuery({ queryKey: ["director", "academic", "assignments"], queryFn: () => getAssignmentSummary() });
  const examQuery = useQuery({ queryKey: ["director", "academic", "exams"], queryFn: () => getExamSummary() });
  const materialQuery = useQuery({ queryKey: ["director", "academic", "materials"], queryFn: () => getMaterialSummary() });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendarItems = calendarQuery.data ?? [];
  const monitorItems = calendarMonitorQuery.data?.items ?? [];
  const teacherCards = teacherPerformanceQuery.data?.teachers ?? [];
  const batchHealth = studentProgressQuery.data?.batches ?? [];
  const syllabus = syllabusQuery.data?.summary;
  const assignments = assignmentQuery.data?.summary;
  const exams = examQuery.data?.summary;
  const materials = materialQuery.data?.summary;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayClasses = useMemo(
    () =>
      calendarItems
        .filter((item) => item.plannedDate?.slice(0, 10) === todayKey)
        .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
    [calendarItems, todayKey],
  );
  const activeBatches = batches.filter((batch) => batch.status === "ACTIVE");
  const pendingClasses = monitorItems.reduce((total, item) => total + item.missedClasses + item.delayedClasses, 0);
  const attentionBatches = batchHealth.filter((batch) => batch.overallStatus !== "Healthy").slice(0, 6);
  const teachersNeedingFollowup = teacherCards.filter((teacher) => teacher.status !== "GREEN").slice(0, 6);
  const isLoading =
    batchesQuery.isLoading ||
    teachersQuery.isLoading ||
    calendarQuery.isLoading ||
    teacherPerformanceQuery.isLoading ||
    studentProgressQuery.isLoading ||
    syllabusQuery.isLoading;

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Academic Command"
        title="See whether teaching is actually happening."
        description="Director view for batches, classes, timetable, teacher allocation, syllabus, exams, assignments, library and academic health."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black text-[var(--navy)]" href="/dashboard/director/academic/timetable">
              Plan Timetable
            </Link>
            <Link className="rounded-2xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--navy)]" href="/dashboard/director/academic/teachers">
              Allocate Teachers
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Active Batches" value={isLoading ? "..." : activeBatches.length} />
        <StatCard label="Faculty" value={isLoading ? "..." : teachers.length} />
        <StatCard label="Classes Today" value={calendarQuery.isLoading ? "..." : todayClasses.length} />
        <StatCard label="Pending Class Issues" value={calendarMonitorQuery.isLoading ? "..." : pendingClasses} />
        <StatCard label="Syllabus" value={syllabusQuery.isLoading ? "..." : `${syllabus?.completionPercentage ?? 0}%`} />
        <StatCard label="Library Items" value={materialQuery.isLoading ? "..." : materials?.total ?? 0} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="Today" title="Today’s academic operations">
          <div className="space-y-3">
            {todayClasses.slice(0, 8).map((item) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                <div className="text-xl font-black">{item.startTime || "Time"}</div>
                <div>
                  <p className="text-lg font-black">{item.subject}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.batchName} / {item.topic || "Topic pending"}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--navy)]">Teacher: {item.teacherName || "Teacher pending"}</p>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{item.status}</span>
              </div>
            ))}
            {!todayClasses.length ? <EmptyState text="No classes are scheduled for today in the academic calendar." /> : null}
          </div>
        </Panel>

        <Panel eyebrow="Academic Attention" title="What needs follow-up">
          <div className="space-y-3">
            <AttentionRow label="Delayed / missed classes" value={pendingClasses} href="/dashboard/director/academic/calendar-monitor" />
            <AttentionRow label="Assignments pending" value={assignments?.pending ?? 0} href="/dashboard/director/academic/reports" />
            <AttentionRow label="Exam average" value={`${exams?.averageScore ?? 0}%`} href="/dashboard/director/exams" />
            <AttentionRow label="Syllabus red items" value={syllabus?.red ?? 0} href="/dashboard/director/academic/syllabus" />
            <AttentionRow label="Materials pending review" value={materials?.pendingReview ?? 0} href="/dashboard/director/materials" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel eyebrow="Batch Health" title="Batches needing attention">
          <div className="space-y-3">
            {attentionBatches.map((batch) => (
              <Link key={batch.batchId} href="/dashboard/director/academic/student-progress" className="block rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-[var(--gold-border)] hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{batch.batchName}</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{batch.overallStatus}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--muted-blue)] sm:grid-cols-3">
                  <span>Attendance {batch.attendancePercentage ?? 0}%</span>
                  <span>Assignments {batch.assignmentCompletionPercentage ?? 0}%</span>
                  <span>Exam {batch.examAveragePercentage ?? 0}%</span>
                </div>
              </Link>
            ))}
            {!attentionBatches.length ? <EmptyState text="No batch is currently flagged for academic attention." /> : null}
          </div>
        </Panel>

        <Panel eyebrow="Faculty Delivery" title="Teachers needing follow-up">
          <div className="space-y-3">
            {teachersNeedingFollowup.map((teacher) => (
              <Link key={teacher.teacherId} href="/dashboard/director/academic/teacher-performance" className="block rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-[var(--gold-border)] hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{teacher.teacherName}</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{teacher.status}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--muted-blue)] sm:grid-cols-3">
                  <span>Classes {teacher.classesConducted}</span>
                  <span>Syllabus {teacher.syllabusCompletionPercentage ?? 0}%</span>
                  <span>Attendance {teacher.attendanceMarkingPercentage ?? 0}%</span>
                </div>
              </Link>
            ))}
            {!teachersNeedingFollowup.length ? <EmptyState text="No teacher is currently flagged for follow-up." /> : null}
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Controls" title="Academic workspaces">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.title}
                className="group rounded-3xl border border-[var(--border)] bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
                href={module.href}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-7 w-7 text-[var(--navy)]" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-[var(--navy)]">{module.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">{module.text}</p>
                <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open page +</span>
              </Link>
            );
          })}
        </section>
      </Panel>
    </AcademicShell>
  );
}

function AttentionRow({ label, value, href }: { label: string; value: string | number; href: string }) {
  const active = typeof value === "number" ? value > 0 : value !== "0%" && value !== "0";
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 transition hover:border-[var(--gold-border)] hover:bg-white">
      <span className="font-black">{label}</span>
      <span className={active ? "rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800" : "rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800"}>{value}</span>
    </Link>
  );
}
