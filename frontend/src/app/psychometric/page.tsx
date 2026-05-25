"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ClipboardCheck, Compass, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";

const groups = [
  {
    title: "Start Free",
    subtitle: "Best first tests for students and parents.",
    ids: ["officer-readiness", "discipline-index", "leadership-dna", "defence-career-fit", "dream-addiction-index"],
    icon: ClipboardCheck,
    color: "bg-[#f0faf4] border-[#138a5b]/16 text-[#138a5b]"
  },
  {
    title: "Defence Career",
    subtitle: "Understand Army, Navy, Air Force, SSB, and service fit.",
    ids: ["defence-career-fit", "officer-readiness", "defence-mindset-scan", "warrior-fitness-mindset"],
    icon: ShieldCheck,
    color: "bg-[#eef3ff] border-[#263a8f]/16 text-[#263a8f]"
  },
  {
    title: "Personality & Leadership",
    subtitle: "Confidence, command, teamwork, and communication.",
    ids: ["leadership-dna", "confidence-index", "command-communication", "teamwork-group-dynamics"],
    icon: Trophy,
    color: "bg-[#fff8dd] border-[#c9a646]/24 text-[#7c6418]"
  },
  {
    title: "SSB & Premium Reports",
    subtitle: "Advanced interpretation for serious candidates.",
    ids: ["olq-analyzer", "ssb-psychology-simulator", "emotional-stability", "future-readiness"],
    icon: BrainCircuit,
    color: "bg-white border-[#111827]/10 text-[#111827]"
  }
];

function accessStyle(access: string) {
  if (access === "FREE") return "bg-[#eaf7ef] text-[#138a5b]";
  if (access === "PREMIUM") return "bg-[#111827] text-white";
  return "bg-[#eef3ff] text-[#263a8f]";
}

export default function PsychometricPage() {
  return (
    <div className="bg-[#f7f9fc] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.14),transparent_28rem),radial-gradient(circle_at_82%_14%,rgba(255,153,51,0.16),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_25rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Assessments</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] sm:text-7xl">Know your defence potential.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">
              Simple tests for officer readiness, career fit, leadership, focus, and SSB preparation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5">
                Start Free Tests <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/18 bg-white px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5">
                Save My Reports
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_24px_80px_rgba(19,35,72,0.10)]">
            <Compass className="h-7 w-7 text-[#c9a646]" />
            <h2 className="mt-5 text-3xl font-semibold">What happens after a test?</h2>
            <div className="mt-6 grid gap-3">
              {["Score", "Simple report", "Suggested next step", "Profile connection"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded border border-[#263a8f]/10 bg-[#f8fafc] p-3 text-sm font-semibold">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs text-[#263a8f]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="start-free" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8">
          {groups.map(({ title, subtitle, ids, icon: GroupIcon, color }) => {
            const items = ids.map((id) => assessmentCatalog.find((assessment) => assessment.id === id)).filter(Boolean);
            return (
              <motion.article key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className={`rounded-lg border p-5 shadow-[0_18px_60px_rgba(19,35,72,0.08)] ${color}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <GroupIcon className="h-7 w-7" />
                    <h2 className="mt-4 text-3xl font-semibold text-[#111827]">{title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[#536072]">{subtitle}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]">{items.length} tests</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {items.map((assessment) => {
                    if (!assessment) return null;
                    const Icon = assessment.icon;
                    const href = assessment.access === "PREMIUM" ? "/subscriptions" : `/psychometric/${assessment.id}`;
                    return (
                      <Link key={assessment.id} href={href} className="group rounded-lg border border-[#263a8f]/10 bg-white p-4 text-[#111827] shadow-sm transition hover:-translate-y-1 hover:border-[#c9a646]/55 hover:shadow-[0_18px_42px_rgba(19,35,72,0.10)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded bg-[#f8fafc] text-[#263a8f]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${accessStyle(assessment.access)}`}>{assessment.access}</span>
                        </div>
                        <h3 className="mt-5 min-h-14 text-lg font-semibold leading-tight">{assessment.title.replace("(TM)", "")}</h3>
                        <p className="mt-2 min-h-16 text-xs leading-6 text-[#536072]">{assessment.subtitle}</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#263a8f]">
                          {assessment.access === "PREMIUM" ? "Unlock" : "Start"} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#c9a646]/20 bg-[#fff8dd] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Sparkles className="h-6 w-6 text-[#c2871d]" />
            <h2 className="mt-4 text-2xl font-semibold">For best clarity, start with Officer Readiness.</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b5a2b]">It gives students and parents a simple first view of defence potential.</p>
          </div>
          <Link href="/psychometric/officer-readiness" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Start Officer Readiness <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
