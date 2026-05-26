import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { salesBoosterConnectors } from "./sales-booster-connectors.service.js";

type Requester = { id: string; role: Role };

type CampaignInput = {
  title: string;
  track: string;
  goal: string;
  creativeName?: string;
  creativeType?: string;
  channels?: string[];
  aiDraft: Prisma.InputJsonValue;
};

type CampaignStatusInput = {
  approvalStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "RUN_READY";
  reviewNote?: string;
};

type MetricInput = {
  platform: string;
  reach?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  admissions?: number;
  spend?: number;
  revenue?: number;
  notes?: string;
  capturedAt?: string;
};

const campaignInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  approvedBy: { select: { id: true, name: true, email: true, role: true } }
} as const;

const defaultChannels = ["Facebook", "Instagram", "Threads", "YouTube", "WhatsApp"];

function canApprove(role: Role) {
  return role === Role.ADMIN || role === Role.DIRECTOR;
}

function runStatusFor(approvalStatus: CampaignStatusInput["approvalStatus"]) {
  if (approvalStatus === "RUN_READY") return "READY_FOR_API_INTEGRATION";
  if (approvalStatus === "APPROVED") return "APPROVED_NOT_CONNECTED";
  return "API_NOT_CONNECTED";
}

function sourceTag(campaign: { id: string; track: string }) {
  return `Sales Booster: ${campaign.track} (${campaign.id})`;
}

function safePercent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 10000) / 100 : 0;
}

function safeCurrency(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) / 100 : 0;
}

function sumMetrics(metrics: Array<{ reach: number; impressions: number; clicks: number; leads: number; admissions: number; spend: number; revenue: number }>) {
  return metrics.reduce((acc, item) => ({
    reach: acc.reach + item.reach,
    impressions: acc.impressions + item.impressions,
    clicks: acc.clicks + item.clicks,
    leads: acc.leads + item.leads,
    admissions: acc.admissions + item.admissions,
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue
  }), { reach: 0, impressions: 0, clicks: 0, leads: 0, admissions: 0, spend: 0, revenue: 0 });
}

export const salesBoosterService = {
  async campaigns(requester: Requester) {
    return prisma.salesBoosterCampaign.findMany({
      where: requester.role === Role.MARKETING_COORDINATOR ? { createdById: requester.id } : undefined,
      orderBy: { updatedAt: "desc" },
      include: campaignInclude
    });
  },

  async createCampaign(requester: Requester, input: CampaignInput) {
    return prisma.salesBoosterCampaign.create({
      data: {
        title: input.title,
        track: input.track,
        goal: input.goal,
        creativeName: input.creativeName,
        creativeType: input.creativeType,
        channels: input.channels?.length ? input.channels : defaultChannels,
        aiDraft: input.aiDraft,
        approvalStatus: "DRAFT",
        runStatus: "API_NOT_CONNECTED",
        reviewNote: `Lead source tag: ${input.track}`,
        createdById: requester.id
      },
      include: campaignInclude
    });
  },

  async updateCampaign(requester: Requester, id: string, input: Partial<CampaignInput>) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only edit your own Sales Booster campaigns.");
    }
    if (!["DRAFT", "NEEDS_REVISION"].includes(campaign.approvalStatus) && !canApprove(requester.role)) {
      throw new Error("Approved or submitted campaigns cannot be edited by marketing users.");
    }

    return prisma.salesBoosterCampaign.update({
      where: { id },
      data: {
        title: input.title,
        track: input.track,
        goal: input.goal,
        creativeName: input.creativeName,
        creativeType: input.creativeType,
        channels: input.channels,
        aiDraft: input.aiDraft
      },
      include: campaignInclude
    });
  },

  async updateStatus(requester: Requester, id: string, input: CampaignStatusInput) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only submit your own Sales Booster campaigns.");
    }
    if (["APPROVED", "REJECTED", "RUN_READY"].includes(input.approvalStatus) && !canApprove(requester.role)) {
      throw new Error("Approval requires admin or director access.");
    }

    const now = new Date();
    return prisma.salesBoosterCampaign.update({
      where: { id },
      data: {
        approvalStatus: input.approvalStatus,
        runStatus: runStatusFor(input.approvalStatus),
        reviewNote: input.reviewNote,
        submittedAt: input.approvalStatus === "SUBMITTED" ? now : campaign.submittedAt,
        approvedAt: ["APPROVED", "RUN_READY"].includes(input.approvalStatus) ? now : campaign.approvedAt,
        approvedById: ["APPROVED", "RUN_READY", "REJECTED"].includes(input.approvalStatus) ? requester.id : campaign.approvedById,
        queuedAt: input.approvalStatus === "RUN_READY" ? now : campaign.queuedAt
      },
      include: campaignInclude
    });
  },

  async deleteCampaign(requester: Requester, id: string) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only delete your own Sales Booster campaigns.");
    }
    if (!["DRAFT", "NEEDS_REVISION"].includes(campaign.approvalStatus) && !canApprove(requester.role)) {
      throw new Error("Only admin or director can delete submitted or approved campaigns.");
    }
    await prisma.salesBoosterCampaign.delete({ where: { id } });
    return { message: "Sales Booster campaign deleted" };
  },

  async connectorStatus() {
    return salesBoosterConnectors.status();
  },

  async runCampaign(requester: Requester, id: string) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({
      where: { id },
      include: campaignInclude
    });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only run your own Sales Booster campaigns.");
    }
    if (campaign.approvalStatus !== "RUN_READY") {
      throw new Error("Campaign must be approved and marked run-ready before API execution.");
    }

    const results = await salesBoosterConnectors.run(campaign);
    const hasPosted = results.some((result) => result.status === "POSTED" || result.status === "QUEUED");
    const hasFailed = results.some((result) => result.status === "FAILED");
    const runStatus = hasFailed ? "PARTIAL_OR_FAILED" : hasPosted ? "EXECUTED_OR_QUEUED" : "NOT_EXECUTED";

    return prisma.salesBoosterCampaign.update({
      where: { id },
      data: {
        runStatus,
        connectorResults: results as unknown as Prisma.InputJsonValue,
        lastRunAt: new Date()
      },
      include: campaignInclude
    });
  },

  async addMetricSnapshot(requester: Requester, id: string, input: MetricInput) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only update metrics for your own Sales Booster campaigns.");
    }

    return prisma.salesBoosterMetricSnapshot.create({
      data: {
        campaignId: id,
        platform: input.platform,
        reach: input.reach ?? 0,
        impressions: input.impressions ?? 0,
        clicks: input.clicks ?? 0,
        leads: input.leads ?? 0,
        admissions: input.admissions ?? 0,
        spend: input.spend ?? 0,
        revenue: input.revenue ?? 0,
        notes: input.notes,
        capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date()
      }
    });
  },

  async report(requester: Requester, id: string) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({
      where: { id },
      include: { ...campaignInclude, metricSnapshots: { orderBy: { capturedAt: "desc" } } }
    });
    if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
      throw new Error("You can only view reports for your own Sales Booster campaigns.");
    }

    const leadSource = sourceTag(campaign);
    const [attributedLeads, admissions] = await Promise.all([
      prisma.lead.findMany({
        where: { source: { contains: campaign.id, mode: "insensitive" } },
        include: { admissions: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.admission.findMany({
        where: { lead: { source: { contains: campaign.id, mode: "insensitive" } } }
      })
    ]);
    const metricTotals = sumMetrics(campaign.metricSnapshots);
    const totalLeads = Math.max(metricTotals.leads, attributedLeads.length);
    const totalAdmissions = Math.max(metricTotals.admissions, admissions.length);
    const totalRevenue = Math.max(metricTotals.revenue, admissions.reduce((sum, admission) => sum + admission.paidAmount, 0));

    return {
      campaign,
      leadSource,
      attributedLeads: attributedLeads.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        mobile: lead.mobile,
        email: lead.email,
        status: lead.status,
        targetExam: lead.targetExam,
        createdAt: lead.createdAt.toISOString(),
        admissions: lead.admissions.length
      })),
      totals: {
        ...metricTotals,
        leads: totalLeads,
        admissions: totalAdmissions,
        revenue: totalRevenue,
        ctr: safePercent(metricTotals.clicks, metricTotals.impressions || metricTotals.reach),
        cpl: safeCurrency(metricTotals.spend, totalLeads),
        cpa: safeCurrency(metricTotals.spend, totalAdmissions),
        roi: metricTotals.spend > 0 ? Math.round(((totalRevenue - metricTotals.spend) / metricTotals.spend) * 10000) / 100 : 0
      },
      snapshots: campaign.metricSnapshots
    };
  },

  async analytics(requester: Requester) {
    const campaigns = await prisma.salesBoosterCampaign.findMany({
      where: requester.role === Role.MARKETING_COORDINATOR ? { createdById: requester.id } : undefined,
      include: { metricSnapshots: true },
      orderBy: { createdAt: "desc" }
    });
    const campaignReports = await Promise.all(campaigns.slice(0, 50).map(async (campaign) => {
      const leadCount = await prisma.lead.count({ where: { source: { contains: campaign.id, mode: "insensitive" } } });
      const totals = sumMetrics(campaign.metricSnapshots);
      const leads = Math.max(totals.leads, leadCount);
      return {
        id: campaign.id,
        title: campaign.title,
        track: campaign.track,
        status: campaign.approvalStatus,
        runStatus: campaign.runStatus,
        leads,
        spend: totals.spend,
        revenue: totals.revenue,
        ctr: safePercent(totals.clicks, totals.impressions || totals.reach),
        cpl: safeCurrency(totals.spend, leads),
        roi: totals.spend > 0 ? Math.round(((totals.revenue - totals.spend) / totals.spend) * 10000) / 100 : 0
      };
    }));
    const totals = campaignReports.reduce((acc, item) => ({
      leads: acc.leads + item.leads,
      spend: acc.spend + item.spend,
      revenue: acc.revenue + item.revenue
    }), { leads: 0, spend: 0, revenue: 0 });

    return {
      summary: {
        campaigns: campaignReports.length,
        leads: totals.leads,
        spend: totals.spend,
        revenue: totals.revenue,
        cpl: safeCurrency(totals.spend, totals.leads),
        roi: totals.spend > 0 ? Math.round(((totals.revenue - totals.spend) / totals.spend) * 10000) / 100 : 0
      },
      campaigns: campaignReports,
      topCampaigns: [...campaignReports].sort((a, b) => b.leads - a.leads).slice(0, 5)
    };
  },

  async summary(requester: Requester) {
    const campaigns = await this.campaigns(requester);
    const statusCounts = campaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.approvalStatus] = (acc[campaign.approvalStatus] ?? 0) + 1;
      return acc;
    }, {});
    const trackCounts = campaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.track] = (acc[campaign.track] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalCampaigns: campaigns.length,
      statusCounts,
      trackCounts,
      runReady: campaigns.filter((campaign) => campaign.approvalStatus === "RUN_READY").length,
      connectorStatus: salesBoosterConnectors.status(),
      apiConnected: Object.values(salesBoosterConnectors.status()).some(Boolean),
      nextIntegration: "Meta, WhatsApp Cloud API, YouTube and Threads connectors"
    };
  }
};
