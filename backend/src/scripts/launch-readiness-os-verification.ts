import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { launchReadinessOsService } from "../modules/launch-readiness-os/launch-readiness-os.service.js";
import { eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const framework = launchReadinessOsService.framework();
const packageJson = read("package.json");
const rootPackageJson = read("../package.json");
const serviceSource = read("src/modules/launch-readiness-os/launch-readiness-os.service.ts");
const routesSource = read("src/modules/launch-readiness-os/launch-readiness-os.routes.ts");
const indexSource = read("src/modules/index.ts");
const phaseGates = read("../docs/nidus-audit/22-launch-phase-gates.md");

assert.equal(framework.name, "NIDUS Launch Readiness Operating System", "Launch Readiness OS name must be fixed");
for (const gate of ["BUILD", "TYPESCRIPT", "LINT", "PRISMA", "AUTH", "RBAC", "PAYMENTS", "WHATSAPP", "EMAIL", "QUEUE", "REPORT", "BACKUP"]) {
  assert.ok(framework.gates.some((item) => item.key === gate), `${gate} gate must exist`);
}

for (const script of [
  "test:auth",
  "test:roles",
  "test:payments",
  "test:whatsapp",
  "integrations:readiness",
  "queue:readiness",
  "test:reports-os",
  "backup:database",
  "backup:media"
]) {
  assert.match(packageJson, new RegExp(`"${script}"`), `${script} script must be registered`);
}
assert.match(rootPackageJson, /"build"/, "Root build script must exist");
assert.match(rootPackageJson, /"test:public-beta"/, "Root public beta test chain must exist");

assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/checklist/, "Checklist route must exist");
assert.match(indexSource, /launch-readiness-os/, "Launch Readiness OS must be mounted");
assert.match(serviceSource, /queueNames/, "Queue readiness evidence must use existing queue names");
assert.match(serviceSource, /LAUNCH_READINESS_CHECKLIST_VIEWED/, "Launch readiness view event must be emitted");

for (const moduleName of [
  "academic-os",
  "admissions-os",
  "performance-os",
  "student-competition-os",
  "class-rating-os",
  "reports-os",
  "communication-os"
]) {
  assert.match(indexSource, new RegExp(moduleName), `${moduleName} must remain mounted`);
}

assert.match(phaseGates, /Phase 14 - Testing and Launch Readiness/, "Phase 14 gate must exist");
assert.match(phaseGates, /Dashboard Rule/, "Dashboard rule must remain locked");
assert.ok(eventDefinitions.some((event) => event.eventName === "LAUNCH_READINESS_CHECKLIST_VIEWED"), "Launch readiness event must exist");

console.log("Launch Readiness OS verification passed");
