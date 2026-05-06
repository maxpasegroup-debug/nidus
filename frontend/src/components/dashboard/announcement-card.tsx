import { DashboardCard } from "@/components/dashboard/dashboard-card";

type AnnouncementCardProps = {
  title: string;
  description: string;
  tag: string;
};

export function AnnouncementCard({ title, description, tag }: AnnouncementCardProps) {
  return (
    <DashboardCard className="p-5">
      <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
        {tag}
      </span>
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </DashboardCard>
  );
}

