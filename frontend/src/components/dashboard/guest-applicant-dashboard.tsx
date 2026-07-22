"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, Dumbbell, Flag, MessageCircle, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { academyProgramGroups } from "@/data/academy-programs";
import { getMyGuestApplications } from "@/services/crm";
import type { Lead } from "@/types/crm";

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

function noteHas(lead: Lead, text: string) {
  return String(lead.notes || "").toUpperCase().includes(text.toUpperCase());
}

function applicationStatus(lead?: Lead | null) {
  if (!lead) return { title: "Not Applied", text: "Choose a course when you are ready.", step: 0 };
  if (lead.status === "ENROLLED") return { title: "Activated", text: "Student access is ready. Open the student dashboard.", step: 6 };
  if (noteHas(lead, "READY FOR ADMISSION") || noteHas(lead, "READY_FOR_ADMISSION")) return { title: "Batch Allocation", text: "Your file is ready for final batch allocation and activation.", step: 5 };
  if (noteHas(lead, "FEES: PENDING") || noteHas(lead, "FEES: PARTIAL")) return { title: "Fees Pending", text: "The office will guide payment or fee confirmation.", step: 4 };
  if (noteHas(lead, "DOCUMENTS: VERIFIED")) return { title: "Fees Pending", text: "Documents are checked. Fee confirmation is the next step.", step: 4 };
  if (noteHas(lead, "DOCUMENTS: REJECTED") || noteHas(lead, "DOCUMENTS: PENDING")) return { title: "Documents Pending", text: "The office may ask for document correction or verification.", step: 3 };
  if (noteHas(lead, "AO_QUEUE: YES") || noteHas(lead, "APPLICATION_STATUS: SUBMITTED")) return { title: "Office Review", text: "Your application has reached the Admission Cell.", step: 2 };
  return { title: "Submitted", text: "Your application is captured and waiting for review.", step: 1 };
}

export type GuestApplicantView = "applications" | "assessments" | "guru" | "academy";

export function GuestApplicantDashboard({ name, view = "applications" }: { name?: string | null; view?: GuestApplicantView }) {
  const applicationsQuery = useQuery({ queryKey: ["guest", "applications"], queryFn: getMyGuestApplications, retry: false });
  const applications = applicationsQuery.data ?? [];
  const latestApplication = applications[0] ?? null;
  const status = applicationStatus(latestApplication);
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
                <h2 className="mt-2 text-2xl font-black">{applicationsQuery.isLoading ? "Checking..." : status.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{status.text}</p>
                {latestApplication ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-black">{latestApplication.targetExam}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://wa.me/918593950774" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800">
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
              <h2 className="mt-2 text-3xl font-black">{applicationsQuery.isLoading ? "Checking your application..." : latestApplication ? status.title : "No application is linked yet."}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                {latestApplication ? status.text : "Once you apply, this page becomes your simple status tracker: submitted, office review, payment guidance and student activation."}
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
                ["1", "Submitted", "Application received by NIDUS."],
                ["2", "Office Review", "Admission Cell checks your details."],
                ["3", "Documents Pending", "Documents are verified if needed."],
                ["4", "Fees Pending", "Office guides payment confirmation."],
                ["5", "Batch Allocation", "Batch is selected for your program."],
                ["6", "Activated", "Student dashboard opens."],
              ].map(([step, title, text], index) => (
                <div key={step} className={`flex gap-3 rounded-2xl border p-4 ${status.step >= index + 1 ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black">{step}</span>
                  <div>
                    <h3 className="font-black">{title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p>
                  </div>
                </div>
              ))}
              {applications.slice(1).map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <h3 className="font-black">{lead.targetExam}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{applicationStatus(lead).title} / {new Date(lead.createdAt).toLocaleDateString()}</p>
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
