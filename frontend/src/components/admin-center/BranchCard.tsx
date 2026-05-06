"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, RadioTower } from "lucide-react";
import type { Branch } from "@/types/admin-center";
import { formatAdminDate } from "./admin-utils";

export function BranchCard({ branch }: { branch: Branch }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-surface rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="rounded bg-gold/15 p-3 text-gold-soft">
          <RadioTower className="h-6 w-6" />
        </div>
        <span className="rounded bg-emerald-400/15 px-2 py-1 text-xs text-emerald-100">Active</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{branch.name}</h3>
      <div className="mt-3 space-y-2 text-sm text-muted">
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-soft" /> {branch.location}</p>
        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold-soft" /> {branch.contactNumber}</p>
      </div>
      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-muted">Commissioned {formatAdminDate(branch.createdAt)}</p>
    </motion.article>
  );
}
