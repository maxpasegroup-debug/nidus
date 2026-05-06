"use client";

import { motion } from "framer-motion";
import { Folder, Shield } from "lucide-react";
import type { MediaFolder } from "@/types/media";
import { formatDate } from "./media-utils";

export function FolderCard({ folder, onOpen }: { folder: MediaFolder; onOpen: (folder: MediaFolder) => void }) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(folder)}
      className="premium-surface rounded-lg p-4 text-left transition hover:border-gold/40 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded bg-gold/15 p-3 text-gold-soft">
          <Folder className="h-6 w-6" />
        </div>
        <Shield className="h-4 w-4 text-muted" />
      </div>
      <h3 className="mt-4 truncate text-sm font-semibold text-ink">{folder.name}</h3>
      <p className="mt-1 text-xs text-muted">
        {folder._count?.files ?? 0} files • {folder._count?.children ?? 0} folders
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold-soft">{formatDate(folder.createdAt)}</p>
    </motion.button>
  );
}
