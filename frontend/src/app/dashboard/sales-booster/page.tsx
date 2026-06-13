"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileArchive,
  FileUp,
  Megaphone,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Video as Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const workflow = [
  { id: "creatives", title: "Upload Creative", text: "Poster, reel, brochure or ad video.", icon: FileUp },
  { id: "campaigns", title: "Write Goal", text: "Example: NDA admission campaign for Kerala students.", icon: Megaphone },
  { id: "review", title: "Review Campaign", text: "AI prepares caption, targeting, WhatsApp message and schedule.", icon: ShieldCheck },
  { id: "leads", title: "Run & Follow Up", text: "Publish, promote and send leads to WhatsApp/counselling.", icon: Send },
];

const campaignTypes = ["Academy Admissions", "TOPRANK Exam Coaching", "NIDUS Guru", "Assessments", "Workshop / Event"];

export default function SalesBoosterDashboardPage() {
  const [notice, setNotice] = useState("");
  const [campaign, setCampaign] = useState({
    type: "Academy Admissions",
    goal: "",
    audience: "",
    budget: "",
    whatsappMessage: "",
    creativeName: "",
  });

  const submitCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Campaign draft prepared for review. Connect Meta/WhatsApp APIs to publish and automate.");
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Sales Booster</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">NIDUS campaign control room</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            A simple marketing workspace for Academy promotions, TOPRANK, NIDUS Guru and Assessments. Prepare campaigns now;
            API publishing activates after provider connections are configured.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {workflow.map((item) => (
            <WorkflowCard key={item.id} item={item} />
          ))}
        </section>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div id="campaigns" className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Campaign Builder</p>
            <h2 className="mt-2 text-2xl font-black">Prepare campaign draft</h2>
            <form onSubmit={submitCampaign} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Campaign type
                <select
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  value={campaign.type}
                  onChange={(event) => setCampaign((item) => ({ ...item, type: event.target.value }))}
                >
                  {campaignTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Field label="Creative name / file reference" value={campaign.creativeName} onChange={(value) => setCampaign((item) => ({ ...item, creativeName: value }))} />
              <Field label="Campaign goal" value={campaign.goal} onChange={(value) => setCampaign((item) => ({ ...item, goal: value }))} required />
              <Field label="Target audience" value={campaign.audience} onChange={(value) => setCampaign((item) => ({ ...item, audience: value }))} />
              <Field label="Budget" value={campaign.budget} onChange={(value) => setCampaign((item) => ({ ...item, budget: value }))} />
              <label className="grid gap-2 text-sm font-bold">
                WhatsApp follow-up message
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  value={campaign.whatsappMessage}
                  onChange={(event) => setCampaign((item) => ({ ...item, whatsappMessage: event.target.value }))}
                  placeholder="Example: Hi, NIDUS Academy admissions are open. Would you like a free career clarity session?"
                />
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                <Sparkles className="h-5 w-5" />
                Prepare Campaign
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Connection Status</p>
            <h2 className="mt-2 text-2xl font-black">Marketing channels</h2>
            <div className="mt-5 grid gap-3">
              <Status icon={Megaphone} title="Meta Ads / Facebook / Instagram" />
              <Status icon={MessageCircle} title="WhatsApp Cloud API" />
              <Status icon={Youtube} title="YouTube Publishing" />
              <Status icon={BarChart3} title="Campaign Analytics" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="creatives" title="Creative Library" eyebrow="Posters, reels and brochures">
            <Empty icon={FileArchive} text="Upload storage can connect here. For launch, keep the creative name/file reference in the campaign draft." />
          </Panel>
          <Panel id="review" title="Review & Approval" eyebrow="Before publishing">
            <Empty icon={CheckCircle2} text="Campaign drafts should be reviewed by management before API publishing is enabled." />
          </Panel>
          <Panel id="leads" title="Campaign Leads" eyebrow="Lead follow-up">
            <Empty icon={MessageCircle} text="Campaign leads will flow here after Meta/WhatsApp lead capture is connected." />
          </Panel>
          <Panel id="reports" title="Marketing Reports" eyebrow="Performance review">
            <Empty icon={BarChart3} text="Reach, engagement, CPL and admissions conversion reports will show only real connected campaign data." />
          </Panel>
        </section>
      </section>
    </main>
  );
}

function WorkflowCard({ item }: { item: { id: string; title: string; text: string; icon: LucideIcon } }) {
  const Icon = item.icon;
  return (
    <a className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl" href={`#${item.id}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-lg font-black">{item.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item.text}</p>
    </a>
  );
}

function Status({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--gold)]" />
        <span className="font-bold">{title}</span>
      </div>
      <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
        Needs Connection
      </span>
    </div>
  );
}

function Panel({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
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

function Empty({ text, icon: Icon }: { text: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">
      <Icon className="mb-3 h-5 w-5 text-[var(--gold)]" />
      {text}
    </div>
  );
}
