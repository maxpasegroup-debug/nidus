"use client";

import { motion } from "framer-motion";
import { type FormEvent } from "react";
import { EmptyState } from "@/components/courses/empty-state";
import { LiveClassCard } from "@/components/live-classes/live-class-card";
import { AnnouncementCard, SectionHeader, StatCard } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useCreateLiveClass, useLiveClasses } from "@/hooks/use-live-classes";
import { getApiErrorMessage } from "@/services/api";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const { data: classes = [], isLoading, error } = useLiveClasses();
  const createLiveClass = useCreateLiveClass();
  const liveNow = classes.filter((item) => item.isLive);
  const upcoming = classes.filter((item) => !item.isLive);
  const canSchedule = user?.role === "ADMIN" || user?.role === "TEACHER";

  function scheduleClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    createLiveClass.mutate(
      {
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        examType: String(data.get("examType") ?? ""),
        instructorName: String(data.get("instructorName") || user?.name || ""),
        scheduledAt: String(data.get("scheduledAt") ?? ""),
        duration: Number(data.get("duration") ?? 60),
        meetingLink: String(data.get("meetingLink") ?? ""),
        thumbnail: String(data.get("thumbnail") || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"),
        isLive: data.get("isLive") === "on"
      },
      { onSuccess: () => form.reset() }
    );
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Live Classes</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Schedule and join online classes</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Teachers can schedule Google Meet, Zoom, or any meeting link, set date and time, and publish online classes for students.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Live Now" value={String(liveNow.length)} note="Classes currently active" />
        <StatCard label="Upcoming" value={String(upcoming.length)} note="Scheduled online classes" />
        <StatCard label="Meeting Links" value="Meet/Zoom" note="Paste any valid meeting URL" />
        <StatCard label="Teacher Access" value={canSchedule ? "Enabled" : "View"} note="Teachers and admins can schedule" />
      </section>

      {canSchedule ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={scheduleClass} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <SectionHeader eyebrow="Class Scheduler" title="Host an online class" action="Teacher/Admin" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="title" label="Class title" placeholder="NDA Maths Live: Trigonometry" required />
              <Input name="examType" label="Exam / batch" placeholder="NDA Alpha" required />
              <Input name="instructorName" label="Teacher name" defaultValue={user?.name ?? ""} required />
              <Input name="scheduledAt" label="Date and time" type="datetime-local" required />
              <Input name="duration" label="Duration minutes" type="number" min="1" defaultValue={60} required />
              <Input name="meetingLink" label="Google Meet / Zoom link" placeholder="https://meet.google.com/..." required />
              <Input name="thumbnail" label="Thumbnail URL" placeholder="Optional image URL" className="md:col-span-2" />
              <Input name="description" label="Class note" placeholder="Topics, homework, materials needed." required className="md:col-span-2" />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-muted"><input name="isLive" type="checkbox" className="h-4 w-4" /> Mark as live now</label>
            <Button type="submit" className="mt-5 w-full" disabled={createLiveClass.isPending}>{createLiveClass.isPending ? "Scheduling..." : "Schedule class"}</Button>
          </form>
          <div className="grid gap-4">
            <AnnouncementCard title="Google Meet style" description="Paste Meet, Zoom, Teams, or any valid classroom link." tag="Meet" />
            <AnnouncementCard title="Teacher workflow" description="Schedule, share, teach live, then upload notes or recording after class." tag="Flow" />
            <AnnouncementCard title="Student view" description="Students see live and upcoming classes with direct join links." tag="Student" />
          </div>
        </section>
      ) : null}
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
