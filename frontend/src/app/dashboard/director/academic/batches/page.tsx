"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, GraduationCap, Plus, Search, Sparkles, UserCheck, Users, X } from "lucide-react";

import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCourses } from "@/hooks/use-courses";
import { createAcademyBatch, getAcademyBatches, getStudentProgressSummary } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { generateBatchPlannerFromTemplate, parseCourseDescription, plannerTotals } from "../academic-planner-utils";
import {
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

const classDayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

const defaultBatchForm = {
  name: "",
  programSlug: "nda-crash-course",
  learningMode: "OFFLINE",
  programType: "Crash Course",
  startDate: "",
  endDate: "",
  durationDays: "60",
  subjects: "Maths, English, GK",
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
};

export default function DirectorBatchesPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [form, setForm] = useState(defaultBatchForm);

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
  const visibleBatches = activeBatches.filter((batch) => {
    const mode = inferLearningMode(batch);
    const haystack = `${batch.name} ${inferProgram(batch)} ${inferProgramType(batch)} ${mode}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());
    const matchesProgram = programFilter === "ALL" || (batch.programSlug || inferProgram(batch)).toLowerCase().includes(programFilter.toLowerCase());
    const matchesMode = modeFilter === "ALL" || mode === modeFilter;
    return matchesSearch && matchesProgram && matchesMode;
  });

  const totalStudents = activeBatches.reduce((count, batch) => count + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const totalTeachers = activeBatches.reduce((count, batch) => count + (batch._count?.teachers ?? batch.teachers?.length ?? 0), 0);
  const needsSetup = activeBatches.filter((batch) => {
    const progress = progressCards.find((item) => item.batchId === batch.id);
    return batchReadiness(batch, progress).score < 84;
  }).length;

  const selectedCourse = courseForProgram(courses, form.programSlug, form.programType);
  const selectedPlanner = selectedCourse ? parseCourseDescription(selectedCourse).academicPlanner : undefined;
  const selectedPlannerTotals = plannerTotals(selectedPlanner);

  const resetForm = () => setForm(defaultBatchForm);
  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };
  const closeCreate = () => setShowCreate(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });

  const createBatch = useMutation({
    mutationFn: createAcademyBatch,
    onSuccess: () => {
      resetForm();
      void refresh();
      setNotice("Batch created and ready to manage.");
      setShowCreate(false);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create batch."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const program = programOptions.find((item) => item.slug === form.programSlug);
    const course = courseForProgram(courses, form.programSlug, form.programType);
    const isTemplateCourse = course?.id.startsWith("template-");
    const planner = course ? parseCourseDescription(course).academicPlanner : undefined;
    const classDays = form.classDays
      .split(",")
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item));
    const holidays = form.holidays
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const generatedSessions = form.generatePlanner === "true"
      ? generateBatchPlannerFromTemplate({
          planner,
          startDate: form.startDate,
          classDays: classDays.length ? classDays : [1, 2, 3, 4, 5, 6],
          startTime: form.classStartTime || "09:00",
          sessionMinutes: Number(form.sessionMinutes || 60),
          holidays,
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
      setupType: "NEW_BATCH_FULL_PLAN",
      durationDays: form.durationDays,
      completedDays: "0",
      subjects: form.subjects,
      completedTopics: "",
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
            holidays,
            totals: selectedPlannerTotals,
            sessions: generatedSessions,
          }
        : undefined,
    });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="NIDUS AI Academics"
        title="Batches"
        description="Live batches, new batch hosting and quick access to students from one simple Director workspace."
        action={
          <AcademicActionButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Batch
          </AcademicActionButton>
        }
      />

      {notice ? <div className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-bold">{notice}</div> : null}
      {batchLoadError ? <div className="shrink-0 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">{batchLoadError}</div> : null}

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Live Batches" value={batchesQuery.isLoading ? "Loading" : activeBatches.length} />
        <StatCard label="Students" value={totalStudents} />
        <StatCard label="Teachers" value={totalTeachers} />
        <StatCard label="Need Setup" value={needsSetup} />
      </section>

      <section className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[var(--navy)] shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI</p>
              <p className="text-sm font-bold leading-6 text-[var(--muted-blue)]">
                {needsSetup
                  ? `${needsSetup} batch(es) need setup. Open the batch card to add students, teachers, dates or planner details.`
                  : "All live batches look ready for daily academic operations."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
            <MiniMetric label="Active" value={activeBatches.length} />
            <MiniMetric label="Archived" value={archivedBatches.length} />
            <MiniMetric label="Programs" value={courses.length} />
          </div>
        </div>
      </section>

      <Panel title="Live Batches" eyebrow="Open to manage">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_160px_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-blue)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search batch, program or delivery"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 text-sm font-bold text-[var(--navy)] outline-none focus:border-[var(--gold)]"
            />
          </label>
          <select
            value={programFilter}
            onChange={(event) => setProgramFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="ALL">All Programs</option>
            {programOptions.map((program) => (
              <option key={program.slug} value={program.slug}>{program.label}</option>
            ))}
          </select>
          <select
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="ALL">All Modes</option>
            {learningModes.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
          <AcademicActionButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Batch
          </AcademicActionButton>
        </div>

        {batchesQuery.isLoading ? <EmptyState text="Loading live batches." /> : null}
        {!batchesQuery.isLoading && !activeBatches.length ? <EmptyState text="No live batches found. Create a new batch." /> : null}
        {!batchesQuery.isLoading && activeBatches.length > 0 && !visibleBatches.length ? <EmptyState text="No batches match this search." /> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {visibleBatches.map((batch) => {
            const progress = progressCards.find((item) => item.batchId === batch.id);
            const readiness = batchReadiness(batch, progress);
            const students = batch._count?.students ?? batch.students?.length ?? 0;
            const teachers = batch._count?.teachers ?? batch.teachers?.length ?? 0;
            return (
              <Link
                key={batch.id}
                href={`/dashboard/director/academic/batches/${batch.id}`}
                className="group rounded-2xl border border-[var(--border)] bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] transition group-hover:border-[var(--gold-border)] group-hover:bg-white">
                    <GraduationCap className="h-5 w-5 text-[var(--navy)]" />
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${readiness.score >= 84 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {readiness.label}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-10 text-base font-black leading-tight text-[var(--navy)]">{batch.name}</h3>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--muted-blue)]">{inferProgram(batch)} / {inferLearningMode(batch)}</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <BatchFact icon={Users} label="Students" value={students} />
                  <BatchFact icon={UserCheck} label="Teachers" value={teachers} />
                  <BatchFact icon={CalendarDays} label="Start" value={formatDate(batch.startDate)} />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--page-bg)] px-3 py-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">Open batch</span>
                  <CheckCircle2 className="h-4 w-4 text-[var(--gold)]" />
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      {showCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">New Batch</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Create and host batch</h2>
                <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Select a program, name the batch and NIDUS will prepare the planner where available.</p>
              </div>
              <button type="button" onClick={closeCreate} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close batch creator">
                <X className="h-4 w-4" />
              </button>
            </div>

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
              <Input label="Subjects" value={form.subjects} onChange={(value) => setForm((state) => ({ ...state, subjects: value }))} placeholder="Maths, English, GK" />
              <Input label="Course days" type="number" value={form.durationDays} onChange={(value) => setForm((state) => ({ ...state, durationDays: value }))} />
              <Select label="Generate planner" value={form.generatePlanner} onChange={(value) => setForm((state) => ({ ...state, generatePlanner: value }))}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>

              {form.generatePlanner === "true" ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">Planner</p>
                      <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">
                        {selectedPlanner
                          ? `${selectedPlannerTotals.modules} modules, ${selectedPlannerTotals.topics} topics and ${selectedPlannerTotals.sessions} sessions available.`
                          : "No program planner is available yet. The batch can still be created."}
                      </p>
                    </div>
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
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Input label="Class start time" type="time" value={form.classStartTime} onChange={(value) => setForm((state) => ({ ...state, classStartTime: value }))} />
                    <Input label="Session minutes" type="number" value={form.sessionMinutes} onChange={(value) => setForm((state) => ({ ...state, sessionMinutes: value }))} />
                    <Input label="Holiday dates" value={form.holidays} onChange={(value) => setForm((state) => ({ ...state, holidays: value }))} placeholder="2026-08-15, 2026-09-05" />
                  </div>
                </div>
              ) : null}

              <div className="md:col-span-2 xl:col-span-3">
                <TextArea label="Notes" value={form.plannerNotes} onChange={(value) => setForm((state) => ({ ...state, plannerNotes: value }))} placeholder="Example: evening batch, extra maths practice, Sunday mock test." />
              </div>
              <div className="md:col-span-2 xl:col-span-3 flex justify-end border-t border-[var(--border)] pt-4">
                <GoldButton disabled={createBatch.isPending}>Create & Host Batch</GoldButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </AcademicShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
      <p className="text-lg font-black text-[var(--navy)]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function BatchFact({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-[var(--gold)]" />
      <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.1em] text-[var(--muted-blue)]">{label}</p>
      <p className="truncate text-xs font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}
