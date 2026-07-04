"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Library,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";

type StudentBatch = {
  id: string;
  name: string;
  status?: string | null;
  batchType?: string | null;
  course?: { title?: string | null } | null;
};

type CalendarItem = {
  id: string;
  batchName?: string | null;
  subject: string;
  topic: string;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  teacherName?: string | null;
  completionStatus?: string | null;
};

type Assignment = {
  id: string;
  batchName?: string | null;
  subject?: string | null;
  title: string;
  topic?: string | null;
  instructions: string;
  dueDate?: string | null;
  attachmentName?: string | null;
  link?: string | null;
  submissionStatus?: string;
  submission?: { status: string; feedback?: string | null; score?: number | null } | null;
};

type Material = {
  id: string;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  title: string;
  type: string;
  createdAt?: string;
};

type LiveClass = {
  id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  instructorName?: string | null;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  recordingUrl?: string | null;
};

type StudentPlan = {
  batches?: StudentBatch[];
  calendar?: CalendarItem[];
  assignments?: Assignment[];
  materials?: Material[];
  liveClasses?: LiveClass[];
  attendance?: {
    summary?: { present: number; absent: number; leave: number; total: number; percentage: number };
    sessions?: Array<{ id: string; batchName?: string | null; subject?: string | null; date?: string; records?: Array<{ status?: string }> }>;
  };
};

type ExamSummary = {
  id: string;
  testId?: string | null;
  title?: string | null;
  name?: string | null;
  examName?: string | null;
  subject?: string | null;
  topic?: string | null;
  publishAt?: string | null;
  durationMinutes?: number | null;
  duration?: number | null;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  batchName?: string | null;
  batch?: { name?: string | null } | null;
  studentStatus?: string | null;
  status?: string | null;
};

type AttemptHistory = {
  id: string;
  status: string;
  submittedAt?: string | null;
  score?: number | null;
  test: { title: string; totalMarks: number; duration: number };
};

type AssignmentDraft = {
  answerText: string;
  link: string;
  attachmentName: string;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new Error("Unable to load learner data");
  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Unable to submit");
  }
  return response.json() as Promise<T>;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function countdownLabel(dateValue?: string | null) {
  if (!dateValue) return "Open now";
  const diff = new Date(dateValue).getTime() - Date.now();
  if (diff <= 0) return "Open now";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} to go`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} to go`;
}

function dueCountdown(dateValue?: string | null) {
  if (!dateValue) return "No due date";
  const diff = new Date(dateValue).getTime() - Date.now();
  if (diff <= 0) return "Due now";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} left`;
}

function useStudentPlan() {
  const { user } = useAuth();
  const router = useRouter();
  const plan = useQuery({ queryKey: ["student", "module-plan"], queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan") });
  const activeBatches = (plan.data?.batches ?? []).filter((batch) => batch.status === "ACTIVE");

  useEffect(() => {
    if (!plan.isLoading && (!activeBatches.length || user?.role === "GUEST")) router.replace("/dashboard/guest");
  }, [activeBatches.length, plan.isLoading, router, user?.role]);

  return { plan, activeBatches };
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100dvh-var(--nav-height))] bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-7xl gap-4">
        <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Student Module</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{subtitle}</p>
        </section>
        {children}
      </section>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/80 p-5 text-sm font-bold text-[var(--muted-blue)]">{text}</div>;
}

export function StudentClassesPage() {
  const { plan, activeBatches } = useStudentPlan();
  const today = todayKey();
  const calendar = plan.data?.calendar ?? [];
  const liveClasses = plan.data?.liveClasses ?? [];
  const todayClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) === today);
  const upcomingClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).slice(0, 8);
  const upcomingLiveClasses = liveClasses.filter((item) => new Date(item.scheduledAt) >= new Date()).slice(0, 4);

  return (
    <Shell title="Classes" subtitle="Today, upcoming timetable and live classes for your assigned batch only.">
      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <ModuleCard title="Today">
          <div className="grid gap-3">
            {todayClasses.map((item) => <ClassCard key={item.id} item={item} />)}
            {!todayClasses.length ? <Empty text="No class is scheduled today." /> : null}
          </div>
        </ModuleCard>
        <ModuleCard title="Live Classes">
          <div className="grid gap-3">
            {upcomingLiveClasses.map((item) => <LiveCard key={item.id} item={item} />)}
            {!upcomingLiveClasses.length ? <Empty text="No live class is scheduled right now." /> : null}
          </div>
        </ModuleCard>
      </section>
      <ModuleCard title="Upcoming Classes">
        <div className="grid gap-3 md:grid-cols-2">
          {upcomingClasses.map((item) => <ClassCard key={item.id} item={item} />)}
          {!upcomingClasses.length ? <Empty text="Upcoming classes will appear when the timetable is published." /> : null}
        </div>
      </ModuleCard>
      <ModuleCard title="My Batches">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activeBatches.map((batch) => (
            <div key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">{batch.batchType ?? "Batch"}</p>
              <h3 className="mt-2 text-lg font-black">{batch.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.course?.title ?? "NIDUS Academy"}</p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </Shell>
  );
}

export function StudentAssignmentsPage() {
  const { plan } = useStudentPlan();
  const [drafts, setDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const assignments = plan.data?.assignments ?? [];
  const sorted = [...assignments].sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));

  return (
    <Shell title="Assignments" subtitle="Published homework, due date countdown and one-screen submission.">
      <section className="grid gap-4 xl:grid-cols-2">
        {sorted.map((assignment) => {
          const submitted = assignment.submissionStatus === "SUBMITTED";
          const draft = drafts[assignment.id] ?? { answerText: "", link: "", attachmentName: "" };
          return (
            <article key={assignment.id} className={`rounded-2xl border p-5 shadow-sm ${submitted ? "border-[var(--border)] bg-white" : "border-[var(--gold-border)] bg-[var(--gold-soft)]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{assignment.subject ?? "Homework"}</p>
                  <h2 className="mt-2 text-2xl font-black">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{assignment.batchName ?? "Assigned batch"} / {assignment.topic ?? "General"}</p>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{submitted ? "Submitted" : dueCountdown(assignment.dueDate)}</span>
              </div>
              <p className="mt-4 text-sm leading-6">{assignment.instructions}</p>
              {assignment.attachmentName || assignment.link ? <p className="mt-2 text-sm font-bold text-[var(--muted-blue)]">{assignment.attachmentName || assignment.link}</p> : null}
              {!submitted ? (
                <div className="mt-4 grid gap-3">
                  <textarea value={draft.answerText} onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, answerText: event.target.value } }))} rows={3} placeholder="Type answer or notes" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={draft.link} onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, link: event.target.value } }))} placeholder="Paste file/link if any" className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
                    <input type="file" onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, attachmentName: event.target.files?.[0]?.name ?? "" } }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMessage("Submitting assignment...");
                      try {
                        await apiPost(`/api/academy/assignments/${assignment.id}/submit`, draft);
                        setMessage("Assignment submitted.");
                        await plan.refetch();
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Could not submit assignment.");
                      }
                    }}
                    className="min-h-12 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black"
                  >
                    Submit Assignment
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-bold">
                  {assignment.submission?.feedback ? `Feedback: ${assignment.submission.feedback}` : "Teacher review pending."}
                </div>
              )}
            </article>
          );
        })}
        {!sorted.length ? <Empty text="No published assignments are available." /> : null}
      </section>
      {message ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-black">{message}</div> : null}
    </Shell>
  );
}

export function StudentExamsPage() {
  useStudentPlan();
  const availableExams = useQuery({ queryKey: ["student", "available-exams"], queryFn: () => apiJson<{ tests: ExamSummary[] }>("/api/tests/available") });
  const attemptHistory = useQuery({ queryKey: ["student", "exam-attempt-history"], queryFn: () => apiJson<{ attempts: AttemptHistory[] }>("/api/tests/attempts/history") });
  const exams = availableExams.data?.tests ?? [];
  const results = attemptHistory.data?.attempts ?? [];

  return (
    <Shell title="Exams" subtitle="Published and scheduled exams are shown with countdown reminders.">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title={`Available Exams (${exams.length})`}>
          <div className="grid gap-3">
            {exams.map((exam) => <ExamCard key={exam.id || exam.testId || exam.title || "exam"} exam={exam} />)}
            {!exams.length ? <Empty text="No published exam is available for your batch." /> : null}
          </div>
        </ModuleCard>
        <ModuleCard title="Results">
          <div className="grid gap-3">
            {results.slice(0, 6).map((attempt) => (
              <article key={attempt.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{attempt.status}</p>
                <h3 className="mt-2 text-lg font-black">{attempt.test.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Score {attempt.score ?? 0}/{attempt.test.totalMarks}</p>
              </article>
            ))}
            {!results.length ? <Empty text="Results will appear after you submit an exam." /> : null}
          </div>
        </ModuleCard>
      </section>
    </Shell>
  );
}

export function StudentAttendancePage() {
  const { plan, activeBatches } = useStudentPlan();
  const [leaveForm, setLeaveForm] = useState({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
  const [message, setMessage] = useState<string | null>(null);
  const summary = plan.data?.attendance?.summary ?? { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
  const sessions = plan.data?.attendance?.sessions ?? [];
  const leaveRequests = useQuery({ queryKey: ["student", "leave-requests"], queryFn: () => apiJson<{ leaves: Array<{ id: string; fromDate: string; toDate: string; status: string; reason: string }> }>("/api/academy/leave-requests") });

  return (
    <Shell title="Attendance & Leave" subtitle="Track attendance and apply leave without opening the full dashboard.">
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <ModuleCard title="Attendance Summary">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Attendance" value={`${summary.percentage}%`} />
            <Metric label="Present" value={summary.present} />
            <Metric label="Absent" value={summary.absent} />
            <Metric label="Leave" value={summary.leave} />
          </div>
          <div className="mt-4 grid gap-2">
            {sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                <span className="font-black">{session.subject ?? "Class"}</span>
                <span className="text-[var(--muted-blue)]"> / {session.date ? new Date(session.date).toLocaleDateString() : "Date pending"}</span>
                <span className="ml-2 font-black">{session.records?.[0]?.status ?? "MARKED"}</span>
              </div>
            ))}
            {!sessions.length ? <Empty text="Attendance records will appear after teachers mark your class." /> : null}
          </div>
        </ModuleCard>
        <ModuleCard title="Apply Leave">
          <div className="grid gap-3 md:grid-cols-2">
            <input type="date" value={leaveForm.fromDate} onChange={(event) => setLeaveForm((form) => ({ ...form, fromDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input type="date" value={leaveForm.toDate} onChange={(event) => setLeaveForm((form) => ({ ...form, toDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm((form) => ({ ...form, reason: event.target.value }))} rows={3} placeholder="Reason" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
            <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setLeaveForm((form) => ({ ...form, attachmentName: event.target.files?.[0]?.name ?? "" }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
            <button
              type="button"
              onClick={async () => {
                setMessage("Submitting leave request...");
                try {
                  await apiPost("/api/academy/leave-requests", { ...leaveForm, batchId: activeBatches[0]?.id });
                  setLeaveForm({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
                  setMessage("Leave request submitted.");
                  await leaveRequests.refetch();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Could not submit leave request.");
                }
              }}
              className="min-h-12 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black md:col-span-2"
            >
              Submit Leave
            </button>
          </div>
          {message ? <div className="mt-3 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-black">{message}</div> : null}
          <div className="mt-4 grid gap-2">
            {(leaveRequests.data?.leaves ?? []).slice(0, 4).map((leave) => (
              <div key={leave.id} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                <span className="font-black">{leave.status}</span>
                <span className="text-[var(--muted-blue)]"> / {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()} / {leave.reason}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </Shell>
  );
}

function ModuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-5 shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function ClassCard({ item }: { item: CalendarItem }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">{item.startTime ?? new Date(item.plannedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <h3 className="mt-1 text-lg font-black">{item.subject}</h3>
          <p className="text-sm text-[var(--muted-blue)]">{item.batchName ?? "Batch"} / {item.topic}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{item.completionStatus ?? "Scheduled"}</span>
      </div>
    </article>
  );
}

function LiveCard({ item }: { item: LiveClass }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{item.subject ?? "Live Class"}</p>
      <h3 className="mt-2 text-lg font-black">{item.topic || item.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.instructorName ?? "NIDUS Teacher"} / {new Date(item.scheduledAt).toLocaleString()}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">Join Class</a>
        {item.recordingUrl ? <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Watch Recording</a> : null}
      </div>
    </article>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const examId = exam.testId || exam.id;
  const locked = exam.publishAt ? new Date(exam.publishAt).getTime() > Date.now() : false;
  return (
    <article className={`rounded-2xl border p-4 ${locked ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{exam.subject ?? "Exam"}</p>
          <h3 className="mt-2 text-xl font-black">{exam.examName ?? exam.title ?? exam.name ?? "Assigned Exam"}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.batchName ?? exam.batch?.name ?? "Assigned batch"} / {exam.topic ?? "General"}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">{countdownLabel(exam.publishAt)}</span>
      </div>
      <p className="mt-3 text-sm text-[var(--muted-blue)]">
        {exam.totalQuestions ? `${exam.totalQuestions} questions` : "Questions assigned"} / {exam.durationMinutes ?? exam.duration ?? "Timed"} min
      </p>
      {locked ? (
        <button type="button" disabled className="mt-4 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black text-[var(--muted-blue)]">Opens at scheduled time</button>
      ) : (
        <Link href={`/test-attempt/${examId}`} className="mt-4 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">
          Start Exam <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
