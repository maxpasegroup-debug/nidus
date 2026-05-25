"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ClipboardCheck, GraduationCap, Rocket, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  RoleDashboardGuard
} from "@/components/dashboard";
import { assessmentCatalog, recommendedAssessmentPath } from "@/components/assessments/assessment-catalog";
import { academyMenuItems, guruRecordedQuests, topRankExams } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";
import { useGuestDashboard } from "@/hooks/use-dashboard";

const journeyModules = [
  {
    title: "TOPRANK",
    description: "Preview NDA training and understand how exam practice opens from the student dashboard.",
    href: "/toprank",
    icon: BrainCircuit,
    action: "Open TOPRANK"
  },
  {
    title: "NIDUS Guru",
    description: "Explore focus, discipline and personal transformation quests planned for students.",
    href: "/guru",
    icon: Sparkles,
    action: "Explore Quests"
  },
  {
    title: "Academy Programs",
    description: "See all defence programs and apply for the physical academy.",
    href: "/programs",
    icon: GraduationCap,
    action: "View Programs"
  },
  {
    title: "Assessments",
    description: "Start free readiness and personality assessments before choosing a path.",
    href: "/psychometric",
    icon: ClipboardCheck,
    action: "Start Assessment"
  },
  {
    title: "Apply Now",
    description: "Send your details for counselling, admission support and WhatsApp follow-up.",
    href: "/join",
    icon: Rocket,
    action: "Apply Now"
  },
  {
    title: "Profile",
    description: "Update your guest account details and password.",
    href: "/dashboard/settings",
    icon: UserRound,
    action: "Open Profile"
  }
];

const academyPreview = academyMenuItems.slice(0, 6);
const freeAssessmentPreview = recommendedAssessmentPath
  .map((id) => assessmentCatalog.find((assessment) => assessment.id === id))
  .filter((assessment): assessment is NonNullable<typeof assessment> => Boolean(assessment))
  .slice(0, 5);

export default function GuestDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useGuestDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="GUEST">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="GUEST">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  return (
    <RoleDashboardGuard role="GUEST">
      <motion.div className="space-y-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <section className="relative overflow-hidden rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#b9913f]/16 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">My Journey</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">
                Start your NIDUS journey as a guest.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#40516a]">
                Explore academy programs, try free assessments, preview TOPRANK and NIDUS Guru, then apply to the physical academy when you are ready.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/join">Apply Now <ArrowRight className="h-4 w-4" /></Button>
                <Button href="/psychometric" variant="secondary">Start Free Assessment</Button>
              </div>
            </div>
            <div className="rounded-lg border border-[#071d36]/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] backdrop-blur-xl">
              <ShieldCheck className="h-7 w-7 text-[#b9913f]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Guest access is active</h2>
              <div className="mt-5 grid gap-3 text-sm">
                <StatusRow label="Free assessments" value="Available" />
                <StatusRow label="Academy application" value="Available" />
                <StatusRow label="Full student reports" value="After upgrade" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journeyModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.title} href={module.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-[#f7f3ea] text-[#b9913f]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#071d36]">{module.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{module.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                      {module.action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel eyebrow="TOPRANK" title="NDA training preview">
            <div className="grid gap-3">
              {topRankExams.slice(0, 4).map((exam) => (
                <Link key={exam.slug} href={exam.href} className="flex items-center justify-between gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 text-sm font-semibold text-[#071d36] transition hover:border-[#b9913f]/45 hover:bg-white">
                  <span>{exam.title}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-[#3f4a32]">{exam.status === "live" ? "NDA live" : "Preview"}</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#64748b]">NDA launches through the student dashboard after login. Other arenas are prepared as guided previews.</p>
          </Panel>

          <Panel eyebrow="NIDUS Guru" title="Transformation quests">
            <div className="grid gap-3">
              {guruRecordedQuests.map((quest) => (
                <Link key={quest.slug} href={quest.href} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 transition hover:border-[#b9913f]/45 hover:bg-white">
                  <p className="text-sm font-semibold text-[#071d36]">{quest.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{quest.subtitle}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel eyebrow="Academy Programs" title="Choose the right defence path">
            <div className="grid gap-3 sm:grid-cols-2">
              {academyPreview.map(([label, href]) => (
                <Link key={label} href={href} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 text-sm font-semibold text-[#071d36] transition hover:border-[#b9913f]/45 hover:bg-white">
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <Button href="/programs" variant="secondary">View All Programs</Button>
            </div>
          </Panel>

          <Panel eyebrow="Assessments" title="Start with free profile tests">
            <div className="grid gap-3 sm:grid-cols-2">
              {freeAssessmentPreview.map((assessment) => (
                <Link key={assessment.id} href={`/psychometric/${assessment.id}`} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 transition hover:border-[#b9913f]/45 hover:bg-white">
                  <p className="text-sm font-semibold text-[#071d36]">{assessment.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{assessment.subtitle}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-[#071d36] p-6 text-white shadow-[0_24px_80px_rgba(7,29,54,0.18)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e7c873]">Next Step</p>
              <h2 className="mt-3 text-3xl font-semibold">Ready for physical academy admission?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Submit your details. NIDUS support will contact you for program guidance, counselling and admission support.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/join">Apply Now</Button>
              <Button href="/start-free" variant="secondary">Start Free</Button>
            </div>
          </div>
        </section>

        {data.featuredCourses.length === 0 ? (
          <EmptyState title="No featured courses" description="Academy course previews will appear here soon." />
        ) : null}
      </motion.div>
    </RoleDashboardGuard>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-[#071d36]/10 bg-white px-3 py-2">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-semibold text-[#071d36]">{value}</span>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
