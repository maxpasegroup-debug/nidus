"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  Users,
} from "lucide-react";

import {
  assignTeacherToBatch,
  createAcademicCalendarItem,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  getAssignmentSummary,
  getAttendanceSummary,
  getExamSummary,
  getMaterialSummary,
  getSyllabusSummary,
  reviewStudyMaterial,
} from "@/services/academy";

const hodServices = [
  {
    title: "Programs & Courses",
    text: "Manage course structure and academic program flow.",
    href: "#batches",
    icon: BookOpen,
  },
  {
    title: "Batches",
    text: "Create and organize offline, online, crash and foundation batches.",
    href: "#batches",
    icon: GraduationCap,
  },
  {
    title: "Timetable Planner",
    text: "Prepare class schedules and academic calendars.",
    href: "#calendar",
    icon: CalendarDays,
  },
  {
    title: "Teacher Allocation",
    text: "Assign subject teachers and trainers to batches.",
    href: "#teacher-allocation",
    icon: Users,
  },
  {
    title: "Syllabus Tracker",
    text: "Track topic completion with green, orange and red progress states.",
    href: "#tracker",
    icon: BarChart3,
  },
  {
    title: "Exams & Tests",
    text: "Plan, approve, publish and monitor academic tests.",
    href: "#exams",
    icon: ClipboardCheck,
  },
  {
    title: "Study Materials",
    text: "Control notes, recorded classes and batch library materials.",
    href: "#materials",
    icon: Library,
  },
  {
    title: "Student Progress",
    text: "Review batch-wise and student-wise academic performance.",
    href: "#progress",
    icon: FileText,
  },
];

export default function AcademicHeadDashboardPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [allocation, setAllocation] = useState({ batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
  const [calendarForm, setCalendarForm] = useState({
    batchId: "",
    subject: "",
    topic: "",
    plannedDate: "",
    startTime: "",
    endTime: "",
    teacherId: "",
  });
  const batchesQuery = useQuery({
    queryKey: ["academy", "batches", "hod"],
    queryFn: () => getAcademyBatches(),
  });
  const teachersQuery = useQuery({
    queryKey: ["academy", "teachers", "hod"],
    queryFn: () => getAcademyTeachers(),
  });
  const calendarQuery = useQuery({
    queryKey: ["academy", "calendar", "hod"],
    queryFn: () => getAcademicCalendar(),
  });
  const attendanceQuery = useQuery({
    queryKey: ["academy", "attendance-summary", "hod"],
    queryFn: () => getAttendanceSummary(),
  });
  const assignmentQuery = useQuery({
    queryKey: ["academy", "assignment-summary", "hod"],
    queryFn: () => getAssignmentSummary(),
  });
  const materialQuery = useQuery({
    queryKey: ["academy", "material-summary", "hod"],
    queryFn: () => getMaterialSummary(),
  });
  const examQuery = useQuery({
    queryKey: ["academy", "exam-summary", "hod"],
    queryFn: () => getExamSummary(),
  });
  const syllabusQuery = useQuery({
    queryKey: ["academy", "syllabus-summary", "hod"],
    queryFn: () => getSyllabusSummary(),
  });
  const summary = attendanceQuery.data?.summary;
  const assignmentSummary = assignmentQuery.data?.summary;
  const materialSummary = materialQuery.data?.summary;
  const examSummary = examQuery.data?.summary;
  const syllabusSummary = syllabusQuery.data?.summary;
  const syllabusBatches = syllabusQuery.data?.batches ?? [];
  const batches = batchesQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const sessions = useMemo(() => attendanceQuery.data?.attendance ?? [], [attendanceQuery.data?.attendance]);
  const assignments = useMemo(() => assignmentQuery.data?.assignments ?? [], [assignmentQuery.data?.assignments]);
  const materials = useMemo(() => materialQuery.data?.materials ?? [], [materialQuery.data?.materials]);
  const exams = useMemo(() => examQuery.data?.exams ?? [], [examQuery.data?.exams]);
  const progress = useMemo(() => syllabusQuery.data?.progress ?? [], [syllabusQuery.data?.progress]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const riskBatches = [...(summary?.batches ?? [])].sort((a, b) => a.percentage - b.percentage).slice(0, 5);
  const selectedBatch = batches.find((batch) => batch.id === allocation.batchId || batch.id === calendarForm.batchId);
  const selectedTeacher = teachers.find((teacher) => teacher.id === allocation.teacherId || teacher.id === calendarForm.teacherId);
  const teacherReports = useMemo(() => {
    const reports = new Map<string, { id: string; name: string; sessions: number; exams: number; materials: number; topics: number }>();
    for (const teacher of teachers) reports.set(teacher.id, { id: teacher.id, name: teacher.name, sessions: 0, exams: 0, materials: 0, topics: 0 });
    for (const session of sessions) {
      const key = session.teacherId || session.teacherName || "unknown";
      const current = reports.get(key) ?? { id: key, name: session.teacherName || "Teacher", sessions: 0, exams: 0, materials: 0, topics: 0 };
      current.sessions += 1;
      reports.set(key, current);
    }
    for (const exam of exams) {
      const key = exam.teacherId || exam.teacherName || "unknown";
      const current = reports.get(key) ?? { id: key, name: exam.teacherName || "Teacher", sessions: 0, exams: 0, materials: 0, topics: 0 };
      current.exams += 1;
      reports.set(key, current);
    }
    for (const material of materials) {
      const key = material.teacherId || material.teacherName || "unknown";
      const current = reports.get(key) ?? { id: key, name: material.teacherName || "Teacher", sessions: 0, exams: 0, materials: 0, topics: 0 };
      current.materials += 1;
      reports.set(key, current);
    }
    for (const item of progress) {
      const key = item.teacherId || item.teacherName || "unknown";
      const current = reports.get(key) ?? { id: key, name: item.teacherName || "Teacher", sessions: 0, exams: 0, materials: 0, topics: 0 };
      current.topics += 1;
      reports.set(key, current);
    }
    return Array.from(reports.values()).sort((a, b) => b.sessions + b.exams + b.materials + b.topics - (a.sessions + a.exams + a.materials + a.topics));
  }, [teachers, sessions, exams, materials, progress]);

  const refreshHod = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy"] });
  };

  const allocationMutation = useMutation({
    mutationFn: () => assignTeacherToBatch(allocation.batchId, { teacherId: allocation.teacherId, subject: allocation.subject, role: allocation.role }),
    onSuccess: () => {
      setNotice("Teacher allocation saved.");
      setAllocation({ batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
      refreshHod();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save teacher allocation."),
  });

  const calendarMutation = useMutation({
    mutationFn: () =>
      createAcademicCalendarItem({
        ...calendarForm,
        teacherId: calendarForm.teacherId || undefined,
        completionStatus: "PENDING",
        status: "PLANNED",
      }),
    onSuccess: () => {
      setNotice("Timetable item added.");
      setCalendarForm({ batchId: "", subject: "", topic: "", plannedDate: "", startTime: "", endTime: "", teacherId: "" });
      refreshHod();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not add timetable item."),
  });

  const materialReviewMutation = useMutation({
    mutationFn: ({ id, reviewStatus }: { id: string; reviewStatus: string }) => reviewStudyMaterial(id, { reviewStatus }),
    onSuccess: () => {
      setNotice("Material review saved.");
      refreshHod();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not review material."),
  });

  function submitAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allocation.batchId || !allocation.teacherId || !allocation.subject.trim()) {
      setNotice("Select batch, teacher and subject before saving allocation.");
      return;
    }
    allocationMutation.mutate();
  }

  function submitCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!calendarForm.batchId || !calendarForm.subject.trim() || !calendarForm.topic.trim() || !calendarForm.plannedDate) {
      setNotice("Batch, subject, topic and date are required for timetable planning.");
      return;
    }
    calendarMutation.mutate();
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section id="tracker" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">HOD Mode</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Academic Department Control</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Manage the academic department from one simple screen: courses, batches, timetable, teacher allocation,
                syllabus progress, exams, study materials and student progress.
              </p>
            </div>
            <Link
              href="/dashboard/teacher"
              className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-center text-sm font-black text-[var(--ink)] shadow"
            >
              Switch to Teaching Profile
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {hodServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className="group rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-xl font-black">{service.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{service.text}</p>
                <p className="mt-5 text-sm font-black text-[var(--gold-dark)]">Open control +</p>
              </Link>
            );
          })}
        </section>

        {notice ? (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-5 py-4 text-sm font-black text-[var(--ink)]">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div id="batches" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Batches</p>
                <h2 className="mt-2 text-3xl font-black">Active academic groups</h2>
              </div>
              <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                {batches.length} batch(es)
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {batches.slice(0, 6).map((batch) => (
                <div key={batch.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black">{batch.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {batch.batchType} / {batch.course?.title ?? batch.programSlug ?? "Program"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">
                      {batch._count?.students ?? batch.students?.length ?? 0} students / {batch._count?.teachers ?? batch.teachers?.length ?? 0} teachers
                    </span>
                  </div>
                </div>
              ))}
              {!batches.length ? <SoftBlock text="No academic batches are available yet." /> : null}
            </div>
          </div>

          <div id="teacher-allocation" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Teacher Allocation</p>
            <h2 className="mt-2 text-3xl font-black">Assign teacher to batch</h2>
            <form onSubmit={submitAllocation} className="mt-5 grid gap-3">
              <select
                value={allocation.batchId}
                onChange={(event) => setAllocation((value) => ({ ...value, batchId: event.target.value }))}
                className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-bold"
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
              <select
                value={allocation.teacherId}
                onChange={(event) => setAllocation((value) => ({ ...value, teacherId: event.target.value }))}
                className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-bold"
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={allocation.subject}
                  onChange={(event) => setAllocation((value) => ({ ...value, subject: event.target.value }))}
                  placeholder="Subject"
                  className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm"
                />
                <input
                  value={allocation.role}
                  onChange={(event) => setAllocation((value) => ({ ...value, role: event.target.value }))}
                  placeholder="Role"
                  className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={allocationMutation.isPending}
                className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow"
              >
                Save Allocation
              </button>
            </form>
            <p className="mt-4 text-sm text-[var(--muted)]">
              {selectedBatch?.name ?? "Batch"} / {selectedTeacher?.name ?? "Teacher"}
            </p>
          </div>
        </section>

        <section id="calendar" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Timetable</p>
              <h2 className="mt-2 text-3xl font-black">Plan daily syllabus calendar</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Create batch timetable items for teachers. Completion status will flow into the syllabus tracker after class.
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {calendar.length} planned
            </span>
          </div>

          <form onSubmit={submitCalendar} className="mt-6 grid gap-3 lg:grid-cols-3">
            <select
              value={calendarForm.batchId}
              onChange={(event) => setCalendarForm((value) => ({ ...value, batchId: event.target.value }))}
              className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-bold"
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
            <input value={calendarForm.subject} onChange={(event) => setCalendarForm((value) => ({ ...value, subject: event.target.value }))} placeholder="Subject" className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm" />
            <input value={calendarForm.topic} onChange={(event) => setCalendarForm((value) => ({ ...value, topic: event.target.value }))} placeholder="Topic" className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm" />
            <input type="date" value={calendarForm.plannedDate} onChange={(event) => setCalendarForm((value) => ({ ...value, plannedDate: event.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm" />
            <input type="time" value={calendarForm.startTime} onChange={(event) => setCalendarForm((value) => ({ ...value, startTime: event.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm" />
            <input type="time" value={calendarForm.endTime} onChange={(event) => setCalendarForm((value) => ({ ...value, endTime: event.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm" />
            <select
              value={calendarForm.teacherId}
              onChange={(event) => setCalendarForm((value) => ({ ...value, teacherId: event.target.value }))}
              className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-bold lg:col-span-2"
            >
              <option value="">Assign teacher later</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
            <button type="submit" disabled={calendarMutation.isPending} className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow">
              Add Timetable Item
            </button>
          </form>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {calendar.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{item.topic}</p>
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{item.completionStatus}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.batchName ?? "Batch"} / {item.subject} / {item.teacherName ?? "Teacher pending"}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">{new Date(item.plannedDate).toLocaleDateString()}</p>
              </div>
            ))}
            {!calendar.length ? <SoftBlock text="Timetable items will appear after planning." /> : null}
          </div>
        </section>

        <section id="exams" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Syllabus Tracker</p>
              <h2 className="mt-2 text-3xl font-black">Green, orange and red progress</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Teacher completion logs convert daily calendar execution into batch-wise syllabus status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void syllabusQuery.refetch()}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black"
            >
              Refresh Tracker
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Completion" value={`${syllabusSummary?.completionPercentage ?? 0}%`} />
            <AttendanceStat label="Green" value={syllabusSummary?.green ?? 0} />
            <AttendanceStat label="Orange" value={syllabusSummary?.orange ?? 0} />
            <AttendanceStat label="Red" value={syllabusSummary?.red ?? 0} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Batch progress</h3>
              <div className="mt-4 space-y-3">
                {syllabusBatches.slice(0, 5).map((batch) => (
                  <div key={batch.batchId ?? batch.batchName ?? "batch"} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{batch.batchName ?? "Batch"}</p>
                      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                        {batch.completionPercentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Green {batch.green} / Orange {batch.orange} / Red {batch.red}
                    </p>
                  </div>
                ))}
                {!syllabusBatches.length ? <SoftBlock text="Syllabus progress appears after teachers save completion logs." /> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Recent topic updates</h3>
              <div className="mt-4 space-y-3">
                {progress.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{item.topic}</p>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">
                        {item.progressColor}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.batchName ?? "Batch"} / {item.subject} / {item.teacherName ?? "Teacher"}
                    </p>
                  </div>
                ))}
                {!progress.length ? <SoftBlock text="Recent topic updates will appear after class logs are submitted." /> : null}
              </div>
            </div>
          </div>
        </section>

        <section id="materials" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Exam Approval</p>
              <h2 className="mt-2 text-3xl font-black">Teacher-created test monitor</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Tracks class tests published by teachers, student attempts and submitted scores.
              </p>
            </div>
            <Link href="/dashboard/director/exams" className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow">
              Open Exams
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Exams" value={examSummary?.exams ?? 0} />
            <AttendanceStat label="Live Tests" value={examSummary?.liveTests ?? 0} />
            <AttendanceStat label="Submitted" value={examSummary?.submitted ?? 0} />
            <AttendanceStat label="Avg Score" value={examSummary?.averageScore ?? 0} />
          </div>

          <div className="mt-6 grid gap-3">
            {exams.slice(0, 6).map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{exam.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {exam.batchName ?? "Batch"} / {exam.subject ?? "Subject"} / {exam.teacherName ?? "Teacher"}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {exam.attemptStats?.submitted ?? 0} submitted / avg {exam.attemptStats?.averageScore ?? 0}
                  </span>
                </div>
              </div>
            ))}
            {!exams.length ? <SoftBlock text="Teacher-created exams will appear after publication." /> : null}
          </div>
        </section>

        <section id="assignments" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Material Review</p>
              <h2 className="mt-2 text-3xl font-black">Study material quality control</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Review notes, links, recorded classes and files before they become the standard batch resource.
              </p>
            </div>
            <Link href="/dashboard/director/materials" className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--ink)] shadow">
              Open Materials
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Materials" value={materialSummary?.total ?? 0} />
            <AttendanceStat label="Pending Review" value={materialSummary?.pendingReview ?? 0} />
            <AttendanceStat label="Approved" value={materialSummary?.approved ?? 0} />
            <AttendanceStat label="Links / Files" value={`${materialSummary?.links ?? 0}/${materialSummary?.files ?? 0}`} />
          </div>

          <div className="mt-6 grid gap-3">
            {materials.slice(0, 6).map((material) => (
              <div key={material.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{material.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {material.batchName ?? "Batch"} / {material.subject ?? "Subject"} / {material.type}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {material.reviewStatus ?? "PENDING_REVIEW"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => materialReviewMutation.mutate({ id: material.id, reviewStatus: "APPROVED" })}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => materialReviewMutation.mutate({ id: material.id, reviewStatus: "REJECTED" })}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {!materials.length ? <SoftBlock text="Study materials will appear after teachers or Director publish resources." /> : null}
          </div>
        </section>

        <section id="attendance" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Assignment Monitor</p>
              <h2 className="mt-2 text-3xl font-black">Submitted versus pending</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Tracks teacher-published assignments and student submissions across active batches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void assignmentQuery.refetch()}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black"
            >
              Refresh Assignments
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Assignments" value={assignmentSummary?.assignments ?? 0} />
            <AttendanceStat label="Expected" value={assignmentSummary?.totalExpected ?? 0} />
            <AttendanceStat label="Submitted" value={assignmentSummary?.submitted ?? 0} />
            <AttendanceStat label="Pending" value={assignmentSummary?.pending ?? 0} />
          </div>

          <div className="mt-6 grid gap-3">
            {assignments.slice(0, 6).map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{assignment.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {assignment.batchName ?? "Batch"} / {assignment.subject ?? "Subject"}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    Submitted {assignment.submissionStats?.submitted ?? 0}/{assignment.submissionStats?.totalStudents ?? 0}
                  </span>
                </div>
              </div>
            ))}
            {!assignments.length ? <SoftBlock text="Assignment activity will appear after teachers publish assignments." /> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Attendance Monitor</p>
              <h2 className="mt-2 text-3xl font-black">Batch attendance control</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Live class attendance from teacher-marked sessions. Use this to catch low-attendance batches before it becomes an academic risk.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void attendanceQuery.refetch()}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black"
            >
              Refresh Attendance
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Overall" value={`${summary?.percentage ?? 0}%`} />
            <AttendanceStat label="Sessions" value={summary?.sessions ?? 0} />
            <AttendanceStat label="Present" value={summary?.present ?? 0} />
            <AttendanceStat label="Absent/Leave" value={(summary?.absent ?? 0) + (summary?.leave ?? 0)} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Batch risk view</h3>
              <div className="mt-4 space-y-3">
                {riskBatches.map((batch) => (
                  <div key={batch.batchId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{batch.batchName ?? "Batch"}</p>
                      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                        {batch.percentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {batch.sessions} sessions / Present {batch.present}/{batch.total}
                    </p>
                  </div>
                ))}
                {!riskBatches.length ? <SoftBlock text="No teacher attendance sessions have been marked yet." /> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Recent marked sessions</h3>
              <div className="mt-4 space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="font-black">{session.batchName ?? "Batch"} / {session.subject ?? "Subject"}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {new Date(session.date).toLocaleDateString()} by {session.teacherName ?? "Teacher"} / {session.records?.length ?? 0} records
                    </p>
                  </div>
                ))}
                {!sessions.length ? <SoftBlock text="Recent attendance will appear after teachers save class attendance." /> : null}
              </div>
            </div>
          </div>
        </section>

        <section id="progress" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Student Progress</p>
              <h2 className="mt-2 text-3xl font-black">Academic performance signals</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Combines attendance, assignment submissions and test attempts so the HOD can catch batch-level risk early.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <AttendanceStat label="Attendance" value={`${summary?.percentage ?? 0}%`} />
            <AttendanceStat label="Assignment Pending" value={assignmentSummary?.pending ?? 0} />
            <AttendanceStat label="Exam Submitted" value={examSummary?.submitted ?? 0} />
            <AttendanceStat label="Syllabus" value={`${syllabusSummary?.completionPercentage ?? 0}%`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Low attendance students</h3>
              <div className="mt-4 space-y-3">
                {[...(summary?.students ?? [])].sort((a, b) => a.percentage - b.percentage).slice(0, 6).map((student) => (
                  <div key={student.studentId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{student.studentName ?? "Student"}</p>
                      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                        {student.percentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Present {student.present}/{student.total}
                    </p>
                  </div>
                ))}
                {!summary?.students?.length ? <SoftBlock text="Student progress appears after attendance is marked." /> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <h3 className="text-xl font-black">Batch correction queue</h3>
              <div className="mt-4 space-y-3">
                {riskBatches.map((batch) => (
                  <div key={batch.batchId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{batch.batchName ?? "Batch"}</p>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">
                        {batch.percentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Attendance risk / {batch.sessions} marked session(s)
                    </p>
                  </div>
                ))}
                {!riskBatches.length ? <SoftBlock text="Batch correction queue appears after academic activity starts." /> : null}
              </div>
            </div>
          </div>
        </section>

        <section id="teacher-reports" className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Teacher Reports</p>
              <h2 className="mt-2 text-3xl font-black">Teacher activity history</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
                Tracks class execution, exams, materials and syllabus updates per teacher from real activity records.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {teacherReports.slice(0, 8).map((teacher) => (
              <div key={teacher.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="font-black">{teacher.name}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-black text-[var(--muted)]">
                    <span>{teacher.sessions} sessions</span>
                    <span>{teacher.topics} topics</span>
                    <span>{teacher.exams} exams</span>
                    <span>{teacher.materials} materials</span>
                  </div>
                </div>
              </div>
            ))}
            {!teacherReports.length ? <SoftBlock text="Teacher reports appear after allocation and classroom activity." /> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--gold-dark)]">Department Rule</p>
          <h2 className="mt-2 text-3xl font-black">HOD plans. Teachers execute.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">
            The Academic Head prepares batches, timetable, teacher allocation and academic progress rules here. Teachers
            see only their assigned classes in the Teaching Profile and can teach, mark attendance, upload materials,
            publish assignments and create exams from those assigned classes.
          </p>
        </section>
      </div>
    </main>
  );
}

function AttendanceStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--gold-dark)]">{value}</p>
    </div>
  );
}

function SoftBlock({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">{text}</div>;
}
