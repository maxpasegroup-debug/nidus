"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Bot, CheckCircle2, Clapperboard, FileUp, Megaphone, MessageCircle, PlayCircle, Send, Sparkles, Target, Users } from "lucide-react";
import { ActivityTimeline, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useMarketingDashboard } from "@/hooks/use-dashboard";

const campaignTracks = [
  {
    title: "Academy Admissions",
    audience: "Parents and defence aspirants",
    offer: "Physical academy enquiry and counselling",
    color: "from-[#fff7de] to-[#eef4ef]"
  },
  {
    title: "TOPRANK AI Coaching",
    audience: "NDA, CDS, AFCAT and Agniveer students",
    offer: "Rs 2,999 + GST monthly AI trainer",
    color: "from-[#eaf2ff] to-[#fff9e8]"
  },
  {
    title: "NIDUS Guru",
    audience: "Students needing focus and discipline",
    offer: "Active Learning Transformation quests",
    color: "from-[#f5edff] to-[#eef8ff]"
  },
  {
    title: "Free Assessments",
    audience: "New leads and undecided parents",
    offer: "Officer readiness and career fit tests",
    color: "from-[#ecfff5] to-[#fff7de]"
  }
];

const channels = [
  ["Facebook", "Posts, lead ads, admissions campaigns"],
  ["Instagram", "Reels, posters, stories, enquiry pushes"],
  ["Threads", "Short campaign threads and announcements"],
  ["YouTube", "Shorts, video uploads, titles and descriptions"],
  ["WhatsApp", "Template follow-ups, counsellor routing, broadcasts"]
];

const workflow = [
  "Upload poster or ad video",
  "Write the campaign goal",
  "NIDUS AI prepares caption, hook, audience and budget",
  "Review and approve",
  "Run campaign through connected APIs",
  "Track leads, WhatsApp follow-up and reports"
];

function buildCampaignDraft(goal: string, track: string) {
  const cleanGoal = goal.trim() || `Generate a high-intent ${track} campaign for Kerala defence aspirants.`;
  return {
    hook: track === "TOPRANK AI Coaching" ? "Train for rank, not just marks." : "Your uniform journey can start with one clear step.",
    caption: `${cleanGoal} Use simple parent-friendly language, highlight trust, and drive users to Start Free before counselling.`,
    audience: track === "NIDUS Guru" ? "Students aged 13-22, parents, focus and discipline interest groups" : "Kerala students, parents, NDA/CDS/AFCAT/AISSEE/Agniveer interest groups",
    cta: track === "Free Assessments" ? "Start Free Assessment" : track === "Academy Admissions" ? "Apply for Counselling" : "Start Free",
    whatsapp: `Hello NIDUS Academy, I am interested in ${track}. Please guide me with the next step.`
  };
}

export default function MarketingDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useMarketingDashboard();
  const [selectedTrack, setSelectedTrack] = useState(campaignTracks[0].title);
  const [goal, setGoal] = useState("Generate NDA admissions campaign for Kerala students with a parent-friendly message and WhatsApp follow-up.");
  const [creativeName, setCreativeName] = useState("No creative selected");
  const [approvalStatus, setApprovalStatus] = useState("Draft ready");
  const draft = useMemo(() => buildCampaignDraft(goal, selectedTrack), [goal, selectedTrack]);

  if (isLoading) return <RoleDashboardGuard role="MARKETING_COORDINATOR"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="MARKETING_COORDINATOR"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="MARKETING_COORDINATOR">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_52%,#e4edf4_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Sales Booster</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">One prompt to plan NIDUS campaigns.</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
                A NIDUS-only campaign command center for Academy admissions, TOPRANK, NIDUS Guru and free assessments. Phase 1 prepares the workflow, review screen, lead direction and API-ready structure.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => setApprovalStatus("Submitted for approval")}>
                  Submit Draft <Send className="h-4 w-4" />
                </Button>
                <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? "Refreshing..." : "Refresh Signals"}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <Bot className="h-8 w-8 text-[#b9913f]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">NIDUS AI Campaign Builder</h2>
              <p className="mt-3 text-sm leading-7 text-[#64748b]">Upload creative, write the goal, review the AI draft, approve, then connect publishing and ad APIs in the next phase.</p>
              <div className="mt-5 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm font-semibold text-[#071d36]">{approvalStatus}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active Campaigns" value={String(data.campaignTracking.activeCampaigns)} note="current tracked campaigns" />
          <StatCard label="Leads Generated" value={String(data.campaignTracking.leadsGenerated)} note="from existing CRM signals" />
          <StatCard label="Social Reach" value={`${Math.round(data.socialCampaignAnalytics.reach / 1000)}K`} note={`${data.socialCampaignAnalytics.enquiries} enquiries`} />
          <StatCard label="Cost per Lead" value={`Rs ${data.campaignTracking.costPerLead}`} note="average acquisition cost" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Campaign Generator</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Create the next campaign</h2>
              </div>
              <Sparkles className="h-7 w-7 text-gold" />
            </div>

            <div className="mt-6 grid gap-4">
              <label>
                <span className="text-sm font-semibold text-white">Campaign track</span>
                <select value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)} className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white outline-none focus:border-gold">
                  {campaignTracks.map((track) => <option key={track.title}>{track.title}</option>)}
                </select>
              </label>

              <label className="grid min-h-36 cursor-pointer place-items-center rounded border border-dashed border-gold/35 bg-gold/10 p-5 text-center text-gold-soft transition hover:bg-gold/15">
                <FileUp className="h-7 w-7" />
                <span className="mt-3 text-sm font-semibold">Upload poster or video creative</span>
                <span className="mt-1 text-xs text-muted">{creativeName}</span>
                <input type="file" accept="image/*,video/*,.pdf" className="sr-only" onChange={(event) => setCreativeName(event.target.files?.[0]?.name ?? "No creative selected")} />
              </label>

              <label>
                <span className="text-sm font-semibold text-white">Prompt / campaign goal</span>
                <textarea value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 min-h-36 w-full rounded border border-white/12 bg-navy-deep px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-muted focus:border-gold" placeholder="Example: Generate NDA admissions campaign for Kerala students with Rs 10,000 budget." />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">AI Draft Review</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">{selectedTrack}</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Hook", draft.hook],
                ["Caption Direction", draft.caption],
                ["Audience", draft.audience],
                ["CTA", draft.cta],
                ["WhatsApp Message", draft.whatsapp]
              ].map(([label, value]) => (
                <div key={label} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-[#40516a]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={() => setApprovalStatus("Approved. API run queue pending Phase 2.")}>
                Approve Draft <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="secondary" onClick={() => setApprovalStatus("Needs revision")}>Request Revision</Button>
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="NIDUS Campaign Tracks" title="Choose what to promote" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {campaignTracks.map((track) => (
            <button key={track.title} type="button" onClick={() => setSelectedTrack(track.title)} className={`rounded-lg border p-5 text-left shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 ${selectedTrack === track.title ? "border-[#b9913f] bg-white" : "border-[#071d36]/10 bg-gradient-to-br " + track.color}`}>
              <Megaphone className="h-6 w-6 text-[#b9913f]" />
              <h3 className="mt-4 text-xl font-semibold text-[#071d36]">{track.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{track.audience}</p>
              <p className="mt-4 rounded border border-[#071d36]/10 bg-white/70 px-3 py-2 text-xs font-semibold text-[#3f4a32]">{track.offer}</p>
            </button>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Publishing Channels</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">API-ready channels</h2>
            <div className="mt-5 grid gap-3">
              {channels.map(([title, text]) => (
                <div key={title} className="flex items-start gap-3 rounded border border-white/10 bg-navy-deep/55 p-4">
                  <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProgressCard title="Landing Conversion" value={Math.round(data.landingPageAnalytics.conversionRate * 10)} label={`${data.landingPageAnalytics.visitors} visitors`} />
            <ProgressCard title="Social Engagement" value={Math.round(data.socialCampaignAnalytics.engagement * 10)} label={`${data.socialCampaignAnalytics.engagement}% engagement`} />
            <ActivityTimeline title="Sales Booster Flow" items={workflow} />
            <div className="rounded-lg border border-gold/20 bg-gold/10 p-5">
              <MessageCircle className="h-6 w-6 text-gold" />
              <h3 className="mt-4 text-xl font-semibold text-white">WhatsApp routing</h3>
              <p className="mt-3 text-sm leading-7 text-muted">Phase 1 prepares template copy and lead direction. Phase 2 connects WhatsApp Cloud API, approved templates, opt-in lists and counsellor assignment.</p>
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Sales Booster workbench" />
        <section className="grid gap-4 md:grid-cols-4">
          <QuickActionCard title="Lead CRM" description="Review captured admissions and campaign leads." href="/crm/leads" />
          <QuickActionCard title="Creatives" description="Open media library for posters, reels, videos and brochures." href="/media-library" />
          <QuickActionCard title="Reports" description="Review source, campaign and conversion movement." href="/dashboard/marketing" />
          <QuickActionCard title="Settings" description="Prepare API credentials and approval rules later." href="/dashboard/settings" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Phase 1 Scope" value="UI Ready" note="prompt, upload, review and approval shell" />
          <StatCard label="External APIs" value="Phase 2" note="Meta, YouTube, Threads and WhatsApp not called yet" />
          <StatCard label="Lead Safety" value="Opt-in" note="bulk WhatsApp must use approved templates" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            [Target, "Campaign approval", "Every AI-generated campaign waits for human approval before running."],
            [Users, "Admission focus", "All campaigns push users into Start Free, CRM leads and counselling flow."],
            [BarChart3, "Analytics ready", "The UI is prepared for reach, CPL, CTR, spend and admission conversion."],
            [Clapperboard, "Creative first", "Poster, reel, video or brochure becomes the campaign input."],
            [Bot, "Prompt driven", "The campaign goal becomes captions, audience, WhatsApp copy and CTA."],
            [MessageCircle, "Follow-up loop", "WhatsApp response and counsellor routing stay central to conversion."]
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof Target;
            return (
              <div key={String(title)} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
                <ItemIcon className="h-6 w-6 text-[#b9913f]" />
                <h3 className="mt-4 font-semibold text-[#071d36]">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{String(text)}</p>
              </div>
            );
          })}
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
