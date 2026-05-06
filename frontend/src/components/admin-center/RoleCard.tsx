"use client";

import { motion } from "framer-motion";
import { Pencil, Shield, Trash2, Users } from "lucide-react";
import type { AdminRole } from "@/types/admin-center";

export function RoleCard({ role, onEdit, onDelete }: { role: AdminRole; onEdit: (role: AdminRole) => void; onDelete: (id: string) => void }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-surface rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded bg-gold/15 p-3 text-gold-soft">
          <Shield className="h-6 w-6" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onEdit(role)} className="rounded border border-white/15 p-2 text-muted hover:text-ink" title="Edit role">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(role.id)} className="rounded border border-red-300/20 p-2 text-red-200 hover:bg-red-400/10" title="Delete role">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{role.name}</h3>
      <p className="mt-2 min-h-10 text-sm text-muted">{role.description || "Custom access group for operational command duties."}</p>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted">
        <span>{role.permissions.length} permissions</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-4 w-4" />
          {role._count?.users ?? 0} users
        </span>
      </div>
    </motion.article>
  );
}
