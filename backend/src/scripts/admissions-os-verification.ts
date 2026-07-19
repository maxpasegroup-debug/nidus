import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { admissionsOsService } from "../modules/admissions-os/admissions-os.service.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const journey = admissionsOsService.journey();

assert.equal(journey.name, "NIDUS Admissions Operating System", "Admissions OS name must be fixed");
assert.equal(journey.pipeline[0].key, "LEAD", "Admissions OS must start from Lead");
assert.equal(journey.pipeline.at(-1)?.key, "ACADEMIC_PLANNER_ASSIGNMENT", "Admissions OS must end at academic planner assignment");
assert.ok(journey.pipeline.some((step) => step.key === "COUNSELLING"), "Counselling step must exist");
assert.ok(journey.pipeline.some((step) => step.key === "FEE_COLLECTION"), "Fee collection step must exist");
assert.ok(journey.pipeline.some((step) => step.key === "BATCH_ALLOCATION"), "Batch allocation step must exist");
assert.ok(journey.pipeline.some((step) => step.key === "PARENT_INVITATION"), "Parent invitation step must exist");

assert.equal(typeof admissionsOsService.dashboard, "function", "Admissions OS dashboard must exist");
assert.equal(typeof admissionsOsService.leadJourney, "function", "Admissions OS lead journey must exist");
assert.equal(typeof admissionsOsService.roleWorkflow, "function", "Admissions OS role workflow must exist");

assert.match(source("src/modules/admissions-os/admissions-os.routes.ts"), /admissionsOsRouter\.get\("\/journey"/, "Admissions OS journey route must exist");
assert.match(source("src/modules/admissions-os/admissions-os.routes.ts"), /admissionsOsRouter\.get\("\/dashboard"/, "Admissions OS dashboard route must exist");
assert.match(source("src/modules/admissions-os/admissions-os.routes.ts"), /admissionsOsRouter\.get\("\/leads\/:leadId"/, "Admissions OS lead journey route must exist");
assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/admissions-os", admissionsOsRouter\)/, "Admissions OS router must be mounted");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.lead/, "Admissions OS must reuse Lead records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.followUp/, "Admissions OS must reuse FollowUp records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.counsellingBooking/, "Admissions OS must reuse CounsellingBooking records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.admission/, "Admissions OS must reuse Admission records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.feePlan/, "Admissions OS must reuse FeePlan records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /prisma\.batchStudent/, "Admissions OS must reuse BatchStudent records");
assert.match(source("src/modules/admissions-os/admissions-os.service.ts"), /parentStudentInvitation/, "Admissions OS must reuse parent invitation records");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /ADMISSIONS_OS_VIEWED/, "Admissions OS viewed event must be registered");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /ADMISSIONS_OS_LEAD_VIEWED/, "Admissions OS lead viewed event must be registered");

console.log("Admissions OS verification passed");
