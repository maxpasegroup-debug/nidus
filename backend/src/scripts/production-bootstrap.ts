import { prisma } from "../config/prisma.js";
import { AuthServiceV2 } from "../modules/auth/auth.v2.service.js";
import { ensureDefaultPermissions } from "../modules/admin-center/admin-center.rbac.js";
import { seedAcademyArchitecture } from "./academy-architecture.js";
import { ensureNidusTeam } from "./nidus-team.js";
import { ensurePsychometricAssessments } from "./psychometric-assessments.js";

const defaultSettings = [
  { key: "app.name", value: "NIDUS", category: "app" },
  { key: "branding.primaryColor", value: "#0b1f3a", category: "branding" },
  { key: "branding.accentColor", value: "#c9a646", category: "branding" },
  { key: "email.sender", value: "NIDUS <noreply@nidusacademy.in>", category: "email" },
  { key: "security.sessionTtl", value: "7d", category: "security" },
  { key: "security.passwordRotationRequired", value: "true", category: "security" },
  { key: "operations.backupPolicy", value: "daily-14-weekly-8-monthly-12", category: "operations" }
];

async function ensureDefaultSettings() {
  await Promise.all(
    defaultSettings.map((setting) =>
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    )
  );
}

await AuthServiceV2.ensureSuperAdmin();
await ensureDefaultPermissions();
await ensureDefaultSettings();
const team = await ensureNidusTeam();
const academy = await seedAcademyArchitecture();
const psychometric = await ensurePsychometricAssessments();

const [users, permissions, settings] = await Promise.all([
  prisma.user.count(),
  prisma.permission.count(),
  prisma.systemSetting.count()
]);

console.log(JSON.stringify({ bootstrapped: true, users, permissions, settings, teamUsers: team.length, academy, psychometric }));
await prisma.$disconnect();
