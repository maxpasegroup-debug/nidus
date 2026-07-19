import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { communicationOsService } from "../modules/communication-os/communication-os.service.js";
import { eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

const root = process.cwd();
const framework = communicationOsService.framework();
const serviceSource = readFileSync(join(root, "src/modules/communication-os/communication-os.service.ts"), "utf8");
const routesSource = readFileSync(join(root, "src/modules/communication-os/communication-os.routes.ts"), "utf8");
const indexSource = readFileSync(join(root, "src/modules/index.ts"), "utf8");

assert.equal(framework.name, "NIDUS Communication Operating System", "Communication OS name must be fixed");
assert.ok(framework.framework.some((step) => step.key === "MESSAGE_PRIORITY"), "Message priority signal must exist");
assert.ok(framework.framework.some((step) => step.key === "FREQUENCY_CONTROL"), "Frequency control signal must exist");
assert.ok(framework.framework.some((step) => step.key === "OPT_IN_OUT"), "Opt-in/out signal must exist");
assert.ok(framework.framework.some((step) => step.key === "SUMMARY_BUNDLING"), "Summary bundling signal must exist");
assert.ok(framework.framework.some((step) => step.key === "TEMPLATE_TRACKING"), "Template tracking signal must exist");
assert.ok(framework.framework.some((step) => step.key === "AUDIT_TRAIL"), "Audit trail signal must exist");
assert.ok(framework.framework.some((step) => step.key === "WHATSAPP"), "WhatsApp signal must exist");
assert.ok(framework.framework.some((step) => step.key === "EMAIL"), "Email signal must exist");
assert.ok(framework.framework.some((step) => step.key === "IN_APP"), "In-app signal must exist");
assert.ok(framework.framework.some((step) => step.key === "PUSH"), "Push signal must exist");

assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/dispatch/, "Dispatch route must exist");
assert.match(routesSource, /\/bundle/, "Bundle route must exist");
assert.match(routesSource, /\/health/, "Health route must exist");
assert.match(indexSource, /communication-os/, "Communication OS must be mounted in the API router");

assert.match(serviceSource, /enqueueWhatsApp/, "Existing WhatsApp queue must be reused");
assert.match(serviceSource, /resendService/, "Existing email service must be reused");
assert.match(serviceSource, /enqueueNotification/, "Existing push notification queue must be reused");
assert.match(serviceSource, /prisma\.notification/, "Existing Notification model must be reused");
assert.match(serviceSource, /prisma\.emailLog/, "Existing EmailLog model must be reused");
assert.match(serviceSource, /prisma\.pushNotification/, "Existing PushNotification model must be reused");
assert.match(serviceSource, /prisma\.auditLog/, "Existing AuditLog model must be reused");
assert.match(serviceSource, /prisma\.queueJobLog/, "Existing QueueJobLog model must be reused");
assert.match(serviceSource, /COMMUNICATION_FREQUENCY_SKIPPED/, "Frequency skip event must be emitted");
assert.match(serviceSource, /COMMUNICATION_SUMMARY_BUNDLED/, "Summary bundled event must be emitted");

assert.ok(eventDefinitions.some((event) => event.eventName === "COMMUNICATION_DISPATCHED"), "Communication dispatched event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "COMMUNICATION_FREQUENCY_SKIPPED"), "Communication frequency event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "COMMUNICATION_SUMMARY_BUNDLED"), "Communication summary event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "COMMUNICATION_HEALTH_VIEWED"), "Communication health event must exist");

console.log("Communication OS verification passed");
