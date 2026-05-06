"use client";

import { motion } from "framer-motion";
import { Fingerprint } from "lucide-react";
import type { AuditLog } from "@/types/admin-center";
import { formatAdminDate } from "./admin-utils";

export function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return <div className="premium-surface rounded-lg p-8 text-center text-muted">No audit activity recorded yet.</div>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <motion.article key={log.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-surface flex gap-4 rounded-lg p-4">
          <div className="mt-1 h-9 w-9 shrink-0 rounded bg-gold/15 p-2 text-gold-soft">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="truncate text-sm font-semibold text-ink">{log.description}</h3>
              <span className="text-xs text-muted">{formatAdminDate(log.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {log.user?.name ?? "System"} • {log.module} • {log.action} • {log.ipAddress ?? "no-ip"}
            </p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
