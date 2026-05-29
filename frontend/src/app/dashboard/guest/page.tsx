"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, CalendarDays, ClipboardCheck, Crown, GraduationCap, Rocket, ShieldCheck, Sparkles, Star, Trophy, UserRound } from "lucide-react";
import {
  RoleDashboardGuard
} from "@/components/dashboard";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { academyMenuItems, guruRecordedQuests, topRankExams } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { createPublicLead } from "@/services/crm";

const silverAssessmentIds = [
  "officer-readiness",
  "defence-career-fit",
  "discipline-index",
  "focus-strength",
  "leadership-dna",
  "dream-addiction-index",
  "confidence-index",
  "future-readiness"
];

const exclusiveAssessmentId = "ssb-psychology-simulator";
const silverAssessments = silverAssessmentIds
  .map((id) => assessmentCatalog.find((assessment) => assessment.id === id))
  .filter((assessment): assessment is NonNullable<typeof assessment> => Boolean(assessment));
const exclusiveAssessment = assessmentCatalog.find((assessment) => assessment.id === exclusiveAssessmentId);
const goldenAssessments = assessmentCatalog.filter((assessment) => !silverAssessmentIds.includes(assessment.id) && assessment.id !== exclusiveAssessmentId);

const guestMenus = [
  {
    title: "NDP",
    subtitle: "Nidus Digital Profile",
    description: "Build a simple student profile step by step with NIDUS AI. Add your dream, strengths, studies, achievements, and share a profile you feel proud of.",
    href: "/digital-profile",
    icon: UserRound,
    action: "Build My Profile"
  },
  {
    title: "Assessments",
    subtitle: "Find your defence potential",
    description: "Start with free Silver tests. Upgrade to Golden or the Exclusive SSB Simulator when you want a deeper report.",
    href: "/dashboard/assessments",
    icon: ClipboardCheck,
    action: "Start Tests"
  },
  {
    title: "Top Rank",
    subtitle: "AI-powered exam coaching",
    description: "Train with an AI Trainer for NDA, CDS, AFCAT and defence exams through practice, correction, and daily exam missions.",
    href: "/dashboard/toprank",
    icon: BrainCircuit,
    action: "Open Top Rank"
  },
  {
    title: "Nidus Guru",
    subtitle: "Grab an extraordinary life",
    description: "Personal growth quests that help students build focus, confidence, discipline, ambition, and better habits.",
    href: "/dashboard/nidus-guru",
    icon: Sparkles,
    action: "Explore Guru"
  },
  {
    title: "Nidus Academy",
    subtitle: "Complete defence training ecosystem",
    description: "Learn with professional trainers, classroom support, physical training, mentoring, tests, and admission guidance.",
    href: "/dashboard/academy",
    icon: GraduationCap,
    action: "View Academy"
  },
  {
    title: "Events & Workshops",
    subtitle: "Online and offline programs",
    description: "See upcoming camps, workshops, counselling days, bootcamps, and special NIDUS events.",
    href: "#events",
    icon: CalendarDays,
    action: "Show Interest"
  }
];

export default function GuestDashboardPage() {
  const { user } = useAuth();
  const [eventName, setEventName] = useState(user?.name ?? "");
  const [eventPhone, setEventPhone] = useState(user?.mobile ?? "");
  const [eventInterest, setEventInterest] = useState("Defence workshop");
  const [eventStatus, setEventStatus] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);

  async function submitEventInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventSubmitting(true);
    setEventStatus("");
    try {
      await createPublicLead({
        fullName: eventName || user?.name || "Guest Student",
        mobile: eventPhone || user?.mobile || "0000000000",
        email: user?.email ?? `${Date.now()}@events.nidus.local`,
        targetExam: eventInterest,
        source: "Guest Dashboard Events & Workshops",
        message: `Interested in: ${eventInterest}`
      });
      setEventStatus("Interest saved. NIDUS team can contact you.");
    } catch (_error) {
      setEventStatus("Could not save now. Please try again.");
    } finally {
      setEventSubmitting(false);
    }
  }

  return (
    <RoleDashboardGuard role="GUEST">
      <motion.div className="space-y-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <section className="relative overflow-hidden rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#b9913f]/16 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">My Journey</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">
                Welcome{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#40516a]">
                Start with your digital profile, try assessments, explore Top Rank, Nidus Guru, Academy programs, and upcoming events.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/digital-profile">Build NDP <ArrowRight className="h-4 w-4" /></Button>
                <Button href="/dashboard/assessments" variant="secondary">Start Free Assessment</Button>
              </div>
            </div>
            <div className="rounded-lg border border-[#071d36]/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] backdrop-blur-xl">
              <ShieldCheck className="h-7 w-7 text-[#b9913f]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Your NIDUS access is active</h2>
              <div className="mt-5 grid gap-3 text-sm">
                <StatusRow label="NDP setup" value="Start now" />
                <StatusRow label="Silver tests" value="Free" />
                <StatusRow label="Academy application" value="Available" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {guestMenus.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.title} href={module.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3f4a32]">{module.subtitle}</p>
                    <h2 className="mt-1 text-xl font-semibold text-[#071d36]">{module.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{module.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                      {module.action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <Panel eyebrow="NDP" title="Nidus Digital Profile">
          <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div>
              <p className="text-sm leading-7 text-[#64748b]">NIDUS AI helps students build their profile in baby steps: name, dream, strengths, school, achievements, defence interest, skills, and next goal.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Add basic details", "Add your dream", "Share your profile"].map((item, index) => (
                  <div key={item} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm font-semibold text-[#071d36]">
                    <span className="text-[#b9913f]">0{index + 1}</span>
                    <p className="mt-2">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button href="/digital-profile">Setup My NDP</Button>
          </div>
        </Panel>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel eyebrow="Assessments" title="Silver, Golden and Exclusive tests">
            <Tier title="Silver Tests" price="Free" icon={<Star className="h-5 w-5" />} items={silverAssessments.map((item) => item.title.replace("(TM)", ""))} />
            <Tier title="Golden Tests" price="Rs 499 + GST" icon={<Crown className="h-5 w-5" />} items={goldenAssessments.map((item) => item.title.replace("(TM)", ""))} />
            {exclusiveAssessment ? <Tier title="Exclusive SSB Simulator" price="Rs 999 + GST" icon={<Trophy className="h-5 w-5" />} items={[exclusiveAssessment.title.replace("(TM)", ""), "TAT style thinking", "WAT response pattern", "SRT decision behaviour", "Self-description insight"]} /> : null}
            <div className="mt-5">
              <Button href="/dashboard/assessments">Open Assessments</Button>
            </div>
          </Panel>

          <Panel eyebrow="Top Rank" title="AI-powered exam coaching">
            <p className="text-sm leading-7 text-[#64748b]">Top Rank feels like having an AI Trainer for defence exams. Pick an exam, practise daily, improve speed, correct mistakes, and follow your mission plan.</p>
            <div className="mt-5 grid gap-3">
              {topRankExams.slice(0, 4).map((exam) => (
                <Link key={exam.slug} href="/dashboard/toprank" className="flex items-center justify-between rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 text-sm font-semibold text-[#071d36] transition hover:bg-white hover:border-[#b9913f]/45">
                  {exam.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel eyebrow="Nidus Guru" title="Grab an extraordinary life with Nidus Guru">
            <p className="text-sm leading-7 text-[#64748b]">Short personal-growth quests for school students who want better focus, stronger discipline, confidence, and a bigger dream.</p>
            <div className="mt-5 grid gap-3">
              {guruRecordedQuests.slice(0, 4).map((quest) => (
                <Link key={quest.slug} href="/dashboard/nidus-guru" className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 transition hover:border-[#b9913f]/45 hover:bg-white">
                  <p className="text-sm font-semibold text-[#071d36]">{quest.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">Coming soon</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Nidus Academy" title="Train with extraordinary professional trainers">
            <p className="text-sm leading-7 text-[#64748b]">The complete NIDUS ecosystem: classroom training, physical training, tests, mentoring, discipline, and admission support.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {academyMenuItems.slice(0, 6).map(([label, href]) => (
                <Link key={label} href={href} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3 text-sm font-semibold text-[#071d36] transition hover:border-[#b9913f]/45 hover:bg-white">
                  {label}
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section id="events" className="grid gap-6 xl:grid-cols-[1fr_26rem]">
          <Panel eyebrow="Events & Workshops" title="Upcoming NIDUS programs">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Defence Career Day", "Offline counselling and academy visit."],
                ["NDA Awareness Class", "Online session for students and parents."],
                ["Fitness Bootcamp", "Ground session for stamina and discipline."]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-[#b9913f]/30 bg-[#fff7de] p-4">
                  <CalendarDays className="h-5 w-5 text-[#8a6426]" />
                  <h3 className="mt-3 font-semibold text-[#071d36]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
                  <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3f4a32]">Coming soon</span>
                </div>
              ))}
            </div>
          </Panel>

          <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Show Interest</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">Tell us what you want to attend</h2>
            <form className="mt-5 grid gap-3" onSubmit={submitEventInterest}>
              <input value={eventName} onChange={(event) => setEventName(event.target.value)} className="h-11 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#071d36] outline-none focus:border-[#b9913f]" placeholder="Student name" required />
              <input value={eventPhone} onChange={(event) => setEventPhone(event.target.value)} className="h-11 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#071d36] outline-none focus:border-[#b9913f]" placeholder="WhatsApp number" required />
              <select value={eventInterest} onChange={(event) => setEventInterest(event.target.value)} className="h-11 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#071d36] outline-none focus:border-[#b9913f]">
                <option>Defence workshop</option>
                <option>NDA awareness class</option>
                <option>Fitness bootcamp</option>
                <option>Parent counselling event</option>
              </select>
              <Button type="submit" disabled={eventSubmitting}>{eventSubmitting ? "Saving..." : "I am interested"}</Button>
              {eventStatus ? <p className="text-sm font-semibold text-[#3f4a32]">{eventStatus}</p> : null}
            </form>
          </section>
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-[#071d36] p-6 text-white shadow-[0_24px_80px_rgba(7,29,54,0.18)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e7c873]">Next Step</p>
              <h2 className="mt-3 text-3xl font-semibold">Ready to apply for NIDUS Academy?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Submit your details for program guidance, counselling and admission support.</p>
            </div>
            <Button href="/join">Apply Now <Rocket className="h-4 w-4" /></Button>
          </div>
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-[#071d36]/10 bg-white px-3 py-2">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-semibold text-[#071d36]">{value}</span>
    </div>
  );
}

function Tier({ title, price, icon, items }: { title: string; price: string; icon: ReactNode; items: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-[#b9913f]/35 bg-[#fffdf8] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#8a6426]">
          {icon}
          <h3 className="font-semibold text-[#071d36]">{title}</h3>
        </div>
        <span className="rounded-full bg-[#fff7de] px-3 py-1 text-xs font-bold text-[#071d36]">{price}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-[#071d36]/10 bg-white px-3 py-1 text-xs font-semibold text-[#40516a]">{item}</span>
        ))}
      </div>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
