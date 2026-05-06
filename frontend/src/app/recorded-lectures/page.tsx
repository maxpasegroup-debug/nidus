"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/courses/empty-state";
import { ContinueWatchingCard } from "@/components/live-classes/continue-watching-card";
import { LectureCard } from "@/components/live-classes/lecture-card";
import { SectionHeader } from "@/components/dashboard";
import { useRecordedLectures } from "@/hooks/use-live-classes";
import { getApiErrorMessage } from "@/services/api";

export default function RecordedLecturesPage() {
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const { data: lectures = [], isLoading, error } = useRecordedLectures();
  const examTypes = useMemo(() => Array.from(new Set(lectures.map((lecture) => lecture.course?.examType).filter(Boolean))) as string[], [lectures]);
  const filtered = lectures.filter((lecture) => lecture.title.toLowerCase().includes(search.toLowerCase()) && (!examType || lecture.course?.examType === examType));

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Recorded Lecture Vault</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Replay tactical lessons on demand</h1>
      </section>
      <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 md:grid-cols-[1fr_220px]">
        <Input label="Search lectures" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label><span className="text-sm text-ink">Exam</span><select className="mt-2 h-12 w-full rounded border border-white/10 bg-navy-deep px-4 text-white" value={examType} onChange={(event) => setExamType(event.target.value)}><option value="">All</option>{examTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load lectures" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        <>
          {lectures[0] ? <ContinueWatchingCard lecture={lectures[0]} /> : null}
          <SectionHeader eyebrow="Recently Added" title="Recorded lectures" action={`${filtered.length} lectures`} />
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)}</section>
        </>
      ) : null}
    </motion.div>
  );
}
