"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Bot, CalendarClock, CalendarDays, CheckCircle2, Clapperboard, Download, FileUp, Megaphone, MessageCircle, PlayCircle, Send, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { ActivityTimeline, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { useMarketingDashboard } from "@/hooks/use-dashboard";
import { useAddSalesBoosterAudienceContact, useAddSalesBoosterMetricSnapshot, useAttachSalesBoosterCreative, useBroadcastSalesBoosterWhatsApp, useCreateSalesBoosterCampaign, useGenerateSalesBoosterCampaignDraft, useImportSalesBoosterLeadsToAudience, useOptOutSalesBoosterAudience, useRunDueSalesBoosterCampaigns, useRunSalesBoosterCampaign, useSalesBoosterAnalytics, useSalesBoosterAudience, useSalesBoosterCalendar, useSalesBoosterCampaigns, useSalesBoosterConnectorHealth, useSalesBoosterConnectors, useSalesBoosterConversionReport, useSalesBoosterCreativeLibrary, useSalesBoosterOperations, useSalesBoosterSummary, useSalesBoosterWhatsAppTemplates, useScheduleSalesBoosterCampaign, useScheduledSalesBoosterCampaigns, useSyncSalesBoosterCampaignAnalytics, useUpdateSalesBoosterStatus, useUploadSalesBoosterCreative } from "@/hooks/use-sales-booster";
import type { SalesBoosterCampaign, SalesBoosterCreative, SalesBoosterDraft } from "@/services/sales-booster";
import { salesBoosterConversionExportUrl } from "@/services/sales-booster";

const campaignTracks = [
  { title: "Academy Admissions", audience: "Parents and defence aspirants", offer: "Physical academy enquiry and counselling", color: "from-[#fff7de] to-[#eef4ef]" },
  { title: "TOPRANK AI Coaching", audience: "NDA, CDS, AFCAT and Agniveer students", offer: "Rs 2,999 + GST monthly AI trainer", color: "from-[#eaf2ff] to-[#fff9e8]" },
  { title: "NIDUS Guru", audience: "Students needing focus and discipline", offer: "Active Learning Transformation quests", color: "from-[#f5edff] to-[#eef8ff]" },
  { title: "Free Assessments", audience: "New leads and undecided parents", offer: "Officer readiness and career fit tests", color: "from-[#ecfff5] to-[#fff7de]" }
];

const channels = [
  ["Facebook", "Posts, lead ads, admissions campaigns"],
  ["Instagram", "Reels, posters, stories, enquiry pushes"],
  ["Meta Ads", "Paused lead campaign shells for Ads Manager review"],
  ["Threads", "Text, image and video campaign posts"],
  ["YouTube", "Video uploads with AI title, description and tags"],
  ["WhatsApp", "Template follow-ups, counsellor routing, broadcasts"]
];

const workflow = [
  "Creative",
  "Goal",
  "AI Draft",
  "Approval",
  "Schedule / Run",
  "Track"
];

const wizardSteps = ["Creative", "Goal", "AI Draft", "Approval", "Run", "Track"];

function buildCampaignDraft(goal: string, track: string): SalesBoosterDraft {
  const cleanGoal = goal.trim() || `Generate a high-intent ${track} campaign for Kerala defence aspirants.`;
  return {
    hook: track === "TOPRANK AI Coaching" ? "Train for rank, not just marks." : "Your uniform journey can start with one clear step.",
    caption: `${cleanGoal} Use simple parent-friendly language, highlight trust, and drive users to Start Free before counselling.`,
    audience: track === "NIDUS Guru" ? "Students aged 13-22, parents, focus and discipline interest groups" : "Kerala students, parents, NDA/CDS/AFCAT/AISSEE/Agniveer interest groups",
    cta: track === "Free Assessments" ? "Start Free Assessment" : track === "Academy Admissions" ? "Apply for Counselling" : "Start Free",
    whatsapp: `Hello NIDUS Academy, I am interested in ${track}. Please guide me with the next step.`,
    hashtags: ["#NIDUSAcademy", "#DefenceCareer", "#StartFree"],
    budgetSuggestion: "Start small, compare poster vs reel, then increase spend on the best CPL.",
    targeting: ["Kerala students and parents", "Defence exam interests", "Retarget Start Free visitors"],
    postingPlan: ["Publish poster", "Publish short video", "WhatsApp opted-in leads", "Retarget engaged audience"],
    channelCopies: channels.map(([channel]) => ({
      channel,
      headline: `NIDUS ${track}`,
      caption: cleanGoal,
      hashtags: channel === "WhatsApp" ? [] : ["#NIDUSAcademy", "#DefenceAspirants"],
      cta: channel === "WhatsApp" ? "Reply YES" : "Start Free",
      notes: "Generate with AI for a full channel-specific version."
    })),
    safetyNotes: ["Human approval required before running.", "Avoid guaranteed selection claims."]
  };
}

function statusLabel(campaign: SalesBoosterCampaign) {
  if (campaign.approvalStatus === "RUN_READY") return "Ready for API run";
  if (campaign.approvalStatus === "APPROVED") return "Approved";
  if (campaign.approvalStatus === "SUBMITTED") return "Waiting approval";
  if (campaign.approvalStatus === "NEEDS_REVISION") return "Needs revision";
  if (campaign.approvalStatus === "REJECTED") return "Rejected";
  return "Draft";
}

export default function MarketingDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useMarketingDashboard();
  const campaigns = useSalesBoosterCampaigns();
  const summary = useSalesBoosterSummary();
  const connectors = useSalesBoosterConnectors();
  const connectorHealth = useSalesBoosterConnectorHealth();
  const whatsappTemplates = useSalesBoosterWhatsAppTemplates();
  const analytics = useSalesBoosterAnalytics();
  const conversionReport = useSalesBoosterConversionReport();
  const operations = useSalesBoosterOperations();
  const scheduledCampaigns = useScheduledSalesBoosterCampaigns();
  const calendar = useSalesBoosterCalendar();
  const creativeLibrary = useSalesBoosterCreativeLibrary();
  const audience = useSalesBoosterAudience();
  const createCampaign = useCreateSalesBoosterCampaign();
  const generateCampaignDraft = useGenerateSalesBoosterCampaignDraft();
  const uploadCreative = useUploadSalesBoosterCreative();
  const attachCreative = useAttachSalesBoosterCreative();
  const updateStatus = useUpdateSalesBoosterStatus();
  const runCampaign = useRunSalesBoosterCampaign();
  const scheduleCampaign = useScheduleSalesBoosterCampaign();
  const runDueCampaigns = useRunDueSalesBoosterCampaigns();
  const addMetrics = useAddSalesBoosterMetricSnapshot();
  const syncAnalytics = useSyncSalesBoosterCampaignAnalytics();
  const addAudienceContact = useAddSalesBoosterAudienceContact();
  const importLeads = useImportSalesBoosterLeadsToAudience();
  const optOutAudience = useOptOutSalesBoosterAudience();
  const broadcastWhatsApp = useBroadcastSalesBoosterWhatsApp();
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(campaignTracks[0].title);
  const [goal, setGoal] = useState("Generate NDA admissions campaign for Kerala students with a parent-friendly message and WhatsApp follow-up.");
  const [campaignAudience, setCampaignAudience] = useState("Kerala defence aspirants, parents and students preparing for NDA/CDS/AFCAT/AISSEE.");
  const [campaignBudget, setCampaignBudget] = useState("Rs 10,000 test budget for 7 days.");
  const [creativeName, setCreativeName] = useState("No creative selected");
  const [creative, setCreative] = useState<SalesBoosterCreative | null>(null);
  const [aiDraft, setAiDraft] = useState<SalesBoosterDraft | null>(null);
  const [approvalStatus, setApprovalStatus] = useState("Draft ready");
  const [metricCampaignId, setMetricCampaignId] = useState("");
  const [metricPlatform, setMetricPlatform] = useState("Facebook");
  const [metricReach, setMetricReach] = useState("0");
  const [metricClicks, setMetricClicks] = useState("0");
  const [metricLeads, setMetricLeads] = useState("0");
  const [metricSpend, setMetricSpend] = useState("0");
  const [metricRevenue, setMetricRevenue] = useState("0");
  const [scheduleCampaignId, setScheduleCampaignId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleNote, setScheduleNote] = useState("Run after creative review and WhatsApp template approval.");
  const [audienceName, setAudienceName] = useState("");
  const [audiencePhone, setAudiencePhone] = useState("");
  const [audienceSegment, setAudienceSegment] = useState("Academy Admissions");
  const [broadcastSegment, setBroadcastSegment] = useState("Academy Admissions");
  const [templateName, setTemplateName] = useState("nidus_campaign_followup");
  const [broadcastFollowUpDate, setBroadcastFollowUpDate] = useState("");
  const [broadcastCounselor, setBroadcastCounselor] = useState("Admissions counselor");
  const [createBroadcastFollowUps, setCreateBroadcastFollowUps] = useState(true);
  const [optOutPhone, setOptOutPhone] = useState("");
  const draft = useMemo(() => aiDraft ?? buildCampaignDraft(goal, selectedTrack), [aiDraft, goal, selectedTrack]);
  const savedCampaigns = campaigns.data ?? [];
  const boosterSummary = summary.data;
  const boosterAnalytics = analytics.data;
  const conversion = conversionReport.data;
  const ops = operations.data;
  const connectorStatus = connectors.data ?? boosterSummary?.connectorStatus ?? {};
  const health = connectorHealth.data;
  const campaignCalendar = calendar.data;
  const library = creativeLibrary.data;
  const canApprove = user?.role === "ADMIN" || user?.role === "DIRECTOR";
  const activeMetricCampaignId = metricCampaignId || savedCampaigns[0]?.id || "";
  const runReadyCampaigns = savedCampaigns.filter((campaign) => campaign.approvalStatus === "RUN_READY");
  const activeScheduleCampaignId = scheduleCampaignId || runReadyCampaigns[0]?.id || "";
  const scheduled = scheduledCampaigns.data ?? [];
  const audienceData = audience.data;
  const audienceContacts = audienceData?.contacts ?? [];
  const approvedTemplates = whatsappTemplates.data ?? [];

  function saveCampaign(status: "DRAFT" | "SUBMITTED" = "DRAFT") {
    createCampaign.mutate({
      title: `${selectedTrack} Campaign`,
      track: selectedTrack,
      goal,
      creativeName: creative?.name ?? (creativeName === "No creative selected" ? undefined : creativeName),
      creativeType: creative?.type ?? (creativeName === "No creative selected" ? undefined : creativeName.split(".").pop()?.toLowerCase()),
      creativeUrl: creative?.url,
      creativeMediaId: creative?.id,
      creativeSize: creative?.size,
      channels: channels.map(([title]) => title),
      aiDraft: draft
    }, {
      onSuccess: (campaign) => {
        setApprovalStatus(status === "SUBMITTED" ? "Saved and submitted for approval" : "Draft saved");
        if (status === "SUBMITTED") updateStatus.mutate({ id: campaign.id, approvalStatus: "SUBMITTED", reviewNote: "Submitted from Sales Booster generator." });
      }
    });
  }

  function generateCampaign() {
    generateCampaignDraft.mutate({
      track: selectedTrack,
      goal,
      audience: campaignAudience,
      budget: campaignBudget,
      creativeName: creative?.name ?? (creativeName === "No creative selected" ? undefined : creativeName),
      creativeType: creative?.type,
      channels: channels.map(([title]) => title)
    }, {
      onSuccess: (generated) => {
        setAiDraft(generated);
        setApprovalStatus("AI campaign draft ready for review");
      }
    });
  }

  function uploadCampaignCreative(file?: File) {
    if (!file) return;
    setCreativeName(file.name);
    uploadCreative.mutate(file, {
      onSuccess: (uploaded) => {
        setCreative(uploaded);
        setCreativeName(uploaded.name);
      }
    });
  }

  function attachCreativeToCampaign(campaignId: string) {
    if (!creative) return;
    attachCreative.mutate({
      id: campaignId,
      creativeName: creative.name,
      creativeType: creative.type,
      creativeUrl: creative.url,
      creativeMediaId: creative.id,
      creativeSize: creative.size
    });
  }

  function saveMetrics() {
    if (!activeMetricCampaignId) return;
    addMetrics.mutate({
      id: activeMetricCampaignId,
      platform: metricPlatform,
      reach: Number(metricReach) || 0,
      impressions: Number(metricReach) || 0,
      clicks: Number(metricClicks) || 0,
      leads: Number(metricLeads) || 0,
      spend: Number(metricSpend) || 0,
      revenue: Number(metricRevenue) || 0,
      notes: "Manual Sales Booster Phase 4 metric snapshot."
    });
  }

  function saveSchedule() {
    if (!activeScheduleCampaignId || !scheduledAt) return;
    scheduleCampaign.mutate({
      id: activeScheduleCampaignId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      scheduleNote
    });
  }

  function saveAudienceContact() {
    if (!audienceName.trim() || !audiencePhone.trim()) return;
    addAudienceContact.mutate({
      fullName: audienceName,
      phone: audiencePhone,
      segment: audienceSegment,
      source: "Sales Booster",
      interest: selectedTrack,
      optIn: true,
      notes: "Added from Sales Booster WhatsApp Center."
    }, {
      onSuccess: () => {
        setAudienceName("");
        setAudiencePhone("");
      }
    });
  }

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
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">A NIDUS-only campaign command center for Academy admissions, TOPRANK, NIDUS Guru and free assessments. Generate channel-wise campaign copy, review it, attach creative, then submit for approval.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => saveCampaign("SUBMITTED")} disabled={createCampaign.isPending || updateStatus.isPending}>
                  {createCampaign.isPending ? "Saving..." : "Save & Submit"} <Send className="h-4 w-4" />
                </Button>
                <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? "Refreshing..." : "Refresh Signals"}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <Bot className="h-8 w-8 text-[#b9913f]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">NIDUS AI Campaign Builder</h2>
              <p className="mt-3 text-sm leading-7 text-[#64748b]">Upload creative, write the goal, let NIDUS AI prepare campaign copy, then submit it for approval before running.</p>
              <div className="mt-5 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm font-semibold text-[#071d36]">{approvalStatus}</div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-4 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="grid gap-3 md:grid-cols-6">
            {wizardSteps.map((step, index) => (
              <button key={step} type="button" onClick={() => setWizardStep(index)} className={`rounded border px-3 py-3 text-left transition ${wizardStep === index ? "border-[#b9913f] bg-[#fff7de] text-[#071d36]" : "border-[#071d36]/10 bg-[#f7f3ea] text-[#40516a] hover:border-[#b9913f]/40"}`}>
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">{String(index + 1).padStart(2, "0")}</span>
                <span className="mt-1 block text-sm font-semibold">{step}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">International workflow: upload creative, describe the goal, generate AI copy, approve, schedule/run, then measure lead-to-admission conversion.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Saved Campaigns" value={String(boosterSummary?.totalCampaigns ?? savedCampaigns.length)} note="Sales Booster records" />
          <StatCard label="Tracked Leads" value={String(boosterAnalytics?.summary.leads ?? data.campaignTracking.leadsGenerated)} note={`CPL Rs ${boosterAnalytics?.summary.cpl ?? 0}`} />
          <StatCard label="Revenue Signal" value={`Rs ${Math.round(boosterAnalytics?.summary.revenue ?? 0).toLocaleString()}`} note={`ROI ${boosterAnalytics?.summary.roi ?? 0}%`} />
          <StatCard label="Scheduled" value={String(scheduled.length)} note={`${scheduled.filter((campaign) => campaign.scheduleStatus === "DUE").length} due now`} />
        </section>

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Connector Readiness</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Platform health before running campaigns</h2>
            </div>
            <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] px-4 py-3 text-sm font-semibold text-[#071d36]">{health?.ready ?? 0}/{health?.total ?? 0} ready</div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(health?.channels ?? []).map((channel) => (
              <div key={channel.channel} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#071d36]">{channel.channel}</p>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${channel.connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{channel.connected ? "Ready" : "Needs connection"}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#64748b]">{channel.nextStep}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Phase 14 Operations</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Live automation health</h2>
            <p className="mt-2 text-sm leading-7 text-[#64748b]">Meta Lead Ads and WhatsApp reply webhooks are tracked with duplicate protection, CRM capture, and follow-up visibility.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Webhook Events</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{ops?.health.recentWebhookEvents ?? 0}</p>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Pending Follow-ups</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{ops?.health.pendingFollowUps ?? 0}</p>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Recent CRM Leads</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{ops?.health.recentLeads ?? 0}</p>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Failed Runs</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{ops?.health.failedCampaigns ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Webhook Audit Trail</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Latest captured events</h2>
              </div>
              <CheckCircle2 className="h-7 w-7 text-gold" />
            </div>
            <div className="mt-5 grid gap-3">
              {(ops?.auditLogs ?? []).slice(0, 5).length ? ops?.auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{log.action.replaceAll("_", " ")}</p>
                    <span className="text-xs font-semibold text-gold-soft">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">{log.description}</p>
                </div>
              )) : (
                <div className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">Webhook events will appear here after Meta Lead Ads or WhatsApp replies start arriving.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Phase 5 Automation</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Schedule approved campaigns</h2>
                <p className="mt-2 text-sm leading-7 text-[#64748b]">Queue run-ready campaigns for a specific date and process due campaigns through the protected connector layer.</p>
              </div>
              <CalendarClock className="h-7 w-7 text-[#b9913f]" />
            </div>
            <div className="mt-5 grid gap-3">
              <label>
                <span className="text-sm font-semibold text-[#071d36]">Run-ready campaign</span>
                <select value={activeScheduleCampaignId} onChange={(event) => setScheduleCampaignId(event.target.value)} className="mt-2 h-11 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]">
                  {runReadyCampaigns.length ? runReadyCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>) : <option>No run-ready campaign</option>}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-[#071d36]">Schedule date and time</span>
                <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-2 h-11 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]" />
              </label>
              <label>
                <span className="text-sm font-semibold text-[#071d36]">Execution note</span>
                <textarea value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-2 text-sm leading-6 text-[#071d36] outline-none focus:border-[#b9913f]" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" onClick={saveSchedule} disabled={!activeScheduleCampaignId || !scheduledAt || scheduleCampaign.isPending}>
                  {scheduleCampaign.isPending ? "Scheduling..." : "Schedule Campaign"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => runDueCampaigns.mutate()} disabled={runDueCampaigns.isPending || !scheduled.length}>
                  {runDueCampaigns.isPending ? "Processing..." : "Run Due"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Automation Queue</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Scheduled campaign runs</h2>
            <div className="mt-5 grid gap-3">
              {scheduled.length ? scheduled.slice(0, 6).map((campaign) => (
                <div key={campaign.id} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{campaign.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{campaign.track}</p>
                    </div>
                    <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{campaign.scheduleStatus}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "No schedule time"}</p>
                  {campaign.scheduleNote ? <p className="mt-2 text-xs leading-5 text-muted">{campaign.scheduleNote}</p> : null}
                </div>
              )) : (
                <div className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">No campaign is scheduled yet. Approve a campaign as run-ready, then schedule it here.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Phase 6 WhatsApp Center</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Opt-in lead follow-up</h2>
                <p className="mt-2 text-sm leading-7 text-[#64748b]">Build approved WhatsApp audiences from CRM leads or manual opt-ins, then send Meta-approved template broadcasts through the backend connector.</p>
              </div>
              <MessageCircle className="h-7 w-7 text-[#b9913f]" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-[#071d36]">Name</span>
                <input value={audienceName} onChange={(event) => setAudienceName(event.target.value)} className="mt-2 h-11 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]" />
              </label>
              <label>
                <span className="text-sm font-semibold text-[#071d36]">WhatsApp number</span>
                <input value={audiencePhone} onChange={(event) => setAudiencePhone(event.target.value)} className="mt-2 h-11 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]" placeholder="919969594411" />
              </label>
              <label>
                <span className="text-sm font-semibold text-[#071d36]">Segment</span>
                <select value={audienceSegment} onChange={(event) => setAudienceSegment(event.target.value)} className="mt-2 h-11 w-full rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]">
                  {campaignTracks.map((track) => <option key={track.title}>{track.title}</option>)}
                  <option>CRM Leads</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button type="button" onClick={saveAudienceContact} disabled={addAudienceContact.isPending || !audienceName || !audiencePhone}>
                  {addAudienceContact.isPending ? "Saving..." : "Add Opt-in"}
                </Button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => importLeads.mutate("CRM Leads")} disabled={importLeads.isPending}>
                {importLeads.isPending ? "Importing..." : "Import CRM Leads"}
              </Button>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-3 text-sm font-semibold text-[#071d36]">
                {audienceContacts.length} opt-in contact(s) ready
              </div>
            </div>
            <div className="mt-5 rounded border border-[#071d36]/10 bg-[#fff7de] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#b9913f]" />
                <div>
                  <p className="font-semibold text-[#071d36]">WhatsApp compliance</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">Only opted-in contacts are selected for broadcasts. Record opt-outs immediately when a lead replies STOP or asks not to be contacted.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input value={optOutPhone} onChange={(event) => setOptOutPhone(event.target.value)} className="h-11 rounded border border-[#071d36]/10 bg-white px-3 text-sm text-[#071d36] outline-none focus:border-[#b9913f]" placeholder="Enter WhatsApp number to opt out" />
                <Button type="button" variant="secondary" onClick={() => optOutAudience.mutate({ phone: optOutPhone, reason: "Manual opt-out from Sales Booster" }, { onSuccess: () => setOptOutPhone("") })} disabled={!optOutPhone.trim() || optOutAudience.isPending}>
                  {optOutAudience.isPending ? "Saving..." : "Opt Out"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Template Broadcast</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Send approved follow-up</h2>
            <div className="mt-5 grid gap-3">
              <label>
                <span className="text-sm font-semibold text-white">Audience segment</span>
                <select value={broadcastSegment} onChange={(event) => setBroadcastSegment(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold">
                  {Object.keys(audienceData?.segments ?? {}).length ? Object.keys(audienceData?.segments ?? {}).map((segment) => <option key={segment}>{segment}</option>) : campaignTracks.map((track) => <option key={track.title}>{track.title}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-white">Approved template name</span>
                <select value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold">
                  {approvedTemplates.length ? approvedTemplates.map((template) => <option key={template.name} value={template.name}>{template.name}{template.default ? " (default)" : ""}</option>) : <option value={templateName}>{templateName}</option>}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-white">Follow-up date</span>
                  <input type="datetime-local" value={broadcastFollowUpDate} onChange={(event) => setBroadcastFollowUpDate(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold" />
                </label>
                <label>
                  <span className="text-sm font-semibold text-white">Counselor route</span>
                  <input value={broadcastCounselor} onChange={(event) => setBroadcastCounselor(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold" />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded border border-white/10 bg-navy-deep/45 p-3 text-sm font-semibold text-white">
                <input type="checkbox" checked={createBroadcastFollowUps} onChange={(event) => setCreateBroadcastFollowUps(event.target.checked)} className="h-4 w-4" />
                Create CRM leads and counselor follow-up tasks
              </label>
              <Button type="button" onClick={() => broadcastWhatsApp.mutate({ segment: broadcastSegment, templateName, createFollowUps: createBroadcastFollowUps, followUpDate: broadcastFollowUpDate ? new Date(broadcastFollowUpDate).toISOString() : undefined, counselorName: broadcastCounselor, source: `Sales Booster WhatsApp: ${broadcastSegment}` })} disabled={broadcastWhatsApp.isPending || !audienceContacts.length}>
                {broadcastWhatsApp.isPending ? "Sending..." : "Send WhatsApp Broadcast"}
              </Button>
              <div className="rounded border border-white/10 bg-navy-deep/45 p-3 text-xs leading-5 text-muted">
                Only approved WhatsApp Cloud API templates are used. Bulk messages require opt-in contacts and are routed into CRM follow-ups when enabled.
              </div>
              <div className="grid gap-2">
                {audienceContacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="rounded border border-white/10 bg-navy-deep/55 p-3 text-sm text-muted">
                    <span className="font-semibold text-white">{contact.fullName}</span> - {contact.segment} - {contact.whatsappStatus}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Phase 4 Analytics</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Campaign reporting and attribution</h2>
                <p className="mt-2 text-sm leading-7 text-[#64748b]">Pull reach, clicks, spend, leads, admissions and revenue from connected platforms. Manual metric entry is available for offline campaign records.</p>
              </div>
              <BarChart3 className="h-7 w-7 text-[#b9913f]" />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Spend</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">Rs {Math.round(boosterAnalytics?.summary.spend ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Campaigns</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{boosterAnalytics?.summary.campaigns ?? 0}</p>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Revenue</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">Rs {Math.round(boosterAnalytics?.summary.revenue ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">CRM Leads</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{conversion?.totals.leads ?? 0}</p>
              </div>
              <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Admissions</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{conversion?.totals.admissions ?? 0}</p>
              </div>
              <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Conversion</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">{conversion?.totals.conversionRate ?? 0}%</p>
              </div>
              <div className="rounded border border-[#b9913f]/25 bg-[#fff7de] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">Cost / Admission</p>
                <p className="mt-2 text-2xl font-semibold text-[#071d36]">Rs {Math.round(conversion?.totals.cpa ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => activeMetricCampaignId && syncAnalytics.mutate(activeMetricCampaignId)} disabled={!activeMetricCampaignId || syncAnalytics.isPending}>
                {syncAnalytics.isPending ? "Syncing..." : "Sync Live Analytics"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.open(salesBoosterConversionExportUrl(), "_blank")}>
                Export CSV <Download className="h-4 w-4" />
              </Button>
              <p className="text-sm leading-6 text-[#64748b]">Uses connector IDs from Facebook, Instagram, Meta Ads and YouTube runs.</p>
            </div>
            <div className="mt-5 grid gap-3">
              {(conversion?.campaigns ?? []).length ? conversion?.campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="rounded border border-[#071d36]/10 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#071d36]">{campaign.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">{campaign.track}</p>
                    </div>
                    <div className="text-right text-sm text-[#40516a]">
                      <p>{campaign.leads} leads - {campaign.admissions} admissions</p>
                      <p>CPL Rs {campaign.cpl} | CPA Rs {campaign.cpa} | {campaign.conversionRate}%</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm leading-6 text-[#40516a]">Reports will become useful after you save campaigns and add metric snapshots or connect external ad APIs.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Metric Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Manual metric entry</h2>
            <div className="mt-5 grid gap-3">
              <label>
                <span className="text-sm font-semibold text-white">Campaign</span>
                <select value={activeMetricCampaignId} onChange={(event) => setMetricCampaignId(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold">
                  {savedCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-white">Platform</span>
                <select value={metricPlatform} onChange={(event) => setMetricPlatform(event.target.value)} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold">
                  {channels.map(([title]) => <option key={title}>{title}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Reach", metricReach, setMetricReach],
                  ["Clicks", metricClicks, setMetricClicks],
                  ["Leads", metricLeads, setMetricLeads],
                  ["Spend", metricSpend, setMetricSpend],
                  ["Revenue", metricRevenue, setMetricRevenue]
                ].map(([label, value, setter]) => (
                  <label key={String(label)}>
                    <span className="text-xs font-semibold text-muted">{String(label)}</span>
                    <input value={String(value)} onChange={(event) => (setter as (next: string) => void)(event.target.value)} inputMode="numeric" className="mt-1 h-10 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold" />
                  </label>
                ))}
              </div>
              <Button type="button" onClick={saveMetrics} disabled={!activeMetricCampaignId || addMetrics.isPending}>
                {addMetrics.isPending ? "Saving..." : "Save Metrics"}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Campaign Calendar</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Scheduled and completed runs</h2>
              </div>
              <CalendarDays className="h-7 w-7 text-[#b9913f]" />
            </div>
            <div className="mt-5 grid gap-3">
              {(campaignCalendar?.all ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#071d36]">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#3f4a32]">{item.track}</p>
                    </div>
                    <span className="rounded border border-[#071d36]/10 bg-white px-3 py-1 text-xs font-semibold text-[#3f4a32]">{item.scheduleStatus}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#64748b]">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : `Created ${new Date(item.createdAt).toLocaleDateString()}`}</p>
                </div>
              ))}
              {!(campaignCalendar?.all ?? []).length ? <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm text-[#64748b]">No calendar activity yet. Approved campaigns appear here after scheduling or execution.</div> : null}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Creative Library</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Reusable campaign assets</h2>
              </div>
              <Clapperboard className="h-7 w-7 text-gold" />
            </div>
            <div className="mt-5 grid gap-3">
              {(library?.assets ?? []).slice(0, 5).map((asset) => (
                <div key={asset.campaignId} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                  <p className="font-semibold text-white">{asset.creativeName ?? asset.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{asset.track} - {asset.creativeType ?? "creative"}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{asset.leads} leads | Rs {Math.round(asset.spend).toLocaleString()} spend | Rs {Math.round(asset.revenue).toLocaleString()} revenue</p>
                </div>
              ))}
              {!(library?.assets ?? []).length ? <div className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">Uploaded campaign creatives will appear here with performance signals after metrics are captured.</div> : null}
            </div>
          </div>
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
                <select value={selectedTrack} onChange={(event) => { setSelectedTrack(event.target.value); setAiDraft(null); }} className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white outline-none focus:border-gold">
                  {campaignTracks.map((track) => <option key={track.title}>{track.title}</option>)}
                </select>
              </label>
              <label className="grid min-h-36 cursor-pointer place-items-center rounded border border-dashed border-gold/35 bg-gold/10 p-5 text-center text-gold-soft transition hover:bg-gold/15">
                <FileUp className="h-7 w-7" />
                <span className="mt-3 text-sm font-semibold">{uploadCreative.isPending ? "Uploading creative..." : "Upload poster, video or brochure"}</span>
                <span className="mt-1 text-xs text-muted">{creativeName}</span>
                <input type="file" accept="image/*,video/*,.pdf" className="sr-only" onChange={(event) => uploadCampaignCreative(event.target.files?.[0])} />
              </label>
              {creative ? (
                <div className="overflow-hidden rounded border border-white/10 bg-navy-deep/55">
                  {creative.mimeType.startsWith("image/") ? (
                    <Image src={creative.url} alt={creative.name} width={900} height={360} unoptimized className="h-56 w-full object-cover" />
                  ) : creative.mimeType.startsWith("video/") ? (
                    <video src={creative.url} className="h-56 w-full object-cover" controls />
                  ) : (
                    <div className="grid min-h-32 place-items-center p-4 text-center text-sm font-semibold text-gold-soft">PDF brochure uploaded: {creative.name}</div>
                  )}
                  <div className="p-3 text-xs leading-5 text-muted">
                    <span className="font-semibold text-white">{creative.type.toUpperCase()}</span> - {(creative.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : null}
              <label>
                <span className="text-sm font-semibold text-white">Prompt / campaign goal</span>
                <textarea value={goal} onChange={(event) => { setGoal(event.target.value); setAiDraft(null); }} className="mt-2 min-h-36 w-full rounded border border-white/12 bg-navy-deep px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-muted focus:border-gold" placeholder="Example: Generate NDA admissions campaign for Kerala students with Rs 10,000 budget." />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-white">Audience</span>
                  <input value={campaignAudience} onChange={(event) => { setCampaignAudience(event.target.value); setAiDraft(null); }} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold" />
                </label>
                <label>
                  <span className="text-sm font-semibold text-white">Budget / offer note</span>
                  <input value={campaignBudget} onChange={(event) => { setCampaignBudget(event.target.value); setAiDraft(null); }} className="mt-2 h-11 w-full rounded border border-white/12 bg-navy-deep px-3 text-sm text-white outline-none focus:border-gold" />
                </label>
              </div>
              <Button type="button" onClick={generateCampaign} disabled={generateCampaignDraft.isPending || !goal.trim()}>
                {generateCampaignDraft.isPending ? "NIDUS AI is writing..." : "Generate AI Campaign"} <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">AI Draft Review</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">{selectedTrack}</h2>
            <div className="mt-5 grid gap-3">
              {[["Hook", draft.hook], ["Caption Direction", draft.caption], ["Audience", draft.audience], ["CTA", draft.cta], ["WhatsApp Message", draft.whatsapp], ["Budget Suggestion", draft.budgetSuggestion ?? "Generate with AI for budget guidance."]].map(([label, value]) => (
                <div key={label} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-[#40516a]">{value}</p>
                </div>
              ))}
            </div>
            {draft.hashtags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {draft.hashtags.map((tag) => <span key={tag} className="rounded-full border border-[#071d36]/10 bg-[#071d36]/5 px-3 py-1 text-xs font-semibold text-[#3f4a32]">{tag}</span>)}
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded border border-[#071d36]/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">Targeting</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#40516a]">
                  {(draft.targeting ?? []).slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded border border-[#071d36]/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">Posting Plan</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#40516a]">
                  {(draft.postingPlan ?? []).slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            {draft.channelCopies?.length ? (
              <div className="mt-5 grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">Channel Copy</p>
                {draft.channelCopies.map((copy) => (
                  <div key={copy.channel} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-[#071d36]">{copy.channel}</p>
                      <span className="rounded border border-[#071d36]/10 bg-white px-2 py-1 text-xs font-semibold text-[#3f4a32]">{copy.cta}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#071d36]">{copy.headline}</p>
                    <p className="mt-2 text-sm leading-6 text-[#40516a]">{copy.caption}</p>
                    {copy.hashtags.length ? <p className="mt-2 text-xs text-[#3f4a32]">{copy.hashtags.join(" ")}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={() => saveCampaign("DRAFT")} disabled={createCampaign.isPending}>
                Save Draft <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="secondary" onClick={() => saveCampaign("SUBMITTED")} disabled={createCampaign.isPending || updateStatus.isPending}>Submit Approval</Button>
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Saved Campaigns" title="Review, approve and prepare campaigns" action={`${savedCampaigns.length} saved`} />
        <section className="grid gap-4 lg:grid-cols-3">
          {campaigns.isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-white/[0.06] lg:col-span-3" />
          ) : savedCampaigns.length ? savedCampaigns.slice(0, 9).map((campaign) => (
            <article key={campaign.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{campaign.track}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{campaign.title}</h3>
                </div>
                <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{statusLabel(campaign)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{campaign.goal}</p>
              {campaign.creativeUrl ? (
                <div className="mt-4 overflow-hidden rounded border border-white/10 bg-navy-deep/45">
                  {campaign.creativeType === "image" ? (
                    <Image src={campaign.creativeUrl} alt={campaign.creativeName ?? campaign.title} width={720} height={320} unoptimized className="h-40 w-full object-cover" />
                  ) : campaign.creativeType === "video" ? (
                    <video src={campaign.creativeUrl} className="h-40 w-full object-cover" controls />
                  ) : (
                    <div className="grid h-24 place-items-center p-3 text-center text-sm font-semibold text-gold-soft">{campaign.creativeName ?? "Creative attached"}</div>
                  )}
                  <p className="p-3 text-xs text-muted">{campaign.creativeName ?? "Campaign creative"}</p>
                </div>
              ) : creative ? (
                <button type="button" onClick={() => attachCreativeToCampaign(campaign.id)} disabled={attachCreative.isPending} className="mt-4 w-full rounded border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-soft transition hover:bg-gold/15">
                  {attachCreative.isPending ? "Attaching..." : `Attach current creative: ${creative.name}`}
                </button>
              ) : null}
              <div className="mt-4 rounded border border-white/10 bg-navy-deep/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">AI Hook</p>
                <p className="mt-2 text-sm leading-6 text-white">{campaign.aiDraft.hook}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {campaign.channels.slice(0, 5).map((channel) => (
                  <span key={channel} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-muted">{channel}</span>
                ))}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {["DRAFT", "NEEDS_REVISION"].includes(campaign.approvalStatus) ? (
                  <Button size="sm" type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: campaign.id, approvalStatus: "SUBMITTED", reviewNote: "Submitted for campaign approval." })} disabled={updateStatus.isPending}>Submit</Button>
                ) : null}
                {canApprove && campaign.approvalStatus === "SUBMITTED" ? (
                  <>
                    <Button size="sm" type="button" onClick={() => updateStatus.mutate({ id: campaign.id, approvalStatus: "RUN_READY", reviewNote: "Approved. Ready for API integration run." })} disabled={updateStatus.isPending}>Approve</Button>
                    <Button size="sm" type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: campaign.id, approvalStatus: "NEEDS_REVISION", reviewNote: "Revise campaign before approval." })} disabled={updateStatus.isPending}>Revise</Button>
                  </>
                ) : null}
                {campaign.approvalStatus === "RUN_READY" ? (
                  <Button size="sm" type="button" variant="secondary" onClick={() => runCampaign.mutate(campaign.id)} disabled={runCampaign.isPending}>
                    {runCampaign.isPending ? "Running..." : "Run Connectors"}
                  </Button>
                ) : null}
              </div>
              {campaign.connectorResults?.length ? (
                <div className="mt-4 grid gap-2">
                  {campaign.connectorResults.map((result) => (
                    <div key={`${campaign.id}-${result.channel}`} className="rounded border border-white/10 bg-navy-deep/45 p-3 text-xs leading-5 text-muted">
                      <span className="font-semibold text-gold">{result.channel}: {result.status}</span>
                      <br />
                      {result.message}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          )) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 lg:col-span-3">
              <p className="text-sm font-semibold text-white">No saved Sales Booster campaigns yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted">Create a draft above, save it, then submit it for approval.</p>
            </div>
          )}
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
                    <p className="font-semibold text-white">{title} <span className="ml-2 text-xs font-semibold text-gold">{connectorStatus[title] ? "Connected" : "Not configured"}</span></p>
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
              <p className="mt-3 text-sm leading-7 text-muted">Phase 2 stores template copy and lead direction. Phase 3 connects WhatsApp Cloud API, approved templates, opt-in lists and counsellor assignment.</p>
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
          <StatCard label="Phase 3 Scope" value="Connectors" note="safe external API run layer added" />
          <StatCard label="External APIs" value={boosterSummary?.apiConnected ? "Configured" : "Awaiting Keys"} note="Meta, YouTube, Threads and WhatsApp checked server-side" />
          <StatCard label="Lead Safety" value="Opt-in" note="bulk WhatsApp must use approved templates" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[[Target, "Campaign approval", "Every AI-generated campaign waits for human approval before running."], [Users, "Admission focus", "All campaigns push users into Start Free, CRM leads and counselling flow."], [BarChart3, "Analytics ready", "The UI is prepared for reach, CPL, CTR, spend and admission conversion."], [Clapperboard, "Creative first", "Poster, reel, video or brochure becomes the campaign input."], [Bot, "Prompt driven", "The campaign goal becomes captions, audience, WhatsApp copy and CTA."], [MessageCircle, "Follow-up loop", "WhatsApp response and counsellor routing stay central to conversion."]].map(([Icon, title, text]) => {
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
