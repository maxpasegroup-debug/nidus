"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Programs",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
    note: "View programs, fees and course status in one compact list.",
  },
  {
    label: "Batches",
    href: "/dashboard/director/academic/batches",
    icon: Users,
    note: "Create, edit and monitor active academy batches.",
  },
  {
    label: "Teacher Allocation",
    href: "/dashboard/director/academic/teachers",
    icon: UserCheck,
    note: "Assign existing teachers to batches and subjects.",
  },
  {
    label: "Timetable",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
    note: "Plan classes and verify teacher schedule delivery.",
  },
  {
    label: "Syllabus & Progress",
    href: "/dashboard/director/academic/syllabus",
    icon: BarChart3,
    note: "Track syllabus completion and student progress signals.",
  },
  {
    label: "Academic Reports",
    href: "/dashboard/director/academic/reports",
    icon: BookOpen,
    note: "Open attendance, assignment, exam and library reports.",
  },
];

export default function DirectorAcademicDepartmentPage() {
  return (
    <DirectorLauncher
      eyebrow="Academics"
      title="Academic Control"
      description="Six simple academic controls: programs, batches, timetable, teacher allocation, syllabus progress and reports."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
