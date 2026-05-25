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
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const photos = {
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Armed%20Forces%20-%20Republic%20day%20parade%202024.jpg",
  army: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Army%20contingent%20Republic%20Day%20parade%202023%20Img5.jpg",
  cadets: "https://commons.wikimedia.org/wiki/Special:FilePath/Ncc%20cadets%20in%20India%20during%20parade.jpg",
  navy: "https://commons.wikimedia.org/wiki/Special:FilePath/Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg",
  airforce: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Rafale%20fighter.jpg",
  airforceMarch: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Marching%20Contingent.jpg",
  customs: "https://commons.wikimedia.org/wiki/Special:FilePath/Customs%20%26%20Central%20Officer%20on%20Republic%20Day.jpg",
  drdo: "https://commons.wikimedia.org/wiki/Special:FilePath/Tata%20DRDO%20whap.jpg",
  republic: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20soldiers%20at%20the%20Republic%20day%20parade.jpg",
  final: "https://commons.wikimedia.org/wiki/Special:FilePath/Para%20contingent%20republic%20day%202022.jpg"
};

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
  { title: "Indian Army Discipline", text: "Parade, routine, courage, and ground confidence.", image: photos.army, icon: ShieldCheck },
  { title: "Indian Naval Academy Path", text: "Ezhimala-style officer ambition and naval discipline.", image: photos.navy, icon: Landmark },
  { title: "Indian Air Force Ambition", text: "Aviation dreams, speed, accuracy, and technical readiness.", image: photos.airforce, icon: Plane },
  { title: "Customs & Civil Services", text: "Uniformed public-service careers beyond defence entries.", image: photos.customs, icon: GraduationCap },
  { title: "AI Performance Profile", text: "Readiness score, assessments, reports, and next missions.", image: photos.drdo, icon: BrainCircuit }
];

const programs = [
  { title: "Foundation & Long-Term", label: "After 10th / Plus One", href: "/programs/mission-2028-after-10th", image: photos.cadets, icon: ShieldCheck },
  { title: "Defence Entrance", label: "NDA / CDS / AFCAT / INET", href: "/programs/nda-crash-course", image: photos.republic, icon: Medal },
  { title: "Specialized Modules", label: "Agniveer / AFMC / SSB", href: "/programs/ssb-interview-guidance", image: photos.airforceMarch, icon: Target }
];

const aiSignals = [
  ["Officer Readiness", "82%", ShieldCheck],
  ["Discipline Index", "Daily", Zap],
  ["SSB Mission", "Active", Users],
  ["Next Action", "Train", Target]
];

const assessments: Array<{ title: string; badge: string; href: string; icon: LucideIcon; image: string }> = [
  { title: "Officer Readiness", badge: "Free", href: "/psychometric", icon: ShieldCheck, image: photos.army },
  { title: "Leadership DNA", badge: "Free", href: "/psychometric", icon: Trophy, image: photos.navy },
  { title: "Defence Career Fit", badge: "Free", href: "/psychometric", icon: Plane, image: photos.airforce },
  { title: "Customs & Services Fit", badge: "Free", href: "/psychometric/olq-report", icon: BrainCircuit, image: photos.customs }
];

const guruQuests = ["Dream Addiction", "Focus Reset", "Warrior Discipline", "Student Power"];

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/18 bg-white/82 px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-[0_12px_30px_rgba(38,58,143,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#c9a646]/55 hover:text-[#111827]">
      {children}
    </Link>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#111827] sm:text-5xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#536072]">{text}</p>
    </div>
  );
}

function PhotoCard({ title, text, image, icon: Icon, className = "" }: { title: string; text: string; image: string; icon: LucideIcon; className?: string }) {
  return (
    <motion.article whileHover={{ y: -5 }} className={`group overflow-hidden rounded-lg border border-[#263a8f]/10 bg-white shadow-[0_24px_70px_rgba(19,35,72,0.10)] ${className}`}>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e8edf7]">
        <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(17,24,39,0.42))]" />
        <div className="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded border border-white/40 bg-white/76 text-[#263a8f] backdrop-blur-xl">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-2xl font-semibold leading-tight text-[#111827]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#536072]">{text}</p>
      </div>
    </motion.article>
  );
}

function HeroVisual() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.65 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-[#c9a646]/18 blur-3xl" />
      <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/80 p-3 shadow-[0_28px_90px_rgba(19,35,72,0.14)] backdrop-blur-2xl">
        <div className="relative min-h-[28rem] overflow-hidden rounded bg-[#e9edf7]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${photos.cadets}')` }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(17,24,39,0.46))]" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/70 bg-white/82 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#263a8f] backdrop-blur-xl">AI Mission Board</span>
            <span className="rounded-full border border-[#c9a646]/40 bg-[#fff8dd]/88 px-3 py-2 text-xs font-semibold text-[#7c6418] backdrop-blur-xl">Officer Ready</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/70 bg-white/86 p-4 text-[#111827] shadow-sm backdrop-blur-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f]">Readiness Score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-semibold leading-none">82</span>
              <span className="pb-1 text-lg font-semibold text-[#536072]">/100</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#536072]">Today: speed, accuracy, discipline, and confidence.</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Army", photos.army],
            ["Navy", photos.navy],
            ["Air Force", photos.airforce]
          ].map(([label, image]) => (
            <div key={label} className="relative h-28 overflow-hidden rounded bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }}>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(17,24,39,0.50))]" />
              <span className="absolute bottom-3 left-3 rounded bg-white/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#263a8f] backdrop-blur-xl">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MissionStrip() {
  return (
    <section className="border-y border-[#263a8f]/10 bg-white/82 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {pathways.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group flex min-h-14 items-center justify-center gap-2 rounded border border-[#263a8f]/10 bg-white px-3 py-3 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9a646]/50 hover:bg-[#fff8dd]">
            <Icon className="h-4 w-4 text-[#c9a646] transition group-hover:scale-110" />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function AiPerformancePanel() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_28px_90px_rgba(19,35,72,0.10)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[24rem] overflow-hidden rounded bg-[#eef2f9]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${photos.drdo}')` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0.78))]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/70 bg-white/84 p-4 backdrop-blur-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f]">NIDUS AI Performance Engine</p>
            <h3 className="mt-2 text-2xl font-semibold">One profile. One mission roadmap.</h3>
          </div>
        </div>
        <div>
          <SectionTitle eyebrow="AI Campus Layer" title="Assessment, learning, training, and reports connected." text="NIDUS AI turns the student journey into a clear readiness profile with next actions." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {aiSignals.map(([title, value, Icon]) => {
              const SignalIcon = Icon as LucideIcon;
              return (
                <motion.div key={String(title)} whileHover={{ y: -3 }} className="rounded border border-[#263a8f]/10 bg-[#f8fafc] p-4">
                  <SignalIcon className="h-5 w-5 text-[#263a8f]" />
                  <p className="mt-5 text-3xl font-semibold text-[#111827]">{String(value)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#536072]">{String(title)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f6f7fb] text-[#111827]">
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(38,58,143,0.16),transparent_28rem),radial-gradient(circle_at_84%_12%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_88%)]" />
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-cover bg-center opacity-55" style={{ backgroundImage: `linear-gradient(180deg,rgba(255,255,255,0.62),rgba(246,247,251,0.96)),url('${photos.hero}')` }} />
        <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#263a8f]/15 bg-white/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f] shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-[#c9a646]" />
              India&apos;s First Integrated AI-Powered Defence Career Campus
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.98] text-[#111827] sm:text-7xl">
              From aspirant to officer material.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#536072] sm:text-2xl">
              Academics. Physical training. SSB. Psychometrics. AI performance coaching.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/join">Join NIDUS <Medal className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="/programs">Explore Academy <ArrowRight className="h-4 w-4" /></SecondaryCta>
              <SecondaryCta href="/psychometric">Start Free Assessment</SecondaryCta>
            </div>
          </motion.div>
          <HeroVisual />
        </div>
      </section>

      <MissionStrip />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Integrated Campus" title="A real defence training ecosystem." text="Bright, visual, and easy to understand: classroom, ground training, SSB, aviation dreams, and AI performance guidance." />
          <div className="mt-10 grid gap-4 lg:grid-cols-6">
            {campusTiles.map((tile, index) => (
              <PhotoCard key={tile.title} title={tile.title} text={tile.text} image={tile.image} icon={tile.icon} className={index < 2 ? "lg:col-span-3" : "lg:col-span-2"} />
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Academy Programs" title="Choose the mission path." text="Visual program doors for foundation, entrance, and specialized defence preparation." />
            <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
              View All Programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {programs.map(({ title, label, href, image, icon: Icon }) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-lg border border-[#263a8f]/10 bg-white shadow-[0_24px_70px_rgba(19,35,72,0.10)] transition hover:-translate-y-1">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#e8edf7]">
                  <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(17,24,39,0.42))]" />
                  <Icon className="absolute bottom-4 left-4 h-7 w-7 text-white" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#263a8f]">{label}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#263a8f]">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
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
            <SectionTitle eyebrow="Assessments" title="Start with a defence potential scan." text="Free and premium assessment cards with real visual energy, not empty placeholders." />
            <PrimaryCta href="/psychometric">Start Assessment <ClipboardCheck className="h-4 w-4" /></PrimaryCta>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assessments.map(({ title, badge, href, icon: Icon, image }) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-lg border border-[#263a8f]/10 bg-white shadow-[0_20px_60px_rgba(19,35,72,0.09)] transition hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e8edf7]">
                  <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} />
                  <div className="absolute left-4 top-4 rounded-full bg-white/82 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#263a8f] backdrop-blur-xl">{badge}</div>
                </div>
                <div className="p-5">
                  <Icon className="h-5 w-5 text-[#c9a646]" />
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="nidus-guru" className="relative overflow-hidden bg-[#fbf7ef] px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(111,116,78,0.14),transparent_24rem),radial-gradient(circle_at_82%_14%,rgba(240,215,138,0.24),transparent_22rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">NIDUS Guru</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#181915] sm:text-5xl">Transform Your Mind. Transform Your Future.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5d6653]">A lighter transformation layer for focus, confidence, discipline, and youth growth missions.</p>
            <div className="mt-7">
              <Link href="/guru" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f3324]">
                Explore NIDUS Guru <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guruQuests.map((quest, index) => (
              <div key={quest} className="rounded-lg border border-[#6f744e]/12 bg-white/78 p-5 shadow-[0_18px_50px_rgba(48,54,35,0.08)] backdrop-blur-xl">
                <span className="rounded-full bg-[#181915]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f744e]">Quest {index + 1}</span>
                <h3 className="mt-8 text-2xl font-semibold text-[#181915]">{quest}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admissions" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `linear-gradient(180deg,rgba(255,255,255,0.68),rgba(246,247,251,0.94)),url('${photos.final}')` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Join NIDUS</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-6xl">Your uniform journey starts here.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072]">
            Enter a bright, disciplined academy ecosystem built for leadership, intelligence, and selection confidence.
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
