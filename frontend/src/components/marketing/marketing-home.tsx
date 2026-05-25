"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
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
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const image = (query: string) => `https://source.unsplash.com/1400x1000/?${query}`;

const pathways: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "NDA", href: "/programs/nda-crash-course", icon: ShieldCheck },
  { label: "CDS", href: "/programs/cds-afcat-inet", icon: Medal },
  { label: "AFCAT", href: "/programs/cds-afcat-inet", icon: Plane },
  { label: "SSB", href: "/programs/ssb-interview-guidance", icon: MessageCircle },
  { label: "AISSEE", href: "/programs/aissee-class-6", icon: GraduationCap },
  { label: "RIMC", href: "/programs/rimc", icon: Landmark },
  { label: "Agniveer", href: "/programs/agniveer-full-program", icon: Dumbbell }
];

const campusTiles = [
  { title: "Classroom Command", text: "Academics, tests, revision, and mentor feedback.", image: image("defence academy classroom cadets india"), icon: GraduationCap },
  { title: "Physical Discipline", text: "Stamina, ground routine, posture, and confidence.", image: image("military obstacle training cadets"), icon: Dumbbell },
  { title: "SSB Readiness", text: "OLQ, interview, communication, and group behaviour.", image: image("military interview cadets training"), icon: MessageCircle },
  { title: "Aviation Ambition", text: "Air Force, naval, and officer career direction.", image: image("fighter jet air force cadets"), icon: Plane },
  { title: "AI Performance", text: "Readiness score, assessment reports, and missions.", image: image("defence technology command center"), icon: BrainCircuit }
];

const programs = [
  {
    title: "Foundation & Long-Term",
    label: "After 10th / Plus One",
    href: "/programs/mission-2028-after-10th",
    image: image("cadet formation training academy"),
    icon: ShieldCheck
  },
  {
    title: "Defence Entrance",
    label: "NDA / CDS / AFCAT / INET",
    href: "/programs/nda-crash-course",
    image: image("military academy parade cadets"),
    icon: Medal
  },
  {
    title: "Specialized Modules",
    label: "Agniveer / AFMC / SSB",
    href: "/programs/ssb-interview-guidance",
    image: image("army training obstacle course"),
    icon: Target
  }
];

const aiSignals = [
  ["Officer Readiness", "82%", ShieldCheck],
  ["Discipline Index", "Daily", Zap],
  ["SSB Mission", "Active", Users],
  ["Next Action", "Train", Target]
];

const guruQuests = ["Dream Addiction", "Focus Reset", "Warrior Discipline", "Student Power"];

const assessmentCards: Array<{ title: string; badge: string; href: string; icon: LucideIcon; visual: string }> = [
  { title: "Officer Readiness", badge: "Free", href: "/psychometric", icon: ShieldCheck, visual: image("military leadership cadets") },
  { title: "Leadership DNA", badge: "Free", href: "/psychometric", icon: Trophy, visual: image("team leadership training cadets") },
  { title: "Defence Career Fit", badge: "Free", href: "/psychometric", icon: Plane, visual: image("air force navy army training") },
  { title: "SSB Psychology", badge: "Premium", href: "/psychometric/olq-report", icon: BrainCircuit, visual: image("psychology interview defence cadets") }
];

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#f0d78a] px-5 py-3 text-sm font-semibold text-[#0b1424] shadow-[0_18px_44px_rgba(240,215,138,0.24)] transition hover:-translate-y-0.5 hover:bg-white">
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#f0d78a]/60 hover:bg-white/16">
      {children}
    </Link>
  );
}

function SectionTitle({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text: string; light?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${light ? "text-[#f0d78a]" : "text-[#263a8f]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-5xl ${light ? "text-white" : "text-[#111827]"}`}>{title}</h2>
      <p className={`mt-4 max-w-2xl text-sm leading-7 ${light ? "text-white/72" : "text-[#536072]"}`}>{text}</p>
    </div>
  );
}

function VisualTile({ title, text, visual, icon: Icon, className = "" }: { title: string; text: string; visual: string; icon: LucideIcon; className?: string }) {
  return (
    <motion.article whileHover={{ y: -5 }} className={`group relative min-h-72 overflow-hidden rounded-lg border border-white/12 bg-[#111827] shadow-[0_28px_90px_rgba(5,10,20,0.22)] ${className}`}>
      <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg,rgba(8,13,24,0.12),rgba(8,13,24,0.78)),url('${visual}')` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(240,215,138,0.22),transparent_14rem)]" />
      <div className="relative flex h-full min-h-72 flex-col justify-between p-5 text-white">
        <div className="grid h-11 w-11 place-items-center rounded border border-white/20 bg-white/12 backdrop-blur-xl">
          <Icon className="h-5 w-5 text-[#f0d78a]" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/76">{text}</p>
        </div>
      </div>
    </motion.article>
  );
}

function HeroMissionPanel() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-[#f0d78a]/16 blur-3xl" />
      <div className="relative grid gap-3">
        <div className="relative min-h-[34rem] overflow-hidden rounded-lg border border-white/18 bg-[#111827] shadow-[0_36px_110px_rgba(0,0,0,0.32)]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(5,10,20,0.18),rgba(5,10,20,0.78)),url('${image("military cadet parade training academy")}')` }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(240,215,138,0.28),transparent_16rem)]" />
          <div className="relative flex min-h-[34rem] flex-col justify-between p-5 text-white sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-[#f0d78a]/35 bg-[#f0d78a]/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0d78a] backdrop-blur-xl">Live Mission Board</span>
              <span className="rounded-full border border-white/18 bg-white/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-xl">AI Campus</span>
            </div>
            <div className="max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0d78a]">Officer Readiness</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-7xl font-semibold leading-none">82</span>
                <span className="pb-2 text-xl font-semibold text-white/72">/100</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/76">Today&apos;s mission: speed, accuracy, discipline, and confidence.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Physical", image("army physical training running")],
            ["Aviation", image("fighter jet air force runway")],
            ["SSB", image("cadets group discussion training")]
          ].map(([label, visual]) => (
            <div key={label} className="relative h-32 overflow-hidden rounded border border-white/12 bg-cover bg-center shadow-[0_16px_44px_rgba(5,10,20,0.18)]" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.06),rgba(5,10,20,0.68)),url('${visual}')` }}>
              <span className="absolute bottom-3 left-3 rounded bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MissionProgramStrip() {
  return (
    <section className="border-y border-white/10 bg-[#0b1424] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {pathways.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group flex min-h-14 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.06] px-3 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-[#f0d78a]/50 hover:bg-[#f0d78a]/10">
            <Icon className="h-4 w-4 text-[#f0d78a] transition group-hover:scale-110" />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function AiPerformancePanel() {
  return (
    <section className="relative overflow-hidden bg-[#0b1424] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-cover bg-center opacity-24" style={{ backgroundImage: `url('${image("military command center technology")}')` }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1424_0%,rgba(11,20,36,0.92)_52%,rgba(11,20,36,0.72)_100%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionTitle eyebrow="NIDUS AI Performance Engine" title="One campus. One profile. One mission roadmap." text="Assessments, learning, physical discipline, SSB readiness, and TOPRANK missions connect into a single performance identity." light />
        <div className="grid gap-4 sm:grid-cols-2">
          {aiSignals.map(([title, value, Icon]) => {
            const SignalIcon = Icon as LucideIcon;
            return (
              <motion.div key={String(title)} whileHover={{ y: -4 }} className="rounded-lg border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl">
                <SignalIcon className="h-6 w-6 text-[#f0d78a]" />
                <p className="mt-6 text-3xl font-semibold">{String(value)}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/62">{String(title)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f6f7fb] text-[#111827]">
      <section className="relative min-h-screen overflow-hidden bg-[#0b1424] px-4 pb-14 pt-28 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(5,10,20,0.84),rgba(5,10,20,0.48),rgba(5,10,20,0.80)),url('${image("military academy cadets parade india")}')` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(240,215,138,0.25),transparent_22rem),radial-gradient(circle_at_82%_18%,rgba(38,58,143,0.32),transparent_26rem)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d78a]/35 bg-[#f0d78a]/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0d78a] backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4" />
              India&apos;s First Integrated AI-Powered Defence Career Campus
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.98] sm:text-7xl">
              From aspirant to officer material.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/82 sm:text-2xl">
              Academics. Physical training. SSB. Psychometrics. AI performance coaching.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/join">Join NIDUS <Medal className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="/programs">Explore Academy <ArrowRight className="h-4 w-4" /></SecondaryCta>
              <SecondaryCta href="/psychometric">Start Free Assessment</SecondaryCta>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {["Entrance", "Training", "AI Profile"].map((item) => (
                <div key={item} className="rounded border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <p className="text-sm font-semibold text-[#f0d78a]">{item}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/58">Integrated</p>
                </div>
              ))}
            </div>
          </motion.div>

          <HeroMissionPanel />
        </div>
      </section>

      <MissionProgramStrip />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Integrated Campus" title="Not a coaching brochure. A defence performance ecosystem." text="The landing page should show the journey: classroom command, physical discipline, SSB confidence, assessment intelligence, and AI-powered daily missions." />
          <div className="mt-10 grid gap-4 lg:grid-cols-6">
            {campusTiles.map((tile, index) => (
              <VisualTile key={tile.title} title={tile.title} text={tile.text} visual={tile.image} icon={tile.icon} className={index < 2 ? "lg:col-span-3" : "lg:col-span-2"} />
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Academy Programs" title="Choose the mission path." text="Fewer words, clearer routes, stronger visual identity." />
            <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
              View All Programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {programs.map(({ title, label, href, image: visual, icon: Icon }) => (
              <Link key={title} href={href} className="group relative min-h-[24rem] overflow-hidden rounded-lg border border-white/20 bg-[#111827] shadow-[0_28px_90px_rgba(19,35,72,0.16)]">
                <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.08),rgba(5,10,20,0.82)),url('${visual}')` }} />
                <div className="relative flex min-h-[24rem] flex-col justify-between p-5 text-white">
                  <Icon className="h-7 w-7 text-[#f0d78a]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0d78a]">{label}</p>
                    <h3 className="mt-3 text-3xl font-semibold leading-tight">{title}</h3>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                      Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AiPerformancePanel />

      <section id="psychometric-tests" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Assessments" title="Start with a defence potential scan." text="Mission-style assessments should feel sharp, fast, and shareable." />
            <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
              Start Assessment <ClipboardCheck className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assessmentCards.map(({ title, badge, href, icon: Icon, visual }) => (
              <Link key={title} href={href} className="group relative min-h-64 overflow-hidden rounded-lg border border-white/20 bg-[#111827] shadow-[0_24px_70px_rgba(19,35,72,0.12)]">
                <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.10),rgba(5,10,20,0.78)),url('${visual}')` }} />
                <div className="relative flex min-h-64 flex-col justify-between p-5 text-white">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-[#f0d78a]" />
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur-xl">{badge}</span>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="nidus-guru" className="relative overflow-hidden bg-[#fbf7ef] px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(111,116,78,0.16),transparent_24rem),radial-gradient(circle_at_82%_14%,rgba(240,215,138,0.28),transparent_22rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">NIDUS Guru</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#181915] sm:text-5xl">Transform Your Mind. Transform Your Future.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5d6653]">The secondary transformation layer for focus, confidence, discipline, and student growth missions.</p>
            <div className="mt-7">
              <Link href="/guru" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f3324]">
                Explore NIDUS Guru <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guruQuests.map((quest, index) => (
              <div key={quest} className="relative min-h-44 overflow-hidden rounded-lg border border-[#6f744e]/12 bg-[#181915] p-5 text-white shadow-[0_22px_70px_rgba(48,54,35,0.12)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(240,215,138,0.18),transparent_12rem)]" />
                <div className="relative">
                  <span className="rounded-full bg-[#f0d78a]/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#f0d78a]">Quest {index + 1}</span>
                  <h3 className="mt-8 text-2xl font-semibold">{quest}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admissions" className="relative overflow-hidden bg-[#0b1424] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-54" style={{ backgroundImage: `url('${image("cadet parade sunset military academy")}')` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,20,0.92),rgba(5,10,20,0.64),rgba(5,10,20,0.86))]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0d78a]">Join NIDUS</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Your uniform journey starts here.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/72">
            Enter the academy ecosystem built for discipline, leadership, intelligence, and selection confidence.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryCta href="/join">Apply Now <ArrowRight className="h-4 w-4" /></PrimaryCta>
            <SecondaryCta href="/programs">Explore Academy</SecondaryCta>
          </div>
        </div>
      </section>
    </main>
  );
}
