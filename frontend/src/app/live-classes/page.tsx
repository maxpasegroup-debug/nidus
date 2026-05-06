"use client";

import { motion } from "framer-motion";
import { EmptyState } from "@/components/courses/empty-state";
import { LiveClassCard } from "@/components/live-classes/live-class-card";
import { SectionHeader } from "@/components/dashboard";
import { useLiveClasses } from "@/hooks/use-live-classes";
import { getApiErrorMessage } from "@/services/api";

export default function LiveClassesPage() {
  const { data: classes = [], isLoading, error } = useLiveClasses();
  const liveNow = classes.filter((item) => item.isLive);
  const upcoming = classes.filter((item) => !item.isLive);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Live Command Classroom</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Join live defence training sessions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Countdowns, instructor briefings, and future-ready Meet or Zoom integration.</p>
      </section>
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load live classes" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        <>
          <SectionHeader eyebrow="Live Now" title="Active sessions" />
          {liveNow.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{liveNow.map((item) => <LiveClassCard key={item.id} item={item} />)}</section> : <EmptyState title="No class live right now" description="Upcoming classes are listed below." />}
          <SectionHeader eyebrow="Upcoming" title="Scheduled classes" />
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{upcoming.map((item) => <LiveClassCard key={item.id} item={item} />)}</section>
        </>
      ) : null}
    </motion.div>
  );
}
