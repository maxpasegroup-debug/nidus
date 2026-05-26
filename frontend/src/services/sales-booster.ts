import { apiClient } from "@/services/api";

export type SalesBoosterApprovalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "RUN_READY";

export type SalesBoosterDraft = {
  hook: string;
  caption: string;
  audience: string;
  cta: string;
  whatsapp: string;
};

export type SalesBoosterCampaign = {
  id: string;
  title: string;
  track: string;
  goal: string;
  creativeName?: string | null;
  creativeType?: string | null;
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
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email: string; role: string };
  approvedBy?: { id: string; name: string; email: string; role: string } | null;
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

export async function createSalesBoosterCampaign(payload: {
  title: string;
  track: string;
  goal: string;
  creativeName?: string;
  creativeType?: string;
  channels: string[];
  aiDraft: SalesBoosterDraft;
}) {
  const response = await apiClient.post<{ campaign: SalesBoosterCampaign }>("/sales-booster/campaigns", payload);
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
