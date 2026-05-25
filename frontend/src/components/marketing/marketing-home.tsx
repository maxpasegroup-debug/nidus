"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
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

const img = {
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Armed%20Forces%20-%20Republic%20day%20parade%202024.jpg",
  army: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Army%20contingent%20Republic%20Day%20parade%202023%20Img5.jpg",
  cadets: "https://commons.wikimedia.org/wiki/Special:FilePath/Ncc%20cadets%20in%20India%20during%20parade.jpg",
  navy: "https://commons.wikimedia.org/wiki/Special:FilePath/Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg",
  airforce: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Rafale%20fighter.jpg",
  airforceMarch: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Marching%20Contingent.jpg",
  customs: "https://commons.wikimedia.org/wiki/Special:FilePath/Customs%20%26%20Central%20Officer%20on%20Republic%20Day.jpg",
  drdo: "https://commons.wikimedia.org/wiki/Special:FilePath/Tata%20DRDO%20whap.jpg",
  republic: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20soldiers%20at%20the%20Republic%20day%20parade.jpg",
  para: "https://commons.wikimedia.org/wiki/Special:FilePath/Para%20contingent%20republic%20day%202022.jpg"
};

const trustBadges = ["AI-Powered Learning", "Mentor Support", "Adaptive Training", "Online + Offline"];

const why = [
  ["AI-Powered Performance Training", "A profile, roadmap, mock intelligence, and revision loop.", BrainCircuit],
  ["Real Mentor Support", "Guidance from people who understand student pressure and defence ambition.", Users],
  ["Defence Career Ecosystem", "Academy, physical training, SSB, assessments, and reports together.", ShieldCheck],
  ["Active Learning Transformation", "Students move through missions, tests, feedback, and daily discipline.", Zap]
] as const;

const programs = [
  ["NDA", "Officer entrance preparation with TOPRANK adaptive training.", "/programs/nda-crash-course", img.army, ShieldCheck],
  ["CDS", "Graduate-level officer preparation with smart revision.", "/programs/cds-afcat-inet", img.republic, Medal],
  ["AFCAT", "Air Force ambition, speed practice, and interview direction.", "/programs/cds-afcat-inet", img.airforce, Plane],
  ["SSB", "OLQ, psychology, interview, and group confidence.", "/programs/ssb-interview-guidance", img.navy, MessageCircle],
  ["AISSEE", "Early defence school pathway for young aspirants.", "/programs/aissee-class-6", img.cadets, GraduationCap],
  ["Agniveer", "Written exam and physical readiness together.", "/programs/agniveer-full-program", img.airforceMarch, Dumbbell]
] as const;

const atmosphere = [
  ["Physical Training", img.para, Dumbbell],
  ["Cadet Discipline", img.cadets, ShieldCheck],
  ["Classroom Focus", img.drdo, GraduationCap],
  ["Officer Parade", img.republic, Medal],
  ["Leadership", img.navy, Users],
  ["Air Power", img.airforce, Plane]
] as const;

const guru = [
  ["Assessments", "Know your strengths before the journey starts.", "/psychometric", ClipboardCheck],
  ["Personal Transformation", "Build focus, confidence, and discipline.", "/guru", Sparkles],
  ["Dream Addiction", "Turn ambition into daily action.", "/guru#quests", Target]
] as const;

function Cta({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "dark" }) {
  const styles = {
    primary: "bg-[#f0d78a] text-[#0b1424] shadow-[0_18px_44px_rgba(240,215,138,0.26)] hover:bg-white",
    secondary: "border border-white/18 bg-white/12 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl hover:bg-white/18",
    dark: "bg-[#263a8f] text-white shadow-[0_18px_42px_rgba(38,58,143,0.22)] hover:bg-[#1f2f75]"
  };
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${styles[variant]}`}>
      {children}
    </Link>
  );
}

function SectionIntro({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text: string; light?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${light ? "text-[#f0d78a]" : "text-[#263a8f]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-5xl ${light ? "text-white" : "text-[#111827]"}`}>{title}</h2>
      <p className={`mt-4 max-w-2xl text-sm leading-7 ${light ? "text-white/72" : "text-[#536072]"}`}>{text}</p>
    </div>
  );
}

function PhotoPanel({ title, image, icon: Icon, className = "" }: { title: string; image: string; icon: LucideIcon; className?: string }) {
  return (
    <motion.article whileHover={{ y: -5 }} className={`group relative min-h-72 overflow-hidden rounded-lg border border-white/14 bg-[#111827] shadow-[0_26px_80px_rgba(6,12,24,0.20)] ${className}`}>
      <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg,rgba(8,13,24,0.05),rgba(8,13,24,0.72)),url('${image}')` }} />
      <div className="relative flex min-h-72 flex-col justify-between p-5 text-white">
        <Icon className="h-7 w-7 text-[#f0d78a]" />
        <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
      </div>
    </motion.article>
  );
}

function HeroVisual() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.7 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-[#f0d78a]/16 blur-3xl" />
      <div className="relative grid gap-3">
        <div className="relative min-h-[34rem] overflow-hidden rounded-lg border border-white/16 bg-[#111827] shadow-[0_36px_110px_rgba(0,0,0,0.32)]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(5,10,20,0.12),rgba(5,10,20,0.76)),url('${img.army}')` }} />
          <div className="relative flex min-h-[34rem] flex-col justify-between p-5 text-white sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-[#f0d78a]/35 bg-[#f0d78a]/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0d78a] backdrop-blur-xl">TOPRANK AI Engine</span>
              <span className="rounded-full border border-white/18 bg-white/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-xl">Academy Powered</span>
            </div>
            <div className="max-w-sm rounded-lg border border-white/16 bg-white/12 p-5 backdrop-blur-xl">
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
            ["Cadets", img.cadets],
            ["Air Force", img.airforce],
            ["Mentor Loop", img.navy]
          ].map(([label, image]) => (
            <div key={label} className="relative h-32 overflow-hidden rounded border border-white/12 bg-cover bg-center shadow-[0_16px_44px_rgba(5,10,20,0.18)]" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.04),rgba(5,10,20,0.64)),url('${image}')` }}>
              <span className="absolute bottom-3 left-3 rounded bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f6f3ec] text-[#111827]">
      <section className="relative min-h-screen overflow-hidden bg-[#0b1424] px-4 pb-14 pt-28 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(5,10,20,0.88),rgba(5,10,20,0.46),rgba(5,10,20,0.78)),url('${img.hero}')` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(240,215,138,0.22),transparent_24rem),radial-gradient(circle_at_82%_18%,rgba(38,58,143,0.28),transparent_26rem)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="inline-flex rounded-full border border-[#f0d78a]/35 bg-[#f0d78a]/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0d78a] backdrop-blur-xl">
              AI-Powered Defence Career & Performance Ecosystem
            </p>
            <h1 className="mt-7 max-w-4xl text-6xl font-semibold leading-[0.88] sm:text-8xl">
              FROM ASPIRANT
              <span className="block text-[#f0d78a]">TO OFFICER.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/82 sm:text-2xl">
              AI-powered defence career and performance ecosystem for NDA, CDS, AFCAT, SSB and beyond.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Cta href="/start-free">Start Free <ArrowRight className="h-4 w-4" /></Cta>
              <Cta href="/programs" variant="secondary">Explore Academy</Cta>
              <Cta href="/guru" variant="secondary">Explore NIDUS Guru</Cta>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold text-white/82 backdrop-blur-xl">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
          <HeroVisual />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro eyebrow="Why NIDUS" title="A performance campus, not a tuition website." text="NIDUS connects academy training, AI intelligence, mentor guidance, and active student transformation." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {why.map(([title, text, Icon]) => (
              <motion.article key={title} whileHover={{ y: -4 }} className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_18px_60px_rgba(19,35,72,0.08)]">
                <Icon className="h-6 w-6 text-[#263a8f]" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#536072]">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionIntro eyebrow="Academy Programs" title="Choose your defence path." text="Academy programs build the base. Top Rank gives the exam practice arena." />
            <Cta href="/programs" variant="dark">View Academy <ArrowRight className="h-4 w-4" /></Cta>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {programs.map(([title, text, href, image, Icon]) => (
              <Link key={title} href={href} className="group relative min-h-[23rem] overflow-hidden rounded-lg border border-white/20 bg-[#111827] shadow-[0_26px_80px_rgba(19,35,72,0.16)]">
                <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.06),rgba(5,10,20,0.80)),url('${image}')` }} />
                <div className="relative flex min-h-[23rem] flex-col justify-between p-5 text-white">
                  <Icon className="h-7 w-7 text-[#f0d78a]" />
                  <div>
                    <h3 className="text-4xl font-semibold leading-tight">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/76">{text}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f0d78a]">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0b1424] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-24" style={{ backgroundImage: `url('${img.drdo}')` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1424_0%,rgba(11,20,36,0.92)_54%,rgba(11,20,36,0.72)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionIntro eyebrow="Top Rank" title="A separate AI practice arena for serious exam preparation." text="Profiling, diagnostics, AI roadmap, adaptive learning, revision system, mock intelligence, and mentor loop." light />
          <div className="grid gap-4 sm:grid-cols-2">
            {["Profiling", "Diagnostics", "AI Roadmap", "Mock Intelligence", "Revision System", "Mentor Loop"].map((item, index) => (
              <motion.div key={item} whileHover={{ y: -4 }} className="rounded-lg border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl">
                <span className="text-3xl font-semibold text-[#f0d78a]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-5 text-lg font-semibold">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro eyebrow="Training Atmosphere" title="Students should feel the discipline before they join." text="Realistic visual signals of training, teamwork, parade discipline, and officer ambition." />
          <div className="mt-10 grid gap-4 lg:grid-cols-6">
            {atmosphere.map(([title, image, Icon], index) => (
              <PhotoPanel key={title} title={title} image={image} icon={Icon} className={index < 2 ? "lg:col-span-3" : "lg:col-span-2"} />
            ))}
          </div>
        </div>
      </section>

      <section id="guru" className="bg-[#fbf7ef] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionIntro eyebrow="NIDUS Guru" title="Know yourself. Transform daily." text="A cleaner personal growth layer for assessments, transformation, and Dream Addiction." />
          <div className="grid gap-4 md:grid-cols-3">
            {guru.map(([title, text, href, Icon]) => (
              <Link key={title} href={href} className="group rounded-lg border border-[#6f744e]/12 bg-white p-5 shadow-[0_18px_60px_rgba(48,54,35,0.10)] transition hover:-translate-y-1">
                <Icon className="h-6 w-6 text-[#6f744e]" />
                <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 min-h-16 text-sm leading-6 text-[#5d6653]">{text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#6f744e]">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-[#263a8f]/10 bg-white p-6 shadow-[0_26px_80px_rgba(19,35,72,0.10)] lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Free Assessments</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Discover your strengths before your journey begins.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#536072]">Psychometric analysis, personality, confidence, career intelligence, and leadership analysis in simple language.</p>
            <div className="mt-8">
              <Cta href="/start-free" variant="dark">Start Free <ClipboardCheck className="h-4 w-4" /></Cta>
            </div>
          </div>
          <div className="grid gap-3">
            {["Psychometric Analysis", "Personality", "Confidence", "Career Intelligence", "Leadership Analysis"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded border border-[#263a8f]/10 bg-[#f8fafc] p-4 text-sm font-semibold text-[#111827]">
                <CheckCircle2 className="h-4 w-4 text-[#138a5b]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0b1424] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-54" style={{ backgroundImage: `url('${img.para}')` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,20,0.92),rgba(5,10,20,0.58),rgba(5,10,20,0.84))]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0d78a]">Final Call</p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight sm:text-7xl">Your Uniform Journey Starts Here.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Cta href="/join">Join NIDUS</Cta>
            <Cta href="/start-free" variant="secondary">Start Free</Cta>
            <Cta href="/join" variant="secondary">Talk to Mentor</Cta>
          </div>
        </div>
      </section>
    </main>
  );
}
