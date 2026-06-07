"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  MonitorPlay,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { DashboardError, DashboardSkeleton, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useDirectorDashboard } from "@/hooks/use-dashboard";

type DirectorModule = {
  title: string;
  description: string;
  href: string;
  icon: typeof GraduationCap;
  metric?: string;
  action?: string;
};

type DirectorCategory = {
  title: string;
  subtitle: string;
  href: string;
  icon: typeof GraduationCap;
  tone: string;
  stat: string;
  modules: DirectorModule[];
};

const categories: DirectorCategory[] = [
  {
    title: "Academy",
    subtitle: "Offline, online, recorded classes, teachers and student progress.",
    href: "/dashboard/academy",
    icon: GraduationCap,
    tone: "bg-[#fff7de]",
    stat: "Programs",
    modules: [
      { title: "Offline Programs", description: "Manage physical academy batches and daily class flow.", href: "/programs", icon: Building2, action: "Manage" },
      { title: "Online Classes", description: "Schedule live classes and review online sessions.", href: "/live-classes", icon: MonitorPlay, action: "Open" },
      { title: "Recorded Classes", description: "Upload and organize recorded lessons for students.", href: "/recorded-lectures", icon: BookOpenCheck, action: "Manage" },
      { title: "Batches", description: "Create batches, assign students and link teachers.", href: "/courses", icon: UsersRound, action: "Manage" },
      { title: "Tests & Exams", description: "Review CBT, mock tests, quick tests and performance.", href: "/tests", icon: ClipboardCheck, action: "Review" },
      { title: "Performance", description: "Check student progress, weak areas and reports.", href: "/performance-analytics", icon: BarChart3, action: "Reports" }
    ]
  },
  {
    title: "Admissions",
    subtitle: "Enquiries, applications, counselling, fees, documents and approvals.",
    href: "/crm",
    icon: ClipboardCheck,
    tone: "bg-[#eef5ff]",
    stat: "Pipeline",
    modules: [
      { title: "New Enquiries", description: "Leads from website, calls, WhatsApp and campaigns.", href: "/crm/leads", icon: UsersRound, action: "Open" },
      { title: "Applications", description: "Review application forms and approve admission steps.", href: "/crm/admissions", icon: FileText, action: "Manage" },
      { title: "Counselling", description: "Track counselling bookings and parent discussions.", href: "/crm/counselling", icon: CalendarDays, action: "Schedule" },
      { title: "Follow-ups", description: "See pending calls and reminders.", href: "/crm/followups", icon: ClipboardCheck, action: "Track" },
      { title: "Fee Check", description: "Verify payments, receipts and pending amounts.", href: "/payments", icon: BadgeIndianRupee, action: "Verify" },
      { title: "Documents", description: "Check certificates, ID proof and admission files.", href: "/documents", icon: FileText, action: "Review" }
    ]
  },
  {
    title: "Marketing",
    subtitle: "Sales Booster, social campaigns, creatives, WhatsApp and lead performance.",
    href: "/dashboard/marketing",
    icon: Megaphone,
    tone: "bg-[#fff2ec]",
    stat: "Growth",
    modules: [
      { title: "Sales Booster", description: "Create campaigns with AI and submit for approval.", href: "/dashboard/marketing", icon: Sparkles, action: "Open" },
      { title: "Campaigns", description: "Review academy, TOPRANK, Guru and assessment campaigns.", href: "/dashboard/marketing", icon: Megaphone, action: "Manage" },
      { title: "Creatives", description: "Upload posters, videos, reels and brochures.", href: "/media-library", icon: MonitorPlay, action: "Upload" },
      { title: "Social Leads", description: "Track Facebook, Instagram, YouTube and WhatsApp leads.", href: "/crm/leads", icon: UsersRound, action: "Track" },
      { title: "WhatsApp Center", description: "Review broadcast follow-ups and counsellor routing.", href: "/messages", icon: ClipboardCheck, action: "Open" },
      { title: "Marketing Reports", description: "Check lead source, conversion and campaign results.", href: "/progress-reports", icon: BarChart3, action: "Reports" }
    ]
  },
  {
    title: "NIDUS Guru",
    subtitle: "Recorded transformation quests and personal growth programs.",
    href: "/dashboard/nidus-guru",
    icon: Sparkles,
    tone: "bg-[#f5efff]",
    stat: "Quests",
    modules: [
      { title: "Dream Addiction", description: "Transformation quest for ambition and distraction control.", href: "/guru/quests/dream-addiction", icon: Sparkles, action: "View" },
      { title: "Focus Reset", description: "Quest for focus, attention and digital discipline.", href: "/guru/quests/focus-reset", icon: ShieldCheck, action: "View" },
      { title: "Warrior Discipline", description: "Quest for routine, consistency and execution.", href: "/guru/quests/warrior-discipline", icon: ClipboardCheck, action: "View" },
      { title: "Active Learning", description: "Foundational quest that explains the NIDUS Guru method.", href: "/guru/quests/active-learning-transformation", icon: BookOpenCheck, action: "View" },
      { title: "Guru Admin", description: "Manage quests, progress and future releases.", href: "/admin-center/guru", icon: Settings, action: "Manage" },
      { title: "Engagement", description: "Review Guru users, completion and reports.", href: "/progress-reports", icon: BarChart3, action: "Reports" }
    ]
  },
  {
    title: "TOPRANK",
    subtitle: "AI-powered exam coaching and subscription training access.",
    href: "/dashboard/toprank",
    icon: ShieldCheck,
    tone: "bg-[#edf7ee]",
    stat: "Exam AI",
    modules: [
      { title: "Exam Arena", description: "Open NDA, CDS, AFCAT, Agniveer and practice paths.", href: "/toprank", icon: ShieldCheck, action: "Open" },
      { title: "NDA", description: "Review NDA training access and student readiness.", href: "/toprank/nda", icon: GraduationCap, action: "View" },
      { title: "Subscriptions", description: "Manage TOPRANK payment and 30-day access.", href: "/subscriptions", icon: BadgeIndianRupee, action: "Manage" },
      { title: "Practice Tests", description: "Review mock tests and practice cycles.", href: "/tests", icon: ClipboardCheck, action: "Review" },
      { title: "Bridge Status", description: "Check Career7/TOPRANK launch readiness.", href: "/dashboard/toprank", icon: Settings, action: "Check" },
      { title: "Reports", description: "View subscription, training and performance reports.", href: "/progress-reports", icon: BarChart3, action: "Reports" }
    ]
  },
  {
    title: "Assessments",
    subtitle: "Free and premium psychometric tests, reports and counselling signals.",
    href: "/dashboard/assessments",
    icon: FileText,
    tone: "bg-[#eff8f8]",
    stat: "Reports",
    modules: [
      { title: "Assessment Page", description: "View all free and premium assessments.", href: "/psychometric", icon: FileText, action: "Open" },
      { title: "Reports", description: "Review completed reports and PDF downloads.", href: "/psychometric/reports", icon: BarChart3, action: "Reports" },
      { title: "Assessment Admin", description: "Manage assessment status, questions and report flow.", href: "/psychometric/admin", icon: Settings, action: "Manage" },
      { title: "SSB Simulator", description: "Track premium SSB simulator usage.", href: "/psychometric/ssb-psychology-simulator", icon: ShieldCheck, action: "View" },
      { title: "Digital Profile", description: "See how reports connect to student profiles.", href: "/digital-profile", icon: UsersRound, action: "Open" },
      { title: "Counselling Signals", description: "Find students who need guidance after reports.", href: "/crm/counselling", icon: ClipboardCheck, action: "Track" }
    ]
  },
  {
    title: "Finance",
    subtitle: "Collections, pending fees, subscriptions, receipts and refunds.",
    href: "/payments",
    icon: BadgeIndianRupee,
    tone: "bg-[#fffdf8]",
    stat: "Revenue",
    modules: [
      { title: "Fee Collections", description: "View collected fees and payment records.", href: "/payments", icon: BadgeIndianRupee, action: "Open" },
      { title: "Pending Fees", description: "Track dues and follow-up requirements.", href: "/fees", icon: ClipboardCheck, action: "Track" },
      { title: "Invoices", description: "Review invoices and receipts.", href: "/invoices", icon: FileText, action: "Open" },
      { title: "Subscriptions", description: "Check TOPRANK and digital subscriptions.", href: "/subscriptions", icon: ShieldCheck, action: "Manage" },
      { title: "Refunds", description: "Review refund and cancellation policies.", href: "/refund-policy", icon: FileText, action: "Review" },
      { title: "Finance Report", description: "Open revenue and collection reports.", href: "/progress-reports", icon: BarChart3, action: "Reports" }
    ]
  },
  {
    title: "Team",
    subtitle: "Directors, academic heads, teachers, PT, admission cell and support staff.",
    href: "/staff-hr",
    icon: UsersRound,
    tone: "bg-[#f7f3ea]",
    stat: "Staff",
    modules: [
      { title: "Staff List", description: "Review all employee roles and departments.", href: "/staff-hr", icon: UsersRound, action: "Open" },
      { title: "Academic Heads", description: "Manage academic supervision and batch control.", href: "/dashboard/teacher", icon: GraduationCap, action: "Review" },
      { title: "Teachers", description: "Review classes, tests and subject activity.", href: "/staff-hr", icon: BookOpenCheck, action: "Manage" },
      { title: "Physical Training", description: "Review PT schedules, logs and eligibility.", href: "/fitness/pt-schedule", icon: ShieldCheck, action: "Open" },
      { title: "Admission Cell", description: "Open admission desk and application work.", href: "/dashboard/admin", icon: ClipboardCheck, action: "Open" },
      { title: "Student Support", description: "Review telecaller leads and follow-ups.", href: "/dashboard/telecaller", icon: UsersRound, action: "Open" }
    ]
  },
  {
    title: "Reports",
    subtitle: "Daily summary, academy, admission, finance, marketing and staff reports.",
    href: "/progress-reports",
    icon: BarChart3,
    tone: "bg-[#eef4ef]",
    stat: "Review",
    modules: [
      { title: "Daily Summary", description: "Check company-wide daily movement.", href: "/progress-reports", icon: BarChart3, action: "Open" },
      { title: "Admission Report", description: "Review leads, applications and joined students.", href: "/crm/admissions", icon: FileText, action: "Report" },
      { title: "Academy Report", description: "Review classes, tests and batch progress.", href: "/performance-analytics", icon: GraduationCap, action: "Report" },
      { title: "Marketing Report", description: "Review campaigns, leads and conversion.", href: "/dashboard/marketing", icon: Megaphone, action: "Report" },
      { title: "Finance Report", description: "Review fee collection and pending amounts.", href: "/payments", icon: BadgeIndianRupee, action: "Report" },
      { title: "Staff Report", description: "Review staff roles, activities and approvals.", href: "/staff-hr", icon: UsersRound, action: "Report" }
    ]
  },
  {
    title: "Management",
    subtitle: "Users, roles, permissions, branches, settings, approvals and audit logs.",
    href: "/admin-center",
    icon: Settings,
    tone: "bg-[#f1f5f9]",
    stat: "Control",
    modules: [
      { title: "Users", description: "Add, delete, disable and manage platform users.", href: "/admin-center/users", icon: UsersRound, action: "Manage" },
      { title: "Roles", description: "Manage staff roles and permission groups.", href: "/admin-center/roles", icon: ShieldCheck, action: "Manage" },
      { title: "Permissions", description: "Control who can access each module.", href: "/admin-center/permissions", icon: Settings, action: "Manage" },
      { title: "Branches", description: "Manage academy branches and centers.", href: "/admin-center/branches", icon: Building2, action: "Manage" },
      { title: "System Health", description: "Check backend, queues, Redis and deployment health.", href: "/admin-center/operations", icon: BarChart3, action: "Check" },
      { title: "Audit Logs", description: "Review system changes and important actions.", href: "/admin-center/audit-logs", icon: FileText, action: "Review" }
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
          title="Company control room"
          description="Simple thumbnails to manage Academy, Admissions, Marketing, NIDUS Guru, TOPRANK, Assessments, Finance, Team, Reports and Management."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.instituteAnalytics.students), label: "students" },
            { value: `${data.admissionsAnalytics.conversionRate}%`, label: "admission conversion" },
            { value: `Rs ${Math.round(data.revenueAnalytics.collected / 100000)}L`, label: "collected" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Admissions" value={`${data.admissionsAnalytics.admissions}/${data.admissionsAnalytics.leads}`} note="Joined students from enquiries" />
          <StatCard label="Academy" value={`${data.instituteAnalytics.attendance}%`} note="Average attendance" />
          <StatCard label="Faculty" value={`${data.facultyAnalytics.active}`} note={`${data.facultyAnalytics.reviewDue} reviews due`} />
          <StatCard label="Pending Fees" value={`Rs ${Math.round(data.revenueAnalytics.pending / 100000)}L`} note="Needs follow-up" />
        </section>

        <SectionHeader eyebrow="Main Categories" title="Tap a company area" action={`${categories.length} areas`} />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <DirectorCategoryCard key={category.title} category={category} />
          ))}
        </section>

        <SectionHeader eyebrow="Sub Modules" title="Manage services and activities" action="Add, manage, review" />
        <div className="space-y-6">
          {categories.map((category) => (
            <section key={category.title} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#071d36]/10 ${category.tone}`}>
                    <category.icon className="h-6 w-6 text-[#071d36]" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6426]">{category.stat}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#071d36]">{category.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#40516a]">{category.subtitle}</p>
                  </div>
                </div>
                <Button href={category.href} variant="secondary">Open {category.title}</Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {category.modules.map((module) => (
                  <DirectorModuleCard key={`${category.title}-${module.title}`} module={module} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </motion.div>
    </RoleDashboardGuard>
  );
}

function DirectorCategoryCard({ category }: { category: DirectorCategory }) {
  const Icon = category.icon;
  return (
    <Link href={category.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
      <div className={`grid h-14 w-14 place-items-center rounded-lg border border-[#071d36]/10 ${category.tone}`}>
        <Icon className="h-7 w-7 text-[#071d36]" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6426]">{category.stat}</p>
      <h3 className="mt-2 text-xl font-semibold text-[#071d36]">{category.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#40516a]">{category.subtitle}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
        Open area <Plus className="h-4 w-4 transition group-hover:rotate-90" />
      </span>
    </Link>
  );
}

function DirectorModuleCard({ module }: { module: DirectorModule }) {
  const Icon = module.icon;
  return (
    <Link href={module.href} className="group flex min-h-36 flex-col rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#b9913f]/45 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f7f3ea] text-[#071d36]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-[#b9913f]/25 bg-[#fff7de] px-3 py-1 text-xs font-semibold text-[#8a6426]">{module.action ?? "Open"}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#071d36]">{module.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#40516a]">{module.description}</p>
      <p className="mt-auto pt-4 text-sm font-semibold text-[#071d36]">Add / Delete / Manage</p>
    </Link>
  );
}
