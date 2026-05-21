"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  ProgressCard,
  QuickActionCard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { PageHero } from "@/components/layout/page-hero";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { useStudentDashboard } from "@/hooks/use-dashboard";
import type { StudentDashboardData } from "@/services/dashboard";

const assessmentSignals = [
  { title: "Officer Readiness", description: "Officer mindset, leadership, discipline, initiative, courage, and responsibility.", tag: "Flagship" },
  { title: "OLQ Analyzer", description: "Effective intelligence, reasoning, initiative, courage, responsibility, adaptability, stamina, and confidence.", tag: "OLQ" },
  { title: "Discipline Index", description: "Routine discipline, consistency, punctuality, focus, and execution ability.", tag: "Conduct" },
  { title: "Leadership DNA", description: "Command style, teamwork, decision-making, influence, and emotional control.", tag: "Leader" },
  { title: "Focus Strength Index", description: "Distraction levels, focus capacity, mental endurance, and attention span.", tag: "Focus" },
  { title: "Defence Career Fit", description: "Army, Navy, Air Force, technical, combat, and leadership pathway suitability.", tag: "Career" }
];

const reportLayers = [
  { title: "Academic Performance", description: "Course progress, test attempts, subject score, weak topics, accuracy, speed, and monthly improvement.", tag: "Academic" },
  { title: "Assessment Intelligence", description: "Officer readiness, OLQ, discipline, focus, leadership DNA, confidence, career fit, and archetype.", tag: "Assessments" },
  { title: "Discipline & Consistency", description: "Attendance, punctuality, practice rhythm, routine strength, and execution behaviour.", tag: "Discipline" },
  { title: "Physical & Training Profile", description: "Fitness score, stamina focus, PT streak, physical mindset, and training readiness.", tag: "Training" },
  { title: "NIDUS Guru Growth", description: "Dream Addiction Index, focus reset, Life OS, confidence missions, and mindset transformation.", tag: "Guru" },
  { title: "Parent Summary", description: "Simple readable summary of strengths, risks, improvement areas, and next action for parents.", tag: "Parent" },
  { title: "Faculty Remarks", description: "Classroom effort, behaviour, subject focus, mentor observations, and teacher action notes.", tag: "Faculty" },
  { title: "Next Action Plan", description: "Recommended assessments, Guru quests, counselling steps, learning work, and fitness tasks.", tag: "Action" }
];

const monthlyTimeline = [
  "Week 1: learning completion, attendance discipline, and subject practice review.",
  "Week 2: free assessments, OLQ readiness, focus, confidence, discipline, and leadership signals.",
  "Week 3: mock tests, CBT performance, weak-topic review, and faculty intervention.",
  "Week 4: hybrid profile report, parent summary, mentor remarks, and next-month action plan."
];

const fallbackTrend = [
  { label: "Profile", score: 0, attendance: 0 },
  { label: "Learning", score: 0, attendance: 0 },
  { label: "Assess", score: 0, attendance: 0 },
  { label: "Report", score: 0, attendance: 0 }
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  const usefulValues = values.filter((value) => Number.isFinite(value));
  return usefulValues.length ? usefulValues.reduce((sum, value) => sum + value, 0) / usefulValues.length : 0;
}

function getProfileCompletion(data?: StudentDashboardData) {
  if (!data) return 0;
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

function getDefencePotentialScore(data?: StudentDashboardData) {
  if (!data) return 0;
  const learningScore = data.enrolledCourses.length ? average(data.enrolledCourses.map((course) => course.progress)) : 0;
  const assessmentSignal = data.upcomingTests.length ? 54 : 30;
  const engagementSignal = Math.min(100, data.recentActivities.length * 16);

  return clampScore(average([learningScore, data.attendance.percentage, data.fitnessProgress.score, assessmentSignal, engagementSignal]));
}

function getArchetype(score: number) {
  if (score >= 82) return "The Commander";
  if (score >= 68) return "The Strategist";
  if (score >= 54) return "The Builder";
  if (score >= 40) return "The Warrior";
  return "The Starter";
}

function getBand(score: number) {
  if (score >= 80) return "Officer track";
  if (score >= 60) return "Developing officer profile";
  if (score >= 40) return "Foundation build";
  return "Data needed";
}

export default function ProgressReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, refetch, isFetching } = useStudentDashboard();
  const isStudent = user?.role === "STUDENT";
  const usableData = isStudent ? data : undefined;
  const activeCourse = usableData?.enrolledCourses[0];
  const profileCompletion = getProfileCompletion(usableData);
  const defencePotentialScore = getDefencePotentialScore(usableData);
  const archetype = getArchetype(defencePotentialScore);
  const band = getBand(defencePotentialScore);
  const learningScore = activeCourse?.progress ?? 0;
  const attendanceScore = usableData?.attendance.percentage ?? 0;
  const fitnessScore = usableData?.fitnessProgress.score ?? 0;
  const assessmentScore = usableData?.upcomingTests.length ? 54 : 0;
  const chartData = usableData?.attendance.trend.length
    ? usableData.attendance.trend.map((item) => ({ label: item.month, score: defencePotentialScore, attendance: item.attendance }))
    : fallbackTrend;

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="NIDUS Hybrid Progress Profile"
        title="Monthly Defence Potential Report"
        description="An upgraded progress report that connects academic performance, assessments, OLQ, discipline, training, NIDUS Guru, faculty remarks, parent summary, and next actions."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => window.print()}>Print report</Button>
            {isStudent ? <Button type="button" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Refreshing..." : "Refresh profile"}</Button> : null}
          </div>
        }
        stats={[
          { value: `${defencePotentialScore}/100`, label: "defence potential" },
          { value: archetype, label: "profile archetype" },
          { value: `${profileCompletion}%`, label: "profile completion" }
        ]}
      />

      {!isStudent ? (
        <section className="rounded-lg border border-gold/20 bg-gold/10 p-5">
          <p className="text-sm leading-7 text-gold-soft">This hybrid report framework is student-data aware. Open it from a student account to see live learning, attendance, fitness, and readiness signals.</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Defence Potential" value={`${defencePotentialScore}/100`} note={band} />
        <StatCard label="Academic Progress" value={`${learningScore}%`} note={activeCourse?.title ?? "No active course"} />
        <StatCard label="Attendance Discipline" value={`${attendanceScore}%`} note={usableData ? `${usableData.attendance.present}/${usableData.attendance.total} sessions` : "Student signal pending"} />
        <StatCard label="Physical Profile" value={`${fitnessScore}%`} note={usableData?.fitnessProgress.focus ?? "Fitness signal pending"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <PerformanceChart title="Hybrid growth signal" data={chartData} />
        <div className="space-y-4">
          <ProgressCard title="Learning Layer" value={learningScore} label={activeCourse?.nextLesson ?? "Course progress pending"} />
          <ProgressCard title="Assessment Layer" value={assessmentScore} label={assessmentScore ? "Assessment activity detected" : "Complete the first assessment"} />
          <ProgressCard title="Discipline Layer" value={attendanceScore} label="Attendance and consistency signal" />
          <ProgressCard title="Training Layer" value={fitnessScore} label={usableData?.fitnessProgress.focus ?? "Fitness profile pending"} />
        </div>
      </section>

      <SectionHeader eyebrow="Hybrid Profile Layers" title="What the upgraded report contains" action="Phase 2 profile report" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportLayers.map((section) => (
          <AnnouncementCard key={section.title} title={section.title} description={section.description} tag={section.tag} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-surface rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Report Interpretation</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Student profile summary</h2>
          <div className="mt-5 grid gap-3">
            {[
              `Defence Potential Score: ${defencePotentialScore}/100 (${band}).`,
              `Current archetype: ${archetype}.`,
              activeCourse ? `Academic signal is connected through ${activeCourse.title}.` : "Academic signal needs active course and submitted tests.",
              usableData?.attendance.total ? `Discipline signal is based on ${usableData.attendance.total} attendance records.` : "Discipline signal will improve after attendance records are marked.",
              "Assessment intelligence will become detailed after the full 15-assessment ecosystem is completed.",
              "Parent summary and faculty remarks are report-ready and can connect to real mentor notes in the next backend phase."
            ].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {assessmentSignals.map((section) => (
            <AnnouncementCard key={section.title} title={section.title} description={section.description} tag={section.tag} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ActivityTimeline title="Monthly hybrid report cycle" items={monthlyTimeline} />
        <div className="grid gap-4 md:grid-cols-2">
          <AnnouncementCard title="Parent Summary" description="Your child shows a developing defence profile. The next focus areas are assessment completion, discipline consistency, and guided practice." tag="Parent" />
          <AnnouncementCard title="Faculty Remark Slot" description="Faculty remarks can be connected here for classroom effort, subject growth, behaviour, and next learning target." tag="Faculty" />
          <AnnouncementCard title="AI / Mentor Recommendation" description="Complete Officer Readiness, Discipline Index, and Dream Addiction Index to unlock better recommendations." tag="Action" />
          <AnnouncementCard title="Export Ready" description="This layout is print-ready now. PDF automation can connect later without changing the visible report structure." tag="Export" />
        </div>
      </section>

      <SectionHeader eyebrow="Actions" title="Improve this profile" />
      <section className="grid gap-4 md:grid-cols-4">
        <QuickActionCard title="Digital Profile" description="Open the full hybrid student profile with connected readiness layers." href="/digital-profile" />
        <QuickActionCard title="Assessments" description="Complete officer readiness, OLQ, discipline, focus and leadership assessments." href="/psychometric" />
        <QuickActionCard title="NIDUS Guru" description="Start focus, discipline, Dream Addiction and Life OS transformation quests." href="/guru" />
        <QuickActionCard title="Monthly Tests" description="Attempt CBT and monthly tests to strengthen academic performance data." href="/tests" />
      </section>

      {isLoading && isStudent ? (
        <p className="text-sm text-muted">Refreshing student profile signals...</p>
      ) : null}
    </motion.div>
  );
}
