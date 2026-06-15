"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

export default function DirectorAcademicReportsPage() {
  const attendanceQuery = useQuery({ queryKey: ["academy", "attendance-summary"], queryFn: () => getAttendanceSummary() });
  const assignmentQuery = useQuery({ queryKey: ["academy", "assignment-summary"], queryFn: () => getAssignmentSummary() });
  const materialQuery = useQuery({ queryKey: ["academy", "material-summary"], queryFn: () => getMaterialSummary() });
  const examQuery = useQuery({ queryKey: ["academy", "exam-summary"], queryFn: () => getExamSummary() });
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary"], queryFn: () => getSyllabusSummary() });
  const attendance = attendanceQuery.data?.summary;
  const assignments = assignmentQuery.data?.summary;
  const materials = materialQuery.data?.summary;
  const exams = examQuery.data?.summary;
  const syllabus = syllabusQuery.data?.summary;

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Academic Reports" title="Academic health in one page." description="A separate monitoring page for attendance, assignments, exams, materials and syllabus progress." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendance" value={`${attendance?.percentage ?? 0}%`} />
        <StatCard label="Assignments Pending" value={assignments?.pending ?? 0} />
        <StatCard label="Exams" value={exams?.exams ?? 0} />
        <StatCard label="Materials" value={materials?.total ?? 0} />
        <StatCard label="Syllabus" value={`${syllabus?.completionPercentage ?? 0}%`} />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Attendance By Batch" eyebrow="Monitoring">
          {!attendance?.batches.length ? <EmptyState text="No attendance sessions have been marked yet." /> : null}
          <div className="grid gap-3">
            {(attendance?.batches ?? []).slice(0, 8).map((batch) => (
              <div key={batch.batchId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{batch.batchName ?? "Batch"}</p>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">{batch.percentage}%</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.sessions} sessions / Present {batch.present}/{batch.total}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Latest Exams" eyebrow="Testing">
          {!examQuery.data?.exams.length ? <EmptyState text="No teacher-created exams are available yet." /> : null}
          <div className="grid gap-3">
            {(examQuery.data?.exams ?? []).slice(0, 8).map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="font-black">{exam.title}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.batchName ?? "Batch"} / {exam.subject ?? "Subject"} / {exam.status}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}
