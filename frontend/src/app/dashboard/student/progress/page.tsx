"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, CalendarDays, Dumbbell, FileText, GraduationCap, Library } from "lucide-react";

type StudentPlan = {
  attendance?: { summary?: { present: number; total: number; percentage: number } };
  assignments?: Array<{ submissionStatus?: string }>;
  materials?: Array<{ id: string }>;
  liveClasses?: Array<{ id: string }>;
};

type AttemptHistory = {
  attempts: Array<{ score?: number | null; test?: { totalMarks?: number | null } }>;
};

type FitnessProfile = {
  bmi?: number | null;
  runningTime?: number | null;
  staminaScore?: number | null;
  fitnessLevel?: string | null;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Unable to load progress data");
  return response.json() as Promise<T>;
}

export default function StudentProgressPage() {
  const planQuery = useQuery({ queryKey: ["student", "progress-plan"], queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan") });
  const attemptsQuery = useQuery({ queryKey: ["student", "progress-attempts"], queryFn: () => apiJson<AttemptHistory>("/api/tests/attempts/history") });
  const fitnessQuery = useQuery({ queryKey: ["student", "progress-fitness"], queryFn: () => apiJson<{ profile: FitnessProfile | null }>("/api/fitness/profile") });

  const plan = planQuery.data;
  const assignments = plan?.assignments ?? [];
  const submittedAssignments = assignments.filter((item) => item.submissionStatus === "SUBMITTED").length;
  const assignmentCompletion = assignments.length ? Math.round((submittedAssignments / assignments.length) * 100) : 0;
  const attempts = attemptsQuery.data?.attempts ?? [];
  const examAverage = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.score ?? 0), 0) / attempts.length) : 0;
  const profile = fitnessQuery.data?.profile;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Progress</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">Your progress report</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">A single view of attendance, assignments, exams, fitness and learning activity.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <ProgressPanel title="Academic Progress">
            <Metric icon={CalendarDays} label="Attendance" value={`${plan?.attendance?.summary?.percentage ?? 0}%`} note={`${plan?.attendance?.summary?.present ?? 0}/${plan?.attendance?.summary?.total ?? 0} sessions`} />
            <Metric icon={FileText} label="Assignment Completion" value={`${assignmentCompletion}%`} note={`${submittedAssignments}/${assignments.length} submitted`} />
            <Metric icon={GraduationCap} label="Exam Average" value={`${examAverage}%`} note={`${attempts.length} submitted attempt(s)`} />
          </ProgressPanel>

          <ProgressPanel title="Fitness Progress">
            <Metric icon={Dumbbell} label="BMI" value={profile?.bmi ? String(profile.bmi) : "--"} note={profile?.fitnessLevel ?? "Profile pending"} />
            <Metric icon={Activity} label="Running Score" value={profile?.runningTime ? `${profile.runningTime}m` : "--"} note="1.6 KM benchmark" />
            <Metric icon={Dumbbell} label="Fitness Score" value={`${Math.round(profile?.staminaScore ?? 0)}%`} note={profile?.fitnessLevel ?? "No score yet"} />
          </ProgressPanel>

          <ProgressPanel title="Learning Progress">
            <Metric icon={Library} label="Lessons Viewed" value="0" note="Tracking starts in a later learning analytics sprint" />
            <Metric icon={Library} label="Lessons Available" value={String(plan?.materials?.length ?? 0)} note="Teacher-published materials" />
            <Metric icon={CalendarDays} label="Live Classes" value={String(plan?.liveClasses?.length ?? 0)} note="Assigned batch classes" />
          </ProgressPanel>
        </section>
      </section>
    </main>
  );
}

function ProgressPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm"><h2 className="text-2xl font-black">{title}</h2><div className="mt-5 grid gap-3">{children}</div></section>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Library; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-white p-4"><Icon className="h-5 w-5 text-[var(--gold)]" /><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-black">{label}</p><p className="mt-1 text-xs text-[var(--muted-blue)]">{note}</p></div>;
}
