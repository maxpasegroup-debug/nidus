"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentProgressSummary } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

function metric(value: number | null, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "No data";
}

export default function DirectorStudentProgressPage() {
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const batches = progressQuery.data?.batches ?? [];

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Student Progress" title="Batch health and student risk monitor." description="Batch cards use real attendance, assignment, exam and material records. Library usage is shown only when usage data exists." />
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Healthy" value={batches.filter((batch) => batch.overallStatus === "Healthy").length} />
        <StatCard label="Attention Needed" value={batches.filter((batch) => batch.overallStatus === "Attention Needed").length} />
        <StatCard label="Critical" value={batches.filter((batch) => batch.overallStatus === "Critical").length} />
      </section>
      <Panel title="Batch Health Cards" eyebrow="Real database calculations">
        {!batches.length ? <EmptyState text="No active batches are available yet. Student progress cards will appear after admissions and academic records exist." /> : null}
        <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <article key={batch.batchId} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.programSlug ?? "Program"}</p>
                  <h3 className="mt-2 text-xl font-black">{batch.batchName}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.studentCount} students</p>
                </div>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{batch.overallStatus}</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <p><b>Batch Health Score:</b> {metric(batch.batchHealthScore)}</p>
                <p><b>Attendance:</b> {metric(batch.attendancePercentage)}</p>
                <p><b>Assignments:</b> {metric(batch.assignmentCompletionPercentage)}</p>
                <p><b>Exam Avg:</b> {metric(batch.examAveragePercentage)}</p>
                <p><b>Library Usage:</b> {metric(batch.libraryUsagePercentage)}</p>
                <p><b>Materials Uploaded:</b> {batch.materialCount}</p>
                <p><b>Risk Students:</b> {batch.riskStudentCount}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
