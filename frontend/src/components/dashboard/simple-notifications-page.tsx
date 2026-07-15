"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, Megaphone, MessageCircle, Send, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createAnnouncement, getAnnouncements, sendPush } from "@/services/communication";
import { getAcademyBatches, getAcademyTeachers } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";

type AudienceMode = "ALL" | "TEACHERS" | "STUDENTS" | "BATCH";

const templates = [
  { title: "Class Reminder", body: "Please check today's timetable and attend on time." },
  { title: "Fee Reminder", body: "Please complete the pending fee process or contact the office." },
  { title: "Exam Notice", body: "Exam details are updated. Please check your dashboard." },
  { title: "Holiday Notice", body: "Academy schedule has been updated. Please check the latest announcement." },
];

export function SimpleNotificationsPage({ owner }: { owner: "Director" | "Academic Head" }) {
  const queryClient = useQueryClient();
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("ALL");
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");

  const teachersQuery = useQuery({ queryKey: ["simple-notifications", "teachers"], queryFn: getAcademyTeachers });
  const batchesQuery = useQuery({ queryKey: ["simple-notifications", "batches"], queryFn: () => getAcademyBatches() });
  const announcementsQuery = useQuery({ queryKey: ["simple-notifications", "announcements"], queryFn: getAnnouncements });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const activeBatches = batches.filter((batch) => batch.status === "ACTIVE");
  const totalStudents = activeBatches.reduce((total, batch) => total + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const selectedBatch = activeBatches.find((batch) => batch.id === batchId);

  const audience = useMemo(() => {
    if (audienceMode === "BATCH") return batchId ? `BATCH:${batchId}` : "STUDENTS";
    return audienceMode;
  }, [audienceMode, batchId]);

  const audienceLabel = audienceMode === "BATCH" && selectedBatch ? selectedBatch.name : audienceMode;

  const publishMutation = useMutation({
    mutationFn: async () => {
      const cleanTitle = title.trim();
      const cleanBody = body.trim();
      if (!cleanTitle || !cleanBody) throw new Error("Enter title and message.");
      await createAnnouncement({ title: cleanTitle, description: cleanBody, audience });
      await sendPush({ title: cleanTitle, body: cleanBody, targetAudience: audience });
    },
    onSuccess: async () => {
      setNotice("Announcement published and push notification queued.");
      setTitle("");
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["simple-notifications", "announcements"] });
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    publishMutation.mutate();
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{owner} Notifications</p>
              <h1 className="mt-2 text-3xl font-black">One-click announcement desk</h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[520px]">
              <Metric label="Teachers" value={teachersQuery.isLoading ? "..." : teachers.length} />
              <Metric label="Students" value={batchesQuery.isLoading ? "..." : totalStudents} />
              <Metric label="Batches" value={batchesQuery.isLoading ? "..." : activeBatches.length} />
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Send To</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["ALL", "TEACHERS", "STUDENTS", "BATCH"] as AudienceMode[]).map((mode) => (
                <button key={mode} type="button" onClick={() => setAudienceMode(mode)} className={`min-h-12 rounded-xl border px-3 text-sm font-black ${audienceMode === mode ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}>
                  {mode === "ALL" ? "Everyone" : mode === "BATCH" ? "One Batch" : mode}
                </button>
              ))}
            </div>

            {audienceMode === "BATCH" ? (
              <label className="mt-4 grid gap-2 text-sm font-black">
                Batch
                <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal">
                  <option value="">Select batch</option>
                  {activeBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
              </label>
            ) : null}

            <label className="mt-4 grid gap-2 text-sm font-black">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] px-3 text-sm font-normal" placeholder="Example: Class reminder" />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-black">
              Message
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} className="rounded-xl border border-[var(--border)] p-3 text-sm font-normal" placeholder="Type the announcement..." />
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <Channel icon={Bell} label="Dashboard" active />
              <Channel icon={Smartphone} label="Push" active />
              <Channel icon={Mail} label="Email" />
              <Channel icon={MessageCircle} label="WhatsApp" />
            </div>

            <button disabled={publishMutation.isPending || (audienceMode === "BATCH" && !batchId)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> {publishMutation.isPending ? "Sending..." : `Send to ${audienceLabel}`}
            </button>
            {notice ? <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">{notice}</p> : null}
          </form>

          <section className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Templates</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {templates.map((template) => (
                  <button key={template.title} type="button" onClick={() => { setTitle(template.title); setBody(template.body); }} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-left hover:border-[var(--gold-border)]">
                    <Megaphone className="h-5 w-5 text-[var(--gold)]" />
                    <h3 className="mt-3 font-black">{template.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{template.body}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Recent</p>
              <div className="mt-4 grid gap-3">
                {(announcementsQuery.data ?? []).slice(0, 5).map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.description}</p>
                    <p className="mt-2 text-xs font-black text-[var(--muted-blue)]">{item.audience ?? item.targetAudience ?? "ALL"} / {new Date(item.createdAt).toLocaleString()}</p>
                  </article>
                ))}
                {!announcementsQuery.data?.length ? <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-blue)]">No announcements yet.</p> : null}
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function Channel({ icon: Icon, label, active = false }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <div className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-xs font-black ${active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-dashed border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}
