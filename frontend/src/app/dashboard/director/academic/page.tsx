"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  PauseCircle,
  PlayCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  assignTeacherToBatch,
  createAcademyBatch,
  createAcademicCalendarItem,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  getAssignmentSummary,
  getAttendanceSummary,
  getExamSummary,
  getMaterialSummary,
  getSyllabusSummary,
  updateAcademyBatch,
  updateAcademicCalendarItem,
  type AcademyBatch,
  type AcademicCalendarItem,
} from "@/services/academy";
import { academyProgramGroups } from "@/data/academy-programs";

const academicAreas = [
  { title: "Programs", text: "Create and manage course structure", icon: GraduationCap },
  { title: "Batches", text: "Plan offline, online, crash and foundation groups", icon: CalendarDays },
  { title: "Teachers", text: "Allocate subjects and classroom responsibility", icon: Users },
  { title: "Timetable", text: "Build weekly schedule and class rhythm", icon: Clock },
  { title: "Syllabus", text: "Track completion with green, orange and red status", icon: BarChart3 },
  { title: "Reports", text: "Review progress before management decisions", icon: ClipboardCheck },
];

const batchTypes = ["OFFLINE", "ONLINE", "CRASH", "FOUNDATION", "TOPRANK", "GURU"] as const;
const completionOptions = [
  { label: "Green", value: "GREEN", helper: "On track", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { label: "Orange", value: "ORANGE", helper: "Needs attention", className: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "Red", value: "RED", helper: "Delayed", className: "bg-rose-50 text-rose-800 border-rose-200" },
] as const;

export default function DirectorAcademicDepartmentPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [batchForm, setBatchForm] = useState({
    name: "",
    courseId: "",
    batchType: "OFFLINE",
    startDate: "",
    endDate: "",
  });
  const [allocation, setAllocation] = useState({
    batchId: "",
    teacherId: "",
    subject: "",
    role: "Subject Teacher",
  });
  const [calendarForm, setCalendarForm] = useState({
    batchId: "",
    subject: "",
    topic: "",
    plannedDate: "",
    startTime: "",
    endTime: "",
    teacherId: "",
  });
  const [selectedBatch, setSelectedBatch] = useState<AcademyBatch | null>(null);

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({ queryKey: ["academy", "academic-calendar"], queryFn: () => getAcademicCalendar() });
  const attendanceQuery = useQuery({ queryKey: ["academy", "attendance-summary"], queryFn: () => getAttendanceSummary() });
  const assignmentQuery = useQuery({ queryKey: ["academy", "assignment-summary"], queryFn: () => getAssignmentSummary() });
  const materialQuery = useQuery({ queryKey: ["academy", "material-summary"], queryFn: () => getMaterialSummary() });
  const examQuery = useQuery({ queryKey: ["academy", "exam-summary"], queryFn: () => getExamSummary() });
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary"], queryFn: () => getSyllabusSummary() });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendarItems = calendarQuery.data ?? [];
  const attendanceSummary = attendanceQuery.data?.summary;
  const assignmentSummary = assignmentQuery.data?.summary;
  const materialSummary = materialQuery.data?.summary;
  const examSummary = examQuery.data?.summary;
  const syllabusSummary = syllabusQuery.data?.summary;
  const allPrograms = academyProgramGroups.flatMap((group) => group.programs);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "teachers"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "attendance-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "assignment-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "material-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "exam-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "syllabus-summary"] });
  };

  const createBatchMutation = useMutation({
    mutationFn: createAcademyBatch,
    onSuccess: () => {
      setBatchForm({ name: "", courseId: "", batchType: "OFFLINE", startDate: "", endDate: "" });
      refresh();
      setNotice("Batch created. The batch is now ready for planning.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create batch."),
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ batchId, status }: { batchId: string; status: string }) => updateAcademyBatch(batchId, { status }),
    onSuccess: () => {
      refresh();
      setNotice("Batch status updated.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update batch."),
  });

  const assignTeacherMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: { teacherId: string; subject: string; role?: string } }) =>
      assignTeacherToBatch(batchId, payload),
    onSuccess: () => {
      setAllocation({ batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
      refresh();
      setNotice("Teacher allocated. The teacher can now see this batch in their dashboard.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not allocate teacher."),
  });

  const createCalendarMutation = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setCalendarForm({ batchId: "", subject: "", topic: "", plannedDate: "", startTime: "", endTime: "", teacherId: "" });
      refresh();
      setNotice("Calendar planned. The class plan is visible for teachers.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not plan calendar."),
  });

  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, completionStatus }: { id: string; completionStatus: string }) =>
      updateAcademicCalendarItem(id, { completionStatus }),
    onSuccess: () => {
      refresh();
      setNotice("Syllabus tracker updated.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update tracker."),
  });

  const submitBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createBatchMutation.mutate({
      name: batchForm.name,
      programSlug: batchForm.courseId || "academy-program",
      batchType: batchForm.batchType,
      startDate: batchForm.startDate || undefined,
      endDate: batchForm.endDate || undefined,
    });
  };

  const submitAllocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    assignTeacherMutation.mutate({
      batchId: allocation.batchId,
      payload: {
        teacherId: allocation.teacherId,
        subject: allocation.subject || "General",
        role: allocation.role || undefined,
      },
    });
  };

  const submitCalendar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCalendarMutation.mutate({
      batchId: calendarForm.batchId,
      subject: calendarForm.subject,
      topic: calendarForm.topic,
      plannedDate: calendarForm.plannedDate,
      startTime: calendarForm.startTime || undefined,
      endTime: calendarForm.endTime || undefined,
      teacherId: calendarForm.teacherId || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academic Department</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Director planning room</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                Create batches, allocate teachers, plan the academic calendar, and track syllabus completion before it reaches
                the classrooms.
              </p>
            </div>
            <button onClick={refresh} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-bold">
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Batches" value={batches.length} />
          <StatCard label="Teachers" value={teachers.length} />
          <StatCard label="Planned Classes" value={calendarItems.length} />
          <StatCard label="Active" value={batches.filter((batch) => batch.status === "ACTIVE").length} />
          <StatCard label="Attendance" value={`${attendanceSummary?.percentage ?? 0}%`} />
        </div>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        <section id="programs" className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {academicAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.title} className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--navy)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[var(--navy)]">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-blue)]">{area.text}</p>
              </div>
            );
          })}
        </section>

        <Panel title="Programs & Courses" eyebrow="Academy architecture">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {academyProgramGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Program Group</p>
                <h3 className="mt-2 text-xl font-black">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{group.subtitle}</p>
                <div className="mt-4 grid gap-2">
                  {group.programs.map((program) => (
                    <button
                      key={program.slug}
                      className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-left text-sm font-bold transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                      onClick={() => {
                        setBatchForm((form) => ({
                          ...form,
                          name: form.name || `${program.title} Batch`,
                          courseId: program.slug,
                        }));
                        document.getElementById("create-batch")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      type="button"
                    >
                      {program.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="create-batch" title="Create Batch" eyebrow="Batch and course control">
            <form onSubmit={submitBatch} className="grid gap-3">
              <Input label="Batch name" value={batchForm.name} onChange={(value) => setBatchForm((form) => ({ ...form, name: value }))} required />
              <Select label="Program" value={batchForm.courseId} onChange={(value) => setBatchForm((form) => ({ ...form, courseId: value }))} required>
                <option value="">Select program</option>
                {allPrograms.map((program) => (
                  <option key={program.slug} value={program.slug}>
                    {program.title}
                  </option>
                ))}
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <Select label="Batch type" value={batchForm.batchType} onChange={(value) => setBatchForm((form) => ({ ...form, batchType: value }))}>
                  {batchTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
                <Input label="Start date" type="date" value={batchForm.startDate} onChange={(value) => setBatchForm((form) => ({ ...form, startDate: value }))} />
                <Input label="End date" type="date" value={batchForm.endDate} onChange={(value) => setBatchForm((form) => ({ ...form, endDate: value }))} />
              </div>
              <GoldButton disabled={createBatchMutation.isPending}>Create Batch</GoldButton>
            </form>
          </Panel>

          <Panel id="teacher-allocation" title="Teacher Allocation" eyebrow="Ready-made teaching system">
            <form onSubmit={submitAllocation} className="grid gap-3">
              <Select label="Batch" value={allocation.batchId} onChange={(value) => setAllocation((form) => ({ ...form, batchId: value }))} required>
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </Select>
              <Select label="Teacher" value={allocation.teacherId} onChange={(value) => setAllocation((form) => ({ ...form, teacherId: value }))} required>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.email}</option>
                ))}
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Subject" value={allocation.subject} onChange={(value) => setAllocation((form) => ({ ...form, subject: value }))} />
                <Input label="Role" value={allocation.role} onChange={(value) => setAllocation((form) => ({ ...form, role: value }))} />
              </div>
              <GoldButton disabled={assignTeacherMutation.isPending}>Assign Teacher</GoldButton>
            </form>
          </Panel>
        </section>

        <Panel id="batches" title="Current Batches" eyebrow="Simple batch control">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onOpen={() => setSelectedBatch(batch)}
                onStatus={(status) => updateBatchMutation.mutate({ batchId: batch.id, status })}
              />
            ))}
            {!batches.length && <EmptyState text="No batches found. Create the first batch to begin planning." />}
          </div>
        </Panel>

        {selectedBatch && <BatchTeamBoard batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel id="calendar" title="Plan Syllabus Calendar" eyebrow="Director planned calendar">
            <form onSubmit={submitCalendar} className="grid gap-3">
              <Select label="Batch" value={calendarForm.batchId} onChange={(value) => setCalendarForm((form) => ({ ...form, batchId: value }))} required>
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Subject" value={calendarForm.subject} onChange={(value) => setCalendarForm((form) => ({ ...form, subject: value }))} required />
                <Input label="Topic" value={calendarForm.topic} onChange={(value) => setCalendarForm((form) => ({ ...form, topic: value }))} required />
                <Input label="Date" type="date" value={calendarForm.plannedDate} onChange={(value) => setCalendarForm((form) => ({ ...form, plannedDate: value }))} required />
                <Input label="Start time" type="time" value={calendarForm.startTime} onChange={(value) => setCalendarForm((form) => ({ ...form, startTime: value }))} />
                <Input label="End time" type="time" value={calendarForm.endTime} onChange={(value) => setCalendarForm((form) => ({ ...form, endTime: value }))} />
                <Select label="Teacher" value={calendarForm.teacherId} onChange={(value) => setCalendarForm((form) => ({ ...form, teacherId: value }))}>
                  <option value="">Assign later</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </Select>
              </div>
              <GoldButton disabled={createCalendarMutation.isPending}>Add To Calendar</GoldButton>
            </form>
          </Panel>

          <Panel id="tracker" title="Syllabus Tracker" eyebrow="Green orange red progress">
            <div className="grid gap-3 md:grid-cols-4">
              <StatCard label="Completion" value={`${syllabusSummary?.completionPercentage ?? 0}%`} />
              <StatCard label="Green" value={syllabusSummary?.green ?? 0} />
              <StatCard label="Orange" value={syllabusSummary?.orange ?? 0} />
              <StatCard label="Red" value={syllabusSummary?.red ?? 0} />
            </div>
            <div className="mt-4 grid gap-3">
              {(syllabusQuery.data?.batches ?? []).slice(0, 5).map((batch) => (
                <div key={batch.batchId ?? batch.batchName ?? "batch"} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">{batch.batchName ?? "Batch"}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">
                        Green {batch.green} / Orange {batch.orange} / Red {batch.red}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                      {batch.completionPercentage}% complete
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {(syllabusQuery.data?.progress ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">{item.topic}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">
                        {item.batchName ?? "Batch"} / {item.subject} / {item.teacherName ?? "Teacher"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">
                      {item.progressColor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              {calendarItems.map((item) => (
                <CalendarCard key={item.id} item={item} onStatus={(completionStatus) => updateCalendarMutation.mutate({ id: item.id, completionStatus })} />
              ))}
              {!calendarItems.length && <EmptyState text="No academic calendar items yet. Plan the first class from the left panel." />}
            </div>
          </Panel>
        </section>

        <Panel id="materials" title="Study Materials Control" eyebrow="Batch library">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Materials" value={materialSummary?.total ?? 0} />
            <StatCard label="Pending Review" value={materialSummary?.pendingReview ?? 0} />
            <StatCard label="Approved" value={materialSummary?.approved ?? 0} />
            <a className="rounded-2xl border border-[var(--border)] bg-white p-5 font-black transition hover:border-[var(--gold-border)] hover:shadow-lg" href="/dashboard/director/materials">
              Open Materials Control
            </a>
          </div>
          <div className="mt-5 grid gap-3">
            {(materialQuery.data?.materials ?? []).slice(0, 5).map((material) => (
              <div key={material.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{material.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {material.batchName ?? "Batch"} / {material.subject ?? "Subject"} / {material.type}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {material.reviewStatus ?? "PENDING_REVIEW"}
                  </span>
                </div>
              </div>
            ))}
            {!materialQuery.data?.materials.length && <EmptyState text="Recorded classes, notes and files will appear after materials are published." />}
          </div>
        </Panel>

        <Panel id="attendance" title="Attendance Monitoring" eyebrow="Teacher marked sessions">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Overall" value={`${attendanceSummary?.percentage ?? 0}%`} />
            <StatCard label="Sessions" value={attendanceSummary?.sessions ?? 0} />
            <StatCard label="Present Records" value={attendanceSummary?.present ?? 0} />
            <StatCard label="Absent / Leave" value={(attendanceSummary?.absent ?? 0) + (attendanceSummary?.leave ?? 0)} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h3 className="text-xl font-black">Batch attendance</h3>
              <div className="mt-4 space-y-3">
                {(attendanceSummary?.batches ?? []).slice(0, 6).map((batch) => (
                  <div key={batch.batchId} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{batch.batchName ?? "Batch"}</p>
                      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                        {batch.percentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {batch.sessions} sessions / Present {batch.present}/{batch.total}
                    </p>
                  </div>
                ))}
                {!attendanceSummary?.batches.length && <EmptyState text="No attendance sessions have been marked yet." />}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h3 className="text-xl font-black">Recent sessions</h3>
              <div className="mt-4 space-y-3">
                {(attendanceQuery.data?.attendance ?? []).slice(0, 6).map((session) => (
                  <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <p className="font-black">{session.batchName ?? "Batch"} / {session.subject ?? "Subject"}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {new Date(session.date).toLocaleDateString()} / {session.teacherName ?? "Teacher"} / {session.records?.length ?? 0} records
                    </p>
                  </div>
                ))}
                {!attendanceQuery.data?.attendance.length && <EmptyState text="Teacher-marked sessions will appear here." />}
              </div>
            </div>
          </div>
        </Panel>

        <Panel id="exams" title="Exams & Tests Control" eyebrow="Academic testing">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Teacher Exams" value={examSummary?.exams ?? 0} />
            <StatCard label="Live CBT Tests" value={examSummary?.liveTests ?? 0} />
            <StatCard label="Submitted" value={examSummary?.submitted ?? 0} />
            <StatCard label="Avg Score" value={examSummary?.averageScore ?? 0} />
          </div>
          <div className="mt-5 grid gap-3">
            {(examQuery.data?.exams ?? []).slice(0, 6).map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{exam.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {exam.batchName ?? "Batch"} / {exam.subject ?? "Subject"} / {exam.teacherName ?? "Teacher"}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {exam.attemptStats?.submitted ?? 0} submitted / {exam.attemptStats?.attempts ?? 0} attempts
                  </span>
                </div>
              </div>
            ))}
            {!examQuery.data?.exams.length && <EmptyState text="Teacher-created CBT exams will appear here after publication." />}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <a className="rounded-2xl border border-[var(--border)] bg-white p-5 font-black transition hover:border-[var(--gold-border)] hover:shadow-lg" href="/dashboard/director/exams">
              Open Exam Command
            </a>
            <a className="rounded-2xl border border-[var(--border)] bg-white p-5 font-black transition hover:border-[var(--gold-border)] hover:shadow-lg" href="/examination-center/question-bank">
              Open Question Bank
            </a>
            <a className="rounded-2xl border border-[var(--border)] bg-white p-5 font-black transition hover:border-[var(--gold-border)] hover:shadow-lg" href="/examination-center/published">
              Published Exams
            </a>
          </div>
        </Panel>

        <Panel id="assignments" title="Assignment Monitoring" eyebrow="Submitted and pending">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Assignments" value={assignmentSummary?.assignments ?? 0} />
            <StatCard label="Expected" value={assignmentSummary?.totalExpected ?? 0} />
            <StatCard label="Submitted" value={assignmentSummary?.submitted ?? 0} />
            <StatCard label="Pending" value={assignmentSummary?.pending ?? 0} />
          </div>
          <div className="mt-5 grid gap-3">
            {(assignmentQuery.data?.assignments ?? []).slice(0, 6).map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">{assignment.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {assignment.batchName ?? "Batch"} / {assignment.subject ?? "Subject"}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {assignment.submissionStats?.submitted ?? 0} submitted / {assignment.submissionStats?.pending ?? 0} pending
                  </span>
                </div>
              </div>
            ))}
            {!assignmentQuery.data?.assignments.length && <EmptyState text="Assignment activity will appear after teachers publish assignments." />}
          </div>
        </Panel>

        <Panel id="progress" title="Student Progress Control" eyebrow="Batch performance">
          <div className="grid gap-4 md:grid-cols-3">
            <EmptyState text="Open a batch team board to view students, tutors and batch status." />
            <EmptyState text="Progress will combine calendar completion, exams, attendance and assignments as modules go live." />
            <EmptyState text="Student progress appears after attendance, assignments, exams and syllabus activity are recorded." />
          </div>
        </Panel>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <p className="text-sm text-[var(--muted-blue)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--gold)]">{value}</p>
    </div>
  );
}

function Panel({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <select
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}

function GoldButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

function BatchCard({ batch, onOpen, onStatus }: { batch: AcademyBatch; onOpen: () => void; onStatus: (status: string) => void }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.batchType ?? "Batch"}</p>
          <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{batch.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.course?.title ?? "Program not linked"}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black text-[var(--navy)]">
          {batch.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-[var(--muted-blue)]">
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{batch._count?.students ?? 0} students</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{batch._count?.teachers ?? 0} teachers</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg bg-[var(--gold-gradient)] px-3 py-2 text-sm font-black text-[var(--navy)]" onClick={onOpen}>
          Open Team
        </button>
        <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-800" onClick={() => onStatus("ACTIVE")}>
          <PlayCircle className="mr-1 inline h-4 w-4" />
          Active
        </button>
        <button className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-800" onClick={() => onStatus("PAUSED")}>
          <PauseCircle className="mr-1 inline h-4 w-4" />
          Pause
        </button>
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800" onClick={() => onStatus("COMPLETED")}>
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          Complete
        </button>
      </div>
    </article>
  );
}

function BatchTeamBoard({ batch, onClose }: { batch: AcademyBatch; onClose: () => void }) {
  const looseBatch = batch as AcademyBatch & {
    students?: Array<{
      id?: string;
      status?: string;
      remarks?: string | null;
      student?: { id?: string; name?: string | null; email?: string | null; mobile?: string | null; phone?: string | null } | null;
    }>;
    teachers?: Array<{
      id?: string;
      subject?: string | null;
      role?: string | null;
      teacher?: { id?: string; name?: string | null; email?: string | null } | null;
    }>;
  };
  const students = looseBatch.students ?? [];
  const teachers = looseBatch.teachers ?? [];

  return (
    <section className="rounded-3xl border border-[var(--gold-border)] bg-white/95 p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Batch Team View</p>
          <h2 className="mt-2 text-3xl font-black text-[var(--navy)]">{batch.name}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
            Football-team style view of tutors, students and progress. Use this to understand one batch at a glance.
          </p>
        </div>
        <button className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 font-black" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Tutors / Trainers</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {teachers.map((teacher, index) => (
            <div key={teacher.id ?? `${teacher.teacher?.email}-${index}`} className="rounded-2xl border border-[var(--gold-border)] bg-white p-4 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gold-gradient)] font-black text-[var(--navy)]">
                {(teacher.teacher?.name ?? "T").slice(0, 1)}
              </div>
              <h3 className="mt-3 font-black">{teacher.teacher?.name ?? "Tutor not assigned"}</h3>
              <p className="mt-1 text-xs text-[var(--muted-blue)]">{teacher.subject ?? "Subject"} / {teacher.role ?? "Tutor"}</p>
            </div>
          ))}
          {!teachers.length && <TeamEmpty text="No tutor assigned yet. Use Teacher Allocation above." />}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Students</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {students.map((student, index) => (
            <div key={student.id ?? student.student?.id ?? index} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] font-black text-[var(--navy)]">
                {(student.student?.name ?? "S").slice(0, 1)}
              </div>
              <h3 className="mt-3 font-black">{student.student?.name ?? "Student"}</h3>
              <p className="mt-1 text-xs text-[var(--muted-blue)]">{student.student?.email ?? "No email"}</p>
              <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                {student.status ?? "ACTIVE"}
              </span>
            </div>
          ))}
          {!students.length && <TeamEmpty text="No students assigned yet. Admission Cell can approve students into this batch." />}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ProgressPill label="Class Progress" value="Calendar based" tone="green" />
        <ProgressPill label="Exam Progress" value="Published tests" tone="orange" />
        <ProgressPill label="Intervention" value="Needs live data" tone="red" />
      </div>
    </section>
  );
}

function TeamEmpty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-center text-sm text-[var(--muted-blue)]">{text}</div>;
}

function ProgressPill({ label, value, tone }: { label: string; value: string; tone: "green" | "orange" | "red" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "orange"
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-rose-200 bg-rose-50 text-rose-800";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function CalendarCard({ item, onStatus }: { item: AcademicCalendarItem; onStatus: (status: string) => void }) {
  const status = completionOptions.find((option) => option.value === item.completionStatus) ?? completionOptions[1];
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.batchName ?? "Batch"} / {item.subject}</p>
          <h3 className="mt-2 text-lg font-black text-[var(--navy)]">{item.topic}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">
            {new Date(item.plannedDate).toLocaleDateString()} {item.startTime ? ` / ${item.startTime}` : ""} {item.teacherName ? ` / ${item.teacherName}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {completionOptions.map((option) => (
          <button key={option.value} className={`rounded-xl border px-3 py-2 text-sm font-bold ${option.className}`} onClick={() => onStatus(option.value)}>
            {option.label} - {option.helper}
          </button>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-6 text-sm text-[var(--muted-blue)]">
      <ShieldCheck className="mb-3 h-5 w-5 text-[var(--gold)]" />
      {text}
    </div>
  );
}
