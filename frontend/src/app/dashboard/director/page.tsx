"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileArchive,
  FileText,
  GraduationCap,
  KeyRound,
  Megaphone,
  MessageCircle,
  PieChart,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DirectorSubArea = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
};

type DirectorArea = {
  title: string;
  label: string;
  text: string;
  icon: LucideIcon;
  accent: string;
  subAreas: DirectorSubArea[];
};

const directorAreas: DirectorArea[] = [
  {
    title: "Academics",
    label: "Courses, batches and teaching",
    text: "Plan programs, assign teachers, prepare timetables and track syllabus progress.",
    icon: GraduationCap,
    accent: "from-amber-200 via-white to-emerald-100",
    subAreas: [
      { title: "Programs & Courses", text: "Manage Academy programs and course structure.", href: "/dashboard/director/academic#programs", icon: BookOpen },
      { title: "Batches", text: "Create offline, online, crash and foundation batches.", href: "/dashboard/director/academic#batches", icon: Users },
      { title: "Timetable Planner", text: "Plan weekly class schedules and teacher calendars.", href: "/dashboard/director/academic#calendar", icon: CalendarDays },
      { title: "Teacher Allocation", text: "Assign subject teachers and trainers to batches.", href: "/dashboard/director/academic#teacher-allocation", icon: UserCheck },
      { title: "Syllabus Tracker", text: "Track topic completion with green, orange and red status.", href: "/dashboard/director/academic#tracker", icon: BarChart3 },
      { title: "Exams & Tests", text: "Create, approve, publish and monitor exams.", href: "/dashboard/director/academic#exams", icon: ClipboardCheck },
      { title: "Study Materials", text: "Control notes, recorded classes and batch library.", href: "/dashboard/director/academic#materials", icon: FileArchive },
      { title: "Student Progress", text: "Review batch-wise and student-wise academic progress.", href: "/dashboard/director/academic#progress", icon: PieChart },
    ],
  },
  {
    title: "Admission Cell",
    label: "Enquiries to admissions",
    text: "Convert enquiries into students and assign them to the right batch.",
    icon: ClipboardCheck,
    accent: "from-sky-100 via-white to-amber-100",
    subAreas: [
      { title: "New Enquiries", text: "Website, WhatsApp, calls, social media and walk-in leads.", href: "/dashboard/admission-cell#enquiries", icon: MessageCircle },
      { title: "Applications", text: "Students who applied for Academy programs.", href: "/dashboard/admission-cell#applications", icon: FileText },
      { title: "Counselling", text: "Parent discussion, student needs and course suggestions.", href: "/dashboard/admission-cell#counselling", icon: Users },
      { title: "Admission Approval", text: "Approve application and activate student dashboard.", href: "/dashboard/admission-cell", icon: ShieldCheck },
      { title: "Fee Follow-Up", text: "Pending fee reminders and payment coordination.", href: "/dashboard/admission-cell#fees", icon: BadgeIndianRupee },
      { title: "Documents", text: "Student documents, ID proof and academic details.", href: "/dashboard/admission-cell#documents", icon: FileArchive },
      { title: "Admission Reports", text: "Course-wise admissions and conversion status.", href: "/dashboard/admission-cell#reports", icon: BarChart3 },
    ],
  },
  {
    title: "Advertisement & Marketing",
    label: "Campaigns and growth",
    text: "Run campaigns, manage creatives, track leads and marketing performance.",
    icon: Megaphone,
    accent: "from-orange-100 via-white to-green-100",
    subAreas: [
      { title: "Sales Booster", text: "AI campaign creation and marketing automation.", href: "/dashboard/sales-booster", icon: Sparkles },
      { title: "Campaigns", text: "Academy, TOPRANK, NIDUS Guru and assessment campaigns.", href: "/dashboard/sales-booster", icon: Megaphone },
      { title: "Creative Library", text: "Posters, videos, brochures and reels.", href: "/dashboard/sales-booster#creatives", icon: FileArchive },
      { title: "Social Media", text: "Facebook, Instagram, Threads and YouTube posting.", href: "/dashboard/sales-booster", icon: MessageCircle },
      { title: "WhatsApp Campaigns", text: "Bulk messages, templates and counsellor routing.", href: "/dashboard/sales-booster", icon: MessageCircle },
      { title: "Campaign Leads", text: "Track campaign-wise leads and source quality.", href: "/dashboard/sales-booster#leads", icon: UserPlus },
      { title: "Marketing Reports", text: "Reach, engagement, conversion and best creatives.", href: "/dashboard/sales-booster#reports", icon: BarChart3 },
    ],
  },
  {
    title: "HRM",
    label: "Employees and team",
    text: "Create employees, generate credentials, assign roles and archive safely.",
    icon: Users,
    accent: "from-emerald-100 via-white to-slate-100",
    subAreas: [
      { title: "Employee Control", text: "Add teachers, heads, trainers, admin and staff.", href: "/dashboard/director/management", icon: UserPlus },
      { title: "Credentials", text: "Generate login, reset password and manage access.", href: "/dashboard/director/management", icon: KeyRound },
      { title: "Roles & Departments", text: "Assign role, department, dashboard and access level.", href: "/dashboard/director/management", icon: ShieldCheck },
      { title: "Full-Time / Part-Time / Hourly", text: "Manage employment type and hourly trainers.", href: "/dashboard/director/management", icon: Users },
      { title: "Attendance & Leave", text: "Staff attendance, leave and approvals.", href: "/dashboard/director/management#attendance", icon: CalendarDays },
      { title: "Performance Review", text: "Class completion, student feedback and staff output.", href: "/dashboard/director/management#performance", icon: PieChart },
      { title: "Archive History", text: "Archive employees safely instead of deleting.", href: "/dashboard/director/management", icon: FileArchive },
    ],
  },
  {
    title: "Admin & Accounts",
    label: "Finance and operations",
    text: "Monitor payments, invoices, expenses, subscriptions, reports and system settings.",
    icon: WalletCards,
    accent: "from-slate-100 via-white to-amber-100",
    subAreas: [
      { title: "Fee Management", text: "Course fees, student payments and pending dues.", href: "/dashboard/director/accounts#fees", icon: BadgeIndianRupee },
      { title: "Invoices & Receipts", text: "Generate and track payment receipts.", href: "/dashboard/director/accounts#invoices", icon: ReceiptText },
      { title: "Expenses", text: "Office, salary, rent, marketing and operations.", href: "/dashboard/director/accounts#expenses", icon: CreditCard },
      { title: "Subscriptions", text: "TOPRANK, assessments and premium module subscriptions.", href: "/dashboard/director/accounts#subscriptions", icon: WalletCards },
      { title: "Reports", text: "Academic, admissions, marketing, finance and staff reports.", href: "/dashboard/director/accounts#reports", icon: BarChart3 },
      { title: "Settings", text: "Company details, contact number and system controls.", href: "/dashboard/director/accounts#settings", icon: Settings },
      { title: "Audit Logs", text: "Track important staff and management actions.", href: "/dashboard/director/accounts#audit", icon: FileText },
    ],
  },
];

export default function DirectorDashboardPage() {
  const [selectedArea, setSelectedArea] = useState<DirectorArea>(directorAreas[0]);
  const SelectedIcon = selectedArea.icon;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white/90 shadow-xl">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] md:block" />
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Command Room</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Manage the whole company from five clear areas.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
              A simple glossy control room for Academics, Admission Cell, Advertisement & Marketing, HRM, and Admin & Accounts.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {directorAreas.map((area) => {
            const Icon = area.icon;
            const active = selectedArea.title === area.title;
            return (
              <button
                key={area.title}
                className={`group min-h-56 rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  active ? "border-[var(--gold-border)] bg-white shadow-xl" : "border-[var(--border)] bg-white/80"
                }`}
                onClick={() => setSelectedArea(area)}
                type="button"
              >
                <div className={`rounded-2xl bg-gradient-to-br ${area.accent} p-4 shadow-inner`}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/70 shadow-sm">
                    <Icon className="h-7 w-7 text-[var(--navy)]" />
                  </div>
                  <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{area.label}</p>
                  <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">{area.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-blue)]">{area.text}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Selected Area</p>
              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedArea.accent} shadow-inner`}>
                  <SelectedIcon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedArea.title}</h2>
                  <p className="text-sm text-[var(--muted-blue)]">{selectedArea.text}</p>
                </div>
              </div>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              {selectedArea.subAreas.length} controls
            </span>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {selectedArea.subAreas.map((subArea) => (
              <SubAreaCard key={subArea.title} subArea={subArea} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function SubAreaCard({ subArea }: { subArea: DirectorSubArea }) {
  const Icon = subArea.icon;
  return (
    <Link
      className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
      href={subArea.href}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-inner">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--navy)]">{subArea.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{subArea.text}</p>
      <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}
