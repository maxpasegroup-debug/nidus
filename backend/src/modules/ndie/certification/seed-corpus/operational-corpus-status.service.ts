import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SEED_CORPUS_TARGET } from "./seed-corpus.js";
import { OPERATIONAL_CORPUS_ROOT, readOperationalManifests } from "./operational-corpus-intake.service.js";
import type { OperationalCorpusManifest } from "./operational-contracts.js";
import { expertAdjudicationSchema, expertAgreementSchema, expertAnnotationPayloadSchema, expertAnnotationSubmissionSchema } from "./operational-contracts.js";

const INITIAL_STEM_TRANCHE_TARGET = { MATHEMATICS: 30, PHYSICS: 30, overall: 60 } as const;

function checksum(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function privacyComplete(manifest: OperationalCorpusManifest) {
  return ["COMPLETE", "NOT_APPLICABLE_CONFIRMED"].includes(manifest.source.anonymizationStatus);
}

function readJson(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function annotationEvidence(documentRoot: string, documentId: string) {
  const annotationRoot = path.join(documentRoot, "annotations");
  const submissionPaths = [path.join(annotationRoot, "expert-a.submission.json"), path.join(annotationRoot, "expert-b.submission.json")];
  const submissions = submissionPaths.flatMap((submissionPath) => {
    if (!fs.existsSync(submissionPath)) return [];
    const parsed = expertAnnotationSubmissionSchema.safeParse(readJson(submissionPath));
    return parsed.success ? [parsed.data] : [];
  });
  const validPayloads = submissions.filter((submission) => {
    if (submission.documentId !== documentId) return false;
    const payloadPath = path.resolve(documentRoot, submission.annotationPath);
    if (!payloadPath.startsWith(`${path.resolve(documentRoot)}${path.sep}`) || !fs.existsSync(payloadPath)) return false;
    const payload = expertAnnotationPayloadSchema.safeParse(readJson(payloadPath));
    return payload.success && payload.data.documentId === documentId && payload.data.annotatorId === submission.annotatorId && checksum(payloadPath) === submission.annotationSha256;
  });
  const distinctExperts = new Set(validPayloads.map((submission) => submission.annotatorId));
  const independent = validPayloads.length === 2 && distinctExperts.size === 2 && new Set(validPayloads.map((submission) => submission.annotationSha256)).size === 2;
  const agreement = expertAgreementSchema.safeParse(readJson(path.join(annotationRoot, "agreement.json")));
  const adjudication = expertAdjudicationSchema.safeParse(readJson(path.join(annotationRoot, "adjudication.json")));
  const submissionIds = new Set(validPayloads.map((submission) => submission.submissionId));
  const agreementValid = independent && agreement.success && agreement.data.documentId === documentId && agreement.data.expertSubmissionIds.every((id) => submissionIds.has(id));
  const adjudicationValid = agreementValid && adjudication.success && adjudication.data.documentId === documentId && adjudication.data.expertSubmissionIds.every((id) => submissionIds.has(id));
  return { expertA: validPayloads.length >= 1, expertB: independent, independent, agreementValid, adjudicationValid };
}

function rightsConfirmed(manifest: OperationalCorpusManifest) {
  return manifest.source.rightsBasis !== "RIGHTS_BASIS_PENDING" && Boolean(manifest.source.rightsVerifiedBy && manifest.source.rightsVerifiedAt);
}

function orphanSourceDirectories(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const found: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".staging-")) continue;
    const current = path.join(root, entry.name);
    const original = path.join(current, "original");
    if (fs.existsSync(original) && fs.readdirSync(original, { withFileTypes: true }).some((item) => item.isFile()) && !fs.existsSync(path.join(current, "manifest.json"))) found.push(current);
    found.push(...orphanSourceDirectories(current));
  }
  return found;
}

export const operationalCorpusStatusService = {
  report(corpusRoot = OPERATIONAL_CORPUS_ROOT) {
    const scanned = readOperationalManifests(corpusRoot);
    const hashCounts = new Map<string, number>();
    const idCounts = new Map<string, number>();
    for (const record of scanned) if (record.manifest) hashCounts.set(record.manifest.source.sha256, (hashCounts.get(record.manifest.source.sha256) ?? 0) + 1);
    for (const record of scanned) if (record.manifest) idCounts.set(record.manifest.documentId, (idCounts.get(record.manifest.documentId) ?? 0) + 1);

    const records = scanned.map((record) => {
      const manifest = record.manifest;
      const problems = [...record.problems];
      if (!manifest) return { manifestPath: record.manifestPath, manifest: null, problems, validReal: false, annotationReady: false, certificationReady: false, annotationEvidence: { expertA: false, expertB: false, independent: false, agreementValid: false, adjudicationValid: false } };
      const documentRoot = path.dirname(record.manifestPath);
      const evidence = annotationEvidence(documentRoot, manifest.documentId);
      const sourcePath = path.resolve(documentRoot, manifest.source.relativePath);
      if (!sourcePath.startsWith(`${path.resolve(documentRoot)}${path.sep}`)) problems.push("Source path escapes the document directory.");
      if (!fs.existsSync(sourcePath)) problems.push("Source file is missing.");
      else if (checksum(sourcePath) !== manifest.source.sha256) problems.push("Source checksum does not match the immutable manifest.");
      if ((hashCounts.get(manifest.source.sha256) ?? 0) > 1) problems.push("Duplicate source checksum exists in another corpus record.");
      if ((idCounts.get(manifest.documentId) ?? 0) > 1) problems.push("Duplicate document ID exists in another corpus record.");
      if (manifest.evidenceClass !== "REAL_SOURCE") problems.push("Evidence class is not REAL_SOURCE.");
      if (!rightsConfirmed(manifest)) problems.push("Rights basis is pending or unverified.");
      if (manifest.source.provenance.verificationStatus !== "VERIFIED") problems.push("Source provenance is not verified.");
      if (!privacyComplete(manifest)) problems.push(manifest.source.anonymizationStatus === "PII_REVIEW_REQUIRED" ? "PII review is required." : "Anonymization review is incomplete.");
      const validReal = problems.length === 0;
      const annotationReady = validReal && manifest.annotation.status === "ANNOTATION_PENDING";
      const certificationReady = validReal && manifest.annotation.status === "CERTIFICATION_READY" && evidence.independent && evidence.agreementValid && evidence.adjudicationValid;
      return { manifestPath: record.manifestPath, manifest, problems, validReal, annotationReady, certificationReady, annotationEvidence: evidence };
    });

    const realRecords = records.filter((record) => record.manifest?.evidenceClass === "REAL_SOURCE");
    const subjectReport = (subject: "MATHEMATICS" | "PHYSICS", target: number) => {
      const rows = realRecords.filter((record) => record.manifest?.subject === subject);
      return {
        target,
        ingested: rows.length,
        valid: rows.filter((record) => record.validReal).length,
        rightsPending: rows.filter((record) => record.manifest?.source.rightsBasis === "RIGHTS_BASIS_PENDING").length,
        rightsConfirmed: rows.filter((record) => record.manifest && rightsConfirmed(record.manifest)).length,
        anonymized: rows.filter((record) => record.manifest && privacyComplete(record.manifest)).length,
        annotationReady: rows.filter((record) => record.annotationReady).length,
        expertA: rows.filter((record) => record.annotationEvidence.expertA).length,
        expertB: rows.filter((record) => record.annotationEvidence.expertB).length,
        adjudicated: rows.filter((record) => record.annotationEvidence.adjudicationValid).length,
        certificationReady: rows.filter((record) => record.certificationReady).length
      };
    };
    const mathematics = subjectReport("MATHEMATICS", INITIAL_STEM_TRANCHE_TARGET.MATHEMATICS);
    const physics = subjectReport("PHYSICS", INITIAL_STEM_TRANCHE_TARGET.PHYSICS);
    const certificationReady = records.filter((record) => record.certificationReady).length;
    const byPartition = Object.fromEntries(["DEVELOPMENT", "VALIDATION", "BLIND"].map((partition) => [partition, realRecords.filter((record) => record.manifest?.partition === partition).length]));
    const duplicateChecksums = [...hashCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
    const duplicateIds = [...idCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
    const orphanSources = orphanSourceDirectories(corpusRoot);
    return {
      statusVersion: "nuee-operational-corpus-status-1.0.0",
      technicalFoundation: "PASS" as const,
      realEvidenceStatus: certificationReady >= SEED_CORPUS_TARGET.minimum ? "READY_FOR_VALIDATION" as const : "PHASE 1 CORPUS EVIDENCE INCOMPLETE" as const,
      phaseOneExitGate: certificationReady >= SEED_CORPUS_TARGET.minimum ? "PASS" as const : "FAIL" as const,
      productionCertified: false,
      mathematics,
      physics,
      overall: {
        initialTarget: INITIAL_STEM_TRANCHE_TARGET.overall,
        phaseOneMinimum: SEED_CORPUS_TARGET.minimum,
        ingested: realRecords.length,
        validRealDocuments: records.filter((record) => record.validReal).length,
        invalidDocuments: records.filter((record) => !record.validReal).length,
        duplicates: duplicateChecksums + duplicateIds,
        missingOrInvalidMetadata: scanned.filter((record) => !record.manifest).length + orphanSources.length,
        annotationReady: records.filter((record) => record.annotationReady).length,
        certificationReady,
        blocked: records.filter((record) => record.problems.length > 0).length + orphanSources.length,
        byPartition
      },
      orphanSources,
      records
    };
  }
};
