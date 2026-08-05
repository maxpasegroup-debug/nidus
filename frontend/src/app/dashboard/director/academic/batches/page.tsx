"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CalendarDays, GraduationCap, Pencil, Plus, Search, UserCheck, Users, X } from "lucide-react";
import { createAcademyBatch, getAcademyBatches, getStudentProgressSummary, updateAcademyBatch } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCourses } from "@/hooks/use-courses";
import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
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

export default function DirectorBatchesPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
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
  const visibleBatches = activeBatches.filter((batch) => {
    const haystack = `${batch.name} ${inferProgram(batch)} ${inferProgramType(batch)} ${inferLearningMode(batch)}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());
    const matchesProgram = programFilter === "ALL" || (batch.programSlug || inferProgram(batch)).toLowerCase().includes(programFilter.toLowerCase());
    return matchesSearch && matchesProgram;
  });
  const selectedBatch = activeBatches.find((batch) => batch.id === selectedBatchId) ?? visibleBatches[0] ?? activeBatches[0] ?? null;
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
      setShowCreate(false);
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
        description="Live batches, new batch creation, students and quick actions in one simple workspace."
        action={
          <AcademicActionButton onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Batch
          </AcademicActionButton>
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

      <Panel title="Live Batches" eyebrow="Click to manage">
        <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_240px_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
            <Search className="h-4 w-4 text-[var(--muted-blue)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search batch, program or delivery"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            />
          </label>
          <select
            value={programFilter}
            onChange={(event) => setProgramFilter(event.target.value)}
            className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black"
          >
            <option value="ALL">All Programs</option>
            {programOptions.map((program) => <option key={program.slug} value={program.slug}>{program.label}</option>)}
          </select>
          <AcademicActionButton onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Batch
          </AcademicActionButton>
        </div>

        <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            {batchesQuery.isLoading ? <EmptyState text="Loading live batches." /> : null}
            {!batchesQuery.isLoading && !activeBatches.length ? <EmptyState text="No live batches found. Create a new batch." /> : null}
            {!batchesQuery.isLoading && activeBatches.length && !visibleBatches.length ? <EmptyState text="No batches match this search." /> : null}
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleBatches.map((batch) => {
                const progress = progressCards.find((item) => item.batchId === batch.id);
                const readiness = batchReadiness(batch, progress);
                const selected = selectedBatch?.id === batch.id;
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`rounded-xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${
                      selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                        <GraduationCap className="h-5 w-5 text-[var(--navy)]" />
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-black">{batch.status}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-base font-black leading-tight">{batch.name}</h3>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--muted-blue)]">{inferProgram(batch)} / {inferLearningMode(batch)}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniStat icon={Users} label="Students" value={batch._count?.students ?? batch.students?.length ?? 0} />
                      <MiniStat icon={UserCheck} label="Teachers" value={batch._count?.teachers ?? batch.teachers?.length ?? 0} />
                      <MiniStat icon={CalendarDays} label="Start" value={formatDate(batch.startDate)} />
                    </div>
                    <ReadinessBar score={readiness.score} label={readiness.label} />
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm">
            {selectedBatch ? (
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">Selected Batch</p>
                    <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{selectedBatch.name}</h2>
                    <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{inferProgram(selectedBatch)} / {inferProgramType(selectedBatch)} / {inferLearningMode(selectedBatch)}</p>
                  </div>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-black">{selectedBatch.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={Users} label="Students" value={selectedBatch._count?.students ?? selectedBatch.students?.length ?? 0} />
                  <MiniStat icon={UserCheck} label="Teachers" value={selectedBatch._count?.teachers ?? selectedBatch.teachers?.length ?? 0} />
                  <MiniStat icon={CalendarDays} label="Start" value={formatDate(selectedBatch.startDate)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/dashboard/director/academic/batches/${selectedBatch.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-3 py-2 text-sm font-black text-white">
                    <Users className="h-4 w-4" />
                    Students
                  </Link>
                  <Link href={`/dashboard/director/academic/batches/${selectedBatch.id}/planner`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
                    <CalendarDays className="h-4 w-4" />
                    Planner
                  </Link>
                  <Link href={`/dashboard/director/academic/batches/${selectedBatch.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
                    <Pencil className="h-4 w-4" />
                    Modify
                  </Link>
                  <button
                    type="button"
                    disabled={archiveBatch.isPending}
                    onClick={() => {
                      if (window.confirm("Archive this batch? It will auto-delete after 30 days. Students and courses remain safe.")) {
                        archiveBatch.mutate(selectedBatch.id);
                      }
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700 disabled:opacity-60"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black">Students in Batch</h3>
                    <Link href={`/dashboard/director/academic/batches/${selectedBatch.id}`} className="text-xs font-black text-[var(--navy)]">
                      Add from Admissions
                    </Link>
                  </div>
                  <div className="grid max-h-64 gap-2 overflow-auto pr-1">
                    {(selectedBatch.students ?? []).slice(0, 8).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2">
                        <p className="text-sm font-black">{entry.student.name}</p>
                        <p className="text-xs font-bold text-[var(--muted-blue)]">{entry.student.mobile || "No phone"} / {entry.status}</p>
                      </div>
                    ))}
                    {!(selectedBatch.students ?? []).length ? <EmptyState text="No students assigned yet." /> : null}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="Select a batch to see students and actions." />
            )}
          </aside>
        </section>
      </Panel>

      {showCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">New Batch</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Create and host batch</h2>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close batch creator">
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
            <div className="md:col-span-2 xl:col-span-3">
              <TextArea label="Notes" value={form.plannerNotes} onChange={(value) => setForm((state) => ({ ...state, plannerNotes: value }))} placeholder="Example: evening batch, extra maths practice, Sunday mock test." />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">Planner</p>
                    <h3 className="mt-1 text-base font-black">Generate from selected program</h3>
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
            <div className="xl:col-span-3"><GoldButton disabled={createBatch.isPending}>Create & Host Batch</GoldButton></div>
          </form>
          </section>
        </div>
      ) : null}
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
