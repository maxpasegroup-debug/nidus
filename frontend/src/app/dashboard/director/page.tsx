"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  MonitorPlay,
  Plus,
  Settings,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { DashboardError, DashboardSkeleton, RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useDirectorDashboard } from "@/hooks/use-dashboard";

type IconType = typeof GraduationCap;

type ControlModule = {
  title: string;
  description: string;
  href: string;
  icon: IconType;
  action: string;
  status?: "green" | "orange" | "red";
};

type ControlRoom = {
  title: string;
  purpose: string;
  href: string;
  icon: IconType;
  tone: string;
  modules: ControlModule[];
};

const statusStyles = {
  green: "bg-[#edf7ee] text-[#2f6b3f] border-[#9bc7a0]",
  orange: "bg-[#fff7de] text-[#8a6426] border-[#e7c873]",
  red: "bg-[#fff2ec] text-[#9f341f] border-[#efb099]"
};

const controlRooms: ControlRoom[] = [
  {
    title: "Academic Planning",
    purpose: "Plan programs, batches, schedules, subjects, teachers, tests and academic calendar. Academic Heads and teachers receive this ready-made plan.",
    href: "/programs",
    icon: GraduationCap,
    tone: "bg-[#fff7de]",
    modules: [
      { title: "Programs & Courses", description: "Add and manage all academy programs, online courses and recorded programs.", href: "/programs", icon: BookOpenCheck, action: "Manage", status: "green" },
      { title: "Batches", description: "Create batches, connect students, and prepare regular or crash-course groups.", href: "/courses", icon: UsersRound, action: "Plan", status: "green" },
      { title: "Class Schedule", description: "Plan class days, class time, online/offline mode and weekly structure.", href: "/live-classes", icon: CalendarDays, action: "Schedule", status: "orange" },
      { title: "Timetable", description: "Prepare weekly timetable for each batch and send it to Academic Heads and teachers.", href: "/sessions", icon: ClipboardCheck, action: "Organize", status: "orange" },
      { title: "Subject Allocation", description: "Decide subjects, topic ownership and teacher responsibility.", href: "/staff-hr", icon: GraduationCap, action: "Allocate", status: "green" },
      { title: "Test Planner", description: "Plan weekly mocks, quick tests, topic tests and paper analysis days.", href: "/tests", icon: FileText, action: "Plan", status: "orange" }
    ]
  },
  {
    title: "Team & Performance",
    purpose: "Oversee academic heads, teachers, physical trainers, syllabus completion, class progress and red/orange/green alerts.",
    href: "/staff-hr",
    icon: UsersRound,
    tone: "bg-[#edf7ee]",
    modules: [
      { title: "Academic Heads", description: "Review academic coordination, batch supervision and pending academic decisions.", href: "/staff-hr", icon: UsersRound, action: "Review", status: "green" },
      { title: "Teachers", description: "Check teacher allocation, teaching load, classes handled and reports submitted.", href: "/staff-hr", icon: GraduationCap, action: "Oversee", status: "green" },
      { title: "Physical Trainers", description: "Review PT schedule, attendance, eligibility and fitness readiness.", href: "/fitness/pt-schedule", icon: ShieldCheck, action: "Track", status: "orange" },
      { title: "Syllabus Progress", description: "Track completed, delayed and pending topics by batch and subject.", href: "/performance-analytics", icon: BarChart3, action: "Track", status: "orange" },
      { title: "Class Completion", description: "See completed classes, missed classes and reschedule requirements.", href: "/live-classes", icon: MonitorPlay, action: "Monitor", status: "green" },
      { title: "Performance Alerts", description: "Green means on track, orange means delayed, red means urgent attention.", href: "/progress-reports", icon: ClipboardCheck, action: "Review", status: "red" }
    ]
  },
  {
    title: "Admissions & Marketing",
    purpose: "Oversee campaigns, leads, counselling, applications, fee verification and batch-wise admission movement.",
    href: "/crm",
    icon: Megaphone,
    tone: "bg-[#eef5ff]",
    modules: [
      { title: "Sales Booster", description: "Review marketing campaigns for Academy, TOPRANK, Guru and Assessments.", href: "/dashboard/marketing", icon: Megaphone, action: "Open", status: "green" },
      { title: "Lead Sources", description: "See enquiries from website, Facebook, Instagram, WhatsApp, YouTube and calls.", href: "/crm/leads", icon: UsersRound, action: "Track", status: "green" },
      { title: "Follow-ups", description: "Monitor pending calls, parent responses and counselling reminders.", href: "/crm/followups", icon: ClipboardCheck, action: "Monitor", status: "orange" },
      { title: "Counselling", description: "Track counselling sessions and interest level before admission.", href: "/crm/counselling", icon: CalendarDays, action: "Review", status: "orange" },
      { title: "Applications", description: "Check student applications, selected program and admission status.", href: "/crm/admissions", icon: FileText, action: "Approve", status: "green" },
      { title: "Batch Allocation", description: "Move confirmed admissions into the correct batch after approval.", href: "/courses", icon: UsersRound, action: "Allocate", status: "orange" }
    ]
  },
  {
    title: "Reports & Management",
    purpose: "Review final company reports, finance, users, roles, settings and pending approvals.",
    href: "/progress-reports",
    icon: Settings,
    tone: "bg-[#f7f3ea]",
    modules: [
      { title: "Daily Summary", description: "One-page company movement report for admissions, academics and finance.", href: "/progress-reports", icon: BarChart3, action: "Open", status: "green" },
      { title: "Finance", description: "Fees collected, pending fees, invoices, subscriptions and refunds.", href: "/payments", icon: BadgeIndianRupee, action: "Review", status: "green" },
      { title: "Admission Report", description: "Lead to admission conversion and batch-wise joining report.", href: "/crm/admissions", icon: FileText, action: "Report", status: "orange" },
      { title: "Academic Report", description: "Syllabus, classes, tests, attendance and student performance.", href: "/performance-analytics", icon: GraduationCap, action: "Report", status: "orange" },
      { title: "User Accounts", description: "Add, disable, delete and manage platform users.", href: "/admin-center/users", icon: UsersRound, action: "Manage", status: "green" },
      { title: "Roles & Settings", description: "Manage roles, permissions, branches, operations and audit logs.", href: "/admin-center", icon: Settings, action: "Control", status: "green" }
    ]
  }
];

export default function DirectorDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useDirectorDashboard();

  if (isLoading) return <RoleDashboardGuard role="DIRECTOR"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="DIRECTOR"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="DIRECTOR">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Director Dashboard"
          title="Plan. Assign. Track."
          description="A simple control room for academic planning, team performance, admissions, marketing, reports and management."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
        />

        <section className="grid gap-4 md:grid-cols-4">
          {controlRooms.map((room) => (
            <ControlRoomCard key={room.title} room={room} />
          ))}
        </section>

        <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Academic Flow</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#071d36]">Director plans, Academic Head coordinates, Teachers execute</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["Director", "Programs, batches, timetable, teacher allocation and test calendar are planned here."],
              ["Academic Head", "Receives the plan, checks completion, supports teachers and tracks syllabus."],
              ["Teachers", "See only assigned batches, timetable, classes, tests, attendance and reports."]
            ].map(([title, text], index) => (
              <div key={title} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071d36] text-xs font-bold text-[#e7c873]">{index + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-[#071d36]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#40516a]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {controlRooms.map((room) => (
            <section key={room.title} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#071d36]/10 ${room.tone}`}>
                    <room.icon className="h-6 w-6 text-[#071d36]" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Control Room</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#071d36]">{room.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#40516a]">{room.purpose}</p>
                  </div>
                </div>
                <Button href={room.href} variant="secondary">Open</Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {room.modules.map((module) => (
                  <ControlModuleCard key={`${room.title}-${module.title}`} module={module} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </motion.div>
    </RoleDashboardGuard>
  );
}

function ControlRoomCard({ room }: { room: ControlRoom }) {
  const Icon = room.icon;
  return (
    <Link href={room.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
      <div className={`grid h-14 w-14 place-items-center rounded-lg border border-[#071d36]/10 ${room.tone}`}>
        <Icon className="h-7 w-7 text-[#071d36]" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#071d36]">{room.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#40516a]">{room.purpose}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
        Open <Plus className="h-4 w-4 transition group-hover:rotate-90" />
      </span>
    </Link>
  );
}

function ControlModuleCard({ module }: { module: ControlModule }) {
  const Icon = module.icon;
  return (
    <Link href={module.href} className="group flex min-h-36 flex-col rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#b9913f]/45 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f7f3ea] text-[#071d36]">
          <Icon className="h-5 w-5" />
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[module.status ?? "green"]}`}>{module.action}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#071d36]">{module.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#40516a]">{module.description}</p>
      <p className="mt-auto pt-4 text-sm font-semibold text-[#071d36]">Add / Manage / Track</p>
    </Link>
  );
}
