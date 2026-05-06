import type { HTMLAttributes, ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function DashboardCard({ children, className = "", ...props }: DashboardCardProps) {
  return (
    <div
      {...props}
      className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.065] shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_26px_90px_rgba(201,166,70,0.16)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/15" />
      <div className="relative">{children}</div>
    </div>
  );
}

