import { DashboardCard } from "@/components/dashboard/dashboard-card";

type AnnouncementCardProps = {
  title: string;
  description: string;
  tag: string;
};

export function AnnouncementCard({ title, description, tag }: AnnouncementCardProps) {
  return (
    <DashboardCard className="p-5">
      <span className="inline-flex rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--gold-dark)]">
        {tag}
      </span>
      <p className="mt-4 font-black text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted-blue)]">{description}</p>
    </DashboardCard>
  );
}
