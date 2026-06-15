"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAcademyBatch, getAcademyBatches, updateAcademyBatch } from "@/services/academy";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCourses } from "@/hooks/use-courses";
import { AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";
import type { Course } from "@/types/course";

const batchTypes = ["OFFLINE", "ONLINE", "CRASH", "FOUNDATION", "EXAM_COACHING", "GURU"];
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

export default function DirectorBatchesPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", courseId: "", batchType: "OFFLINE", startDate: "", endDate: "" });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const coursesQuery = useCourses();
  const batches = batchesQuery.data ?? [];
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
      setForm({ name: "", courseId: "", batchType: "OFFLINE", startDate: "", endDate: "" });
      void refresh();
      setNotice("Batch created successfully.");
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
    const course = courses.find((item) => item.id === form.courseId);
    const isTemplateCourse = course?.id.startsWith("template-");
    createBatch.mutate({
      name: form.name,
      courseId: isTemplateCourse ? undefined : form.courseId,
      programSlug: course?.slug ?? "academy-program",
      batchType: form.batchType,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
  };

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Batches" title="Create and manage batches." description="One page for offline, online, crash and foundation batch creation. No other academic sections are mixed into this page." />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Batches" value={batches.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Programs Available" value={courses.length} />
      </section>
      <Panel title="Create Batch" eyebrow="Batch setup">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Batch name" value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} required />
          <Select label="Course" value={form.courseId} onChange={(value) => setForm((state) => ({ ...state, courseId: value }))} required>
            <option value="">Select course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </Select>
          <Select label="Batch type" value={form.batchType} onChange={(value) => setForm((state) => ({ ...state, batchType: value }))}>
            {batchTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Input label="Start date" type="date" value={form.startDate} onChange={(value) => setForm((state) => ({ ...state, startDate: value }))} />
          <Input label="End date" type="date" value={form.endDate} onChange={(value) => setForm((state) => ({ ...state, endDate: value }))} />
          <div className="md:col-span-2"><GoldButton disabled={createBatch.isPending}>Create Batch</GoldButton></div>
        </form>
      </Panel>
      <Panel title="Existing Batches" eyebrow="Batch grid">
        {!batches.length ? <EmptyState text="No batches found. Create the first batch to begin planning." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.batchType}</p>
              <h3 className="mt-2 text-xl font-black">{batch.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.course?.title ?? batch.programSlug}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full border border-[var(--border)] px-3 py-1">{batch.status}</span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1">{batch._count?.students ?? 0} students</span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1">{batch._count?.teachers ?? 0} teachers</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].map((status) => (
                  <button key={status} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold" onClick={() => updateStatus.mutate({ id: batch.id, status })} type="button">
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
