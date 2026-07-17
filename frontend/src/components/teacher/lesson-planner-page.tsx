"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Lightbulb, Plus, RefreshCw } from "lucide-react";
import { AiOperatingLayer, aiRoleActions } from "@/components/ai/ai-operating-layer";
import { LearningEngineBanner, LearningProgressPanel, LearningRoleActions } from "@/components/learning/learning-engine-workspace";
import { apiClient, apiGet, getApiErrorMessage } from "@/services/api";

type PlannerBatch = {
  id: string;
  name?: string | null;
  batchName?: string | null;
  programSlug?: string | null;
  subject?: string | null;
  assignedSubjects?: string[];
  course?: { title?: string | null; name?: string | null; slug?: string | null } | null;
};

type PlannerCalendarItem = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  classType?: string | null;
  plannedDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  completionStatus?: string | null;
  teacherLog?: string | null;
};

type PlannerData = {
  batches: PlannerBatch[];
  calendar: PlannerCalendarItem[];
};

const EMPTY_DATA: PlannerData = { batches: [], calendar: [] };

function recordsFrom<T>(value: unknown, key: string): T[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  if (record.data && typeof record.data === "object" && Array.isArray((record.data as Record<string, unknown>)[key])) {
    return (record.data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function batchName(batch?: PlannerBatch | null) {
  return batch?.name || batch?.batchName || batch?.course?.title || batch?.course?.name || "Assigned batch";
}

function uniqueSubjects(batch?: PlannerBatch | null) {
  const subjects = new Set<string>();
  batch?.assignedSubjects?.forEach((subject) => subject && subjects.add(subject));
  if (batch?.subject) subjects.add(batch.subject);
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
}

function formatDate(value?: string | null) {
  if (!value) return "Date pending";
  return new Date(value).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export function LessonPlannerPage({ role, backHref }: { role: "TEACHER" | "ACADEMIC_HEAD"; backHref: string }) {
  const [data, setData] = useState<PlannerData>(EMPTY_DATA);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [plannedDate, setPlannedDate] = useState(todayDate());
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("10:30");
  const [classType, setClassType] = useState("LECTURE");
  const [objectives, setObjectives] = useState("");
  const [homework, setHomework] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlanner = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await apiGet<unknown>("/academy/my-teaching-plan");
      const nextData = {
        batches: recordsFrom<PlannerBatch>(plan, "batches"),
        calendar: recordsFrom<PlannerCalendarItem>(plan, "calendar"),
      };
      setData(nextData);
      setSelectedBatchId((current) => current || nextData.batches[0]?.id || "");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlanner();
  }, [loadPlanner]);

  const selectedBatch = useMemo(() => data.batches.find((batch) => batch.id === selectedBatchId) ?? data.batches[0] ?? null, [data.batches, selectedBatchId]);
  const subjects = useMemo(() => uniqueSubjects(selectedBatch), [selectedBatch]);

  useEffect(() => {
    setSubject((current) => (current && subjects.includes(current) ? current : subjects[0] || ""));
  }, [subjects]);

  const upcomingPlans = useMemo(() => {
    const selected = selectedBatch?.id;
    return data.calendar
      .filter((item) => !selected || item.batchId === selected)
      .filter((item) => String(item.completionStatus || "PENDING").toUpperCase() !== "COMPLETED")
      .sort((a, b) => Date.parse(`${a.plannedDate?.slice(0, 10) || "9999-12-31"}T${a.startTime || "00:00"}`) - Date.parse(`${b.plannedDate?.slice(0, 10) || "9999-12-31"}T${b.startTime || "00:00"}`))
      .slice(0, 8);
  }, [data.calendar, selectedBatch?.id]);

  async function savePlan() {
    if (!selectedBatch?.id || !subject || !topic.trim()) {
      setError("Select batch, subject and topic before saving the lesson plan.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient.post("/academy/academic-calendar", {
        batchId: selectedBatch.id,
        batchName: batchName(selectedBatch),
        programSlug: selectedBatch.programSlug || selectedBatch.course?.slug || null,
        subject,
        topic: topic.trim(),
        classType,
        plannedDate,
        startTime,
        endTime,
        completionStatus: "PENDING",
        status: "PLANNED",
        teacherLog: [objectives.trim() ? `Objectives: ${objectives.trim()}` : "", homework.trim() ? `Homework: ${homework.trim()}` : ""].filter(Boolean).join("\n") || null,
        nextAction: "Conduct class and update completion log",
      });
      setMessage("Lesson planned and added to the academic calendar.");
      setTopic("");
      setObjectives("");
      setHomework("");
      await loadPlanner();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function generateTeacherPlan() {
    const cleanTopic = topic.trim() || "today's topic";
    const cleanSubject = subject || "the subject";
    setObjectives((current) => current || [
      `Students should understand the core idea of ${cleanTopic}.`,
      `Students should solve at least 3 ${cleanSubject} questions from easy to exam level.`,
      "Teacher should identify students who need extra revision support.",
    ].join("\n"));
    setHomework((current) => current || [
      `Practice 10 questions from ${cleanTopic}.`,
      "Revise class notes before the next session.",
      "Bring doubts in the first 5 minutes of the next class.",
    ].join("\n"));
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-7xl flex-col gap-4 px-4 py-4">
      <header className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> Back to workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{role === "ACADEMIC_HEAD" ? "Teacher + HOD" : "Teacher"} Lesson Planner</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">Plan tomorrow&apos;s class in minutes.</h1>
            <p className="mt-3 max-w-3xl text-sm text-[var(--muted-blue)]">Create a clean teaching plan, save it to the academic calendar, and use it later for attendance, library upload, exam or assignment follow-up.</p>
          </div>
          <button type="button" onClick={() => void loadPlanner()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}

      <LearningEngineBanner
        role={role}
        title={role === "ACADEMIC_HEAD" ? "Academic Head Learning Engine" : "Teacher Learning Engine"}
        description="Lesson planning stays connected to batches, subjects, calendar slots, materials, assignments, quizzes and completion logs."
        metrics={[
          { label: "Course Coverage", value: data.batches.length, tone: "info" },
          { label: "Lesson Completion", value: upcomingPlans.length, tone: upcomingPlans.length ? "warning" : "success" },
          { label: "Pending Lessons", value: upcomingPlans.length, tone: upcomingPlans.length ? "warning" : "success" },
          { label: "Content Review", value: role === "ACADEMIC_HEAD" ? "Open" : "Upload", tone: "info" },
        ]}
      />
      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <LearningRoleActions role={role} />
        <LearningProgressPanel lessonCount={upcomingPlans.length} />
      </section>
      <AiOperatingLayer
        role={role === "ACADEMIC_HEAD" ? "ACADEMIC_HEAD" : "TEACHER"}
        compact
        items={role === "ACADEMIC_HEAD" ? [
          { title: `${upcomingPlans.length} pending lesson(s)`, detail: "Academic risk alerts stay inside planner review.", href: "/dashboard/academic-head/hod/approvals", icon: CheckCircle2, tone: upcomingPlans.length ? "warning" : "success" },
          { title: `${data.batches.length} assigned batch(es)`, detail: "Faculty workload signal uses existing teaching-plan data.", href: "/dashboard/academic-head/hod/teacher-monitoring", icon: CalendarDays, tone: "info" },
          { title: "Planner completion insight", detail: "Review weak batches and pending lessons without a separate AI page.", href: "/dashboard/academic-head/hod/syllabus", icon: Lightbulb, tone: "success" },
        ] : aiRoleActions("TEACHER")}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <form className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); void savePlan(); }}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><CalendarDays size={20} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Class Plan</p>
              <h2 className="text-2xl font-black">Teaching details</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">Batch
              <select value={selectedBatch?.id || ""} onChange={(event) => setSelectedBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batchName(batch)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">Subject
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black md:col-span-2">Topic
              <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Example: Algebra basics, reported speech, motion basics" className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-black">Date
              <input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-black">Class Type
              <select value={classType} onChange={(event) => setClassType(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS"].map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">Start
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-black">End
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-black">Teaching Objectives
              <textarea value={objectives} onChange={(event) => setObjectives(event.target.value)} rows={5} placeholder="What should students understand by the end of this class?" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-black">Homework / Follow-up
              <textarea value={homework} onChange={(event) => setHomework(event.target.value)} rows={5} placeholder="Practice questions, reading, revision or test plan." className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={saving || loading || !data.batches.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
              <Plus size={18} /> {saving ? "Saving..." : "Save to Calendar"}
            </button>
            <button type="button" onClick={generateTeacherPlan} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-5 text-sm font-black">
              <Lightbulb size={17} /> Draft Plan
            </button>
            <Link href={role === "ACADEMIC_HEAD" ? "/dashboard/academic-head/academic-calendar" : "/dashboard/teacher/academic-calendar"} className="inline-flex min-h-12 items-center rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-black">Open Calendar</Link>
          </div>
        </form>

        <aside className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Upcoming</p>
              <h2 className="text-2xl font-black">Planned lessons</h2>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{upcomingPlans.length}</span>
          </div>
          <div className="mt-5 grid gap-3">
            {upcomingPlans.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{item.subject || "Subject"}</p>
                    <h3 className="mt-1 text-lg font-black">{item.topic || "Topic pending"}</h3>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-700" />
                </div>
                <p className="mt-3 text-sm text-[var(--muted-blue)]">{item.batchName || batchName(selectedBatch)}</p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">
                  <Clock size={13} /> {formatDate(item.plannedDate)} / {item.startTime || "--"}-{item.endTime || "--"}
                </p>
              </article>
            ))}
            {!upcomingPlans.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-[var(--muted-blue)]" />
                <h3 className="mt-3 text-lg font-black">{loading ? "Loading plans..." : "No upcoming plan for this batch"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">Create the next lesson from the form.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
