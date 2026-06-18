import bcrypt from "bcryptjs";
import { prisma } from "../../dist/config/prisma.js";

const DEFAULT_PASSWORD = "123456789";

const facultyAccounts = [
  {
    name: "Vidhya",
    email: "vidhya.teacher@nidusacademy.in",
    mobile: "9000001101",
    roleMetadata: { subjects: ["Physics"], seededBy: "faculty-completion-sprint", contactPlaceholder: true },
  },
  {
    name: "Ananya",
    email: "ananya.teacher@nidusacademy.in",
    mobile: "9000001102",
    roleMetadata: { subjects: ["History / Polity / Current Affairs"], seededBy: "faculty-completion-sprint", contactPlaceholder: true },
  },
];

const report = {
  facultyCreated: [],
  facultyConverted: [],
  facultyReused: [],
};

async function ensureTeacher(account, passwordHash) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: account.email }, { mobile: account.mobile }, { name: { equals: account.name, mode: "insensitive" } }] },
    select: { id: true, name: true, email: true, mobile: true, role: true, roleMetadata: true },
  });

  if (existing) {
    if (existing.role !== "TEACHER") {
      const metadata = typeof existing.roleMetadata === "object" && existing.roleMetadata !== null ? existing.roleMetadata : {};
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "TEACHER",
          roleOnboardingStatus: "ACTIVE",
          roleActivatedAt: new Date(),
          lastRoleActivityAt: new Date(),
          emailVerified: true,
          mobileVerified: true,
          roleMetadata: { ...metadata, ...account.roleMetadata, convertedToFacultyAt: new Date().toISOString() },
        },
        select: { id: true, name: true, email: true, mobile: true, role: true },
      });
      report.facultyConverted.push({ id: updated.id, name: updated.name, from: existing.role, to: updated.role });
      return updated;
    }
    report.facultyReused.push({ id: existing.id, name: existing.name, role: existing.role });
    return existing;
  }

  const created = await prisma.user.create({
    data: {
      name: account.name,
      email: account.email,
      mobile: account.mobile,
      password: passwordHash,
      role: "TEACHER",
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: new Date(),
      lastRoleActivityAt: new Date(),
      emailVerified: true,
      mobileVerified: true,
      roleMetadata: {
        ...account.roleMetadata,
        defaultPassword: true,
        passwordPolicy: "default-hash-no-plaintext-metadata",
      },
    },
    select: { id: true, name: true, email: true, mobile: true, role: true },
  });
  report.facultyCreated.push({ id: created.id, name: created.name, email: created.email, mobile: created.mobile });
  return created;
}

async function convertSilmiya() {
  const existing = await prisma.user.findFirst({
    where: { name: { contains: "Silmiya", mode: "insensitive" } },
    select: { id: true, name: true, email: true, mobile: true, role: true, roleMetadata: true },
  });
  if (!existing) throw new Error("Silmiya account not found");
  if (existing.role === "TEACHER") {
    report.facultyReused.push({ id: existing.id, name: existing.name, role: existing.role });
    return existing;
  }
  const metadata = typeof existing.roleMetadata === "object" && existing.roleMetadata !== null ? existing.roleMetadata : {};
  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: "TEACHER",
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: new Date(),
      lastRoleActivityAt: new Date(),
      emailVerified: true,
      mobileVerified: true,
      roleMetadata: {
        ...metadata,
        subjects: ["Geography / Economics"],
        convertedFromGuest: true,
        seededBy: "faculty-completion-sprint",
      },
    },
    select: { id: true, name: true, email: true, mobile: true, role: true },
  });
  report.facultyConverted.push({ id: updated.id, name: updated.name, from: existing.role, to: updated.role });
  return updated;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  for (const account of facultyAccounts) {
    await ensureTeacher(account, passwordHash);
  }
  await convertSilmiya();
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
