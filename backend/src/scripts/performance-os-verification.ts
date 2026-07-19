import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { performanceOsService } from "../modules/performance-os/performance-os.service.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const framework = performanceOsService.framework();

assert.equal(framework.name, "NIDUS Teacher and HR Performance Operating System", "Performance OS name must be fixed");
assert.ok(framework.framework.some((step) => step.key === "ATTENDANCE"), "Attendance signal must exist");
assert.ok(framework.framework.some((step) => step.key === "CLASS_PUNCTUALITY"), "Class punctuality signal must exist");
assert.ok(framework.framework.some((step) => step.key === "SYLLABUS_COMPLETION"), "Syllabus signal must exist");
assert.ok(framework.framework.some((step) => step.key === "STUDENT_FEEDBACK"), "Student feedback readiness signal must exist");
assert.ok(framework.framework.some((step) => step.key === "AWARDS"), "Awards signal must exist");

assert.equal(typeof performanceOsService.dashboard, "function", "Performance OS dashboard must exist");
assert.equal(typeof performanceOsService.staffMember, "function", "Performance OS staff drill-down must exist");
assert.equal(typeof performanceOsService.roleWorkflow, "function", "Performance OS role workflow must exist");

assert.match(source("src/modules/performance-os/performance-os.routes.ts"), /performanceOsRouter\.get\("\/framework"/, "Performance OS framework route must exist");
assert.match(source("src/modules/performance-os/performance-os.routes.ts"), /performanceOsRouter\.get\("\/dashboard"/, "Performance OS dashboard route must exist");
assert.match(source("src/modules/performance-os/performance-os.routes.ts"), /performanceOsRouter\.get\("\/staff\/:userId"/, "Performance OS staff route must exist");
assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/performance-os", performanceOsRouter\)/, "Performance OS router must be mounted");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherCalendarLogRecord/, "Performance OS must reuse class log records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherAttendanceRecord/, "Performance OS must reuse attendance records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherSyllabusProgressRecord/, "Performance OS must reuse syllabus records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherAssignmentRecord/, "Performance OS must reuse assignment records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherExamRecord/, "Performance OS must reuse exam records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /teacherStudyMaterialRecord/, "Performance OS must reuse material records");
assert.match(source("src/modules/performance-os/performance-os.service.ts"), /payroll/, "Performance OS must reuse payroll records");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /PERFORMANCE_OS_VIEWED/, "Performance OS viewed event must be registered");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /PERFORMANCE_OS_STAFF_VIEWED/, "Performance OS staff viewed event must be registered");

console.log("Performance OS verification passed");
