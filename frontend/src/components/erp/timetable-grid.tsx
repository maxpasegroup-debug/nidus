import type { Timetable } from "@/types/erp";

export function TimetableGrid({ items }: { items: Timetable[] }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><p className="text-xs text-gold">{item.batch} · {item.classroom}</p><h3 className="mt-2 font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm text-muted">{item.subject} with {item.instructor}</p><p className="mt-3 text-sm text-gold-soft">{new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleTimeString()}</p></div>)}</div>;
}
