"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, FileText, PlayCircle } from "lucide-react";

type StudyMaterial = {
  id: string;
  batchName?: string | null;
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  title: string;
  description?: string | null;
  type: string;
  url?: string | null;
  fileName?: string | null;
  teacherName?: string | null;
  reviewStatus?: string | null;
  createdAt?: string;
};

async function apiJson<T>(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const response = await fetch(`${base}${path}`, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load lesson");
  return response.json() as Promise<T>;
}

function isVideo(material?: StudyMaterial) {
  return Boolean(material?.url && material.type?.toUpperCase().includes("VIDEO"));
}

export default function StudentLessonPage() {
  const params = useParams<{ materialId: string }>();
  const materialId = params?.materialId ?? "";
  const planQuery = useQuery({
    queryKey: ["student", "lesson", materialId],
    queryFn: () => apiJson<{ materials?: StudyMaterial[] }>("/academy/my-plan"),
  });
  const material = planQuery.data?.materials?.find((item) => item.id === materialId);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8 text-[var(--navy)]">
      <div className="mx-auto max-w-6xl space-y-5">
        <Link href="/dashboard/student#library" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>

        {planQuery.isLoading ? <LessonShell title="Loading lesson..." /> : null}
        {planQuery.isError ? <LessonShell title="Lesson unavailable" note="Please try again from your student Library." /> : null}
        {!planQuery.isLoading && !material ? <LessonShell title="Lesson not found" note="This lesson is not assigned to your active batch." /> : null}

        {material ? (
          <>
            <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{material.subject ?? "Learning"} {material.topic ? `/ ${material.topic}` : ""}</p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">{material.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                {material.description ?? `${material.batchName ?? "Your batch"} lesson uploaded by ${material.teacherName ?? "NIDUS Academy"}.`}
              </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-sm">
                {isVideo(material) ? (
                  <video className="aspect-video w-full rounded-2xl bg-black" controls src={material.url ?? undefined} />
                ) : (
                  <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] text-center">
                    <div>
                      <FileText className="mx-auto h-10 w-10 text-[var(--gold)]" />
                      <h2 className="mt-3 text-2xl font-black">Study material</h2>
                      <p className="mt-2 text-sm text-[var(--muted-blue)]">Open or download the attached file below.</p>
                    </div>
                  </div>
                )}
              </div>

              <aside className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Lesson Files</p>
                <h2 className="mt-2 text-2xl font-black">Notes & Attachments</h2>
                <div className="mt-5 space-y-3">
                  <Info label="Batch" value={material.batchName ?? "Assigned batch"} />
                  <Info label="Type" value={material.type} />
                  <Info label="File" value={material.fileName ?? "Online material"} />
                  {material.url ? (
                    <a href={material.url} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black">
                      {isVideo(material) ? <PlayCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {isVideo(material) ? "Open Video Source" : "Open / Download"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm text-[var(--muted-blue)]">No downloadable URL is attached yet.</p>
                  )}
                </div>
              </aside>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function LessonShell({ title, note }: { title: string; note?: string }) {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-black">{title}</h1>
      {note ? <p className="mt-3 text-sm text-[var(--muted-blue)]">{note}</p> : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
