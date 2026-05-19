"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from "lucide-react";

const pillars = [
  {
    title: "For Students",
    text: "Daily study priorities, weak-topic revision, doubt support, test practice, and officer-readiness direction.",
    points: ["Study planner", "Weak topic alerts", "Revision actions", "Interview practice"],
    icon: GraduationCap
  },
  {
    title: "For Teachers",
    text: "AI support for question-paper drafts, lesson planning, progress review, and simple next actions for weak students.",
    points: ["Question generation", "Lesson support", "Test review", "Student actions"],
    icon: ClipboardList
  },
  {
    title: "For Management",
    text: "Institution intelligence across admissions, academics, fee follow-ups, staff work, and monthly reports.",
    points: ["Pending work", "Risk alerts", "Department view", "Director summary"],
    icon: BarChart3
  }
];

const workflow = [
  "Student studies, attends classes, and attempts tests.",
  "Teachers upload materials, host exams, and record observations.",
  "NIDUS AI reads the learning pattern and suggests next actions.",
  "Progress reports become clear for parents, teachers, and the director."
];

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-white/70 bg-white/64 shadow-[0_24px_80px_rgba(19,35,72,0.12)] backdrop-blur-2xl ${className}`}>{children}</div>;
}

export default function NidusAiEcosystemPage() {
  return (
    <main className="bg-[#f6f7fb] text-[#111827]">
      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(38,58,143,0.18),transparent_30rem),radial-gradient(circle_at_82%_12%,rgba(201,166,70,0.22),transparent_28rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_86%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-12 lg:grid-cols-[1fr_30rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a646]/35 bg-[#fff8dd]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c6418] shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              NIDUS AI
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[1.02] text-[#111827] sm:text-7xl">
              India&apos;s first AI powered defence learning ecosystem.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">
              NIDUS AI is designed to sit inside the academy experience: helping students study better, helping teachers create and review, and helping management understand what needs attention.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
                Enquire Admission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/20 bg-white/70 px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-[0_12px_30px_rgba(38,58,143,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5">
                Create Account
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.7 }} className="relative">
            <div className="absolute -inset-8 rounded-full bg-[#263a8f]/10 blur-3xl" />
            <GlassPanel className="relative overflow-hidden p-6">
              <div className="relative grid min-h-[30rem] place-items-center rounded-lg border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.90),rgba(238,242,255,0.76))] p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(201,166,70,0.22),transparent_16rem)]" />
                <div className="relative grid h-48 w-48 place-items-center rounded-full border border-[#263a8f]/15 bg-white/80 shadow-[0_26px_90px_rgba(38,58,143,0.18)]">
                  <div className="absolute inset-5 rounded-full border border-[#c9a646]/35" />
                  <BrainCircuit className="h-20 w-20 text-[#263a8f]" />
                </div>
                <div className="relative mt-8 grid w-full gap-3">
                  {[
                    ["Ask what to study today", Target],
                    ["Generate and arrange test questions", ClipboardList],
                    ["Explain monthly progress", Radar],
                    ["Guide academy pending work", ShieldCheck]
                  ].map(([label, Icon]) => {
                    const ItemIcon = Icon;
                    return (
                      <div key={String(label)} className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/72 p-4 text-sm font-semibold text-[#111827] shadow-sm backdrop-blur-xl">
                        <ItemIcon className="h-5 w-5 text-[#263a8f]" />
                        {String(label)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">How It Helps</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#111827] sm:text-5xl">One AI layer for the whole academy.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072] sm:text-base">The power should feel advanced, but the language should stay simple for students, parents, teachers, and management.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-7xl gap-5 lg:grid-cols-3">
          {pillars.map(({ title, text, points, icon: Icon }) => (
            <GlassPanel key={title} className="p-6">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#263a8f]/10 text-[#263a8f]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#536072]">{text}</p>
              <div className="mt-5 grid gap-3">
                {points.map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-[#536072]">
                    <CheckCircle2 className="h-4 w-4 text-[#263a8f]" />
                    {point}
                  </div>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <GlassPanel className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Monthly Intelligence</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827]">Tests, aptitude, psychometric growth, and progress reports become one picture.</h2>
            <p className="mt-5 text-sm leading-7 text-[#536072]">NIDUS AI should help the academy move from simple marks to a smarter growth view: accuracy, speed, attendance, EQ, OLQ, teacher remarks, and next-month targets.</p>
          </GlassPanel>
          <div className="grid gap-4">
            {workflow.map((item, index) => (
              <GlassPanel key={item} className="flex items-center gap-4 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#263a8f] text-sm font-bold text-white">{index + 1}</div>
                <p className="text-sm leading-6 text-[#536072]">{item}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <GlassPanel className="mx-auto max-w-5xl p-8 text-center sm:p-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#263a8f]/10 text-[#263a8f]">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">A modern academy advantage students can feel.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#536072]">The public promise is simple: premium defence coaching, structured learning, and AI support that helps every aspirant train with more clarity.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
              Talk to NIDUS <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded border border-[#263a8f]/20 bg-white/70 px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-[0_12px_30px_rgba(38,58,143,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5">
              Back to Home
            </Link>
          </div>
        </GlassPanel>
      </section>
    </main>
  );
}
