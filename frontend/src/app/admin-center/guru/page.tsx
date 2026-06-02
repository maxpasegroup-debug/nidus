"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookOpenCheck, Plus } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { createGuruQuest, getGuruAdminProgress, getGuruAdminQuests, getGuruAdminSummary, type GuruProgressAdmin, type GuruQuestAdmin } from "@/services/mobile-guru";
import { getApiErrorMessage } from "@/services/api";

const initialForm = {
  slug: "",
  title: "",
  description: "",
  duration: "7 days",
  introduction: "",
  status: "draft",
  certificateTitle: "",
  sortOrder: 0
};

export default function GuruAdminPage() {
  const [summary, setSummary] = useState({ quests: 0, progress: 0, certificates: 0 });
  const [quests, setQuests] = useState<GuruQuestAdmin[]>([]);
  const [progress, setProgress] = useState<GuruProgressAdmin[]>([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [summaryData, questData, progressData] = await Promise.all([
        getGuruAdminSummary(),
        getGuruAdminQuests(),
        getGuruAdminProgress()
      ]);
      setSummary(summaryData);
      setQuests(questData);
      setProgress(progressData);
    } catch (error) {
      setStatus(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    try {
      await createGuruQuest(form);
      setForm(initialForm);
      setStatus("Quest created. Add lessons, reflections and challenges through API/admin expansion.");
      await load();
    } catch (error) {
      setStatus(getApiErrorMessage(error));
    }
  }

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">NIDUS Guru Admin</p>
              <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Quest content control</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage published transformation quests for the mobile app. Mobile only sees published quests.</p>
            </div>
            <button onClick={() => void load()} className="rounded border border-white/15 px-4 py-3 text-sm font-semibold text-ink transition hover:border-gold/50">Refresh</button>
          </div>

          {status ? <div className="mt-5 rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold-soft">{status}</div> : null}

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat label="Quests" value={summary.quests} />
            <Stat label="Progress Records" value={summary.progress} />
            <Stat label="Certificates Issued" value={summary.certificates} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
            <div className="overflow-hidden rounded-lg border border-white/10">
              <div className="grid min-w-[760px] grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] bg-white/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <span>Quest</span>
                <span>Slug</span>
                <span>Status</span>
                <span>Locked</span>
                <span>Order</span>
              </div>
              {loading ? <div className="p-5 text-sm text-muted">Loading Guru quests...</div> : quests.map((quest) => (
                <div key={quest.id} className="grid min-w-[760px] grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] items-center border-t border-white/10 px-4 py-4 text-sm">
                  <span className="font-semibold text-ink">{quest.title}</span>
                  <span className="text-muted">{quest.slug}</span>
                  <span className="text-gold-soft">{quest.status}</span>
                  <span className="text-muted">{quest.locked ? "Yes" : "No"}</span>
                  <span className="text-muted">{quest.sortOrder}</span>
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="premium-surface rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="rounded bg-gold/15 p-3 text-gold-soft">
                  <BookOpenCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink">Create Quest</h2>
                  <p className="text-sm text-muted">Use draft first. Publish when ready.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Input label="Slug" value={form.slug} onChange={(value) => setForm((item) => ({ ...item, slug: value }))} />
                <Input label="Title" value={form.title} onChange={(value) => setForm((item) => ({ ...item, title: value }))} />
                <Input label="Duration" value={form.duration} onChange={(value) => setForm((item) => ({ ...item, duration: value }))} />
                <textarea value={form.description} onChange={(event) => setForm((item) => ({ ...item, description: event.target.value }))} className="min-h-20 rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Description" required />
                <textarea value={form.introduction} onChange={(event) => setForm((item) => ({ ...item, introduction: event.target.value }))} className="min-h-20 rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Introduction" required />
                <select value={form.status} onChange={(event) => setForm((item) => ({ ...item, status: event.target.value }))} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60">
                  <option value="draft">draft</option>
                  <option value="review">review</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
                <button className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep">
                  <Plus className="h-5 w-5" /> Create Quest
                </button>
              </div>
            </form>
          </section>

          <section className="mt-6 rounded-lg border border-white/10 p-5">
            <h2 className="text-xl font-semibold text-ink">Recent progress</h2>
            <div className="mt-4 grid gap-3">
              {progress.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
                  User {item.userId} - {item.status} - {item.completionPercent}%
                </div>
              ))}
              {!progress.length ? <p className="text-sm text-muted">No mobile Guru progress yet.</p> : null}
            </div>
          </section>
        </section>
      </main>
    </RoleDashboardGuard>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" required />
    </label>
  );
}
