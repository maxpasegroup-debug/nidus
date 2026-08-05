import { realFileIntakeService } from "../modules/ndie/certification/real-file-intake.service.js";

const report = realFileIntakeService.scan();

const candidatesWellFormed = report.candidates.every((candidate) => (
  candidate.filePath &&
  candidate.fileName &&
  candidate.sha256 &&
  candidate.status &&
  Array.isArray(candidate.suggestedSlots) &&
  Array.isArray(candidate.problems)
));
const emptySlotsReported = report.emptySlots.length <= 10 && report.emptySlots.every((slot) => slot.slotId && slot.expectedFiles.length > 0);
const noUnsupportedReady = report.candidates.every((candidate) => (
  candidate.status !== "READY_FOR_SLOT" || candidate.detectedFormat !== "UNKNOWN"
));
const duplicateAccounting = report.duplicates === report.candidates.filter((candidate) => candidate.status === "DUPLICATE").length;

const checks = [
  ["candidate shape", candidatesWellFormed],
  ["empty slots reported", emptySlotsReported],
  ["unsupported files cannot be ready", noUnsupportedReady],
  ["duplicate accounting", duplicateAccounting]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length) {
  console.error(JSON.stringify({
    status: "FAIL",
    phase: "phase-4-real-file-intake",
    failures,
    summary: {
      intakeRoot: report.intakeRoot,
      filesScanned: report.filesScanned,
      readyForSlot: report.readyForSlot,
      unsupported: report.unsupported,
      duplicates: report.duplicates
    }
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  phase: "phase-4-real-file-intake",
  intakeRoot: report.intakeRoot,
  filesScanned: report.filesScanned,
  readyForSlot: report.readyForSlot,
  unsupported: report.unsupported,
  duplicates: report.duplicates,
  needsManualReview: report.needsManualReview,
  emptySlots: report.emptySlots,
  candidates: report.candidates.map((candidate) => ({
    fileName: candidate.fileName,
    detectedFormat: candidate.detectedFormat,
    status: candidate.status,
    suggestedSlots: candidate.suggestedSlots
  }))
}, null, 2));
