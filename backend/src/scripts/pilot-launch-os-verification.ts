import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eventDefinitions } from "../modules/event-engine/event-taxonomy.js";
import { pilotLaunchOsService } from "../modules/pilot-launch-os/pilot-launch-os.service.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const framework = pilotLaunchOsService.framework();
const packageJson = read("package.json");
const serviceSource = read("src/modules/pilot-launch-os/pilot-launch-os.service.ts");
const routesSource = read("src/modules/pilot-launch-os/pilot-launch-os.routes.ts");
const indexSource = read("src/modules/index.ts");
const phaseGates = read("../docs/nidus-audit/22-launch-phase-gates.md");
const phaseDoc = read("../docs/nidus-audit/36-phase-15-pilot-launch.md");

assert.equal(framework.name, "NIDUS Pilot Launch Operating System", "Pilot Launch OS name must be fixed");
assert.equal(framework.duration.minimumDays, 7, "Pilot minimum duration must be 7 days");
assert.equal(framework.duration.maximumDays, 14, "Pilot maximum duration must be 14 days");

for (const key of ["DIRECTOR", "ACADEMIC_HEAD", "TEACHERS", "ADMISSION_CELL", "ACCOUNTS", "STUDENTS", "PARENTS"]) {
  assert.ok(framework.pilotRoles.some((item) => item.key === key), `${key} pilot roster check must exist`);
}

for (const key of ["PILOT_DURATION", "PILOT_ROSTER", "DAILY_RHYTHM", "ACADEMIC_FLOW", "ADMISSION_FLOW", "COMMUNICATION_FLOW", "GO_NO_GO"]) {
  assert.ok(framework.framework.some((item) => item.key === key), `${key} framework item must exist`);
}

assert.match(routesSource, /allowRoles\(Role\.ADMIN, Role\.DIRECTOR\)/, "Pilot Launch OS must be Director/Admin protected");
assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/readiness/, "Readiness route must exist");
assert.match(indexSource, /pilot-launch-os/, "Pilot Launch OS must be mounted");
assert.match(packageJson, /"test:pilot-launch-os"/, "Pilot Launch OS verification script must be registered");

for (const reusedRecord of ["prisma.user.groupBy", "prisma.batch", "prisma.parentStudentLink", "prisma.auditLog", "prisma.queueJobLog"]) {
  assert.match(serviceSource, new RegExp(reusedRecord.replace(".", "\\.")), `${reusedRecord} must be reused`);
}

assert.match(serviceSource, /dashboardRule/, "Dashboard rule must be returned in readiness output");
assert.match(serviceSource, /Current Prisma roles do not include a dedicated ACCOUNTS role/, "Accounts role limitation must remain explicit");
assert.match(phaseGates, /Phase 15 - Pilot Launch/, "Phase 15 gate must exist");
assert.match(phaseGates, /Status: Complete/, "Phase 15 must be marked complete");
assert.match(phaseDoc, /Pending Real-World Executions/, "Pending real-world executions must be documented");
assert.ok(eventDefinitions.some((event) => event.eventName === "PILOT_READINESS_VIEWED"), "Pilot readiness event must exist");

console.log("Pilot Launch OS verification passed");
