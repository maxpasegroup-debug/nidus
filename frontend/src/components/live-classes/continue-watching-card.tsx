import type { RecordedLecture } from "@/types/live-class";
import { LectureProgressBar } from "./lecture-progress-bar";

export function ContinueWatchingCard({ lecture }: { lecture: RecordedLecture }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-gold/10 p-5 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Continue Watching</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{lecture.title}</h3>
      <p className="mt-2 text-sm text-muted">{lecture.instructorName}</p>
      <div className="mt-5"><LectureProgressBar value={42} /></div>
    </div>
  );
}
