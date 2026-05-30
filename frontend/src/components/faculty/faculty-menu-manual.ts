export type FacultyMenuManualItem = {
  menu: string;
  href: string;
  facilities: string;
  benefits: string;
};

export const facultyMenuManual: FacultyMenuManualItem[] = [
  {
    menu: "My Dashboard",
    href: "/dashboard/teacher",
    facilities: "Simple daily view for classes, attendance, pending tests, weak students, and important academic work.",
    benefits: "Helps teachers understand today's work without searching through many screens."
  },
  {
    menu: "Classes",
    href: "/live-classes",
    facilities: "Online classes, recorded classes, class schedule, uploaded recordings, and batch-wise class planning.",
    benefits: "Keeps live and recorded teaching in one easy place."
  },
  {
    menu: "Teachers",
    href: "/staff-hr",
    facilities: "Subject-wise teacher list, teacher workload, class coverage, pending approvals, and replacement planning.",
    benefits: "Helps Academic Heads manage faculty without technical complexity."
  },
  {
    menu: "Students",
    href: "/performance-analytics",
    facilities: "Batch-wise students, regular and crash course students, weak students, attendance issues, and performance alerts.",
    benefits: "Helps teachers quickly find students who need support."
  },
  {
    menu: "Exams & Tests",
    href: "/tests",
    facilities: "Create tests with timer, optional answers, MCQ or descriptive format, review AI-created questions, approve, and publish.",
    benefits: "Makes test creation easy while keeping teacher approval in control."
  },
  {
    menu: "Attendance",
    href: "/discipline",
    facilities: "Mark present, absent, or late. View daily attendance, batch attendance, and absence concerns.",
    benefits: "Keeps attendance work simple and fast."
  },
  {
    menu: "Assignments",
    href: "/documents",
    facilities: "Create homework, upload worksheets, review submissions, and track pending corrections.",
    benefits: "Keeps student practice and homework organized."
  },
  {
    menu: "Study Materials",
    href: "/media-library",
    facilities: "Upload notes, PDFs, answer keys, recorded lessons, and subject-wise resources.",
    benefits: "Makes learning material easy for students to find."
  },
  {
    menu: "NIDUS AI Professor",
    href: "/tests",
    facilities: "Chat-style teaching assistant for class plans, question creation, test drafts, weak-area review, and study notes.",
    benefits: "Teachers can ask in simple English and approve before anything is published."
  },
  {
    menu: "Reports",
    href: "/progress-reports",
    facilities: "Class reports, student progress, attendance reports, test reports, and downloadable summaries.",
    benefits: "Helps teachers and Academic Heads review performance clearly."
  },
  {
    menu: "Settings",
    href: "/dashboard/settings",
    facilities: "Profile, password, subject allocation, notification settings, and account support.",
    benefits: "Keeps account management simple."
  }
];

export function facultyManualText() {
  const header = "NIDUS Faculty Application User Manual";
  const rows = facultyMenuManual.map((item, index) => (
    `${index + 1}. ${item.menu}\nFacilities: ${item.facilities}\nBenefits/Uses: ${item.benefits}\nPath: ${item.href}`
  ));
  return `${header}\n\n${rows.join("\n\n")}\n`;
}
