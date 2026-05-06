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
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-4 text-4xl font-semibold text-gold-soft">{value}</p>
        <p className="mt-3 text-sm leading-6 text-muted">{note}</p>
      </DashboardCard>
    </motion.div>
  );
}
