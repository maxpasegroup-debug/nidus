import { DashboardCard } from "@/components/dashboard/dashboard-card";

type ProgressCardProps = {
  title: string;
  value: number;
  label: string;
};

export function ProgressCard({ title, value, label }: ProgressCardProps) {
  return (
    <DashboardCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
        <p className="text-xl font-semibold text-gold-soft">{value}%</p>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft shadow-[0_0_22px_rgba(201,166,70,0.5)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </DashboardCard>
  );
}

