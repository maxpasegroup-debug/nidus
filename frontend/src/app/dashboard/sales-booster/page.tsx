"use client";

import { BarChart3, FileUp, Megaphone, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const workflow = [
  { title: "Upload Creative", text: "Poster, reel, brochure or ad video.", icon: FileUp },
  { title: "Write Goal", text: "Example: NDA admission campaign for Kerala students.", icon: Megaphone },
  { title: "Review Campaign", text: "AI prepares caption, targeting, WhatsApp message and schedule.", icon: ShieldCheck },
  { title: "Run & Follow Up", text: "Publish, promote and send leads to WhatsApp/counselling.", icon: Send },
];

export default function SalesBoosterDashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Sales Booster</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">NIDUS campaign control room</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            A simple marketing workspace for Academy promotions, TOPRANK, NIDUS Guru and Assessments. Social and WhatsApp APIs
            activate after Railway variables and provider approvals are configured.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-6 w-6 text-[var(--navy)]" />
                </div>
                <h2 className="mt-5 text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Campaign Builder</p>
            <h2 className="mt-2 text-2xl font-black">Prepare campaign</h2>
            <textarea
              className="mt-5 min-h-36 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
              placeholder="Type campaign goal here..."
            />
            <button className="mt-4 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
              Generate Campaign Draft
            </button>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Status</p>
            <h2 className="mt-2 text-2xl font-black">Connections</h2>
            <div className="mt-5 grid gap-3">
              <Status icon={Megaphone} title="Meta Ads / Facebook / Instagram" />
              <Status icon={MessageCircle} title="WhatsApp Cloud API" />
              <Status icon={BarChart3} title="YouTube / Threads / Analytics" />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Status({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--gold)]" />
        <span className="font-bold">{title}</span>
      </div>
      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
        Setup Required
      </span>
    </div>
  );
}
