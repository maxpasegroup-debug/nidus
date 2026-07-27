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
assertContains("prisma/schema.prisma", "model ExamUpload", "exam source preservation model");
assertContains("prisma/schema.prisma", "visualReviewRequired", "question visual review required field");
assertContains("prisma/schema.prisma", "visualReviewNotes", "question visual review notes field");
assertContains("prisma/schema.prisma", "model LecturePlaybackEvent", "lecture playback analytics model");
assertContains("prisma/schema.prisma", "model AITutorSession", "AI tutor session model");
assertContains("prisma/schema.prisma", "model OfflineSyncEvent", "offline sync event model");
assertContains("prisma/schema.prisma", "model DailyIntelligenceIssue", "Daily Intelligence issue model");
assertContains("src/modules/tests/tests.routes.ts", "/autosave", "CBT autosave endpoint");
assertContains("src/modules/tests/tests.routes.ts", "/integrity-event", "CBT integrity endpoint");
assertContains("src/modules/tests/tests.routes.ts", "/review-plan", "CBT skipped review endpoint");
assertContains("src/modules/tests/tests.service.ts", "sanitizeActiveAttempt", "active attempt answer-key sanitizer");
assertContains("src/modules/tests/tests.service.ts", "resultReleaseState", "student result release gate");
assertContains("src/modules/tests/tests.service.ts", "sanitizePendingResultAttempt", "pending result sanitizer");
assertContains("src/modules/academy/academy.routes.ts", "/exams/uploads", "teacher exam source upload route");
assertContains("src/modules/academy/academy.routes.ts", "/release-results", "teacher result release route");
assertContains("src/modules/academy/academy.service.ts", "EXAM_SOURCE_UPLOADED", "exam source upload audit event");
assertContains("src/modules/academy/academy.service.ts", "EXAM_RESULTS_RELEASED", "exam result release audit event");
assertContains("src/modules/academy/academy.service.ts", "At least one submitted attempt is required before releasing results.", "empty release protection");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "PaperUnderstandingPanel", "teacher paper understanding preview");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "VisualFidelityPanel", "teacher visual fidelity preview");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "renderPdfPageAssets", "PDF page visual asset renderer");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "renderImageAsset", "image paper visual asset renderer");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "cropVisualAsset", "teacher visual asset crop helper");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "VisualCropRegion", "teacher visual crop region controls");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "questionImageAssignments", "question image assignment audit");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "Question visual assets", "teacher question visual attachment UI");
assertContains("../frontend/src/components/teacher/teacher-exam-workspace.tsx", "ResultReleasePanel", "teacher result release audit panel");
assertContains("../frontend/src/app/test-attempt/[id]/page.tsx", "Secure CBT Exam Mode", "student secure CBT console");
assertContains("../frontend/src/app/test-attempt/[id]/page.tsx", "autosaveState", "student autosave status");
assertContains("../frontend/src/app/results/[attemptId]/page.tsx", "Result under review", "student pending result lock");
assertContains("../frontend/src/app/results/[attemptId]/page.tsx", "visualReviewNotes", "released solved paper visual review notes");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/offline/sync", "offline sync endpoint");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/tutor/sessions", "AI tutor persistence endpoint");
assertContains("src/modules/learning-stability/learning-stability.routes.ts", "/daily-intelligence", "Daily Intelligence admin endpoint");
assertContains("../frontend/public/sw.js", "nidus-offline-mutations", "PWA offline mutation replay");

console.log("CBT and examination engine verification passed");
