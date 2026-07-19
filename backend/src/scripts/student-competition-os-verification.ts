import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { studentCompetitionOsService } from "../modules/student-competition-os/student-competition-os.service.js";
import { eventCategories, eventDefinitions } from "../modules/event-engine/event-taxonomy.js";

const root = process.cwd();
const framework = studentCompetitionOsService.framework();
const serviceSource = readFileSync(join(root, "src/modules/student-competition-os/student-competition-os.service.ts"), "utf8");
const routesSource = readFileSync(join(root, "src/modules/student-competition-os/student-competition-os.routes.ts"), "utf8");
const indexSource = readFileSync(join(root, "src/modules/index.ts"), "utf8");

assert.equal(framework.name, "NIDUS Student Competition Operating System", "Competition OS name must be fixed");
assert.ok(framework.framework.some((step) => step.key === "DAILY_RANK"), "Daily rank signal must exist");
assert.ok(framework.framework.some((step) => step.key === "MONTHLY_LEADERBOARD"), "Monthly leaderboard signal must exist");
assert.ok(framework.framework.some((step) => step.key === "FINAL_LEADERBOARD"), "Final leaderboard signal must exist");
assert.ok(framework.framework.some((step) => step.key === "ALL_TIME_RECORDS"), "All-time records signal must exist");
assert.ok(framework.framework.some((step) => step.key === "IMPROVEMENT_AWARDS"), "Improvement awards signal must exist");
assert.ok(framework.framework.some((step) => step.key === "ATTENDANCE_STREAKS"), "Attendance streak signal must exist");
assert.ok(framework.framework.some((step) => step.key === "ASSIGNMENT_STREAKS"), "Assignment streak signal must exist");
assert.ok(framework.framework.some((step) => step.key === "EXAM_STREAKS"), "Exam streak signal must exist");

assert.match(routesSource, /\/framework/, "Framework route must exist");
assert.match(routesSource, /\/leaderboard/, "Leaderboard route must exist");
assert.match(routesSource, /\/students\/:userId/, "Student profile route must exist");
assert.match(indexSource, /student-competition-os/, "Competition OS must be mounted in the API router");

assert.match(serviceSource, /prisma\.leaderboard/, "Existing Leaderboard model must be reused");
assert.match(serviceSource, /prisma\.attendance/, "Existing Attendance model must be reused");
assert.match(serviceSource, /prisma\.assignmentSubmissionRecord/, "Existing assignment submissions must be reused");
assert.match(serviceSource, /prisma\.testAttempt/, "Existing TestAttempt model must be reused");
assert.match(serviceSource, /prisma\.quizBattleParticipant/, "Existing quiz battle participants must be reused");
assert.match(serviceSource, /prisma\.dailyFitnessLog/, "Existing DailyFitnessLog model must be reused");
assert.ok(eventCategories.includes("STUDENT_COMPETITION"), "Student competition event category must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "STUDENT_COMPETITION_VIEWED"), "Competition viewed event must exist");
assert.ok(eventDefinitions.some((event) => event.eventName === "STUDENT_COMPETITION_PROFILE_VIEWED"), "Competition profile event must exist");

console.log("Student Competition OS verification passed");
