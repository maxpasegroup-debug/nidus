"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAcademyBatch, getAcademyBatches, updateAcademyBatch } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCourses } from "@/hooks/use-courses";
import { AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";
import type { Course } from "@/types/course";
import type { AcademyBatch } from "@/services/academy";

const learningModes = ["ONLINE", "OFFLINE", "HYBRID"];
const programTypes = ["Foundation", "Crash Course", "Regular", "Weekend", "Interview", "Physical Training"];
const programOptions = [
  { label: "NDA", slug: "nda-crash-course" },
  { label: "CDS", slug: "cdse-afcat-crash-course" },
  { label: "AFCAT", slug: "afcat" },
  { label: "Agniveer Army", slug: "agniveer-army" },
  { label: "Agniveer Navy", slug: "agniveer-navy" },
  { label: "Agniveer Air Force", slug: "agniveer-air-force" },
  { label: "SSR", slug: "ssr" },
  { label: "MR", slug: "mr" },
  { label: "Navik", slug: "navik" },
  { label: "TES", slug: "tes-guidance" },
  { label: "TGC / SSC Technical", slug: "tgc-ssc-technical" },
  { label: "SSB", slug: "ssb-interview-guidance" },
  { label: "MNS", slug: "mns" },
  { label: "AFMC", slug: "afmc" },
  { label: "RIMC", slug: "rimc-preparation" },
  { label: "AISSEE Class 6", slug: "aissee-class-6" },
  { label: "AISSEE Class 9", slug: "aissee-class-9" },
  { label: "Territorial Army & Coast Guard", slug: "territorial-army-coast-guard" },
  { label: "Foundation NDA & Civil Services", slug: "foundation-nda-civil-services" },
];
const finalProgramSlugs = [
  "aissee-class-6",
  "aissee-class-9",
  "rimc-preparation",
  "foundation-nda-civil-services",
  "nda-f1",
  "nda-f2",
  "nda-crash-course",
  "cds-f1",
  "cds-f2",
  "cds-f3",
  "afcat",
  "cdse-afcat-crash-course",
  "tes-guidance",
  "tgc-ssc-technical",
  "territorial-army-coast-guard",
  "afmc",
  "mns",
  "agniveer-army",
  "agniveer-navy",
  "agniveer-air-force",
  "ssb-interview-guidance",
  "ssr",
  "mr",
  "navik",
];

function programTemplateToCourse(program: (typeof allAcademyPrograms)[number]): Course {
  return {
    id: `template-${program.slug}`,
    title: program.title,
    slug: program.slug,
    description: JSON.stringify({
      summary: program.outcome,
      deliveryMode: "BOTH",
      source: "NIDUS Academy Master Course Architecture",
    }),
    thumbnail: `/images/academy/${program.slug}.jpg`,
    category: program.groupTitle,
    examType: "Academy Program",
    duration: program.audience,
    price: 0,
    isPremium: false,
    createdAt: "",
  };
}

function orderedCourses(courses: Course[]) {
  return [...courses].sort((left, right) => {
    const leftIndex = finalProgramSlugs.indexOf(left.slug);
    const rightIndex = finalProgramSlugs.indexOf(right.slug);
    if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
    if (leftIndex >= 0) return -1;
    if (rightIndex >= 0) return 1;
    return left.title.localeCompare(right.title);
  });
}

function textIncludes(value: string, pattern: string) {
  return value.toLowerCase().includes(pattern.toLowerCase());
}

function scheduleText(batch: AcademyBatch, key: string) {
  const value = batch.schedule?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function inferProgram(batch: AcademyBatch) {
  const saved = scheduleText(batch, "programName");
  if (saved) return saved;
  const text = `${batch.name} ${batch.programSlug} ${batch.course?.title ?? ""}`.toLowerCase();
  if (text.includes("agniveer army")) return "Agniveer Army";
  if (text.includes("agniveer navy")) return "Agniveer Navy";
  if (text.includes("agniveer air")) return "Agniveer Air Force";
  if (text.includes("cdse") || text.includes("cds")) return "CDS";
  if (text.includes("afcat")) return "AFCAT";
  if (text.includes("nda")) return "NDA";
  if (text.includes("ssb")) return "SSB";
  if (text.includes("ssr")) return "SSR";
  if (text.includes("navik")) return "Navik";
  if (text.includes("mr")) return "MR";
  if (text.includes("tes")) return "TES";
  if (text.includes("tgc") || text.includes("ssc technical")) return "TGC / SSC Technical";
  if (text.includes("mns")) return "MNS";
  if (text.includes("afmc")) return "AFMC";
  if (text.includes("rimc")) return "RIMC";
  if (text.includes("aissee class 9")) return "AISSEE Class 9";
  if (text.includes("aissee")) return "AISSEE Class 6";
  if (text.includes("territorial") || text.includes("coast guard")) return "Territorial Army & Coast Guard";
  return batch.course?.title ?? batch.programSlug ?? "Academy Program";
}

function inferLearningMode(batch: AcademyBatch) {
  const saved = scheduleText(batch, "learningMode");
  if (saved) return saved.toUpperCase();
  const type = (batch.batchType || "").toUpperCase();
  if (learningModes.includes(type)) return type;
  if (textIncludes(batch.name, "online")) return "ONLINE";
  if (textIncludes(batch.name, "offline")) return "OFFLINE";
  if (textIncludes(batch.name, "hybrid")) return "HYBRID";
  return "Mode pending";
}

function inferProgramType(batch: AcademyBatch) {
  const saved = scheduleText(batch, "programType");
  if (saved) return saved;
  const text = `${batch.name} ${batch.batchType} ${batch.programSlug} ${batch.course?.title ?? ""}`.toLowerCase();
  if (text.includes("crash")) return "Crash Course";
  if (text.includes("foundation") || text.includes("f1") || text.includes("f2") || text.includes("f3")) return "Foundation";
  if (text.includes("weekend")) return "Weekend";
  if (text.includes("interview") || text.includes("ssb")) return "Interview";
  if (text.includes("physical")) return "Physical Training";
  return "Regular";
}

function academicHeadNames(batch: AcademyBatch) {
  const names = (batch.teachers ?? [])
    .filter((assignment) => assignment.role === "ACADEMIC_HEAD" || assignment.subject === "Academic Coordination")
    .map((assignment) => assignment.teacher?.name || assignment.teacher?.email)
    .filter(Boolean) as string[];
  return Array.from(new Set(names)).join(", ") || "Not assigned";
}

function courseForProgram(courses: Course[], programSlug: string, programType: string) {
  const programSpecificSlug =
    programSlug === "nda-crash-course" && programType === "Foundation" ? "nda-f1"
    : programSlug === "cdse-afcat-crash-course" && programType === "Foundation" ? "cds-f1"
    : programSlug;
  return courses.find((course) => course.slug === programSpecificSlug) ?? courses.find((course) => course.slug === programSlug);
}

export default function DirectorBatchesPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"list" | "create">("list");
  const [form, setForm] = useState({
    name: "",
    programSlug: "nda-crash-course",
    learningMode: "OFFLINE",
    programType: "Crash Course",
    startDate: "",
    endDate: "",
  });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const coursesQuery = useCourses();
  const batches = batchesQuery.data ?? [];
  const batchLoadError = batchesQuery.isError ? getApiErrorMessage(batchesQuery.error) : "";
  const courses = useMemo(() => {
    const databaseCourses = coursesQuery.data ?? [];
    const existingSlugs = new Set(databaseCourses.map((course) => course.slug));
    const missingFinalPrograms = allAcademyPrograms
      .filter((program) => finalProgramSlugs.includes(program.slug) && !existingSlugs.has(program.slug))
      .map(programTemplateToCourse);

    return orderedCourses([...databaseCourses, ...missingFinalPrograms]);
  }, [coursesQuery.data]);
  const activeCount = useMemo(() => batches.filter((batch) => batch.status === "ACTIVE").length, [batches]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
  const createBatch = useMutation({
    mutationFn: createAcademyBatch,
    onSuccess: () => {
      setForm({ name: "", programSlug: "nda-crash-course", learningMode: "OFFLINE", programType: "Crash Course", startDate: "", endDate: "" });
      void refresh();
      setNotice("Batch created successfully.");
      setMode("list");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create batch."),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAcademyBatch(id, { status }),
    onSuccess: () => {
      void refresh();
      setNotice("Batch status updated.");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const program = programOptions.find((item) => item.slug === form.programSlug);
    const course = courseForProgram(courses, form.programSlug, form.programType);
    const isTemplateCourse = course?.id.startsWith("template-");
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
    });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Batches"
        title="Batch Control"
        description="Create a batch only when needed. Daily work stays focused on the active batch list, status and academic head allocation."
        action={
          <div className="flex flex-wrap gap-2">
            <button className={`rounded-xl px-4 py-3 text-sm font-black ${mode === "list" ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`} onClick={() => setMode("list")} type="button">View Batches</button>
            <button className={`rounded-xl px-4 py-3 text-sm font-black ${mode === "create" ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`} onClick={() => setMode("create")} type="button">Create Batch</button>
          </div>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      {batchLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">
          Batch data could not be loaded from the academy database: {batchLoadError}
        </div>
      ) : null}
      <section className="grid shrink-0 gap-3 md:grid-cols-3">
        <StatCard label="Total Batches" value={batchesQuery.isLoading ? "Loading" : batches.length} />
        <StatCard label="Active" value={batchesQuery.isLoading ? "Loading" : activeCount} />
        <StatCard label="Programs Available" value={courses.length} />
      </section>
      {mode === "create" ? (
        <Panel title="Create Batch" eyebrow="Batch setup">
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
            <div className="xl:col-span-3"><GoldButton disabled={createBatch.isPending}>Create Batch</GoldButton></div>
          </form>
        </Panel>
      ) : null}
      <Panel title="Existing Batches" eyebrow="Batch grid">
        {batchesQuery.isLoading ? <EmptyState text="Loading real academy batches from the database." /> : null}
        {!batchesQuery.isLoading && batchLoadError ? <EmptyState text="Batch records are unavailable because the batch API request failed. Check the message above before creating new batches." /> : null}
        {!batchesQuery.isLoading && !batchLoadError && !batches.length ? <EmptyState text="No batches found for your academic scope. Assigned and active batches will appear here." /> : null}
        <div className="grid max-h-[54vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const program = inferProgram(batch);
            const mode = inferLearningMode(batch);
            const programType = inferProgramType(batch);
            const heads = academicHeadNames(batch);

            return (
              <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{mode}</p>
                <h3 className="mt-2 text-xl font-black">{batch.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{program} / {programType}</p>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2">
                    <span className="font-bold text-[var(--muted-blue)]">Students</span>
                    <span className="font-black">{batch._count?.students ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2">
                    <span className="font-bold text-[var(--muted-blue)]">Teachers</span>
                    <span className="font-black">{batch._count?.teachers ?? 0}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                    <span className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">Academic Head</span>
                    <span className="mt-1 block text-sm font-bold">{heads}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">{batch.status}</span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">{mode}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].map((status) => (
                    <button key={status} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold" onClick={() => updateStatus.mutate({ id: batch.id, status })} type="button">
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </AcademicShell>
  );
}
