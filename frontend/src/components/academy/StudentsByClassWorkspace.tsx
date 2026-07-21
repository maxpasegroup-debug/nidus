"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Eye, EyeOff, FileBarChart2, GraduationCap, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { getAcademyBatches, getStudentProgressSummary, type AcademyBatch } from "@/services/academy";
import { AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "@/app/dashboard/director/academic/_components";

type Props = {
  audience: "director" | "academic-head";
};

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

type BatchStudent = NonNullable<AcademyBatch["students"]>[number]["student"];

function loginMobile(student: BatchStudent) {
  return metadataString(student.roleMetadata, "loginMobile") || student.mobile || "No mobile";
}

function accessPinLabel(metadata?: Record<string, unknown> | null) {
  const pin = metadataString(metadata, "accessPin");
  if (/^\d{4}$/.test(pin)) return pin;
  if (metadata?.defaultPin === true || metadata?.defaultPassword === true) return "1234";
  return "Reset required";
}

function metric(value: number | null | undefined, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "No data";
}

export default function StudentsByClassWorkspace({ audience }: Props) {
  const [activeBatchId, setActiveBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const batchesQuery = useQuery({ queryKey: ["academy", "batches", "students-workspace"], queryFn: () => getAcademyBatches() });
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const batches = batchesQuery.data ?? [];
  const progressByBatch = useMemo(
    () => new Map((progressQuery.data?.batches ?? []).map((batch) => [batch.batchId, batch])),
    [progressQuery.data?.batches],
  );
  const selectedBatch = batches.find((batch) => batch.id === activeBatchId) ?? batches[0] ?? null;
  const selectedHealth = selectedBatch ? progressByBatch.get(selectedBatch.id) : null;
  const normalizedSearch = search.trim().toLowerCase();
  const selectedStudents = (selectedBatch?.students ?? []).filter((entry) => {
    if (!normalizedSearch) return true;
    const student = entry.student;
    return [student?.name, student?.email, student?.mobile, loginMobile(student), student?.rollNumber, entry.remarks]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const totalStudents = batches.reduce((sum, batch) => sum + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const progressUrl = audience === "director" ? "/dashboard/director/academic/student-progress" : "/dashboard/academic-head/hod/student-monitoring";

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Students"
        title="Students by Class"
        description="Open a class first, then check enrolled students, login mobile numbers, PIN status and progress report access from one place."
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Classes" value={batches.length} />
        <StatCard label="Students" value={totalStudents} />
        <StatCard label="Need Attention" value={(progressQuery.data?.batches ?? []).filter((batch) => batch.overallStatus !== "Healthy" && batch.overallStatus !== "No Data").length} />
        <StatCard label="Risk Students" value={(progressQuery.data?.batches ?? []).reduce((sum, batch) => sum + batch.riskStudentCount, 0)} />
      </section>

      <Panel title="Classes" eyebrow="Select a class">
        {batchesQuery.isLoading ? <EmptyState text="Loading classes..." /> : null}
        {!batchesQuery.isLoading && !batches.length ? <EmptyState text="No active classes are available yet. Students will appear here after they are enrolled in a batch." /> : null}
        <div className="grid max-h-[38vh] gap-3 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const health = progressByBatch.get(batch.id);
            const selected = selectedBatch?.id === batch.id;
            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => setActiveBatchId(batch.id)}
                className={`rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:border-[var(--gold-border)] ${selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">{batch.programSlug || batch.course?.slug || "Program"}</p>
                    <h3 className="mt-1 truncate text-lg font-black">{batch.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted-blue)]">{batch.course?.title || batch.batchType}</p>
                  </div>
                  <AcademicPill>{health?.overallStatus ?? batch.status}</AcademicPill>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <ClassMetric icon={Users} label="Students" value={batch._count?.students ?? batch.students?.length ?? 0} />
                  <ClassMetric icon={ShieldCheck} label="Attendance" value={metric(health?.attendancePercentage)} />
                  <ClassMetric icon={FileBarChart2} label="Health" value={metric(health?.batchHealthScore)} />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title={selectedBatch ? selectedBatch.name : "Student Profiles"} eyebrow="Profiles credentials progress">
        {selectedBatch ? (
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 sm:grid-cols-4">
                <ClassMetric icon={Users} label="Students" value={selectedBatch._count?.students ?? selectedBatch.students?.length ?? 0} />
                <ClassMetric icon={ShieldCheck} label="Attendance" value={metric(selectedHealth?.attendancePercentage)} />
                <ClassMetric icon={BookOpen} label="Assignments" value={metric(selectedHealth?.assignmentCompletionPercentage)} />
                <ClassMetric icon={GraduationCap} label="Exam Avg" value={metric(selectedHealth?.examAveragePercentage)} />
              </div>
              <Link href={progressUrl} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black text-[var(--navy)]">
                <FileBarChart2 className="h-4 w-4" />
                Progress Reports
              </Link>
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student name, mobile, email or roll number"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </label>

            {!selectedStudents.length ? <EmptyState text="No students match this class and search." /> : null}
            <div className="grid max-h-[48vh] gap-2 overflow-auto pr-1">
              {selectedStudents.map((entry) => {
                const student = entry.student;
                const pinLabel = accessPinLabel(student.roleMetadata);
                const canRevealPin = /^\d{4}$/.test(pinLabel);
                const pinVisible = visiblePins[student.id] === true;
                return (
                  <article key={entry.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto] xl:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">{student.name || "Student"}</h3>
                        <p className="truncate text-xs text-[var(--muted-blue)]">{student.email || "No email"}</p>
                      </div>
                    </div>
                    <InfoBlock label="Roll / Notes" value={student.rollNumber || entry.remarks || "Not set"} />
                    <InfoBlock label="Login Mobile" value={loginMobile(student)} />
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">PIN</p>
                        <p className="mt-1 truncate text-sm font-black">{pinVisible || !canRevealPin ? pinLabel : "****"}</p>
                      </div>
                      {canRevealPin ? (
                        <button
                          type="button"
                          onClick={() => setVisiblePins((items) => ({ ...items, [student.id]: !items[student.id] }))}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white"
                          aria-label={`${pinVisible ? "Hide" : "Show"} PIN for ${student.name || "student"}`}
                        >
                          {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                    <Link href={progressUrl} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black text-[var(--navy)]">
                      <FileBarChart2 className="h-4 w-4" />
                      Report
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState text="Select a class to see student profiles, credentials and progress links." />
        )}
      </Panel>
    </AcademicShell>
  );
}

function ClassMetric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}
