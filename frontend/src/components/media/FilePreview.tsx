"use client";

import { X } from "lucide-react";
import type { MediaFile } from "@/types/media";
import { formatBytes, formatDate } from "./media-utils";

export function FilePreview({ file, onClose }: { file?: MediaFile | null; onClose: () => void }) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="premium-surface w-full max-w-4xl rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{file.originalName}</h2>
            <p className="text-sm text-muted">{formatBytes(file.fileSize)} • {formatDate(file.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-white/15 p-2 text-muted hover:text-ink" title="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-[22rem] items-center justify-center rounded bg-navy-deep/80 ring-1 ring-white/10">
          {file.fileType.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.cloudinaryUrl} alt={file.originalName} className="max-h-[70vh] rounded object-contain" />
          )}
          {file.fileType.startsWith("video/") && <video src={file.cloudinaryUrl} controls className="max-h-[70vh] w-full rounded" />}
          {file.fileType === "application/pdf" && <iframe src={file.cloudinaryUrl} title={file.originalName} className="h-[70vh] w-full rounded" />}
          {!file.fileType.startsWith("image/") && !file.fileType.startsWith("video/") && file.fileType !== "application/pdf" && (
            <a href={file.cloudinaryUrl} target="_blank" rel="noreferrer" className="rounded bg-gold px-4 py-2 text-sm font-semibold text-navy-deep">
              Open file
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
