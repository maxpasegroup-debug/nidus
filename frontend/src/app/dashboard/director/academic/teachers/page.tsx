"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { assignTeacherToBatch, getAcademyBatches, getAcademyTeachers } from "@/services/academy";
import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";

function accessPinLabel(metadata?: Record<string, unknown> | null) {
  const pin = typeof metadata?.accessPin === "string" ? metadata.accessPin : "";
  if (/^\d{4}$/.test(pin)) return pin;
  if (metadata?.defaultPin === true || metadata?.defaultPassword === true) return "1234";
  return "Reset from HRM";
}

export default function DirectorTeachersPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"list" | "allocate">("list");
  const [allocation, setAllocation] = useState({ programSlug: "", batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
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
        <div className="grid max-h-[54vh] gap-2 overflow-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => {
            const pinLabel = accessPinLabel(teacher.roleMetadata);
            const canRevealPin = /^\d{4}$/.test(pinLabel);
            const pinVisible = visiblePins[teacher.id] === true;
            return (
              <article key={teacher.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black">{teacher.name}</h3>
                    <p className="mt-1 truncate text-xs text-[var(--muted-blue)]">{teacher.email}</p>
                    <p className="mt-1 text-xs text-[var(--muted-blue)]">{teacher.mobile || "No phone"}</p>
                  </div>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-2.5 py-1 text-[10px] font-black">
                    {String(teacher.roleMetadata?.employmentType ?? "FULL_TIME")}
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  <InfoPill label="Designation" value={String(teacher.roleMetadata?.designation ?? "Teacher")} />
                  <InfoPill label="Dashboard" value={String(teacher.roleMetadata?.dashboardTemplate ?? "Default teacher") || "Default teacher"} />
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">PIN</p>
                      <p className="mt-1 truncate text-sm font-black">{pinVisible || !canRevealPin ? pinLabel : "****"}</p>
                    </div>
                    {canRevealPin ? (
                      <button type="button" onClick={() => setVisiblePins((items) => ({ ...items, [teacher.id]: !items[teacher.id] }))} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white" aria-label={`${pinVisible ? "Hide" : "Show"} PIN for ${teacher.name}`}>
                        {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}
