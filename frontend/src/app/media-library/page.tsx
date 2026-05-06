"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Grid3X3, List, Search, UploadCloud } from "lucide-react";
import { FilePreview } from "@/components/media/FilePreview";
import { FolderCard } from "@/components/media/FolderCard";
import { MediaCard } from "@/components/media/MediaCard";
import { StorageAnalytics } from "@/components/media/StorageAnalytics";
import { UploadModal } from "@/components/media/UploadModal";
import { useMediaFiles, useMediaFolders } from "@/hooks/use-media";
import type { MediaFile, MediaFolder } from "@/types/media";

export default function MediaLibraryPage() {
  const [folderStack, setFolderStack] = useState<MediaFolder[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const currentFolder = folderStack.at(-1);
  const folders = useMediaFolders(currentFolder?.id);
  const files = useMediaFiles({ folderId: currentFolder?.id, search: search || undefined });

  const isLoading = folders.isLoading || files.isLoading;
  const fileList = files.data?.files ?? [];
  const folderList = folders.data ?? [];
  const empty = !isLoading && fileList.length === 0 && folderList.length === 0;

  const pathLabel = useMemo(() => ["Command Vault", ...folderStack.map((folder) => folder.name)].join(" / "), [folderStack]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">NIDUS Media Command</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Media Library</h1>
            <p className="mt-2 text-sm text-muted">{pathLabel}</p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft">
            <UploadCloud className="h-5 w-5" />
            Upload
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0">
            <div className="premium-surface flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded bg-navy-deep/70 px-3 py-2 ring-1 ring-white/10">
                <Search className="h-4 w-4 text-muted" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search files by name" />
              </div>
              <div className="flex gap-2">
                {currentFolder && (
                  <button type="button" onClick={() => setFolderStack((items) => items.slice(0, -1))} className="rounded border border-white/15 p-2 text-muted hover:text-ink" title="Back">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <button type="button" onClick={() => setView("grid")} className={`rounded border p-2 ${view === "grid" ? "border-gold/40 text-gold-soft" : "border-white/15 text-muted"}`} title="Grid view">
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setView("list")} className={`rounded border p-2 ${view === "list" ? "border-gold/40 text-gold-soft" : "border-white/15 text-muted"}`} title="List view">
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-lg bg-white/10" />)}</div>}
            {empty && <div className="premium-surface mt-6 rounded-lg p-10 text-center text-muted">No assets in this folder yet.</div>}
            {!isLoading && !empty && (
              <div className={`mt-6 grid gap-4 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                <AnimatePresence>
                  {folderList.map((folder) => <FolderCard key={folder.id} folder={folder} onOpen={(item) => setFolderStack((items) => [...items, item])} />)}
                  {fileList.map((file) => <MediaCard key={file.id} file={file} view={view} onPreview={setPreview} onDelete={(id) => files.remove.mutate(id)} />)}
                </AnimatePresence>
              </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <StorageAnalytics analytics={files.data?.analytics} />
          </motion.div>
        </div>
      </section>
      <UploadModal
        open={modalOpen}
        mode="media"
        onClose={() => setModalOpen(false)}
        pending={files.upload.isPending || folders.create.isPending}
        onUploadMedia={(file) => files.upload.mutate({ file, folderId: currentFolder?.id }, { onSuccess: () => setModalOpen(false) })}
        onCreateFolder={(name) => folders.create.mutate({ name, parentId: currentFolder?.id })}
      />
      <FilePreview file={preview} onClose={() => setPreview(null)} />
    </main>
  );
}
