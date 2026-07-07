"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Brain, Dumbbell, Flag, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { academyProgramGroups } from "@/data/academy-programs";

const questCards = [
  { title: "Dream Discipline", text: "Convert ambition into daily action.", icon: Flag },
  { title: "Focus Reset", text: "Build distraction control for study and training.", icon: Brain },
  { title: "Warrior Routine", text: "Create sleep, fitness and study consistency.", icon: Dumbbell },
  { title: "Confidence Builder", text: "Prepare for interviews, SSB and public speaking.", icon: UserRound },
];

function cleanTitle(title: string) {
  return title.replace("(TM)", "").replace("â„¢", "").trim();
}

function academyApplyHref(program?: string) {
  const params = new URLSearchParams({ intent: "academy" });
  if (program) params.set("program", program);
  return `/start-free?${params.toString()}`;
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
                Explore assessments, NIDUS Guru quests and academy courses. Full learner tools unlock after the Administrative Officer approves admission, records fees and assigns your batch.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Admission Status</p>
              <h2 className="mt-2 text-2xl font-black">Not activated yet</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Apply for a course. AO approval will unlock Classes, Assignments, Exams, Attendance, Library and NIDUS Digital Profile.</p>
            </div>
          </div>
        </section>

        <section id="applications" className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Applications</p>
              <h2 className="mt-2 text-3xl font-black">Admission unlocks your learner dashboard.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                Apply for a course first. After the Administrative Officer verifies documents, records fee payment and assigns your batch, this lobby changes into the full academic dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["1", "Apply", "Choose your course and submit details."],
                ["2", "AO Review", "Documents, fee and batch are verified."],
                ["3", "Activation", "Classes, exams, assignments and library unlock."],
                ["4", "Start Learning", "Your academic dashboard becomes live."],
              ].map(([step, title, text]) => (
                <div key={step} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] text-sm font-black">{step}</span>
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
                </div>
              ))}
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
            <Link href={academyApplyHref("NIDUS Academy")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]">
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
                    <Link key={program.slug} href={academyApplyHref(program.title)} className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
                      <BookOpenCheck className="h-6 w-6 text-[var(--gold)]" />
                      <h4 className="mt-4 text-xl font-black">{program.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{program.outcome}</p>
                      <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-black">Apply for this course</span>
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
