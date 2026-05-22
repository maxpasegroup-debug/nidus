"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  AttendanceCard,
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  ProgressCard,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { AssessmentMissionCard } from "@/components/assessments/assessment-mission-card";
import { buildAssessmentProgress } from "@/components/assessments/assessment-catalog";
import { PageHero } from "@/components/layout/page-hero";
import { NidusAiCommandPanel } from "@/components/nidus-ai/nidus-ai-command-panel";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { useStudentDashboard } from "@/hooks/use-dashboard";

const studentActions = [
  { title: "Digital Profile", description: "Open your complete hybrid profile across learning, training, assessments, discipline, fitness and Guru.", href: "/digital-profile" },
  { title: "Continue course", description: "Open your enrolled lessons and complete today's study target.", href: "/my-courses" },
  { title: "Attempt test", description: "Start a mock test, monthly test, or practice set.", href: "/tests" },
  { title: "See progress report", description: "Review your monthly growth score and next actions.", href: "/progress-reports" },
  { title: "Ask NIDUS", description: "Use AI study planner for what to do next.", href: "/ai-study-planner" },
  { title: "Assessments", description: "Take officer readiness, OLQ, leadership, discipline, focus, and career-fit assessments.", href: "/psychometric" },
  { title: "Assessment Reports", description: "Open completed psychometric reports and download PDFs.", href: "/psychometric/reports" },
  { title: "Check leaderboard", description: "See rank, momentum, and batch competition.", href: "/leaderboard" }
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useStudentDashboard();

  if (isLoading) return <RoleDashboardGuard role="STUDENT"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="STUDENT"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const chartData = data.attendance.trend.map((item) => ({ label: item.month, score: item.attendance, attendance: item.attendance }));
  const activeCourse = data.enrolledCourses[0];
  const profileCompletion = Math.round(([
    data.profile?.name,
    data.profile?.email,
    data.enrolledCourses.length > 0,
    data.attendance.total > 0,
    data.upcomingTests.length > 0,
    data.fitnessProgress.score > 0,
    data.aiRecommendations.length > 0,
    data.recentActivities.length > 0
  ].filter(Boolean).length / 8) * 100);
  const defencePotentialScore = Math.max(0, Math.min(100, Math.round(([
    activeCourse?.progress ?? 0,
    data.attendance.percentage,
    data.fitnessProgress.score,
    data.upcomingTests.length ? 54 : 30,
    Math.min(100, data.recentActivities.length * 16)
  ].reduce((sum, value) => sum + value, 0)) / 5)));
  const assessmentProfile = data.assessmentProfile;
  const assessments = buildAssessmentProgress(data.recentActivities.length, "student", assessmentProfile?.completed ?? []);
  const completedAssessments = assessments.filter((assessment) => assessment.status === "COMPLETED");
  const totalAssessments = assessmentProfile?.totalAssessments ?? assessments.length;
  const reportReadyCount = assessmentProfile?.reportReadyCount ?? completedAssessments.length;
  const nextAssessment = assessments.find((assessment) => assessment.status === "IN_PROGRESS") ?? assessments.find((assessment) => assessment.status === "NOT_STARTED");
  const guruRecommendation = assessments.find((assessment) => assessment.id === "dream-addiction-index") ?? assessments.find((assessment) => assessment.id === "focus-strength");
  const aiProfileAccuracy = assessmentProfile?.profileAccuracy ?? Math.round((completedAssessments.length / assessments.length) * 100);
  const nidusAiCommands = [
    {
      title: nextAssessment ? nextAssessment.title : "Review completed reports",
      description: nextAssessment ? nextAssessment.nextStep : "Compare your completed AI reports and strengthen the digital profile.",
      href: nextAssessment?.href ?? "/assessment-reports/officer-readiness",
      tag: "Assessment"
    },
    {
      title: "Update Digital Profile",
      description: `Assessment intelligence is ${aiProfileAccuracy}% complete and linked to your readiness identity.`,
      href: "/digital-profile",
      tag: "Profile"
    },
    {
      title: guruRecommendation?.relatedGuruQuest ?? "Start Guru Mission",
      description: guruRecommendation?.nextStep ?? "Move from report insight to a guided transformation mission.",
      href: "/guru",
      tag: "Guru"
    },
    {
      title: "Counselling action plan",
      description: "Send your pathway details to NIDUS support and convert AI guidance into a human plan.",
      href: "/join",
      tag: "Counselling"
    }
  ];
  const nextBestActions = [
    {
      title: nextAssessment ? nextAssessment.actionLabel : "Review Reports",
      description: nextAssessment ? `${nextAssessment.title}: ${nextAssessment.nextStep}` : "Open your completed assessment reports and compare strengths.",
      href: nextAssessment?.href ?? "/psychometric",
      tag: "Assessment"
    },
    {
      title: "Open Digital Profile",
      description: `Current Defence Potential Score is ${defencePotentialScore}/100 with ${profileCompletion}% profile completion.`,
      href: "/digital-profile",
      tag: "Profile"
    },
    {
      title: "Start Guru Mission",
      description: guruRecommendation ? `${guruRecommendation.relatedGuruQuest}: ${guruRecommendation.nextStep}` : "Start a focus, discipline, confidence, or life direction quest.",
      href: "/guru",
      tag: "Guru"
    },
    {
      title: activeCourse ? "Continue Learning" : "Choose Learning Path",
      description: activeCourse ? `Continue ${activeCourse.title}. Next lesson: ${activeCourse.nextLesson}.` : "Enroll in a course to activate academic performance signals.",
      href: activeCourse ? "/my-courses" : "/courses",
      tag: "Learning"
    }
  ];

  return (
    <RoleDashboardGuard role="STUDENT">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Student Dashboard"
          title={`Your training plan, ${user?.name ?? "cadet"}`}
          description="A simple daily view for courses, tests, attendance, leaderboard rank, progress report, and Ask NIDUS guidance."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.enrolledCourses.length), label: "courses" },
            { value: `${data.attendance.percentage}%`, label: "attendance" },
            { value: `#${data.leaderboardRank.rank}`, label: data.leaderboardRank.batch }
          ]}
        />

        <SectionHeader eyebrow="Digital Profile Summary" title="Your defence readiness command view" action={`${profileCompletion}% complete`} />
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Digital Profile" value={`${defencePotentialScore}/100`} note={`${profileCompletion}% profile completion`} />
          <StatCard label="Upcoming Tests" value={String(data.upcomingTests.length)} note={data.upcomingTests[0]?.title ?? "No test scheduled"} />
          <StatCard label="Attendance" value={`${data.attendance.percentage}%`} note={`${data.attendance.present}/${data.attendance.total} sessions`} />
          <StatCard label="Leaderboard" value={`#${data.leaderboardRank.rank}`} note={`Top ${100 - data.leaderboardRank.percentile}%`} />
        </section>

        <section className="premium-surface rounded-lg p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Digital Hybrid Profile</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Your complete defence readiness identity is now live.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                This connects your learning, assessments, discipline, physical training, NIDUS Guru journey, and progress report into one evolving student profile.
              </p>
            </div>
            <Button href="/digital-profile" variant="secondary">Open Digital Profile</Button>
          </div>
        </section>

        <SectionHeader eyebrow="Next Best Action" title="What to do now" action="Action engine" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {nextBestActions.map((action) => (
            <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />
          ))}
        </section>

        <NidusAiCommandPanel
          title="NIDUS AI is managing your next step"
          description="Assessment reports, Guru missions, learning progress, and counselling are now connected into one action layer."
          commands={nidusAiCommands}
        />

        <SectionHeader eyebrow="Assessments" title="Build your 15-part officer profile" action={`${completedAssessments.length}/${totalAssessments} completed`} />
        <section className="premium-surface rounded-lg p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Assessment Ecosystem</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">15 defence assessments with report generation states.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Completed assessment reports now feed your Digital Profile, NIDUS AI interpretation, Guru recommendations, and counselling path.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[27rem]">
              <div className="rounded border border-white/10 bg-navy-deep/55 p-4">
                <p className="text-2xl font-semibold text-gold-soft">{completedAssessments.length}/{totalAssessments}</p>
                <p className="mt-1 text-xs text-muted">completed</p>
              </div>
              <div className="rounded border border-white/10 bg-navy-deep/55 p-4">
                <p className="text-2xl font-semibold text-gold-soft">{reportReadyCount}</p>
                <p className="mt-1 text-xs text-muted">reports ready</p>
              </div>
              <div className="rounded border border-white/10 bg-navy-deep/55 p-4">
                <p className="text-2xl font-semibold text-gold-soft">{aiProfileAccuracy}%</p>
                <p className="mt-1 text-xs text-muted">assessment profile</p>
              </div>
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Learning" title="Courses, tests, attendance, and consistency" action={activeCourse?.title ?? "No active course"} />
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PerformanceChart title="Attendance and consistency" data={chartData} />
          <div className="space-y-4">
            <AttendanceCard title="Attendance summary" present={data.attendance.present} total={data.attendance.total} />
            <ProgressCard title="Course progress" value={activeCourse?.progress ?? 0} label={activeCourse?.nextLesson ?? "Enroll in a course"} />
            <ProgressCard title="Fitness progress" value={data.fitnessProgress.score} label={`${data.fitnessProgress.focus}, ${data.fitnessProgress.streakDays} day streak`} />
          </div>
        </section>

        <SectionHeader eyebrow="NIDUS Guru" title="Mindset, focus, and discipline missions" action={guruRecommendation?.relatedGuruQuest ?? "Start quest"} />
        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Recommended Quest</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">{guruRecommendation?.relatedGuruQuest ?? "Dream Addiction"}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {guruRecommendation?.nextStep ?? "Start a mission that converts ambition into disciplined daily action."}
            </p>
            <div className="mt-5">
              <Button href="/guru" variant="secondary">Open NIDUS Guru</Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <AnnouncementCard title="Dream Addiction Index" description="Measures distraction, goal obsession, productivity behaviour, and ambition intensity." tag="Guru" />
            <AnnouncementCard title="Focus Reset" description="Builds attention span, mental endurance, and digital discipline." tag="Focus" />
            <AnnouncementCard title="Life OS" description="Builds habits, routine strength, execution, and daily systems." tag="Habits" />
          </div>
        </section>

        <SectionHeader eyebrow="Physical & Discipline" title="Training signals that shape your profile" action={`${data.fitnessProgress.streakDays} day streak`} />
        <section className="grid gap-4 md:grid-cols-3">
          <ProgressCard title="Attendance Discipline" value={data.attendance.percentage} label={`${data.attendance.present}/${data.attendance.total} sessions marked`} />
          <ProgressCard title="Fitness Readiness" value={data.fitnessProgress.score} label={data.fitnessProgress.focus} />
          <AnnouncementCard title="Warrior Fitness Mindset" description="Complete the fitness mindset assessment and connect it with PT logs for a stronger training profile." tag="Training" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">What to do today</h2>
            <div className="mt-5 grid gap-3">
              {data.aiRecommendations.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <ActivityTimeline title="Recent learning activity" items={data.recentActivities} />
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Daily student work" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {studentActions.map((action) => <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />)}
        </section>

        <SectionHeader eyebrow="Assessment Grid" title="Complete every mission card" action={`${reportReadyCount} reports ready`} />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assessments.map((assessment) => (
            <AssessmentMissionCard key={assessment.id} assessment={assessment} compact />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="Next test" description={data.upcomingTests[0]?.date ?? "Your next test date will appear here."} tag="Exam" />
          <AnnouncementCard title="Progress report" description="Monthly report combines tests, attendance, course progress, aptitude/IQ, EQ, psychometric growth, and teacher remarks." tag="Report" />
          <AnnouncementCard title="Parent visibility" description="Parents can see your progress, attendance, fees, and important remarks." tag="Parent" />
        </section>

        {data.enrolledCourses.length === 0 ? <EmptyState title="No enrolled courses" description="Your courses will appear here after enrollment." /> : null}
      </motion.div>
    </RoleDashboardGuard>
  );
}
