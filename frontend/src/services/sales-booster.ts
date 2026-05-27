import { apiClient } from "@/services/api";

export type SalesBoosterApprovalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "RUN_READY";

export type SalesBoosterDraft = {
  hook: string;
  caption: string;
  audience: string;
  cta: string;
  whatsapp: string;
  hashtags?: string[];
  budgetSuggestion?: string;
  targeting?: string[];
  postingPlan?: string[];
  channelCopies?: Array<{
    channel: string;
    headline: string;
    caption: string;
    hashtags: string[];
    cta: string;
    notes: string;
  }>;
  safetyNotes?: string[];
};

export type SalesBoosterCampaign = {
  id: string;
  title: string;
  track: string;
  goal: string;
  creativeName?: string | null;
  creativeType?: string | null;
  creativeUrl?: string | null;
  creativeMediaId?: string | null;
  creativeSize?: number | null;
  creativeUploadedAt?: string | null;
  channels: string[];
  aiDraft: SalesBoosterDraft;
  approvalStatus: SalesBoosterApprovalStatus;
  runStatus: string;
  reviewNote?: string | null;
  connectorResults?: Array<{ channel: string; status: string; message: string; externalId?: string }> | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  queuedAt?: string | null;
  lastRunAt?: string | null;
  scheduledAt?: string | null;
  scheduleStatus?: string | null;
  scheduleNote?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email: string; role: string };
  approvedBy?: { id: string; name: string; email: string; role: string } | null;
};

export type SalesBoosterCreative = {
  id: string;
  name: string;
  fileName: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

export type SalesBoosterSummary = {
  totalCampaigns: number;
  statusCounts: Record<string, number>;
  trackCounts: Record<string, number>;
  runReady: number;
  connectorStatus?: Record<string, boolean>;
  apiConnected: boolean;
  nextIntegration: string;
};

export type SalesBoosterMetricSnapshot = {
  id: string;
  campaignId: string;
  platform: string;
  reach: number;
  impressions: number;
  clicks: number;
  leads: number;
  admissions: number;
  spend: number;
  revenue: number;
  notes?: string | null;
  capturedAt: string;
  createdAt: string;
};

export type SalesBoosterAnalyticsCampaign = {
  id: string;
  title: string;
  track: string;
  status: string;
  runStatus: string;
  leads: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpl: number;
  roi: number;
};

export type SalesBoosterAnalytics = {
  summary: {
    campaigns: number;
    leads: number;
    spend: number;
    revenue: number;
    cpl: number;
    roi: number;
  };
  campaigns: SalesBoosterAnalyticsCampaign[];
  topCampaigns: SalesBoosterAnalyticsCampaign[];
};

export type SalesBoosterCampaignReport = {
  campaign: SalesBoosterCampaign & { metricSnapshots: SalesBoosterMetricSnapshot[] };
  leadSource: string;
  attributedLeads: Array<{
    id: string;
    fullName: string;
    mobile: string;
    email?: string | null;
    status: string;
    targetExam?: string | null;
    createdAt: string;
    admissions: number;
  }>;
  totals: {
    reach: number;
    impressions: number;
    clicks: number;
    leads: number;
    admissions: number;
    spend: number;
    revenue: number;
    ctr: number;
    cpl: number;
    cpa: number;
    roi: number;
  };
  snapshots: SalesBoosterMetricSnapshot[];
};

export type SalesBoosterAudienceContact = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  segment: string;
  source: string;
  interest?: string | null;
  optIn: boolean;
  whatsappStatus: string;
  lastContactedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalesBoosterAudience = {
  contacts: SalesBoosterAudienceContact[];
  segments: Record<string, number>;
};

export type SalesBoosterWhatsAppTemplate = {
  name: string;
  language: string;
  default: boolean;
};

export async function getSalesBoosterCampaigns() {
  const response = await apiClient.get<{ campaigns: SalesBoosterCampaign[] }>("/sales-booster/campaigns");
  return response.data.campaigns;
}

export async function getSalesBoosterSummary() {
  const response = await apiClient.get<{ summary: SalesBoosterSummary }>("/sales-booster/summary");
  return response.data.summary;
}

export async function getSalesBoosterConnectors() {
  const response = await apiClient.get<{ connectors: Record<string, boolean> }>("/sales-booster/connectors");
  return response.data.connectors;
}

export async function getSalesBoosterWhatsAppTemplates() {
  const response = await apiClient.get<{ templates: SalesBoosterWhatsAppTemplate[] }>("/sales-booster/whatsapp/templates");
  return response.data.templates;
}

export async function getScheduledSalesBoosterCampaigns() {
  const response = await apiClient.get<{ campaigns: SalesBoosterCampaign[] }>("/sales-booster/scheduled");
  return response.data.campaigns;
}

export async function getSalesBoosterAudience() {
  const response = await apiClient.get<{ audience: SalesBoosterAudience }>("/sales-booster/audience");
  return response.data.audience;
}

export async function getSalesBoosterAnalytics() {
  const response = await apiClient.get<{ analytics: SalesBoosterAnalytics }>("/sales-booster/analytics");
  return response.data.analytics;
}

export async function getSalesBoosterCampaignReport(id: string) {
  const response = await apiClient.get<{ report: SalesBoosterCampaignReport }>(`/sales-booster/campaigns/${id}/report`);
  return response.data.report;
}

export async function createSalesBoosterCampaign(payload: {
  title: string;
  track: string;
  goal: string;
  creativeName?: string;
  creativeType?: string;
  creativeUrl?: string;
  creativeMediaId?: string;
  creativeSize?: number;
  channels: string[];
  aiDraft: SalesBoosterDraft;
}) {
  const response = await apiClient.post<{ campaign: SalesBoosterCampaign }>("/sales-booster/campaigns", payload);
  return response.data.campaign;
}

export async function generateSalesBoosterCampaignDraft(payload: {
  track: string;
  goal: string;
  audience?: string;
  budget?: string;
  creativeName?: string;
  creativeType?: string;
  channels?: string[];
}) {
  const response = await apiClient.post<{ draft: SalesBoosterDraft }>("/sales-booster/ai-generate", payload);
  return response.data.draft;
}

export async function uploadSalesBoosterCreative(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ creative: SalesBoosterCreative }>("/sales-booster/creatives/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.creative;
}

export async function attachSalesBoosterCreative(payload: {
  id: string;
  creativeName?: string;
  creativeType?: string;
  creativeUrl?: string;
  creativeMediaId?: string;
  creativeSize?: number;
}) {
  const { id, ...body } = payload;
  const response = await apiClient.patch<{ campaign: SalesBoosterCampaign }>(`/sales-booster/campaigns/${id}/creative`, body);
  return response.data.campaign;
}

export async function updateSalesBoosterStatus(payload: {
  id: string;
  approvalStatus: SalesBoosterApprovalStatus;
  reviewNote?: string;
}) {
  const response = await apiClient.patch<{ campaign: SalesBoosterCampaign }>(`/sales-booster/campaigns/${payload.id}/status`, {
    approvalStatus: payload.approvalStatus,
    reviewNote: payload.reviewNote
  });
  return response.data.campaign;
}

export async function runSalesBoosterCampaign(id: string) {
  const response = await apiClient.post<{ campaign: SalesBoosterCampaign }>(`/sales-booster/campaigns/${id}/run`);
  return response.data.campaign;
}

export async function scheduleSalesBoosterCampaign(payload: { id: string; scheduledAt: string; scheduleNote?: string }) {
  const { id, ...body } = payload;
  const response = await apiClient.patch<{ campaign: SalesBoosterCampaign }>(`/sales-booster/campaigns/${id}/schedule`, body);
  return response.data.campaign;
}

export async function runDueSalesBoosterCampaigns() {
  const response = await apiClient.post<{ due: number; executed: number; failed: number; results: Array<{ id: string; status: string; message?: string }> }>("/sales-booster/scheduled/run-due");
  return response.data;
}

export async function addSalesBoosterMetricSnapshot(payload: {
  id: string;
  platform: string;
  reach?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  admissions?: number;
  spend?: number;
  revenue?: number;
  notes?: string;
}) {
  const { id, ...body } = payload;
  const response = await apiClient.post<{ snapshot: SalesBoosterMetricSnapshot }>(`/sales-booster/campaigns/${id}/metrics`, body);
  return response.data.snapshot;
}

export async function addSalesBoosterAudienceContact(payload: {
  fullName: string;
  phone: string;
  email?: string;
  segment?: string;
  source?: string;
  interest?: string;
  optIn?: boolean;
  notes?: string;
}) {
  const response = await apiClient.post<{ contact: SalesBoosterAudienceContact }>("/sales-booster/audience", payload);
  return response.data.contact;
}

export async function importSalesBoosterLeadsToAudience(segment = "CRM Leads") {
  const response = await apiClient.post<{ imported: number; segment: string }>("/sales-booster/audience/import-leads", { segment });
  return response.data;
}

export async function broadcastSalesBoosterWhatsApp(payload: { segment?: string; templateName?: string; createFollowUps?: boolean; followUpDate?: string; counselorName?: string; source?: string }) {
  const response = await apiClient.post<{ selectedContacts: number; crmLeadsUpdated: number; followUpsCreated: number; result: { channel: string; status: string; message: string } }>("/sales-booster/whatsapp/broadcast", payload);
  return response.data;
}
