"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  PlayCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StudentBatch = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  course?: {
    title?: string | null;
    slug?: string | null;
  } | null;
  teachers?: Array<{
    subject?: string | null;
    role?: string | null;
    teacher?: {
      name?: string | null;
      email?: string | null;
    } | null;
  }>;
};

type CalendarItem = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  subject: string;
  topic: string;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  teacherName?: string | null;
  completionStatus?: string | null;
  teacherLog?: string | null;
};

type StudentPlan = {
  batches: StudentBatch[];
  calendar: CalendarItem[];
};

type ExamSummary = {
  id: string;
  testId?: string | null;
  title?: string | null;
  name?: string | null;
  examName?: string | null;
  durationMinutes?: number | null;
  duration?: number | null;
  totalQuestions?: number | null;
  status?: string | null;
  batchName?: string | null;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to load student academic data");
  }

  return response.json() as Promise<T>;
}

export default function StudentDashboardPage() {
  const academicPlan = useQuery({
    queryKey: ["student", "academic-plan"],
    queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan"),
  });
  const availableExams = useQuery({
    queryKey: ["student", "available-exams"],
    queryFn: () => apiJson<ExamSummary[]>("/api/tests/available"),
  });

  const batches = academicPlan.data?.batches ?? [];
  const calendar = academicPlan.data?.calendar ?? [];
  const exams = availableExams.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) === today);
  const upcomingClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).slice(0, 6);

  const primaryBatch = batches[0];
  const teacherList = useMemo(
    () =>
      batches
        .flatMap((batch) => batch.teachers ?? [])
        .filter((teacher) => teacher.teacher?.name)
        .slice(0, 6),
    [batches],
  );

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Student Journey</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Your academy dashboard</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                See your batch, today&apos;s class, upcoming exams, learning materials, attendance and academic progress in one simple place.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Current Batch</p>
              <p className="mt-1 text-lg font-black">{primaryBatch?.name ?? "Admission not approved yet"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Assigned Batches" value={batches.length} icon={GraduationCap} />
          <Metric label="Today Classes" value={todayClasses.length} icon={CalendarDays} />
          <Metric label="Available Exams" value={exams.length} icon={ClipboardCheck} />
          <Metric label="Teachers" value={teacherList.length} icon={UserRound} />
        </div>

        {!batches.length && (
          <EmptyState
            title="Your admission is being processed"
            text="After the Admission Cell approves your application and assigns a batch, your classes, exams, materials and calendar will appear here."
          />
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Today" eyebrow="Immediate attention">
            <div className="grid gap-3">
              {todayClasses.map((item) => (
                <ClassRow key={item.id} item={item} />
              ))}
              {!todayClasses.length && <SoftNote text="No class is scheduled for today in your academic calendar." />}
            </div>
          </Panel>

          <Panel title="My Batch" eyebrow="Academy program">
            {primaryBatch ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{primaryBatch.batchType ?? "Academy"}</p>
                  <h3 className="mt-2 text-2xl font-black">{primaryBatch.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">{primaryBatch.course?.title ?? "NIDUS Academy program"}</p>
                </div>
                <div className="grid gap-2">
                  {teacherList.map((teacher) => (
                    <div key={`${teacher.subject}-${teacher.teacher?.email}`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                      <span className="font-black">{teacher.subject ?? "Subject"}</span>
                      <span className="text-[var(--muted-blue)]"> / {teacher.teacher?.name}</span>
                    </div>
                  ))}
                  {!teacherList.length && <SoftNote text="Teacher allocation will appear after academic planning." />}
                </div>
              </div>
            ) : (
              <SoftNote text="No batch assigned yet." />
            )}
          </Panel>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StudentModule title="Classes" text="Recorded and live class links will appear batch-wise." icon={PlayCircle} />
          <StudentModule title="Exams" text="Assigned CBT exams and weekly tests will be shown here." icon={ClipboardCheck} />
          <StudentModule title="Assignments" text="Submit homework and teacher-given tasks." icon={FileText} />
          <StudentModule title="Library" text="Access notes, videos, files and topic materials." icon={Library} />
        </section>

        <Panel title="Available Exams" eyebrow="CBT and weekly tests">
          <div className="grid gap-3 md:grid-cols-2">
            {exams.map((exam) => (
              <article key={exam.id || exam.testId || exam.examName || exam.title || "exam"} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{exam.status ?? "Available"}</p>
                <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{exam.examName ?? exam.title ?? exam.name ?? "Assigned Exam"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">
                  {exam.totalQuestions ? `${exam.totalQuestions} questions` : "Questions assigned"} /{" "}
                  {exam.durationMinutes ?? exam.duration ?? "Timed"} min
                  {exam.batchName ? ` / ${exam.batchName}` : ""}
                </p>
                <Link
                  className="mt-4 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)]"
                  href={`/test-attempt/${exam.testId || exam.id}`}
                >
                  Start Exam
                </Link>
              </article>
            ))}
            {!exams.length && <SoftNote text="No assigned exam is available right now. Your teacher or academic head can publish exams to your batch." />}
          </div>
        </Panel>

        <Panel title="Academic Calendar" eyebrow="Upcoming plan">
          <div className="grid gap-3">
            {upcomingClasses.map((item) => (
              <ClassRow key={item.id} item={item} />
            ))}
            {!upcomingClasses.length && <SoftNote text="Your upcoming academic plan will appear after the Director/Academic Head publishes the calendar." />}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black text-[var(--navy)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ClassRow({ item }: { item: CalendarItem }) {
  const statusColor =
    item.completionStatus === "GREEN"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : item.completionStatus === "RED"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-orange-200 bg-orange-50 text-orange-800";

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.subject}</p>
          <h3 className="mt-1 text-lg font-black text-[var(--navy)]">{item.topic}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">
            {new Date(item.plannedDate).toLocaleDateString()} {item.startTime ? ` / ${item.startTime}` : ""} {item.teacherName ? ` / ${item.teacherName}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColor}`}>{item.completionStatus ?? "PLANNED"}</span>
      </div>
      {item.teacherLog && <p className="mt-3 rounded-xl bg-[var(--page-bg)] p-3 text-sm text-[var(--muted-blue)]">{item.teacherLog}</p>}
    </article>
  );
}

function StudentModule({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--navy)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-6">
      <ShieldCheck className="h-7 w-7 text-[var(--gold)]" />
      <h2 className="mt-4 text-2xl font-black text-[var(--navy)]">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">{text}</p>
    </div>
  );
}

function SoftNote({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
