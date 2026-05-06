import type { Announcement } from "@/types/erp";

export function AnnouncementCard({ item }: { item: Announcement }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><p className="text-xs text-gold">{item.targetAudience}</p><h3 className="mt-2 font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p></div>;
}
