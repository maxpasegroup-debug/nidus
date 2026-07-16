"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, Laptop, MapPin, Plus } from "lucide-react";

import { AcademicActionButton, AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, TextArea } from "../_components";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCreateCourse, useCourses } from "@/hooks/use-courses";
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
  const coursesQuery = useCourses();
  const createCourse = useCreateCourse();
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

  const submitCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = JSON.stringify({
      summary: form.description,
      deliveryMode: selectedMode,
      source: "Director Programs & Courses",
    });
    createCourse.mutate(
      {
        title: form.title,
        slug: slugify(form.title),
        description,
        thumbnail: form.thumbnail || `/images/academy/${slugify(form.title)}.jpg`,
        category: form.category,
        examType: form.examType,
        duration: form.duration,
        price: Number(form.price || 0),
        isPremium: form.isPremium === "true",
      },
      {
        onSuccess: () => {
          setForm(defaultCourseForm);
          setShowCreate(false);
        },
      },
    );
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Programs & Courses"
        title="Offline and online academy programs."
        description="This page only shows existing programs and courses. Choose Offline or Online, view the program grid, or create a new course for the selected category."
        action={
          <AcademicActionButton onClick={() => setShowCreate((value) => !value)}>
            <Plus className="h-4 w-4" />
            Create Course
          </AcademicActionButton>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-2">
        <button className="text-left" onClick={() => setSelectedMode("OFFLINE")} type="button">
          <AcademicCard
            icon={MapPin}
            title="Offline"
            selected={selectedMode === "OFFLINE"}
            description="Classroom, crash course, physical training and centre-based programs."
            action={<AcademicPill>{offlineCount} program(s)</AcademicPill>}
          />
        </button>

        <button className="text-left" onClick={() => setSelectedMode("ONLINE")} type="button">
          <AcademicCard
            icon={Laptop}
            title="Online"
            selected={selectedMode === "ONLINE"}
            description="Live online, recorded support, exam coaching and digital learning programs."
            action={<AcademicPill>{onlineCount} program(s)</AcademicPill>}
          />
        </button>
      </section>

      {showCreate ? (
        <Panel title={`Create ${selectedMode.toLowerCase()} course`} eyebrow="New program">
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
              <GoldButton disabled={createCourse.isPending}>Add Course</GoldButton>
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
        <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {modeCourses.map((course) => {
            const meta = parseDescription(course);
            return (
              <AcademicCard
                key={course.id}
                icon={BookOpen}
                eyebrow={course.category}
                title={course.title}
                description={<p className="line-clamp-2">{meta.summary}</p>}
              >
                <div className="flex flex-wrap gap-2">
                  <AcademicPill>{course.examType}</AcademicPill>
                  <AcademicPill>{course.duration}</AcademicPill>
                  <AcademicPill>Rs {course.price}</AcademicPill>
                </div>
              </AcademicCard>
            );
          })}
        </div>
      </Panel>
    </AcademicShell>
  );
}
