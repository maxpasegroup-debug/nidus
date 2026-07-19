import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reportsOsService } from "../modules/reports-os/reports-os.service.js";
import { eventCategories, eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

const root = process.cwd();
const framework = reportsOsService.framework();
const serviceSource = readFileSync(join(root, "src/modules/reports-os/reports-os.service.ts"), "utf8");
const routesSource = readFileSync(join(root, "src/modules/reports-os/reports-os.routes.ts"), "utf8");
const indexSource = readFileSync(join(root, "src/modules/index.ts"), "utf8");

assert.equal(framework.name, "NIDUS Reports Operating System", "Reports OS name must be fixed");
assert.ok(framework.framework.some((step) => step.key === "DAILY_REPORT"), "Daily report signal must exist");
assert.ok(framework.framework.some((step) => step.key === "WEEKLY_REPORT"), "Weekly report signal must exist");
assert.ok(framework.framework.some((step) => step.key === "MONTHLY_REPORT"), "Monthly report signal must exist");
assert.ok(framework.framework.some((step) => step.key === "WHATSAPP_SUMMARY"), "WhatsApp summary must exist");
assert.ok(framework.framework.some((step) => step.key === "DASHBOARD_LINK"), "Dashboard link must exist");
assert.ok(framework.framework.some((step) => step.key === "PDF_QUEUE"), "PDF queue readiness must exist");
assert.ok(framework.framework.some((step) => step.key === "DRILL_DOWN_COMMANDS"), "Drill-down commands must exist");
assert.ok(framework.framework.some((step) => step.key === "AI_RECOMMENDATIONS"), "AI recommendations must exist");
assert.ok(framework.framework.some((step) => step.key === "APPROVAL_BUTTONS"), "Approval buttons must exist");

assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/current/, "Current report route must exist");
assert.match(routesSource, /\/pdf/, "PDF route must exist");
assert.match(indexSource, /reports-os/, "Reports OS must be mounted in the API router");

assert.match(serviceSource, /whatsappSummary/, "Report contract must include WhatsApp summary");
assert.match(serviceSource, /dashboardLink/, "Report contract must include dashboard link");
assert.match(serviceSource, /queueRoute/, "Report contract must include PDF queue route");
assert.match(serviceSource, /drillDownCommands/, "Report contract must include drill-down commands");
assert.match(serviceSource, /aiRecommendations/, "Report contract must include AI recommendations");
assert.match(serviceSource, /approvalButtons/, "Report contract must include approval buttons");
assert.match(serviceSource, /enqueuePDF/, "Existing PDF queue must be reused");
assert.match(serviceSource, /prisma\.payment/, "Existing payment records must be reused");
assert.match(serviceSource, /AcademicCalendarItem/, "Existing academic calendar records must be reused");
assert.match(serviceSource, /class-rating-os/, "Existing class rating feedback must be reused");

assert.ok(eventCategories.includes("REPORT"), "Report event category must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "REPORT_GENERATED"), "Report generated event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "REPORT_PDF_QUEUED"), "Report PDF queued event must exist");

console.log("Reports OS verification passed");
