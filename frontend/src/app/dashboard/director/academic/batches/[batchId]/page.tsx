"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CalendarDays, GraduationCap, UserCheck, Users } from "lucide-react";
import { addStudentToBatch, assignTeacherToBatch, getAcademyBatches, getAcademyTeachers, getStudentProgressSummary, updateAcademyBatch } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../../_components";
import {
  academicHeadNames,
  formatDate,
  formatMetric,
  inferLearningMode,
  inferProgram,
  inferProgramType,
  scheduleList,
  scheduleNumber,
  scheduleText,
} from "../batch-utils";

export default function DirectorBatchDetailPage({ params }: { params: { batchId: string } }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [studentForm, setStudentForm] = useState({ email: "", phone: "", name: "", notes: "" });
  const [teacherForm, setTeacherForm] = useState({ teacherId: "", subject: "", role: "Subject Teacher" });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: getAcademyTeachers });
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const batch = useMemo(() => (batchesQuery.data ?? []).find((item) => item.id === params.batchId), [batchesQuery.data, params.batchId]);
  const progress = progressQuery.data?.batches.find((item) => item.batchId === params.batchId);
  const subjects = batch ? scheduleList(batch, "subjects") : [];
  const teachers = teachersQuery.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });

  const addStudent = useMutation({
    mutationFn: () => addStudentToBatch(params.batchId, studentForm),
    onSuccess: () => {
      setStudentForm({ email: "", phone: "", name: "", notes: "" });
      void refresh();
      setNotice("Student added to this batch.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not add student."),
  });
  const assignTeacher = useMutation({
    mutationFn: () => assignTeacherToBatch(params.batchId, teacherForm),
    onSuccess: () => {
      setTeacherForm({ teacherId: "", subject: "", role: "Subject Teacher" });
      void refresh();
      setNotice("Teacher allocated to this batch.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not allocate teacher."),
  });
  const updateStatus = useMutation({
    mutationFn: (status: string) => updateAcademyBatch(params.batchId, { status }),
    onSuccess: () => {
      void refresh();
      setNotice("Batch status updated.");
    },
  });

  if (batchesQuery.isLoading) {
    return <AcademicShell><EmptyState text="Loading batch details." /></AcademicShell>;
  }
  if (!batch) {
    return <AcademicShell><EmptyState text="Batch not found." /></AcademicShell>;
  }

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Batch"
        title={batch.name}
        description={`${inferProgram(batch)} / ${inferProgramType(batch)} / ${inferLearningMode(batch)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/director/academic/batches" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
              <ArrowLeft className="h-4 w-4" />
              Batches
            </Link>
            <Link href={`/dashboard/director/academic/batches/${batch.id}/planner`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-black text-[var(--navy)] shadow-sm">
              <CalendarDays className="h-4 w-4" />
              Academic Planner
            </Link>
          </div>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}

      <section className="grid gap-3 md:grid-cols-5">
        <StatCard label="Students" value={batch._count?.students ?? batch.students?.length ?? 0} />
        <StatCard label="Teachers" value={batch._count?.teachers ?? batch.teachers?.length ?? 0} />
        <StatCard label="Health" value={formatMetric(progress?.batchHealthScore)} />
        <StatCard label="Attendance" value={formatMetric(progress?.attendancePercentage)} />
        <StatCard label="Status" value={batch.status} />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Panel title="Batch Setup" eyebrow="Modify">
          <div className="grid gap-3">
            <DetailCard label="Program" value={`${inferProgram(batch)} / ${inferProgramType(batch)}`} />
            <DetailCard label="Dates" value={`${formatDate(batch.startDate)} to ${formatDate(batch.endDate)}`} />
            <DetailCard label="Course Days" value={`${scheduleNumber(batch, "completedDays")} completed / ${scheduleNumber(batch, "durationDays") || "Not set"} total`} />
            <DetailCard label="Academic Head" value={academicHeadNames(batch)} />
            <label className="grid gap-2 text-sm font-black">
              Status
              <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2" value={batch.status} onChange={(event) => updateStatus.mutate(event.target.value)}>
                {["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="Subjects" eyebrow="Allocated">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {(subjects.length ? subjects : ["No subjects planned"]).map((subject) => (
              <DetailCard key={subject} label="Subject" value={subject} />
            ))}
          </div>
        </Panel>

        <Panel title="Progress" eyebrow="Live signals">
          <div className="grid gap-2">
            <DetailCard label="Batch Health" value={formatMetric(progress?.batchHealthScore)} />
            <DetailCard label="Assignment Completion" value={formatMetric(progress?.assignmentCompletionPercentage)} />
            <DetailCard label="Exam Average" value={formatMetric(progress?.examAveragePercentage)} />
            <DetailCard label="Risk Students" value={String(progress?.riskStudentCount ?? 0)} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Panel title="Students" eyebrow="Grid">
          <form
            className="mb-3 grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              addStudent.mutate();
            }}
          >
            <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={studentForm.email} onChange={(event) => setStudentForm((state) => ({ ...state, email: event.target.value }))} placeholder="Student email" />
            <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={studentForm.phone} onChange={(event) => setStudentForm((state) => ({ ...state, phone: event.target.value }))} placeholder="Phone" />
            <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={studentForm.name} onChange={(event) => setStudentForm((state) => ({ ...state, name: event.target.value }))} placeholder="Name" />
            <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={studentForm.notes} onChange={(event) => setStudentForm((state) => ({ ...state, notes: event.target.value }))} placeholder="Notes / roll number" />
            <button className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-black text-[var(--navy)] shadow-sm disabled:opacity-60" disabled={addStudent.isPending} type="submit">Add Student</button>
          </form>
          <div className="grid gap-2 sm:grid-cols-2">
            {(batch.students ?? []).map((entry) => (
              <PersonCard key={entry.id} icon={Users} title={entry.student.name} text={`${entry.student.mobile || "No phone"} / ${entry.status}`} />
            ))}
            {!(batch.students ?? []).length ? <EmptyState text="No students assigned yet." /> : null}
          </div>
        </Panel>

        <Panel title="Teachers" eyebrow="Grid">
          <form
            className="mb-3 grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              assignTeacher.mutate();
            }}
          >
            <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={teacherForm.teacherId} onChange={(event) => setTeacherForm((state) => ({ ...state, teacherId: event.target.value }))} required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>)}
            </select>
            <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={teacherForm.subject} onChange={(event) => setTeacherForm((state) => ({ ...state, subject: event.target.value }))} required>
              <option value="">Select subject</option>
              {(subjects.length ? subjects : ["General"]).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" value={teacherForm.role} onChange={(event) => setTeacherForm((state) => ({ ...state, role: event.target.value }))}>
              <option value="Subject Teacher">Subject Teacher</option>
              <option value="Physical Trainer">Physical Trainer</option>
              <option value="ACADEMIC_HEAD">Academic Head</option>
            </select>
            <button className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-black text-[var(--navy)] shadow-sm disabled:opacity-60" disabled={assignTeacher.isPending || teachersQuery.isLoading} type="submit">Allocate Teacher</button>
          </form>
          <div className="grid gap-2 sm:grid-cols-2">
            {(batch.teachers ?? []).map((entry) => (
              <PersonCard key={entry.id} icon={UserCheck} title={entry.teacher.name || entry.teacher.email} text={`${entry.subject || "Subject pending"} / ${entry.role}`} />
            ))}
            {!(batch.teachers ?? []).length ? <EmptyState text="No teachers assigned yet." /> : null}
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function PersonCard({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <h3 className="mt-2 text-sm font-black">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{text}</p>
    </article>
  );
}
