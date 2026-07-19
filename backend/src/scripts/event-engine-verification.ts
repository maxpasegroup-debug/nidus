import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { eventCategories, eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

assert.ok(eventCategories.includes("ADMISSION"), "Admission event category must exist");
assert.ok(eventCategories.includes("FEE"), "Fee event category must exist");
assert.ok(eventCategories.includes("ACADEMIC"), "Academic event category must exist");
assert.ok(eventCategories.includes("STUDENT_FEEDBACK"), "Student feedback event category must exist");
assert.ok(eventCategories.includes("TEACHER_PERFORMANCE"), "Teacher performance event category must exist");

const names = new Set(eventDefinitions.map((event) => event.eventName));
for (const eventName of ["LEAD_CREATED", "FOLLOW_UP_CREATED", "ADMISSION_REVIEWED", "PAYMENT_RECEIVED", "PAYMENT_FAILED", "ADMIN_ACTION", "LOGIN_FAILED"]) {
  assert.ok(names.has(eventName), `${eventName} definition must exist`);
}

assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/events", eventEngineRouter\)/, "Event engine router must be mounted");
assert.match(source("src/modules/event-engine/event-engine.service.ts"), /catch \(error\)/, "Event recording must fail safely");
assert.match(source("src/modules/crm/crm.service.ts"), /eventName: "LEAD_CREATED"/, "CRM must emit lead created events");
assert.match(source("src/modules/payments/payments.service.ts"), /eventName: failed \? "PAYMENT_FAILED"/, "Payments must emit payment events");

console.log("Event engine verification passed");
