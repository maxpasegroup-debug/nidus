import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
};

export function QuickActionCard({ title, description, href }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <DashboardCard className="h-full p-5">
        <p className="font-black text-[var(--ink)]">{title}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted-blue)]">{description}</p>
      </DashboardCard>
    </Link>
  );
}
