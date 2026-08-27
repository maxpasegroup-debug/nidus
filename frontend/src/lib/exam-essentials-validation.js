"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESSENTIAL_FIELD_ORDER = void 0;
exports.validateExamEssentials = validateExamEssentials;
exports.ESSENTIAL_FIELD_ORDER = ["title", "examType", "subject", "topic", "duration", "marks", "questionCount", "startDate", "startTime", "batchId"];
function validateExamEssentials(values, validBatchIds) {
    const errors = {};
    if (!values.title.trim())
        errors.title = "Exam name is required.";
    if (!values.examType.trim())
        errors.examType = "Please select an exam type.";
    if (!values.subject.trim())
        errors.subject = "Subject is required.";
    if (!values.topic.trim())
        errors.topic = "Topic is required.";
    if (!Number.isFinite(values.duration) || values.duration <= 0)
        errors.duration = "Duration must be greater than 0.";
    if (!Number.isFinite(values.marks) || values.marks <= 0)
        errors.marks = "Marks must be greater than 0.";
    if (!Number.isInteger(values.questionCount) || values.questionCount <= 0)
        errors.questionCount = "Questions must be a whole number greater than 0.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.startDate) || Number.isNaN(new Date(`${values.startDate}T00:00:00Z`).getTime()))
        errors.startDate = "Please select a valid exam start date.";
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.startTime))
        errors.startTime = "Please select a valid exam start time.";
    if (!values.batchId || (validBatchIds && !validBatchIds.has(values.batchId)))
        errors.batchId = "Please select a batch.";
    return errors;
}
