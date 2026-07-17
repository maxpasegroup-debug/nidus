"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Laptop,
  MapPin,
  Medal,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCreateCourse, useCourses, useDeleteCourse, useUpdateCourse } from "@/hooks/use-courses";
import type { Course } from "@/types/course";
import {
  courseDescriptionWithPlanner,
  defaultPlannerTemplate,
  parseCourseDescription,
  plannerId,
  plannerTotals,
  topicTypes,
  type AcademicPlannerModule,
  type AcademicPlannerTemplate,
} from "../academic-planner-utils";

type DeliveryMode = "OFFLINE" | "ONLINE";
type ProgramCategoryKey = "aissee-rimc" | "nda" | "cds-afcat" | "agniveer" | "ssb" | "medical" | "technical" | "other";
type ViewStep = "categories" | "modes" | "programs";

type ProgramCategory = {
  key: ProgramCategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  match: (text: string) => boolean;
};

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

const programCategories: ProgramCategory[] = [
  {
    key: "nda",
    title: "NDA",
    shortTitle: "NDA",
    description: "Foundation, F1, F2 and crash course programs.",
    icon: ShieldCheck,
    match: (text) => text.includes("nda") || text.includes("foundation"),
  },
  {
    key: "aissee-rimc",
    title: "AISSEE & RIMC",
    shortTitle: "AISSEE",
    description: "Class 6, Class 9 and RIMC school entry programs.",
    icon: BookOpen,
    match: (text) => text.includes("aissee") || text.includes("rimc") || text.includes("sainik"),
  },
  {
    key: "cds-afcat",
    title: "CDS & AFCAT",
    shortTitle: "CDS",
    description: "Graduate officer entry and crash preparation.",
    icon: Target,
    match: (text) => text.includes("cds") || text.includes("cdse") || text.includes("afcat"),
  },
  {
    key: "agniveer",
    title: "Agniveer",
    shortTitle: "Agniveer",
    description: "Army, Navy and Air Force entry programs.",
    icon: Dumbbell,
    match: (text) => text.includes("agniveer") || text.includes("army") || text.includes("navy") || text.includes("air force"),
  },
  {
    key: "ssb",
    title: "SSB & Interview",
    shortTitle: "SSB",
    description: "Interview guidance and officer personality programs.",
    icon: Users,
    match: (text) => text.includes("ssb") || text.includes("interview"),
  },
  {
    key: "medical",
    title: "Medical Entry",
    shortTitle: "Medical",
    description: "AFMC and MNS preparation programs.",
    icon: Medal,
    match: (text) => text.includes("afmc") || text.includes("mns") || text.includes("medical"),
  },
  {
    key: "technical",
    title: "Technical Entry",
    shortTitle: "Technical",
    description: "TES, TGC, SSC Technical, Coast Guard and related entries.",
    icon: Laptop,
    match: (text) => text.includes("tes") || text.includes("tgc") || text.includes("technical") || text.includes("territorial") || text.includes("coast"),
  },
  {
    key: "other",
    title: "Other Programs",
    shortTitle: "Other",
    description: "Custom academy programs created by the Director.",
    icon: BookOpen,
    match: () => true,
  },
];

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

function visibleForMode(course: Course, mode: DeliveryMode) {
  const meta = parseCourseDescription(course);
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

function categoryForCourse(course: Course) {
  const text = `${course.slug} ${course.title} ${course.category} ${course.examType}`.toLowerCase();
  return programCategories.find((category) => category.match(text)) ?? programCategories[programCategories.length - 1];
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

function modeLabel(mode: DeliveryMode) {
  return mode === "OFFLINE" ? "Offline" : "Online";
}

export default function DirectorProgramsPage() {
  const [step, setStep] = useState<ViewStep>("categories");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<ProgramCategoryKey | null>(null);
  const [selectedMode, setSelectedMode] = useState<DeliveryMode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultCourseForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [plannerCourse, setPlannerCourse] = useState<Course | null>(null);
  const [plannerDraft, setPlannerDraft] = useState<AcademicPlannerTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [hiddenTemplateSlugs, setHiddenTemplateSlugs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("directorHiddenProgramTemplates") || "[]") as string[];
    } catch {
      return [];
    }
  });

  const coursesQuery = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const courses = useMemo(() => {
    const databaseCourses = (coursesQuery.data ?? []).filter(isFinalOrCustomCourse);
    const existingSlugs = new Set(databaseCourses.map((course) => course.slug));
    const missingFinalPrograms = allAcademyPrograms
      .filter((program) => finalProgramSlugs.includes(program.slug) && !existingSlugs.has(program.slug) && !hiddenTemplateSlugs.includes(program.slug))
      .map(programTemplateToCourse);

    return orderedCourses([...databaseCourses, ...missingFinalPrograms]);
  }, [coursesQuery.data, hiddenTemplateSlugs]);

  const selectedCategory = programCategories.find((category) => category.key === selectedCategoryKey) ?? null;
  const categoryCourses = selectedCategory ? courses.filter((course) => categoryForCourse(course).key === selectedCategory.key) : [];
  const visibleCategories = programCategories
    .map((category) => {
      const items = courses.filter((course) => categoryForCourse(course).key === category.key);
      return { ...category, courses: items };
    })
    .filter((category) => category.courses.length || category.key !== "other");
  const selectedPrograms = selectedMode ? categoryCourses.filter((course) => visibleForMode(course, selectedMode)) : [];
  const totalPrograms = courses.length;
  const offlineCount = courses.filter((course) => visibleForMode(course, "OFFLINE")).length;
  const onlineCount = courses.filter((course) => visibleForMode(course, "ONLINE")).length;
  const plannerCount = courses.filter((course) => parseCourseDescription(course).academicPlanner?.modules.length).length;

  const resetForm = () => {
    setForm(defaultCourseForm);
    setEditingCourse(null);
    setShowForm(false);
  };

  const openCategory = (categoryKey: ProgramCategoryKey) => {
    setSelectedCategoryKey(categoryKey);
    setSelectedMode(null);
    resetForm();
    setStep("modes");
  };

  const openMode = (mode: DeliveryMode) => {
    setSelectedMode(mode);
    resetForm();
    setStep("programs");
  };

  const backToCategories = () => {
    setSelectedCategoryKey(null);
    setSelectedMode(null);
    resetForm();
    setStep("categories");
  };

  const backToModes = () => {
    setSelectedMode(null);
    resetForm();
    setStep("modes");
  };

  const startCreate = () => {
    const categoryTitle = selectedCategory?.title ?? "NIDUS Academy";
    setEditingCourse(null);
    setForm({
      ...defaultCourseForm,
      category: categoryTitle,
      examType: selectedCategory?.shortTitle ?? "Academy Program",
    });
    setShowForm(true);
  };

  const startModify = (course: Course) => {
    const meta = parseCourseDescription(course);
    setEditingCourse(course);
    setShowForm(true);
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

  const openPlanner = (course: Course) => {
    setPlannerCourse(course);
    setPlannerDraft(defaultPlannerTemplate(course));
  };

  const closePlanner = () => {
    setPlannerCourse(null);
    setPlannerDraft(null);
  };

  const savePlanner = (status: AcademicPlannerTemplate["status"]) => {
    if (!plannerCourse || !plannerDraft) return;
    const description = courseDescriptionWithPlanner(plannerCourse, plannerDraft, status);
    const payload = {
      title: plannerCourse.title,
      slug: plannerCourse.slug,
      description,
      thumbnail: plannerCourse.thumbnail,
      category: plannerCourse.category,
      examType: plannerCourse.examType,
      duration: plannerCourse.duration,
      price: plannerCourse.price,
      isPremium: plannerCourse.isPremium,
    };

    if (plannerCourse.id.startsWith("template-")) {
      createCourse.mutate(payload, { onSuccess: closePlanner });
      return;
    }

    updateCourse.mutate({ id: plannerCourse.id, payload }, { onSuccess: closePlanner });
  };

  const requestDelete = (course: Course) => {
    setDeleteTarget(course);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.id.startsWith("template-")) {
      setHiddenTemplateSlugs((current) => {
        const next = [...new Set([...current, deleteTarget.slug])];
        window.localStorage.setItem("directorHiddenProgramTemplates", JSON.stringify(next));
        return next;
      });
      setDeleteTarget(null);
      return;
    }

    deleteCourse.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const submitCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const deliveryMode = selectedMode ?? "OFFLINE";
    const description = JSON.stringify({
      summary: form.description,
      deliveryMode,
      source: "Director Programs & Courses",
      academicPlanner: editingCourse ? parseCourseDescription(editingCourse).academicPlanner : undefined,
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
      updateCourse.mutate({ id: editingCourse.id, payload }, { onSuccess: resetForm });
      return;
    }

    createCourse.mutate(payload, { onSuccess: resetForm });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Programs & Courses"
        title="Programs"
        description="Choose a major program category first. Then open Online or Offline programs and manage only that small list."
        action={
          step === "programs" ? (
            <AcademicActionButton onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Add Program
            </AcademicActionButton>
          ) : null
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Total Programs" value={totalPrograms} />
        <StatCard label="Offline" value={offlineCount} />
        <StatCard label="Online" value={onlineCount} />
        <StatCard label="Planners" value={plannerCount} />
      </section>

      {step === "categories" ? (
        <Panel title="Program Categories" eyebrow="Step 1">
          {coursesQuery.isLoading ? <EmptyState text="Loading program categories..." /> : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleCategories.map((category) => {
              const Icon = category.icon;
              const offline = category.courses.filter((course) => visibleForMode(course, "OFFLINE")).length;
              const online = category.courses.filter((course) => visibleForMode(course, "ONLINE")).length;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => openCategory(category.key)}
                  className="group min-h-44 rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-5 w-5 text-[var(--navy)]" />
                  </span>
                  <h3 className="mt-7 text-xl font-black leading-tight">{category.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-[var(--muted-blue)]">{category.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black">
                    <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">{category.courses.length} total</span>
                    <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">{offline} offline</span>
                    <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">{online} online</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {step === "modes" && selectedCategory ? (
        <Panel title={selectedCategory.title} eyebrow="Step 2">
          <div className="mb-3">
            <button type="button" onClick={backToCategories} className="inline-flex items-center gap-2 text-sm font-black text-[var(--navy)]">
              <ArrowLeft className="h-4 w-4" />
              Program Categories
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(["OFFLINE", "ONLINE"] as DeliveryMode[]).map((mode) => {
              const Icon = mode === "OFFLINE" ? MapPin : Laptop;
              const count = categoryCourses.filter((course) => visibleForMode(course, mode)).length;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => openMode(mode)}
                  className="group min-h-48 rounded-2xl border border-[var(--border)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-5 w-5 text-[var(--navy)]" />
                  </span>
                  <h3 className="mt-8 text-2xl font-black">{selectedCategory.shortTitle} {modeLabel(mode)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Open, add, modify or remove {modeLabel(mode).toLowerCase()} programs in this category.</p>
                  <span className="mt-5 inline-flex rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{count} program(s)</span>
                </button>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {step === "programs" && selectedCategory && selectedMode ? (
        <>
          <Panel title={`${selectedCategory.shortTitle} ${modeLabel(selectedMode)} Programs`} eyebrow="Step 3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={backToModes} className="inline-flex items-center gap-2 text-sm font-black text-[var(--navy)]">
                <ArrowLeft className="h-4 w-4" />
                {selectedCategory.title}
              </button>
              <AcademicActionButton onClick={startCreate}>
                <Plus className="h-4 w-4" />
                Add Program
              </AcademicActionButton>
            </div>

            {!selectedPrograms.length ? (
              <EmptyState
                text={`No ${modeLabel(selectedMode).toLowerCase()} programs are available in ${selectedCategory.title} yet.`}
                action={
                  <AcademicActionButton onClick={startCreate}>
                    <Plus className="h-4 w-4" />
                    Add Program
                  </AcademicActionButton>
                }
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedPrograms.map((course) => {
                const meta = parseCourseDescription(course);
                const isTemplate = course.id.startsWith("template-");
                const totals = plannerTotals(meta.academicPlanner);
                return (
                  <article key={course.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-soft)]">
                        <BookOpen className="h-5 w-5 text-[var(--navy)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-base font-black leading-5">{course.title}</h3>
                          <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-0.5 text-[9px] font-black">
                            {isTemplate ? "Template" : "Active"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted-blue)]">{meta.summary}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-black">{course.duration}</span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-black">Rs {course.price}</span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-black">{course.examType}</span>
                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-black">
                        {meta.academicPlanner ? `${totals.sessions} sessions` : "Planner pending"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => openPlanner(course)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--navy)] px-2 py-2 text-xs font-black text-white"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Planner
                      </button>
                      <button
                        type="button"
                        onClick={() => startModify(course)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2 py-2 text-xs font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modify
                      </button>
                      <button
                        type="button"
                        disabled={deleteCourse.isPending}
                        onClick={() => requestDelete(course)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--page-bg)] disabled:text-[var(--muted-blue)]"
                        title={isTemplate ? "Remove this template from the Director program list." : "Delete program"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          {showForm ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
              <section className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl md:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{editingCourse ? "Edit Program" : "New Program"}</p>
                    <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{editingCourse ? `Modify ${editingCourse.title}` : `Add ${selectedCategory.shortTitle} ${modeLabel(selectedMode)} Program`}</h2>
                  </div>
                  <button type="button" onClick={resetForm} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close program editor">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={submitCourse} className="grid gap-4 md:grid-cols-2">
                  <Input label="Program name" value={form.title} onChange={(value) => setForm((state) => ({ ...state, title: value }))} required />
                  <Input label="Category" value={form.category} onChange={(value) => setForm((state) => ({ ...state, category: value }))} required />
                  <Input label="Exam / program type" value={form.examType} onChange={(value) => setForm((state) => ({ ...state, examType: value }))} required />
                  <Input label="Duration" value={form.duration} onChange={(value) => setForm((state) => ({ ...state, duration: value }))} required placeholder="Example: 6 months" />
                  <Input label="Price" type="number" value={form.price} onChange={(value) => setForm((state) => ({ ...state, price: value }))} />
                  <Input label="Thumbnail URL" value={form.thumbnail} onChange={(value) => setForm((state) => ({ ...state, thumbnail: value }))} placeholder="/images/academy/course.jpg" />
                  <Select label="Premium program" value={form.isPremium} onChange={(value) => setForm((state) => ({ ...state, isPremium: value }))}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Select>
                  <Select label="Delivery" value={selectedMode} onChange={(value) => setSelectedMode(value as DeliveryMode)} disabled={Boolean(editingCourse)}>
                    <option value="OFFLINE">Offline</option>
                    <option value="ONLINE">Online</option>
                  </Select>
                  <div className="md:col-span-2">
                    <TextArea label="Program description" value={form.description} onChange={(value) => setForm((state) => ({ ...state, description: value }))} required />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                      <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
                        Cancel
                      </button>
                      <GoldButton disabled={createCourse.isPending || updateCourse.isPending}>{editingCourse ? "Save Changes" : "Add Program"}</GoldButton>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          ) : null}

          {plannerCourse && plannerDraft ? (
            <PlannerEditor
              course={plannerCourse}
              draft={plannerDraft}
              onChange={setPlannerDraft}
              onClose={closePlanner}
              onSaveDraft={() => savePlanner("DRAFT")}
              onPublish={() => savePlanner("PUBLISHED")}
              saving={createCourse.isPending || updateCourse.isPending}
            />
          ) : null}

          {deleteTarget ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
              <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                    <Trash2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-700">Delete Program</p>
                    <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{deleteTarget.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                      {deleteTarget.id.startsWith("template-")
                        ? "This is a default template. It will be removed from this Director program list."
                        : "This saved program will be deleted from the system."}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleteCourse.isPending}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </AcademicShell>
  );
}

function PlannerEditor({
  course,
  draft,
  onChange,
  onClose,
  onSaveDraft,
  onPublish,
  saving,
}: {
  course: Course;
  draft: AcademicPlannerTemplate;
  onChange: (planner: AcademicPlannerTemplate) => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving: boolean;
}) {
  const totals = plannerTotals(draft);

  const updateModule = (moduleId: string, patch: Partial<AcademicPlannerModule>) => {
    onChange({
      ...draft,
      modules: draft.modules.map((module) => (module.id === moduleId ? { ...module, ...patch } : module)),
    });
  };

  const addModule = () => {
    onChange({
      ...draft,
      modules: [
        ...draft.modules,
        {
          id: plannerId("module"),
          title: "New Module",
          subject: course.examType || "General",
          milestone: "",
          topics: [],
        },
      ],
    });
  };

  const deleteModule = (moduleId: string) => {
    onChange({ ...draft, modules: draft.modules.filter((module) => module.id !== moduleId) });
  };

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    const index = draft.modules.findIndex((module) => module.id === moduleId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= draft.modules.length) return;
    const modules = [...draft.modules];
    const [item] = modules.splice(index, 1);
    modules.splice(nextIndex, 0, item);
    onChange({ ...draft, modules });
  };

  const addTopic = (moduleId: string) => {
    onChange({
      ...draft,
      modules: draft.modules.map((module) => module.id === moduleId
        ? {
            ...module,
            topics: [
              ...module.topics,
              {
                id: plannerId("topic"),
                title: "New topic",
                type: "CLASS",
                sessions: 1,
                hours: 1,
                facultyRole: "Subject Faculty",
              },
            ],
          }
        : module),
    });
  };

  const updateTopic = (moduleId: string, topicId: string, patch: Partial<AcademicPlannerModule["topics"][number]>) => {
    onChange({
      ...draft,
      modules: draft.modules.map((module) => module.id === moduleId
        ? { ...module, topics: module.topics.map((topic) => (topic.id === topicId ? { ...topic, ...patch } : topic)) }
        : module),
    });
  };

  const deleteTopic = (moduleId: string, topicId: string) => {
    onChange({
      ...draft,
      modules: draft.modules.map((module) => module.id === moduleId ? { ...module, topics: module.topics.filter((topic) => topic.id !== topicId) } : module),
    });
  };

  const moveTopic = (moduleId: string, topicId: string, direction: -1 | 1) => {
    const module = draft.modules.find((item) => item.id === moduleId);
    if (!module) return;
    const index = module.topics.findIndex((topic) => topic.id === topicId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= module.topics.length) return;
    const topics = [...module.topics];
    const [item] = topics.splice(index, 1);
    topics.splice(nextIndex, 0, item);
    updateModule(moduleId, { topics });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-3 py-4 backdrop-blur-sm">
      <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Academic Planner</p>
            <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{course.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{draft.status}</span>
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{totals.modules} modules</span>
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{totals.sessions} sessions</span>
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{totals.assessments} assessments</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close planner editor">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <AcademicActionButton onClick={addModule}>
              <Plus className="h-4 w-4" />
              Add Module
            </AcademicActionButton>
            <p className="max-w-2xl text-sm font-bold leading-6 text-[var(--muted-blue)]">
              Build the master syllabus sequence here. Batch schedules will be generated from these modules and topics.
            </p>
          </div>

          <div className="grid gap-3">
            {draft.modules.map((module, moduleIndex) => (
              <article key={module.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end">
                  <Input label="Module" value={module.title} onChange={(value) => updateModule(module.id, { title: value })} />
                  <Input label="Subject" value={module.subject} onChange={(value) => updateModule(module.id, { subject: value })} />
                  <Input label="Milestone" value={module.milestone} onChange={(value) => updateModule(module.id, { milestone: value })} placeholder="Example: 25% completion" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveModule(module.id, -1)} disabled={moduleIndex === 0} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white disabled:opacity-40" aria-label="Move module up">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveModule(module.id, 1)} disabled={moduleIndex === draft.modules.length - 1} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white disabled:opacity-40" aria-label="Move module down">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => deleteModule(module.id)} className="icon-button h-10 w-10 rounded-xl border border-rose-200 bg-rose-50 text-rose-700" aria-label="Delete module">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {module.topics.map((topic, topicIndex) => (
                    <div key={topic.id} className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-2 md:grid-cols-[1.4fr_0.8fr_0.45fr_0.45fr_0.8fr_auto] md:items-end">
                      <Input label="Topic / exam / activity" value={topic.title} onChange={(value) => updateTopic(module.id, topic.id, { title: value })} />
                      <Select label="Type" value={topic.type} onChange={(value) => updateTopic(module.id, topic.id, { type: value as typeof topic.type })}>
                        {topicTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </Select>
                      <Input label="Sessions" type="number" value={String(topic.sessions)} onChange={(value) => updateTopic(module.id, topic.id, { sessions: Number(value || 0) })} />
                      <Input label="Hours" type="number" value={String(topic.hours)} onChange={(value) => updateTopic(module.id, topic.id, { hours: Number(value || 0) })} />
                      <Input label="Faculty role" value={topic.facultyRole} onChange={(value) => updateTopic(module.id, topic.id, { facultyRole: value })} />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveTopic(module.id, topic.id, -1)} disabled={topicIndex === 0} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white disabled:opacity-40" aria-label="Move topic up">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => moveTopic(module.id, topic.id, 1)} disabled={topicIndex === module.topics.length - 1} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white disabled:opacity-40" aria-label="Move topic down">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => deleteTopic(module.id, topic.id)} className="icon-button h-10 w-10 rounded-xl border border-rose-200 bg-rose-50 text-rose-700" aria-label="Delete topic">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addTopic(module.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
                    <Plus className="h-4 w-4" />
                    Add Topic / Assessment
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] p-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
            Cancel
          </button>
          <button type="button" onClick={onSaveDraft} disabled={saving} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black disabled:opacity-60">
            Save Draft
          </button>
          <GoldButton type="button" disabled={saving} onClick={onPublish}>
            Publish Planner
          </GoldButton>
        </div>
      </section>
    </div>
  );
}
