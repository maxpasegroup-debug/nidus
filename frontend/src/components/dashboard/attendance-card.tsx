import { DashboardCard } from "@/components/dashboard/dashboard-card";

type AttendanceCardProps = {
  title: string;
  present: number;
  total: number;
};

export function AttendanceCard({ title, present, total }: AttendanceCardProps) {
  const percentage = Math.round((present / total) * 100);

  return (
    <DashboardCard className="p-5">
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold text-gold-soft">{percentage}%</p>
          <p className="mt-2 text-sm text-muted">
            {present} of {total} sessions attended
          </p>
        </div>
        <div className="grid h-20 w-20 place-items-center rounded-full border border-gold/25 bg-gold/10 text-sm font-semibold text-gold">
          LIVE
        </div>
      </div>
    </DashboardCard>
  );
}

