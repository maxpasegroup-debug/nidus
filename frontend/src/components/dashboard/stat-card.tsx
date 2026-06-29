"use client";

import { motion } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type StatCardProps = {
  label: string;
  value: string;
  note: string;
};

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <DashboardCard className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
        <p className="mt-3 text-4xl font-black text-[var(--ink)]">{value}</p>
        <p className="mt-3 text-sm font-medium leading-6 text-[var(--muted-blue)]">{note}</p>
      </DashboardCard>
    </motion.div>
  );
}
