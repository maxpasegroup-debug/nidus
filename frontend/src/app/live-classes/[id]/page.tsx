"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { CountdownTimer } from "@/components/live-classes/countdown-timer";
import { useLiveClasses } from "@/hooks/use-live-classes";

export default function LiveClassDetailsPage() {
  const params = useParams<{ id: string }>();
  const item = (useLiveClasses().data ?? []).find((liveClass) => liveClass.id === (params?.id ?? ""));
  if (!item) return <EmptyState title="Live class not found" description="Return to live classes and choose a scheduled session." />;
  return (
    <div className="overflow-hidden rounded-lg border border-gold/20 bg-white/[0.055] backdrop-blur-xl">
      <img src={item.thumbnail} alt={item.title} className="h-80 w-full object-cover" />
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{item.examType}</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">{item.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{item.description}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div><p className="text-xs text-muted">Instructor</p><p className="font-semibold text-white">{item.instructorName}</p></div>
          <div><p className="text-xs text-muted">Duration</p><p className="font-semibold text-white">{item.duration} min</p></div>
          <div><p className="text-xs text-muted">Starts</p><p className="font-semibold text-gold"><CountdownTimer date={item.scheduledAt} /></p></div>
          <Button href={item.meetingLink}>Join Class</Button>
        </div>
      </div>
    </div>
  );
}
