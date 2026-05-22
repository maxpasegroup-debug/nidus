"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ClipboardCheck, Compass, HeartPulse, ShieldCheck, Sparkles, Target, Trophy, Users } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { PublicCta, PublicFeatureCard, PublicMetricPanel, PublicNextStepBand, PublicSectionIntro } from "@/components/marketing/public-branding";

const categories = [
  {
    title: "Officer & Defence Readiness",
    subtitle: "Core officer mindset, OLQ, SSB psychology, and defence mentality signals.",
    ids: ["officer-readiness", "olq-analyzer", "defence-mindset-scan", "ssb-psychology-simulator"],
    icon: ShieldCheck
  },
  {
    title: "Career & Branch Fit",
    subtitle: "Help students understand pathway suitability, ambition, and future direction.",
    ids: ["defence-career-fit", "future-readiness"],
    icon: Compass
  },
  {
    title: "Leadership & Personality",
    subtitle: "Command style, confidence, communication, influence, and group behaviour.",
    ids: ["leadership-dna", "confidence-index", "command-communication", "teamwork-group-dynamics"],
    icon: Trophy
  },
  {
    title: "Discipline, Focus & Emotional Strength",
    subtitle: "Habit discipline, attention, emotional control, physical mindset, and Guru-linked ambition.",
    ids: ["discipline-index", "focus-strength", "emotional-stability", "warrior-fitness-mindset", "dream-addiction-index"],
    icon: Target
  }
];

const stats: Array<[string, string]> = [
  ["15", "profile assessments"],
  ["5", "free entry tests"],
  ["4", "clear categories"],
  ["AI", "report ready"]
];

function accessStyle(access: string) {
  if (access === "FREE") return "border-[#c9a646]/30 bg-[#fff8dd] text-[#7c6418]";
  if (access === "PREMIUM") return "border-[#111827]/20 bg-[#111827] text-white";
  return "border-[#263a8f]/20 bg-[#263a8f]/7 text-[#263a8f]";
}

export default function PsychometricPage() {
  return (
    <div className="bg-[#f6f7fb] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.18),transparent_30rem),radial-gradient(circle_at_78%_20%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_28rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">NIDUS Assessment Lab</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] text-[#111827] sm:text-7xl">Defence psychology made simple, visual, and actionable.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">A clean assessment ecosystem for officer readiness, OLQ, discipline, focus, leadership, confidence, career fit, and NIDUS Guru transformation signals.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicCta href="#assessment-categories">
                Explore Assessments <ArrowRight className="h-4 w-4" />
              </PublicCta>
              <PublicCta href="/psychometric/reports" variant="secondary">
                My Reports
              </PublicCta>
            </div>
          </motion.div>
          <PublicMetricPanel eyebrow="Profile Engine" title="One student. Fifteen signals. One defence profile." metrics={stats} />
        </div>
      </section>

      <section id="assessment-categories" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSectionIntro eyebrow="Assessment Categories" title="Organized like a mission map, not a test dump." text="Each category has a clear purpose, visible access level, and report direction so students and parents understand what to take next." />
          <div className="mt-10 grid gap-6">
            {categories.map(({ title, subtitle, ids, icon: CategoryIcon }, index) => {
              const assessments = ids.map((id) => assessmentCatalog.find((assessment) => assessment.id === id)).filter(Boolean);
              return (
                <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }} className="rounded-[1.25rem] border border-[#263a8f]/10 bg-white p-5 shadow-[0_24px_70px_rgba(19,35,72,0.08)] sm:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#263a8f]/7 text-[#263a8f]">
                        <CategoryIcon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#536072]">{subtitle}</p>
                    </div>
                    <span className="rounded-full border border-[#c9a646]/25 bg-[#fff8dd] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7c6418]">{assessments.length} tests</span>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {assessments.map((assessment) => {
                      if (!assessment) return null;
                      const Icon = assessment.icon;
                      const href = "/join";
                      return (
                        <Link key={assessment.id} href={href} className="group rounded-lg border border-[#263a8f]/10 bg-[#f8fafc] p-4 transition hover:-translate-y-1 hover:border-[#c9a646]/50 hover:bg-white hover:shadow-[0_18px_42px_rgba(19,35,72,0.10)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#263a8f] shadow-sm">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-bold ${accessStyle(assessment.access)}`}>{assessment.access}</span>
                          </div>
                          <h4 className="mt-4 text-base font-semibold leading-tight">{assessment.title}</h4>
                          <p className="mt-2 min-h-16 text-xs leading-6 text-[#536072]">{assessment.subtitle}</p>
                          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#263a8f]">
                            Start assessment <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#111827] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          {[
            [BrainCircuit, "AI report ready", "Designed for deeper interpretation and counselling."],
            [ClipboardCheck, "Progress connected", "Feeds the digital profile and growth report."],
            [Sparkles, "Guru linked", "Focus and ambition tests connect to NIDUS Guru quests."],
            [HeartPulse, "Parent friendly", "Clear summaries for guidance and next actions."]
          ].map(([Icon, title, text]) => {
            const CardIcon = Icon as typeof BrainCircuit;
            return (
              <PublicFeatureCard key={String(title)} icon={CardIcon} title={String(title)} text={String(text)} />
            );
          })}
        </div>
      </section>
      <PublicNextStepBand
        title="Start with the right assessment path."
        text="Share your goal with the NIDUS AI Assistant and the team can guide you to free, core, or premium assessments."
        primaryHref="/join"
        primaryLabel="Get Assessment Guidance"
        secondaryHref="/guru"
        secondaryLabel="Explore NIDUS Guru"
      />
    </div>
  );
}
