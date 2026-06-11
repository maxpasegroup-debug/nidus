import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const teacherMenu: NavItem[] = [
  { label: "Today", href: "/dashboard/teacher#today", icon: Bell },
  { label: "Classrooms", href: "/dashboard/teacher#classrooms", icon: Users },
  { label: "Exams", href: "/dashboard/teacher#exams", icon: ClipboardCheck },
  { label: "Assignments", href: "/dashboard/teacher#assignments", icon: FileText },
  { label: "Attendance", href: "/dashboard/teacher#attendance", icon: CheckCircle2 },
  { label: "Library", href: "/dashboard/teacher#library", icon: Library },
  { label: "Academic Calendar", href: "/dashboard/teacher#academic-calendar", icon: CalendarDays },
  { label: "Profile", href: "/dashboard/settings", icon: UserRound },
];

const academicHeadMenu: NavItem[] = [
  { label: "Teaching Profile", href: "/dashboard/teacher#teaching-profile", icon: GraduationCap },
  { label: "Academic Department", href: "/dashboard/director/academic", icon: LayoutDashboard },
  { label: "Today", href: "/dashboard/teacher#today", icon: Bell },
  { label: "Batches", href: "/dashboard/director/academic#batches", icon: BookOpen },
  { label: "Teacher Allocation", href: "/dashboard/director/academic#teacher-allocation", icon: Users },
  { label: "Timetable", href: "/dashboard/director/academic#calendar", icon: CalendarDays },
  { label: "Syllabus Tracker", href: "/dashboard/director/academic#tracker", icon: BarChart3 },
  { label: "Exam Approval", href: "/dashboard/teacher#exams", icon: ClipboardCheck },
  { label: "Student Progress", href: "/dashboard/director/academic#batches", icon: ShieldCheck },
  { label: "Reports", href: "/performance-analytics", icon: FileText },
  { label: "Profile", href: "/dashboard/settings", icon: UserRound },
];

const directorMenu: NavItem[] = [
  { label: "Management", href: "/dashboard/director", icon: LayoutDashboard },
  { label: "Employee Control", href: "/dashboard/director/management", icon: Users },
  { label: "Academy", href: "/programs", icon: GraduationCap },
  { label: "Academic Department", href: "/dashboard/director/academic", icon: BookOpen },
  { label: "Admissions", href: "/dashboard/admission-cell", icon: ClipboardCheck },
  { label: "TOPRANK", href: "/dashboard/toprank", icon: ShieldCheck },
  { label: "NIDUS Guru", href: "/dashboard/guru", icon: Sparkles },
  { label: "Assessments", href: "/psychometric/reports", icon: BarChart3 },
  { label: "Sales Booster", href: "/dashboard/sales-booster", icon: Megaphone },
  { label: "Finance", href: "/payments", icon: WalletCards },
  { label: "Team", href: "/staff-hr", icon: Users },
  { label: "Reports", href: "/performance-analytics", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const admissionMenu: NavItem[] = [
  { label: "Admission Cell", href: "/dashboard/admission-cell", icon: ClipboardCheck },
  { label: "Enquiries", href: "/crm/leads", icon: Bell },
  { label: "Admissions", href: "/crm/admissions", icon: GraduationCap },
  { label: "Counselling", href: "/crm/counselling", icon: Users },
  { label: "Follow Ups", href: "/crm/followups", icon: CalendarDays },
  { label: "Profile", href: "/dashboard/settings", icon: UserRound },
];

const studentMenu: NavItem[] = [
  { label: "My Journey", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Classes", href: "/dashboard/student#classes", icon: BookOpen },
  { label: "Exams", href: "/dashboard/student#exams", icon: ClipboardCheck },
  { label: "Assignments", href: "/dashboard/student#assignments", icon: FileText },
  { label: "Library", href: "/dashboard/student#library", icon: Library },
  { label: "Academic Calendar", href: "/dashboard/student#academic-calendar", icon: CalendarDays },
  { label: "Digital Profile", href: "/digital-profile", icon: UserRound },
];

const guestMenu: NavItem[] = [
  { label: "My Journey", href: "/dashboard/guest", icon: LayoutDashboard },
  { label: "Assessments", href: "/psychometric", icon: BarChart3 },
  { label: "Academy Programs", href: "/programs", icon: GraduationCap },
  { label: "TOPRANK", href: "/dashboard/toprank", icon: ShieldCheck },
  { label: "NIDUS Guru", href: "/dashboard/guru", icon: Sparkles },
  { label: "Digital Profile", href: "/digital-profile", icon: UserRound },
];

export function getNavItems(role?: string | null, dashboardTemplate?: string | null): NavItem[] {
  if (role === "DIRECTOR") return directorMenu;
  if (role === "ADMIN" && dashboardTemplate === "ADMISSION_CELL") return admissionMenu;
  if (role === "ADMIN") return directorMenu;
  if (role === "TEACHER" && dashboardTemplate === "ACADEMIC_HEAD") return academicHeadMenu;
  if (role === "TEACHER") return teacherMenu;
  if (role === "STUDENT") return studentMenu;
  return guestMenu;
}
