import type { RecordedLecture } from "@/types/live-class";

export function VideoSidebar({ lectures, activeId }: { lectures: RecordedLecture[]; activeId: string }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Lecture Queue</p>
      <div className="mt-4 space-y-2">
        {lectures.map((lecture) => (
          <a key={lecture.id} href={`/recorded-lectures/${lecture.id}`} className={`block rounded border px-3 py-3 text-sm ${lecture.id === activeId ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-muted"}`}>{lecture.title}</a>
        ))}
      </div>
    </aside>
  );
}
