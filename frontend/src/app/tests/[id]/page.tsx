"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { SectionHeader } from "@/components/dashboard";
import { useStartTest, useTestDetails } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";

export default function TestDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: test, isLoading, error } = useTestDetails(id);
  const startMutation = useStartTest();

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />;
  if (error || !test) return <EmptyState title="Unable to load test" description={getApiErrorMessage(error)} />;

  const topics = Array.from(new Set(test.questions?.map((question) => question.topic) ?? []));

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.06] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{test.examType} · {test.category}</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">{test.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{test.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div><p className="text-xs text-muted">Duration</p><p className="font-semibold text-white">{test.duration} min</p></div>
          <div><p className="text-xs text-muted">Marks</p><p className="font-semibold text-white">{test.totalMarks}</p></div>
          <div><p className="text-xs text-muted">Questions</p><p className="font-semibold text-white">{test.questions?.length ?? 0}</p></div>
          <Button onClick={() => startMutation.mutate(test.id)} disabled={startMutation.isPending}>
            {startMutation.isPending ? "Starting..." : "Start Test"}
          </Button>
        </div>
      </section>

      <SectionHeader eyebrow="Topics Covered" title="Syllabus focus" />
      <section className="flex flex-wrap gap-3">
        {topics.map((topic) => (
          <span key={topic} className="rounded border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-gold">{topic}</span>
        ))}
      </section>
    </motion.div>
  );
}
