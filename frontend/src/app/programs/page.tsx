"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Dumbbell, GraduationCap, Landmark, Medal, MessageCircle, Plane, Radar, ShieldCheck, Target, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicCta, PublicMetricPanel, PublicNextStepBand, PublicSectionIntro } from "@/components/marketing/public-branding";

const programCategories: Array<{
  title: string;
  subtitle: string;
  idealFor: string;
  outcomes: string[];
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "NDA Integrated Program",
    subtitle: "Academic, physical, mindset, and officer-readiness training for future NDA aspirants.",
    idealFor: "Plus One, Plus Two, repeaters, and early defence aspirants",
    outcomes: ["Maths and GAT discipline", "physical routine", "officer mindset"],
    icon: ShieldCheck,
    tone: "from-[#263a8f] via-[#324e9e] to-[#c9a646]"
  },
  {
    title: "CDS & AFCAT Track",
    subtitle: "Graduation-level defence entrance preparation with aptitude, English, GK, and interview readiness.",
    idealFor: "Degree students and graduates",
    outcomes: ["exam strategy", "career direction", "SSB readiness"],
    icon: Plane,
    tone: "from-[#111827] via-[#354258] to-[#d6b85c]"
  },
  {
    title: "SSB Officer Mission",
    subtitle: "A focused personality, psychology, communication, and leadership preparation system.",
    idealFor: "Screened-in candidates, repeaters, and serious officer aspirants",
    outcomes: ["OLQ clarity", "interview confidence", "group task behaviour"],
    icon: MessageCircle,
    tone: "from-[#172033] via-[#52605a] to-[#d7c078]"
  },
  {
    title: "Foundation Defence Campus",
    subtitle: "A long-term defence foundation combining school support, discipline, and career orientation.",
    idealFor: "Class 8 to Plus Two students",
    outcomes: ["early discipline", "academic base", "career clarity"],
    icon: GraduationCap,
    tone: "from-[#1f2d26] via-[#607452] to-[#eadfba]"
  },
  {
    title: "AISSEE & RIMC Preparation",
    subtitle: "Structured school-level defence entrance preparation with confidence and interview support.",
    idealFor: "Sainik School, RMS, and RIMC aspirants",
    outcomes: ["concept strength", "practice tests", "parent visibility"],
    icon: Landmark,
    tone: "from-[#1d2430] via-[#566779] to-[#dcc47a]"
  },
  {
    title: "Physical & Leadership Training",
    subtitle: "Ground training for stamina, posture, confidence, team behaviour, and disciplined execution.",
    idealFor: "All academy students and defence aspirants",
    outcomes: ["fitness habit", "energy", "leadership presence"],
    icon: Dumbbell,
    tone: "from-[#13231c] via-[#52715a] to-[#d9c27b]"
  }
];

const pathwayStrip: Array<{ label: string; icon: LucideIcon }> = [
  { label: "NDA", icon: ShieldCheck },
  { label: "CDS", icon: Medal },
  { label: "AFCAT", icon: Plane },
  { label: "SSB", icon: Users },
  { label: "AISSEE", icon: BookOpenCheck },
  { label: "RIMC", icon: Landmark },
  { label: "INET", icon: Radar }
];

const heroMetrics: Array<[string, string]> = [
  ["Entrance", "academic command"],
  ["SSB", "officer qualities"],
  ["PT", "physical discipline"],
  ["Profile", "assessment map"]
];

export default function ProgramsPage() {
  return (
    <div className="bg-[#f6f7fb] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.18),transparent_28rem),radial-gradient(circle_at_84%_20%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_28rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Defence Career Programs</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] text-[#111827] sm:text-7xl">Choose your mission. Train for your future in uniform.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">NIDUS Academy organizes defence preparation into clear pathways for entrance exams, SSB, foundation training, physical discipline, and leadership growth.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicCta href="#program-categories">
                Explore Programs <ArrowRight className="h-4 w-4" />
              </PublicCta>
              <PublicCta href="/join" variant="secondary">
                Join NIDUS
              </PublicCta>
            </div>
          </motion.div>
          <PublicMetricPanel eyebrow="Integrated Campus" title="Entrance + SSB + Fitness + Mindset" metrics={heroMetrics} />
        </div>
      </section>

      <section className="border-y border-[#263a8f]/10 bg-white/75 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {pathwayStrip.map(({ label, icon: Icon }) => (
            <Link key={label} href="#program-categories" className="flex items-center justify-center gap-2 rounded border border-[#263a8f]/10 bg-white px-4 py-3 text-sm font-semibold text-[#263a8f] transition hover:-translate-y-0.5 hover:border-[#c9a646]/60 hover:text-[#111827]">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section id="program-categories" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSectionIntro eyebrow="Program Categories" title="Simple paths for serious aspirants." text="This is the current public program architecture. We can add exact batches, fees, schedules, and duration once the final program plan is shared." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {programCategories.map(({ title, subtitle, idealFor, outcomes, icon: Icon, tone }, index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -5 }} className="overflow-hidden rounded-[1.25rem] border border-[#263a8f]/10 bg-white shadow-[0_24px_70px_rgba(19,35,72,0.09)]">
                <div className={`relative aspect-[16/8] bg-gradient-to-br ${tone}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.42),transparent_10rem),linear-gradient(0deg,rgba(0,0,0,0.34),transparent)]" />
                  <div className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/30 bg-white/16 text-white backdrop-blur-xl">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-7 text-[#536072]">{subtitle}</p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f]">Ideal For</p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">{idealFor}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {outcomes.map((item) => (
                      <span key={item} className="rounded-full bg-[#263a8f]/7 px-3 py-1 text-xs font-semibold capitalize text-[#263a8f]">{item}</span>
                    ))}
                  </div>
                  <Link href="/join" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#263a8f]">
                    Apply for this path <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <PublicNextStepBand
        title="Need help choosing the right defence pathway?"
        text="The NIDUS AI Assistant can collect your basic details and connect you to the academy team on WhatsApp."
        primaryHref="/join"
        primaryLabel="Talk to Assistant"
        secondaryHref="/psychometric"
        secondaryLabel="Try Assessments"
      />
    </div>
  );
}
