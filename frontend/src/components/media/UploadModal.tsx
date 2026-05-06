"use client";

import { useState, type FormEvent } from "react";
import { FileUp, FolderPlus, X } from "lucide-react";

type UploadModalProps = {
  open: boolean;
  mode: "media" | "document";
  onClose: () => void;
  onUploadMedia?: (file: File) => void;
  onCreateFolder?: (name: string) => void;
  onCreateDocument?: (payload: { title: string; description?: string; category: string; file?: File }) => void;
  pending?: boolean;
};

export function UploadModal({ open, mode, onClose, onUploadMedia, onCreateFolder, onCreateDocument, pending }: UploadModalProps) {
  const [file, setFile] = useState<File | undefined>();
  const [folderName, setFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Faculty Notes");

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "document") {
      onCreateDocument?.({ title, description, category, file });
      return;
    }
    if (file) onUploadMedia?.(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="premium-surface w-full max-w-xl rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">{mode === "document" ? "Document Dispatch" : "Media Upload"}</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{mode === "document" ? "Publish faculty material" : "Add secure asset"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-white/15 p-2 text-muted hover:text-ink" title="Close upload modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        {mode === "media" && (
          <div className="mt-5 rounded border border-dashed border-gold/30 p-4">
            <label className="text-sm font-semibold text-ink" htmlFor="folderName">Create folder</label>
            <div className="mt-3 flex gap-2">
              <input id="folderName" value={folderName} onChange={(event) => setFolderName(event.target.value)} className="min-w-0 flex-1 rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Batch notes, campaigns, lectures" />
              <button type="button" onClick={() => folderName.trim() && onCreateFolder?.(folderName.trim())} className="rounded bg-gold px-3 py-2 text-navy-deep" title="Create folder">
                <FolderPlus className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "document" && (
            <>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Document title" required />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60">
                {["Faculty Notes", "SOP", "Assignments", "Circulars", "Training Material"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Brief description" />
            </>
          )}
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-white/20 bg-navy-deep/50 p-5 text-center hover:border-gold/50">
            <FileUp className="h-8 w-8 text-gold-soft" />
            <span className="mt-3 text-sm font-semibold">{file ? file.name : "Choose image, PDF, or video"}</span>
            <span className="mt-1 text-xs text-muted">Maximum file size: 50 MB</span>
            <input type="file" className="hidden" accept="image/*,application/pdf,video/*" onChange={(event) => setFile(event.target.files?.[0])} />
          </label>
          <button type="submit" disabled={pending || (mode === "media" && !file)} className="w-full rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Uploading..." : mode === "document" ? "Publish document" : "Upload file"}
          </button>
        </form>
      </div>
    </div>
  );
}
