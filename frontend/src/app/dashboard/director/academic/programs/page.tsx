"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Dumbbell,
  ImageIcon,
  Laptop,
  Medal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AcademicActionButton, AcademicShell, EmptyState, GoldButton, Input, Select, TextArea } from "../_components";
import { allAcademyPrograms } from "@/data/academy-programs";
import { useCreateCourse, useCourses, useDeleteCourse, useUpdateCourse } from "@/hooks/use-courses";
import { uploadMediaFile } from "@/services/media";
import type { Course } from "@/types/course";
import { defaultPlannerTemplate, parseCourseDescription, plannerTotals, type AcademicPlannerTemplate } from "../academic-planner-utils";

type DeliveryMode = "OFFLINE" | "ONLINE";
type ProgramCategoryKey = "all" | "nda" | "aissee-rimc" | "cds-afcat" | "agniveer" | "ssb" | "medical" | "technical" | "other";

type ProgramCategory = {
  key: Exclude<ProgramCategoryKey, "all">;
  title: string;
  shortTitle: string;
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
  { key: "nda", title: "NDA", shortTitle: "NDA", icon: ShieldCheck, match: (text) => text.includes("nda") || text.includes("foundation") },
  { key: "aissee-rimc", title: "AISSEE & RIMC", shortTitle: "AISSEE", icon: BookOpen, match: (text) => text.includes("aissee") || text.includes("rimc") || text.includes("sainik") },
  { key: "cds-afcat", title: "CDS & AFCAT", shortTitle: "CDS", icon: Target, match: (text) => text.includes("cds") || text.includes("cdse") || text.includes("afcat") },
  { key: "agniveer", title: "Agniveer", shortTitle: "Agniveer", icon: Dumbbell, match: (text) => text.includes("agniveer") || text.includes("army") || text.includes("navy") || text.includes("air force") },
  { key: "ssb", title: "SSB & Interview", shortTitle: "SSB", icon: Users, match: (text) => text.includes("ssb") || text.includes("interview") },
  { key: "medical", title: "Medical Entry", shortTitle: "Medical", icon: Medal, match: (text) => text.includes("afmc") || text.includes("mns") || text.includes("medical") },
  { key: "technical", title: "Technical Entry", shortTitle: "Technical", icon: Laptop, match: (text) => text.includes("tes") || text.includes("tgc") || text.includes("technical") || text.includes("territorial") || text.includes("coast") },
  { key: "other", title: "Other Programs", shortTitle: "Other", icon: BookOpen, match: () => true },
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
  deliveryMode: "OFFLINE" as DeliveryMode,
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

function visibleForMode(course: Course, mode: DeliveryMode | "ALL") {
  if (mode === "ALL") return true;
  const meta = parseCourseDescription(course);
  if (!meta.deliveryMode) return true;
  return meta.deliveryMode === mode || meta.deliveryMode === "BOTH";
}

function programTemplateToCourse(program: (typeof allAcademyPrograms)[number]): Course {
  return {
    id: `template-${program.slug}`,
    title: program.title,
    slug: program.slug,
    description: JSON.stringify({ summary: program.outcome, deliveryMode: "BOTH", source: "NIDUS Academy Master Course Architecture" }),
    thumbnail: `/images/academy/${program.slug}.jpg`,
    category: program.groupTitle,
    examType: "Academy Program",
    duration: program.audience,
    price: 0,
    isPremium: false,
    createdAt: "",
  };
}

function plannerStatus(course: Course) {
  const meta = parseCourseDescription(course);
  const planner = meta.academicPlanner ?? defaultPlannerTemplate(course);
  const totals = plannerTotals(planner);
  const ready = Boolean(meta.academicPlanner?.modules.length);
  return { planner, totals, ready };
}

export default function DirectorProgramsPage() {
  const pathname = usePathname();
  const hiddenTemplateStorageKey = (pathname ?? "").includes("/dashboard/academic-head/") ? "academicHeadHiddenProgramTemplates" : "academyHiddenProgramTemplates";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProgramCategoryKey>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryMode | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultCourseForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [hiddenTemplateSlugs, setHiddenTemplateSlugs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(hiddenTemplateStorageKey) || "[]") as string[];
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

  const filteredPrograms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      const meta = parseCourseDescription(course);
      const category = categoryForCourse(course);
      const matchesSearch = !term || `${course.title} ${course.category} ${course.examType} ${meta.summary}`.toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "all" || category.key === categoryFilter;
      return matchesSearch && matchesCategory && visibleForMode(course, deliveryFilter);
    });
  }, [categoryFilter, courses, deliveryFilter, search]);

  const totalPrograms = courses.length;
  const plannerReadyCount = courses.filter((course) => plannerStatus(course).ready).length;
  const missingPlannerCount = Math.max(0, totalPrograms - plannerReadyCount);

  const resetForm = () => {
    setForm(defaultCourseForm);
    setEditingCourse(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setEditingCourse(null);
    setForm({ ...defaultCourseForm });
    setShowForm(true);
  };

  const startModify = (course: Course) => {
    const meta = parseCourseDescription(course);
    const deliveryMode = meta.deliveryMode === "ONLINE" || meta.deliveryMode === "OFFLINE" ? meta.deliveryMode : "OFFLINE";
    setEditingCourse(course);
    setForm({
      title: course.title,
      category: course.category,
      examType: course.examType,
      duration: course.duration,
      price: String(course.price ?? 0),
      thumbnail: course.thumbnail,
      description: meta.summary,
      isPremium: String(course.isPremium),
      deliveryMode,
    });
    setShowForm(true);
  };

  const submitCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = slugify(form.title);
    const existingPlanner: AcademicPlannerTemplate | undefined = editingCourse ? parseCourseDescription(editingCourse).academicPlanner : undefined;
    const description = JSON.stringify({ summary: form.description, deliveryMode: form.deliveryMode, source: "Director Programs Workspace", academicPlanner: existingPlanner });
    const payload = {
      title: form.title,
      slug,
      description,
      thumbnail: form.thumbnail || `/images/academy/${slug || "course"}.jpg`,
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

  const requestDelete = (course: Course) => setDeleteTarget(course);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.id.startsWith("template-")) {
      setHiddenTemplateSlugs((current) => {
        const next = [...new Set([...current, deleteTarget.slug])];
        window.localStorage.setItem(hiddenTemplateStorageKey, JSON.stringify(next));
        return next;
      });
      setDeleteTarget(null);
      return;
    }

    deleteCourse.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <AcademicShell>
      <header className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Programs</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Programs</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Live programs, new program creation and quick modify/delete in one clean workspace.</p>
          </div>
          <AcademicActionButton onClick={startCreate}>
            <Plus className="h-4 w-4" />
            New Program
          </AcademicActionButton>
        </div>
      </header>

      <section className="shrink-0 rounded-3xl border border-[var(--gold-border)] bg-white/92 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white"><Sparkles className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI</p>
              <p className="mt-1 text-base font-black leading-6 text-[var(--navy)]">
                {missingPlannerCount ? `${missingPlannerCount} program(s) need planner setup.` : "All visible programs look ready."}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">Keep programs small, visible and easy to manage.</p>
            </div>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2">
            <MiniMetric label="Programs" value={totalPrograms} />
            <MiniMetric label="Ready" value={plannerReadyCount} />
            <MiniMetric label="Setup" value={missingPlannerCount} tone={missingPlannerCount ? "warn" : "ok"} />
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 rounded-3xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_150px_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-blue)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search program"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 text-sm font-bold text-[var(--navy)] outline-none focus:border-[var(--gold)]"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as ProgramCategoryKey)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="all">All Categories</option>
            {programCategories.map((category) => <option key={category.key} value={category.key}>{category.title}</option>)}
          </select>
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value as DeliveryMode | "ALL")}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="ALL">All Delivery</option>
            <option value="OFFLINE">Offline</option>
            <option value="ONLINE">Online</option>
          </select>
          <AcademicActionButton onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add
          </AcademicActionButton>
        </div>

        {coursesQuery.isLoading ? <EmptyState text="Loading live programs..." /> : null}
        {!coursesQuery.isLoading && !filteredPrograms.length ? <EmptyState text="No matching programs found. Add a program or adjust the filters." /> : null}

        <div className="grid max-h-[calc(100vh-360px)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredPrograms.map((course) => {
            const meta = parseCourseDescription(course);
            const category = categoryForCourse(course);
            const status = plannerStatus(course);
            const isTemplate = course.id.startsWith("template-");
            return (
              <article key={course.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
                <div className="flex items-start gap-3">
                  <ProgramAvatar course={course} icon={category.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 min-h-10 text-base font-black leading-5 text-[var(--navy)]">{course.title}</h3>
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">Live</span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-[var(--muted-blue)]">{category.shortTitle}</p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 h-10 text-sm leading-5 text-[var(--muted-blue)]">{meta.summary || "Program details can be added from Modify."}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <CompactPill>{course.duration || "Duration not set"}</CompactPill>
                  <CompactPill>Rs {course.price ?? 0}</CompactPill>
                  <CompactPill>{meta.deliveryMode || "Both"}</CompactPill>
                  <CompactPill tone={status.ready ? "ok" : "warn"}>{status.ready ? "Planner ready" : "Planner setup"}</CompactPill>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => startModify(course)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
                    <Pencil className="h-4 w-4" />
                    Modify
                  </button>
                  <button type="button" disabled={deleteCourse.isPending} onClick={() => requestDelete(course)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60" title={isTemplate ? "Remove this template from this list" : "Delete program"}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{editingCourse ? "Modify Program" : "New Program"}</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{editingCourse ? editingCourse.title : "Add Program"}</h2>
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
              <ProgramImageUpload value={form.thumbnail} onChange={(value) => setForm((state) => ({ ...state, thumbnail: value }))} />
              <Select label="Premium program" value={form.isPremium} onChange={(value) => setForm((state) => ({ ...state, isPremium: value }))}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
              <Select label="Delivery" value={form.deliveryMode} onChange={(value) => setForm((state) => ({ ...state, deliveryMode: value as DeliveryMode }))}>
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
              </Select>
              <div className="md:col-span-2">
                <TextArea label="Program description" value={form.description} onChange={(value) => setForm((state) => ({ ...state, description: value }))} required />
              </div>
              {editingCourse ? <div className="md:col-span-2 rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-sm font-bold text-[var(--muted-blue)]">Planner data is preserved when this program is modified.</div> : null}
              <div className="md:col-span-2 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Cancel</button>
                <GoldButton disabled={createCourse.isPending || updateCourse.isPending}>{editingCourse ? "Save Changes" : "Add Program"}</GoldButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Trash2 className="h-5 w-5" /></span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-700">Delete Program</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{deleteTarget.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{deleteTarget.id.startsWith("template-") ? "This default program will be hidden from this list." : "This saved program will be deleted from the system."}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleteCourse.isPending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AcademicShell>
  );
}

function MiniMetric({ label, tone = "ok", value }: { label: string; tone?: "ok" | "warn"; value: string | number }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--gold-soft)] px-3 py-2"><p className={`text-lg font-black ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</p><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p></div>;
}

function CompactPill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "ok" | "warn" }) {
  const className = tone === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : tone === "warn" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-[var(--page-bg)] text-[var(--muted-blue)] border-[var(--border)]";
  return <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${className}`}>{children}</span>;
}

function ProgramAvatar({ course, icon: Icon }: { course: Course; icon: LucideIcon }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--gold-soft)] text-[var(--navy)]">
      {course.thumbnail && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.thumbnail} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </div>
  );
}

function ProgramImageUpload({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Upload JPG, PNG or WEBP image only.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Image should be 3 MB or smaller.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadMediaFile({ file, storagePath: "program-thumbnails" });
      onChange(uploaded.signedUrl || uploaded.cloudinaryUrl);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-black text-[var(--navy)]">Program image</p>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
        <div className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Program thumbnail preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[var(--muted-blue)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--navy)]">{value ? "Image ready" : "Upload thumbnail"}</p>
          <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">JPG, PNG or WEBP. No URL needed.</p>
          {error ? <p className="mt-1 text-xs font-black text-red-600">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--navy)] px-3 py-2 text-xs font-black text-white">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} disabled={uploading} />
            </label>
            {value ? <button type="button" onClick={() => onChange("")} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black text-[var(--navy)]">Remove</button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}