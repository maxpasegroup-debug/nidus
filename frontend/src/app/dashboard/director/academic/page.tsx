"use client";

import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileArchive,
  GraduationCap,
  PieChart,
  UserCheck,
  Users,
} from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Programs & Courses",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
    note: "View academy programs and add new course offerings.",
  },
  {
    label: "Batches",
    href: "/dashboard/director/academic/batches",
    icon: Users,
    note: "Create, edit and monitor active academy batches.",
  },
  {
    label: "Teachers",
    href: "/dashboard/director/academic/teachers",
    icon: UserCheck,
    note: "Add teachers, trainers, heads and allocate subjects.",
  },
  {
    label: "Timetable",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
    note: "Plan classes and verify teacher schedule delivery.",
  },
  {
    label: "Syllabus",
    href: "/dashboard/director/academic/syllabus",
    icon: BarChart3,
    note: "Track completion with green, amber and red signals.",
  },
  {
    label: "Exams & Tests",
    href: "/dashboard/director/exams",
    icon: ClipboardCheck,
    note: "Create, approve, publish and monitor exams.",
  },
  {
    label: "Study Materials",
    href: "/dashboard/director/materials",
    icon: FileArchive,
    note: "Review notes, recordings and batch learning library.",
  },
  {
    label: "Student Progress",
    href: "/dashboard/director/academic/student-progress",
    icon: PieChart,
    note: "Check batch health, attendance and risk learners.",
  },
  {
    label: "Teacher Performance",
    href: "/dashboard/director/academic/teacher-performance",
    icon: UserCheck,
    note: "Monitor class delivery and faculty follow-up signals.",
  },
  {
    label: "Academic Reports",
    href: "/dashboard/director/academic/reports",
    icon: BookOpen,
    note: "Open attendance, assignment, exam and library reports.",
  },
  {
    label: "Calendar Monitor",
    href: "/dashboard/director/academic/calendar-monitor",
    icon: CalendarCheck,
    note: "Track missed classes, delayed classes and syllabus movement.",
  },
];

export default function DirectorAcademicDepartmentPage() {
  return (
    <DirectorLauncher
      eyebrow="Academics"
      title="Academic Control"
      description="Every academic service opens as a separate page. This keeps the Director view simple while preserving the full control system."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
