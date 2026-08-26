import {
  expertAgreementSchema,
  expertAnnotationSubmissionSchema,
  type ExpertAgreement,
  type ExpertAnnotationSubmission,
  type OperationalAnnotationStatus
} from "./operational-contracts.js";

const transitions: Record<OperationalAnnotationStatus, OperationalAnnotationStatus[]> = {
  ANNOTATION_PENDING: ["ANNOTATION_IN_PROGRESS"],
  ANNOTATION_IN_PROGRESS: ["ANNOTATION_REVIEW"],
  ANNOTATION_REVIEW: ["ANNOTATION_IN_PROGRESS", "ANNOTATED"],
  ANNOTATED: ["ADJUDICATED"],
  ADJUDICATED: ["CERTIFICATION_READY"],
  CERTIFICATION_READY: []
};

export function transitionAnnotationStatus(current: OperationalAnnotationStatus, next: OperationalAnnotationStatus) {
  if (!transitions[current].includes(next)) throw new Error(`Illegal annotation transition: ${current} -> ${next}`);
  return next;
}

export function evaluateIndependentExperts(submissions: ExpertAnnotationSubmission[], agreement?: ExpertAgreement | null) {
  const parsed = submissions.map((submission) => expertAnnotationSubmissionSchema.parse(submission));
  const annotators = new Set(parsed.map((submission) => submission.annotatorId));
  const independent = parsed.length === 2 && annotators.size === 2 && new Set(parsed.map((submission) => submission.annotationSha256)).size === 2;
  if (agreement) {
    expertAgreementSchema.parse(agreement);
    if (!independent) throw new Error("Agreement cannot be recorded without two distinct independent expert submissions.");
    const submissionIds = new Set(parsed.map((submission) => submission.submissionId));
    if (agreement.expertSubmissionIds.some((id) => !submissionIds.has(id))) throw new Error("Agreement references an unknown expert submission.");
  }
  return {
    expertAComplete: parsed.length >= 1,
    expertBComplete: parsed.length === 2 && annotators.size === 2,
    independent,
    agreementEligible: independent,
    agreementRecorded: Boolean(agreement)
  };
}

