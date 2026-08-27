export const EXAM_LIFECYCLES = ["DRAFT", "IN_REVIEW", "SCHEDULED", "LIVE", "CLOSED", "ARCHIVED"] as const;

export type ExamLifecycle = (typeof EXAM_LIFECYCLES)[number];
export type ExamAvailability = "UPCOMING" | "AVAILABLE" | "EXPIRED" | "UNAVAILABLE";

const transitions: Record<ExamLifecycle, readonly ExamLifecycle[]> = {
  DRAFT: ["IN_REVIEW", "SCHEDULED", "LIVE"],
  IN_REVIEW: ["DRAFT", "SCHEDULED", "LIVE"],
  SCHEDULED: ["DRAFT", "LIVE"],
  LIVE: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function isExamLifecycle(value: unknown): value is ExamLifecycle {
  return typeof value === "string" && (EXAM_LIFECYCLES as readonly string[]).includes(value);
}

export function legacyExamStatus(lifecycle: ExamLifecycle) {
  if (lifecycle === "IN_REVIEW") return "APPROVED";
  if (lifecycle === "SCHEDULED" || lifecycle === "LIVE") return "PUBLISHED";
  return lifecycle;
}

export function lifecycleIsLive(lifecycle: ExamLifecycle) {
  return lifecycle === "LIVE";
}

export function assertLifecycleTransition(from: ExamLifecycle, to: ExamLifecycle) {
  if (!transitions[from].includes(to)) {
    throw Object.assign(new Error(`Invalid exam lifecycle transition: ${from} -> ${to}.`), { statusCode: 409 });
  }
}

export function parseExamWindow(startsAt?: Date | string | null, endsAt?: Date | string | null) {
  if (startsAt == null && endsAt == null) return { startsAt: null, endsAt: null };
  if (startsAt == null || endsAt == null) {
    throw Object.assign(new Error("Both examStartsAt and examEndsAt are required when setting an examination window."), { statusCode: 400 });
  }
  const start = startsAt instanceof Date ? new Date(startsAt.getTime()) : new Date(startsAt);
  const end = endsAt instanceof Date ? new Date(endsAt.getTime()) : new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw Object.assign(new Error("examStartsAt must be before examEndsAt."), { statusCode: 400 });
  }
  return { startsAt: start, endsAt: end };
}

export function examAvailability(input: {
  lifecycle: ExamLifecycle;
  examStartsAt?: Date | null;
  examEndsAt?: Date | null;
  now?: Date;
}): ExamAvailability {
  if (input.lifecycle !== "LIVE" && input.lifecycle !== "SCHEDULED") return "UNAVAILABLE";
  // Legacy live exams had no explicit window. Keep them available until they
  // are deliberately closed; the migration must not invalidate old papers.
  if (!input.examStartsAt || !input.examEndsAt) return "AVAILABLE";
  const now = input.now ?? new Date();
  if (now < input.examStartsAt) return "UPCOMING";
  if (now >= input.examEndsAt) return "EXPIRED";
  return "AVAILABLE";
}

export function validateScheduledRelease(releaseAt: Date, examStartsAt: Date, examEndsAt: Date, now = new Date()) {
  if (Number.isNaN(releaseAt.getTime())) throw Object.assign(new Error("A valid release date and time are required."), { statusCode: 400 });
  if (releaseAt <= now) throw Object.assign(new Error("Scheduled release must be after the current server time."), { statusCode: 400 });
  // Releasing exactly at examination start is supported; after start is not.
  if (releaseAt > examStartsAt) throw Object.assign(new Error("Release time must be on or before the examination start time."), { statusCode: 400 });
  if (releaseAt >= examEndsAt) throw Object.assign(new Error("Release time must be before the examination ends."), { statusCode: 400 });
  return releaseAt;
}
