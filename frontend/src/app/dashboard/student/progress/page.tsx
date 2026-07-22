"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  FileText,
  GraduationCap,
  Library,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ExecutiveIntelligenceSystem, ReportQuestionCards } from "@/components/reporting/executive-intelligence-system";
import type { NdpManualEntry, NdpReview } from "@/services/academy";

type StudentPlan = {
  batches?: Array<{ id: string; name?: string | null; status?: string | null; course?: { title?: string | null } | null }>;
  attendance?: { summary?: { present: number; absent?: number; leave?: number; total: number; percentage: number } };
  assignments?: Array<{ id?: string; title?: string | null; subject?: string | null; dueDate?: string | null; submissionStatus?: string | null; status?: string | null }>;
  materials?: Array<{ id: string; title?: string | null; subject?: string | null; topic?: string | null; type?: string | null; createdAt?: string | null }>;
  liveClasses?: Array<{ id: string; title?: string | null; subject?: string | null; scheduledAt?: string | null; recordingUrl?: string | null }>;
  calendar?: Array<{ id: string; title?: string | null; subject?: string | null; plannedDate?: string | null; startTime?: string | null; completionStatus?: string | null }>;
};

type AttemptHistory = {
  attempts: Array<{
    id?: string;
    status?: string | null;
    score?: number | null;
    submittedAt?: string | null;
    completedAt?: string | null;
    test?: { title?: string | null; totalMarks?: number | null; duration?: number | null };
  }>;
};

type FitnessProfile = {
  bmi?: number | null;
  runningTime?: number | null;
  staminaScore?: number | null;
  fitnessLevel?: string | null;
};

type PsychometricReportHistory = {
  summary?: {
    totalAssessments?: number;
    completedCount?: number;
    reportReadyCount?: number;
    profileAccuracy?: number;
    averageScore?: number;
    readinessBand?: string;
    latestReport?: { attemptId: string; title: string; score: number; completedAt: string } | null;
  };
  reports?: Array<{ attemptId: string; title: string; score: number; readinessBand?: string; completedAt?: string; reportHref?: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload<T>(payload: unknown): T {
  if (isRecord(payload)) {
    if (payload.data !== undefined) return unwrapPayload<T>(payload.data);
    if (payload.result !== undefined) return unwrapPayload<T>(payload.result);
    if (payload.payload !== undefined) return unwrapPayload<T>(payload.payload);
  }
  return payload as T;
}

function listPayload<T>(payload: unknown, key: string): T[] {
  const unwrapped = unwrapPayload<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (!isRecord(unwrapped)) return [];
  const keyed = unwrapPayload<unknown>(unwrapped[key]);
  return Array.isArray(keyed) ? (keyed as T[]) : [];
}

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Unable to load progress data");
  const payload = await response.json().catch(() => ({}));
  return unwrapPayload<T>(payload);
}

async function apiList<T>(path: string, key: string): Promise<T[]> {
  const payload = await apiJson<unknown>(path);
  return listPayload<T>(payload, key);
}

export default function StudentProgressPage() {
  const router = useRouter();
  const planQuery = useQuery({ queryKey: ["student", "progress-plan"], queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan") });
  const attemptsQuery = useQuery({
    queryKey: ["student", "progress-attempts"],
    queryFn: async () => ({ attempts: await apiList<AttemptHistory["attempts"][number]>("/api/tests/attempts/history", "attempts") }),
  });
  const fitnessQuery = useQuery({ queryKey: ["student", "progress-fitness"], queryFn: () => apiJson<{ profile: FitnessProfile | null }>("/api/fitness/profile") });
  const psychometricQuery = useQuery({ queryKey: ["student", "progress-psychometric"], queryFn: () => apiJson<PsychometricReportHistory>("/api/psychometric/reports") });
  const ndpQuery = useQuery({ queryKey: ["student", "progress-ndp"], queryFn: () => apiJson<{ reviews: NdpReview[] }>("/api/academy/ndp/my-reviews") });

  const plan = planQuery.data;
  const activeBatches = (plan?.batches ?? []).filter((batch) => !batch.status || batch.status === "ACTIVE");
  const shouldOpenApplicantLobby = !planQuery.isLoading && !activeBatches.length;

  const attendancePercentage = Math.round(plan?.attendance?.summary?.percentage ?? 0);
  const assignments = plan?.assignments ?? [];
  const submittedAssignments = assignments.filter((item) => ["SUBMITTED", "REVIEWED", "APPROVED", "COMPLETED"].includes(String(item.submissionStatus ?? item.status ?? "").toUpperCase())).length;
  const assignmentCompletion = assignments.length ? Math.round((submittedAssignments / assignments.length) * 100) : 0;
  const pendingAssignments = assignments.length - submittedAssignments;

  const attempts = attemptsQuery.data?.attempts ?? [];
  const completedAttempts = attempts.filter((attempt) => ["SUBMITTED", "SCORED", "COMPLETED"].includes(String(attempt.status ?? "").toUpperCase()) || attempt.submittedAt || attempt.completedAt || attempt.score != null);
  const examAverage = completedAttempts.length ? Math.round(completedAttempts.reduce((sum, attempt) => sum + scorePercent(attempt), 0) / completedAttempts.length) : 0;
  const bestExam = completedAttempts.length ? Math.max(...completedAttempts.map(scorePercent)) : 0;

  const materials = plan?.materials ?? [];
  const materialSubjects = new Set(materials.map((item) => item.subject).filter(Boolean));
  const liveClassCount = plan?.liveClasses?.length ?? 0;
  const calendarCount = plan?.calendar?.length ?? 0;
  const learningCoverage = Math.min(100, Math.round(((materials.length * 2) + liveClassCount + Math.min(calendarCount, 20)) / 2));

  const profile = fitnessQuery.data?.profile;
  const fitnessScore = Math.round(profile?.staminaScore ?? 0);
  const assessmentSummary = psychometricQuery.data?.summary;
  const assessmentAccuracy = Math.round(assessmentSummary?.profileAccuracy ?? 0);
  const completedAssessments = assessmentSummary?.completedCount ?? psychometricQuery.data?.reports?.length ?? 0;

  const readinessScore = weightedAverage([
    { value: attendancePercentage, weight: 25 },
    { value: assignmentCompletion, weight: 20 },
    { value: examAverage, weight: 20 },
    { value: learningCoverage, weight: 15 },
    { value: fitnessScore, weight: 10 },
    { value: assessmentAccuracy, weight: 10 },
  ]);
  const readinessStatus = readinessBand(readinessScore);
  const activeBatch = activeBatches[0];
  const ndpReviews = ndpQuery.data?.reviews ?? [];
  const latestNdp = ndpReviews[0] ?? null;
  const ndpHighlights = latestNdp?.entries.filter((entry) => ["ACADEMIC_PERFORMANCE", "TEST_PERFORMANCE", "TEACHER_OBSERVATION", "NEXT_TERM_ACTION_PLAN"].includes(entry.category)).slice(0, 8) ?? [];

  useEffect(() => {
    if (shouldOpenApplicantLobby) router.replace("/dashboard/guest");
  }, [router, shouldOpenApplicantLobby]);

  if (shouldOpenApplicantLobby) return null;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <ArrowLeft className="h-4 w-4" /> Back to Today
        </Link>

        <section className="rounded-[28px] border border-[var(--border)] bg-white/95 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">NIDUS Digital Profile</p>
              <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">My complete progress profile</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                Academic performance, attendance, assignments, exams, learning materials, fitness and psychometric insights in one student profile.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Current Batch</p>
              <h2 className="mt-2 text-2xl font-black">{activeBatch?.name ?? activeBatch?.course?.title ?? "Batch not assigned"}</h2>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{activeBatch?.course?.title ?? "NIDUS Academy"}</p>
            </div>
          </div>
        </section>

        <ExecutiveIntelligenceSystem
          role="STUDENT"
          title="Student Progress Intelligence"
          description="Learning progress, attendance, assignments, quiz history, exam performance, strengths, improvement areas and achievements in one report foundation."
          metrics={[
            { label: "Learning Progress", value: `${learningCoverage}%`, note: `${materials.length} material(s), ${liveClassCount} live class(es)`, tone: learningCoverage >= 70 ? "success" : "info" },
            { label: "Attendance", value: `${attendancePercentage}%`, note: `${plan?.attendance?.summary?.present ?? 0}/${plan?.attendance?.summary?.total ?? 0} sessions`, tone: attendancePercentage >= 75 ? "success" : "warning" },
            { label: "Assignments", value: `${assignmentCompletion}%`, note: `${pendingAssignments} pending`, tone: pendingAssignments ? "warning" : "success" },
            { label: "Exam Performance", value: `${examAverage}%`, note: `Best ${bestExam}%`, tone: examAverage >= 70 ? "success" : "info" },
          ]}
          insights={[
            { title: "Strength", detail: readinessStatus.description, tone: readinessScore >= 75 ? "success" : "info" },
            { title: "Improvement area", detail: pendingAssignments ? "Assignment completion needs attention first." : attendancePercentage < 75 ? "Attendance should be brought above 75%." : "Keep revision and mock practice consistent.", tone: pendingAssignments || attendancePercentage < 75 ? "warning" : "success" },
            { title: "Next action", detail: "Open learning, assignments or exams from the connected report links before revising.", href: "/dashboard/student/learning", tone: "info" },
          ]}
        >
          <ReportQuestionCards />
        </ExecutiveIntelligenceSystem>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--ink)] p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--gold)]">Readiness Score</p>
            <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-7xl font-black leading-none">{readinessScore}</p>
                <p className="mt-2 text-xl font-black">{readinessStatus.label}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">{readinessStatus.description}</p>
              </div>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${readinessScore}%` }} />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <ScoreTile icon={CalendarDays} label="Attendance" value={`${attendancePercentage}%`} note={`${plan?.attendance?.summary?.present ?? 0}/${plan?.attendance?.summary?.total ?? 0} sessions`} />
            <ScoreTile icon={FileText} label="Assignments" value={`${assignmentCompletion}%`} note={`${pendingAssignments} pending`} />
            <ScoreTile icon={GraduationCap} label="Exam Average" value={`${examAverage}%`} note={`Best ${bestExam}%`} />
            <ScoreTile icon={BrainCircuit} label="Assessments" value={`${assessmentAccuracy}%`} note={`${completedAssessments} completed`} />
          </section>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--gold)]">Published NDP</p>
              <h2 className="mt-2 text-3xl font-black">{latestNdp ? `${latestNdp.reviewPeriod} progress card` : "No published NDP yet"}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                {latestNdp
                  ? `Published by ${latestNdp.reviewedByName ?? "Academic Head"} after teacher submission.`
                  : ndpQuery.isLoading
                    ? "Loading your latest NIDUS Digital Profile card."
                    : "Your teacher's NDP review will appear here after Academic Head approval and publication."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:min-w-[520px]">
              <ScoreTile icon={ShieldCheck} label="Overall" value={formatNdpScore(latestNdp?.scores?.overallReadiness)} note={latestNdp?.status ?? "Pending"} />
              <ScoreTile icon={GraduationCap} label="Academic" value={formatNdpScore(latestNdp?.scores?.academicReadiness)} note="Subject progress" />
              <ScoreTile icon={Award} label="Tests" value={formatNdpScore(latestNdp?.scores?.testPerformance)} note="Test summary" />
              <ScoreTile icon={BrainCircuit} label="Skills" value={formatNdpScore(latestNdp?.scores?.skillDevelopment)} note="Learning skills" />
              <ScoreTile icon={Dumbbell} label="Defence" value={formatNdpScore(latestNdp?.scores?.defenceDevelopment)} note="Readiness" />
            </div>
          </div>
          {latestNdp ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {ndpHighlights.map((entry) => (
                <NdpEntryCard key={`${entry.category}-${entry.subject ?? ""}-${entry.item}`} entry={entry} />
              ))}
              {!ndpHighlights.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm font-bold text-[var(--muted-blue)] lg:col-span-2">This published NDP has no visible entries yet.</p> : null}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <ProgressPanel title="Academic Performance" icon={GraduationCap}>
            <Metric icon={CalendarDays} label="Attendance" value={`${attendancePercentage}%`} note={`${plan?.attendance?.summary?.absent ?? 0} absent, ${plan?.attendance?.summary?.leave ?? 0} leave`} />
            <Metric icon={ClipboardCheck} label="Homework Discipline" value={`${submittedAssignments}/${assignments.length}`} note={`${assignmentCompletion}% completion`} />
            <Metric icon={BookOpen} label="Calendar Sessions" value={String(calendarCount)} note="Classes and events assigned" />
          </ProgressPanel>

          <ProgressPanel title="Exam Performance" icon={Award}>
            <Metric icon={GraduationCap} label="Submitted Attempts" value={String(completedAttempts.length)} note={`Average ${examAverage}%`} />
            <Metric icon={Target} label="Best Score" value={`${bestExam}%`} note={latestAttemptTitle(completedAttempts) ?? "No attempt submitted yet"} />
            <LinkCard href="/dashboard/student/exams" label="Open exam arena" note="Upcoming, live and past exams" />
          </ProgressPanel>

          <ProgressPanel title="Learning & Library" icon={Library}>
            <Metric icon={Library} label="Library Items" value={String(materials.length)} note={`${materialSubjects.size} subject folder(s)`} />
            <Metric icon={CalendarDays} label="Live Classes" value={String(liveClassCount)} note="Upcoming and recorded sessions" />
            <LinkCard href="/dashboard/student/library" label="Open academic library" note="Recorded videos, notes and links" />
          </ProgressPanel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ProgressPanel title="Assessment Intelligence" icon={BrainCircuit}>
            <Metric icon={BrainCircuit} label="Profile Accuracy" value={`${assessmentAccuracy}%`} note={`${assessmentSummary?.reportReadyCount ?? 0} report(s) ready`} />
            <Metric icon={ShieldCheck} label="Readiness Band" value={assessmentSummary?.readinessBand ?? "Pending"} note={assessmentSummary?.latestReport?.title ?? "Take assessments to improve profile depth"} />
            <LinkCard href="/dashboard/student/assessments" label="Open assessments" note="Psychometric and defence readiness tests" />
          </ProgressPanel>

          <ProgressPanel title="Fitness & Readiness" icon={Dumbbell}>
            <Metric icon={Dumbbell} label="Fitness Score" value={`${fitnessScore}%`} note={profile?.fitnessLevel ?? "Fitness profile pending"} />
            <Metric icon={Activity} label="Running Benchmark" value={profile?.runningTime ? `${profile.runningTime}m` : "--"} note="1.6 KM benchmark" />
            <Metric icon={TrendingUp} label="Academy Readiness" value={`${readinessScore}%`} note={readinessStatus.short} />
          </ProgressPanel>
        </section>
      </section>
    </main>
  );
}

function ProgressPanel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white/95 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)]">
          <Icon className="h-5 w-5 text-[var(--gold)]" />
        </span>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="mt-5 grid gap-3">{children}</div>
    </section>
  );
}

function ScoreTile({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/95 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-4xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{note}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[var(--gold)]" />
      </div>
    </div>
  );
}

function LinkCard({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <span>
        <span className="block text-sm font-black">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{note}</span>
      </span>
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
    </Link>
  );
}

function NdpEntryCard({ entry }: { entry: NdpManualEntry }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{ndpCategoryLabel(entry.category)}</p>
          <h3 className="mt-2 text-lg font-black">{entry.subject || entry.item}</h3>
          {entry.subject ? <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{entry.item}</p> : null}
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{entry.score == null ? "--" : `${entry.score}%`}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <TermValue label="Term 1" value={entry.term1} />
        <TermValue label="Term 2" value={entry.term2} />
        <TermValue label="Term 3" value={entry.term3} />
      </div>
      <p className="mt-3 text-sm font-black">{entry.rating || "Performance not rated"}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{entry.remarks || "No teacher remark added."}</p>
    </article>
  );
}

function TermValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-2">
      <p className="font-black text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 font-black text-[var(--ink)]">{value || "--"}</p>
    </div>
  );
}

function formatNdpScore(value?: number | null) {
  return value == null ? "--" : `${value}%`;
}

function ndpCategoryLabel(category: string) {
  if (category === "ACADEMIC_PERFORMANCE") return "Academic";
  if (category === "TEST_PERFORMANCE") return "Tests";
  if (category === "TEACHER_OBSERVATION") return "Teacher Note";
  if (category === "NEXT_TERM_ACTION_PLAN") return "Action Plan";
  return category.replaceAll("_", " ");
}

function scorePercent(attempt: AttemptHistory["attempts"][number]) {
  const rawScore = Number(attempt.score ?? 0);
  const totalMarks = Number(attempt.test?.totalMarks ?? 0);
  if (totalMarks > 0 && rawScore <= totalMarks) return Math.round((rawScore / totalMarks) * 100);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function weightedAverage(items: Array<{ value: number; weight: number }>) {
  const valid = items.filter((item) => Number.isFinite(item.value));
  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return 0;
  return Math.round(valid.reduce((sum, item) => sum + Math.max(0, Math.min(100, item.value)) * item.weight, 0) / totalWeight);
}

function readinessBand(score: number) {
  if (score >= 90) return { label: "Elite Readiness", short: "Elite", description: "You are showing strong discipline, performance and learning consistency. Keep the loop strict." };
  if (score >= 75) return { label: "Green Readiness", short: "Strong", description: "You are on track. Focus on regular mock tests, daily revision and attendance consistency." };
  if (score >= 60) return { label: "Yellow Readiness", short: "Building", description: "Your profile is improving, but one or two habits need attention before advanced academic intensity." };
  if (score >= 45) return { label: "Orange Readiness", short: "Needs support", description: "You need stronger routine discipline, assignment completion and guided practice." };
  return { label: "Red Readiness", short: "Start with basics", description: "Begin with a starter routine: attend classes, submit homework and complete assessments first." };
}

function latestAttemptTitle(attempts: AttemptHistory["attempts"]) {
  const latest = [...attempts].sort((a, b) => new Date(b.submittedAt ?? b.completedAt ?? 0).getTime() - new Date(a.submittedAt ?? a.completedAt ?? 0).getTime())[0];
  return latest?.test?.title ?? null;
}
