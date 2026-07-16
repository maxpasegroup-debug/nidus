"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { ClipboardCheck, FileText } from "lucide-react";

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
      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendance" value={`${attendance?.percentage ?? 0}%`} />
        <StatCard label="Assignments Pending" value={assignments?.pending ?? 0} />
        <StatCard label="Exams" value={exams?.exams ?? 0} />
        <StatCard label="Materials" value={materials?.total ?? 0} />
        <StatCard label="Syllabus" value={`${syllabus?.completionPercentage ?? 0}%`} />
      </section>
      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
        <Panel title="Attendance By Batch" eyebrow="Monitoring">
          {!attendance?.batches.length ? <EmptyState text="No attendance sessions have been marked yet." /> : null}
          <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
            {(attendance?.batches ?? []).slice(0, 8).map((batch) => (
              <AcademicCard
                key={batch.batchId}
                icon={ClipboardCheck}
                eyebrow="Attendance"
                title={batch.batchName ?? "Batch"}
                status={<AcademicPill>{batch.percentage}%</AcademicPill>}
                description={`${batch.sessions} sessions / Present ${batch.present}/${batch.total}`}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Latest Exams" eyebrow="Testing">
          {!examQuery.data?.exams.length ? <EmptyState text="No teacher-created exams are available yet." /> : null}
          <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
            {(examQuery.data?.exams ?? []).slice(0, 8).map((exam) => (
              <AcademicCard
                key={exam.id}
                icon={FileText}
                eyebrow={exam.subject ?? "Subject"}
                title={exam.title}
                status={<AcademicPill>{exam.status}</AcademicPill>}
                description={exam.batchName ?? "Batch"}
              />
            ))}
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}
