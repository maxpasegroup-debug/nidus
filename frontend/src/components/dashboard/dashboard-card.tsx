import type { HTMLAttributes, ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function DashboardCard({ children, className = "", ...props }: DashboardCardProps) {
  return (
    <div
      {...props}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/90 shadow-[0_10px_30px_rgba(7,29,54,0.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white hover:shadow-[0_18px_46px_rgba(7,29,54,0.1)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold-border)] to-transparent opacity-70" />
      <div className="relative">{children}</div>
    </div>
  );
}
