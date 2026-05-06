import type { Lesson } from "@/types/course";

export function VideoPlayer({ lesson }: { lesson: Lesson }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
      <iframe
        src={lesson.videoUrl}
        title={lesson.title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
