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
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </DashboardCard>
    </Link>
  );
}

