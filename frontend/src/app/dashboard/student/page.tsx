"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Target,
  Timer,
  Trophy,
  UserRound,
  Video
} from "lucide-react";
import {
  DashboardError,
  DashboardSkeleton,
  RoleDashboardGuard,
  StatCard
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useStudentDashboard } from "@/hooks/use-dashboard";
import { useAvailableTests, useStartTest } from "@/hooks/use-tests";

const classCycle = [
  {
    title: "20 Min Recorded Class",
    line: "Watch the short class for today's topic.",
    href: "/recorded-lectures",
    icon: Video,
    tone: "bg-[#fff7de]"
  },
  {
    title: "10 MCQ Practice",
    line: "Answer 10 questions from the same topic.",
    href: "/tests",
    icon: ClipboardCheck,
    tone: "bg-[#edf7ee]"
  },
  {
    title: "Topic Analysis",
    line: "Check speed, time per question and first-attempt accuracy.",
    href: "/performance-analytics",
    icon: BarChart3,
    tone: "bg-[#eef5ff]"
  },
  {
    title: "Area to Improve",
    line: "See what you should revise before the next practice.",
    href: "/progress-reports",
    icon: Target,
    tone: "bg-[#fff2ec]"
  },
  {
    title: "Saturday Mock Test",
    line: "Attempt the weekly timed mock test.",
    href: "/tests",
    icon: Trophy,
    tone: "bg-[#f5efff]"
  },
  {
    title: "Sunday Paper Analysis",
    line: "Join live paper analysis for maximum 2 hours.",
    href: "/live-classes",
    icon: Timer,
    tone: "bg-[#eff8f8]"
  }
];

const simpleActions = [
  { title: "My Course", href: "/my-courses", icon: BookOpen },
  { title: "Tests", href: "/tests", icon: ClipboardCheck },
  { title: "Attendance", href: "/discipline", icon: CalendarDays },
  { title: "Reports", href: "/progress-reports", icon: FileText },
  { title: "Digital Profile", href: "/digital-profile", icon: UserRound }
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useStudentDashboard();
  const { data: availableTests = [] } = useAvailableTests();
  const startTestMutation = useStartTest();

  if (isLoading) return <RoleDashboardGuard role="STUDENT"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="STUDENT"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const activeCourse = data.enrolledCourses[0];
  const activeBatch = data.academyProfile.assignedBatches[0];
  const subjectLibrary = data.academyProfile.librarySubjects.length ? data.academyProfile.librarySubjects : ["Maths", "English", "GK", "Current Affairs"];
  const visibleClasses = data.academyProfile.todayClasses.length ? data.academyProfile.todayClasses : data.academyProfile.upcomingClasses.slice(0, 4);

  return (
    <RoleDashboardGuard role="STUDENT">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_58%,#eef4f7_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6426]">Student Dashboard</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">
            Welcome{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            Follow the simple NIDUS study cycle every week: class, practice, analysis, improvement, mock test and paper analysis.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/recorded-lectures">Start Today Class</Button>
            <Button href="/tests" variant="secondary">Start 10 MCQs</Button>
            <Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Current Course" value={activeCourse?.title ?? activeBatch?.course?.title ?? "Not assigned"} note={activeCourse?.nextLesson ?? activeBatch?.name ?? "Course appears after admission approval"} />
          <StatCard label="Attendance" value={`${data.attendance.percentage}%`} note={`${data.attendance.present}/${data.attendance.total} sessions`} />
          <StatCard label="Upcoming Tests" value={String(data.upcomingTests.length)} note={data.upcomingTests[0]?.title ?? "No test scheduled"} />
          <StatCard label="My Batch" value={activeBatch ? activeBatch.type.replace(/_/g, " ") : "Pending"} note={activeBatch ? `${activeBatch.teachers} teachers, ${activeBatch.tests} tests` : "Admission Cell will assign batch"} />
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Available Exams</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#071d36]">Assigned tests for your batch</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">
                Only exams published to your batch appear here. Start, continue, or review after submission.
              </p>
            </div>
            <Button href="/tests" variant="secondary">Open Tests</Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableTests.slice(0, 6).map((test) => (
              <article key={test.id} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#fff7de] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8a6426]">{test.examType}</span>
                  <span className="text-xs font-semibold text-[#64748b]">{test.studentStatus?.replace(/_/g, " ") ?? "NOT STARTED"}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#071d36]">{test.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748b]">{test.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-[#40516a]">
                  <span className="rounded bg-white px-3 py-2">{test.duration} min</span>
                  <span className="rounded bg-white px-3 py-2">{test._count?.questions ?? 0} Q</span>
                  <span className="rounded bg-white px-3 py-2">{test.totalMarks} marks</span>
                </div>
                <button
                  type="button"
                  disabled={startTestMutation.isPending || test.studentStatus === "SUBMITTED"}
                  onClick={() => startTestMutation.mutate(test.id)}
                  className="mt-4 w-full rounded border border-[#b9913f] bg-[linear-gradient(135deg,#fff3bf,#e7c873,#b9913f)] px-4 py-3 text-sm font-black text-[#071d36] disabled:opacity-60"
                >
                  {test.studentStatus === "SUBMITTED" ? "Submitted" : test.studentStatus === "IN_PROGRESS" ? "Continue Exam" : "Start Exam"}
                </button>
              </article>
            ))}
            {!availableTests.length ? (
              <div className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 md:col-span-2 xl:col-span-3">
                <p className="font-semibold text-[#071d36]">No assigned exam now</p>
                <p className="mt-1 text-sm leading-6 text-[#64748b]">When Academic Head publishes an exam to your batch, it will appear here.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">My Academy Plan</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#071d36]">Your batch and class timetable</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">
                After Admission Cell approval, your program, batch, teachers, tests and timetable appear here automatically.
              </p>
            </div>
            <Button href="/live-classes">Open Classes</Button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Assigned Batch</p>
              <h3 className="mt-3 text-xl font-semibold text-[#071d36]">{activeBatch?.course?.title ?? "No batch assigned yet"}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{activeBatch?.name ?? "Apply to an Academy program or wait for Admission Cell approval."}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#40516a]">
                <span className="rounded border border-[#071d36]/10 bg-white px-3 py-2">{activeBatch?.teachers ?? 0} teachers</span>
                <span className="rounded border border-[#071d36]/10 bg-white px-3 py-2">{activeBatch?.tests ?? 0} tests</span>
              </div>
            </div>
            <div className="grid gap-3">
              {visibleClasses.length ? visibleClasses.map((slot) => (
                <Link key={slot.id} href="/live-classes" className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#b9913f]/45 hover:bg-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6426]">{slot.subject}</p>
                  <h3 className="mt-2 text-base font-semibold text-[#071d36]">{slot.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{slot.instructor} - {new Date(slot.startTime).toLocaleString()}</p>
                </Link>
              )) : (
                <div className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
                  <p className="text-sm font-semibold text-[#071d36]">No timetable assigned yet</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">Your classes will appear after batch allocation.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Classes</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#071d36]">Your weekly class cycle</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">
                This is the main student workflow. Complete it in order and your reports will become meaningful with real data.
              </p>
            </div>
            <Button href="/my-courses">Open My Course</Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classCycle.map((tile, index) => {
              const Icon = tile.icon;
              return (
                <Link key={tile.title} href={tile.href} className="group rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-1 hover:border-[#b9913f]/45 hover:bg-white">
                  <div className="flex items-start gap-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg ${tile.tone} text-[#071d36]`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8a6426] shadow-sm">Step {index + 1}</span>
                      <h3 className="mt-3 text-lg font-semibold text-[#071d36]">{tile.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#64748b]">{tile.line}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Library</p>
                <h2 className="text-2xl font-semibold text-[#071d36]">Course-wise</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {(data.academyProfile.assignedBatches.length ? data.academyProfile.assignedBatches : []).map((batch) => (
                <Link key={batch.id} href="/my-courses" className="flex items-center justify-between rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-4 text-sm font-semibold text-[#071d36] transition hover:border-[#b9913f]/45 hover:bg-white">
                  {batch.course?.title ?? batch.name}
                  <BookOpen className="h-4 w-4 text-[#b9913f]" />
                </Link>
              ))}
              {!data.academyProfile.assignedBatches.length ? (
                <div className="rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-4 text-sm font-semibold text-[#071d36]">No course assigned yet</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f6b45]">Subjects</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#071d36]">Notes, videos and photos by topic</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subjectLibrary.map((subject) => (
                <Link key={subject} href="/media-library" className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#b9913f]/45">
                  <p className="font-semibold text-[#071d36]">{subject}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">Topic notes and referred media</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {simpleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="rounded-lg border border-[#071d36]/10 bg-white p-4 text-center shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <Icon className="mx-auto h-6 w-6 text-[#b9913f]" />
                <p className="mt-3 text-sm font-semibold text-[#071d36]">{action.title}</p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-[#071d36] p-6 text-white">
          <h2 className="text-3xl font-semibold">TOPRANK and NIDUS Guru are coming soon.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">For the first real student onboarding, we are keeping the app focused on Academy classes, tests, attendance, library and reports.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/dashboard/toprank">TOPRANK Coming Soon</Button>
            <Button href="/dashboard/nidus-guru" variant="secondary">NIDUS Guru Coming Soon</Button>
          </div>
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
