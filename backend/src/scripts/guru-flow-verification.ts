import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const schema = read("prisma/schema.prisma");
const routes = read("src/modules/mobile-guru/mobile-guru.routes.ts");
const index = read("src/modules/index.ts");
const service = read("src/modules/mobile-guru/mobile-guru.service.ts");

for (const model of [
  "GuruQuest",
  "GuruLesson",
  "GuruLessonCompletion",
  "GuruReflectionQuestion",
  "GuruReflectionAnswer",
  "GuruChallenge",
  "GuruChallengeCompletion",
  "GuruProgress",
  "GuruAchievement",
  "GuruCertificate",
  "GuruDailyMission",
  "GuruXpLedger"
]) {
  assert.match(schema, new RegExp(`model ${model}`), `${model} model must exist`);
}

for (const route of [
  /get\("\/quests"/,
  /get\("\/quests\/:questId"/,
  /post\("\/lessons\/:lessonId\/complete"/,
  /post\(\s*"\/quests\/:questId\/reflections"/,
  /post\("\/challenges\/:challengeId\/complete"/,
  /post\("\/evidence"/,
  /get\("\/progress"/,
  /get\("\/certificates"/,
  /get\("\/growth"/,
  /post\("\/daily-missions\/:missionId\/complete"/
]) {
  assert.match(routes, route, `${route} route must exist`);
}

assert.match(index, /apiRouter\.use\("\/mobile\/guru", mobileGuruRouter\)/, "mobile Guru router must be mounted");
assert.match(routes, /protect/, "mobile Guru routes must require auth");
assert.match(routes, /allowRoles\(Role\.ADMIN, Role\.DIRECTOR\)/, "admin Guru routes must be protected");
assert.match(service, /completionPercent/, "quest progress calculation must exist");
assert.match(service, /issueCertificate/, "certificate issuance must exist");
assert.match(service, /awardXp/, "XP ledger award must exist");
assert.match(service, /evidenceRequired/, "evidence-required rule must exist");

console.log(JSON.stringify({ guruFlow: "ok", checkedAt: new Date().toISOString() }, null, 2));
