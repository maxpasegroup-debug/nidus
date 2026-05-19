"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Landmark,
  Medal,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
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

const aiAdvantages: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "AI Study Direction", text: "Students can get daily study priorities, weak-topic guidance, and revision actions.", icon: BrainCircuit },
  { title: "AI Exam Support", text: "Teachers can create exam drafts, arrange questions, and publish timed tests faster.", icon: ClipboardList },
  { title: "AI Progress Insight", text: "Monthly reports can connect marks, attendance, psychometric growth, and next actions.", icon: Radar },
  { title: "AI Interview Practice", text: "Aspirants can train for officer-style answers, confidence, and communication.", icon: MessageCircle }
];

const pathways = ["NDA", "CDS", "AFCAT", "INET", "AISSEE", "RIMC", "Agniveer", "SSB"];

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

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#111827] sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072] sm:text-base">{text}</p>
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

function LogoMark() {
  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full border border-[#263a8f]/20 bg-white/75 shadow-[0_24px_70px_rgba(38,58,143,0.18)] backdrop-blur-2xl">
      <div className="absolute inset-3 rounded-full border border-[#c9a646]/35" />
      <div className="absolute inset-8 rounded-full bg-[#263a8f]/8" />
      <ShieldCheck className="relative h-16 w-16 text-[#263a8f]" />
      <div className="absolute -bottom-3 rounded bg-[#263a8f] px-5 py-2 text-lg font-black tracking-[0.16em] text-white shadow-lg">NIDUS</div>
    </div>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f6f7fb] text-[#111827]">
      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(38,58,143,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(201,166,70,0.20),transparent_26rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_82%)]" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center opacity-[0.09]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-12 lg:grid-cols-[1fr_31rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#263a8f]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#263a8f] shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#c9a646]" />
              India&apos;s AI powered defence learning ecosystem
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[1.02] text-[#111827] sm:text-7xl">
              NIDUS Academy
              <span className="block text-[#263a8f]">from aspirant to officer.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">
              A premium defence entrance academy for foundation, NDA, CDS, AFCAT, AISSEE, RIMC, Agniveer, and SSB training, strengthened by NIDUS AI for smarter study, exams, and progress.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/contact">Enquire Admission <ArrowRight className="h-4 w-4" /></PrimaryCta>
              <SecondaryCta href="/nidus-ai-ecosystem">Explore NIDUS AI <BrainCircuit className="h-4 w-4" /></SecondaryCta>
              <SecondaryCta href="/login">Student Login <ShieldCheck className="h-4 w-4" /></SecondaryCta>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {pathways.map((item) => (
                <span key={item} className="rounded-full border border-[#263a8f]/15 bg-white/65 px-3 py-2 text-xs font-semibold text-[#263a8f] shadow-sm backdrop-blur-xl">{item}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.7 }} className="relative">
            <div className="absolute -inset-8 rounded-full bg-[#263a8f]/10 blur-3xl" />
            <GlassCard className="relative overflow-hidden p-5">
              <div className="relative min-h-[31rem] overflow-hidden rounded-lg border border-white/80 bg-white/60">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.40),rgba(255,255,255,0.90))]" />
                <div className="relative flex min-h-[31rem] flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#c9a646]/40 bg-[#fff8dd]/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6d17]">Nurturing dreams into success</span>
                    <Medal className="h-7 w-7 text-[#c9a646]" />
                  </div>
                  <LogoMark />
                  <div className="grid gap-3">
                    {[
                      ["AI study plan", BrainCircuit],
                      ["Live and recorded classes", Video],
                      ["Monthly tests and progress", CalendarCheck]
                    ].map(([label, Icon]) => {
                      const CardIcon = Icon as LucideIcon;
                      return (
                        <div key={String(label)} className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
                          <CardIcon className="h-5 w-5 text-[#263a8f]" />
                          <span className="text-sm font-semibold text-[#111827]">{String(label)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <section id="programs" className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Programs" title="Three clear channels of training." text="NIDUS keeps the academy offer simple for parents and students, while the platform behind it stays powerful." />
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

      <section id="ai-advantage" className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(38,58,143,0.08),rgba(201,166,70,0.10),rgba(255,255,255,0))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">NIDUS AI Advantage</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">Not just coaching. An AI powered learning ecosystem for defence entry.</h2>
            <p className="mt-5 text-sm leading-7 text-[#536072] sm:text-base">
              NIDUS AI should feel like a personal learning officer inside the academy: guiding students, supporting teachers, helping tests, and turning monthly performance into clear next actions.
            </p>
            <div className="mt-7">
              <PrimaryCta href="/nidus-ai-ecosystem">Open NIDUS AI Page <ArrowRight className="h-4 w-4" /></PrimaryCta>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aiAdvantages.map(({ title, text, icon: Icon }) => (
              <GlassCard key={title} className="p-5">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#263a8f]/10 text-[#263a8f]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#111827]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#536072]">{text}</p>
              </GlassCard>
            ))}
          </div>
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

      <section id="admissions" className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <GlassCard className="mx-auto max-w-5xl p-8 text-center sm:p-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#263a8f]/10 text-[#263a8f]">
            <Medal className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Admissions</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">Start the right defence pathway with NIDUS.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072]">
            Students can enquire for foundation programs, defence entrance coaching, specialized modules, live classes, recorded courses, and AI powered learning support.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryCta href="/contact">Enquire Now <ArrowRight className="h-4 w-4" /></PrimaryCta>
            <SecondaryCta href="/register">Create Account</SecondaryCta>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
