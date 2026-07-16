"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeacherPerformanceSummary } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { UserCheck } from "lucide-react";

function displayPercent(value: number | null) {
  return typeof value === "number" ? `${value}%` : "No data";
}

export default function DirectorTeacherPerformancePage() {
  const performanceQuery = useQuery({ queryKey: ["academy", "teacher-performance-summary"], queryFn: getTeacherPerformanceSummary });
  const teachers = performanceQuery.data?.teachers ?? [];

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Teacher Performance" title="Monitor teaching quality and academic delivery." description="Real teacher cards based on assigned batches, subject allocation, class execution, syllabus progress, attendance marking, exams, assignments and materials." />
      <section className="grid shrink-0 gap-3 md:grid-cols-3">
        <StatCard label="Teachers Monitored" value={teachers.length} />
        <StatCard label="On Track" value={teachers.filter((teacher) => teacher.status === "GREEN").length} />
        <StatCard label="Needs Attention" value={teachers.filter((teacher) => teacher.status !== "GREEN").length} />
      </section>
      <Panel title="Teacher Cards" eyebrow="Real records only">
        {!teachers.length ? <EmptyState text="No teacher allocations are available yet. Performance cards will appear after teachers are assigned to batches and subjects." /> : null}
        <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <AcademicCard
              key={teacher.teacherId}
              icon={UserCheck}
              eyebrow="Teacher"
              title={teacher.teacherName}
              status={<AcademicPill>{teacher.status}</AcademicPill>}
              description={teacher.assignedSubjects.length ? teacher.assignedSubjects.join(", ") : "No subjects"}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <PerformanceMetric label="Batches" value={teacher.assignedBatches} />
                <PerformanceMetric label="Classes" value={teacher.classesConducted} />
                <PerformanceMetric label="Syllabus" value={displayPercent(teacher.syllabusCompletionPercentage)} />
                <PerformanceMetric label="Attendance" value={displayPercent(teacher.attendanceMarkingPercentage)} />
                <PerformanceMetric label="Assignments" value={teacher.assignmentsPublished} />
                <PerformanceMetric label="Exams" value={teacher.examsPublished} />
              </div>
            </AcademicCard>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-0.5 block text-sm font-black">{value}</span>
    </div>
  );
}
