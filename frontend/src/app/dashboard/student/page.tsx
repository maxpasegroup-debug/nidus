"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useState } from "react";
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
  attendance?: {
    summary?: {
      present: number;
      absent: number;
      leave: number;
      total: number;
      percentage: number;
    };
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
    throw new Error("Unable to load student academic data");
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
    throw new Error("Unable to submit assignment");
  }

  return response.json() as Promise<T>;
}

export default function StudentDashboardPage() {
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { answerText: string; link: string; attachmentName: string }>>({});
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
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

  const batches = academicPlan.data?.batches ?? [];
  const calendar = academicPlan.data?.calendar ?? [];
  const attendance = academicPlan.data?.attendance;
  const attendanceSummary = attendance?.summary ?? { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
  const attendanceSessions = attendance?.sessions ?? [];
  const assignments = academicPlan.data?.assignments ?? [];
  const materials = academicPlan.data?.materials ?? [];
  const liveClasses = academicPlan.data?.liveClasses ?? [];
  const pendingAssignments = assignments.filter((assignment) => assignment.submissionStatus !== "SUBMITTED");
  const exams = availableExams.data?.tests ?? [];
  const results = attemptHistory.data?.attempts ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) === today);
  const upcomingClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).slice(0, 6);
  const upcomingLiveClasses = liveClasses.filter((item) => item.scheduledAt.slice(0, 10) >= today).slice(0, 6);
  const pastLiveClasses = liveClasses.filter((item) => item.scheduledAt.slice(0, 10) < today).slice(0, 4);

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
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Journey</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Your NIDUS dashboard</h1>
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
          <Metric label="Assignments Due" value={pendingAssignments.length} icon={FileText} />
          <Metric label="Library Items" value={materials.length} icon={Library} />
        </div>

        {!batches.length && (
          <EmptyState
            title="Your admission is being processed"
            text="After the Administrative Officer approves your application and assigns a batch, your classes, exams, materials and calendar will appear here."
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

        <section id="classes" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StudentModule title="Classes" text="Upcoming live classes and recorded lessons appear batch-wise." icon={PlayCircle} href="#classes" />
          <StudentModule title="My Learning" text="Program, subject, topic and lesson view for your batch materials." icon={Library} href="/dashboard/student/learning" />
          <StudentModule title="TOP RANK" text="Practice tests, weekly tests and NIDUS-owned CBT coaching." icon={ClipboardCheck} href="#exams" />
          <StudentModule title="Assessments" text="Open psychometric and defence-readiness assessments." icon={ShieldCheck} href="/dashboard/student#assessments" />
          <StudentModule title="NIDUS Guru" text="Focus, discipline and dream-building quests." icon={UserRound} href="/dashboard/student#nidus-guru" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StudentModule title="Assignments" text="Submit homework and teacher-given tasks." icon={FileText} href="#assignments" />
          <StudentModule title="Attendance" text="Track class attendance and marked sessions." icon={CalendarDays} href="#attendance" />
          <StudentModule title="Progress" text="See attendance, assignments, exams, learning and fitness together." icon={GraduationCap} href="/dashboard/student/progress" />
          <StudentModule title="Library" text="Access notes, videos, files and topic materials." icon={Library} href="#library" />
        </section>

        <Panel id="classes" title="My Classes" eyebrow="Upcoming live classes">
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingLiveClasses.map((item) => (
              <LiveClassRow key={item.id} item={item} />
            ))}
            {!upcomingLiveClasses.length && <SoftNote text="Live classes published for your batch will appear here." />}
          </div>
          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Past Live Classes</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {pastLiveClasses.map((item) => (
                <LiveClassRow key={item.id} item={item} past />
              ))}
              {!pastLiveClasses.length && <SoftNote text="Completed live classes and recording links will appear here." />}
            </div>
          </div>
        </Panel>

        <Panel id="assignments" title="Assignments" eyebrow="Teacher published tasks">
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const draft = assignmentDrafts[assignment.id] ?? { answerText: "", link: "", attachmentName: "" };
              const submitted = assignment.submissionStatus === "SUBMITTED";
              return (
                <article key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                        {assignment.subject ?? "Assignment"} {assignment.batchName ? ` / ${assignment.batchName}` : ""}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{assignment.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{assignment.instructions}</p>
                      <p className="mt-2 text-xs font-bold text-[var(--muted-blue)]">
                        {assignment.topic ? `Topic: ${assignment.topic}` : "Topic pending"}
                        {assignment.dueDate ? ` / Due ${assignment.dueDate.slice(0, 10)}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black text-[var(--navy)]">
                      {submitted ? assignment.submission?.reviewStatus ?? "SUBMITTED" : "PENDING"}
                    </span>
                  </div>

                  {submitted ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      Submitted on {assignment.submission?.submittedAt ? new Date(assignment.submission.submittedAt).toLocaleString() : "server"}
                      {assignment.submission?.feedback ? ` / Feedback: ${assignment.submission.feedback}` : ""}
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <textarea
                        value={draft.answerText}
                        onChange={(event) =>
                          setAssignmentDrafts((value) => ({
                            ...value,
                            [assignment.id]: { ...draft, answerText: event.target.value },
                          }))
                        }
                        rows={3}
                        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm md:col-span-3"
                        placeholder="Write your answer or submission note"
                      />
                      <input
                        value={draft.link}
                        onChange={(event) =>
                          setAssignmentDrafts((value) => ({
                            ...value,
                            [assignment.id]: { ...draft, link: event.target.value },
                          }))
                        }
                        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm md:col-span-2"
                        placeholder="Submission link"
                      />
                      <input
                        value={draft.attachmentName}
                        onChange={(event) =>
                          setAssignmentDrafts((value) => ({
                            ...value,
                            [assignment.id]: { ...draft, attachmentName: event.target.value },
                          }))
                        }
                        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                        placeholder="File name"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setAssignmentMessage("Submitting assignment...");
                          try {
                            await apiPost(`/api/academy/assignments/${assignment.id}/submit`, draft);
                            setAssignmentMessage("Assignment submitted.");
                            await academicPlan.refetch();
                          } catch (error) {
                            setAssignmentMessage(error instanceof Error ? error.message : "Could not submit assignment.");
                          }
                        }}
                        className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)] md:col-span-3"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {!assignments.length && <SoftNote text="Assignments published by your teacher will appear here." />}
            {assignmentMessage ? (
              <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
                {assignmentMessage}
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel id="library" title="Library" eyebrow="Batch study materials">
          <div className="grid gap-3 md:grid-cols-2">
            {materials.map((material) => (
              <article key={material.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                      {material.subject ?? "Material"} {material.folder ? ` / ${material.folder}` : ""}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{material.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted-blue)]">
                      {material.topic ?? material.batchName ?? "Batch resource"} / {material.type}
                      {material.teacherName ? ` / ${material.teacherName}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black text-[var(--navy)]">
                    {material.reviewStatus ?? "PUBLISHED"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/student/lesson/${material.id}`}
                    className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)]"
                  >
                    Open Lesson
                  </Link>
                  {material.fileName ? (
                    <span className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-sm font-bold text-[var(--muted-blue)]">
                      {material.fileName}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
            {!materials.length && <SoftNote text="Study materials published to your batch will appear here." />}
          </div>
        </Panel>

        <Panel id="attendance" title="Attendance" eyebrow="Teacher marked sessions">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Overall</p>
              <h3 className="mt-3 text-4xl font-black text-[var(--navy)]">{attendanceSummary.percentage}%</h3>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">
                Present {attendanceSummary.present}/{attendanceSummary.total} sessions
                {attendanceSummary.leave ? ` / Leave ${attendanceSummary.leave}` : ""}
              </p>
            </div>
            <div className="grid gap-3">
              {attendanceSessions.slice(0, 5).map((session) => {
                const record = session.records?.[0];
                return (
                  <article key={session.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                          {session.subject ?? "Class Attendance"}
                        </p>
                        <h3 className="mt-1 font-black text-[var(--navy)]">
                          {session.date ? new Date(session.date).toLocaleDateString() : "Date pending"}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted-blue)]">{session.batchName ?? primaryBatch?.name ?? "Batch"}</p>
                      </div>
                      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black text-[var(--navy)]">
                        {record?.status ?? "MARKED"}
                      </span>
                    </div>
                  </article>
                );
              })}
              {!attendanceSessions.length && <SoftNote text="Attendance appears here after your teacher marks class attendance." />}
            </div>
          </div>
        </Panel>

        <Panel id="exams" title="TOP RANK" eyebrow="CBT and weekly tests">
          <div className="grid gap-3 md:grid-cols-2">
            {exams.map((exam) => (
              <article key={exam.id || exam.testId || exam.examName || exam.title || "exam"} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{exam.studentStatus ?? exam.status ?? "Available"}</p>
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

        <Panel title="Exam Results" eyebrow="Attempts and scores">
          <div className="grid gap-3 md:grid-cols-2">
            {results.slice(0, 6).map((attempt) => {
              const test = attempt.test;
              return (
                <article key={attempt.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                    {attempt.submittedAt ? "SUBMITTED" : attempt.status}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{test?.title ?? "Submitted exam"}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">
                    Score {attempt.score ?? 0}/{test?.totalMarks ?? "-"} / Correct {attempt.totalCorrect ?? 0} / Wrong {attempt.totalWrong ?? 0}
                  </p>
                  {attempt.submittedAt ? (
                    <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">
                      Submitted {new Date(attempt.submittedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </article>
              );
            })}
            {!results.length && <SoftNote text="Your exam results will appear after you submit a published CBT exam." />}
          </div>
        </Panel>

        <Panel id="academic-calendar" title="Academic Calendar" eyebrow="Upcoming plan">
          <div className="grid gap-3">
            {upcomingClasses.map((item) => (
              <ClassRow key={item.id} item={item} />
            ))}
            {!upcomingClasses.length && <SoftNote text="Your upcoming academic plan will appear after the Director/Academic Head publishes the calendar." />}
          </div>
        </Panel>
        <Panel id="assessments" title="Assessments" eyebrow="Know your readiness">
          <div className="grid gap-3 md:grid-cols-2">
            <StudentModule title="Defence Assessments" text="Start readiness, discipline, focus and officer-potential assessments." icon={ShieldCheck} href="/psychometric" />
            <StudentModule title="Assessment Reports" text="Review completed assessment reports and next-action guidance." icon={FileText} href="/psychometric/reports" />
          </div>
        </Panel>

        <Panel id="nidus-guru" title="NIDUS Guru" eyebrow="Personal growth quests">
          <div className="grid gap-3 md:grid-cols-2">
            <StudentModule title="Quest Arena" text="Open focus, discipline, confidence and Dream Addiction quests." icon={UserRound} href="/guru" />
            <StudentModule title="Digital Profile" text="Build a simple NIDUS profile with goals, strengths and progress." icon={UserRound} href="/digital-profile" />
          </div>
        </Panel>

        <Panel id="parent-link" title="Parent Access" eyebrow="Read-only progress sharing">
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
                  setParentLinkMessage("Parent invitation sent. Ask parent to login and accept the link.");
                } catch (error) {
                  setParentLinkMessage(error instanceof Error ? error.message : "Could not send parent invitation.");
                }
              }}
              className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)]"
            >
              Invite Parent
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--muted-blue)]">Parents receive read-only access to attendance, assignments, exams, fees, fitness and reports after accepting.</p>
          {parentLinkMessage ? <div className="mt-3 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-bold">{parentLinkMessage}</div> : null}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value, suffix = "", icon: Icon }: { label: string; value: number; suffix?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black text-[var(--navy)]">{value}{suffix}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function Panel({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
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

function LiveClassRow({ item, past = false }: { item: NonNullable<StudentPlan["liveClasses"]>[number]; past?: boolean }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--gold-soft)]">
          <PlayCircle size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.subject ?? "Live Class"}</p>
          <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{item.topic || item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
            {item.instructorName || "NIDUS Teacher"} / {new Date(item.scheduledAt).toLocaleString()} / {item.duration} min
          </p>
          {item.description ? <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {!past ? (
              <a href={item.meetingLink} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)]">
                Join Class
              </a>
            ) : null}
            {item.recordingUrl ? (
              <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black text-[var(--navy)]">
                Watch Recording
              </a>
            ) : past ? (
              <span className="inline-flex rounded-xl border border-dashed border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--muted-blue)]">Recording pending</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function StudentModule({ title, text, icon: Icon, href }: { title: string; text: string; icon: LucideIcon; href?: string }) {
  const content = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--navy)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-lg">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      {content}
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
