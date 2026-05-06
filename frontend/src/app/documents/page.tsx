"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Search } from "lucide-react";
import { DocumentCard } from "@/components/media/DocumentCard";
import { UploadModal } from "@/components/media/UploadModal";
import { useDocuments } from "@/hooks/use-media";

const categories = ["All", "Faculty Notes", "SOP", "Assignments", "Circulars", "Training Material"];

export default function DocumentsPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const documents = useDocuments(category === "All" ? undefined : category);
  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (documents.data ?? []).filter((item) => !query || item.title.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query));
  }, [documents.data, search]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Faculty Knowledge Base</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Documents</h1>
            <p className="mt-2 text-sm text-muted">Notes, circulars, SOPs, and training PDFs under one secure command view.</p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft">
            <Plus className="h-5 w-5" />
            New document
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="premium-surface rounded-lg p-4">
            <div className="flex items-center gap-2 text-gold-soft">
              <FileText className="h-5 w-5" />
              <h2 className="font-semibold">Categories</h2>
            </div>
            <div className="mt-4 space-y-2">
              {categories.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={`w-full rounded px-3 py-2 text-left text-sm transition ${category === item ? "bg-gold text-navy-deep" : "text-muted hover:bg-white/10 hover:text-ink"}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded border border-dashed border-gold/30 p-4">
              <p className="text-sm font-semibold text-ink">Secure PDF preview</p>
              <p className="mt-2 text-xs text-muted">Documents open in a protected browser preview with direct download access.</p>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="premium-surface flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search faculty notes and PDFs" />
            </div>
            {documents.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-white/10" />)}</div>}
            {!documents.isLoading && items.length === 0 && <div className="premium-surface mt-6 rounded-lg p-10 text-center text-muted">No documents match this view.</div>}
            {!documents.isLoading && items.length > 0 && (
              <motion.div layout className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((document) => <DocumentCard key={document.id} document={document} />)}
              </motion.div>
            )}
          </div>
        </div>
      </section>
      <UploadModal
        open={modalOpen}
        mode="document"
        onClose={() => setModalOpen(false)}
        pending={documents.create.isPending}
        onCreateDocument={(payload) => documents.create.mutate(payload, { onSuccess: () => setModalOpen(false) })}
      />
    </main>
  );
}
