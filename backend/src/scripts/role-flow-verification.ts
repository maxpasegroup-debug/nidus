import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const schema = read("prisma/schema.prisma");
const authService = read("src/modules/auth/auth.service.ts");
const authMiddleware = read("src/modules/auth/auth.middleware.ts");
const dashboardRoutes = read("src/modules/dashboard/dashboard.routes.ts");
const dashboardService = read("src/modules/dashboard/dashboard.service.ts");

for (const role of ["ADMIN", "GUEST", "STUDENT", "PARENT", "TEACHER", "DIRECTOR", "TELECALLER", "MARKETING_COORDINATOR"]) {
  assert.match(schema, new RegExp(`\\b${role}\\b`), `Role ${role} must exist in Prisma enum`);
}

assert.match(schema, /model Institute/, "institute hierarchy model must exist");
assert.match(schema, /model Branch[\s\S]*instituteId/, "branch must support institute assignment");
assert.match(schema, /model RoleActivity/, "role activity tracking must exist");
assert.match(schema, /roleOnboardingStatus/, "role onboarding status must exist");
assert.match(schema, /roleMetadata/, "role metadata must exist");
assert.match(schema, /monitoringPermissions/, "parent monitoring permissions must exist");

assert.match(authService, /ADMIN_BOOTSTRAP_EMAIL = "nidusacademycalicut@gmail.com"/, "bootstrap admin email must be locked");
assert.match(authService, /role = isBootstrapAdmin \? Role\.ADMIN/, "bootstrap admin registration must force ADMIN role");
assert.match(authService, /emailVerified: isBootstrapAdmin/, "bootstrap admin must bypass verification");
assert.match(authMiddleware, /requireInstituteScope/, "institute access middleware must exist");

for (const route of ["teacher", "director", "telecaller", "marketing"]) {
  assert.match(dashboardRoutes, new RegExp(`/${route}`), `${route} dashboard route must exist`);
  assert.match(dashboardService, new RegExp(`get${route[0].toUpperCase()}${route.slice(1)}Dashboard`), `${route} dashboard service must exist`);
}

console.log("Role flow verification checks passed.");
