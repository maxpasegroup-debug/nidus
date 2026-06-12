"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileArchive, FileText, FolderPlus, Link as LinkIcon, PlayCircle, ShieldCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    folderName: "",
    subject: "",
    topic: "",
    materialTitle: "",
    materialType: "Recorded Class",
    materialUrl: "",
  });

  const batchesQuery = useQuery({
    queryKey: ["director", "materials", "batches"],
    queryFn: () => apiJson<BatchOption[]>("/api/academy/batches"),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(
      "Material draft prepared. File storage/publish API can now connect this form to real uploads without changing the Director workflow.",
    );
  };

  const batches = batchesQuery.data ?? [];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Study Materials</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Batch library control</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Organize recorded classes, notes, PDFs, links and topic resources by batch. This page is launch-safe and shows no
            fake material data.
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
                    <option>Recorded Class</option>
                    <option>PDF Notes</option>
                    <option>Worksheet</option>
                    <option>Reference Link</option>
                    <option>Photo / Diagram</option>
                  </select>
                </label>
              </div>
              <Field label="Material title" value={form.materialTitle} onChange={(value) => setForm((item) => ({ ...item, materialTitle: value }))} required />
              <Field label="Video/file/link URL" value={form.materialUrl} onChange={(value) => setForm((item) => ({ ...item, materialUrl: value }))} />
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                <Upload className="h-5 w-5" />
                Prepare Material
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

        <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <LinkIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black">Launch note</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                This page prepares the final Director workflow. To make uploads fully live, connect this form to storage and a
                material table. Until then, no fake material files are displayed.
              </p>
            </div>
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
