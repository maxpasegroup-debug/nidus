import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { academicOsService } from "../modules/academic-os/academic-os.service.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const flow = academicOsService.flow();

assert.equal(flow.name, "NIDUS Academic Operating System", "Academic OS name must be fixed");
assert.equal(flow.flow[0].key, "PROGRAM", "Academic OS must start from Program");
assert.equal(flow.flow.at(-1)?.key, "PROGRESS", "Academic OS must end at Progress");
assert.ok(flow.flow.some((step) => step.key === "TIMETABLE"), "Timetable step must exist");
assert.ok(flow.flow.some((step) => step.key === "ATTENDANCE"), "Attendance step must exist");
assert.ok(flow.flow.some((step) => step.key === "DAILY_EXAM"), "Daily exam step must exist");

assert.equal(typeof academicOsService.dashboard, "function", "Academic OS dashboard must exist");
assert.equal(typeof academicOsService.batch, "function", "Academic OS batch drill-down must exist");
assert.equal(typeof academicOsService.roleWorkflow, "function", "Academic OS role workflow must exist");

assert.match(source("src/modules/academic-os/academic-os.routes.ts"), /academicOsRouter\.get\("\/flow"/, "Academic OS flow route must exist");
assert.match(source("src/modules/academic-os/academic-os.routes.ts"), /academicOsRouter\.get\("\/dashboard"/, "Academic OS dashboard route must exist");
assert.match(source("src/modules/academic-os/academic-os.routes.ts"), /academicOsRouter\.get\("\/batches\/:batchId"/, "Academic OS batch route must exist");
assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/academic-os", academicOsRouter\)/, "Academic OS router must be mounted");
assert.match(source("src/modules/academic-os/academic-os.service.ts"), /TeacherAttendanceRecord/, "Academic OS must reuse attendance records");
assert.match(source("src/modules/academic-os/academic-os.service.ts"), /teacherAssignmentRecord/, "Academic OS must reuse assignment records");
assert.match(source("src/modules/academic-os/academic-os.service.ts"), /teacherExamRecord/, "Academic OS must reuse exam records");
assert.match(source("src/modules/academic-os/academic-os.service.ts"), /teacherStudyMaterialRecord/, "Academic OS must reuse material records");
assert.match(source("src/modules/academic-os/academic-os.service.ts"), /teacherSyllabusProgressRecord/, "Academic OS must reuse syllabus progress records");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /ACADEMIC_OS_VIEWED/, "Academic OS viewed event must be registered");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /ACADEMIC_OS_BATCH_VIEWED/, "Academic OS batch viewed event must be registered");

console.log("Academic OS verification passed");
