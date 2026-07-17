import type { AcademyBatch, StudentProgressBatchCard } from "@/services/academy";
import type { Course } from "@/types/course";
import { allAcademyPrograms } from "@/data/academy-programs";

export const learningModes = ["ONLINE", "OFFLINE", "HYBRID"];
export const programTypes = ["Foundation", "Crash Course", "Regular", "Weekend", "Interview", "Physical Training"];

export const programOptions = [
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

export const finalProgramSlugs = [
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

export function programTemplateToCourse(program: (typeof allAcademyPrograms)[number]): Course {
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

export function orderedCourses(courses: Course[]) {
  return [...courses].sort((left, right) => {
    const leftIndex = finalProgramSlugs.indexOf(left.slug);
    const rightIndex = finalProgramSlugs.indexOf(right.slug);
    if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
    if (leftIndex >= 0) return -1;
    if (rightIndex >= 0) return 1;
    return left.title.localeCompare(right.title);
  });
}

export function scheduleText(batch: AcademyBatch, key: string) {
  const value = batch.schedule?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function scheduleNumber(batch: AcademyBatch, key: string) {
  const value = batch.schedule?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function scheduleList(batch: AcademyBatch, key: string) {
  const value = batch.schedule?.[key];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function inferProgram(batch: AcademyBatch) {
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

export function inferLearningMode(batch: AcademyBatch) {
  const saved = scheduleText(batch, "learningMode");
  if (saved) return saved.toUpperCase();
  const type = (batch.batchType || "").toUpperCase();
  if (learningModes.includes(type)) return type;
  if (batch.name.toLowerCase().includes("online")) return "ONLINE";
  if (batch.name.toLowerCase().includes("offline")) return "OFFLINE";
  if (batch.name.toLowerCase().includes("hybrid")) return "HYBRID";
  return "Mode pending";
}

export function inferProgramType(batch: AcademyBatch) {
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

export function academicHeadNames(batch: AcademyBatch) {
  const names = (batch.teachers ?? [])
    .filter((assignment) => assignment.role === "ACADEMIC_HEAD" || assignment.subject === "Academic Coordination")
    .map((assignment) => assignment.teacher?.name || assignment.teacher?.email)
    .filter(Boolean) as string[];
  return Array.from(new Set(names)).join(", ") || "Not assigned";
}

export function courseForProgram(courses: Course[], programSlug: string, programType: string) {
  const programSpecificSlug =
    programSlug === "nda-crash-course" && programType === "Foundation" ? "nda-f1"
    : programSlug === "cdse-afcat-crash-course" && programType === "Foundation" ? "cds-f1"
    : programSlug;
  return courses.find((course) => course.slug === programSpecificSlug) ?? courses.find((course) => course.slug === programSlug);
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

export function formatMetric(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "No data";
}

export function batchReadiness(batch: AcademyBatch, progress?: StudentProgressBatchCard) {
  const studentCount = batch._count?.students ?? batch.students?.length ?? 0;
  const teacherCount = batch._count?.teachers ?? batch.teachers?.length ?? 0;
  const subjects = scheduleList(batch, "subjects").length;
  const hasDates = Boolean(batch.startDate && batch.endDate);
  const hasPlan = Boolean(scheduleNumber(batch, "durationDays") && subjects);
  const hasLiveSignals = Boolean(progress?.batchHealthScore !== null && progress?.batchHealthScore !== undefined);
  const score = [studentCount > 0, teacherCount > 0, subjects > 0, hasDates, hasPlan, hasLiveSignals].filter(Boolean).length;
  const percent = Math.round((score / 6) * 100);
  const label = percent >= 84 ? "Ready" : percent >= 50 ? "Needs setup" : "Not ready";
  return { score: percent, label };
}
