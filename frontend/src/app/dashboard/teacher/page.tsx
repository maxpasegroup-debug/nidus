"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LibraryBig,
  MessageSquareText,
  PlayCircle,
  Send,
  Target,
  Timer,
  Trophy,
  Video,
  UsersRound
} from "lucide-react";
import {
  DashboardError,
  DashboardSkeleton,
  RoleDashboardGuard,
  StatCard
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTeacherDashboard } from "@/hooks/use-dashboard";

const simpleModules = [
  {
    title: "Classes",
    line: "Online classes, recorded classes, class schedule, and uploaded recordings.",
    href: "/live-classes",
    icon: PlayCircle,
    action: "Open Classes"
  },
  {
    title: "Teachers",
    line: "Subject-wise teachers, class coverage, workload, and pending approvals.",
    href: "/staff-hr",
    icon: UsersRound,
    action: "Manage Teachers"
  },
  {
    title: "Students",
    line: "Batch-wise students, weak students, attendance issues, and performance alerts.",
    href: "/performance-analytics",
    icon: GraduationCap,
    action: "View Students"
  },
  {
    title: "Exams & Tests",
    line: "Create timed tests, optional answers, review questions, approve, and publish.",
    href: "/tests",
    icon: ClipboardCheck,
    action: "Create Test"
  },
  {
    title: "Attendance",
    line: "Mark present, absent, late, and check daily or batch attendance.",
    href: "/discipline",
    icon: CalendarCheck,
    action: "Mark Attendance"
  },
  {
    title: "Assignments",
    line: "Give homework, upload worksheets, review submissions, and track pending work.",
    href: "/documents",
    icon: FileText,
    action: "Open Assignments"
  },
  {
    title: "Study Materials",
    line: "Upload notes, PDFs, answer keys, recorded lessons, and subject resources.",
    href: "/media-library",
    icon: BookOpen,
    action: "Upload Material"
  },
  {
    title: "Reports",
    line: "Class reports, student progress, attendance reports, and exam reports.",
    href: "/progress-reports",
    icon: FileText,
    action: "View Reports"
  }
];

const professorPrompts = [
  "Create a 30-question NDA Maths test from Trigonometry with 45 minutes timer.",
  "Prepare a simple class plan for today's Physics topic.",
  "Find weak students from the latest test result and suggest revision.",
  "Create homework with 10 easy, 10 medium and 5 hard questions."
];

const classExecutionTiles = [
  {
    title: "20 Min Recorded Class",
    line: "Upload or assign one short recorded class for the topic.",
    href: "/recorded-lectures",
    icon: Video,
    tone: "bg-[#fff7de]"
  },
  {
    title: "10 MCQ Practice",
    line: "Give 10 questions based on that recorded class.",
    href: "/tests",
    icon: ClipboardCheck,
    tone: "bg-[#edf7ee]"
  },
  {
    title: "Topic Analysis",
    line: "Check speed, time per question, first attempt and second attempt accuracy.",
    href: "/performance-analytics",
    icon: BarChart3,
    tone: "bg-[#eef5ff]"
  },
  {
    title: "Area to Improve",
    line: "See which topic or question type needs correction.",
    href: "/progress-reports",
    icon: Target,
    tone: "bg-[#fff2ec]"
  },
  {
    title: "Saturday Mock Test",
    line: "Run one weekly mock test with timer and marks.",
    href: "/tests",
    icon: Trophy,
    tone: "bg-[#f5efff]"
  },
  {
    title: "Sunday Paper Analysis",
    line: "Host live paper analysis for maximum 2 hours.",
    href: "/live-classes",
    icon: Timer,
    tone: "bg-[#eff8f8]"
  }
];

const courseTracks = ["NDA Crash", "NDA F1", "NDA F2"];
const subjectLibrary = ["Maths", "English", "Biology", "Social", "GK", "Current Affairs", "Chemistry", "Physics"];

function dashboardCopy(template: string, designation?: string | null, subject?: string | null) {
  if (template === "ACADEMIC_HEAD") {
    return {
      eyebrow: "Academic Head",
      title: "Simple Academic Control Room",
      description: "Manage classes, teachers, students, tests, attendance, assignments, materials, and reports from one easy dashboard."
    };
  }

  if (template === "PHYSICAL_INSTRUCTOR") {
    return {
      eyebrow: "Physical Training",
      title: "Simple Training Dashboard",
      description: "Plan sessions, mark attendance, track fitness, and support students who need physical training attention."
    };
  }

  return {
    eyebrow: designation || `${subject ?? "Subject"} Faculty`,
    title: "Simple Teacher Dashboard",
    description: "Teach online, upload recorded classes, create tests, mark attendance, give assignments, and support students easily."
  };
}

export default function TeacherDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTeacherDashboard();
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{ prompt: string; response: string }>>([]);

  const copy = useMemo(() => {
    const custom = data?.customDashboard;
    return dashboardCopy(custom?.dashboardTemplate ?? "SUBJECT_FACULTY", custom?.designation, custom?.subject);
  }, [data]);

  if (isLoading) return <RoleDashboardGuard role="TEACHER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TEACHER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const custom = data.customDashboard;
  const focusAreas = custom.focusAreas.length ? custom.focusAreas : data.subjects;
  const isAcademicHead = custom.dashboardTemplate === "ACADEMIC_HEAD";

  function handleProfessorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    const response = buildProfessorResponse(prompt);
    setAiHistory((items) => [{ prompt, response }, ...items].slice(0, 5));
    setAiPrompt("");
  }

  return (
    <RoleDashboardGuard role="TEACHER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(focusAreas.length || data.subjects.length), label: isAcademicHead ? "areas" : "subjects" },
            { value: `${data.classPerformance.attendance}%`, label: "attendance" },
            { value: String(data.classPerformance.weakStudentCount), label: "need help" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Class Score" value={`${data.classPerformance.averageScore}%`} note="Average student performance" />
          <StatCard label="Attendance" value={`${data.classPerformance.attendance}%`} note="Marked attendance" />
          <StatCard label="Tests" value={String(data.contentOps.cbtDrafts)} note="Created or available tests" />
          <StatCard label="Materials" value={String(data.contentOps.notesUploads)} note="Uploaded study files" />
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Classes</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#071d36]">Simple class execution</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">
                Follow this easy class cycle: short recorded lesson, quick MCQ practice, topic analysis, improvement work, weekly mock, and live paper analysis.
              </p>
            </div>
            <Button href="/live-classes">Open Classes</Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classExecutionTiles.map((tile, index) => {
              const Icon = tile.icon;
              return <DashboardThumbnail key={tile.title} href={tile.href} title={tile.title} line={tile.line} icon={<Icon className="h-7 w-7" />} tone={tile.tone} step={index + 1} />;
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                <LibraryBig className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Library</p>
                <h2 className="text-2xl font-semibold text-[#071d36]">Course-wise access</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {courseTracks.map((course) => (
                <Link key={course} href="/courses" className="flex items-center justify-between rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-4 text-sm font-semibold text-[#071d36] transition hover:border-[#b9913f]/45 hover:bg-white">
                  {course}
                  <BookMarked className="h-4 w-4 text-[#b9913f]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded bg-[#edf7ee] text-[#3f6b45]">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f6b45]">Subjects</p>
                <h2 className="text-2xl font-semibold text-[#071d36]">Notes, videos and photos by topic</h2>
              </div>
            </div>
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

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Main Menu</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#071d36]">Daily teacher tools</h2>
        </div>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {simpleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.title} href={module.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="grid h-12 w-12 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[#071d36]">{module.title}</h2>
                <p className="mt-2 min-h-16 text-sm leading-6 text-[#64748b]">{module.line}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-[#071d36]">{module.action}</span>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-[#b9913f]/25 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_58%,#fff7de_100%)] p-6 shadow-[0_24px_80px_rgba(7,29,54,0.10)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">NIDUS AI Professor</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Ask in simple English. Review before publishing.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64748b]">
                  Use this like a teaching assistant. Ask for class plans, questions, timed tests, homework, notes, or weak-student revision ideas.
                </p>
              </div>
              <Button href="/tests">Open Test Studio</Button>
            </div>

            <form onSubmit={handleProfessorSubmit} className="mt-6 rounded-lg border border-[#071d36]/10 bg-white p-4">
              <textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                className="min-h-28 w-full resize-none rounded border border-[#071d36]/12 bg-[#fffdf8] p-4 text-sm font-medium text-[#071d36] outline-none focus:border-[#b9913f]"
                placeholder="Example: Create a 30-question NDA English test with 45 minutes timer."
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {professorPrompts.slice(0, 2).map((prompt) => (
                    <button key={prompt} type="button" onClick={() => setAiPrompt(prompt)} className="rounded-full border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-2 text-xs font-semibold text-[#071d36] transition hover:border-[#b9913f]/45">
                      Use sample
                    </button>
                  ))}
                </div>
                <Button type="submit">Ask NIDUS <Send className="h-4 w-4" /></Button>
              </div>
            </form>

            <div className="mt-5 grid gap-3">
              {(aiHistory.length ? aiHistory : [{ prompt: "Teacher-approved AI workflow", response: "NIDUS AI can prepare a draft. The teacher reviews, edits, approves, sets timing, and publishes to students." }]).map((item) => (
                <div key={item.prompt} className="rounded-lg border border-[#071d36]/10 bg-white p-4">
                  <p className="text-sm font-semibold text-[#071d36]">{item.prompt}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{item.response}</p>
                </div>
              ))}
            </div>
          </div>

          <TeacherSubjectPanel title={isAcademicHead ? "Teachers & Subjects" : "My Subjects"} items={focusAreas} designation={custom.designation || "Faculty"} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <SimpleInfo title="Class Flow" items={["Schedule or start class", "Upload recording", "Add notes or assignment", "Create quick test"]} />
          <SimpleInfo title="Exam Flow" items={["Ask NIDUS for questions", "Review all questions", "Set timer and marks", "Approve and publish"]} />
          <SimpleInfo title="Student Support" items={["Check weak students", "Give revision work", "Send parent update", "Download report"]} />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}

function buildProfessorResponse(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("test") || lower.includes("question") || lower.includes("exam")) {
    return "Draft ready flow: NIDUS will prepare questions, answer options, correct answers, explanations, difficulty level, and suggested timer. Open Test Studio to review, edit, approve, and publish.";
  }
  if (lower.includes("class") || lower.includes("lesson")) {
    return "Class plan flow: NIDUS will arrange introduction, key points, board work, examples, practice questions, homework, and next-class reminder.";
  }
  if (lower.includes("weak") || lower.includes("revision")) {
    return "Support flow: NIDUS will identify weak areas, suggest revision topics, create practice work, and prepare a simple student follow-up note.";
  }
  return "NIDUS will convert your request into a teacher-ready draft. You stay in control: review, edit, approve, and then publish or share.";
}

function TeacherSubjectPanel({ title, items, designation }: { title: string; items: string[]; designation: string }) {
  const visibleItems = items.length ? items : ["NDA", "CDS", "AFCAT", "SSB"];
  return (
    <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">{designation}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {visibleItems.map((item) => (
          <div key={item} className="flex items-center justify-between gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] px-4 py-3">
            <span className="text-sm font-semibold text-[#071d36]">{item}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#64748b]">Active</span>
          </div>
        ))}
      </div>
      <Button href="/staff-hr" className="mt-5 w-full">Manage Allocation</Button>
    </section>
  );
}

function SimpleInfo({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <div className="flex items-center gap-3">
        <MessageSquareText className="h-5 w-5 text-[#b9913f]" />
        <h2 className="text-xl font-semibold text-[#071d36]">{title}</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-[#40516a]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#fff7de] text-xs font-bold text-[#8a6426]">{index + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardThumbnail({
  href,
  title,
  line,
  icon,
  tone,
  step
}: {
  href: string;
  title: string;
  line: string;
  icon: ReactNode;
  tone: string;
  step: number;
}) {
  return (
    <Link href={href} className="group rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-1 hover:border-[#b9913f]/45 hover:bg-white">
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg ${tone} text-[#071d36]`}>
          {icon}
        </div>
        <div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8a6426] shadow-sm">Step {step}</span>
          <h3 className="mt-3 text-lg font-semibold text-[#071d36]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">{line}</p>
        </div>
      </div>
    </Link>
  );
}
