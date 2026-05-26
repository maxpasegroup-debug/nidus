"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, Dumbbell, Landmark, Medal, Radar, ShieldCheck, Target, Users } from "lucide-react";
import { academyCategories } from "@/components/academy/academy-programs";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { PublicCta, PublicMetricPanel, PublicNextStepBand, PublicSectionIntro } from "@/components/marketing/public-branding";

const heroMetrics: Array<[string, string]> = [
  ["Academy", "integrated campus"],
  ["Training", "classroom + physical"],
  ["Mentor", "officer guidance"],
  ["AI", "active learning"]
];

const trustSignals = [
  { title: "Officer Mentorship", text: "Mentor-led direction for discipline, character, communication, and defence ambition.", icon: Medal },
  { title: "AI Active Learning", text: "Study plans, tests, reports, and readiness signals connected to daily improvement.", icon: BrainCircuit },
  { title: "Physical Integration", text: "Ground discipline, energy, stamina, and leadership habits built with academic preparation.", icon: Dumbbell },
  { title: "Assessment-Led Guidance", text: "Psychometric and performance reports help students understand the right pathway.", icon: Radar }
];

const academyPillars = [
  "NDA and officer entrance readiness",
  "School-level defence foundation",
  "SSB confidence and personality development",
  "CBT, assessments, reports, and parent visibility"
];

export default function ProgramsPage() {
  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_84%_20%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,#f7f3ea)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_28rem] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">NIDUS Academy</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] text-[#071d36] sm:text-7xl">Premium Defence Entrance & Leadership Ecosystem.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b] sm:text-lg">
              A disciplined academy pathway for students preparing for NDA, Sainik School, RIMC, Agniveer, AFMC, SSB, and long-term leadership careers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicCta href="#program-categories">
                Explore Academy <ArrowRight className="h-4 w-4" />
              </PublicCta>
              <PublicCta href="/start-free?intent=academy" variant="secondary">
                Enquire Now
              </PublicCta>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {academyPillars.map((pillar) => (
                <div key={pillar} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-white/72 px-4 py-3 text-sm font-semibold text-[#071d36] shadow-sm backdrop-blur-xl">
                  <CheckCircle2 className="h-4 w-4 text-[#3f4a32]" />
                  {pillar}
                </div>
              ))}
            </div>
          </motion.div>
          <PublicMetricPanel eyebrow="Integrated Campus" title="Entrance + SSB + Fitness + Mindset" metrics={heroMetrics} />
        </div>
      </section>

      <section className="border-y border-[#071d36]/10 bg-white/82 px-4 py-6 text-[#071d36] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {["NDA", "AISSEE", "RIMC", "Agniveer", "SSB"].map((label) => (
            <a key={label} href="#program-categories" className="flex items-center justify-center gap-2 rounded border border-[#071d36]/10 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9913f]/60 hover:bg-[#f7f3ea]">
              <ShieldCheck className="h-4 w-4" />
              {label}
            </a>
          ))}
        </div>
      </section>

      <section id="program-categories" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSectionIntro eyebrow="Academy Programs" title="Clear categories for serious defence aspirants." text="Each pathway is designed to combine academics, discipline, mentoring, assessment insight, and measurable progress." />
          <div className="mt-12 grid gap-10">
            {academyCategories.map((category, categoryIndex) => (
              <motion.div key={category.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: categoryIndex * 0.05 }} className="rounded-lg border border-[#071d36]/10 bg-white/78 p-5 shadow-[0_24px_80px_rgba(7,29,54,0.10)] backdrop-blur-2xl sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32]">Category {categoryIndex + 1}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#071d36] sm:text-3xl">{category.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64748b]">{category.description}</p>
                  </div>
                  <Target className="hidden h-8 w-8 text-[#b9913f] sm:block" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {category.programs.map((program) => (
                    <Link key={program.slug} href={`/programs/${program.slug}`} className="group overflow-hidden rounded border border-[#071d36]/10 bg-white shadow-[0_16px_50px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/60">
                      <div className={`relative aspect-[16/8] bg-gradient-to-br ${program.imageTone}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.36),transparent_9rem),linear-gradient(0deg,rgba(0,0,0,0.38),transparent)]" />
                        <div className="absolute bottom-4 left-4 rounded border border-white/20 bg-white/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl">
                          Defence Pathway
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold leading-tight text-[#071d36]">{program.title}</h3>
                        <p className="mt-3 min-h-20 text-sm leading-7 text-[#64748b]">{program.summary}</p>
                        <div className="mt-5 grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f4a32]">
                          <span>{program.duration}</span>
                          <span>{program.targetStudents}</span>
                        </div>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                          View Program <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 text-[#101827] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSectionIntro eyebrow="Why NIDUS" title="Built like a real training campus." text="Classes, physical training, tests, reports, mentoring, and AI guidance work together." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustSignals.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-5 transition hover:-translate-y-1 hover:border-[#b9913f]/50 hover:bg-white">
                <Icon className="h-6 w-6 text-[#3f4a32]" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#64748b]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Admissions Support</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Need help choosing the right program?</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#64748b]">
              Share your class, goal, and preferred program. The enquiry will reach the lead management dashboard so the support team can respond quickly.
            </p>
            <div className="mt-6 grid gap-3">
              {["Saved to CRM leads", "Admin follow-up ready", "WhatsApp admission flow available"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#071d36]">
                  <ClipboardCheck className="h-4 w-4 text-[#3f4a32]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <ProgramEnquiryForm programTitle="Academy Program Enquiry" source="Academy Programs Page" />
        </div>
      </section>

      <PublicNextStepBand
        title="Your uniform journey starts with one clear conversation."
        text="Start with NIDUS AI Assistant or explore NIDUS Guru for assessments, TOPRANK exam coaching, and transformation quests."
        primaryHref="/start-free?intent=academy"
        primaryLabel="Join NIDUS"
        secondaryHref="/guru"
        secondaryLabel="Explore NIDUS Guru"
      />
    </div>
  );
}
