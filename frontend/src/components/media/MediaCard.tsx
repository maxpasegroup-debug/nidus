"use client";

import { motion } from "framer-motion";
import { Download, FileImage, FileText, Trash2, Video } from "lucide-react";
import type { MediaFile } from "@/types/media";
import { formatBytes, formatDate, mediaKind } from "./media-utils";

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <FileImage className="h-6 w-6 text-gold-soft" />;
  if (type.startsWith("video/")) return <Video className="h-6 w-6 text-sky-200" />;
  return <FileText className="h-6 w-6 text-emerald-200" />;
}

export function MediaCard({ file, view, onPreview, onDelete }: { file: MediaFile; view: "grid" | "list"; onPreview: (file: MediaFile) => void; onDelete: (id: string) => void }) {
  const isGrid = view === "grid";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`premium-surface rounded-lg border-white/10 ${isGrid ? "p-4" : "flex items-center gap-4 p-3"}`}
    >
      <button
        type="button"
        onClick={() => onPreview(file)}
        className={`flex min-w-0 text-left ${isGrid ? "w-full flex-col gap-4" : "flex-1 items-center gap-4"}`}
      >
        <div className={`${isGrid ? "aspect-[4/3] w-full" : "h-14 w-16"} flex shrink-0 items-center justify-center rounded bg-navy-deep/70 ring-1 ring-white/10`}>
          {file.fileType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.cloudinaryUrl} alt={file.originalName} className="h-full w-full rounded object-cover" />
          ) : (
            <FileIcon type={file.fileType} />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{file.originalName}</h3>
          <p className="mt-1 text-xs text-muted">{mediaKind(file.fileType)} • {formatBytes(file.fileSize)} • {formatDate(file.createdAt)}</p>
        </div>
      </button>
      <div className={`flex shrink-0 gap-2 ${isGrid ? "mt-4" : ""}`}>
        <a href={file.cloudinaryUrl} target="_blank" rel="noreferrer" className="rounded border border-gold/30 p-2 text-gold-soft transition hover:bg-gold/10" title="Open file">
          <Download className="h-4 w-4" />
        </a>
        <button type="button" onClick={() => onDelete(file.id)} className="rounded border border-red-300/20 p-2 text-red-200 transition hover:bg-red-400/10" title="Delete file">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}
