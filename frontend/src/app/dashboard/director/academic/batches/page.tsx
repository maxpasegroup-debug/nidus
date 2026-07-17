"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CalendarDays, GraduationCap, Pencil, UserCheck, Users } from "lucide-react";
import { createAcademyBatch, getAcademyBatches, getStudentProgressSummary, updateAcademyBatch } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCourses } from "@/hooks/use-courses";
import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
import { AcademicEngineBanner } from "@/components/academy/academic-engine-workspace";
import { generateBatchPlannerFromTemplate, parseCourseDescription, plannerTotals } from "../academic-planner-utils";
import {
  academicHeadNames,
  batchReadiness,
  courseForProgram,
  finalProgramSlugs,
  formatDate,
  inferLearningMode,
  inferProgram,
  inferProgramType,
  learningModes,
  orderedCourses,
  programOptions,
  programTemplateToCourse,
  programTypes,
} from "./batch-utils";

type PageMode = "list" | "create" | "running";

const classDayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

export default function DirectorBatchesPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<PageMode>("list");
  const [form, setForm] = useState({
    name: "",
    programSlug: "nda-crash-course",
    learningMode: "OFFLINE",
    programType: "Crash Course",
    startDate: "",
    endDate: "",
    durationDays: "60",
    completedDays: "0",
    subjects: "Maths, English, GK",
    completedTopics: "",
    examsPerDay: "0",
    examsPerWeek: "2",
    examsPerMonth: "1",
    assignmentsPerWeek: "3",
    plannerNotes: "",
    generatePlanner: "true",
    classDays: "1,2,3,4,5,6",
    classStartTime: "09:00",
    sessionMinutes: "60",
    holidays: "",
  });

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const coursesQuery = useCourses();
  const batches = batchesQuery.data ?? [];
  const progressCards = progressQuery.data?.batches ?? [];
  const batchLoadError = batchesQuery.isError ? getApiErrorMessage(batchesQuery.error) : "";
  const courses = useMemo(() => {
    const databaseCourses = coursesQuery.data ?? [];
    const existingSlugs = new Set(databaseCourses.map((course) => course.slug));
    const missingFinalPrograms = allAcademyPrograms
      .filter((program) => finalProgramSlugs.includes(program.slug) && !existingSlugs.has(program.slug))
      .map(programTemplateToCourse);

    return orderedCourses([...databaseCourses, ...missingFinalPrograms]);
  }, [coursesQuery.data]);

  const activeBatches = batches.filter((batch) => batch.status !== "ARCHIVED");
  const archivedBatches = batches.filter((batch) => batch.status === "ARCHIVED");
  const totalStudents = batches.reduce((count, batch) => count + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const totalTeachers = batches.reduce((count, batch) => count + (batch._count?.teachers ?? batch.teachers?.length ?? 0), 0);
  const selectedCourse = courseForProgram(courses, form.programSlug, form.programType);
  const selectedPlanner = selectedCourse ? parseCourseDescription(selectedCourse).academicPlanner : undefined;
  const selectedPlannerTotals = plannerTotals(selectedPlanner);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
  const createBatch = useMutation({
    mutationFn: createAcademyBatch,
    onSuccess: () => {
      setForm({
        name: "",
        programSlug: "nda-crash-course",
        learningMode: "OFFLINE",
        programType: "Crash Course",
        startDate: "",
        endDate: "",
        durationDays: "60",
        completedDays: "0",
        subjects: "Maths, English, GK",
        completedTopics: "",
        examsPerDay: "0",
        examsPerWeek: "2",
        examsPerMonth: "1",
        assignmentsPerWeek: "3",
        plannerNotes: "",
        generatePlanner: "true",
        classDays: "1,2,3,4,5,6",
        classStartTime: "09:00",
        sessionMinutes: "60",
        holidays: "",
      });
      void refresh();
      setNotice("Batch created successfully.");
      setMode("list");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create batch."),
  });
  const archiveBatch = useMutation({
    mutationFn: (batchId: string) => updateAcademyBatch(batchId, { status: "ARCHIVED" }),
    onSuccess: () => {
      void refresh();
      setNotice("Batch archived. It will auto-delete after 30 days. Students, courses, admissions and payments remain safe.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not archive batch."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const program = programOptions.find((item) => item.slug === form.programSlug);
    const course = courseForProgram(courses, form.programSlug, form.programType);
    const isTemplateCourse = course?.id.startsWith("template-");
    const planner = course ? parseCourseDescription(course).academicPlanner : undefined;
    const classDays = form.classDays.split(",").map((item) => Number(item)).filter((item) => Number.isInteger(item));
    const generatedSessions = form.generatePlanner === "true"
      ? generateBatchPlannerFromTemplate({
          planner,
          startDate: form.startDate,
          classDays: classDays.length ? classDays : [1, 2, 3, 4, 5, 6],
          startTime: form.classStartTime || "09:00",
          sessionMinutes: Number(form.sessionMinutes || 60),
          holidays: form.holidays.split(",").map((item) => item.trim()).filter(Boolean),
        })
      : [];
    createBatch.mutate({
      name: form.name,
      courseId: isTemplateCourse ? undefined : course?.id,
      programSlug: course?.slug ?? form.programSlug,
      programName: program?.label ?? course?.title ?? "Academy Program",
      programType: form.programType,
      learningMode: form.learningMode,
      batchType: form.learningMode,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      setupType: mode === "running" ? "RUNNING_BATCH_REMAINING_PLAN" : "NEW_BATCH_FULL_PLAN",
      durationDays: form.durationDays,
      completedDays: mode === "running" ? form.completedDays : "0",
      subjects: form.subjects,
      completedTopics: mode === "running" ? form.completedTopics : "",
      examsPerDay: form.examsPerDay,
      examsPerWeek: form.examsPerWeek,
      examsPerMonth: form.examsPerMonth,
      assignmentsPerWeek: form.assignmentsPerWeek,
      plannerNotes: form.plannerNotes,
      academicPlanner: generatedSessions.length
        ? {
            source: "PROGRAM_TEMPLATE",
            templateVersion: planner?.version ?? 0,
            templateStatus: planner?.status ?? "DRAFT",
            generatedAt: new Date().toISOString(),
            classDays,
            classStartTime: form.classStartTime,
            sessionMinutes: Number(form.sessionMinutes || 60),
            holidays: form.holidays.split(",").map((item) => item.trim()).filter(Boolean),
            totals: selectedPlannerTotals,
            sessions: generatedSessions,
          }
        : undefined,
    });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Batches"
        title="Batches"
        description="Clean batch thumbnails only. Open a batch for students, teachers, syllabus progress and academic planner."
        action={
          <div className="flex flex-wrap gap-2">
            <AcademicActionButton active={mode === "list"} onClick={() => setMode("list")}>View Batches</AcademicActionButton>
            <AcademicActionButton active={mode === "create"} onClick={() => setMode("create")}>New Batch</AcademicActionButton>
            <AcademicActionButton active={mode === "running"} onClick={() => setMode("running")}>Running Batch</AcademicActionButton>
          </div>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      {batchLoadError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">{batchLoadError}</div> : null}

      <section className="grid gap-3 md:grid-cols-5">
        <StatCard label="Active Batches" value={batchesQuery.isLoading ? "Loading" : activeBatches.length} />
        <StatCard label="Archived" value={archivedBatches.length} />
        <StatCard label="Students" value={totalStudents} />
        <StatCard label="Teachers" value={totalTeachers} />
        <StatCard label="Programs" value={courses.length} />
      </section>

      <AcademicEngineBanner
        role="DIRECTOR"
        title="Batch Planner is generated from Program Planner"
        description="Create or sync batches from the published program planner. Batch schedules then drive timetable, class completion, attendance, material, assignment, tests and performance reports."
        metrics={[
          { label: "Active Batches", value: activeBatches.length },
          { label: "Students", value: totalStudents },
          { label: "Teachers", value: totalTeachers },
          { label: "Program Templates", value: courses.length },
        ]}
      />

      {mode !== "list" ? (
        <Panel title={mode === "running" ? "Create Running Batch" : "Create New Batch"} eyebrow={mode === "running" ? "Remaining planner setup" : "Fresh planner setup"}>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select label="Program" value={form.programSlug} onChange={(value) => setForm((state) => ({ ...state, programSlug: value }))} required>
              {programOptions.map((program) => <option key={program.slug} value={program.slug}>{program.label}</option>)}
            </Select>
            <Select label="Learning Mode" value={form.learningMode} onChange={(value) => setForm((state) => ({ ...state, learningMode: value }))}>
              {learningModes.map((learningMode) => <option key={learningMode} value={learningMode}>{learningMode}</option>)}
            </Select>
            <Select label="Program Type" value={form.programType} onChange={(value) => setForm((state) => ({ ...state, programType: value }))}>
              {programTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Input label="Batch name" value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} required placeholder="NDA Crash Course Online 2026" />
            <Input label="Start date" type="date" value={form.startDate} onChange={(value) => setForm((state) => ({ ...state, startDate: value }))} />
            <Input label="End date" type="date" value={form.endDate} onChange={(value) => setForm((state) => ({ ...state, endDate: value }))} />
            <Input label="Total course days" type="number" value={form.durationDays} onChange={(value) => setForm((state) => ({ ...state, durationDays: value }))} />
            {mode === "running" ? <Input label="Already completed days" type="number" value={form.completedDays} onChange={(value) => setForm((state) => ({ ...state, completedDays: value }))} /> : null}
            <Input label="Subjects" value={form.subjects} onChange={(value) => setForm((state) => ({ ...state, subjects: value }))} placeholder="Maths, English, GK" />
            {mode === "running" ? <Input label="Completed topics" value={form.completedTopics} onChange={(value) => setForm((state) => ({ ...state, completedTopics: value }))} placeholder="Algebra, Grammar basics" /> : null}
            <Input label="Exams per week" type="number" value={form.examsPerWeek} onChange={(value) => setForm((state) => ({ ...state, examsPerWeek: value }))} />
            <Input label="Assignments per week" type="number" value={form.assignmentsPerWeek} onChange={(value) => setForm((state) => ({ ...state, assignmentsPerWeek: value }))} />
            <div className="md:col-span-2 xl:col-span-3">
              <TextArea label="Planner notes" value={form.plannerNotes} onChange={(value) => setForm((state) => ({ ...state, plannerNotes: value }))} placeholder="Example: evening batch, extra maths practice, Sunday mock test." />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">Program Planner Generation</p>
                    <h3 className="mt-1 text-base font-black">Create batch academic planner from program template</h3>
                    <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">
                      {selectedPlanner
                        ? `${selectedPlannerTotals.modules} modules, ${selectedPlannerTotals.topics} topics, ${selectedPlannerTotals.sessions} planned sessions available.`
                        : "No academic planner is published or drafted for this program yet."}
                    </p>
                  </div>
                  <Select label="Generate planner" value={form.generatePlanner} onChange={(value) => setForm((state) => ({ ...state, generatePlanner: value }))}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                </div>
                {form.generatePlanner === "true" ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="grid gap-2 text-sm font-bold text-[var(--navy)] md:col-span-2">
                      Class days
                      <div className="flex flex-wrap gap-2">
                        {classDayOptions.map((day) => {
                          const selected = form.classDays.split(",").includes(String(day.value));
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                const current = new Set(form.classDays.split(",").filter(Boolean));
                                if (selected) current.delete(String(day.value));
                                else current.add(String(day.value));
                                setForm((state) => ({ ...state, classDays: Array.from(current).join(",") }));
                              }}
                              className={`rounded-xl px-3 py-2 text-xs font-black ${selected ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Input label="Class start time" type="time" value={form.classStartTime} onChange={(value) => setForm((state) => ({ ...state, classStartTime: value }))} />
                    <Input label="Session minutes" type="number" value={form.sessionMinutes} onChange={(value) => setForm((state) => ({ ...state, sessionMinutes: value }))} />
                    <div className="md:col-span-2">
                      <Input label="Holiday dates" value={form.holidays} onChange={(value) => setForm((state) => ({ ...state, holidays: value }))} placeholder="2026-08-15, 2026-09-05" />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="xl:col-span-3"><GoldButton disabled={createBatch.isPending}>{mode === "running" ? "Create Running Batch" : "Create Batch"}</GoldButton></div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Batch Thumbnails" eyebrow="Open separate page">
        {batchesQuery.isLoading ? <EmptyState text="Loading academy batches." /> : null}
        {!batchesQuery.isLoading && !activeBatches.length ? <EmptyState text="No active batches found. Create a new batch or running batch." /> : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeBatches.map((batch) => {
            const progress = progressCards.find((item) => item.batchId === batch.id);
            const readiness = batchReadiness(batch, progress);
            const generatedPlanner = typeof batch.schedule?.academicPlanner === "object" && batch.schedule.academicPlanner
              ? batch.schedule.academicPlanner as { sessions?: unknown[]; templateStatus?: string }
              : null;
            return (
              <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
                <Link href={`/dashboard/director/academic/batches/${batch.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold-soft)]">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-black">{batch.status}</span>
                  </div>
                  <h3 className="mt-3 text-base font-black leading-tight">{batch.name}</h3>
                  <p className="mt-1 text-xs text-[var(--muted-blue)]">{inferProgram(batch)} / {inferProgramType(batch)} / {inferLearningMode(batch)}</p>
                  <p className="mt-2 inline-flex rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-black">
                    {generatedPlanner?.sessions?.length ? `${generatedPlanner.sessions.length} planner sessions generated` : "Planner not generated"}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniStat icon={Users} label="Students" value={batch._count?.students ?? batch.students?.length ?? 0} />
                    <MiniStat icon={UserCheck} label="Teachers" value={batch._count?.teachers ?? batch.teachers?.length ?? 0} />
                    <MiniStat icon={CalendarDays} label="Start" value={formatDate(batch.startDate)} />
                  </div>
                  <ReadinessBar score={readiness.score} label={readiness.label} />
                  <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs font-bold text-[var(--muted-blue)]">Head: {academicHeadNames(batch)}</p>
                </Link>
                <div className="mt-3 grid gap-2">
                  <Link href={`/dashboard/director/academic/batches/${batch.id}/planner`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-3 py-2 text-xs font-black text-white">
                    <CalendarDays className="h-4 w-4" />
                    Academic Planner
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                  <Link href={`/dashboard/director/academic/batches/${batch.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
                    <Pencil className="h-4 w-4" />
                    Modify
                  </Link>
                  <button
                    type="button"
                    disabled={archiveBatch.isPending}
                    onClick={() => {
                      if (window.confirm("Archive this batch? It will auto-delete after 30 days. Students and courses remain safe.")) {
                        archiveBatch.mutate(batch.id);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-[var(--gold)]" />
      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">{label}</p>
      <p className="truncate text-sm font-black">{value}</p>
    </div>
  );
}

function ReadinessBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--page-bg)]">
        <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
