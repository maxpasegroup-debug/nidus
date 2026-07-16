"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { FileText } from "lucide-react";

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
      <AcademicHero eyebrow="Academic Reports" title="Academic Reports" description="Academic-only reports for attendance, timetable, teacher delivery, student progress and syllabus." />
      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendance" value={`${attendance?.percentage ?? 0}%`} />
        <StatCard label="Assignments Pending" value={assignments?.pending ?? 0} />
        <StatCard label="Exams" value={exams?.exams ?? 0} />
        <StatCard label="Materials" value={materials?.total ?? 0} />
        <StatCard label="Syllabus" value={`${syllabus?.completionPercentage ?? 0}%`} />
      </section>
      <section className="grid shrink-0 gap-3 md:grid-cols-5">
        {["Attendance Report", "Timetable Report", "Teacher Report", "Student Progress", "Syllabus Report"].map((report) => (
          <button key={report} type="button" onClick={() => window.print()} className="rounded-2xl border border-[var(--border)] bg-white px-3 py-3 text-left text-sm font-black shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
            <FileText className="mb-2 h-4 w-4 text-[var(--gold)]" />
            {report}
          </button>
        ))}
      </section>
      <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-2">
        <Panel title="Attendance By Batch" eyebrow="Monitoring">
          {!attendance?.batches.length ? <EmptyState text="No attendance sessions have been marked yet." /> : null}
          <div className="max-h-[48vh] overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Batch</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Sessions</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Present</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Total</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">%</th>
                </tr>
              </thead>
              <tbody>
            {(attendance?.batches ?? []).slice(0, 8).map((batch) => (
              <tr key={batch.batchId} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-2 font-black">{batch.batchName ?? "Batch"}</td>
                <td className="px-3 py-2">{batch.sessions}</td>
                <td className="px-3 py-2">{batch.present}</td>
                <td className="px-3 py-2">{batch.total}</td>
                <td className="px-3 py-2 font-black">{batch.percentage}%</td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Latest Exams" eyebrow="Testing">
          {!examQuery.data?.exams.length ? <EmptyState text="No teacher-created exams are available yet." /> : null}
          <div className="max-h-[48vh] overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Exam</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Subject</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Batch</th>
                  <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Status</th>
                </tr>
              </thead>
              <tbody>
            {(examQuery.data?.exams ?? []).slice(0, 8).map((exam) => (
              <tr key={exam.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-2 font-black">{exam.title}</td>
                <td className="px-3 py-2">{exam.subject ?? "Subject"}</td>
                <td className="px-3 py-2">{exam.batchName ?? "Batch"}</td>
                <td className="px-3 py-2"><span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-black">{exam.status}</span></td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}
