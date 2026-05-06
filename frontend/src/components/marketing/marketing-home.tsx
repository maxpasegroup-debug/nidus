"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  LineChart,
  LockKeyhole,
  Map,
  Medal,
  MessageSquare,
  Phone,
  Radar,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Users,
  Video,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const exams = [
  { name: "NDA", metric: "Foundation to officer pipeline", copy: "Maths, GAT, current affairs, mock tests, fitness discipline, and AI revision." },
  { name: "CDS", metric: "Graduate command track", copy: "Written readiness, interview practice, personality development, and analytics." },
  { name: "AFCAT", metric: "Air Force aptitude layer", copy: "Reasoning, verbal ability, general awareness, EKT readiness, and speed drills." },
  { name: "Agniveer", metric: "Service-ready preparation", copy: "Academics, physical readiness, discipline logs, and live class command." },
  { name: "SSB", metric: "Psychology + GTO + interview", copy: "OLQ tracking, AI interview simulation, WAT, TAT, SRT, and conference readiness." },
  { name: "AISSEE", metric: "School-level military path", copy: "Foundational academics, parent visibility, progress reports, and disciplined routines." },
  { name: "RIMC", metric: "Elite military school entry", copy: "Structured learning, mock exams, interview preparation, and weekly mentor review." },
  { name: "RMS", metric: "Military school readiness", copy: "Coursework, practice sets, counselling, attendance, and performance intelligence." }
];

const featureGroups: Array<{ title: string; icon: LucideIcon; copy: string }> = [
  { title: "AI Interview Simulator", icon: BrainCircuit, copy: "Practice SSB-style interviews with structured scoring for clarity, confidence, and officer presence." },
  { title: "Psychometric Analysis", icon: Radar, copy: "Map personality signals, behavioural trends, and readiness gaps with mentor-grade interpretation." },
  { title: "OLQ Tracking", icon: LineChart, copy: "Track leadership, initiative, responsibility, courage, expression, and social adaptability over time." },
  { title: "Mock Tests", icon: Target, copy: "Timed tests, OMR palettes, rankings, result charts, analytics, and exam-wise performance loops." },
  { title: "Live Classes", icon: Video, copy: "Cohort learning, lecture progress, recorded sessions, countdowns, and mobile-first class access." },
  { title: "CRM + Admissions", icon: Users, copy: "Counselling, leads, referrals, follow-ups, admissions, branch workflows, and academy conversion visibility." },
  { title: "Hostel + Discipline", icon: Shield, copy: "Rooms, leave, in-out records, mess, parade scores, discipline history, and parent transparency." },
  { title: "Executive Analytics", icon: BarChart3, copy: "Branch performance, audit logs, role permissions, revenue, course adoption, and operating command." }
];

const mentorSignals = [
  ["Interview confidence", "86%"],
  ["OLQ development", "78%"],
  ["Mock test accuracy", "91%"],
  ["Physical consistency", "72%"]
];

const stories = [
  { name: "Aarav Singh", rank: "Recommended, NDA", quote: "The interview drills trained me to answer with structure, ownership, and calm under pressure.", score: "AIR 42" },
  { name: "Meera Nair", rank: "AFCAT Selected", quote: "My lectures, mocks, recommendations, and mentor notes finally worked like one mission plan.", score: "AFCAT 96%" },
  { name: "Rohan Verma", rank: "SSB Conference Out", quote: "The OLQ tracker made improvement visible every week. It changed the way I trained.", score: "SSB Ready" }
];

const faculty = [
  ["Ex-Armed Forces Mentors", "Officer mindset, service culture, discipline, and interview authenticity."],
  ["SSB Psychologists", "Psychometric interpretation, OLQ mapping, and behavioural coaching."],
  ["Defence Exam Faculty", "NDA, CDS, AFCAT, AISSEE, RIMC, RMS, current affairs, and PYQ mastery."],
  ["Fitness + Drill Coaches", "Physical consistency, parade discipline, endurance, and daily accountability."]
];

const appScreens = ["Mock Test", "AI Mentor", "Live Class", "Parent View"];
const missionStats = [
  ["8", "Defence pathways"],
  ["15+", "Academy modules"],
  ["24/7", "AI mentor layer"],
  ["360", "Officer readiness view"]
];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">{copy}</p>
    </Reveal>
  );
}

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-gold/8 blur-3xl transition duration-500 group-hover:bg-gold/16" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:[background:radial-gradient(circle_at_var(--x,50%)_var(--y,0%),rgba(242,214,117,0.16),transparent_18rem)]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function CinematicFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-gold/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035))] shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      <div className="relative">{children}</div>
    </div>
  );
}

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep shadow-[0_24px_70px_rgba(201,166,70,0.26)] transition hover:-translate-y-0.5 hover:bg-gold-soft sm:px-6">
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-white/15 bg-white/7 px-5 py-3 text-sm font-semibold text-ink backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/10 sm:px-6">
      {children}
    </Link>
  );
}

function HeroVisual() {
  return (
    <motion.aside initial={{ opacity: 0, scale: 0.94, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.8 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-gold/12 blur-3xl" />
      <CinematicFrame className="p-4 sm:p-5">
        <div className="relative min-h-[31rem] overflow-hidden rounded border border-white/10 bg-[#071221]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.10),rgba(3,8,18,0.78)),url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(242,214,117,0.28),transparent_14rem)]" />
          <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
            <span className="rounded border border-gold/35 bg-gold/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">Command Readiness</span>
            <Sparkles className="h-6 w-6 text-gold-soft" />
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <div className="rounded border border-white/12 bg-black/35 p-4 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">NIDUS AI Mentor</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">Mission Readiness</h2>
                </div>
                <BrainCircuit className="h-8 w-8 text-gold-soft" />
              </div>
              <div className="mt-5 space-y-4">
                {mentorSignals.map(([label, value]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm text-ink"><span>{label}</span><span className="text-gold-soft">{value}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: value }} transition={{ delay: 0.8, duration: 1.2 }} className="h-full rounded-full bg-gold" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CinematicFrame>
    </motion.aside>
  );
}

export function MarketingHome() {
  const { scrollYProgress } = useScroll();
  const heroShift = useTransform(scrollYProgress, [0, 0.35], [0, -72]);
  const gridShift = useTransform(scrollYProgress, [0, 1], [0, -180]);

  return (
    <main className="bg-[#030812] text-ink">
      <section id="home" className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.35),#030812_88%),url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85')] bg-cover bg-center opacity-75" />
        <motion.div style={{ y: gridShift }} className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:78px_78px] opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_22%,rgba(201,166,70,0.30),transparent_27rem),radial-gradient(circle_at_16%_34%,rgba(46,121,255,0.16),transparent_30rem),linear-gradient(90deg,#030812_0%,rgba(3,8,18,0.42)_54%,#030812_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#030812] to-transparent" />

        <motion.div style={{ y: heroShift }} className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-12 lg:grid-cols-[1fr_31rem] lg:items-center">
          <div>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold uppercase tracking-[0.32em] text-gold-soft">India's Next Defence Intelligence Platform</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] text-ink sm:text-7xl lg:text-8xl">
              Train Like An Officer.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-7 max-w-2xl text-base leading-8 text-muted sm:text-xl">
              NIDUS is a premium AI-powered defence preparation ecosystem for NDA, CDS, AFCAT, SSB, AISSEE, RIMC, RMS, and academy operations.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/register">Start Your Mission <ArrowRight className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="#ai-platform">Explore Academy <ChevronRight className="h-4 w-4" /></SecondaryCta>
              <SecondaryCta href="/contact">Join Live Demo <Video className="h-4 w-4" /></SecondaryCta>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="mt-8 flex flex-wrap gap-2">
              {["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "RMS"].map((item) => (
                <span key={item} className="rounded border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold-soft">{item}</span>
              ))}
            </motion.div>
          </div>
          <HeroVisual />
        </motion.div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.035] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {missionStats.map(([value, label]) => (
            <Reveal key={label} className="rounded border border-white/10 bg-black/20 p-5 text-center backdrop-blur-xl">
              <p className="text-3xl font-semibold text-gold-soft">{value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="about" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="About NIDUS" title="A next-generation officer training operating system." copy="Built for aspirants, parents, faculty, counsellors, and academy leadership, NIDUS turns preparation into a disciplined intelligence loop." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ["Academics", GraduationCap, "Structured courses, tests, lectures, current affairs, PYQs, and daily readiness plans."],
            ["Officer Mindset", Medal, "SSB psychology, OLQ tracking, AI interviews, discipline, physical logs, and mentor review."],
            ["Academy Command", Landmark, "CRM, ERP, hostel, fees, communication, media, documents, and admin control."]
          ].map(([title, Icon, copy]) => {
            const CardIcon = Icon as LucideIcon;
            return (
              <GlowCard key={String(title)} className="p-6">
                <CardIcon className="h-7 w-7 text-gold-soft" />
                <h3 className="mt-5 text-xl font-semibold text-ink">{String(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{String(copy)}</p>
              </GlowCard>
            );
          })}
        </Reveal>
      </section>

      <section id="exams" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(201,166,70,0.14),transparent_30rem)]" />
        <SectionTitle eyebrow="Defence Exams" title="Every major defence pathway in one elite academy layer." copy="From school-level military entry to officer selection boards, every pathway gets exam content, analytics, mentorship, and disciplined execution." />
        <Reveal className="relative mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exams.map((exam, index) => (
            <GlowCard key={exam.name} className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Formation {String(index + 1).padStart(2, "0")}</p>
                <CircleDot className="h-5 w-5 text-gold-soft" />
              </div>
              <h3 className="mt-5 text-4xl font-semibold text-ink">{exam.name}</h3>
              <p className="mt-2 text-sm font-semibold text-gold-soft">{exam.metric}</p>
              <p className="mt-4 text-sm leading-7 text-muted">{exam.copy}</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      <section id="ai-platform" className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(201,166,70,0.22),transparent_25rem),linear-gradient(180deg,#030812,rgba(8,18,32,0.86),#030812)]" />
        <SectionTitle eyebrow="Meet NIDUS AI" title="Your personal defence mentor." copy="A Siri-like AI layer for interview simulation, doubt solving, recommendations, progress interpretation, and officer potential analysis." />
        <Reveal className="relative mx-auto mt-14 grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }} className="absolute inset-6 rounded-full border border-gold/20 border-t-gold" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }} className="absolute inset-16 rounded-full border border-white/12 border-b-gold/70" />
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }} className="h-52 w-52 rounded-full bg-[radial-gradient(circle,#f2d675_0%,#c9a646_24%,rgba(201,166,70,0.14)_58%,transparent_72%)] shadow-[0_0_130px_rgba(201,166,70,0.38)]" />
            <BrainCircuit className="absolute h-16 w-16 text-navy-deep" />
            {["Interview", "OLQ", "Tests", "Fitness"].map((item, index) => (
              <div key={item} className={`absolute rounded border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-muted backdrop-blur-xl ${index === 0 ? "left-0 top-16" : index === 1 ? "right-0 top-28" : index === 2 ? "bottom-20 left-6" : "bottom-14 right-10"}`}>
                {item}
              </div>
            ))}
          </div>
          <CinematicFrame className="p-5 sm:p-6">
            <div className="space-y-4">
              {[
                ["Aspirant", "How do I improve my SRT responses before SSB?"],
                ["NIDUS AI", "Prioritize decision clarity, responsibility, and speed. I generated 12 drills for your weakest OLQs."],
                ["Aspirant", "Simulate an interview question on leadership."],
                ["NIDUS AI", "Tell me about a time you led under pressure. Answer in 90 seconds; I will score confidence and structure."]
              ].map(([speaker, text]) => (
                <div key={text} className={`rounded border p-4 ${speaker === "NIDUS AI" ? "ml-auto max-w-[88%] border-gold/30 bg-gold/12 text-gold-soft" : "max-w-[84%] border-white/10 bg-white/7 text-ink"}`}>
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">{speaker}</p>
                  <p className="mt-2 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Recommendation Engine", "Interview Scoring", "Study Planner"].map((item) => (
                <div key={item} className="rounded border border-white/10 bg-black/20 p-3 text-xs font-semibold text-muted">{item}</div>
              ))}
            </div>
          </CinematicFrame>
        </Reveal>
      </section>

      <section id="ssb" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="SSB Training" title="Psychology, interview, GTO, and OLQ training with precision." copy="NIDUS brings SSB preparation out of guesswork and into measurable officer-quality development." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <CinematicFrame className="min-h-[31rem] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.12),rgba(3,8,18,0.85)),url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=85')] bg-cover bg-center" />
            <div className="relative flex min-h-[31rem] items-end p-6 sm:p-8">
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Officer Potential System</p>
                <h3 className="mt-4 text-3xl font-semibold text-ink sm:text-5xl">Turn personality into a training map.</h3>
                <p className="mt-4 text-sm leading-7 text-muted">Psychometric attempts, OLQ scores, mentor observations, and AI recommendations combine into a single readiness picture.</p>
              </div>
            </div>
          </CinematicFrame>
          <div className="grid gap-4">
            {[
              ["Psychometric + OLQ System", ClipboardCheck],
              ["AI Interview Simulation", MessageSquare],
              ["GTO + Conference Readiness", Map]
            ].map(([title, Icon]) => {
              const CardIcon = Icon as LucideIcon;
              return (
                <GlowCard key={String(title)} className="p-6">
                  <CardIcon className="h-7 w-7 text-gold-soft" />
                  <h3 className="mt-5 text-xl font-semibold text-ink">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">Realistic tasks, structured scoring, and mentor-grade insights for officer readiness.</p>
                </GlowCard>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section id="courses" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Courses & Features" title="A complete defence academy ecosystem." copy="From public discovery to institutional operations, NIDUS keeps the entire academy mission inside one polished platform." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureGroups.map(({ title, icon: Icon, copy }) => (
            <GlowCard key={title} className="p-5">
              <Icon className="h-6 w-6 text-gold-soft" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_28rem] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Mobile App Showcase</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-ink sm:text-5xl lg:text-6xl">An app-like training command center in every cadet's pocket.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">Offline PWA support, mobile navigation, live class access, test attempts, notifications, and parent visibility create a polished daily-use experience.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Daily mission plan", "Live class alerts", "Mock test attempts", "Parent performance visibility"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded border border-white/10 bg-white/7 p-4 text-sm text-muted backdrop-blur-xl">
                  <CheckCircle2 className="h-4 w-4 text-gold-soft" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-[34rem] w-full max-w-sm">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute left-0 top-8 h-[29rem] w-56 rotate-[-7deg] rounded-[2rem] border border-gold/25 bg-navy-deep p-3 shadow-[0_30px_90px_rgba(0,0,0,0.50)]">
              <div className="h-full rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(201,166,70,0.24),transparent_42%),#06111f] p-5">
                <Smartphone className="h-7 w-7 text-gold-soft" />
                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold-soft">Today's Mission</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">NDA Mock + AI Drill</h3>
                <div className="mt-8 space-y-3">{appScreens.map((item) => <div key={item} className="rounded border border-white/10 bg-white/7 p-3 text-sm text-muted">{item}</div>)}</div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute right-0 top-0 h-[31rem] w-60 rotate-[7deg] rounded-[2rem] border border-white/12 bg-[#071221] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="h-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
                <Activity className="h-7 w-7 text-gold-soft" />
                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold-soft">Readiness</p>
                <h3 className="mt-3 text-5xl font-semibold text-ink">91%</h3>
                <div className="mt-8 space-y-3">
                  {mentorSignals.slice(0, 3).map(([label, value]) => <div key={label} className="rounded border border-white/10 bg-white/7 p-3 text-sm text-muted">{label}: <span className="text-gold-soft">{value}</span></div>)}
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </section>

      <section id="success" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Success Stories" title="Built for aspirants who think like officers." copy="Cinematic success cards show the outcome NIDUS is designed to produce: disciplined preparation, higher confidence, and measurable readiness." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-3">
          {stories.map((story) => (
            <GlowCard key={story.name} className="p-6">
              <div className="flex items-center justify-between">
                <Award className="h-7 w-7 text-gold-soft" />
                <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-soft">{story.score}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">{story.name}</h3>
              <p className="mt-1 text-sm text-gold-soft">{story.rank}</p>
              <p className="mt-4 text-sm leading-7 text-muted">"{story.quote}"</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Leadership & Faculty" title="A premium academy needs an elite mentorship layer." copy="NIDUS is structured for armed forces mentors, SSB experts, faculty, trainers, counsellors, and academy leadership." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {faculty.map(([title, copy]) => (
            <GlowCard key={title} className="p-6">
              <Users className="h-6 w-6 text-gold-soft" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Parent & Academy Features" title="Aspirants train. Parents see. Academies command." copy="NIDUS gives every stakeholder a dedicated view without fragmenting the institution across disconnected tools." />
        <Reveal className="mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Parent Dashboard", LockKeyhole, "Fees, attendance, discipline, performance, counselling visibility, and progress reassurance."],
            ["Academy CRM", CalendarClock, "Leads, admissions, follow-ups, counselling, referrals, and branch operations."],
            ["Executive Control", Zap, "Roles, permissions, audit logs, settings, media, documents, and analytics."]
          ].map(([title, Icon, copy]) => {
            const CardIcon = Icon as LucideIcon;
            return (
              <GlowCard key={String(title)} className="p-6">
                <CardIcon className="h-6 w-6 text-gold-soft" />
                <h3 className="mt-4 text-xl font-semibold text-ink">{String(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{String(copy)}</p>
              </GlowCard>
            );
          })}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <CinematicFrame className="mx-auto max-w-5xl p-8 text-center sm:p-12">
            <Trophy className="mx-auto h-10 w-10 text-gold-soft" />
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-gold-soft">Join The Mission</p>
            <h2 className="mt-5 text-4xl font-semibold text-ink sm:text-6xl">The future of defence training starts here.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">Build officer mindset with AI precision, disciplined training, institutional visibility, and a premium academy experience.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryCta href="/register">Start Your Mission <ArrowRight className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="/contact">Contact NIDUS <Phone className="h-4 w-4" /></SecondaryCta>
            </div>
          </CinematicFrame>
        </Reveal>
      </section>
    </main>
  );
}
