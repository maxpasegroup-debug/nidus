"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, Dumbbell, Flag, MessageCircle, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
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
  const primaryActions = [
    { title: "Apply for a course", text: "Choose NDA, CDS, AFCAT, Agniveer, Sainik School or another NIDUS program.", href: "/dashboard/guest/academy", icon: BookOpenCheck, primary: true },
    { title: "Take free assessment", text: "Understand your defence readiness before admission.", href: "/dashboard/guest/assessments", icon: ShieldCheck },
    { title: "Continue NIDUS Guru", text: "Build discipline, focus and confidence through guided quests.", href: "/dashboard/guest/guru", icon: Sparkles },
  ];
  const pageCopy: Record<GuestApplicantView, { eyebrow: string; title: string; description: string }> = {
    applications: {
      eyebrow: "Applicant Lobby",
      title: `Welcome${name ? `, ${name}` : ""}. Start with one simple step.`,
      description: "Apply for a course, take a readiness assessment or continue NIDUS Guru. Full student access opens after admission activation.",
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
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[26px] border border-[var(--border)] bg-white/96 p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-stretch">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{copy.eyebrow}</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)] md:text-base">{copy.description}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {primaryActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                        action.primary ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"
                      }`}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white shadow-sm"><Icon className="h-5 w-5 text-[var(--gold)]" /></span>
                      <h2 className="mt-4 text-lg font-black">{action.title}</h2>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted-blue)]">{action.text}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-black">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <aside className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <div className="rounded-2xl border border-[var(--gold-border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">Application Status</p>
                <h2 className="mt-2 text-2xl font-black">Not submitted yet</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Choose a course when you are ready. The academy office will guide the next step after submission.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://wa.me/" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">
                  <Phone className="h-4 w-4" /> Help
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {showApplications ? <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Applications</p>
              <h2 className="mt-2 text-3xl font-black">No application is linked yet.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                Once you apply, this page becomes your simple status tracker: submitted, office review, payment guidance and student activation.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard/guest/academy" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]">
                  Apply for a Course <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/guest/assessments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black text-[var(--navy)]">
                  Start Assessments
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                ["1", "Apply", "Choose a program and submit the form."],
                ["2", "Academy office review", "Our team checks details and contacts you."],
                ["3", "Student access", "Classes, lessons and timetable open after activation."],
              ].map(([step, title, text]) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black">{step}</span>
                  <div>
                    <h3 className="font-black">{title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p>
                  </div>
                </div>
              ))}
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

        <section className="grid gap-3 rounded-[24px] border border-[var(--border)] bg-white/95 p-5 shadow-sm md:grid-cols-3">
          {[
            ["Simple start", "Apply, assess or continue Guru from one screen."],
            ["Office guided", "The academy team will contact you after application."],
            ["Student unlock", "Full timetable, classes, videos and exams open only after activation."],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
