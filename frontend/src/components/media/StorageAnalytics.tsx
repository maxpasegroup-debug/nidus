"use client";

import { BarChart3, Database, UploadCloud } from "lucide-react";
import type { StorageAnalyticsData } from "@/types/media";
import { formatBytes, mediaKind } from "./media-utils";

export function StorageAnalytics({ analytics }: { analytics?: StorageAnalyticsData }) {
  const items = analytics?.fileTypeDistribution ?? [];
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <aside className="premium-surface rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Storage Command</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">Repository status</h2>
        </div>
        <BarChart3 className="h-5 w-5 text-gold-soft" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded bg-navy-deep/60 p-4 ring-1 ring-white/10">
          <UploadCloud className="h-5 w-5 text-gold-soft" />
          <p className="mt-3 text-2xl font-semibold">{analytics?.totalUploads ?? 0}</p>
          <p className="text-xs text-muted">Total uploads</p>
        </div>
        <div className="rounded bg-navy-deep/60 p-4 ring-1 ring-white/10">
          <Database className="h-5 w-5 text-sky-200" />
          <p className="mt-3 text-2xl font-semibold">{formatBytes(analytics?.storageUsage ?? 0)}</p>
          <p className="text-xs text-muted">Storage used</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="rounded border border-dashed border-white/15 p-4 text-sm text-muted">No media distribution yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.fileType}>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{mediaKind(item.fileType)}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-white/10">
                <div className="h-full rounded bg-gold" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
