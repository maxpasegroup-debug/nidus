import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { DEFAULT_ACCOUNT_PIN } from "../modules/auth/auth.v2.service.js";
import { Prisma, Role } from "../generated/prisma/client.js";

const DIRECTOR_EMAIL = "ltcdraswanth@gmail.com";
const DIRECTOR_MOBILE = "+918848139053";
const applyChanges = process.argv.includes("--apply");

function normalizeMobile(value?: string | null) {
  return value?.trim().replace(/[\s()-]/g, "") ?? "";
}

function isValidMobile(value?: string | null) {
  return /^\+?\d{7,15}$/.test(normalizeMobile(value));
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toJsonObject(value: Record<string, unknown>) {
  return value as Prisma.InputJsonObject;
}

function duplicateMobileGroups(users: Array<{ id: string; name: string; mobile: string }>) {
  const groups = new Map<string, Array<{ id: string; name: string; mobile: string }>>();
  for (const user of users) {
    const key = normalizeMobile(user.mobile).replace(/^\+91/, "");
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), user]);
  }
  return Array.from(groups.values()).filter((group) => group.length > 1);
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      password: true,
      role: true,
      roleMetadata: true,
      isDisabled: true
    },
    orderBy: { createdAt: "asc" }
  });

  const invalidMobileUsers = users.filter((user) => !isValidMobile(user.mobile));
  const duplicates = duplicateMobileGroups(users);
  const director = users.find((user) => user.email.toLowerCase() === DIRECTOR_EMAIL);
  const defaultPinCandidates = users.filter((user) => {
    const metadata = metadataObject(user.roleMetadata);
    const hasStoredPin = typeof metadata.accessPin === "string" && /^\d{4}$/.test(metadata.accessPin);
    return !hasStoredPin && (metadata.defaultPassword === true || metadata.defaultPin === true || user.role === Role.GUEST);
  });

  const report = {
    mode: applyChanges ? "apply" : "dry-run",
    totalUsers: users.length,
    invalidMobileUsers: invalidMobileUsers.map((user) => ({ id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role })),
    duplicateMobileGroups: duplicates.map((group) => group.map((user) => ({ id: user.id, name: user.name, mobile: user.mobile }))),
    directorMobile: {
      email: DIRECTOR_EMAIL,
      expectedMobile: DIRECTOR_MOBILE,
      found: Boolean(director),
      currentMobile: director?.mobile ?? null,
      needsUpdate: Boolean(director && normalizeMobile(director.mobile) !== DIRECTOR_MOBILE)
    },
    defaultPinCandidates: defaultPinCandidates.length,
    applied: {
      directorMobileUpdated: false,
      defaultPinUsersReset: 0
    }
  };

  if (!applyChanges) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (duplicates.length > 0) {
    throw new Error("Duplicate mobile numbers detected. Resolve duplicates before applying mobile PIN rollout.");
  }

  if (invalidMobileUsers.length > 0) {
    throw new Error("Invalid or missing mobile numbers detected. Resolve them before applying mobile PIN rollout.");
  }

  const defaultPinHash = await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12);
  if (director && normalizeMobile(director.mobile) !== DIRECTOR_MOBILE) {
    await prisma.user.update({
      where: { id: director.id },
      data: {
        mobile: DIRECTOR_MOBILE,
        mobileVerified: true,
        role: Role.DIRECTOR,
        isDisabled: false,
        lockedUntil: null,
        loginFailureCount: 0,
        roleMetadata: toJsonObject({
          ...metadataObject(director.roleMetadata),
          defaultPin: true,
          mobileLoginUpdatedAt: new Date().toISOString(),
          mobileLoginUpdatedBy: "mobile-pin-auth-rollout"
        })
      }
    });
    report.applied.directorMobileUpdated = true;
  }

  for (const user of defaultPinCandidates) {
    const metadata = metadataObject(user.roleMetadata);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: defaultPinHash,
        isDisabled: false,
        lockedUntil: null,
        loginFailureCount: 0,
        roleMetadata: toJsonObject({
          ...metadata,
          defaultPassword: true,
          defaultPin: true,
          accessPin: DEFAULT_ACCOUNT_PIN,
          pinResetByRolloutAt: new Date().toISOString()
        })
      }
    });
    report.applied.defaultPinUsersReset += 1;
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
