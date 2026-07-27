"use client";

import { BarChart3, CalendarRange, ClipboardCheck, GraduationCap, ListChecks, UserCheck, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Programs",
    href: "/dashboard/academic-head/hod/programs",
    icon: GraduationCap,
    note: "Create, edit and publish academy program planners.",
  },
  {
    label: "Batches",
    href: "/dashboard/academic-head/hod/batches",
    icon: Users,
    note: "Create batches, manage running batches and archive old batches.",
  },
  {
    label: "Students",
    href: "/dashboard/academic-head/students",
    icon: UserCheck,
    note: "Add students, update details, reset PINs and move students between batches.",
  },
  {
    label: "Planner",
    href: "/dashboard/academic-head/hod/timetable",
    icon: CalendarRange,
    note: "Manage timetable and class schedule execution.",
  },
  {
    label: "Faculty",
    href: "/dashboard/academic-head/hod/teacher-allocation",
    icon: ClipboardCheck,
    note: "Assign teachers and review faculty allocation.",
  },
  {
    label: "Reports",
    href: "/dashboard/academic-head/hod/reports",
    icon: BarChart3,
    note: "Review batch, attendance, exam and syllabus reports.",
  },
  {
    label: "Today",
    href: "/dashboard/academic-head",
    icon: ListChecks,
    note: "Return to today's academic work and pending actions.",
  },
];

export default function AcademicHeadHodPage() {
  return (
    <DirectorLauncher
      eyebrow="Academic Head"
      title="Academic Control"
      description="Simple academic execution: programs, batches, students, planner, faculty and reports."
      tiles={tiles}
      backHref="/dashboard/academic-head"
    />
  );
}
