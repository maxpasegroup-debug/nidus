"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/courses/empty-state";
import { useTests } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";

export default function TestsPage() {
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [topic, setTopic] = useState("");
  const { data: tests = [], isLoading, error } = useTests({ search, examType, topic });
  const examTypes = useMemo(() => Array.from(new Set(tests.map((test) => test.examType))), [tests]);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.06] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Mock Exam Grid</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Test readiness under command conditions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Attempt NDA, CDS and AFCAT mocks with OMR-style navigation, performance analytics and rank estimates.
        </p>
      </section>

      <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 lg:grid-cols-[1fr_220px_220px]">
        <Input label="Search tests" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NDA Mathematics..." />
        <label className="block">
          <span className="text-sm font-medium text-ink">Exam</span>
          <select value={examType} onChange={(event) => setExamType(event.target.value)} className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white">
            <option value="">All exams</option>
            {examTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <Input label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Algebra, Polity..." />
      </div>

      <SectionHeader eyebrow="Available Tests" title="Mock and live tests" />
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load tests" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        tests.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <Link key={test.id} href={`/tests/${test.id}`} className="group rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/35">
                <div className="flex items-center justify-between">
                  <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{test.examType}</span>
                  <span className="text-xs text-muted">{test.isLive ? "Live" : test.isMockTest ? "Mock" : "Practice"}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white">{test.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{test.description}</p>
                <div className="mt-5 flex justify-between text-sm text-muted">
                  <span>{test.duration} min</span>
                  <span>{test.totalMarks} marks</span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState title="No tests found" description="Try a different search or filter." />
        )
      ) : null}
    </motion.div>
  );
}
