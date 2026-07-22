"use client";

import { useQuery } from "@tanstack/react-query";
import { getNdpReviews, getStudentProgressSummary, type NdpReview } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { ClipboardCheck, PieChart } from "lucide-react";

function metric(value: number | null, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "No data";
}

export default function DirectorStudentProgressPage() {
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const ndpQuery = useQuery({ queryKey: ["academy", "director", "ndp-reviews"], queryFn: () => getNdpReviews() });
  const batches = progressQuery.data?.batches ?? [];
  const ndpReviews = ndpQuery.data?.reviews ?? [];
  const ndpByBatch = ndpReviews.reduce<Record<string, NdpReview[]>>((groups, review) => {
    const list = groups[review.batchId] ?? [];
    list.push(review);
    groups[review.batchId] = list;
    return groups;
  }, {});
  const publishedStudentIds = new Set(ndpReviews.filter((review) => review.status === "PUBLISHED").map((review) => review.studentId));
  const submittedCount = ndpReviews.filter((review) => review.status === "SUBMITTED").length;
  const approvedCount = ndpReviews.filter((review) => review.status === "APPROVED").length;
  const publishedCount = ndpReviews.filter((review) => review.status === "PUBLISHED").length;
  const totalStudentSlots = batches.reduce((sum, batch) => sum + batch.studentCount, 0);
  const missingPublishedCount = Math.max(0, totalStudentSlots - publishedStudentIds.size);

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
        <StatCard label="Published NDP" value={publishedCount} />
        <StatCard label="Pending Review" value={submittedCount} />
        <StatCard label="Ready To Publish" value={approvedCount} />
        <StatCard label="Missing Published" value={missingPublishedCount} />
      </section>
      <Panel title="NDP Publication Monitor" eyebrow="Digital profile readiness">
        <div className="grid max-h-[42vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const reviews = ndpByBatch[batch.batchId] ?? [];
            const published = reviews.filter((review) => review.status === "PUBLISHED").length;
            const submitted = reviews.filter((review) => review.status === "SUBMITTED").length;
            const approved = reviews.filter((review) => review.status === "APPROVED").length;
            const coverage = batch.studentCount ? Math.round((published / batch.studentCount) * 100) : 0;
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
                  <ProgressMetric label="Published" value={published} />
                  <ProgressMetric label="Submitted" value={submitted} />
                  <ProgressMetric label="Approved" value={approved} />
                  <ProgressMetric label="Missing" value={Math.max(0, batch.studentCount - published)} />
                </div>
              </AcademicCard>
            );
          })}
          {!batches.length ? <EmptyState text="No active batches are available for NDP monitoring." /> : null}
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

function ProgressMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-0.5 block text-sm font-black">{value}</span>
    </div>
  );
}
