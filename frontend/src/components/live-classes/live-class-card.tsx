import Link from "next/link";
import type { LiveClass } from "@/types/live-class";
import { CountdownTimer } from "./countdown-timer";

export function LiveClassCard({ item }: { item: LiveClass }) {
  return (
    <Link href={`/live-classes/${item.id}`} className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/35">
      <img src={item.thumbnail} alt={item.title} className="h-44 w-full object-cover transition group-hover:scale-105" />
      <div className="p-5">
        <div className="flex justify-between gap-3">
          <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-xs text-gold">{item.examType}</span>
          <span className="text-xs text-muted">{item.isLive ? "Live now" : <CountdownTimer date={item.scheduledAt} />}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
        <p className="mt-4 text-sm text-gold-soft">{item.instructorName} · {item.duration} min</p>
      </div>
    </Link>
  );
}
