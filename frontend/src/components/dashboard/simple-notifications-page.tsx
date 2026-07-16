"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, History, Mail, Megaphone, MessageCircle, Send, Smartphone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createAnnouncement, getAnnouncements, sendPush } from "@/services/communication";
import { getAcademyBatches, getAcademyTeachers } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";

type AudienceMode = "ALL" | "TEACHERS" | "STUDENTS" | "PARENTS" | "BATCH" | "EMERGENCY";
type PanelMode = "all" | "students" | "teachers" | "batch" | "parents" | "emergency" | "templates" | "history";

const panelModes: Array<{ key: PanelMode; label: string; icon: LucideIcon; audience?: AudienceMode }> = [
  { key: "all", label: "Everyone", icon: Megaphone, audience: "ALL" },
  { key: "students", label: "Students", icon: Smartphone, audience: "STUDENTS" },
  { key: "teachers", label: "Teachers", icon: Users, audience: "TEACHERS" },
  { key: "batch", label: "Batch-wise", icon: Users, audience: "BATCH" },
  { key: "parents", label: "Parents", icon: MessageCircle, audience: "PARENTS" },
  { key: "emergency", label: "Emergency", icon: AlertTriangle, audience: "EMERGENCY" },
  { key: "templates", label: "Templates", icon: Megaphone },
  { key: "history", label: "Sent History", icon: History },
];

const templates = [
  { title: "Class Reminder", body: "Please check today's timetable and attend on time." },
  { title: "Fee Reminder", body: "Please complete the pending fee process or contact the office." },
  { title: "Exam Notice", body: "Exam details are updated. Please check your dashboard." },
  { title: "Holiday Notice", body: "Academy schedule has been updated. Please check the latest announcement." },
  { title: "Emergency Alert", body: "Important academy alert. Please check this message immediately and follow instructions from the office." },
  { title: "Parent Update", body: "Dear parent, please check the latest academy update in the dashboard." },
];

export function SimpleNotificationsPage({ owner }: { owner: "Director" | "Academic Head" }) {
  const queryClient = useQueryClient();
  const [panelMode, setPanelMode] = useState<PanelMode>("all");
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
  const isComposerMode = panelMode !== "templates" && panelMode !== "history";

  const audience = useMemo(() => {
    if (audienceMode === "EMERGENCY") return "ALL";
    if (audienceMode === "BATCH") return batchId ? `BATCH:${batchId}` : "STUDENTS";
    return audienceMode;
  }, [audienceMode, batchId]);

  const audienceLabel = audienceMode === "BATCH" && selectedBatch ? selectedBatch.name : audienceMode === "EMERGENCY" ? "Emergency Alert" : audienceMode;

  const publishMutation = useMutation({
    mutationFn: async () => {
      const cleanTitle = title.trim();
      const cleanBody = body.trim();
      if (!cleanTitle || !cleanBody) throw new Error("Enter title and message.");
      const finalTitle = audienceMode === "EMERGENCY" && !cleanTitle.toUpperCase().startsWith("URGENT") ? `URGENT: ${cleanTitle}` : cleanTitle;
      await createAnnouncement({ title: finalTitle, description: cleanBody, audience });
      await sendPush({ title: finalTitle, body: cleanBody, targetAudience: audience });
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

  function choosePanel(mode: PanelMode) {
    setPanelMode(mode);
    const nextAudience = panelModes.find((item) => item.key === mode)?.audience;
    if (nextAudience) setAudienceMode(nextAudience);
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-4 overflow-y-auto pr-0 lg:pr-2">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{owner} Notifications</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">Announcement Control</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-blue)]">Send clear updates to students, teachers, parents or one selected batch with preview and history.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[520px]">
              <Metric label="Teachers" value={teachersQuery.isLoading ? "..." : teachers.length} />
              <Metric label="Students" value={batchesQuery.isLoading ? "..." : totalStudents} />
              <Metric label="Batches" value={batchesQuery.isLoading ? "..." : activeBatches.length} />
            </div>
          </div>
        </header>

        <nav className="grid shrink-0 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {panelModes.map((item) => (
            <ModeButton key={item.key} active={panelMode === item.key} icon={item.icon} label={item.label} onClick={() => choosePanel(item.key)} />
          ))}
        </nav>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          {isComposerMode ? (
          <form onSubmit={submit} className="min-h-0 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Send To</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(["ALL", "TEACHERS", "STUDENTS", "PARENTS", "BATCH", "EMERGENCY"] as AudienceMode[]).map((mode) => (
                <button key={mode} type="button" onClick={() => setAudienceMode(mode)} className={`min-h-12 rounded-xl border px-3 text-sm font-black ${audienceMode === mode ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}>
                  {mode === "ALL" ? "Everyone" : mode === "BATCH" ? "One Batch" : mode === "EMERGENCY" ? "Emergency" : mode}
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
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} className="rounded-xl border border-[var(--border)] p-3 text-sm font-normal" placeholder="Type the announcement..." />
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
          ) : null}

          <section className="min-h-0 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Preview</p>
              <div className={`mt-4 rounded-2xl border p-4 ${audienceMode === "EMERGENCY" ? "border-rose-200 bg-rose-50" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                <div className="flex items-start gap-3">
                  {audienceMode === "EMERGENCY" ? <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-700" /> : <Bell className="mt-1 h-5 w-5 shrink-0 text-[var(--gold)]" />}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted-blue)]">{audienceLabel}</p>
                    <h3 className="mt-2 text-xl font-black">{title || "Announcement title"}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{body || "Message preview will appear here."}</p>
                  </div>
                </div>
              </div>
            </div>

            {panelMode === "templates" ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Templates</p>
              <div className="mt-4 grid max-h-[56vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {templates.map((template) => (
                  <button key={template.title} type="button" onClick={() => { setTitle(template.title); setBody(template.body); choosePanel("all"); }} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-left hover:border-[var(--gold-border)]">
                    <Megaphone className="h-5 w-5 text-[var(--gold)]" />
                    <h3 className="mt-3 font-black">{template.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{template.body}</p>
                  </button>
                ))}
              </div>
            </div>
            ) : null}

            {panelMode === "history" ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Recent</p>
              <div className="mt-4 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                {(announcementsQuery.data ?? []).slice(0, 20).map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.description}</p>
                    <p className="mt-2 text-xs font-black text-[var(--muted-blue)]">{item.audience ?? item.targetAudience ?? "ALL"} / {new Date(item.createdAt).toLocaleString()}</p>
                  </article>
                ))}
                {!announcementsQuery.data?.length ? <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-blue)]">No announcements yet.</p> : null}
              </div>
            </div>
            ) : null}
          </section>
        </section>
      </section>
    </main>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
