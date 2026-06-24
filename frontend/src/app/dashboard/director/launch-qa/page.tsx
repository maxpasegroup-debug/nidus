"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const qaGroups = [
  {
    title: "Director Control Room",
    icon: Building2,
    checks: [
      "Director login opens /dashboard/director without sidebar gap.",
      "Six command tiles are visible: Admissions, Academics, Students, Team, Finance and Reports.",
      "Every command tile opens a Director-owned workspace.",
      "Command center metrics use live dashboard, CRM, academy and finance APIs.",
    ],
  },
  {
    title: "Academics",
    icon: GraduationCap,
    checks: [
      "Programs & Courses shows the real Academy course ecosystem.",
      "Director can select a program and create a batch.",
      "Director can assign a teacher/trainer to a batch.",
      "Batch team board opens and shows tutors/students when available.",
      "Academic calendar can be planned and tracked with green/orange/red status.",
    ],
  },
  {
    title: "Administrative Officer",
    icon: ClipboardCheck,
    checks: [
      "Administrative Officer opens without session expiry.",
      "Batches load in the admission approval form.",
      "Administrative Officer can approve a learner account into a selected batch.",
      "Approved user sees assigned batch in the learner dashboard.",
    ],
  },
  {
    title: "HRM",
    icon: Users,
    checks: [
      "Director can create employee credentials.",
      "Quick profiles work for Teacher, Academic Head, Physical Trainer, Admission Staff, BDE and Administration.",
      "Team accounts are grouped by role and student accounts are grouped by batch.",
      "Password reset shows fresh credentials.",
      "Archive moves user into history instead of deleting.",
    ],
  },
  {
    title: "Exams",
    icon: BookOpen,
    checks: [
      "Director Exam Command opens.",
      "Question Bank opens.",
      "Create Exam opens.",
      "Published Exams opens.",
      "Student dashboard shows assigned exams only when published to their batch.",
    ],
  },
  {
    title: "Materials",
    icon: BadgeCheck,
    checks: [
      "Materials Control opens from Director dashboard.",
      "Real batches load in the material draft form.",
      "Only published material records are displayed.",
      "Storage connection can be added later without changing the Director workflow.",
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    checks: [
      "Director Reports opens without session expiry.",
      "Admissions, Academics, Students, Team, Finance and Learning report lanes load.",
      "Launch readiness rows use live records.",
      "Action list routes to the correct Director workspace.",
    ],
  },
  {
    title: "Build And Deployment",
    icon: ShieldCheck,
    checks: [
      "Frontend build passes.",
      "Backend build passes.",
      "Frontend lint passes.",
      "Prisma schema validates.",
      "Railway migrations deploy successfully.",
    ],
  },
];

const quickLinks = [
  { title: "Director Control Room", href: "/dashboard/director", icon: Building2 },
  { title: "Academic Department", href: "/dashboard/director/academic", icon: GraduationCap },
  { title: "Administrative Officer", href: "/dashboard/admission-cell", icon: ClipboardCheck },
  { title: "Employee Control", href: "/dashboard/director/management", icon: Users },
  { title: "Exam Command", href: "/dashboard/director/exams", icon: BookOpen },
  { title: "Materials Control", href: "/dashboard/director/materials", icon: BadgeCheck },
  { title: "Finance", href: "/dashboard/director/accounts", icon: ShieldCheck },
  { title: "Reports", href: "/dashboard/director/reports", icon: BarChart3 },
];

export default function DirectorLaunchQaPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Launch QA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Director launch readiness checklist</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Use this page before launch to verify every Director module opens, every workflow is safe, and only live records are shown.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <QuickLink key={link.title} link={link} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {qaGroups.map((group) => (
            <QaCard key={group.title} group={group} />
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black">Green signal rule</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Launch only after frontend build, backend build, lint, Prisma validation, migration deploy, and live Director
                login workflow pass without errors.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function QuickLink({ link }: { link: { title: string; href: string; icon: LucideIcon } }) {
  const Icon = link.icon;
  return (
    <Link
      className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
      href={link.href}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-lg font-black">{link.title}</h2>
      <span className="mt-4 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}

function QaCard({ group }: { group: { title: string; icon: LucideIcon; checks: string[] } }) {
  const Icon = group.icon;
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <h2 className="text-2xl font-black">{group.title}</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {group.checks.map((check) => (
          <div key={check} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
            <p className="text-sm leading-6 text-[var(--muted-blue)]">{check}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
