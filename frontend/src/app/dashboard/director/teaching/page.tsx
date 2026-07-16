"use client";

import { BarChart3, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, ListChecks, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Classes",
    href: "/dashboard/director/teaching/classes",
    icon: GraduationCap,
    note: "Open live class rooms, batch classes and course-wise teaching view.",
  },
  {
    label: "Attendance",
    href: "/dashboard/director/teaching/attendance",
    icon: ListChecks,
    note: "Check attendance marking, daily presence and batch attendance flow.",
  },
  {
    label: "Assignments",
    href: "/dashboard/director/teaching/assignments",
    icon: ClipboardCheck,
    note: "Review homework, submissions, evaluation and pending assignment work.",
  },
  {
    label: "Library",
    href: "/dashboard/director/teaching/library",
    icon: BookOpen,
    note: "Control uploaded notes, recordings and study materials for batches.",
  },
  {
    label: "Exams",
    href: "/dashboard/director/teaching/exams",
    icon: BarChart3,
    note: "Open exam workflow from teacher-side delivery and student attempts.",
  },
  {
    label: "Academic Calendar",
    href: "/dashboard/director/teaching/academic-calendar",
    icon: CalendarDays,
    note: "View planned classes, academic events and class calendar movement.",
  },
  {
    label: "Students",
    href: "/dashboard/director/teaching/students",
    icon: Users,
    note: "Open learner list and batch-wise teaching progress signals.",
  },
];

export default function DirectorTeachingPage() {
  return (
    <DirectorLauncher
      eyebrow="Teaching Mode"
      title="Teaching Control"
      description="Director can enter any teaching workflow from one simple panel without changing the teacher system underneath."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
