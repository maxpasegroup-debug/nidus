import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

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
      apiConnected: false,
      nextIntegration: "Meta, WhatsApp Cloud API, YouTube and Threads connectors"
    };
  }
};
