import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function assertContains(file: string, needle: string, label: string) {
  const source = read(file);
  if (!source.includes(needle)) {
    throw new Error(`${label} missing in ${file}`);
  }
  console.log(`OK ${label}`);
}

assertContains("prisma/schema.prisma", "model CBTAnswerState", "CBT answer persistence model");
assertContains("prisma/schema.prisma", "model CBTIntegrityEvent", "CBT integrity event model");
assertContains("prisma/schema.prisma", "model LecturePlaybackEvent", "lecture playback analytics model");
assertContains("prisma/schema.prisma", "model AITutorSession", "AI tutor session model");
assertContains("prisma/schema.prisma", "model OfflineSyncEvent", "offline sync event model");
assertContains("prisma/schema.prisma", "model DailyIntelligenceIssue", "Daily Intelligence issue model");
assertContains("src/modules/tests/tests.routes.ts", "/autosave", "CBT autosave endpoint");
assertContains("src/modules/tests/tests.routes.ts", "/integrity-event", "CBT integrity endpoint");
assertContains("src/modules/tests/tests.routes.ts", "/review-plan", "CBT skipped review endpoint");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/offline/sync", "offline sync endpoint");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/tutor/sessions", "AI tutor persistence endpoint");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/daily-intelligence", "Daily Intelligence admin endpoint");
assertContains("../frontend/public/sw.js", "nidus-offline-mutations", "PWA offline mutation replay");

console.log("Phase 4 CBT/learning stability verification passed");
