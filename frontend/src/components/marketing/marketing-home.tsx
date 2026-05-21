"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  GraduationCap,
  Landmark,
  Medal,
  MessageCircle,
  Plane,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Video
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const programs = [
  {
    title: "Foundation & Long-Term Programs",
    items: ["Mission 2028", "After Plus One", "Foundation NDA / Civil Services", "Yearly foundation plans"]
  },
  {
    title: "Defence Entrance & Academic Preparation",
    items: ["AISSEE", "RIMC", "NDA Crash Course", "CDS / AFCAT / INET"]
  },
  {
    title: "Specialized Modules",
    items: ["Agniveer Test Series", "Physical Test Training", "AFMC Preparation", "SSB Interview Guidance"]
  }
];

const pathways: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "NDA", href: "/courses", icon: ShieldCheck },
  { label: "CDS", href: "/courses", icon: Medal },
  { label: "AFCAT", href: "/courses", icon: Plane },
  { label: "SSB", href: "/courses", icon: MessageCircle },
  { label: "AISSEE", href: "/courses", icon: GraduationCap },
  { label: "RIMC", href: "/courses", icon: Landmark },
  { label: "INET", href: "/courses", icon: Radar }
];

const missionCards = [
  {
    title: "Officer Readiness",
    text: "Track your leadership, discipline, and defence preparation progress.",
    icon: ShieldCheck
  },
  {
    title: "SSB Mission",
    text: "Daily guidance for officer-like qualities and interview preparation.",
    icon: MessageCircle
  },
  {
    title: "NIDUS Guru",
    text: "Transform Your Mind. Transform Your Future. Quest-based missions for focus, confidence, and discipline.",
    icon: Sparkles
  }
];

const whyNidus: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Officer Mentorship", text: "Guidance shaped around discipline, character, and defence ambition.", icon: Medal },
  { title: "AI-Powered Learning", text: "Smarter study direction, test support, and progress insight.", icon: BrainCircuit },
  { title: "Physical & Leadership Training", text: "Build stamina, courage, teamwork, and daily structure.", icon: Dumbbell },
  { title: "Psychometric Analysis", text: "Understand readiness, confidence, focus, and personality signals.", icon: Radar },
  { title: "SSB Interview Preparation", text: "Practice communication, OLQs, story thinking, and group response.", icon: MessageCircle },
  { title: "Progress Tracking & CBT", text: "Measure tests, attendance, performance, and next actions.", icon: ClipboardCheck }
];

const guruQuests = ["Dream Addiction(TM)", "Student Power", "Life OS", "Warrior Discipline", "Focus Reset"];

const assessmentTiers = [
  {
    title: "Free Viral Assessments",
    text: "Built for signups, curiosity, sharing, and first counselling intent.",
    badge: "FREE",
    tone: "border-[#c9a646]/30 bg-[#fff8dd]/70 text-[#7c6418]"
  },
  {
    title: "Core Defence Assessments",
    text: "Deeper evaluation for OLQ, confidence, teamwork, emotion, and mindset.",
    badge: "CORE",
    tone: "border-[#263a8f]/20 bg-[#263a8f]/7 text-[#263a8f]"
  },
  {
    title: "Premium AI Reports",
    text: "Advanced SSB, interview, personality, and defence intelligence reports.",
    badge: "PREMIUM",
    tone: "border-[#111827]/20 bg-[#111827]/7 text-[#111827]"
  }
];

const assessmentCards: Array<{
  title: string;
  subtitle: string;
  badge: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
}> = [
  {
    title: "Officer Readiness Test(TM)",
    subtitle: "Discover whether you think, lead, and act like a future officer.",
    badge: "FLAGSHIP FREE",
    href: "/psychometric",
    icon: ShieldCheck,
    featured: true
  },
  {
    title: "Discipline Index(TM)",
    subtitle: "Scan routine discipline, consistency, punctuality, focus, and execution.",
    badge: "FREE",
    href: "/psychometric",
    icon: ClipboardCheck
  },
  {
    title: "Leadership DNA Test(TM)",
    subtitle: "Find your command style, teamwork pattern, influence, and decision profile.",
    badge: "FREE",
    href: "/psychometric",
    icon: Trophy
  },
  {
    title: "Dream Addiction Index(TM)",
    subtitle: "Measure distraction, ambition intensity, productivity, and goal obsession.",
    badge: "GURU LINKED",
    href: "/guru",
    icon: Sparkles
  },
  {
    title: "Defence Career Fit Test(TM)",
    subtitle: "Explore Army, Navy, Air Force, technical, combat, and leadership pathways.",
    badge: "FREE",
    href: "/psychometric",
    icon: Plane
  },
  {
    title: "OLQ Analyzer(TM)",
    subtitle: "Analyze officer-like qualities, initiative, courage, responsibility, and adaptability.",
    badge: "CORE",
    href: "/psychometric/olq-report",
    icon: Radar
  },
  {
    title: "Focus Strength Index(TM)",
    subtitle: "Understand attention span, distraction levels, focus capacity, and mental endurance.",
    badge: "GURU LINKED",
    href: "/guru",
    icon: Target
  },
  {
    title: "SSB Psychology Simulator(TM)",
    subtitle: "Premium behavioural interpretation inspired by TAT, WAT, SRT, and SD patterns.",
    badge: "PREMIUM",
    href: "/subscriptions",
    icon: BrainCircuit
  }
];

const assessmentPath = [
  "Officer Readiness",
  "Defence Career Fit",
  "Discipline Index",
  "Leadership DNA",
  "Dream Addiction Index"
];

const resultArchetypes = [
  "The Commander",
  "The Strategist",
  "The Warrior",
  "The Diplomat",
  "The Builder"
];

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`rounded-lg border border-white/70 bg-white/62 shadow-[0_24px_80px_rgba(19,35,72,0.12)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text: string; light?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${light ? "text-[#f0d78a]" : "text-[#263a8f]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-5xl ${light ? "text-white" : "text-[#111827]"}`}>{title}</h2>
      <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:text-base ${light ? "text-white/72" : "text-[#536072]"}`}>{text}</p>
    </div>
  );
}

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/20 bg-white/70 px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-[0_12px_30px_rgba(38,58,143,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#c9a646]/60 hover:text-[#111827]">
      {children}
    </Link>
  );
}

function DefenceVisual() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/60 shadow-[0_24px_80px_rgba(19,35,72,0.14)] backdrop-blur-2xl">
      <div className="aspect-[4/3] bg-[linear-gradient(180deg,rgba(10,16,31,0.02),rgba(10,16,31,0.62)),url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(201,166,70,0.30),transparent_13rem),linear-gradient(135deg,rgba(11,31,58,0.14),transparent)]" />
      <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/70 bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#263a8f] shadow-sm backdrop-blur-xl">Cadet mindset</span>
        <span className="rounded-full border border-[#c9a646]/40 bg-[#fff8dd]/86 px-3 py-2 text-xs font-semibold text-[#7c6418] shadow-sm backdrop-blur-xl">Leadership Ready</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/65 bg-white/76 p-4 shadow-sm backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f]">Officer Mission</p>
        <p className="mt-2 text-lg font-semibold leading-snug text-[#111827]">Discipline today. Confidence tomorrow. Uniform for life.</p>
      </div>
    </div>
  );
}

function MissionProgramStrip() {
  return (
    <section className="border-y border-[#263a8f]/10 bg-white/70 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {pathways.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group flex min-h-14 items-center justify-center gap-2 rounded border border-[#263a8f]/10 bg-white/70 px-3 py-3 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9a646]/45 hover:bg-[#fff8dd] hover:shadow-[0_18px_36px_rgba(201,166,70,0.16)]">
            <Icon className="h-4 w-4 text-[#c9a646] transition group-hover:scale-110" />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function HeroMissionPanel() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.7 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-[#263a8f]/12 blur-3xl" />
      <GlassCard className="relative overflow-hidden p-5">
        <div className="relative min-h-[31rem] overflow-hidden rounded-lg border border-white/80 bg-white/60">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,31,58,0.12),rgba(201,166,70,0.16),rgba(255,255,255,0.58))]" />
          <div className="relative flex min-h-[31rem] flex-col justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[#c9a646]/40 bg-[#fff8dd]/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6d17]">Mission board</span>
              <Medal className="h-7 w-7 text-[#c9a646]" />
            </div>
            <DefenceVisual />
            <div className="grid gap-3">
              {missionCards.map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-lg border border-white/80 bg-white/74 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[#263a8f]" />
                    <span className="text-sm font-semibold text-[#111827]">{title}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#536072]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f6f7fb] text-[#111827]">
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(38,58,143,0.18),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(201,166,70,0.22),transparent_26rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_82%)]" />
        <div className="absolute inset-x-0 top-0 h-[40rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(246,247,251,0.94)),url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-x-0 top-20 h-72 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.72),transparent_32rem)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-12 lg:grid-cols-[1fr_31rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#263a8f]/15 bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f] shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-[#c9a646]" />
              India&apos;s Modern Defence Learning Ecosystem
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[1.02] text-[#111827] sm:text-7xl">
              Kerala&apos;s First
              <span className="block text-[#263a8f]">Integrated Defence Career Campus</span>
            </h1>
            <p className="mt-5 text-lg font-semibold tracking-wide text-[#6f5a18]">NDA &bull; CDS &bull; AFCAT &bull; SSB &bull; Foundation Programs</p>
            <p className="mt-6 max-w-2xl text-2xl font-semibold leading-tight text-[#111827] sm:text-4xl">
              Train with discipline.
              <span className="block text-[#536072]">Lead with confidence.</span>
              <span className="block text-[#263a8f]">Build your future in uniform.</span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="#programs">Explore Programs <ArrowRight className="h-4 w-4" /></PrimaryCta>
              <PrimaryCta href="/register">Join NIDUS <Medal className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="#nidus-guru">Explore NIDUS Guru <Sparkles className="h-4 w-4" /></SecondaryCta>
            </div>
          </motion.div>

          <HeroMissionPanel />
        </div>
      </section>

      <MissionProgramStrip />

      <section id="programs" className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Programs" title="Three clear channels of defence training." text="NIDUS keeps the academy offer simple for parents and students, while the platform behind it stays powerful." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-5 lg:grid-cols-3">
          {programs.map((program, index) => (
            <GlassCard key={program.title} className="p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#263a8f]/10 px-3 py-1 text-xs font-semibold text-[#263a8f]">Channel {index + 1}</span>
                <Landmark className="h-6 w-6 text-[#c9a646]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">{program.title}</h3>
              <div className="mt-5 grid gap-3">
                {program.items.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#536072]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#263a8f]" />
                    {item}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0b1424] px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(201,166,70,0.18),transparent_28rem),radial-gradient(circle_at_84%_26%,rgba(38,58,143,0.34),transparent_26rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle eyebrow="Why NIDUS" title="Why Aspirants Choose NIDUS" text="A premium defence entrance and leadership ecosystem for academic preparation, officer readiness, physical discipline, and measurable progress." light />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {whyNidus.map(({ title, text, icon: Icon }) => (
              <motion.article key={title} whileHover={{ y: -5 }} className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
                <div className="grid h-12 w-12 place-items-center rounded bg-[#c9a646]/12 text-[#f0d78a]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/68">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="nidus-guru" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-lg border border-[#6f744e]/12 bg-[#f8f3e8] p-6 shadow-[0_24px_80px_rgba(48,54,35,0.10)] sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">Transformation Quest Platform</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#181915] sm:text-5xl">NIDUS Guru</h2>
            <p className="mt-4 text-2xl font-semibold leading-tight text-[#596036]">Transform Your Mind. Transform Your Future.</p>
            <p className="mt-5 text-sm leading-7 text-[#5d6653] sm:text-base">Quest-based transformation programs designed for students and youth to build focus, discipline, confidence, and life direction.</p>
            <div className="mt-7">
              <SecondaryCta href="/guru">Explore Quests <ArrowRight className="h-4 w-4" /></SecondaryCta>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {guruQuests.map((quest, index) => (
              <motion.div key={quest} whileHover={{ y: -5 }} className="rounded-lg border border-[#6f744e]/12 bg-white/74 p-4 shadow-sm backdrop-blur-xl">
                <span className="rounded-full bg-[#1a1b17] px-3 py-1 text-xs font-semibold text-[#f0d78a]">Mission {index + 1}</span>
                <p className="mt-5 text-sm font-semibold leading-6 text-[#181915]">{quest}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="psychometric-tests" className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Assessments" title="NIDUS Defence Assessment Ecosystem" text="Tactical mission-style assessments designed to generate signups, reveal officer potential, recommend Guru quests, and guide admissions counselling." />

        <div className="mx-auto mt-10 grid max-w-7xl gap-4 lg:grid-cols-3">
          {assessmentTiers.map((tier) => (
            <GlassCard key={tier.title} className="p-5">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tier.tone}`}>{tier.badge}</span>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">{tier.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#536072]">{tier.text}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {assessmentCards.map(({ title, subtitle, badge, href, icon: Icon, featured }) => (
            <motion.article
              key={title}
              whileHover={{ y: -5 }}
              className={`rounded-lg border p-5 shadow-[0_24px_70px_rgba(19,35,72,0.10)] backdrop-blur-2xl ${
                featured
                  ? "border-[#c9a646]/35 bg-[linear-gradient(135deg,#0b1424,#263a8f_54%,#c9a646)] text-white"
                  : "border-white/70 bg-white/70 text-[#111827]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded ${featured ? "bg-white/14 text-[#f5df9c]" : "bg-[#263a8f]/10 text-[#263a8f]"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${featured ? "bg-white/14 text-[#f5df9c]" : "bg-[#fff8dd] text-[#7c6418]"}`}>{badge}</span>
              </div>
              <h3 className="mt-5 min-h-14 text-xl font-semibold leading-tight">{title}</h3>
              <p className={`mt-3 min-h-20 text-sm leading-6 ${featured ? "text-white/76" : "text-[#536072]"}`}>{subtitle}</p>
              <Link href={href} className={`mt-5 inline-flex min-h-10 items-center justify-center rounded px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${featured ? "bg-white text-[#263a8f] hover:bg-[#fff8dd]" : "bg-[#263a8f] text-white hover:bg-[#1f2f75]"}`}>
                {featured ? "Start Flagship Test" : badge === "PREMIUM" ? "Unlock Report" : "Start Assessment"}
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl gap-4 lg:grid-cols-[1fr_0.9fr_0.9fr]">
          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Recommended Path</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#111827]">Start with Officer Readiness. Then go deeper.</h3>
            <div className="mt-5 grid gap-3">
              {assessmentPath.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded border border-[#263a8f]/10 bg-[#263a8f]/5 p-3 text-sm font-semibold text-[#263a8f]">
                  <span className="grid h-7 w-7 place-items-center rounded bg-white text-xs text-[#7c6418]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Shareable Output</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#111827]">NIDUS Defence Potential Score(TM)</h3>
            <p className="mt-4 text-sm leading-7 text-[#536072]">Each free assessment can return a score, an archetype, and the next best action: Guru quest, counselling, or premium report.</p>
            <div className="mt-5 rounded-lg border border-[#c9a646]/25 bg-[#fff8dd] p-4">
              <p className="text-sm font-semibold text-[#7c6418]">Example: 82/100 - Emerging Officer Personality</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Result Archetypes</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resultArchetypes.map((item) => (
                <span key={item} className="rounded-full border border-[#263a8f]/10 bg-white/76 px-3 py-2 text-xs font-semibold text-[#263a8f]">{item}</span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-[#536072]">Archetypes make results more memorable, parent-friendly, and shareable.</p>
          </GlassCard>
        </div>
      </section>

      <section id="learning" className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Learning Experience" title="Live classes, recorded learning, tests, and progress in one place." text="Students should see a modern academy experience, not scattered links across different tools." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Live Classes", "Scheduled online sessions for active batches.", Video],
            ["Recorded Courses", "Lessons, notes, PDFs, and revision folders.", GraduationCap],
            ["Exams & Tests", "Timed practice, monthly tests, and leaderboards.", Target],
            ["Progress Reports", "Attendance, marks, aptitude, OLQ, and teacher remarks.", ClipboardList]
          ].map(([title, text, Icon]) => {
            const CardIcon = Icon as LucideIcon;
            return (
              <GlassCard key={String(title)} className="p-5">
                <CardIcon className="h-6 w-6 text-[#263a8f]" />
                <h3 className="mt-5 text-lg font-semibold text-[#111827]">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-[#536072]">{String(text)}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section id="about" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <GlassCard className="p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">About NIDUS</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827]">A premium defence academy built for disciplined growth.</h2>
            <p className="mt-5 text-sm leading-7 text-[#536072]">
              The public website should speak to students and parents first: what programs are available, how learning works, why the academy is different, and how to enquire. The internal management system stays behind login.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {["Quality Training", "Personal Care", "Result Oriented"].map((item) => (
                <div key={item} className="rounded-lg border border-[#263a8f]/10 bg-[#263a8f]/5 p-4 text-sm font-semibold text-[#263a8f]">{item}</div>
              ))}
            </div>
          </GlassCard>
          <div className="grid gap-4">
            <GlassCard className="p-6">
              <Users className="h-6 w-6 text-[#c9a646]" />
              <h3 className="mt-4 text-xl font-semibold text-[#111827]">For students and parents</h3>
              <p className="mt-3 text-sm leading-6 text-[#536072]">Clear programs, admission support, live learning, recorded courses, tests, and progress visibility.</p>
            </GlassCard>
            <GlassCard className="p-6">
              <ShieldCheck className="h-6 w-6 text-[#c9a646]" />
              <h3 className="mt-4 text-xl font-semibold text-[#111827]">For academy management</h3>
              <p className="mt-3 text-sm leading-6 text-[#536072]">Admissions, HR, courses, finance, exams, reports, and AI assistance stay inside the logged-in platform.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section id="admissions" className="relative overflow-hidden px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 bottom-0 h-96 bg-[linear-gradient(0deg,rgba(11,31,58,0.10),transparent)]" />
        <GlassCard className="relative mx-auto max-w-5xl overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(38,58,143,0.08),rgba(201,166,70,0.12),transparent)]" />
          <div className="relative">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#263a8f]/10 text-[#263a8f]">
              <Medal className="h-7 w-7" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Join NIDUS</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">Your Uniform Journey Starts Here.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072]">
              Join Kerala&apos;s modern defence preparation ecosystem and train for leadership, discipline, and success.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryCta href="/register">Apply Now <ArrowRight className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="/crm/counselling">Book Counselling</SecondaryCta>
            </div>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
