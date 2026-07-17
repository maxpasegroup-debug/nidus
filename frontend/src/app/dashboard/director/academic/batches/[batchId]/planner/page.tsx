"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { createAcademicCalendarItem, generateAcademicCalendarPlan, getAcademyBatches, updateAcademyBatch } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicHero, AcademicShell, EmptyState, Input, Panel, Select, StatCard, TextArea } from "../../../_components";
import { courseForProgram, formatDate, inferProgram, inferProgramType, orderedCourses, programTemplateToCourse, finalProgramSlugs, scheduleList } from "../../batch-utils";
import { allAcademyPrograms } from "@/data/academy-programs";
import {
  livePlannerMetrics,
  livePlannerStatuses,
  mergeTemplateIntoLivePlanner,
  parseBatchAcademicPlanner,
  parseCourseDescription,
  plannerTotals,
  type BatchAcademicPlanner,
  type GeneratedPlannerSession,
  type LivePlannerStatus,
} from "../../../academic-planner-utils";

type PlannerSession = {
  dayOfWeek: string;
  subject: string;
  topic: string;
  classType: string;
  startTime: string;
  endTime: string;
  teacherId?: string;
};

const dayOptions = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

export default function BatchPlannerPage({ params }: { params: { batchId: string } }) {
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState(false);
  const [notice, setNotice] = useState("");
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const coursesQuery = useCourses();
  const batch = useMemo(() => (batchesQuery.data ?? []).find((item) => item.id === params.batchId), [batchesQuery.data, params.batchId]);
  const subjects = batch ? scheduleList(batch, "subjects") : [];
  const courses = useMemo(() => {
    const databaseCourses = coursesQuery.data ?? [];
    const existingSlugs = new Set(databaseCourses.map((course) => course.slug));
    const missingFinalPrograms = allAcademyPrograms
      .filter((program) => finalProgramSlugs.includes(program.slug) && !existingSlugs.has(program.slug))
      .map(programTemplateToCourse);
    return orderedCourses([...databaseCourses, ...missingFinalPrograms]);
  }, [coursesQuery.data]);
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [sessionForm, setSessionForm] = useState<PlannerSession>({
    dayOfWeek: "1",
    subject: "",
    topic: "",
    classType: "LECTURE",
    startTime: "09:00",
    endTime: "10:15",
  });
  const [sessions, setSessions] = useState<PlannerSession[]>([]);
  const [syncMode, setSyncMode] = useState<"ADD_NEW_ONLY" | "REPLACE_PENDING">("ADD_NEW_ONLY");
  const [extraSession, setExtraSession] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    subject: "",
    moduleTitle: "Extra Academic Support",
    topic: "",
    type: "EXTRA_CLASS" as LivePlannerStatus,
  });

  const publishPlan = useMutation({
    mutationFn: () => {
      if (!batch) throw new Error("Batch not found");
      const startDate = range.startDate || batch.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const endDate = range.endDate || batch.endDate?.slice(0, 10) || startDate;
      return generateAcademicCalendarPlan({
        batchId: batch.id,
        startDate,
        endDate,
        academicYear: new Date(startDate).getFullYear().toString(),
        sessions: sessions.map((session) => ({
          dayOfWeek: Number(session.dayOfWeek),
          subject: session.subject,
          topic: session.topic || "Planned class",
          classType: session.classType,
          startTime: session.startTime,
          endTime: session.endTime,
          teacherId: session.teacherId,
        })),
      });
    },
    onSuccess: (result) => setNotice(`Published: ${result.createdCount} slot(s), ${result.conflictCount} conflict(s), ${result.skippedCount} skipped.`),
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not publish planner."),
  });

  const saveLivePlanner = useMutation({
    mutationFn: (planner: BatchAcademicPlanner) => updateAcademyBatch(params.batchId, { academicPlanner: planner }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
      setNotice("Live academic planner saved.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save live planner."),
  });

  const publishExactSessions = useMutation({
    mutationFn: async (items: GeneratedPlannerSession[]) => {
      if (!batch) throw new Error("Batch not found");
      await Promise.all(items.map((session) => createAcademicCalendarItem({
        batchId: batch.id,
        batchName: batch.name,
        programSlug: batch.programSlug,
        subject: session.subject,
        topic: session.topic,
        classType: session.type,
        plannedDate: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status === "COMPLETED" ? "COMPLETED" : "PLANNED",
        completionStatus: session.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        teacherName: session.teacherName,
        teacherLog: session.completionNote,
      })));
      return items.length;
    },
    onSuccess: (count) => setNotice(`${count} live planner session(s) published to academic calendar.`),
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not publish live planner sessions."),
  });

  if (batchesQuery.isLoading) {
    return <AcademicShell><EmptyState text="Loading planner." /></AcademicShell>;
  }
  if (!batch) {
    return <AcademicShell><EmptyState text="Batch not found." /></AcademicShell>;
  }

  const livePlanner = parseBatchAcademicPlanner(batch.schedule?.academicPlanner);
  const generatedSessions = livePlanner?.sessions ?? [];
  const liveMetrics = livePlannerMetrics(generatedSessions);
  const selectedCourse = courseForProgram(courses, batch.programSlug, inferProgramType(batch));
  const selectedPlanner = selectedCourse ? parseCourseDescription(selectedCourse).academicPlanner : undefined;
  const selectedPlannerTotals = plannerTotals(selectedPlanner);
  const classDays = livePlanner?.classDays?.length ? livePlanner.classDays : [1, 2, 3, 4, 5, 6];
  const classStartTime = livePlanner?.classStartTime || "09:00";
  const sessionMinutes = livePlanner?.sessionMinutes || 60;
  const holidays = livePlanner?.holidays ?? [];

  const addSession = () => {
    const subject = sessionForm.subject || subjects[0] || "General";
    setSessions((items) => [...items, { ...sessionForm, subject, topic: sessionForm.topic || "Planned class" }]);
    setSessionForm((state) => ({ ...state, topic: "" }));
  };

  const importGeneratedPlan = () => {
    setSessions(generatedSessions.slice(0, 80).map((session) => ({
      dayOfWeek: String(new Date(`${session.date}T00:00:00`).getDay()),
      subject: session.subject,
      topic: session.topic,
      classType: session.type === "ASSESSMENT" ? "EXAMINATION" : session.type,
      startTime: session.startTime,
      endTime: session.endTime,
    })));
    setRange((state) => ({
      startDate: state.startDate || generatedSessions[0]?.date || "",
      endDate: state.endDate || generatedSessions[generatedSessions.length - 1]?.date || "",
    }));
    setNotice(`Imported ${Math.min(generatedSessions.length, 80)} generated session(s) into the publish draft.`);
  };

  const updateLiveSession = (sequence: number, patch: Partial<GeneratedPlannerSession>) => {
    if (!livePlanner) return;
    const next = {
      ...livePlanner,
      sessions: livePlanner.sessions.map((session) => (session.sequence === sequence ? { ...session, ...patch } : session)),
    };
    saveLivePlanner.mutate(next);
  };

  const deleteLiveSession = (sequence: number) => {
    if (!livePlanner) return;
    const next = {
      ...livePlanner,
      sessions: livePlanner.sessions.filter((session) => session.sequence !== sequence).map((session, index) => ({ ...session, sequence: index + 1 })),
    };
    saveLivePlanner.mutate(next);
  };

  const addExtraSession = () => {
    if (!livePlanner) return;
    const nextSession: GeneratedPlannerSession = {
      sequence: livePlanner.sessions.length + 1,
      date: extraSession.date || new Date().toISOString().slice(0, 10),
      day: new Date(`${extraSession.date || new Date().toISOString().slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }),
      startTime: extraSession.startTime,
      endTime: extraSession.endTime,
      subject: extraSession.subject || subjects[0] || "General",
      moduleTitle: extraSession.moduleTitle,
      topic: extraSession.topic || "Extra academic support",
      type: extraSession.type === "REVISION" ? "REVISION" : "CLASS",
      status: extraSession.type,
    };
    saveLivePlanner.mutate({ ...livePlanner, sessions: [...livePlanner.sessions, nextSession] });
    setExtraSession((state) => ({ ...state, topic: "" }));
  };

  const syncLatestPlanner = () => {
    const merged = mergeTemplateIntoLivePlanner({
      current: livePlanner,
      template: selectedPlanner,
      startDate: batch.startDate?.slice(0, 10),
      classDays,
      startTime: classStartTime,
      sessionMinutes,
      holidays,
      mode: syncMode,
    });
    const next: BatchAcademicPlanner = {
      source: "PROGRAM_TEMPLATE",
      templateVersion: selectedPlanner?.version ?? 0,
      templateStatus: selectedPlanner?.status ?? "DRAFT",
      generatedAt: livePlanner?.generatedAt ?? new Date().toISOString(),
      syncedAt: new Date().toISOString(),
      syncMode,
      classDays,
      classStartTime,
      sessionMinutes,
      holidays,
      totals: selectedPlannerTotals,
      sessions: merged.sessions,
    };
    saveLivePlanner.mutate(next);
    setNotice(`Synced latest program planner. ${merged.additions.length} new session(s) detected.`);
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Academic Planner"
        title={batch.name}
        description={`${inferProgram(batch)} planner from ${formatDate(batch.startDate)} to ${formatDate(batch.endDate)}.`}
        action={
          <Link href={`/dashboard/director/academic/batches/${batch.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
            <ArrowLeft className="h-4 w-4" />
            Batch
          </Link>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      <section className="grid gap-3 md:grid-cols-5">
        <StatCard label="Draft Sessions" value={sessions.length} />
        <StatCard label="Live Sessions" value={liveMetrics.total} />
        <StatCard label="Completion" value={`${liveMetrics.completionPercentage}%`} />
        <StatCard label="Delayed" value={liveMetrics.delayed} />
        <StatCard label="Pending" value={liveMetrics.pending} />
      </section>

      {generatedSessions.length ? (
        <Panel title="Live Batch Planner" eyebrow="Execution tracking">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[var(--muted-blue)]">
              Track actual completion, delays, reschedules, cancellations, revision and extra classes from the generated program plan.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => publishExactSessions.mutate(generatedSessions.filter((session) => session.status !== "CANCELLED"))} disabled={publishExactSessions.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                <CalendarDays className="h-4 w-4" />
                Publish Live Plan
              </button>
              <button type="button" onClick={importGeneratedPlan} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
                <CalendarDays className="h-4 w-4" />
                Import To Recurring Draft
              </button>
            </div>
          </div>

          <div className="mt-4 max-h-[44vh] overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
                <tr className="border-b border-[var(--border)]">
                  {["#", "Date", "Time", "Subject", "Module", "Topic", "Status", "Note", "Actions"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generatedSessions.map((session) => (
                  <tr key={`${session.sequence}-${session.topic}`} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-3 py-2 font-black">{session.sequence}</td>
                    <td className="px-3 py-2">
                      <input className="w-36 rounded-lg border border-[var(--border)] px-2 py-1" type="date" value={session.date} onChange={(event) => updateLiveSession(session.sequence, { date: event.target.value, status: "RESCHEDULED" })} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <input className="w-24 rounded-lg border border-[var(--border)] px-2 py-1" type="time" value={session.startTime} onChange={(event) => updateLiveSession(session.sequence, { startTime: event.target.value, status: "RESCHEDULED" })} />
                        <input className="w-24 rounded-lg border border-[var(--border)] px-2 py-1" type="time" value={session.endTime} onChange={(event) => updateLiveSession(session.sequence, { endTime: event.target.value, status: "RESCHEDULED" })} />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-black">{session.subject}</td>
                    <td className="px-3 py-2">{session.moduleTitle}</td>
                    <td className="px-3 py-2">{session.topic}</td>
                    <td className="px-3 py-2">
                      <select className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-black" value={session.status} onChange={(event) => updateLiveSession(session.sequence, { status: event.target.value as LivePlannerStatus })}>
                        {livePlannerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-56 rounded-lg border border-[var(--border)] px-2 py-1" value={session.completionNote ?? ""} onChange={(event) => updateLiveSession(session.sequence, { completionNote: event.target.value })} placeholder="Delay reason / completion note" />
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => deleteLiveSession(session.sequence)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-black text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-2">
        <Panel title="Add Extra / Revision Class" eyebrow="Live operations">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Date" type="date" value={extraSession.date} onChange={(value) => setExtraSession((state) => ({ ...state, date: value }))} />
            <Select label="Session type" value={extraSession.type} onChange={(value) => setExtraSession((state) => ({ ...state, type: value as LivePlannerStatus }))}>
              <option value="EXTRA_CLASS">Extra Class</option>
              <option value="REVISION">Revision</option>
            </Select>
            <Input label="Start" type="time" value={extraSession.startTime} onChange={(value) => setExtraSession((state) => ({ ...state, startTime: value }))} />
            <Input label="End" type="time" value={extraSession.endTime} onChange={(value) => setExtraSession((state) => ({ ...state, endTime: value }))} />
            <Input label="Subject" value={extraSession.subject} onChange={(value) => setExtraSession((state) => ({ ...state, subject: value }))} placeholder={subjects[0] || "General"} />
            <Input label="Module" value={extraSession.moduleTitle} onChange={(value) => setExtraSession((state) => ({ ...state, moduleTitle: value }))} />
            <div className="md:col-span-2">
              <TextArea label="Topic / purpose" value={extraSession.topic} onChange={(value) => setExtraSession((state) => ({ ...state, topic: value }))} placeholder="Revision, backlog, remedial support, mock discussion." />
            </div>
            <button type="button" onClick={addExtraSession} disabled={!livePlanner || saveLivePlanner.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">
              <Plus className="h-4 w-4" />
              Add To Live Planner
            </button>
          </div>
        </Panel>

        <Panel title="Sync Latest Program Planner" eyebrow="Version control">
          <div className="grid gap-3">
            <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm font-bold text-[var(--muted-blue)]">
              <p>Current batch template version: {livePlanner?.templateVersion ?? "None"}</p>
              <p>Latest program template: {selectedPlanner ? `v${selectedPlanner.version} / ${selectedPlanner.status}` : "No planner found"}</p>
              <p>Latest template size: {selectedPlannerTotals.modules} modules, {selectedPlannerTotals.sessions} sessions</p>
            </div>
            <Select label="Sync mode" value={syncMode} onChange={(value) => setSyncMode(value as typeof syncMode)}>
              <option value="ADD_NEW_ONLY">Add only new topics</option>
              <option value="REPLACE_PENDING">Replace pending sessions, keep completed/cancelled</option>
            </Select>
            <button type="button" onClick={syncLatestPlanner} disabled={!selectedPlanner || saveLivePlanner.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black disabled:opacity-60">
              <RefreshCw className="h-4 w-4" />
              Sync Latest Planner
            </button>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[420px_1fr]">
        <Panel title="Fill Planner" eyebrow="Draft">
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-black">
              Start Date
              <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" type="date" value={range.startDate} onChange={(event) => setRange((state) => ({ ...state, startDate: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-black">
              End Date
              <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" type="date" value={range.endDate} onChange={(event) => setRange((state) => ({ ...state, endDate: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-black">
              Day
              <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" value={sessionForm.dayOfWeek} onChange={(event) => setSessionForm((state) => ({ ...state, dayOfWeek: event.target.value }))}>
                {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">
              Subject
              <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" value={sessionForm.subject} onChange={(event) => setSessionForm((state) => ({ ...state, subject: event.target.value }))}>
                <option value="">Select subject</option>
                {(subjects.length ? subjects : ["General"]).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">
              Topic
              <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" value={sessionForm.topic} onChange={(event) => setSessionForm((state) => ({ ...state, topic: event.target.value }))} placeholder="Chapter / topic" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-2 text-sm font-black">
                Start
                <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" type="time" value={sessionForm.startTime} onChange={(event) => setSessionForm((state) => ({ ...state, startTime: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-black">
                End
                <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" type="time" value={sessionForm.endTime} onChange={(event) => setSessionForm((state) => ({ ...state, endTime: event.target.value }))} />
              </label>
            </div>
            <button type="button" onClick={addSession} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Add Session
            </button>
          </div>
        </Panel>

        <Panel title={reviewMode ? "Review & Publish" : "Draft Sessions"} eyebrow={reviewMode ? "Check before publish" : "Calendar plan"}>
          {!sessions.length ? <EmptyState text="Add class sessions to build the academic planner." /> : null}
          <div className="grid gap-2 md:grid-cols-2">
            {sessions.map((session, index) => (
              <article key={`${session.dayOfWeek}-${session.subject}-${index}`} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--gold)]">{dayOptions.find((day) => day.value === session.dayOfWeek)?.label}</p>
                <h3 className="mt-1 text-sm font-black">{session.subject}</h3>
                <p className="mt-1 text-xs text-[var(--muted-blue)]">{session.topic}</p>
                <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs font-black">{session.startTime} to {session.endTime}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setReviewMode(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
              Review Draft
            </button>
            <button type="button" disabled={!reviewMode || !sessions.length || publishPlan.isPending} onClick={() => publishPlan.mutate()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-black text-white disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" />
              Publish Planner
            </button>
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}
