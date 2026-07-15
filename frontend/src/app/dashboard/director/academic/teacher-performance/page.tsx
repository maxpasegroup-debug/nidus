"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeacherPerformanceSummary } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

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
            <article key={teacher.teacherId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Teacher</p>
                  <h3 className="mt-2 text-xl font-black">{teacher.teacherName}</h3>
                </div>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{teacher.status}</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <p><b>Assigned Batches:</b> {teacher.assignedBatches}</p>
                <p><b>Assigned Subjects:</b> {teacher.assignedSubjects.length ? teacher.assignedSubjects.join(", ") : "No subjects"}</p>
                <p><b>Classes Conducted:</b> {teacher.classesConducted}</p>
                <p><b>Syllabus Completion:</b> {displayPercent(teacher.syllabusCompletionPercentage)}</p>
                <p><b>Attendance Marking:</b> {displayPercent(teacher.attendanceMarkingPercentage)}</p>
                <p><b>Assignments Published:</b> {teacher.assignmentsPublished}</p>
                <p><b>Exams Published:</b> {teacher.examsPublished}</p>
                <p><b>Library Materials Uploaded:</b> {teacher.libraryMaterialsUploaded}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
