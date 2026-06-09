"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  LibraryBig,
  ListChecks,
  PenLine,
  Send,
  Sparkles,
  Upload,
  UsersRound
} from "lucide-react";
import { DashboardError, DashboardSkeleton, RoleDashboardGuard, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useTeacherDashboard } from "@/hooks/use-dashboard";
import { getAcademyBatches, type AcademyBatch } from "@/services/academy";

const modules = [
  {
    id: "today",
    title: "Today",
    line: "Immediate work, notices, pending attendance, exam drafts and class reminders.",
    icon: Bell,
    href: "#today"
  },
  {
    id: "classroom",
    title: "Classroom",
    line: "Assigned batches, students, student profiles, class details and batch movement.",
    icon: UsersRound,
    href: "#classroom"
  },
  {
    id: "exams",
    title: "Exams",
    line: "Create an exam with NIDUS AI, review questions, select class and publish.",
    icon: ClipboardCheck,
    href: "#exams"
  },
  {
    id: "assignments",
    title: "Assignments",
    line: "Create homework or classwork with AI help and publish to students.",
    icon: PenLine,
    href: "#assignments"
  },
  {
    id: "attendance",
    title: "Attendance",
    line: "Mark attendance quickly, check leave requests and submit class attendance.",
    icon: CheckCircle2,
    href: "#attendance"
  },
  {
    id: "library",
    title: "Library",
    line: "Create folders, upload recordings, notes, PDFs and publish to a class.",
    icon: LibraryBig,
    href: "#library"
  },
  {
    id: "calendar",
    title: "Academic Calendar",
    line: "View Director-planned syllabus calendar and enter daily completion logs.",
    icon: CalendarDays,
    href: "#calendar"
  }
];

const aiSamples = [
  "Create a 30-question NDA Maths test from trigonometry for 45 minutes.",
  "Prepare homework for today's English grammar class.",
  "Create a simple revision plan for weak students in Medieval India.",
  "Write a completion log for today's Physics topic."
];

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useTeacherDashboard();
  const { data: academyBatches = [] } = useQuery({ queryKey: ["teacher", "academy-batches"], queryFn: () => getAcademyBatches({ status: "ACTIVE" }) });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const assignedBatchIds = useMemo(() => new Set(data?.assignedBatches.map((batch) => batch.id) ?? []), [data?.assignedBatches]);
  const assignedClassrooms = useMemo(() => {
    const scoped = academyBatches.filter((batch) => assignedBatchIds.has(batch.id));
    return scoped.length ? scoped : academyBatches.slice(0, 4);
  }, [academyBatches, assignedBatchIds]);

  if (isLoading) return <RoleDashboardGuard role="TEACHER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TEACHER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const profileName = user?.name ?? data.profile?.name ?? "Teacher";
  const todayClasses = data.teachingPlan.today;
  const upcomingClasses = data.teachingPlan.upcoming;
  const pendingTasks = [
    todayClasses.length ? `${todayClasses.length} class${todayClasses.length > 1 ? "es" : ""} today` : "No class scheduled today",
    data.contentOps.cbtDrafts ? `${data.contentOps.cbtDrafts} test drafts / tests in system` : "No pending exam draft",
    data.classPerformance.assignmentsDue ? `${data.classPerformance.assignmentsDue} assignments due` : "No assignment due",
    data.classPerformance.attendance < 100 ? "Check attendance completion" : "Attendance looks fine"
  ];

  function handleAiSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    if (prompt.toLowerCase().includes("exam") || prompt.toLowerCase().includes("test") || prompt.toLowerCase().includes("question")) {
      setAiResponse("NIDUS AI will prepare the question plan, options, answers, explanations, timer and class selection flow. Open Exams to review and publish.");
    } else if (prompt.toLowerCase().includes("assignment") || prompt.toLowerCase().includes("homework")) {
      setAiResponse("NIDUS AI will draft the assignment instructions, due date suggestion, marking points and student-friendly explanation. Open Assignments to publish.");
    } else if (prompt.toLowerCase().includes("calendar") || prompt.toLowerCase().includes("log") || prompt.toLowerCase().includes("syllabus")) {
      setAiResponse("NIDUS AI will turn this into a simple academic calendar log with completed, pending and next-action notes.");
    } else {
      setAiResponse("NIDUS AI will convert your request into a teacher-ready draft. Review it, edit if needed, then publish or record the update.");
    }
  }

  return (
    <RoleDashboardGuard role="TEACHER">
      <motion.div className="space-y-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_58%,#eef4f7_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6426]">Teacher Control Panel</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">
                Welcome, {profileName}.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
                Teach, mark attendance, create exams, publish assignments, upload materials and update syllabus logs from one simple dashboard.
              </p>
            </div>
            <Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Today Classes" value={String(todayClasses.length)} note={todayClasses[0]?.title ?? "No class today"} />
          <StatCard label="Classrooms" value={String(data.assignedBatches.length)} note="Assigned batches" />
          <StatCard label="Attendance" value={`${data.classPerformance.attendance}%`} note="Recent attendance status" />
          <StatCard label="Library Uploads" value={String(data.contentOps.lectureUploads + data.contentOps.notesUploads)} note="Lectures and documents" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <a key={module.id} href={module.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="grid h-12 w-12 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[#071d36]">{module.title}</h2>
                <p className="mt-2 min-h-16 text-sm leading-6 text-[#64748b]">{module.line}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-[#071d36]">Open</span>
              </a>
            );
          })}
        </section>

        <Panel id="today" eyebrow="Today" title="Immediate attention">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div className="grid gap-3">
              {pendingTasks.map((task, index) => (
                <div key={task} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-[#fffdf8] p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071d36] text-xs font-bold text-[#e7c873]">{index + 1}</span>
                  <p className="text-sm font-semibold text-[#071d36]">{task}</p>
                </div>
              ))}
            </div>
            <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] p-4">
              <Sparkles className="h-6 w-6 text-[#8a6426]" />
              <h3 className="mt-3 text-xl font-semibold text-[#071d36]">Ask NIDUS AI</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Type what you need. NIDUS will prepare a teacher-ready draft for exam, assignment, class note or syllabus log.</p>
              <form onSubmit={handleAiSubmit} className="mt-4 grid gap-3">
                <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} className="min-h-24 rounded border border-[#071d36]/10 bg-white p-3 text-sm text-[#071d36]" placeholder="Example: Create a test from today's topic" />
                <Button type="submit">Ask NIDUS <Send className="h-4 w-4" /></Button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {aiSamples.slice(0, 2).map((sample) => (
                  <button key={sample} type="button" onClick={() => setAiPrompt(sample)} className="rounded-full border border-[#071d36]/10 bg-white px-3 py-2 text-xs font-semibold text-[#071d36]">
                    Sample
                  </button>
                ))}
              </div>
              {aiResponse ? <p className="mt-4 rounded border border-[#071d36]/10 bg-white p-3 text-sm leading-6 text-[#40516a]">{aiResponse}</p> : null}
            </div>
          </div>
        </Panel>

        <Panel id="classroom" eyebrow="Classroom" title="Assigned classrooms and students">
          <div className="grid gap-4 xl:grid-cols-2">
            {assignedClassrooms.map((batch) => (
              <ClassroomCard key={batch.id} batch={batch} />
            ))}
            {!assignedClassrooms.length ? <EmptyBlock title="No classroom assigned yet" text="Director or Academic Head will allocate batches and students. They will appear here automatically." /> : null}
          </div>
        </Panel>

        <Panel id="exams" eyebrow="Exams" title="Create, review and publish tests">
          <SimpleFlow
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Teacher exam flow"
            description="Click create exam, type topic and class, use question bank or NIDUS AI, review questions, set timer and publish."
            href="/examination-center/exams"
            action="Create Exam"
            steps={["Select class", "Type topic", "AI/question bank", "Review", "Publish"]}
          />
        </Panel>

        <Panel id="assignments" eyebrow="Assignments" title="Create homework or classwork">
          <SimpleFlow
            icon={<FileText className="h-6 w-6" />}
            title="Assignment flow"
            description="Create simple assignments, upload files if needed, set due date and publish to the selected classroom."
            href="/documents"
            action="Open Assignments"
            steps={["Select class", "Write task", "Attach file", "Set due date", "Publish"]}
          />
        </Panel>

        <Panel id="attendance" eyebrow="Attendance" title="One-click attendance and leave review">
          <SimpleFlow
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Attendance flow"
            description="Open attendance, choose class, mark all present or mark absentees, check leave requests and submit."
            href="/discipline"
            action="Mark Attendance"
            steps={["Choose class", "All present", "Mark absent", "Check leave", "Submit"]}
          />
        </Panel>

        <Panel id="library" eyebrow="Library" title="Course folders and study materials">
          <SimpleFlow
            icon={<FolderOpen className="h-6 w-6" />}
            title="Library flow"
            description="Create course folders, subfolders, upload recorded classes, notes, PDFs or photos, then publish to students."
            href="/media-library"
            action="Open Library"
            steps={["Create folder", "Add topic", "Upload", "Rename/edit", "Publish"]}
          />
        </Panel>

        <Panel id="calendar" eyebrow="Academic Calendar" title="Syllabus calendar and completion logs">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-3">
              {(todayClasses.length ? todayClasses : upcomingClasses.slice(0, 5)).map((slot) => (
                <div key={slot.id} className="rounded border border-[#071d36]/10 bg-[#fffdf8] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">{slot.subject}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#071d36]">{slot.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">{slot.batch} - {new Date(slot.startTime).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#edf7ee] px-3 py-1 text-xs font-bold text-[#2f6b3f]">Completed</span>
                    <span className="rounded-full bg-[#fff7de] px-3 py-1 text-xs font-bold text-[#8a6426]">Partial</span>
                    <span className="rounded-full bg-[#fff2ec] px-3 py-1 text-xs font-bold text-[#9f341f]">Delayed</span>
                  </div>
                </div>
              ))}
              {!todayClasses.length && !upcomingClasses.length ? <EmptyBlock title="No calendar item yet" text="Director-planned class calendar will appear here after timetable allocation." /> : null}
            </div>
            <div className="rounded border border-[#071d36]/10 bg-[#fffdf8] p-4">
              <ListChecks className="h-6 w-6 text-[#b9913f]" />
              <h3 className="mt-3 text-xl font-semibold text-[#071d36]">Daily log</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Teacher clicks the day, marks completed/partial/delayed, adds a short comment and next action.</p>
              <textarea className="mt-4 min-h-28 w-full rounded border border-[#071d36]/10 bg-white p-3 text-sm text-[#071d36]" placeholder="Example: Completed Mughal administration. Need 10 MCQ practice tomorrow." />
              <Button href="/live-classes" className="mt-3">Open Calendar</Button>
            </div>
          </div>
        </Panel>
      </motion.div>
    </RoleDashboardGuard>
  );
}

function Panel({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold text-[#071d36]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ClassroomCard({ batch }: { batch: AcademyBatch }) {
  const students = batch.students ?? [];
  return (
    <article className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">{batch.batchType.replace(/_/g, " ")}</p>
          <h3 className="mt-2 text-xl font-semibold text-[#071d36]">{batch.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">{batch.course?.title ?? batch.programSlug}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#071d36]">{students.length || batch._count?.students || 0} students</span>
      </div>
      <div className="mt-4 grid gap-2">
        {students.slice(0, 5).map((entry) => (
          <Link key={entry.id} href="/digital-profile" className="flex items-center justify-between rounded border border-[#071d36]/10 bg-white px-3 py-3 text-sm transition hover:border-[#b9913f]/45">
            <span className="font-semibold text-[#071d36]">{entry.student.name}</span>
            <span className="text-xs text-[#64748b]">{entry.status}</span>
          </Link>
        ))}
        {!students.length ? <p className="rounded border border-[#071d36]/10 bg-white px-3 py-3 text-sm text-[#64748b]">Student list will appear after Admission Cell assigns students.</p> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button href="/performance-analytics" size="sm">Student Profiles</Button>
        <Button href="/live-classes" size="sm" variant="secondary">Open Class</Button>
      </div>
    </article>
  );
}

function SimpleFlow({
  icon,
  title,
  description,
  steps,
  href,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  href: string;
  action: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded border border-[#071d36]/10 bg-[#fff7de] p-5">
        <div className="text-[#8a6426]">{icon}</div>
        <h3 className="mt-3 text-2xl font-semibold text-[#071d36]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#64748b]">{description}</p>
        <Button href={href} className="mt-5">{action}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded border border-[#071d36]/10 bg-[#fffdf8] p-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071d36] text-xs font-bold text-[#e7c873]">{index + 1}</span>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#071d36]">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
      <BookOpen className="h-6 w-6 text-[#b9913f]" />
      <p className="mt-3 font-semibold text-[#071d36]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#64748b]">{text}</p>
    </div>
  );
}
