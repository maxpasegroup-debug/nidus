"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileArchive, FileText, FolderPlus, Link as LinkIcon, PlayCircle, ShieldCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  archiveStudyMaterial,
  getMaterialSummary,
  publishStudyMaterial,
  reviewStudyMaterial,
} from "@/services/academy";

type BatchOption = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  programSlug?: string | null;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load materials data");
  }

  return response.json() as Promise<T>;
}

const materialControls = [
  { id: "folders", title: "Batch Folders", text: "Create folders by program, batch, subject and topic.", icon: FolderPlus },
  { id: "recorded", title: "Recorded Classes", text: "Attach recorded class links or uploaded videos.", icon: PlayCircle },
  { id: "notes", title: "Notes & PDFs", text: "Publish notes, PDFs, worksheets and reference files.", icon: FileText },
  { id: "publish", title: "Publish To Batch", text: "Students see only materials assigned to their approved batch.", icon: ShieldCheck },
] as const;

export default function DirectorMaterialsPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    folderName: "",
    subject: "",
    topic: "",
    materialTitle: "",
    materialType: "Video",
    materialUrl: "",
    fileName: "",
  });

  const batchesQuery = useQuery({
    queryKey: ["director", "materials", "batches"],
    queryFn: () => apiJson<BatchOption[]>("/api/academy/batches"),
  });
  const materialsQuery = useQuery({
    queryKey: ["director", "materials", "summary"],
    queryFn: () => getMaterialSummary(),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["director", "materials", "summary"] });
  };

  const publishMutation = useMutation({
    mutationFn: publishStudyMaterial,
    onSuccess: () => {
      setNotice("Material published to selected batch.");
      setForm({ batchId: "", folderName: "", subject: "", topic: "", materialTitle: "", materialType: "Video", materialUrl: "", fileName: "" });
      refresh();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not publish material."),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, reviewStatus }: { id: string; reviewStatus: string }) => reviewStudyMaterial(id, { reviewStatus }),
    onSuccess: () => {
      setNotice("Material review updated.");
      refresh();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not review material."),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveStudyMaterial,
    onSuccess: () => {
      setNotice("Material archived.");
      refresh();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not archive material."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const batch = batches.find((item) => item.id === form.batchId);
    publishMutation.mutate({
      batchId: form.batchId,
      batchName: batch?.name,
      folder: form.folderName || batch?.name,
      subject: form.subject,
      topic: form.topic,
      title: form.materialTitle,
      type: form.materialType,
      url: form.materialUrl || undefined,
      fileName: form.fileName || undefined,
      status: "PUBLISHED",
    });
  };

  const batches = batchesQuery.data ?? [];
  const materialData = materialsQuery.data;
  const materials = materialData?.materials ?? [];
  const summary = materialData?.summary;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Study Materials</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Batch library control</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Organize recorded classes, notes, PDFs, links and topic resources by batch. Empty states remain clean until
            teachers or management publish materials.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {materialControls.map((control) => (
            <ControlCard key={control.id} control={control} />
          ))}
        </section>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Material Draft</p>
            <h2 className="mt-2 text-2xl font-black">Prepare material for batch</h2>
            <form onSubmit={submit} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Select batch
                <select
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  required
                  value={form.batchId}
                  onChange={(event) => setForm((item) => ({ ...item, batchId: event.target.value }))}
                >
                  <option value="">Choose batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} {batch.programSlug ? `- ${batch.programSlug}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Folder name" value={form.folderName} onChange={(value) => setForm((item) => ({ ...item, folderName: value }))} required />
                <Field label="Subject" value={form.subject} onChange={(value) => setForm((item) => ({ ...item, subject: value }))} required />
                <Field label="Topic" value={form.topic} onChange={(value) => setForm((item) => ({ ...item, topic: value }))} required />
                <label className="grid gap-2 text-sm font-bold">
                  Material type
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={form.materialType}
                    onChange={(event) => setForm((item) => ({ ...item, materialType: event.target.value }))}
                  >
                    <option>PDF</option>
                    <option>DOCX</option>
                    <option>PPT</option>
                    <option>Video</option>
                    <option>External Link</option>
                    <option>Question Bank File</option>
                    <option>Notes</option>
                  </select>
                </label>
              </div>
              <Field label="Material title" value={form.materialTitle} onChange={(value) => setForm((item) => ({ ...item, materialTitle: value }))} required />
              <Field label="Video/file/link URL" value={form.materialUrl} onChange={(value) => setForm((item) => ({ ...item, materialUrl: value }))} />
              <Field label="File name" value={form.fileName} onChange={(value) => setForm((item) => ({ ...item, fileName: value }))} />
              <button
                disabled={publishMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:opacity-60"
              >
                <Upload className="h-5 w-5" />
                Publish Material
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Batch Folders</p>
            <h2 className="mt-2 text-2xl font-black">Available batches</h2>
            <div className="mt-5 grid gap-3">
              {batches.map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black">{batch.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">
                        {batch.batchType ?? "Batch"} / {batch.status ?? "ACTIVE"} / {batch.programSlug ?? "Academy"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {!batches.length && <Empty text="No batches available. Create a batch in Academic Department before publishing materials." />}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Live Library</p>
              <h2 className="mt-2 text-2xl font-black">Published materials</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
              <span className="rounded-xl bg-[var(--page-bg)] px-3 py-2">{summary?.total ?? 0} total</span>
              <span className="rounded-xl bg-[var(--page-bg)] px-3 py-2">{summary?.pendingReview ?? 0} review</span>
              <span className="rounded-xl bg-[var(--page-bg)] px-3 py-2">{summary?.links ?? 0} links</span>
              <span className="rounded-xl bg-[var(--page-bg)] px-3 py-2">{summary?.files ?? 0} files</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {materials.map((material) => (
              <article key={material.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                      {material.batchName ?? "Batch"} / {material.subject ?? "Subject"}
                    </p>
                    <h3 className="mt-2 text-xl font-black">{material.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">
                      {material.folder ?? "Folder"} / {material.topic ?? "Topic"} / {material.type}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
                    {material.reviewStatus ?? "PENDING_REVIEW"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {material.url ? (
                    <a href={material.url} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold">
                      <LinkIcon className="mr-1 inline h-4 w-4" />
                      Open
                    </a>
                  ) : null}
                  <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-800" onClick={() => reviewMutation.mutate({ id: material.id, reviewStatus: "APPROVED" })}>
                    Approve
                  </button>
                  <button className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-800" onClick={() => reviewMutation.mutate({ id: material.id, reviewStatus: "REJECTED" })}>
                    Reject
                  </button>
                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800" onClick={() => archiveMutation.mutate(material.id)}>
                    Archive
                  </button>
                </div>
              </article>
            ))}
            {!materials.length && <Empty text="No materials have been published yet." />}
          </div>
        </section>
      </section>
    </main>
  );
}

function ControlCard({ control }: { control: { id: string; title: string; text: string; icon: LucideIcon } }) {
  const Icon = control.icon;
  return (
    <article id={control.id} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-xl font-black">{control.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{control.text}</p>
    </article>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">{text}</div>;
}
