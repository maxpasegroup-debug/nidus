import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

export type RealFileBaselineSubject = "Mathematics" | "Physics" | "Chemistry";
export type RealFileBaselineExam = "NDA" | "JEE" | "NEET" | "University" | "School" | "Mixed";
export type RealFileBaselineFormat = "PDF" | "DOCX" | "JPG" | "PNG" | "WEBP" | "TXT";

export type RealFileBaselineStage =
  | "UPLOAD"
  | "RENDER"
  | "OCR"
  | "LAYOUT"
  | "FORMULA"
  | "VISUAL"
  | "AI_RECONSTRUCTION"
  | "TEACHER_REVIEW"
  | "PUBLISH"
  | "CBT_RENDER";

export type RealFileStageStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN";

export type RealFileEvidenceArtifact = {
  kind: string;
  path: string;
  sha256?: string;
  bytes?: number;
};

export type RealFilePipelineStageEvidence = {
  stage: RealFileBaselineStage;
  status: RealFileStageStatus;
  startedAt?: string;
  completedAt?: string;
  provider?: string;
  workerId?: string;
  score?: number;
  metrics?: Record<string, number | string | boolean | null>;
  artifacts?: RealFileEvidenceArtifact[];
  failures?: string[];
  notes?: string;
};

export type RealFilePipelineEvidenceManifest = {
  manifestVersion: "real-file-pipeline-evidence-v1";
  slotId: string;
  pipelineRunId: string;
  sourceSha256: string;
  executedAt: string;
  executedBy?: string;
  stages: RealFilePipelineStageEvidence[];
};

export type RealFileBaselineSlot = {
  id: string;
  title: string;
  subject: RealFileBaselineSubject;
  exam: RealFileBaselineExam;
  requiredInput: string;
  acceptedExtensions: RealFileBaselineFormat[];
  mustProve: {
    formulas: boolean;
    chemistryStructures: boolean;
    diagrams: boolean;
    graphs: boolean;
    tables: boolean;
    scanned: boolean;
    mobilePhoto: boolean;
    docxOfficeMath: boolean;
    answerKey: boolean;
    solutions: boolean;
  };
};

export type RealFileEvidence = {
  exists: boolean;
  directory: string;
  expectedFiles: string[];
  expectedEvidenceFile: string;
  selectedFile: string | null;
  extension: string | null;
  sizeBytes: number;
  sha256: string | null;
  problem: string | null;
  pipelineEvidence: {
    exists: boolean;
    valid: boolean;
    path: string;
    manifest: RealFilePipelineEvidenceManifest | null;
    problems: string[];
  };
};

export type RealFileStageResult = {
  stage: RealFileBaselineStage;
  status: RealFileStageStatus;
  score: number;
  reason: string;
};

export type RealFileDocumentBaselineReport = {
  slotId: string;
  title: string;
  subject: RealFileBaselineSubject;
  exam: RealFileBaselineExam;
  requiredInput: string;
  evidence: RealFileEvidence;
  stageResults: RealFileStageResult[];
  overallScore: number;
  fullPipelineExecuted: boolean;
  productionCertified: boolean;
  failedQuestions: string[];
  brokenFormulas: string[];
  missingDiagrams: string[];
  answerMappingFailures: string[];
};

export type RealFileBaselineRun = {
  certificationVersion: string;
  generatedAt: string;
  executionMode: "REAL_FILE_EVIDENCE_BASELINE";
  requiredDocuments: number;
  filesPresent: number;
  fullPipelinesExecuted: number;
  overallScore: number;
  productionCertificationStatus: "PRODUCTION_CERTIFIED" | "NOT_CERTIFIED";
  stopRule: string;
  missingFixturePaths: string[];
  missingEvidencePaths: string[];
  documentReports: RealFileDocumentBaselineReport[];
  nextAction: string;
};

export const REAL_FILE_BASELINE_VERSION = "real-file-certification-baseline-v2";

export const REAL_FILE_BASELINE_STAGES: RealFileBaselineStage[] = [
  "UPLOAD",
  "RENDER",
  "OCR",
  "LAYOUT",
  "FORMULA",
  "VISUAL",
  "AI_RECONSTRUCTION",
  "TEACHER_REVIEW",
  "PUBLISH",
  "CBT_RENDER"
];

export const REAL_FILE_BASELINE_SLOTS: RealFileBaselineSlot[] = [
  {
    id: "nda-maths-pdf",
    title: "NDA Mathematics PDF",
    subject: "Mathematics",
    exam: "NDA",
    requiredInput: "real NDA mathematics question paper PDF",
    acceptedExtensions: ["PDF"],
    mustProve: { formulas: true, chemistryStructures: false, diagrams: true, graphs: true, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "jee-maths-pdf",
    title: "JEE Mathematics PDF",
    subject: "Mathematics",
    exam: "JEE",
    requiredInput: "real JEE mathematics question paper PDF",
    acceptedExtensions: ["PDF"],
    mustProve: { formulas: true, chemistryStructures: false, diagrams: true, graphs: true, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "neet-chemistry-pdf",
    title: "NEET Chemistry PDF",
    subject: "Chemistry",
    exam: "NEET",
    requiredInput: "real NEET chemistry question paper PDF",
    acceptedExtensions: ["PDF"],
    mustProve: { formulas: true, chemistryStructures: true, diagrams: true, graphs: false, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "scanned-chemistry-paper",
    title: "Scanned Chemistry Paper",
    subject: "Chemistry",
    exam: "Mixed",
    requiredInput: "real scanned chemistry paper",
    acceptedExtensions: ["PDF", "JPG", "PNG", "WEBP"],
    mustProve: { formulas: true, chemistryStructures: true, diagrams: true, graphs: false, tables: true, scanned: true, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "mobile-camera-maths-paper",
    title: "Mobile Camera Mathematics Paper",
    subject: "Mathematics",
    exam: "Mixed",
    requiredInput: "real mobile camera mathematics paper",
    acceptedExtensions: ["JPG", "PNG", "WEBP"],
    mustProve: { formulas: true, chemistryStructures: false, diagrams: true, graphs: true, tables: false, scanned: true, mobilePhoto: true, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "docx-office-math",
    title: "DOCX With Office Math",
    subject: "Mathematics",
    exam: "University",
    requiredInput: "real DOCX containing Office Math equations",
    acceptedExtensions: ["DOCX"],
    mustProve: { formulas: true, chemistryStructures: false, diagrams: false, graphs: true, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: true, answerKey: false, solutions: false }
  },
  {
    id: "answer-key-pdf",
    title: "Answer Key PDF",
    subject: "Mathematics",
    exam: "Mixed",
    requiredInput: "real answer key PDF",
    acceptedExtensions: ["PDF"],
    mustProve: { formulas: false, chemistryStructures: false, diagrams: false, graphs: false, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: true, solutions: false }
  },
  {
    id: "solution-book-pdf",
    title: "Solution Book PDF",
    subject: "Chemistry",
    exam: "NEET",
    requiredInput: "real solution book PDF",
    acceptedExtensions: ["PDF"],
    mustProve: { formulas: true, chemistryStructures: true, diagrams: true, graphs: false, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: true, solutions: true }
  },
  {
    id: "organic-chemistry-structure-paper",
    title: "Organic Chemistry Structure Paper",
    subject: "Chemistry",
    exam: "NEET",
    requiredInput: "real organic chemistry structure paper",
    acceptedExtensions: ["PDF", "JPG", "PNG", "WEBP"],
    mustProve: { formulas: true, chemistryStructures: true, diagrams: true, graphs: false, tables: false, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  },
  {
    id: "graph-heavy-physics-math-paper",
    title: "Graph-Heavy Physics or Mathematics Paper",
    subject: "Physics",
    exam: "JEE",
    requiredInput: "real graph-heavy physics or mathematics paper",
    acceptedExtensions: ["PDF", "JPG", "PNG", "WEBP"],
    mustProve: { formulas: true, chemistryStructures: false, diagrams: true, graphs: true, tables: true, scanned: false, mobilePhoto: false, docxOfficeMath: false, answerKey: false, solutions: false }
  }
];

const backendRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
const realFileRoot = path.join(backendRoot, "src", "modules", "ndie", "certification", "real-exam-files");

function roundPercent(value: number) {
  return Math.round(value * 10000) / 100;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function expectedFiles(slot: RealFileBaselineSlot) {
  return slot.acceptedExtensions.map((extension) => path.join(realFileRoot, slot.id, `source.${extension.toLowerCase()}`));
}

function expectedEvidenceFile(slot: RealFileBaselineSlot) {
  return path.join(realFileRoot, slot.id, "evidence.json");
}

function sha256(filePath: string) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function safeReadJson(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function isInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isStage(value: unknown): value is RealFileBaselineStage {
  return typeof value === "string" && REAL_FILE_BASELINE_STAGES.includes(value as RealFileBaselineStage);
}

function isStageStatus(value: unknown): value is RealFileStageStatus {
  return typeof value === "string" && ["PASS", "FAIL", "BLOCKED", "NOT_RUN"].includes(value);
}

export function validateRealFilePipelineEvidenceManifest(input: {
  slot: RealFileBaselineSlot;
  sourceSha256: string | null;
  fixtureDirectory: string;
  manifest: unknown;
}) {
  const problems: string[] = [];
  if (!input.manifest || typeof input.manifest !== "object") {
    return { valid: false, manifest: null as RealFilePipelineEvidenceManifest | null, problems: ["Evidence manifest is missing or invalid JSON."] };
  }

  const manifest = input.manifest as Partial<RealFilePipelineEvidenceManifest>;
  if (manifest.manifestVersion !== "real-file-pipeline-evidence-v1") problems.push("manifestVersion must be real-file-pipeline-evidence-v1.");
  if (manifest.slotId !== input.slot.id) problems.push(`slotId must match ${input.slot.id}.`);
  if (!manifest.pipelineRunId) problems.push("pipelineRunId is required.");
  if (!manifest.executedAt) problems.push("executedAt is required.");
  if (!manifest.sourceSha256 || manifest.sourceSha256 !== input.sourceSha256) problems.push("sourceSha256 must match the current source file.");
  if (!Array.isArray(manifest.stages)) problems.push("stages must be an array.");

  const stages = Array.isArray(manifest.stages) ? manifest.stages : [];
  for (const stageEvidence of stages) {
    if (!isStage(stageEvidence?.stage)) problems.push(`Unknown evidence stage ${String(stageEvidence?.stage)}.`);
    if (!isStageStatus(stageEvidence?.status)) problems.push(`Invalid evidence status for ${String(stageEvidence?.stage)}.`);
    if (stageEvidence?.score !== undefined && (typeof stageEvidence.score !== "number" || stageEvidence.score < 0 || stageEvidence.score > 1)) {
      problems.push(`Score for ${String(stageEvidence.stage)} must be between 0 and 1.`);
    }

    for (const artifact of stageEvidence?.artifacts ?? []) {
      if (!artifact.path || path.isAbsolute(artifact.path)) {
        problems.push(`Artifact path for ${String(stageEvidence.stage)} must be relative to the fixture directory.`);
        continue;
      }
      const resolvedArtifact = path.resolve(input.fixtureDirectory, artifact.path);
      if (!isInside(input.fixtureDirectory, resolvedArtifact)) {
        problems.push(`Artifact path for ${String(stageEvidence.stage)} escapes the fixture directory.`);
        continue;
      }
      if (!fs.existsSync(resolvedArtifact)) {
        problems.push(`Artifact for ${String(stageEvidence.stage)} is missing: ${artifact.path}`);
        continue;
      }
      if (artifact.sha256 && artifact.sha256 !== sha256(resolvedArtifact)) {
        problems.push(`Artifact checksum mismatch for ${String(stageEvidence.stage)}: ${artifact.path}`);
      }
    }
  }

  return {
    valid: problems.length === 0,
    manifest: problems.length === 0 ? manifest as RealFilePipelineEvidenceManifest : null,
    problems
  };
}

function findPipelineEvidence(slot: RealFileBaselineSlot, sourceSha256: string | null) {
  const evidenceFile = expectedEvidenceFile(slot);
  if (!fs.existsSync(evidenceFile)) {
    return {
      exists: false,
      valid: false,
      path: evidenceFile,
      manifest: null,
      problems: [`Missing pipeline evidence manifest: ${evidenceFile}`]
    };
  }

  const parsed = safeReadJson(evidenceFile);
  const validation = validateRealFilePipelineEvidenceManifest({
    slot,
    sourceSha256,
    fixtureDirectory: path.dirname(evidenceFile),
    manifest: parsed
  });
  return {
    exists: true,
    valid: validation.valid,
    path: evidenceFile,
    manifest: validation.manifest,
    problems: validation.problems
  };
}

function findEvidence(slot: RealFileBaselineSlot): RealFileEvidence {
  const files = expectedFiles(slot);
  const evidenceFile = expectedEvidenceFile(slot);
  const selectedFile = files.find((file) => fs.existsSync(file)) ?? null;
  if (!selectedFile) {
    return {
      exists: false,
      directory: path.join(realFileRoot, slot.id),
      expectedFiles: files,
      expectedEvidenceFile: evidenceFile,
      selectedFile: null,
      extension: null,
      sizeBytes: 0,
      sha256: null,
      problem: `Missing real file for ${slot.title}. Add one of: ${files.join(", ")}`,
      pipelineEvidence: {
        exists: false,
        valid: false,
        path: evidenceFile,
        manifest: null,
        problems: ["Pipeline evidence cannot be evaluated until the real source file exists."]
      }
    };
  }

  const stat = fs.statSync(selectedFile);
  const extension = path.extname(selectedFile).replace(".", "").toUpperCase();
  const extensionSupported = slot.acceptedExtensions.includes(extension as RealFileBaselineFormat);
  const hasContent = stat.size > 0;
  const sourceSha256 = hasContent ? sha256(selectedFile) : null;
  return {
    exists: extensionSupported && hasContent,
    directory: path.dirname(selectedFile),
    expectedFiles: files,
    expectedEvidenceFile: evidenceFile,
    selectedFile,
    extension,
    sizeBytes: stat.size,
    sha256: sourceSha256,
    problem: !extensionSupported
      ? `Unsupported extension ${extension} for ${slot.title}`
      : !hasContent
        ? `Empty file cannot certify ${slot.title}`
        : null,
    pipelineEvidence: extensionSupported && hasContent
      ? findPipelineEvidence(slot, sourceSha256)
      : {
          exists: false,
          valid: false,
          path: evidenceFile,
          manifest: null,
          problems: ["Pipeline evidence cannot be evaluated until the source file is valid."]
        }
  };
}

function stageResults(evidence: RealFileEvidence): RealFileStageResult[] {
  if (!evidence.exists) {
    return REAL_FILE_BASELINE_STAGES.map((stage) => ({
      stage,
      status: "BLOCKED",
      score: 0,
      reason: evidence.problem ?? "Real source document is missing."
    }));
  }

  return REAL_FILE_BASELINE_STAGES.map((stage) => {
    if (stage === "UPLOAD") {
      return {
        stage,
        status: "PASS",
        score: 1,
        reason: "Real source file exists, has content, has an accepted extension, and has a SHA-256 integrity hash."
      };
    }

    if (!evidence.pipelineEvidence.exists) {
      return {
        stage,
        status: "NOT_RUN",
        score: 0,
        reason: `Waiting for executable stage evidence in ${evidence.pipelineEvidence.path}.`
      };
    }

    if (!evidence.pipelineEvidence.valid || !evidence.pipelineEvidence.manifest) {
      return {
        stage,
        status: "FAIL",
        score: 0,
        reason: `Pipeline evidence is invalid: ${evidence.pipelineEvidence.problems.join(" ")}`
      };
    }

    const stageEvidence = evidence.pipelineEvidence.manifest.stages.find((candidate) => candidate.stage === stage);
    if (!stageEvidence) {
      return {
        stage,
        status: "NOT_RUN",
        score: 0,
        reason: `No executable evidence recorded for ${stage}.`
      };
    }

    if (stageEvidence.status !== "PASS") {
      return {
        stage,
        status: stageEvidence.status,
        score: stageEvidence.score ?? 0,
        reason: stageEvidence.failures?.join(" ") || stageEvidence.notes || `${stage} did not pass in the evidence manifest.`
      };
    }

    return {
      stage,
      status: "PASS",
      score: stageEvidence.score ?? 1,
      reason: stageEvidence.notes || `${stage} passed with executable evidence from pipeline run ${evidence.pipelineEvidence.manifest.pipelineRunId}.`
    };
  });
}

export const realFileBaselineService = {
  version: REAL_FILE_BASELINE_VERSION,
  slots: REAL_FILE_BASELINE_SLOTS,
  stages: REAL_FILE_BASELINE_STAGES,
  fixtureRoot: realFileRoot,

  expectedFiles(slotId: string) {
    const slot = REAL_FILE_BASELINE_SLOTS.find((candidate) => candidate.id === slotId);
    return slot ? expectedFiles(slot) : [];
  },

  expectedEvidenceFile(slotId: string) {
    const slot = REAL_FILE_BASELINE_SLOTS.find((candidate) => candidate.id === slotId);
    return slot ? expectedEvidenceFile(slot) : null;
  },

  certifySlot(slot: RealFileBaselineSlot): RealFileDocumentBaselineReport {
    const evidence = findEvidence(slot);
    const results = stageResults(evidence);
    const fullPipelineExecuted = results.every((result) => result.status === "PASS");
    const overallScore = roundPercent(average(results.map((result) => result.score)));
    return {
      slotId: slot.id,
      title: slot.title,
      subject: slot.subject,
      exam: slot.exam,
      requiredInput: slot.requiredInput,
      evidence,
      stageResults: results,
      overallScore,
      fullPipelineExecuted,
      productionCertified: fullPipelineExecuted && overallScore >= 95,
      failedQuestions: fullPipelineExecuted ? [] : ["Full upload-to-CBT real-file execution has not been recorded for this document."],
      brokenFormulas: slot.mustProve.formulas && !fullPipelineExecuted ? ["Formula preservation is unproven until a real pipeline run is attached."] : [],
      missingDiagrams: slot.mustProve.diagrams && !fullPipelineExecuted ? ["Diagram preservation is unproven until a real pipeline run is attached."] : [],
      answerMappingFailures: slot.mustProve.answerKey && !fullPipelineExecuted ? ["Answer mapping is unproven until a real answer-key run is attached."] : []
    };
  },

  run(): RealFileBaselineRun {
    const documentReports = REAL_FILE_BASELINE_SLOTS.map((slot) => this.certifySlot(slot));
    const filesPresent = documentReports.filter((report) => report.evidence.exists).length;
    const fullPipelinesExecuted = documentReports.filter((report) => report.fullPipelineExecuted).length;
    const overallScore = roundPercent(average(documentReports.map((report) => report.overallScore / 100)));
    const productionCertified = documentReports.every((report) => report.productionCertified);
    return {
      certificationVersion: REAL_FILE_BASELINE_VERSION,
      generatedAt: new Date().toISOString(),
      executionMode: "REAL_FILE_EVIDENCE_BASELINE",
      requiredDocuments: REAL_FILE_BASELINE_SLOTS.length,
      filesPresent,
      fullPipelinesExecuted,
      overallScore,
      productionCertificationStatus: productionCertified ? "PRODUCTION_CERTIFIED" : "NOT_CERTIFIED",
      stopRule: "No paper can be production certified unless the real source file exists and every upload-to-CBT pipeline stage has recorded executable evidence.",
      missingFixturePaths: documentReports
        .filter((report) => !report.evidence.exists)
        .map((report) => report.evidence.expectedFiles.join(" OR ")),
      missingEvidencePaths: documentReports
        .filter((report) => report.evidence.exists && !report.fullPipelineExecuted)
        .map((report) => report.evidence.expectedEvidenceFile),
      documentReports,
      nextAction: productionCertified
        ? "Proceed to Phase 3 with real certification evidence preserved."
        : "Add the required real examination files and attach full-pipeline execution evidence before increasing readiness scores."
    };
  }
};
