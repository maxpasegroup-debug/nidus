import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

export const allowedToprankExams = ["nda-army", "nda-navy", "nda-air-force", "nda-naval-academy"] as const;
export type ToprankExamSlug = (typeof allowedToprankExams)[number];

type NidusUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const activeSubscriptionStatuses = ["ACTIVE", "PAID", "SUCCESS", "VERIFIED"];
const bridgeTtlSeconds = 180;

export function allowedCareer7Exams() {
  const configured = env.CAREER7_ALLOWED_EXAMS.split(",").map((item) => item.trim()).filter(Boolean);
  return configured.length ? configured : [...allowedToprankExams];
}

export function assertAllowedExam(examSlug: string): asserts examSlug is ToprankExamSlug {
  const allowed = allowedCareer7Exams();
  if (!allowed.includes(examSlug)) throw new Error("TOPRANK exam route is not available for this NIDUS tenant.");
}

export function mapSubscriptionPlanToCareer7Tier(planName?: string | null) {
  const normalized = (planName ?? "").toLowerCase();
  if (normalized.includes("signature")) return "signature_identity";
  if (normalized.includes("top rank") || normalized.includes("toprank")) return "tier_3_top_rank";
  if (normalized.includes("real mentor") || normalized.includes("ai + real") || normalized.includes("ai real")) return "tier_2_ai_real_mentor";
  if (normalized.includes("ai mentor") || normalized.includes("mentor")) return "tier_1_ai_mentor";
  return "tier_1_ai_mentor";
}

function bridgeSignature(payload: string) {
  return crypto.createHmac("sha256", env.CAREER7_BRIDGE_SECRET).update(payload).digest("hex");
}

async function userSubscriptionTier(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: activeSubscriptionStatuses },
      endDate: { gte: new Date() }
    },
    orderBy: { endDate: "desc" }
  });
  return mapSubscriptionPlanToCareer7Tier(subscription?.planName);
}

async function callCareer7Bridge(payload: Record<string, unknown>) {
  if (!env.CAREER7_BASE_URL || !env.CAREER7_BRIDGE_SECRET) {
    throw new Error("TOPRANK bridge is not configured yet.");
  }
  if (env.CAREER7_NIDUS_TENANT_ID !== "nidus-top-rank") {
    throw new Error("TOPRANK tenant is not authorized for this deployment.");
  }

  const body = JSON.stringify(payload);
  const response = await fetch(`${env.CAREER7_BASE_URL.replace(/\/+$/, "")}/bridge/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nidus-tenant": env.CAREER7_NIDUS_TENANT_ID,
      "x-nidus-signature": bridgeSignature(body)
    },
    body
  });

  if (!response.ok) throw new Error("TOPRANK launch is temporarily unavailable. Please try again later.");
  const data = await response.json() as { launchUrl?: unknown };
  if (typeof data.launchUrl !== "string" || !/^https:\/\//i.test(data.launchUrl)) {
    throw new Error("TOPRANK launch response was invalid.");
  }
  return data.launchUrl;
}

export const toprankService = {
  allowedExams: allowedCareer7Exams,
  mapSubscriptionPlanToCareer7Tier,

  async createSession(user: NidusUser, examSlug: string) {
    assertAllowedExam(examSlug);
    const subscriptionTier = await userSubscriptionTier(user.id);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + bridgeTtlSeconds;
    const payload = {
      tenantId: env.CAREER7_NIDUS_TENANT_ID,
      source: "nidus",
      examSlug,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      subscriptionTier,
      issuedAt,
      expiresAt
    };

    const launchUrl = await callCareer7Bridge(payload);
    return { launchUrl };
  },

  async createAdminSession(user: NidusUser, target: "admin" | "ops") {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
      tenantId: env.CAREER7_NIDUS_TENANT_ID,
      source: "nidus",
      target,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      subscriptionTier: "signature_identity",
      issuedAt,
      expiresAt: issuedAt + bridgeTtlSeconds
    };
    const launchUrl = await callCareer7Bridge(payload);
    return { launchUrl };
  },

  async status(_userId: string) {
    return {
      connected: Boolean(env.CAREER7_BASE_URL && env.CAREER7_BRIDGE_SECRET),
      profileSaved: false,
      diagnosticCompleted: false,
      roadmapApproved: false,
      todaysMission: null,
      readinessScore: null,
      nextAction: "TOPRANK status will appear after your first mission."
    };
  }
};
