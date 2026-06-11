"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Library,
  MessageSquareText,
  PlayCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Assignment = {
  id: string;
  subject?: string | null;
  role?: string | null;
  batch?: {
    id: string;
    name: string;
    batchType?: string | null;
    status?: string | null;
    course?: {
      title?: string | null;
    } | null;
    students?: Array<{
      user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
      } | null;
    }>;
  } | null;
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

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Request failed");
  }

  return response.json() as Promise<T>;
}

const modules = [
  { title: "Classrooms", text: "Open assigned batches and student profiles.", icon: Users },
  { title: "Exams", text: "Prepare tests, review AI question paper, publish to class.", icon: ClipboardCheck },
  { title: "Assignments", text: "Give homework and collect student submissions.", icon: FileText },
  { title: "Attendance", text: "Mark presence and view leave requests.", icon: CheckCircle2 },
  { title: "Library", text: "Upload recorded classes, notes and files batch-wise.", icon: Library },
  { title: "NIDUS AI Professor", text: "Ask for lesson plans, exam questions and explanations.", icon: MessageSquareText },
] as const;

export default function TeacherDashboardPage() {
  const queryClient = useQueryClient();
  const [logDrafts, setLogDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const assignmentsQuery = useQuery({
    queryKey: ["teacher", "assignments"],
    queryFn: () => apiJson<Assignment[]>("/api/academy/teacher-assignments"),
  });
  const calendarQuery = useQuery({
    queryKey: ["teacher", "academic-calendar"],
    queryFn: () => apiJson<CalendarItem[]>("/api/academy/academic-calendar"),
  });

  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, completionStatus, teacherLog }: { id: string; completionStatus: string; teacherLog?: string }) =>
      apiJson<CalendarItem>(`/api/academy/academic-calendar/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completionStatus, teacherLog }),
      }),
    onSuccess: () => {
      setMessage("Calendar updated.");
      void queryClient.invalidateQueries({ queryKey: ["teacher", "academic-calendar"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not update calendar."),
  });

  const assignments = assignmentsQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayItems = calendar.filter((item) => item.plannedDate.slice(0, 10) === today);
  const visibleCalendar = todayItems.length ? todayItems : calendar.slice(0, 8);
  const studentsCount = assignments.reduce((total, item) => total + (item.batch?.students?.length ?? 0), 0);

  const updateCalendar = (event: FormEvent<HTMLFormElement>, item: CalendarItem, completionStatus: string) => {
    event.preventDefault();
    updateCalendarMutation.mutate({
      id: item.id,
      completionStatus,
      teacherLog: logDrafts[item.id] || item.teacherLog || "",
    });
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div id="today" className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Teacher Dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Simple teaching room</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            See your assigned batches, today&apos;s classes, students, academic calendar and quick teaching actions. No demo data is shown here.
          </p>
        </div>

        <section id="teaching-profile" className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academic Head Switch</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Choose your working profile</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Use Teaching Profile for your own classes. Use Academic Department for timetable, teacher allocation, syllabus
                tracking and academic management.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/dashboard/teacher#classrooms">
                Teaching Profile
              </Link>
              <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/dashboard/director/academic">
                Academic Department
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Assigned Batches" value={assignments.length} icon={BookOpen} />
          <Metric label="Students Visible" value={studentsCount} icon={Users} />
          <Metric label="Today Classes" value={todayItems.length} icon={CalendarDays} />
          <Metric label="Calendar Items" value={calendar.length} icon={ClipboardCheck} />
        </div>

        {message && <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{message}</div>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} module={module} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel id="classrooms" title="Classrooms" eyebrow="Director allocated batches">
            <div className="grid gap-3">
              {assignments.map((assignment) => (
                <article key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{assignment.subject ?? "Subject"}</p>
                  <h3 className="mt-2 text-xl font-black">{assignment.batch?.name ?? "Assigned batch"}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">
                    {assignment.batch?.course?.title ?? "Academy program"} / {assignment.batch?.students?.length ?? 0} students
                  </p>
                  <div className="mt-4 grid gap-2">
                    {(assignment.batch?.students ?? []).slice(0, 6).map((student) => (
                      <div key={student.user?.id} className="rounded-xl bg-[var(--page-bg)] px-3 py-2 text-sm">
                        <span className="font-bold">{student.user?.name ?? "Student"}</span>
                        <span className="text-[var(--muted-blue)]"> / {student.user?.email}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!assignments.length && <Empty text="No classroom is assigned yet. Director or Academic Head can allocate a batch to this teacher." />}
            </div>
          </Panel>

          <Panel id="academic-calendar" title="Academic Calendar" eyebrow="Click the day and report">
            <div className="grid gap-3">
              {visibleCalendar.map((item) => (
                <CalendarCard
                  key={item.id}
                  item={item}
                  draft={logDrafts[item.id] ?? item.teacherLog ?? ""}
                  onDraft={(value) => setLogDrafts((drafts) => ({ ...drafts, [item.id]: value }))}
                  onSubmit={updateCalendar}
                />
              ))}
              {!visibleCalendar.length && <Empty text="No academic calendar is planned yet." />}
            </div>
          </Panel>
        </section>
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

function ModuleCard({ module }: { module: (typeof modules)[number] }) {
  const Icon = module.icon;
  const id = module.title.toLowerCase().replaceAll(" ", "-");
  return (
    <article id={id} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h3 className="mt-5 text-xl font-black">{module.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{module.text}</p>
    </article>
  );
}

function Panel({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CalendarCard({
  item,
  draft,
  onDraft,
  onSubmit,
}: {
  item: CalendarItem;
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: CalendarItem, completionStatus: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.batchName ?? "Batch"} / {item.subject}</p>
      <h3 className="mt-2 text-lg font-black">{item.topic}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">
        {new Date(item.plannedDate).toLocaleDateString()} {item.startTime ? ` / ${item.startTime}` : ""}
      </p>
      <textarea
        className="mt-4 min-h-20 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
        placeholder="Write completion report, doubts, pending topic, or next action"
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
      />
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <form onSubmit={(event) => onSubmit(event, item, "GREEN")}>
          <button className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
            Completed
          </button>
        </form>
        <form onSubmit={(event) => onSubmit(event, item, "ORANGE")}>
          <button className="w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800">
            Partial
          </button>
        </form>
        <form onSubmit={(event) => onSubmit(event, item, "RED")}>
          <button className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
            Delayed
          </button>
        </form>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
