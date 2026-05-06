"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevisionCard } from "@/components/ai-planner/revision-card";
import { EmptyState } from "@/components/courses/empty-state";
import { SectionHeader } from "@/components/dashboard";
import { useRevisionSchedule } from "@/hooks/use-ai-planner";
import { getApiErrorMessage } from "@/services/api";

export default function RevisionSchedulePage() {
  const { data: revisions = [], isLoading, error, create } = useRevisionSchedule();
  const [topic, setTopic] = useState("");
  const [revisionDate, setRevisionDate] = useState("");
  const [priority, setPriority] = useState("HIGH");

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="Revision Schedule" title="Mission calendar for weak-topic repair" />
      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl md:grid-cols-[1fr_220px_180px_auto] md:items-end">
        <Input label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Trigonometry" />
        <Input label="Revision date" type="date" value={revisionDate} onChange={(event) => setRevisionDate(event.target.value)} />
        <label>
          <span className="text-sm text-ink">Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 h-12 w-full rounded border border-white/10 bg-navy-deep px-4 text-white">
            {["HIGH", "MEDIUM", "LOW"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <Button disabled={!topic || !revisionDate || create.isPending} onClick={() => create.mutate({ topic, revisionDate, priority })}>Add</Button>
      </section>
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load revisions" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        revisions.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{revisions.map((revision) => <RevisionCard key={revision.id} revision={revision} />)}</section> : <EmptyState title="No revisions scheduled" description="Generate a study plan or add a revision mission manually." />
      ) : null}
    </motion.div>
  );
}
