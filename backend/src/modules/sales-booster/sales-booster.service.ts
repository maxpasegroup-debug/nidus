import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { mediaService } from "../media/media.service.js";
import { salesBoosterConnectors } from "./sales-booster-connectors.service.js";

type Requester = { id: string; role: Role };

type CampaignInput = {
  title: string;
  track: string;
  goal: string;
  creativeName?: string;
  creativeType?: string;
  creativeUrl?: string;
  creativeMediaId?: string;
  creativeSize?: number;
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

type ScheduleInput = {
  scheduledAt: string;
  scheduleNote?: string;
};

type AudienceContactInput = {
  fullName: string;
  phone: string;
  email?: string;
  segment?: string;
  source?: string;
  interest?: string;
  optIn?: boolean;
  notes?: string;
};

type BroadcastInput = {
  segment?: string;
  templateName?: string;
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

function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

async function assertCampaignAccess(requester: Requester, campaign: { createdById: string }) {
  if (requester.role === Role.MARKETING_COORDINATOR && campaign.createdById !== requester.id) {
    throw new Error("You can only manage your own Sales Booster campaigns.");
  }
}

function creativeTypeFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "brochure";
  return mimeType;
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
        creativeUrl: input.creativeUrl,
        creativeMediaId: input.creativeMediaId,
        creativeSize: input.creativeSize,
        creativeUploadedAt: input.creativeUrl ? new Date() : undefined,
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
        creativeUrl: input.creativeUrl,
        creativeMediaId: input.creativeMediaId,
        creativeSize: input.creativeSize,
        creativeUploadedAt: input.creativeUrl ? new Date() : undefined,
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

  async uploadCreative(requester: Requester, file: Express.Multer.File) {
    if (!file) throw new Error("Creative file is required.");
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/") && file.mimetype !== "application/pdf") {
      throw new Error("Upload a poster image, campaign video, reel, or PDF brochure.");
    }
    const mediaFile = await mediaService.uploadFile(file, undefined, requester.id);
    return {
      id: mediaFile.id,
      name: mediaFile.originalName,
      fileName: mediaFile.fileName,
      type: creativeTypeFor(mediaFile.fileType),
      mimeType: mediaFile.fileType,
      size: mediaFile.fileSize,
      url: mediaFile.cloudinaryUrl,
      uploadedAt: mediaFile.createdAt
    };
  },

  async attachCreative(requester: Requester, id: string, input: { creativeName?: string; creativeType?: string; creativeUrl?: string; creativeMediaId?: string; creativeSize?: number }) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    await assertCampaignAccess(requester, campaign);
    if (!["DRAFT", "NEEDS_REVISION"].includes(campaign.approvalStatus) && !canApprove(requester.role)) {
      throw new Error("Only draft or revision campaigns can change creative unless admin/director approves the update.");
    }
    return prisma.salesBoosterCampaign.update({
      where: { id },
      data: {
        creativeName: input.creativeName,
        creativeType: input.creativeType,
        creativeUrl: input.creativeUrl,
        creativeMediaId: input.creativeMediaId,
        creativeSize: input.creativeSize,
        creativeUploadedAt: input.creativeUrl ? new Date() : undefined
      },
      include: campaignInclude
    });
  },

  async connectorStatus() {
    return salesBoosterConnectors.status();
  },

  async audience(requester: Requester) {
    const contacts = await prisma.salesBoosterAudienceContact.findMany({
      where: requester.role === Role.MARKETING_COORDINATOR ? { createdById: requester.id } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 500
    });
    const segments = contacts.reduce<Record<string, number>>((acc, contact) => {
      acc[contact.segment] = (acc[contact.segment] ?? 0) + 1;
      return acc;
    }, {});
    return { contacts, segments };
  },

  async addAudienceContact(requester: Requester, input: AudienceContactInput) {
    const phone = cleanPhone(input.phone);
    if (phone.length < 8) throw new Error("A valid WhatsApp number is required.");
    const segment = input.segment?.trim() || "General";
    return prisma.salesBoosterAudienceContact.upsert({
      where: { phone_segment: { phone, segment } },
      update: {
        fullName: input.fullName,
        email: input.email,
        source: input.source ?? "Manual",
        interest: input.interest,
        optIn: input.optIn ?? true,
        notes: input.notes,
        whatsappStatus: input.optIn === false ? "OPTED_OUT" : "READY"
      },
      create: {
        fullName: input.fullName,
        phone,
        email: input.email,
        segment,
        source: input.source ?? "Manual",
        interest: input.interest,
        optIn: input.optIn ?? true,
        notes: input.notes,
        whatsappStatus: input.optIn === false ? "OPTED_OUT" : "READY",
        createdById: requester.id
      }
    });
  },

  async importLeadsToAudience(requester: Requester, segment = "CRM Leads") {
    const leads = await prisma.lead.findMany({
      where: { mobile: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: 250
    });
    let imported = 0;
    for (const lead of leads) {
      const phone = cleanPhone(lead.mobile);
      if (phone.length < 8) continue;
      await prisma.salesBoosterAudienceContact.upsert({
        where: { phone_segment: { phone, segment } },
        update: {
          fullName: lead.fullName,
          email: lead.email,
          source: `CRM: ${lead.source}`,
          interest: lead.targetExam,
          optIn: true,
          whatsappStatus: "READY"
        },
        create: {
          fullName: lead.fullName,
          phone,
          email: lead.email,
          segment,
          source: `CRM: ${lead.source}`,
          interest: lead.targetExam,
          optIn: true,
          whatsappStatus: "READY",
          createdById: requester.id
        }
      });
      imported += 1;
    }
    return { imported, segment };
  },

  async broadcastWhatsApp(requester: Requester, input: BroadcastInput) {
    const contacts = await prisma.salesBoosterAudienceContact.findMany({
      where: {
        ...(requester.role === Role.MARKETING_COORDINATOR ? { createdById: requester.id } : {}),
        ...(input.segment ? { segment: input.segment } : {}),
        optIn: true,
        whatsappStatus: { in: ["READY", "QUEUED", "SENT"] }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    const result = await salesBoosterConnectors.whatsappBroadcast(contacts.map((contact) => contact.phone), input.templateName);
    if (result.status === "QUEUED") {
      await prisma.salesBoosterAudienceContact.updateMany({
        where: { id: { in: contacts.map((contact) => contact.id) } },
        data: { whatsappStatus: "QUEUED", lastContactedAt: new Date() }
      });
    }
    return { result, selectedContacts: contacts.length };
  },

  async runCampaign(requester: Requester, id: string) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({
      where: { id },
      include: campaignInclude
    });
    await assertCampaignAccess(requester, campaign);
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
        scheduleStatus: "EXECUTED",
        connectorResults: results as unknown as Prisma.InputJsonValue,
        lastRunAt: new Date()
      },
      include: campaignInclude
    });
  },

  async scheduleCampaign(requester: Requester, id: string, input: ScheduleInput) {
    const campaign = await prisma.salesBoosterCampaign.findUniqueOrThrow({ where: { id } });
    await assertCampaignAccess(requester, campaign);
    if (campaign.approvalStatus !== "RUN_READY") {
      throw new Error("Only run-ready campaigns can be scheduled.");
    }
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Invalid schedule date.");
    }

    return prisma.salesBoosterCampaign.update({
      where: { id },
      data: {
        scheduledAt,
        scheduleNote: input.scheduleNote,
        scheduleStatus: scheduledAt <= new Date() ? "DUE" : "SCHEDULED",
        queuedAt: scheduledAt
      },
      include: campaignInclude
    });
  },

  async scheduledCampaigns(requester: Requester) {
    const now = new Date();
    const campaigns = await prisma.salesBoosterCampaign.findMany({
      where: {
        ...(requester.role === Role.MARKETING_COORDINATOR ? { createdById: requester.id } : {}),
        scheduleStatus: { in: ["SCHEDULED", "DUE"] }
      },
      include: campaignInclude,
      orderBy: { scheduledAt: "asc" }
    });

    const dueIds = campaigns
      .filter((campaign) => campaign.scheduleStatus === "SCHEDULED" && campaign.scheduledAt && campaign.scheduledAt <= now)
      .map((campaign) => campaign.id);

    if (dueIds.length) {
      await prisma.salesBoosterCampaign.updateMany({
        where: { id: { in: dueIds } },
        data: { scheduleStatus: "DUE" }
      });
    }

    return campaigns.map((campaign) => ({
      ...campaign,
      scheduleStatus: dueIds.includes(campaign.id) ? "DUE" : campaign.scheduleStatus
    }));
  },

  async runDueCampaigns(requester: Requester) {
    const dueCampaigns = await this.scheduledCampaigns(requester);
    const executable = dueCampaigns.filter((campaign) => campaign.scheduleStatus === "DUE" && campaign.approvalStatus === "RUN_READY");
    const results = [];

    for (const campaign of executable.slice(0, 10)) {
      try {
        results.push({ id: campaign.id, status: "EXECUTED", campaign: await this.runCampaign(requester, campaign.id) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Campaign execution failed";
        await prisma.salesBoosterCampaign.update({
          where: { id: campaign.id },
          data: { scheduleStatus: "FAILED", runStatus: "SCHEDULED_RUN_FAILED", reviewNote: message }
        });
        results.push({ id: campaign.id, status: "FAILED", message });
      }
    }

    return {
      due: dueCampaigns.filter((campaign) => campaign.scheduleStatus === "DUE").length,
      executed: results.filter((result) => result.status === "EXECUTED").length,
      failed: results.filter((result) => result.status === "FAILED").length,
      results
    };
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
