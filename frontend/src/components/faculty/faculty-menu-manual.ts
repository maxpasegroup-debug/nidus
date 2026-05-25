export type FacultyMenuManualItem = {
  menu: string;
  href: string;
  facilities: string;
  benefits: string;
};

export const facultyMenuManual: FacultyMenuManualItem[] = [
  {
    menu: "Dashboard",
    href: "/dashboard/teacher",
    facilities: "Daily overview, assigned subjects, class score, attendance, pending reviews, AI recommendations, and quick actions.",
    benefits: "Works as the faculty command center for the day."
  },
  {
    menu: "My Classes",
    href: "/courses",
    facilities: "Assigned batches, subjects, syllabus flow, class resources, and course progress.",
    benefits: "Helps faculty manage teaching responsibility batch by batch."
  },
  {
    menu: "Students",
    href: "/performance-analytics",
    facilities: "Student performance view, weak-student alerts, progress signals, attendance concerns, and learning patterns.",
    benefits: "Helps identify who needs academic support or counselling follow-up."
  },
  {
    menu: "Attendance",
    href: "/discipline",
    facilities: "Attendance tracking, absence patterns, discipline records, and participation visibility.",
    benefits: "Keeps classroom discipline and daily monitoring systematic."
  },
  {
    menu: "Timetable",
    href: "/sessions",
    facilities: "Daily sessions, class schedules, upcoming live sessions, and planned teaching slots.",
    benefits: "Gives faculty a clear daily and weekly work plan."
  },
  {
    menu: "Study Materials",
    href: "/media-library",
    facilities: "Upload and manage PDFs, notes, videos, answer keys, training material, and class resources.",
    benefits: "Makes learning material available to students in an organized way."
  },
  {
    menu: "Assignments",
    href: "/documents",
    facilities: "Assignment files, submission material, worksheets, circulars, and academic documents.",
    benefits: "Supports practice, homework, accountability, and review."
  },
  {
    menu: "CBT & Tests",
    href: "/tests",
    facilities: "Create, monitor, and review computer-based tests, practice tests, attempts, and marks.",
    benefits: "Keeps evaluation and exam preparation consistent."
  },
  {
    menu: "Question Bank",
    href: "/pyq-bank",
    facilities: "Previous questions, reusable practice questions, topic-wise question access, and exam resources.",
    benefits: "Helps faculty prepare better tests and revision sessions."
  },
  {
    menu: "Live Classes",
    href: "/live-classes",
    facilities: "Schedule, start, and manage online classes and hybrid sessions.",
    benefits: "Supports remote teaching and continuity when students are away."
  },
  {
    menu: "Performance Analytics",
    href: "/performance-analytics",
    facilities: "Class performance, student trends, weak areas, score patterns, and intervention signals.",
    benefits: "Turns student data into clear academic action."
  },
  {
    menu: "Psychometric Reports",
    href: "/psychometric/reports",
    facilities: "Assessment reports, readiness scores, OLQ signals, confidence, discipline, focus, and counselling insights.",
    benefits: "Helps faculty mentor students beyond marks."
  },
  {
    menu: "NIDUS Guru",
    href: "/guru",
    facilities: "Transformation quests, focus missions, discipline routines, confidence missions, and growth pathways.",
    benefits: "Supports student mindset, habits, and personal transformation."
  },
  {
    menu: "Communication Center",
    href: "/messages",
    facilities: "Student messages, parent updates, internal communication, and follow-up conversations.",
    benefits: "Keeps communication organized and traceable."
  },
  {
    menu: "Tasks & Approvals",
    href: "/operations-hub",
    facilities: "Assigned work, approval requests, operational actions, and pending responsibilities.",
    benefits: "Improves accountability and internal workflow clarity."
  },
  {
    menu: "Events & Camps",
    href: "/announcements",
    facilities: "Camp notices, event updates, training programs, workshops, and institutional announcements.",
    benefits: "Keeps faculty aligned with academy activities."
  },
  {
    menu: "Leave Management",
    href: "/staff-hr",
    facilities: "Leave requests, staff records, attendance-related HR flow, and approval visibility.",
    benefits: "Makes faculty leave and HR coordination systematic."
  },
  {
    menu: "Doubt Support",
    href: "/ai-doubt-solver",
    facilities: "Student doubts, AI-supported explanations, faculty guidance, and concept clarification.",
    benefits: "Helps faculty support students faster and more consistently."
  },
  {
    menu: "Counselling Notes",
    href: "/progress-reports",
    facilities: "Academic observations, progress notes, intervention records, and mentor follow-up summaries.",
    benefits: "Creates a structured memory of student support and counselling actions."
  },
  {
    menu: "My Reports",
    href: "/progress-reports",
    facilities: "Faculty-facing reports, class outcomes, student progress summaries, and review material.",
    benefits: "Helps faculty understand their impact and prepare review meetings."
  },
  {
    menu: "Profile & Settings",
    href: "/dashboard/settings",
    facilities: "Password change, account security, profile settings, and faculty application user manual.",
    benefits: "Helps faculty manage account access and understand the platform."
  }
];

export function facultyManualText() {
  const header = "NIDUS Faculty Application User Manual";
  const rows = facultyMenuManual.map((item, index) => (
    `${index + 1}. ${item.menu}\nFacilities: ${item.facilities}\nBenefits/Uses: ${item.benefits}\nPath: ${item.href}`
  ));
  return `${header}\n\n${rows.join("\n\n")}\n`;
}
