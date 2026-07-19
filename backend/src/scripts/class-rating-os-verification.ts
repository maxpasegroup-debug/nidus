import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { classRatingOsService } from "../modules/class-rating-os/class-rating-os.service.js";
import { eventCategories, eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

const root = process.cwd();
const framework = classRatingOsService.framework();
const serviceSource = readFileSync(join(root, "src/modules/class-rating-os/class-rating-os.service.ts"), "utf8");
const routesSource = readFileSync(join(root, "src/modules/class-rating-os/class-rating-os.routes.ts"), "utf8");
const indexSource = readFileSync(join(root, "src/modules/index.ts"), "utf8");
const performanceSource = readFileSync(join(root, "src/modules/performance-os/performance-os.service.ts"), "utf8");

assert.equal(framework.name, "NIDUS Class Rating Operating System", "Class Rating OS name must be fixed");
assert.ok(framework.framework.some((step) => step.key === "STAR_RATING"), "Star rating signal must exist");
assert.ok(framework.framework.some((step) => step.key === "LIKED"), "What was good signal must exist");
assert.ok(framework.framework.some((step) => step.key === "UNCLEAR"), "What was unclear signal must exist");
assert.ok(framework.framework.some((step) => step.key === "TEACHER_EXPLANATION"), "Teacher explanation score must exist");
assert.ok(framework.framework.some((step) => step.key === "DOUBT_CLEARING"), "Doubt clearing score must exist");
assert.ok(framework.framework.some((step) => step.key === "PACE"), "Pace score must exist");
assert.ok(framework.framework.some((step) => step.key === "MATERIAL_QUALITY"), "Material quality score must exist");
assert.ok(framework.framework.some((step) => step.key === "OPTIONAL_COMMENT"), "Optional comment must exist");

assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/pending/, "Pending route must exist");
assert.match(routesSource, /\/summary/, "Summary route must exist");
assert.match(routesSource, /\/feedback/, "Feedback submission route must exist");
assert.match(indexSource, /class-rating-os/, "Class Rating OS must be mounted in the API router");

assert.match(serviceSource, /prisma\.auditLog/, "Existing AuditLog persistence must be reused");
assert.match(serviceSource, /AcademicCalendarItem/, "Existing AcademicCalendarItem table must be reused");
assert.match(serviceSource, /prisma\.batchStudent/, "Existing BatchStudent records must validate enrollment");
assert.match(serviceSource, /CLASS_FEEDBACK_SUBMITTED/, "Feedback submission event must be emitted");
assert.match(serviceSource, /CLASS_RATING_SUMMARY_VIEWED/, "Summary viewed event must be emitted");
assert.match(performanceSource, /CLASS_RATING_OS_READY/, "Performance OS must recognize live class rating readiness");

assert.ok(eventCategories.includes("STUDENT_FEEDBACK"), "Student feedback event category must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "CLASS_FEEDBACK_SUBMITTED"), "Feedback submitted event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "CLASS_RATING_PENDING_VIEWED"), "Pending viewed event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "CLASS_RATING_SUMMARY_VIEWED"), "Summary viewed event must exist");

console.log("Class Rating OS verification passed");
