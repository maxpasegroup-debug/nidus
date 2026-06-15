import Link from "next/link";
import { BarChart3, CalendarCheck, CalendarDays, ClipboardCheck, FileArchive, GraduationCap, PieChart, Users, UserCheck } from "lucide-react";
import { AcademicHero, AcademicShell } from "./_components";

const modules = [
  {
    title: "Programs & Courses",
    text: "View offline and online academy programs. Add new courses from one simple page.",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
  },
  {
    title: "Batches",
    text: "Create and manage offline, online, crash and foundation batches.",
    href: "/dashboard/director/academic/batches",
    icon: Users,
  },
  {
    title: "Teachers",
    text: "Add teachers, set full-time or hourly status, and allocate subjects.",
    href: "/dashboard/director/academic/teachers",
    icon: UserCheck,
  },
  {
    title: "Timetable",
    text: "Plan daily classes and teacher schedules.",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
  },
  {
    title: "Syllabus",
    text: "Track completion status with green, orange and red signals.",
    href: "/dashboard/director/academic/syllabus",
    icon: BarChart3,
  },
  {
    title: "Exams & Tests",
    text: "Create, approve, publish and monitor exams, tests and question banks.",
    href: "/dashboard/director/exams",
    icon: ClipboardCheck,
  },
  {
    title: "Study Materials",
    text: "Control notes, recorded classes, documents and batch library.",
    href: "/dashboard/director/materials",
    icon: FileArchive,
  },
  {
    title: "Reports",
    text: "See attendance, assignments, exams, materials and academic health.",
    href: "/dashboard/director/academic/reports",
    icon: ClipboardCheck,
  },
  {
    title: "Student Progress",
    text: "Review batch health, attendance, assignments, exams and risk students.",
    href: "/dashboard/director/academic/student-progress",
    icon: PieChart,
  },
  {
    title: "Teacher Performance",
    text: "Monitor teaching quality and academic delivery.",
    href: "/dashboard/director/academic/teacher-performance",
    icon: UserCheck,
  },
  {
    title: "Academic Calendar Monitor",
    text: "Track class execution and syllabus completion.",
    href: "/dashboard/director/academic/calendar-monitor",
    icon: CalendarCheck,
  },
];

export default function DirectorAcademicDepartmentPage() {
  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Academic Department"
        title="Choose one academic control room."
        description="Each academic module now opens as a separate page. Director can move directly into programs, batches, teacher allocation, timetable, syllabus and reports without scrolling through one long ERP screen."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.title}
              className="group rounded-3xl border border-[var(--border)] bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
              href={module.href}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                <Icon className="h-7 w-7 text-[var(--navy)]" />
              </div>
              <h2 className="mt-5 text-2xl font-black text-[var(--navy)]">{module.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">{module.text}</p>
              <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open page +</span>
            </Link>
          );
        })}
      </section>
    </AcademicShell>
  );
}
