"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Dumbbell,
  GraduationCap,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnnouncementCard, ProgressCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";
import type { StudentDashboardData } from "@/services/dashboard";
import type { AuthUser } from "@/services/auth.v2";

type ProfileArea = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tag: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  const usefulValues = values.filter((value) => Number.isFinite(value));
  return usefulValues.length ? usefulValues.reduce((sum, value) => sum + value, 0) / usefulValues.length : 0;
}

function getProfileCompletion(data: StudentDashboardData) {
  const checks = [
    data.profile?.name,
    data.profile?.email,
    data.enrolledCourses.length > 0,
    data.attendance.total > 0,
    data.upcomingTests.length > 0,
    data.fitnessProgress.score > 0,
    data.aiRecommendations.length > 0,
    data.recentActivities.length > 0
  ];

  return clampScore((checks.filter(Boolean).length / checks.length) * 100);
}

function getDefencePotentialScore(data: StudentDashboardData) {
  const learningScore = data.enrolledCourses.length ? average(data.enrolledCourses.map((course) => course.progress)) : 0;
  const assessmentSignal = data.upcomingTests.length ? 54 : 30;
  const engagementSignal = Math.min(100, data.recentActivities.length * 16);

  return clampScore(average([learningScore, data.attendance.percentage, data.fitnessProgress.score, assessmentSignal, engagementSignal]));
}

function getReadinessBand(score: number) {
  if (score >= 80) return "Officer track";
  if (score >= 60) return "Developing officer profile";
  if (score >= 40) return "Foundation build";
  return "Profile setup needed";
}

function getArchetype(score: number) {
  if (score >= 82) return "The Commander";
  if (score >= 68) return "The Strategist";
  if (score >= 54) return "The Builder";
  if (score >= 40) return "The Warrior";
  return "The Starter";
}

export function DigitalProfileOverview({ data, user }: { data: StudentDashboardData; user?: AuthUser | null }) {
  const activeCourse = data.enrolledCourses[0];
  const profileCompletion = getProfileCompletion(data);
  const defencePotentialScore = getDefencePotentialScore(data);
  const readinessBand = getReadinessBand(defencePotentialScore);
  const archetype = getArchetype(defencePotentialScore);
  const targetExam = activeCourse?.title?.match(/NDA|CDS|AFCAT|SSB|AISSEE|RIMC|INET/i)?.[0]?.toUpperCase() ?? "Defence Career";

  const profileAreas: ProfileArea[] = [
    {
      title: "Basic Profile",
      value: data.profile?.name ?? user?.name ?? "Student",
      description: `${data.profile?.email ?? user?.email ?? "Email pending"} • Target: ${targetExam}`,
      icon: UserRound,
      href: "/dashboard/settings",
      tag: "Identity"
    },
    {
      title: "Defence Goal",
      value: targetExam,
      description: "Primary mission focus derived from current course and academy pathway.",
      icon: ShieldCheck,
      href: "/courses",
      tag: "Mission"
    },
    {
      title: "Learning Profile",
      value: activeCourse ? `${activeCourse.progress}%` : "0%",
      description: activeCourse ? `${activeCourse.title} • Next: ${activeCourse.nextLesson}` : "Enroll in a course to activate learning profile.",
      icon: GraduationCap,
      href: "/my-courses",
      tag: "Learning"
    },
    {
      title: "Assessment Profile",
      value: `${data.upcomingTests.length}`,
      description: "Assessment ecosystem connects officer readiness, OLQ, leadership, discipline, focus, and career fit.",
      icon: ClipboardCheck,
      href: "/psychometric",
      tag: "Assessments"
    },
    {
      title: "Discipline Profile",
      value: `${data.attendance.percentage}%`,
      description: `${data.attendance.present}/${data.attendance.total} sessions marked. Attendance is the first discipline signal.`,
      icon: Target,
      href: "/progress-reports",
      tag: "Discipline"
    },
    {
      title: "Physical Profile",
      value: `${data.fitnessProgress.score}%`,
      description: `${data.fitnessProgress.focus} • ${data.fitnessProgress.streakDays} day fitness streak.`,
      icon: Dumbbell,
      href: "/fitness",
      tag: "Training"
    },
    {
      title: "Guru Profile",
      value: "Ready",
      description: "NIDUS Guru quests will connect focus, habits, Dream Addiction Index, and life direction.",
      icon: Sparkles,
      href: "/guru",
      tag: "Mindset"
    },
    {
      title: "Readiness Score",
      value: `${defencePotentialScore}/100`,
      description: `${readinessBand} • Archetype: ${archetype}`,
      icon: Medal,
      href: "/progress-reports",
      tag: "Hybrid"
    }
  ];

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Digital Hybrid Profile"
        title={`${data.profile?.name ?? user?.name ?? "Student"}'s defence readiness identity`}
        description="A full student profile connecting learning, training, assessments, discipline, fitness, NIDUS Guru, and progress reporting into one hybrid defence profile."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/psychometric" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
              Complete Assessments <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/guru" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              Start Guru Quest <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        }
        stats={[
          { value: `${defencePotentialScore}/100`, label: "defence potential" },
          { value: `${profileCompletion}%`, label: "profile completion" },
          { value: archetype, label: "current archetype" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Target Pathway" value={targetExam} note={activeCourse?.title ?? "Set through course enrollment"} />
        <StatCard label="Profile Completion" value={`${profileCompletion}%`} note="Hybrid profile data connected" />
        <StatCard label="Readiness Band" value={readinessBand} note={`Archetype: ${archetype}`} />
        <StatCard label="Connected Systems" value="8" note="Learning, training, assessments, Guru and reports" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <ProgressCard title="Defence Potential Score" value={defencePotentialScore} label={readinessBand} />
          <ProgressCard title="Profile Completion" value={profileCompletion} label="Basic, learning, discipline, assessment and training signals" />
          <ProgressCard title="Discipline Signal" value={data.attendance.percentage} label={`${data.attendance.present}/${data.attendance.total} attendance records`} />
        </div>
        <div className="premium-surface rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Hybrid Summary</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Current profile interpretation</h2>
            </div>
            <BrainCircuit className="h-6 w-6 text-gold" />
          </div>
          <div className="mt-5 grid gap-3">
            {[
              `Your current readiness band is ${readinessBand}.`,
              activeCourse ? `Learning profile is active through ${activeCourse.title}.` : "Learning profile needs course enrollment to become fully active.",
              data.attendance.total ? `Discipline profile is based on ${data.attendance.total} attendance records.` : "Discipline profile will strengthen after attendance records are added.",
              "Assessment profile will become detailed once the full 15-assessment ecosystem is completed.",
              "NIDUS Guru will add focus, confidence, life direction, and habit transformation signals."
            ].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <SectionHeader eyebrow="Profile Areas" title="Connected student intelligence layers" action="Phase 1 foundation" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {profileAreas.map(({ title, value, description, icon: Icon, href, tag }) => (
          <Link key={title} href={href}>
            <motion.article whileHover={{ y: -5 }} className="h-full rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">{tag}</span>
                <Icon className="h-5 w-5 text-gold-soft" />
              </div>
              <p className="mt-5 text-sm text-muted">{title}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </motion.article>
          </Link>
        ))}
      </section>

      <SectionHeader eyebrow="Next Actions" title="Make this profile more accurate" />
      <section className="grid gap-4 md:grid-cols-3">
        <AnnouncementCard title="Complete Officer Readiness" description="Adds officer mindset, discipline, leadership, courage and responsibility signals." tag="Assessment" />
        <AnnouncementCard title="Start Dream Addiction Index" description="Connects focus, distraction, ambition intensity and Guru quest recommendations." tag="Guru" />
        <AnnouncementCard title="Build physical profile" description="Fitness and PT signals will improve the training layer of the hybrid profile." tag="Training" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Assessments", href: "/psychometric", icon: ClipboardCheck },
          { title: "Progress Report", href: "/progress-reports", icon: Activity },
          { title: "NIDUS Guru", href: "/guru", icon: Sparkles }
        ].map(({ title, href, icon: Icon }) => (
          <Link key={title} href={href} className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><Icon className="h-5 w-5" /> {title}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </section>
    </motion.div>
  );
}
