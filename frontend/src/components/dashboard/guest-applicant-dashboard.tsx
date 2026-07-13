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

function academyApplyHref(programSlug?: string) {
  return programSlug ? `/programs/${programSlug}#apply` : "/programs";
}

export type GuestApplicantView = "applications" | "assessments" | "guru" | "academy";

export function GuestApplicantDashboard({ name, view = "applications" }: { name?: string | null; view?: GuestApplicantView }) {
  const visibleAssessments = assessmentCatalog.slice(0, 15);
  const showApplications = view === "applications";
  const showAssessments = view === "assessments";
  const showGuru = view === "guru";
  const showAcademy = view === "academy";
  const pageCopy: Record<GuestApplicantView, { eyebrow: string; title: string; description: string }> = {
    applications: {
      eyebrow: "Applicant Lobby",
      title: `Welcome${name ? `, ${name}` : ""}. Your applications will appear here.`,
      description: "Use this space to review submitted course applications and admission updates once an application is created.",
    },
    assessments: {
      eyebrow: "Assessments",
      title: "Defence readiness assessments",
      description: "Open any psychometric or readiness assessment as an applicant. Your full academic profile unlocks after admission activation.",
    },
    guru: {
      eyebrow: "NIDUS Guru",
      title: "Quests for personal transformation",
      description: "Use guided quests to build discipline, focus, confidence and daily defence preparation habits before admission activation.",
    },
    academy: {
      eyebrow: "Academy Courses",
      title: "Apply for NIDUS Academy courses",
      description: "Choose the defence program you want. Your application reaches the Administrative Officer for counselling, fee recording and batch allocation.",
    },
  };
  const copy = pageCopy[view];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-6 shadow-xl md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{copy.eyebrow}</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                {copy.description}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Admission Status</p>
              <h2 className="mt-2 text-2xl font-black">Not activated yet</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Apply for a course. AO approval will unlock Classes, Assignments, Exams, Attendance, Library and NIDUS Digital Profile.</p>
            </div>
          </div>
        </section>

        {showApplications ? <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Applications</p>
              <h2 className="mt-2 text-3xl font-black">No course application is linked yet.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                Submitted applications, counselling notes and admission updates will be shown here after you apply for a NIDUS Academy course.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard/guest/academy" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]">
                  View Academy Courses <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/guest/assessments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black text-[var(--navy)]">
                  Start Assessments
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Current Status</p>
              <h3 className="mt-3 text-2xl font-black">Applicant access active</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                Assessments, NIDUS Guru and academy course browsing are available from the mobile menu. Full learner tools unlock after admission activation.
              </p>
            </div>
          </div>
        </section> : null}

        {showAssessments ? <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
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
        </section> : null}

        {showGuru ? <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
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
        </section> : null}

        {showAcademy ? <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academy</p>
              <h2 className="mt-2 text-3xl font-black">Apply for NIDUS Academy courses</h2>
            </div>
            <Link href={academyApplyHref()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]">
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
                    <Link key={program.slug} href={academyApplyHref(program.slug)} className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
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
        </section> : null}
      </section>
    </main>
  );
}
