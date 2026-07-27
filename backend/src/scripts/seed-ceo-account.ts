import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";

const CEO_MOBILE = "8089239823";
const CEO_PIN = "2055";
const CEO_EMAIL = "ceo@nidusacademy.in";

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function main() {
  const password = await bcrypt.hash(CEO_PIN, 12);
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { mobile: CEO_MOBILE },
        { mobile: `+91${CEO_MOBILE}` },
        { email: CEO_EMAIL },
      ],
    },
  });

  const roleMetadata = {
    ...metadataObject(existing?.roleMetadata),
    superAdmin: true,
    dashboardTemplate: "CEO",
    designation: "CEO",
    department: "Executive Office",
    accessPin: CEO_PIN,
    loginMobile: CEO_MOBILE,
    defaultPassword: false,
    defaultPin: false,
    seededBy: "seed-ceo-account",
    seededAt: new Date().toISOString(),
  };

  const data = {
    name: "CEO",
    email: CEO_EMAIL,
    mobile: CEO_MOBILE,
    password,
    role: Role.ADMIN,
    emailVerified: true,
    mobileVerified: true,
    isDisabled: false,
    disabledAt: null,
    loginFailureCount: 0,
    lockedUntil: null,
    roleOnboardingStatus: "ACTIVE",
    roleActivatedAt: existing?.roleActivatedAt ?? new Date(),
    lastRoleActivityAt: new Date(),
    roleMetadata,
  };

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data })
    : await prisma.user.create({ data });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CEO_ACCOUNT_SEEDED",
      module: "auth",
      description: "Seeded CEO dashboard account",
    },
  }).catch(() => undefined);

  console.log(JSON.stringify({
    seeded: true,
    userId: user.id,
    name: user.name,
    role: user.role,
    mobile: CEO_MOBILE,
    dashboardTemplate: "CEO",
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
