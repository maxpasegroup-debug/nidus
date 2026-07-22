"use client";

import { useQuery } from "@tanstack/react-query";
import { getNdpMonitor, getStudentProgressSummary, type NdpMonitorBatch } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { ClipboardCheck, Download, PieChart, Printer } from "lucide-react";

function metric(value: number | null, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "No data";
}

export default function DirectorStudentProgressPage() {
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const ndpQuery = useQuery({ queryKey: ["academy", "director", "ndp-monitor"], queryFn: getNdpMonitor });
  const batches = progressQuery.data?.batches ?? [];
  const ndp = ndpQuery.data;

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Student Progress" title="Batch health and student risk monitor." description="Batch cards use real attendance, assignment, exam and material records. Library usage is shown only when usage data exists." />
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Healthy" value={batches.filter((batch) => batch.overallStatus === "Healthy").length} />
        <StatCard label="Attention Needed" value={batches.filter((batch) => batch.overallStatus === "Attention Needed").length} />
        <StatCard label="Critical" value={batches.filter((batch) => batch.overallStatus === "Critical").length} />
      </section>
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Published NDP" value={ndp?.summary.published ?? 0} />
        <StatCard label="Pending Review" value={ndp?.summary.submitted ?? 0} />
        <StatCard label="Ready To Publish" value={ndp?.summary.approved ?? 0} />
        <StatCard label="Missing NDP" value={ndp?.summary.missingStudents ?? 0} />
      </section>
      <Panel title="NDP Publication Monitor" eyebrow="Digital profile readiness">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button type="button" onClick={() => exportNdpMonitor(ndp?.batches ?? [])} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
        <div className="grid max-h-[42vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {(ndp?.batches ?? []).map((batch) => {
            const coverage = batch.studentCount ? Math.round((batch.publishedCount / batch.studentCount) * 100) : 0;
            return (
              <AcademicCard
                key={`ndp-${batch.batchId}`}
                icon={ClipboardCheck}
                eyebrow={batch.programSlug ?? "Program"}
                title={batch.batchName}
                status={<AcademicPill>{coverage >= 80 ? "Ready" : coverage >= 40 ? "In Progress" : "Needs NDP"}</AcademicPill>}
                description={`${coverage}% published coverage`}
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <ProgressMetric label="Published" value={batch.publishedCount} />
                  <ProgressMetric label="Submitted" value={batch.submittedCount} />
                  <ProgressMetric label="Approved" value={batch.approvedCount} />
                  <ProgressMetric label="Returned" value={batch.returnedCount} />
                  <ProgressMetric label="Missing" value={batch.missingStudents} />
                  <ProgressMetric label="Readiness" value={metric(batch.averageReadiness ?? null)} />
                </div>
              </AcademicCard>
            );
          })}
          {!ndp?.batches.length ? <EmptyState text={ndpQuery.isLoading ? "Loading NDP monitor..." : "No active batches are available for NDP monitoring."} /> : null}
        </div>
      </Panel>
      <Panel title="Batch Health Cards" eyebrow="Real database calculations">
        {!batches.length ? <EmptyState text="No active batches are available yet. Student progress cards will appear after admissions and academic records exist." /> : null}
        <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <AcademicCard
              key={batch.batchId}
              icon={PieChart}
              eyebrow={batch.programSlug ?? "Program"}
              title={batch.batchName}
              status={<AcademicPill>{batch.overallStatus}</AcademicPill>}
              description={`${batch.studentCount} students`}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ProgressMetric label="Health" value={metric(batch.batchHealthScore)} />
                <ProgressMetric label="Attendance" value={metric(batch.attendancePercentage)} />
                <ProgressMetric label="Assignments" value={metric(batch.assignmentCompletionPercentage)} />
                <ProgressMetric label="Exam Avg" value={metric(batch.examAveragePercentage)} />
                <ProgressMetric label="Materials" value={batch.materialCount} />
                <ProgressMetric label="Risk" value={batch.riskStudentCount} />
              </div>
            </AcademicCard>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function exportNdpMonitor(batches: NdpMonitorBatch[]) {
  const headers = ["Batch", "Students", "Reviewed", "Missing", "Submitted", "Approved", "Returned", "Published", "Average Readiness"];
  const rows = batches.map((batch) => [
    batch.batchName,
    batch.studentCount,
    batch.reviewedStudents,
    batch.missingStudents,
    batch.submittedCount,
    batch.approvedCount,
    batch.returnedCount,
    batch.publishedCount,
    batch.averageReadiness ?? "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ndp-monitor.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ProgressMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-0.5 block text-sm font-black">{value}</span>
    </div>
  );
}
