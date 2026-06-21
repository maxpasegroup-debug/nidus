"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Brain, Crosshair, Dumbbell, Flag, Plane, Sailboat, Shield, ShieldCheck, Ship, Sparkles, Swords, UserRound } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { academyProgramGroups } from "@/data/academy-programs";
import { topRankApplyHref, topRankDivisions, topRankPrograms } from "@/data/top-rank";

const divisionIcons = {
  army: Swords,
  navy: Ship,
  "air-force": Plane,
  "coast-guard": Sailboat,
  "officer-entry": Shield,
} as const;

const topRankExamGroups = [
  { label: "Army", exams: ["NDA", "CDS", "TES", "TGC", "Agniveer Army", "SSB"] },
  { label: "Navy", exams: ["NDA", "CDS", "SSR", "MR", "Agniveer Navy", "Navik"] },
  { label: "Air Force", exams: ["NDA", "CDS", "AFCAT", "Agniveer Air Force"] },
  { label: "Coast Guard", exams: ["Navik", "Yantrik", "Assistant Commandant"] },
  { label: "Customs", exams: ["Preventive Officer", "Excise Inspector", "Intelligence Bureau"] },
];

const questCards = [
  { title: "Dream Discipline", text: "Convert ambition into daily action.", icon: Flag },
  { title: "Focus Reset", text: "Build distraction control for study and training.", icon: Brain },
  { title: "Warrior Routine", text: "Create sleep, fitness and study consistency.", icon: Dumbbell },
  { title: "Confidence Builder", text: "Prepare for interviews, SSB and public speaking.", icon: UserRound },
];

function cleanTitle(title: string) {
  return title.replace("(TM)", "").replace("â„¢", "").trim();
}

export function GuestApplicantDashboard({ name }: { name?: string | null }) {
  const visibleAssessments = assessmentCatalog.slice(0, 15);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-6 shadow-xl md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Applicant Lobby</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                Welcome{name ? `, ${name}` : ""}. Choose your NIDUS path.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                Explore assessments, TOP RANK exam coaching, NIDUS Guru quests and academy courses. Full learner tools unlock after the Administrative Officer approves admission, records fees and assigns your batch.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Admission Status</p>
              <h2 className="mt-2 text-2xl font-black">Not activated yet</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Apply for a course. AO approval will unlock Classes, Assignments, Exams, Attendance, Library and NIDUS Digital Profile.</p>
            </div>
          </div>
        </section>

        <section id="assessments" className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Assessments</p>
              <h2 className="mt-2 text-3xl font-black">Defence readiness assessments</h2>
            </div>
            <Link href="/psychometric" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visibleAssessments.map((assessment) => {
              const Icon = assessment.icon ?? ShieldCheck;
              return (
                <Link key={assessment.id} href={`/psychometric/${assessment.id}`} className="group min-h-48 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:bg-white">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-black leading-tight">{cleanTitle(assessment.title)}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-blue)]">{assessment.subtitle}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="top-rank" className="rounded-3xl border border-slate-950 bg-slate-950 p-5 text-white shadow-xl md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e7c873]">TOP RANK</p>
              <h2 className="mt-2 text-3xl font-black">AI powered exam coaching loop</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                Choose a defence route, complete profiling, then start the strict practice loop. Starter, Pro and TOP RANK tiers control intensity, review depth and exam frequency.
              </p>
            </div>
            <Link href="/top-rank" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7c873]/40 bg-[#e7c873] px-4 py-3 text-sm font-black text-slate-950">
              Open TOP RANK
            </Link>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[...topRankDivisions, { slug: "customs", title: "Customs", tagline: "Customs, excise and uniformed civil service pathways." }].map((division) => {
              const Icon = divisionIcons[division.slug as keyof typeof divisionIcons] ?? Crosshair;
              const group = topRankExamGroups.find((item) => item.label.toLowerCase().includes(division.title.toLowerCase().split(" ")[0])) ?? topRankExamGroups.find((item) => item.label === "Customs");
              return (
                <article key={division.slug} className="rounded-2xl border border-white/15 bg-white/8 p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#e7c873]/35 bg-[#e7c873]/10">
                    <Icon className="h-6 w-6 text-[#e7c873]" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black">{division.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{division.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(group?.exams ?? []).slice(0, 5).map((exam) => (
                      <Link key={exam} href={topRankApplyHref(exam)} className="rounded-full border border-white/15 px-3 py-1 text-xs font-black text-white/85 hover:border-[#e7c873] hover:text-[#e7c873]">
                        {exam}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Starter", "Explore path, light practice and basic profiling.", "Free / entry"],
              ["Pro", "Structured practice, review loops and weekly rhythm.", "Guided"],
              ["TOP RANK", "Strict daily 2-exam loop for serious aspirants.", "Rs 4999/month"],
            ].map(([title, text, price]) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/8 p-5">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
                <p className="mt-4 text-sm font-black text-[#e7c873]">{price}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="guru" className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">NIDUS Guru</p>
          <h2 className="mt-2 text-3xl font-black">Quests for personal transformation</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {questCards.map((quest) => {
              const Icon = quest.icon;
              return (
                <Link key={quest.title} href="/guru" className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5 transition hover:-translate-y-1 hover:bg-white">
                  <Icon className="h-7 w-7 text-[var(--gold)]" />
                  <h3 className="mt-4 text-xl font-black">{quest.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{quest.text}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="academy" className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academy</p>
              <h2 className="mt-2 text-3xl font-black">Apply for NIDUS Academy courses</h2>
            </div>
            <Link href="/start-free" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]">
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-5">
            {academyProgramGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                <h3 className="text-2xl font-black">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{group.subtitle}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.programs.map((program) => (
                    <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
                      <BookOpenCheck className="h-6 w-6 text-[var(--gold)]" />
                      <h4 className="mt-4 text-xl font-black">{program.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{program.outcome}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
