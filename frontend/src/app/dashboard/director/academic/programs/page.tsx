"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, Laptop, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCreateCourse, useCourses, useDeleteCourse, useUpdateCourse } from "@/hooks/use-courses";
import type { Course } from "@/types/course";

type DeliveryMode = "OFFLINE" | "ONLINE";

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

const legacySeededSlugs = new Set([
  "aissee-sainik-school-entrance",
  "mission-nda",
  "mission-nda-2-year-program",
  "tes-technical-entry-scheme",
  "afcat-program",
  "afmc-preparation",
  "mns-preparation",
  "mns-military-nursing-service",
  "cdse-long-term-coaching",
  "territorial-army-coast-guard-ac",
]);

const defaultCourseForm = {
  title: "",
  category: "NIDUS Academy",
  examType: "Academy Program",
  duration: "",
  price: "0",
  thumbnail: "",
  description: "",
  isPremium: "false",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseDescription(course: Course) {
  try {
    const parsed = JSON.parse(course.description) as { summary?: string; deliveryMode?: string; format?: string };
    return {
      summary: parsed.summary || parsed.format || course.description,
      deliveryMode: parsed.deliveryMode,
    };
  } catch {
    return { summary: course.description, deliveryMode: undefined };
  }
}

function visibleForMode(course: Course, mode: DeliveryMode) {
  const meta = parseDescription(course);
  if (!meta.deliveryMode) return true;
  return meta.deliveryMode === mode || meta.deliveryMode === "BOTH";
}

function isFinalOrCustomCourse(course: Course) {
  return finalProgramSlugs.includes(course.slug) || !legacySeededSlugs.has(course.slug);
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

export default function DirectorProgramsPage() {
  const [selectedMode, setSelectedMode] = useState<DeliveryMode>("OFFLINE");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultCourseForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const coursesQuery = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const courses = useMemo(() => {
    const databaseCourses = (coursesQuery.data ?? []).filter(isFinalOrCustomCourse);
    const existingSlugs = new Set(databaseCourses.map((course) => course.slug));
    const missingFinalPrograms = allAcademyPrograms
      .filter((program) => finalProgramSlugs.includes(program.slug) && !existingSlugs.has(program.slug))
      .map(programTemplateToCourse);

    return orderedCourses([...databaseCourses, ...missingFinalPrograms]);
  }, [coursesQuery.data]);

  const modeCourses = useMemo(() => courses.filter((course) => visibleForMode(course, selectedMode)), [courses, selectedMode]);
  const offlineCount = courses.filter((course) => visibleForMode(course, "OFFLINE")).length;
  const onlineCount = courses.filter((course) => visibleForMode(course, "ONLINE")).length;
  const formMode = editingCourse ? parseDescription(editingCourse).deliveryMode as DeliveryMode | undefined : selectedMode;
  const formDeliveryMode = formMode === "ONLINE" || formMode === "OFFLINE" ? formMode : selectedMode;

  const resetForm = () => {
    setForm(defaultCourseForm);
    setEditingCourse(null);
    setShowCreate(false);
  };

  const startCreate = () => {
    setForm(defaultCourseForm);
    setEditingCourse(null);
    setShowCreate((value) => !value);
  };

  const startModify = (course: Course) => {
    const meta = parseDescription(course);
    setEditingCourse(course);
    setShowCreate(true);
    setForm({
      title: course.title,
      category: course.category,
      examType: course.examType,
      duration: course.duration,
      price: String(course.price ?? 0),
      thumbnail: course.thumbnail,
      description: meta.summary,
      isPremium: String(course.isPremium),
    });
  };

  const submitCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = JSON.stringify({
      summary: form.description,
      deliveryMode: formDeliveryMode,
      source: "Director Programs & Courses",
    });
    const payload = {
      title: form.title,
      slug: slugify(form.title),
      description,
      thumbnail: form.thumbnail || `/images/academy/${slugify(form.title)}.jpg`,
      category: form.category,
      examType: form.examType,
      duration: form.duration,
      price: Number(form.price || 0),
      isPremium: form.isPremium === "true",
    };

    if (editingCourse && !editingCourse.id.startsWith("template-")) {
      updateCourse.mutate(
        { id: editingCourse.id, payload },
        { onSuccess: resetForm },
      );
      return;
    }

    createCourse.mutate(payload, { onSuccess: resetForm });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Programs & Courses"
        title="Programs"
        description="Simple program list for office use. Add a course only when a new academy offering is approved."
        action={
          <AcademicActionButton onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Create Course
          </AcademicActionButton>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-[1fr_1fr_1fr]">
        <StatCard label="Total Programs" value={courses.length} />
        <button className={`rounded-2xl border px-3 py-2 text-left shadow-sm ${selectedMode === "OFFLINE" ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`} onClick={() => setSelectedMode("OFFLINE")} type="button">
          <MapPin className="h-4 w-4 text-[var(--gold)]" />
          <p className="mt-1 text-sm font-black">Offline</p>
          <p className="text-xl font-black">{offlineCount}</p>
        </button>
        <button className={`rounded-2xl border px-3 py-2 text-left shadow-sm ${selectedMode === "ONLINE" ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`} onClick={() => setSelectedMode("ONLINE")} type="button">
          <Laptop className="h-4 w-4 text-[var(--gold)]" />
          <p className="mt-1 text-sm font-black">Online</p>
          <p className="text-xl font-black">{onlineCount}</p>
        </button>
      </section>

      {showCreate ? (
        <Panel title={editingCourse ? `Modify ${editingCourse.title}` : `Create ${selectedMode.toLowerCase()} course`} eyebrow={editingCourse ? "Program details" : "New program"}>
          <form onSubmit={submitCourse} className="grid gap-4 md:grid-cols-2">
            <Input label="Course name" value={form.title} onChange={(value) => setForm((state) => ({ ...state, title: value }))} required />
            <Input label="Category" value={form.category} onChange={(value) => setForm((state) => ({ ...state, category: value }))} required />
            <Input label="Exam / program type" value={form.examType} onChange={(value) => setForm((state) => ({ ...state, examType: value }))} required />
            <Input label="Duration" value={form.duration} onChange={(value) => setForm((state) => ({ ...state, duration: value }))} required placeholder="Example: 6 months" />
            <Input label="Price" type="number" value={form.price} onChange={(value) => setForm((state) => ({ ...state, price: value }))} />
            <Input label="Thumbnail URL" value={form.thumbnail} onChange={(value) => setForm((state) => ({ ...state, thumbnail: value }))} placeholder="/images/academy/course.jpg" />
            <Select label="Premium course" value={form.isPremium} onChange={(value) => setForm((state) => ({ ...state, isPremium: value }))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <div />
            <div className="md:col-span-2">
              <TextArea label="Course description" value={form.description} onChange={(value) => setForm((state) => ({ ...state, description: value }))} required />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <GoldButton disabled={createCourse.isPending || updateCourse.isPending}>{editingCourse ? "Save Changes" : "Add Course"}</GoldButton>
                <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title={`${selectedMode === "OFFLINE" ? "Offline" : "Online"} programs`} eyebrow="Existing courses">
        {coursesQuery.isLoading ? <EmptyState text="Loading programs and courses..." /> : null}
        {!coursesQuery.isLoading && !modeCourses.length ? (
          <EmptyState
            text={`No ${selectedMode.toLowerCase()} programs are available yet.`}
            action={
              <AcademicActionButton onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create Course
              </AcademicActionButton>
            }
          />
        ) : null}
        <div className="max-h-[52vh] overflow-auto pr-1">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modeCourses.map((course) => {
              const meta = parseDescription(course);
              const isTemplate = course.id.startsWith("template-");
              return (
                <article key={course.id} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
                  <div className="flex items-center justify-center border-b border-[var(--border)] bg-[var(--gold-soft)] py-5">
                    <BookOpen className="h-7 w-7 text-[var(--navy)]" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{course.category}</p>
                        <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6">{course.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-black">
                        {course.isPremium ? "Premium" : isTemplate ? "Template" : "Active"}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--muted-blue)]">{meta.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{course.examType}</span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{course.duration}</span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">Rs {course.price}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startModify(course)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                      >
                        <Pencil className="h-4 w-4" />
                        Modify
                      </button>
                      <button
                        type="button"
                        disabled={isTemplate || deleteCourse.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete ${course.title}? This cannot be undone.`)) deleteCourse.mutate(course.id);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--page-bg)] disabled:text-[var(--muted-blue)]"
                        title={isTemplate ? "Modify and save this template before deleting it." : "Delete program"}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Panel>
    </AcademicShell>
  );
}
