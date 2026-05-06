import type { AuthRole } from "@/services/auth";

export const roleDashboardPath: Record<AuthRole, string> = {
  STUDENT: "/dashboard/student",
  PARENT: "/dashboard/parent",
  ADMIN: "/dashboard/admin",
  WARDEN: "/hostel",
  GUEST: "/dashboard/guest"
};

export const examCards = [
  { title: "NDA", subtitle: "National Defence Academy", metric: "24 modules" },
  { title: "CDS", subtitle: "Combined Defence Services", metric: "18 modules" },
  { title: "AFCAT", subtitle: "Air Force Common Admission Test", metric: "15 modules" },
  { title: "SSB", subtitle: "Interview readiness", metric: "12 drills" },
  { title: "AISSEE", subtitle: "Sainik School entrance", metric: "10 modules" },
  { title: "RIMC", subtitle: "Military college prep", metric: "8 modules" }
];

export const performanceData = [
  { label: "Jan", score: 62, attendance: 84 },
  { label: "Feb", score: 68, attendance: 88 },
  { label: "Mar", score: 73, attendance: 91 },
  { label: "Apr", score: 78, attendance: 93 },
  { label: "May", score: 84, attendance: 96 },
  { label: "Jun", score: 88, attendance: 94 }
];

export const revenueData = [
  { label: "Jan", score: 32, attendance: 72 },
  { label: "Feb", score: 38, attendance: 76 },
  { label: "Mar", score: 45, attendance: 81 },
  { label: "Apr", score: 53, attendance: 86 },
  { label: "May", score: 61, attendance: 89 },
  { label: "Jun", score: 69, attendance: 92 }
];

export const studentTimeline = [
  "Completed NDA mathematics mock test",
  "AI flagged physics revision priority",
  "Fitness drill streak reached 9 days",
  "Joined current affairs live briefing"
];

export const parentTimeline = [
  "Attendance improved by 4% this week",
  "Counsellor note added for SSB prep",
  "Monthly performance report generated",
  "Fee reminder acknowledged"
];

export const adminTimeline = [
  "18 new admissions this week",
  "AFCAT batch capacity reached 82%",
  "Hostel wing B occupancy updated",
  "Staff review meeting scheduled"
];

export const guestTimeline = [
  "New NDA crash course launched",
  "Free SSB demo video available",
  "AFCAT mock test window opened",
  "AISSEE orientation announced"
];
