"use client";

import { motion } from "framer-motion";
import { Download, FileText, ShieldCheck } from "lucide-react";
import type { DocumentItem } from "@/types/media";
import { formatDate } from "./media-utils";

export function DocumentCard({ document }: { document: DocumentItem }) {
  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-surface rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded bg-gold/15 p-3 text-gold-soft">
          <FileText className="h-6 w-6" />
        </div>
        <span className="rounded border border-gold/30 px-3 py-1 text-xs text-gold-soft">{document.category}</span>
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink">{document.title}</h3>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted">{document.description || "Secure academy document ready for review."}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
          {formatDate(document.createdAt)}
        </div>
        <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded bg-gold px-3 py-2 text-xs font-semibold text-navy-deep">
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </motion.article>
  );
}
