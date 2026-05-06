"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { LectureProgressBar } from "@/components/live-classes/lecture-progress-bar";
import { VideoSidebar } from "@/components/live-classes/video-sidebar";
import { useLectureProgress, useRecordedLecture, useRecordedLectures } from "@/hooks/use-live-classes";
import { getApiErrorMessage } from "@/services/api";

export default function RecordedLecturePlayerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: lecture, isLoading, error } = useRecordedLecture(id);
  const { data: lectures = [] } = useRecordedLectures();
  const progress = useLectureProgress(id);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-white/[0.06]" />;
  if (error || !lecture) return <EmptyState title="Unable to load lecture" description={getApiErrorMessage(error)} />;
  const percent = lecture.duration ? Math.round(((progress.data?.watchedDuration ?? 0) / (lecture.duration * 60)) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <VideoSidebar lectures={lectures} activeId={lecture.id} />
      <main className="space-y-5">
        <iframe src={lecture.videoUrl} title={lecture.title} className="aspect-video w-full rounded-lg border border-white/10 bg-black" allowFullScreen />
        <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{lecture.course?.examType ?? "NIDUS"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{lecture.title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted">{lecture.description}</p>
          <div className="mt-5"><LectureProgressBar value={percent} /></div>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => progress.update.mutate({ lectureId: lecture.id, watchedDuration: lecture.duration * 60, completed: true })}>Mark Complete</Button>
            <Button variant="secondary" onClick={() => progress.update.mutate({ lectureId: lecture.id, watchedDuration: Math.round(lecture.duration * 30), completed: false })}>Save Progress</Button>
          </div>
        </section>
        <textarea className="min-h-40 w-full rounded-lg border border-white/10 bg-navy-deep/75 p-4 text-sm text-white outline-none focus:border-gold" placeholder="Write lecture notes..." />
      </main>
    </div>
  );
}
