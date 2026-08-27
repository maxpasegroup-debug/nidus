export const ESSENTIAL_FIELD_ORDER = ["title", "examType", "subject", "topic", "duration", "marks", "questionCount", "startDate", "startTime", "batchId"] as const;
export type EssentialField = (typeof ESSENTIAL_FIELD_ORDER)[number];
export type EssentialErrors = Partial<Record<EssentialField, string>>;
export type EssentialValues = Record<"title" | "examType" | "subject" | "topic" | "startDate" | "startTime" | "batchId", string> & { duration: number; marks: number; questionCount: number };

function validDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return false;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateExamEssentials(values: EssentialValues, validBatchIds?: ReadonlySet<string>): EssentialErrors {
  const errors: EssentialErrors = {};
  if (!values.title.trim()) errors.title = "Exam name is required.";
  if (!values.examType.trim()) errors.examType = "Please select an exam type.";
  if (!values.subject.trim()) errors.subject = "Subject is required.";
  if (!values.topic.trim()) errors.topic = "Topic is required.";
  if (!Number.isFinite(values.duration) || values.duration <= 0) errors.duration = "Duration must be greater than 0.";
  if (!Number.isFinite(values.marks) || values.marks <= 0) errors.marks = "Marks must be greater than 0.";
  if (!Number.isInteger(values.questionCount) || values.questionCount <= 0) errors.questionCount = "Questions must be a whole number greater than 0.";
  if (!validDateInput(values.startDate)) errors.startDate = "Please select a valid exam start date.";
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.startTime)) errors.startTime = "Please select a valid exam start time.";
  if (!values.batchId || (validBatchIds && !validBatchIds.has(values.batchId))) errors.batchId = "Please select a batch.";
  return errors;
}
