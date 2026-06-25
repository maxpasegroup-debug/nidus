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
  thumbnailUrl?: string | null;
  fileSize?: number | null;
  durationSeconds?: number | null;
  lessonName?: string | null;
  teacherName?: string | null;
  reviewStatus?: string | null;
  createdAt?: string;
  status?: string | null;
};

async function apiJson<T>(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
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
    queryFn: () => apiJson<{ materials?: StudyMaterial[] }>("/api/academy/my-plan"),
  });
  const materials = planQuery.data?.materials ?? [];
  const material = materials.find((item) => item.id === materialId);
  const relatedLessons = material
    ? materials
        .filter((item) => item.id !== material.id && item.status !== "ARCHIVED" && item.subject === material.subject && (item.topic === material.topic || !material.topic))
        .slice(0, 6)
    : [];
  const uploadedAt = material?.createdAt ? new Date(material.createdAt).toLocaleDateString() : "Upload date pending";
  const fileSize = material?.fileSize ? `${(material.fileSize / 1024 / 1024).toFixed(1)} MB` : "Size pending";
  const duration = material?.durationSeconds ? `${Math.max(1, Math.round(material.durationSeconds / 60))} min` : "Duration pending";

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
              <h1 className="mt-3 text-3xl font-black md:text-5xl">{material.lessonName || material.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                {material.description ?? `${material.batchName ?? "Your batch"} lesson uploaded by ${material.teacherName ?? "NIDUS Academy"}.`}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Batch" value={material.batchName ?? "Assigned batch"} />
                <Info label="Teacher" value={material.teacherName ?? "NIDUS Academy"} />
                <Info label="Uploaded" value={uploadedAt} />
                <Info label="Duration" value={isVideo(material) ? duration : fileSize} />
              </div>
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
                  <Info label="Type" value={material.type} />
                  <Info label="File" value={material.fileName ?? "Online material"} />
                  <Info label="Size" value={fileSize} />
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

            <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Teacher Notes</p>
                <h2 className="mt-2 text-2xl font-black">Lesson guidance</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
                  {material.description || "No additional teacher notes have been added for this lesson yet."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Related Lessons</p>
                    <h2 className="mt-2 text-2xl font-black">{material.topic || material.subject || "Learning"} library</h2>
                  </div>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{relatedLessons.length} lesson(s)</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {relatedLessons.map((lesson) => (
                    <Link key={lesson.id} href={`/dashboard/student/lesson/${lesson.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:-translate-y-0.5 hover:bg-white">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{lesson.type}</p>
                      <h3 className="mt-2 font-black">{lesson.lessonName || lesson.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">{lesson.subject || "Subject"} / {lesson.topic || "Topic"}</p>
                    </Link>
                  ))}
                  {!relatedLessons.length ? (
                    <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm text-[var(--muted-blue)]">
                      Related lessons will appear here after your teacher publishes more content in this topic.
                    </p>
                  ) : null}
                </div>
              </div>
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
