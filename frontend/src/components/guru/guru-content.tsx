"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BatteryCharging,
  Brain,
  CalendarClock,
  Compass,
  Flame,
  HeartPulse,
  Lock,
  MessageCircle,
  MoonStar,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  Waves
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GuruCategory = {
  title: string;
  subtitle: string;
  questCount: string;
  tone: string;
  icon: LucideIcon;
};

export const guruCategories: GuruCategory[] = [
  {
    title: "Dream Addiction™",
    subtitle: "Turn your dreams into your strongest obsession.",
    questCount: "2 quests",
    tone: "from-[#151515] via-[#56613b] to-[#d2b96b]",
    icon: Flame
  },
  {
    title: "Student Power Quests",
    subtitle: "Build focus, discipline, and confidence early.",
    questCount: "6 quests",
    tone: "from-[#1f2d26] via-[#607452] to-[#eadfba]",
    icon: Target
  },
  {
    title: "Life OS Quests",
    subtitle: "Upgrade your habits, mindset, and daily systems.",
    questCount: "5 quests",
    tone: "from-[#20221d] via-[#7d7a55] to-[#f3e8c4]",
    icon: Compass
  },
  {
    title: "Fitness & Energy Quests",
    subtitle: "Build energy, discipline, and physical confidence.",
    questCount: "4 quests",
    tone: "from-[#13231c] via-[#52715a] to-[#d9c27b]",
    icon: HeartPulse
  },
  {
    title: "Future & Career Quests",
    subtitle: "Discover direction, leadership, and future readiness.",
    questCount: "5 quests",
    tone: "from-[#17181d] via-[#54616b] to-[#dbc17a]",
    icon: Trophy
  },
  {
    title: "Social & Communication Quests",
    subtitle: "Improve confidence, speaking, and personality.",
    questCount: "4 quests",
    tone: "from-[#231d1a] via-[#6c6549] to-[#ead6a0]",
    icon: MessageCircle
  },
  {
    title: "Mind & Emotion Quests",
    subtitle: "Develop emotional strength and mental clarity.",
    questCount: "5 quests",
    tone: "from-[#1b2024] via-[#596765] to-[#d9ca96]",
    icon: Brain
  },
  {
    title: "Upcoming Quests",
    subtitle: "New transformation missions launching soon.",
    questCount: "Soon",
    tone: "from-[#252018] via-[#716041] to-[#f1db9d]",
    icon: CalendarClock
  }
];

const dreamQuestCards = [
  {
    title: "Dream Addiction - Part 1",
    badge: "FREE QUEST",
    description: "A focused reset to replace distraction with purpose and daily direction.",
    features: ["focus reset", "digital discipline", "dream mindset", "daily missions"],
    cta: "Start Free Quest",
    href: "/guru#dream-addiction",
    icon: Play
  },
  {
    title: "Dream Addiction - Part 2",
    badge: "PREMIUM QUEST",
    description: "A deeper transformation track for accountability, systems, and mission building.",
    features: ["deep transformation", "accountability", "discipline systems", "mission building"],
    cta: "Unlock Premium",
    href: "/subscriptions",
    icon: Lock
  }
];

function GuruButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-300";
  const styles =
    variant === "primary"
      ? "bg-[#1a1b17] text-white shadow-[0_18px_44px_rgba(26,27,23,0.24)] hover:-translate-y-0.5 hover:bg-[#2f3324]"
      : "border border-[#6f744e]/20 bg-white/72 text-[#313521] shadow-[0_16px_36px_rgba(49,53,33,0.09)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-[#c6a95d]/60 hover:bg-[#fffaf0]";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

function GuruVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative"
    >
      <div className="absolute -inset-8 rounded-full bg-[#b89b4d]/18 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/68 p-4 shadow-[0_34px_110px_rgba(40,44,30,0.18)] backdrop-blur-2xl">
        <div className="relative min-h-[28rem] overflow-hidden rounded-[1.25rem] bg-[#171814]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_16%,rgba(224,198,112,0.48),transparent_16rem),radial-gradient(circle_at_70%_64%,rgba(133,151,89,0.44),transparent_18rem),linear-gradient(145deg,#11120f,#323926_46%,#f4ead2)]" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(0deg,rgba(17,18,15,0.74),transparent)]" />
          <div className="absolute left-[18%] top-[18%] h-48 w-28 rounded-full border border-white/24 bg-white/10 blur-[1px]" />
          <div className="absolute right-[14%] top-[22%] h-56 w-32 rounded-full border border-[#f6df98]/28 bg-[#f6df98]/10 blur-[1px]" />
          <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
            <span className="rounded-full border border-white/40 bg-white/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-xl">Future Self Loading</span>
            <Sparkles className="h-6 w-6 text-[#f4d987]" />
          </div>
          <div className="absolute bottom-6 left-6 right-6 grid gap-3">
            <div className="rounded-2xl border border-white/30 bg-white/18 p-4 text-white shadow-sm backdrop-blur-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f5df9c]">Today&apos;s Mission</p>
              <p className="mt-2 text-2xl font-semibold leading-tight">Protect one hour for the dream.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Focus", "Energy", "Courage"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/25 bg-white/16 p-3 text-center text-xs font-semibold uppercase tracking-[0.13em] text-white backdrop-blur-xl">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function GuruHeroSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="nidus-guru" className={`relative overflow-hidden ${compact ? "rounded-[1.75rem]" : ""} bg-[#f8f3e8] px-4 py-20 text-[#181915] sm:px-6 lg:px-8`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(192,166,91,0.26),transparent_28rem),radial-gradient(circle_at_80%_18%,rgba(93,112,69,0.18),transparent_24rem),linear-gradient(180deg,#fffaf0_0%,#f8f3e8_70%,#f3ead8_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b89b4d]/55 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_30rem] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.65 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6f744e]/18 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#596036] shadow-sm backdrop-blur-xl">
            <MoonStar className="h-4 w-4 text-[#b89b4d]" />
            Personal Transformation Platform
          </div>
          <h2 className="mt-6 text-5xl font-semibold leading-[0.96] text-[#181915] sm:text-7xl">NIDUS GURU</h2>
          <p className="mt-6 max-w-xl text-3xl font-semibold leading-tight text-[#596036] sm:text-5xl">
            Transform Your Mind.
            <span className="block text-[#181915]">Transform Your Future.</span>
          </p>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6653] sm:text-lg">
            Quest-based transformation programs designed for students and youth to build discipline, focus, confidence, leadership, and life direction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <GuruButton href={compact ? "#guru-quests" : "/guru#guru-quests"}>Explore Quests <ArrowRight className="h-4 w-4" /></GuruButton>
            <GuruButton href={compact ? "#dream-addiction" : "/guru#dream-addiction"} variant="secondary">Start Free Quest <Play className="h-4 w-4" /></GuruButton>
          </div>
        </motion.div>
        <GuruVisual />
      </div>
    </section>
  );
}

export function QuestCategoriesSection() {
  return (
    <section id="guru-quests" className="bg-[#fbf7ef] px-4 py-20 text-[#181915] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f744e]">Quests</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Transformation tracks for the future self.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#66705d]">Missions for focus, habits, energy, emotional strength, communication, and future readiness. Light enough to start. Serious enough to change direction.</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {guruCategories.map(({ title, subtitle, questCount, tone, icon: Icon }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.035, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-[1.35rem] border border-[#6f744e]/12 bg-white shadow-[0_22px_70px_rgba(48,54,35,0.10)] transition"
            >
              <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${tone}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.38),transparent_10rem),linear-gradient(0deg,rgba(0,0,0,0.38),transparent)]" />
                <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/32 bg-white/18 text-white backdrop-blur-xl">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f9e9b8]">{questCount}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight text-white">{title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="min-h-12 text-sm leading-6 text-[#66705d]">{subtitle}</p>
                <Link href="/guru#guru-quests" className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#6f744e]/18 px-4 py-2 text-sm font-semibold text-[#3f4629] transition group-hover:border-[#b89b4d]/60 group-hover:bg-[#fff8dd]">
                  Explore <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DreamAddictionSection() {
  return (
    <section id="dream-addiction" className="relative overflow-hidden bg-[#181915] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(203,176,98,0.26),transparent_28rem),radial-gradient(circle_at_78%_36%,rgba(94,117,75,0.24),transparent_26rem)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e9d27d]">Featured Quest</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Dream Addiction™</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#d9d2bd]">A transformational quest designed to replace distractions with purpose.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {dreamQuestCards.map(({ title, badge, description, features, cta, href, icon: Icon }) => (
              <motion.article
                key={title}
                whileHover={{ y: -5 }}
                className="rounded-[1.35rem] border border-white/14 bg-white/[0.08] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-[#e9d27d]/35 bg-[#e9d27d]/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5df9c]">{badge}</span>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#f5df9c]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-6 text-2xl font-semibold leading-tight">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#d9d2bd]">{description}</p>
                <div className="mt-5 grid gap-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm capitalize text-[#eee6cb]">
                      <Star className="h-4 w-4 text-[#e9d27d]" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href={href} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5df9c] px-5 py-3 text-sm font-semibold text-[#181915] transition hover:-translate-y-0.5 hover:bg-white">
                  {cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GuruProgressPreview() {
  return (
    <section className="bg-[#f8f3e8] px-4 py-20 text-[#181915] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="rounded-[1.5rem] border border-[#6f744e]/12 bg-white/70 p-6 shadow-[0_24px_80px_rgba(48,54,35,0.10)] backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f744e]">Progress Ready</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">Built for streaks, missions, and transformation progress.</h2>
          <p className="mt-4 text-sm leading-7 text-[#66705d]">The first version is frontend-ready. Later, each quest can connect to progress, certificates, mentor review, payment access, and mobile app sync.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["7 day", "focus streak", Waves],
              ["12", "missions ready", BatteryCharging],
              ["3", "upcoming tracks", CalendarClock]
            ].map(([value, label, Icon]) => {
              const MetricIcon = Icon as LucideIcon;
              return (
                <div key={String(label)} className="rounded-2xl border border-[#6f744e]/12 bg-[#fbf7ef] p-4">
                  <MetricIcon className="h-5 w-5 text-[#6f744e]" />
                  <p className="mt-4 text-2xl font-semibold text-[#181915]">{String(value)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#66705d]">{String(label)}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#6f744e]/12 bg-[#181915] p-6 text-white shadow-[0_24px_80px_rgba(24,25,21,0.20)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e9d27d]">Upcoming Missions</p>
          <div className="mt-5 grid gap-3">
            {["Confidence Speaking Sprint", "30-Day Life OS Reset", "Career Direction Compass", "Mind Calm Protocol"].map((item) => (
              <div key={item} className="flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4">
                <span className="text-sm font-semibold">{item}</span>
                <span className="rounded-full bg-[#e9d27d]/12 px-3 py-1 text-xs font-semibold text-[#f5df9c]">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GuruExperience({ includeHero = true }: { includeHero?: boolean }) {
  return (
    <div className="bg-[#fbf7ef]">
      {includeHero ? <GuruHeroSection compact /> : null}
      <QuestCategoriesSection />
      <DreamAddictionSection />
      <GuruProgressPreview />
    </div>
  );
}
