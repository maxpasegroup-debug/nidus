import type { Prisma } from "../../generated/prisma/client.js";
import type { ExamDisplayStatus, ExamLifecycle } from "./exam-lifecycle.js";

export const CONTROL_STATUSES = ["DRAFT", "IN_REVIEW", "SCHEDULED", "UPCOMING", "LIVE", "EXPIRED", "CLOSED", "ARCHIVED"] as const;
export type ExamControlAction = "VIEW" | "CONTINUE_EDITING" | "CONTINUE_REVIEW" | "EDIT_RELEASE" | "RETURN_TO_DRAFT" | "CANCEL_SCHEDULE" | "RESULTS" | "CLOSE" | "ARCHIVE";

function releasedLifecycleWhere(now: Date): Prisma.TestWhereInput {
  return { OR: [{ lifecycle: "LIVE" }, { lifecycle: "SCHEDULED", OR: [{ publishAt: null }, { publishAt: { lte: now } }] }] };
}

export function controlDisplayStatusWhere(status: ExamDisplayStatus, now: Date): Prisma.TestWhereInput {
  if (["DRAFT", "IN_REVIEW", "CLOSED", "ARCHIVED"].includes(status)) return { lifecycle: status };
  if (status === "SCHEDULED") return { lifecycle: "SCHEDULED", publishAt: { gt: now } };
  const released = releasedLifecycleWhere(now);
  if (status === "EXPIRED") return { AND: [released, { examEndsAt: { lte: now } }] };
  if (status === "UPCOMING") return { AND: [released, { OR: [{ examEndsAt: null }, { examEndsAt: { gt: now } }] }, { examStartsAt: { gt: now } }] };
  return { AND: [released, { OR: [{ examStartsAt: null }, { examStartsAt: { lte: now } }] }, { OR: [{ examEndsAt: null }, { examEndsAt: { gt: now } }] }] };
}

export function examControlAllowedActions(input: { lifecycle: ExamLifecycle; displayStatus: ExamDisplayStatus; reviewStatus: "READY" | "REVIEW_REQUIRED"; attemptCount: number; publishAt?: Date | null; now: Date }): ExamControlAction[] {
  const actions: ExamControlAction[] = ["VIEW"];
  if (input.lifecycle === "DRAFT") return [...actions, "CONTINUE_EDITING"];
  if (input.lifecycle === "IN_REVIEW") return [...actions, "CONTINUE_REVIEW", "RETURN_TO_DRAFT"];
  if (input.lifecycle === "SCHEDULED" && input.publishAt && input.publishAt > input.now) return [...actions, "EDIT_RELEASE", "CANCEL_SCHEDULE"];
  if (input.lifecycle === "SCHEDULED" || input.lifecycle === "LIVE") {
    if (input.displayStatus === "LIVE" || input.displayStatus === "EXPIRED" || input.attemptCount > 0) actions.push("RESULTS");
    actions.push("CLOSE");
    return actions;
  }
  if (input.lifecycle === "CLOSED") return [...actions, "RESULTS", "ARCHIVE"];
  if (input.lifecycle === "ARCHIVED") return [...actions, "RESULTS"];
  return actions;
}
