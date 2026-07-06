import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

import { prisma } from "../config/prisma.js";
import { Prisma, Role } from "../generated/prisma/client.js";
import { DEFAULT_ACCOUNT_PASSWORD } from "../modules/auth/auth.v2.service.js";

export async function ensureVideoEditor() {
  const email = "ilabdtlp@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  const existingMetadata = existing?.roleMetadata && typeof existing.roleMetadata === "object" && !Array.isArray(existing.roleMetadata)
    ? existing.roleMetadata as Prisma.InputJsonObject
    : {};
  const roleMetadata = {
    ...existingMetadata,
    designation: "Video Editor",
    department: "Academic Media",
    employmentType: "FULL_TIME",
    dashboardTemplate: "VIDEO_EDITOR",
    permissions: ["view_all_batches", "view_subject_allocations", "upload_materials_on_behalf"],
    focusAreas: ["Recorded class uploads", "Lesson resource quality", "Batch library publishing"],
    status: "ACTIVE",
    seededBy: "video-editor-seed",
    defaultPassword: existing ? existingMetadata.defaultPassword ?? false : true,
  } as Prisma.InputJsonObject;
  const now = new Date();
  const password = existing?.password ?? await bcrypt.hash(DEFAULT_ACCOUNT_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Jenifer KM",
      role: Role.TEACHER,
      roleMetadata,
      isDisabled: false,
      disabledAt: null,
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: existing?.roleActivatedAt ?? now,
      lastRoleActivityAt: now,
    },
    create: {
      name: "Jenifer KM",
      email,
      mobile: "+919000001016",
      password,
      role: Role.TEACHER,
      roleMetadata,
      emailVerified: true,
      mobileVerified: true,
      isDisabled: false,
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: now,
      lastRoleActivityAt: now,
    },
  });

  await prisma.faculty.upsert({
    where: { userId: user.id },
    update: { department: "Academic Media", designation: "Video Editor", status: "ACTIVE" },
    create: { userId: user.id, department: "Academic Media", designation: "Video Editor", joiningDate: now, salary: 0, status: "ACTIVE" },
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role, dashboardTemplate: "VIDEO_EDITOR", action: existing ? "updated" : "created" };
}

function databaseTarget() {
  try {
    const parsed = new URL(process.env.DATABASE_URL ?? "");
    return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "DATABASE_URL is missing or invalid";
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = await ensureVideoEditor();
    console.log(JSON.stringify({ seeded: true, database: databaseTarget(), result }, null, 2));
  } catch (error: any) {
    if (error?.code === "P1000") {
      console.error(JSON.stringify({
        seeded: false,
        database: databaseTarget(),
        error: "Database authentication failed. The local DATABASE_URL credentials are invalid or point to the retired database. Run this seed with Railway production environment variables, or update backend/.env with the current production DATABASE_URL.",
      }, null, 2));
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
