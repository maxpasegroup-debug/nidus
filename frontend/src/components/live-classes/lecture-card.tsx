import Link from "next/link";
import Image from "next/image";
import type { RecordedLecture } from "@/types/live-class";

export function LectureCard({ lecture }: { lecture: RecordedLecture }) {
  return (
    <Link href={`/recorded-lectures/${lecture.id}`} className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/35">
      <div className="relative h-44 w-full overflow-hidden">
        <Image src={lecture.thumbnail} alt={lecture.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition group-hover:scale-105" />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-gold">{lecture.course?.examType ?? "NIDUS"}</p>
        <h3 className="mt-3 text-xl font-semibold text-white">{lecture.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{lecture.description}</p>
        <p className="mt-4 text-sm text-gold-soft">{lecture.instructorName} · {lecture.duration} min</p>
      </div>
    </Link>
  );
}
