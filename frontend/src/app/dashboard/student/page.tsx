"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  PlayCircle,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { GuestApplicantDashboard } from "@/components/dashboard/guest-applicant-dashboard";

type StudentBatch = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  course?: { title?: string | null; slug?: string | null } | null;
  teachers?: Array<{
    subject?: string | null;
    role?: string | null;
    teacher?: { name?: string | null; email?: string | null } | null;
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
  attendance?: {
    summary?: { present: number; absent: number; leave: number; total: number; percentage: number };
    sessions?: Array<{
      id: string;
      batchName?: string | null;
      subject?: string | null;
      date?: string;
      records?: Array<{ status?: string; studentName?: string }>;
    }>;
  };
  assignments?: Array<{
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
    submission?: {
      id: string;
      status: string;
      submittedAt: string;
      reviewStatus: string;
      feedback?: string | null;
      score?: number | null;
    } | null;
  }>;
  materials?: Array<{
    id: string;
    batchName?: string | null;
    folder?: string | null;
    subject?: string | null;
    topic?: string | null;
    title: string;
    type: string;
    url?: string | null;
    fileName?: string | null;
    teacherName?: string | null;
    reviewStatus?: string | null;
    createdAt?: string;
  }>;
  liveClasses?: Array<{
    id: string;
    title: string;
    description?: string | null;
    subject?: string | null;
    topic?: string | null;
    instructorName?: string | null;
    scheduledAt: string;
    duration: number;
    meetingLink: string;
    status?: string | null;
    batchId?: string | null;
    recordingUrl?: string | null;
  }>;
};

type StudentLeaveRequest = {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentName?: string | null;
  status: string;
  reviewNote?: string | null;
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
  studentStatus?: string | null;
};

type AttemptHistory = {
  id: string;
  status: string;
  submittedAt?: string | null;
  score?: number | null;
  totalCorrect?: number | null;
  totalWrong?: number | null;
  test: {
    id: string;
    title: string;
    examType: string;
    totalMarks: number;
    duration: number;
  };
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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load learner data");
  }

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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Unable to complete request");
  }

  return response.json() as Promise<T>;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
  const [leaveMessage, setLeaveMessage] = useState<string | null>(null);
  const [parentIdentity, setParentIdentity] = useState("");
  const [parentLinkMessage, setParentLinkMessage] = useState<string | null>(null);

  const academicPlan = useQuery({
    queryKey: ["student", "academic-plan"],
    queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan"),
  });
  const availableExams = useQuery({
    queryKey: ["student", "available-exams"],
    queryFn: () => apiJson<{ tests: ExamSummary[] }>("/api/tests/available"),
  });
  const attemptHistory = useQuery({
    queryKey: ["student", "exam-attempt-history"],
    queryFn: () => apiJson<{ attempts: AttemptHistory[] }>("/api/tests/attempts/history"),
  });
  const leaveRequests = useQuery({
    queryKey: ["student", "leave-requests"],
    queryFn: () => apiJson<{ leaves: StudentLeaveRequest[] }>("/api/academy/leave-requests"),
  });

  const batches = (academicPlan.data?.batches ?? []).filter((batch) => batch.status === "ACTIVE");
  const isActivatedLearner = Boolean(batches.length) && user?.role !== "GUEST";
  const shouldOpenApplicantLobby = !academicPlan.isLoading && !isActivatedLearner;

  useEffect(() => {
    if (shouldOpenApplicantLobby) router.replace("/dashboard/guest");
  }, [router, shouldOpenApplicantLobby]);

  if (shouldOpenApplicantLobby) {
    return <GuestApplicantDashboard name={user?.name} />;
  }

  const today = todayKey();
  const calendar = academicPlan.data?.calendar ?? [];
  const assignments = academicPlan.data?.assignments ?? [];
  const materials = academicPlan.data?.materials ?? [];
  const liveClasses = academicPlan.data?.liveClasses ?? [];
  const attendanceSummary = academicPlan.data?.attendance?.summary ?? { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
  const attendanceSessions = academicPlan.data?.attendance?.sessions ?? [];
  const exams = availableExams.data?.tests ?? [];
  const results = attemptHistory.data?.attempts ?? [];
  const pendingAssignments = assignments.filter((assignment) => assignment.submissionStatus !== "SUBMITTED");
  const todayClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) === today);
  const upcomingClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).slice(0, 5);
  const upcomingLiveClasses = liveClasses.filter((item) => item.scheduledAt.slice(0, 10) >= today).slice(0, 4);
  const recentMaterials = [...materials].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))).slice(0, 6);
  const primaryBatch = batches[0];
  const teacherList = useMemo(
    () =>
      batches
        .flatMap((batch) => batch.teachers ?? [])
        .filter((teacher) => teacher.teacher?.name)
        .slice(0, 8),
    [batches],
  );

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Learner Dashboard</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">What should I do today?</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                Your classes, homework, exams, attendance, library and NIDUS Digital Profile are arranged around today&apos;s work.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Current Batch</p>
              <h2 className="mt-2 text-2xl font-black">{primaryBatch?.name ?? "Batch pending"}</h2>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">{primaryBatch?.course?.title ?? "NIDUS Academy"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Today" value={todayClasses.length} note="classes" icon={CalendarDays} />
          <Metric label="Live" value={upcomingLiveClasses.length} note="upcoming" icon={PlayCircle} />
          <Metric label="Homework" value={pendingAssignments.length} note="pending" icon={FileText} />
          <Metric label="Exams" value={exams.length} note="available" icon={ClipboardCheck} />
          <Metric label="Attendance" value={attendanceSummary.percentage} note="%" icon={CheckCircle2} />
          <Metric label="Library" value={materials.length} note="items" icon={Library} />
        </section>

        <section id="today" className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Today" eyebrow="Immediate work">
            <div className="grid gap-3">
              {todayClasses.map((item) => <ClassCard key={item.id} item={item} />)}
              {!todayClasses.length ? <SoftNote text="No class is scheduled today. Check the weekly calendar or wait for the Academic Head to publish the timetable." /> : null}
            </div>
          </Panel>

          <Panel title="My Batch" eyebrow="Academy">
            <div className="space-y-4">
              {batches.map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.batchType ?? "Batch"}</p>
                  <h3 className="mt-2 text-xl font-black">{batch.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">{batch.course?.title ?? "NIDUS Academy program"}</p>
                </article>
              ))}
              <div className="grid gap-2">
                {teacherList.map((teacher) => (
                  <div key={`${teacher.subject}-${teacher.teacher?.email}`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                    <span className="font-black">{teacher.subject ?? "Subject"}</span>
                    <span className="text-[var(--muted-blue)]"> / {teacher.teacher?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Learning Tools</p>
          <h2 className="mt-2 text-3xl font-black">Open what you need</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <WorkspaceTile title="Classes" text="Today, live and timetable" icon={PlayCircle} href="#classes" />
            <WorkspaceTile title="Assignments" text="Submit homework" icon={FileText} href="#assignments" />
            <WorkspaceTile title="Exams" text="Take CBT and see results" icon={ClipboardCheck} href="#exams" />
            <WorkspaceTile title="Attendance" text="Track and apply leave" icon={CalendarDays} href="#attendance" />
            <WorkspaceTile title="Library" text="Videos, notes and files" icon={Library} href="#library" />
            <WorkspaceTile title="Digital Profile" text="Progress and portfolio" icon={UserRound} href="#profile" />
          </div>
        </section>

        <Panel id="classes" title="Classes" eyebrow="Timetable and live sessions">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-black">Upcoming timetable</h3>
              <div className="mt-4 grid gap-3">
                {upcomingClasses.map((item) => <ClassCard key={item.id} item={item} />)}
                {!upcomingClasses.length ? <SoftNote text="Upcoming classes will appear after timetable publication." /> : null}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black">Live classes</h3>
              <div className="mt-4 grid gap-3">
                {upcomingLiveClasses.map((item) => <LiveClassCard key={item.id} item={item} />)}
                {!upcomingLiveClasses.length ? <SoftNote text="No live class is scheduled right now." /> : null}
              </div>
            </div>
          </div>
        </Panel>

        <Panel id="assignments" title="Assignments" eyebrow="Homework">
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                draft={assignmentDrafts[assignment.id] ?? { answerText: "", link: "", attachmentName: "" }}
                onDraftChange={(draft) => setAssignmentDrafts((value) => ({ ...value, [assignment.id]: draft }))}
                onSubmit={async () => {
                  setAssignmentMessage("Submitting assignment...");
                  try {
                    await apiPost(`/api/academy/assignments/${assignment.id}/submit`, assignmentDrafts[assignment.id] ?? { answerText: "", link: "", attachmentName: "" });
                    setAssignmentMessage("Assignment submitted.");
                    await academicPlan.refetch();
                  } catch (error) {
                    setAssignmentMessage(error instanceof Error ? error.message : "Could not submit assignment.");
                  }
                }}
              />
            ))}
            {!assignments.length ? <SoftNote text="Assignments published by your teacher will appear here." /> : null}
            {assignmentMessage ? <Message text={assignmentMessage} /> : null}
          </div>
        </Panel>

        <Panel id="exams" title="Exams" eyebrow="CBT and results">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-black">Available exams</h3>
              <div className="mt-4 grid gap-3">
                {exams.map((exam) => <ExamCard key={exam.id || exam.testId || exam.title || exam.examName || "exam"} exam={exam} />)}
                {!exams.length ? <SoftNote text="No exam is available right now." /> : null}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black">Results</h3>
              <div className="mt-4 grid gap-3">
                {results.slice(0, 5).map((attempt) => <ResultCard key={attempt.id} attempt={attempt} />)}
                {!results.length ? <SoftNote text="Results will appear after you submit an exam." /> : null}
              </div>
            </div>
          </div>
        </Panel>

        <Panel id="attendance" title="Attendance and Leave" eyebrow="Register">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">This Month</p>
              <h3 className="mt-3 text-5xl font-black">{attendanceSummary.percentage}%</h3>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">
                Present {attendanceSummary.present}/{attendanceSummary.total} sessions
                {attendanceSummary.leave ? ` / Leave ${attendanceSummary.leave}` : ""}
              </p>
              <div className="mt-5 grid gap-2">
                {attendanceSessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm">
                    <span className="font-black">{session.subject ?? "Class"}</span>
                    <span className="text-[var(--muted-blue)]"> / {session.date ? new Date(session.date).toLocaleDateString() : "Date pending"}</span>
                    <span className="ml-2 font-black">{session.records?.[0]?.status ?? "MARKED"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Leave Request</p>
                  <h3 className="mt-2 text-2xl font-black">Apply for leave</h3>
                </div>
                <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                  {leaveRequests.data?.leaves.filter((leave) => leave.status === "PENDING").length ?? 0} pending
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="date" value={leaveForm.fromDate} onChange={(event) => setLeaveForm((form) => ({ ...form, fromDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
                <input type="date" value={leaveForm.toDate} onChange={(event) => setLeaveForm((form) => ({ ...form, toDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
                <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm((form) => ({ ...form, reason: event.target.value }))} rows={3} placeholder="Reason" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setLeaveForm((form) => ({ ...form, attachmentName: event.target.files?.[0]?.name ?? "" }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
                <button
                  type="button"
                  onClick={async () => {
                    setLeaveMessage("Submitting leave request...");
                    try {
                      await apiPost("/api/academy/leave-requests", { ...leaveForm, batchId: primaryBatch?.id });
                      setLeaveForm({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
                      setLeaveMessage("Leave request submitted.");
                      await leaveRequests.refetch();
                    } catch (error) {
                      setLeaveMessage(error instanceof Error ? error.message : "Could not submit leave request.");
                    }
                  }}
                  className="min-h-12 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black md:col-span-2"
                >
                  Submit Leave
                </button>
              </div>
              {leaveMessage ? <Message text={leaveMessage} /> : null}
            </div>
          </div>
        </Panel>

        <Panel id="library" title="Library" eyebrow="Teacher materials">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentMaterials.map((material) => (
              <Link key={material.id} href={`/dashboard/student/lesson/${material.id}`} className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{material.type}</p>
                <h3 className="mt-2 text-xl font-black">{material.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{material.subject ?? "Subject"} / {material.topic ?? material.folder ?? "General"}</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{material.teacherName ?? "NIDUS Faculty"}</p>
              </Link>
            ))}
            {!recentMaterials.length ? <SoftNote text="Recorded classes, PDFs, PPTs and images will appear here after teachers publish them." /> : null}
          </div>
          <Link href="/dashboard/student/learning" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">
            Open full learning library <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>

        <Panel id="profile" title="NIDUS Digital Profile" eyebrow="Progress and portfolio">
          <div className="grid gap-4 lg:grid-cols-3">
            <ProfileCard title="Academic Progress" value={`${attendanceSummary.percentage}%`} note="attendance signal" icon={GraduationCap} />
            <ProfileCard title="Assignment Discipline" value={`${assignments.length ? Math.round(((assignments.length - pendingAssignments.length) / assignments.length) * 100) : 0}%`} note="homework completion" icon={FileText} />
            <ProfileCard title="Exam Activity" value={String(results.length)} note="submitted exam attempts" icon={ClipboardCheck} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/student/progress" className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black">Open Progress Report</Link>
            <Link href="/digital-profile" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Open Digital Profile</Link>
            <Link href="/psychometric" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Take Assessments</Link>
          </div>
        </Panel>

        <Panel id="parent-link" title="Parent Access" eyebrow="Read-only sharing">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={parentIdentity}
              onChange={(event) => setParentIdentity(event.target.value)}
              className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="Parent email or mobile number"
            />
            <button
              type="button"
              onClick={async () => {
                setParentLinkMessage("Sending parent invitation...");
                try {
                  await apiPost("/api/auth/parent-link/invite", { parentIdentity });
                  setParentIdentity("");
                  setParentLinkMessage("Parent invitation sent.");
                } catch (error) {
                  setParentLinkMessage(error instanceof Error ? error.message : "Could not send parent invitation.");
                }
              }}
              className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black"
            >
              Invite Parent
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--muted-blue)]">Parents get read-only access after accepting the invitation.</p>
          {parentLinkMessage ? <Message text={parentLinkMessage} /> : null}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: number; note: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="text-xs text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Panel({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function WorkspaceTile({ title, text, icon: Icon, href }: { title: string; text: string; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:bg-white">
      <Icon className="h-6 w-6 text-[var(--gold)]" />
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </Link>
  );
}

function ClassCard({ item }: { item: CalendarItem }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.startTime ?? "Time pending"}</p>
          <h3 className="mt-1 text-xl font-black">{item.subject}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">
            {item.topic} {item.teacherName ? `/ ${item.teacherName}` : ""} {item.batchName ? `/ ${item.batchName}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
          {item.completionStatus ?? "PLANNED"}
        </span>
      </div>
    </article>
  );
}

function LiveClassCard({ item }: { item: NonNullable<StudentPlan["liveClasses"]>[number] }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.subject ?? "Live Class"}</p>
      <h3 className="mt-2 text-xl font-black">{item.topic || item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
        {item.instructorName || "NIDUS Faculty"} / {new Date(item.scheduledAt).toLocaleString()} / {item.duration} min
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">Join Class</a>
        {item.recordingUrl ? (
          <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Watch Recording</a>
        ) : null}
      </div>
    </article>
  );
}

function AssignmentCard({
  assignment,
  draft,
  onDraftChange,
  onSubmit,
}: {
  assignment: NonNullable<StudentPlan["assignments"]>[number];
  draft: AssignmentDraft;
  onDraftChange: (draft: AssignmentDraft) => void;
  onSubmit: () => Promise<void>;
}) {
  const submitted = assignment.submissionStatus === "SUBMITTED";

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{assignment.subject ?? "Homework"}</p>
          <h3 className="mt-2 text-2xl font-black">{assignment.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{assignment.instructions}</p>
          <p className="mt-2 text-xs font-bold text-[var(--muted-blue)]">
            {assignment.dueDate ? `Due ${assignment.dueDate.slice(0, 10)}` : "Due date pending"} {assignment.attachmentName ? `/ ${assignment.attachmentName}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
          {submitted ? assignment.submission?.reviewStatus ?? "SUBMITTED" : "PENDING"}
        </span>
      </div>

      {submitted ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Submitted {assignment.submission?.submittedAt ? new Date(assignment.submission.submittedAt).toLocaleString() : ""}
          {assignment.submission?.feedback ? ` / Feedback: ${assignment.submission.feedback}` : ""}
          {typeof assignment.submission?.score === "number" ? ` / Score: ${assignment.submission.score}` : ""}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <textarea
            value={draft.answerText}
            onChange={(event) => onDraftChange({ ...draft, answerText: event.target.value })}
            rows={3}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm md:col-span-3"
            placeholder="Write your answer or note"
          />
          <input value={draft.link} onChange={(event) => onDraftChange({ ...draft, link: event.target.value })} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm md:col-span-2" placeholder="Submission link" />
          <input value={draft.attachmentName} onChange={(event) => onDraftChange({ ...draft, attachmentName: event.target.value })} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm" placeholder="File name" />
          <button type="button" onClick={onSubmit} className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black md:col-span-3">
            Submit Assignment
          </button>
        </div>
      )}
    </article>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const examId = exam.testId || exam.id;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{exam.studentStatus ?? exam.status ?? "Available"}</p>
      <h3 className="mt-2 text-xl font-black">{exam.examName ?? exam.title ?? exam.name ?? "Assigned Exam"}</h3>
      <p className="mt-2 text-sm text-[var(--muted-blue)]">
        {exam.totalQuestions ? `${exam.totalQuestions} questions` : "Questions assigned"} / {exam.durationMinutes ?? exam.duration ?? "Timed"} min
      </p>
      <Link href={`/test-attempt/${examId}`} className="mt-4 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">
        Start Exam
      </Link>
    </article>
  );
}

function ResultCard({ attempt }: { attempt: AttemptHistory }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{attempt.submittedAt ? "SUBMITTED" : attempt.status}</p>
      <h3 className="mt-2 text-xl font-black">{attempt.test.title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-blue)]">
        Score {attempt.score ?? 0}/{attempt.test.totalMarks} / Correct {attempt.totalCorrect ?? 0} / Wrong {attempt.totalWrong ?? 0}
      </p>
    </article>
  );
}

function ProfileCard({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <Icon className="h-6 w-6 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <h3 className="mt-1 text-lg font-black">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return <div className="mt-3 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-bold">{text}</div>;
}

function SoftNote({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
