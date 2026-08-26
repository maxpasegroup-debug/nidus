import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { evaluateIndependentExperts, transitionAnnotationStatus } from "./annotation-lifecycle.js";
import {
  expertAdjudicationSchema,
  expertAgreementSchema,
  expertAnnotationPayloadSchema,
  expertAnnotationSubmissionSchema,
  operationalCorpusManifestSchema,
  type ExpertAdjudication,
  type ExpertAgreement,
  type ExpertAnnotationPayload,
  type ExpertAnnotationSubmission,
  type OperationalCorpusManifest
} from "./operational-contracts.js";

type ExpertSlot = "A" | "B";

function encodedJson(value: unknown) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeExclusive(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, encodedJson(value), { flag: "wx" });
}

function writeAtomic(filePath: string, value: unknown) {
  const temporary = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, encodedJson(value), { flag: "wx" });
  fs.renameSync(temporary, filePath);
}

function loadManifest(documentRoot: string) {
  const manifestPath = path.join(documentRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error("Operational corpus manifest is missing.");
  return { manifestPath, manifest: operationalCorpusManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8"))) };
}

function loadSubmission(annotationRoot: string, slot: ExpertSlot) {
  const submissionPath = path.join(annotationRoot, `expert-${slot.toLowerCase()}.submission.json`);
  if (!fs.existsSync(submissionPath)) return null;
  return expertAnnotationSubmissionSchema.parse(JSON.parse(fs.readFileSync(submissionPath, "utf8")));
}

function ensureDocumentRoot(documentRoot: string) {
  const resolved = path.resolve(documentRoot);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("Corpus document directory is missing.");
  return resolved;
}

function ensureCertificationSafety(manifest: OperationalCorpusManifest, documentRoot: string) {
  if (manifest.evidenceClass !== "REAL_SOURCE") throw new Error("Only REAL_SOURCE evidence can become certification ready.");
  if (manifest.source.rightsBasis === "RIGHTS_BASIS_PENDING" || !manifest.source.rightsVerifiedBy || !manifest.source.rightsVerifiedAt) throw new Error("Rights verification is incomplete.");
  if (!['COMPLETE', 'NOT_APPLICABLE_CONFIRMED'].includes(manifest.source.anonymizationStatus)) throw new Error("Privacy review is incomplete.");
  if (manifest.source.provenance.verificationStatus !== "VERIFIED") throw new Error("Source provenance is not verified.");
  const sourcePath = path.resolve(documentRoot, manifest.source.relativePath);
  if (!fs.existsSync(sourcePath)) throw new Error("Original source is missing.");
}

export const operationalAnnotationService = {
  registerSubmission(input: {
    documentRoot: string;
    slot: ExpertSlot;
    payload: ExpertAnnotationPayload;
    submissionId: string;
    submittedAt: string;
    fieldsAnnotated: string[];
  }) {
    const documentRoot = ensureDocumentRoot(input.documentRoot);
    const annotationRoot = path.join(documentRoot, "annotations");
    fs.mkdirSync(annotationRoot, { recursive: true });
    const { manifestPath, manifest } = loadManifest(documentRoot);
    const payload = expertAnnotationPayloadSchema.parse(input.payload);
    if (payload.documentId !== manifest.documentId) throw new Error("Annotation document ID does not match the manifest.");
    const otherSlot: ExpertSlot = input.slot === "A" ? "B" : "A";
    const other = loadSubmission(annotationRoot, otherSlot);
    if (other?.annotatorId === payload.annotatorId) throw new Error("Expert A and Expert B must be different people.");

    const payloadFilename = `expert-${input.slot.toLowerCase()}.payload.json`;
    const payloadPath = path.join(annotationRoot, payloadFilename);
    const submissionPath = path.join(annotationRoot, `expert-${input.slot.toLowerCase()}.submission.json`);
    if (fs.existsSync(payloadPath) || fs.existsSync(submissionPath)) throw new Error(`Expert ${input.slot} submission already exists; create a new annotation version instead of overwriting evidence.`);
    const payloadBytes = encodedJson(payload);
    const submission = expertAnnotationSubmissionSchema.parse({
      schemaVersion: "nuee-expert-submission-1.0.0",
      submissionId: input.submissionId,
      documentId: manifest.documentId,
      annotatorId: payload.annotatorId,
      annotationVersion: payload.annotationVersion,
      submittedAt: input.submittedAt,
      independentAttestation: true,
      blindedFromOtherSubmission: true,
      fieldsAnnotated: input.fieldsAnnotated,
      annotationPath: `annotations/${payloadFilename}`,
      annotationSha256: sha256(payloadBytes),
      applicability: payload.applicability
    });
    writeExclusive(payloadPath, payload);
    try {
      writeExclusive(submissionPath, submission);
    } catch (error) {
      fs.rmSync(payloadPath, { force: true });
      throw error;
    }

    const submissions = [loadSubmission(annotationRoot, "A"), loadSubmission(annotationRoot, "B")].filter((item): item is ExpertAnnotationSubmission => Boolean(item));
    const expertState = evaluateIndependentExperts(submissions);
    const nextStatus = submissions.length === 2 ? "ANNOTATION_REVIEW" : "ANNOTATION_IN_PROGRESS";
    const updated = operationalCorpusManifestSchema.parse({
      ...manifest,
      annotation: {
        ...manifest.annotation,
        status: manifest.annotation.status === nextStatus ? nextStatus : transitionAnnotationStatus(manifest.annotation.status, nextStatus),
        expertAComplete: Boolean(loadSubmission(annotationRoot, "A")),
        expertBComplete: expertState.expertBComplete,
        expertIds: submissions.map((item) => item.annotatorId)
      }
    });
    writeAtomic(manifestPath, updated);
    return { submission, annotationStatus: updated.annotation.status };
  },

  recordAgreement(input: { documentRoot: string; agreement: ExpertAgreement }) {
    const documentRoot = ensureDocumentRoot(input.documentRoot);
    const annotationRoot = path.join(documentRoot, "annotations");
    const { manifestPath, manifest } = loadManifest(documentRoot);
    const submissions = [loadSubmission(annotationRoot, "A"), loadSubmission(annotationRoot, "B")].filter((item): item is ExpertAnnotationSubmission => Boolean(item));
    const agreement = expertAgreementSchema.parse(input.agreement);
    if (agreement.documentId !== manifest.documentId) throw new Error("Agreement document ID does not match the manifest.");
    evaluateIndependentExperts(submissions, agreement);
    writeExclusive(path.join(annotationRoot, "agreement.json"), agreement);
    const updated = operationalCorpusManifestSchema.parse({ ...manifest, annotation: { ...manifest.annotation, agreement: agreement.score } });
    writeAtomic(manifestPath, updated);
    return agreement;
  },

  recordAdjudication(input: { documentRoot: string; adjudication: ExpertAdjudication }) {
    const documentRoot = ensureDocumentRoot(input.documentRoot);
    const annotationRoot = path.join(documentRoot, "annotations");
    const agreementPath = path.join(annotationRoot, "agreement.json");
    if (!fs.existsSync(agreementPath)) throw new Error("Expert agreement must be recorded before adjudication.");
    const { manifestPath, manifest } = loadManifest(documentRoot);
    const adjudication = expertAdjudicationSchema.parse(input.adjudication);
    if (adjudication.documentId !== manifest.documentId) throw new Error("Adjudication document ID does not match the manifest.");
    writeExclusive(path.join(annotationRoot, "adjudication.json"), adjudication);
    const updated = operationalCorpusManifestSchema.parse({
      ...manifest,
      annotation: { ...manifest.annotation, status: transitionAnnotationStatus(manifest.annotation.status, "ANNOTATED"), adjudicationComplete: true }
    });
    const adjudicated = operationalCorpusManifestSchema.parse({ ...updated, annotation: { ...updated.annotation, status: transitionAnnotationStatus(updated.annotation.status, "ADJUDICATED") } });
    writeAtomic(manifestPath, adjudicated);
    return adjudication;
  },

  markCertificationReady(documentRootInput: string) {
    const documentRoot = ensureDocumentRoot(documentRootInput);
    const { manifestPath, manifest } = loadManifest(documentRoot);
    ensureCertificationSafety(manifest, documentRoot);
    const annotationRoot = path.join(documentRoot, "annotations");
    const submissions = [loadSubmission(annotationRoot, "A"), loadSubmission(annotationRoot, "B")].filter((item): item is ExpertAnnotationSubmission => Boolean(item));
    const agreement = expertAgreementSchema.parse(JSON.parse(fs.readFileSync(path.join(annotationRoot, "agreement.json"), "utf8")));
    evaluateIndependentExperts(submissions, agreement);
    expertAdjudicationSchema.parse(JSON.parse(fs.readFileSync(path.join(annotationRoot, "adjudication.json"), "utf8")));
    const updated = operationalCorpusManifestSchema.parse({
      ...manifest,
      annotation: { ...manifest.annotation, status: transitionAnnotationStatus(manifest.annotation.status, "CERTIFICATION_READY") },
      certificationStatus: "READY_FOR_VALIDATION"
    });
    writeAtomic(manifestPath, updated);
    return updated;
  }
};
