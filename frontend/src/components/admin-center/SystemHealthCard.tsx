"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck } from "lucide-react";

export function SystemHealthCard({ label, status, value }: { label: string; status: string; value?: string | number }) {
  const good = ["OPERATIONAL", "CONNECTED", "ACTIVE", "MONITORED", "READY", "HEALTHY"].includes(status);

  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-surface rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="rounded bg-gold/15 p-3 text-gold-soft">
          {good ? <ShieldCheck className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
        </div>
        <span className={`rounded px-2 py-1 text-xs ${good ? "bg-emerald-400/15 text-emerald-100" : "bg-red-400/15 text-red-100"}`}>{status}</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-muted">{label}</h3>
      <p className="mt-2 text-3xl font-semibold text-ink">{value ?? status}</p>
    </motion.article>
  );
}
