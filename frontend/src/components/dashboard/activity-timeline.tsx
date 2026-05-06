import { DashboardCard } from "@/components/dashboard/dashboard-card";

type ActivityTimelineProps = {
  title: string;
  items: string[];
};

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  return (
    <DashboardCard className="p-5">
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted">No activity yet.</p>
        ) : (
          items.map((item) => (
            <div key={item} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_18px_rgba(201,166,70,0.8)]" />
              <p className="text-sm leading-6 text-muted">{item}</p>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}

