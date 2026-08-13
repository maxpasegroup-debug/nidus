"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, FileText, Send, ShieldAlert, Upload } from "lucide-react";
import { getNdpMonitor } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

function percent(done: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((done / total) * 100)}%`;
}

function score(value?: number | null) {
  return value == null ? "No published score" : `${value}%`;
}

export default function DirectorNdpMonitorPage() {
  const monitorQuery = useQuery({ queryKey: ["academy", "ndp-monitor"], queryFn: getNdpMonitor });
  const data = monitorQuery.data;
  const summary = data?.summary;
  const batches = data?.batches ?? [];
  const attention = batches.filter((batch) => batch.missingStudents > 0 || batch.submittedCount > 0 || batch.returnedCount > 0);
  const weakReviews = data?.weakReviews ?? [];

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="NDP Monitor"
        title="NIDUS Digital Profile control."
        description="Track batch-wise NDP coverage, Academic Head approval queue, published cards and students still missing a progress review."
        action={
          <Link href="/dashboard/academic-head/ndp" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-sm">
            <ClipboardCheck className="h-4 w-4" /> Open Review Queue
          </Link>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Batches" value={summary?.batches ?? 0} />
        <StatCard label="Students" value={summary?.students ?? 0} />
        <StatCard label="Submitted" value={summary?.submitted ?? 0} />
        <StatCard label="Approved" value={summary?.approved ?? 0} />
        <StatCard label="Published" value={summary?.published ?? 0} />
        <StatCard label="Missing Students" value={summary?.missingStudents ?? 0} />
        <StatCard label="Weak NDP" value={summary?.weakStudents ?? 0} />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Batch NDP Coverage" eyebrow="Director tracking">
          {monitorQuery.isLoading ? <EmptyState text="Loading NDP monitor..." /> : null}
          {!monitorQuery.isLoading && !batches.length ? <EmptyState text="No active batches found for NDP monitoring." /> : null}
          <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {batches.map((batch) => (
              <AcademicCard
                key={batch.batchId}
                icon={FileText}
                eyebrow={batch.programSlug ?? "Batch"}
                title={batch.batchName}
                status={<AcademicPill>{percent(batch.publishedCount, batch.studentCount)}</AcademicPill>}
                description={`${batch.reviewedStudents}/${batch.studentCount} student(s) have at least one NDP review.`}
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Submitted" value={batch.submittedCount} />
                  <Metric label="Approved" value={batch.approvedCount} />
                  <Metric label="Published" value={batch.publishedCount} />
                  <Metric label="Returned" value={batch.returnedCount} />
                  <Metric label="Missing" value={batch.missingStudents} />
                  <Metric label="Weak" value={batch.weakStudentCount ?? 0} />
                  <Metric label="Avg Readiness" value={score(batch.averageReadiness)} />
                </div>
              </AcademicCard>
            ))}
          </div>
        </Panel>

        <Panel title="Needs Action" eyebrow="Queue">
          <div className="grid gap-3">
            {attention.slice(0, 8).map((batch) => (
              <Link key={batch.batchId} href="/dashboard/academic-head/ndp" className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{batch.batchName}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.missingStudents} missing / {batch.submittedCount} submitted / {batch.returnedCount} returned</p>
                  </div>
                  {batch.submittedCount ? <Send className="h-5 w-5 text-blue-700" /> : batch.returnedCount ? <ShieldAlert className="h-5 w-5 text-amber-700" /> : <Upload className="h-5 w-5 text-[var(--gold-dark)]" />}
                </div>
              </Link>
            ))}
            {!attention.length ? <EmptyState text="No NDP queue pressure right now." /> : null}
          </div>
        </Panel>
      </section>

      <Panel title="Weak Student Watchlist" eyebrow="Published NDP below 60%">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {weakReviews.map((review) => (
            <Link key={review.id} href="/dashboard/academic-head/ndp" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{review.studentName ?? "Student"}</h3>
                  <p className="mt-1 text-sm">{review.batchName ?? "Batch"} / {review.reviewPeriod}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{review.scores?.overallReadiness ?? "--"}%</span>
              </div>
              <p className="mt-3 text-sm leading-6">Open NDP queue to review teacher remarks and action plan.</p>
            </Link>
          ))}
          {!weakReviews.length ? <EmptyState text="No published NDP below 60%." /> : null}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-0.5 block text-sm font-black">{value}</span>
    </div>
  );
}
