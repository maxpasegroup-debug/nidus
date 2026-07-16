"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignTeacherToBatch, getAcademyBatches, getAcademyTeachers } from "@/services/academy";
import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";

export default function DirectorTeachersPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"list" | "allocate">("list");
  const [allocation, setAllocation] = useState({ programSlug: "", batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachers = teachersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const programs = Array.from(
    new Map(
      batches.map((batch) => [
        batch.programSlug || batch.course?.slug || batch.courseId || batch.name,
        batch.course?.title || batch.programSlug || batch.name,
      ]),
    ),
  ).filter(([slug]) => Boolean(slug));
  const filteredBatches = allocation.programSlug
    ? batches.filter((batch) => (batch.programSlug || batch.course?.slug || batch.courseId || batch.name) === allocation.programSlug)
    : [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy", "teachers"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
  };

  const assignTeacher = useMutation({
    mutationFn: () =>
      assignTeacherToBatch(allocation.batchId, {
        teacherId: allocation.teacherId,
        subject: allocation.subject.trim(),
        role: allocation.role || undefined,
      }),
    onSuccess: () => {
      setAllocation({ programSlug: "", batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
      refresh();
      setNotice("Teacher allocated to the selected batch and subject.");
      setMode("list");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not allocate teacher."),
  });

  const submitAllocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    assignTeacher.mutate();
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Teacher Allocation"
        title="Teacher Allocation"
        description="Assign existing staff to batches and subjects. Add or edit staff profiles from HRM."
        action={
          <div className="flex flex-wrap gap-2">
            <AcademicActionButton active={mode === "list"} onClick={() => setMode("list")}>Allocation List</AcademicActionButton>
            <AcademicActionButton active={mode === "allocate"} onClick={() => setMode("allocate")}>Allocate Teacher</AcademicActionButton>
          </div>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-bold">{notice}</div> : null}
      <section className="grid shrink-0 gap-3 md:grid-cols-3">
        <StatCard label="Teachers" value={teachers.length} />
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Programs" value={programs.length} />
      </section>
      {mode === "allocate" ? (
        <Panel title="Allocate Teacher" eyebrow="Program batch subject">
          <form onSubmit={submitAllocation} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Select label="Program" value={allocation.programSlug} onChange={(value) => setAllocation((state) => ({ ...state, programSlug: value, batchId: "" }))} required>
              <option value="">Select program</option>
              {programs.map(([slug, title]) => <option key={slug} value={slug}>{title}</option>)}
            </Select>
            <Select label="Batch" value={allocation.batchId} onChange={(value) => setAllocation((state) => ({ ...state, batchId: value }))} required disabled={!allocation.programSlug}>
              <option value="">Select batch</option>
              {filteredBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </Select>
            <Select label="Teacher" value={allocation.teacherId} onChange={(value) => setAllocation((state) => ({ ...state, teacherId: value }))} required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.email}</option>)}
            </Select>
            <Input label="Subject" value={allocation.subject} onChange={(value) => setAllocation((state) => ({ ...state, subject: value }))} placeholder="Mathematics" required />
            <Input label="Role" value={allocation.role} onChange={(value) => setAllocation((state) => ({ ...state, role: value }))} />
            <div className="flex items-end">
              <GoldButton disabled={assignTeacher.isPending}>Assign Teacher</GoldButton>
            </div>
          </form>
        </Panel>
      ) : null}
      <Panel title="Teacher Allocation List" eyebrow="Existing staff">
        {teachersQuery.isLoading ? <EmptyState text="Loading teachers..." /> : null}
        {!teachersQuery.isLoading && !teachers.length ? <EmptyState text="No teachers available yet. Add staff from HRM first." /> : null}
        <div className="max-h-[54vh] overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Teacher</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Contact</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Designation</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Employment</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-3 py-2 font-black">{teacher.name}</td>
                  <td className="px-3 py-2">{teacher.email} / {teacher.mobile || "No phone"}</td>
                  <td className="px-3 py-2">{String(teacher.roleMetadata?.designation ?? "Teacher")}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-black">{String(teacher.roleMetadata?.employmentType ?? "FULL_TIME")}</span>
                  </td>
                  <td className="px-3 py-2">{String(teacher.roleMetadata?.dashboardTemplate ?? "Default teacher") || "Default teacher"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AcademicShell>
  );
}
