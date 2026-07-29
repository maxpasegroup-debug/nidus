import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";

type LegacyUploadRow = {
  id: string;
  examId: string | null;
  testId: string | null;
  batchId: string | null;
  subject: string | null;
  topic: string | null;
  sourceKind: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  publicId: string;
  extractionStatus: string | null;
  extractionAudit: unknown;
  manualReviewRequired: boolean | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const apply = process.argv.includes("--apply");

function jsonRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function classifyLegacyUpload(upload: LegacyUploadRow) {
  const audit = jsonRecord(upload.extractionAudit);
  const fileName = String(upload.originalName || "").toLowerCase();
  const mime = String(upload.fileType || "").toLowerCase();
  const auditText = JSON.stringify(audit).toLowerCase();
  const textCharacters = Number(audit.textCharacters ?? 0);
  const visualRisk = Boolean(audit.visualRisk);
  const blocked = String(upload.extractionStatus || audit.status || "").toUpperCase() === "BLOCKED";
  const mathSignals = /\b(math|mathematics|algebra|geometry|trigonometry|calculus|physics|formula|equation|fraction|radical|diagram|graph|chart|table|circuit|triangle|vector|matrix)\b/.test(`${fileName} ${auditText}`);
  const isPdf = mime === "application/pdf" || fileName.endsWith(".pdf");
  const isDocx = mime.includes("wordprocessingml") || fileName.endsWith(".docx");
  const isImage = mime.startsWith("image/");

  let documentClass = "TEXT_DOCUMENT";
  if (isImage) documentClass = "SCANNED_IMAGE";
  else if (isPdf && textCharacters < 80) documentClass = "SCANNED_PDF";
  else if ((isPdf || isDocx) && mathSignals) documentClass = "MATH_VISUAL_DOCUMENT";
  else if (isPdf) documentClass = "TEXT_PDF";
  else if (isDocx) documentClass = "DOCX_DOCUMENT";
  if (String(upload.sourceKind).toUpperCase() === "ANSWER_KEY" && !mathSignals) documentClass = "ANSWER_KEY_DOCUMENT";

  const pipeline = documentClass === "SCANNED_IMAGE" || documentClass === "SCANNED_PDF"
    ? "OCR_REVIEW"
    : documentClass === "MATH_VISUAL_DOCUMENT"
      ? "MATH_LAYOUT_REVIEW"
      : documentClass === "DOCX_DOCUMENT"
        ? "DOCX_SEMANTIC_REVIEW"
        : "TEXT_EXTRACTION_REVIEW";
  const confidence = documentClass === "TEXT_PDF" || documentClass === "ANSWER_KEY_DOCUMENT" ? 0.82 : documentClass === "TEXT_DOCUMENT" ? 0.76 : 0.58;
  const manualReviewRequired = Boolean(upload.manualReviewRequired || blocked || visualRisk || documentClass !== "TEXT_DOCUMENT");

  return {
    documentClass,
    pipeline,
    confidence,
    manualReviewRequired,
    classification: {
      documentClass,
      pipeline,
      confidence,
      sourceKind: upload.sourceKind,
      originalName: upload.originalName,
      migratedFromLegacyUploadId: upload.id,
      signals: { textCharacters, visualRisk, blocked, mathSignals, fileType: upload.fileType },
      classifiedAt: new Date().toISOString(),
    },
  };
}

async function main() {
  const requiredColumns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'Question' AND column_name = 'contentJson')
        OR (table_name = 'ExamUpload' AND column_name = 'importJobId')
        OR (table_name = 'ExamImportJob' AND column_name = 'id')
        OR (table_name = 'QuestionVersion' AND column_name = 'id')
      )
  `;
  const readyColumns = new Set(requiredColumns.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = ["Question.contentJson", "ExamUpload.importJobId", "ExamImportJob.id", "QuestionVersion.id"].filter((key) => !readyColumns.has(key));
  if (missing.length) {
    console.log(JSON.stringify({
      mode: apply ? "APPLY" : "DRY_RUN",
      status: "MIGRATION_REQUIRED",
      missing,
      nextStep: "Run Prisma migrations first, then run this script again.",
    }, null, 2));
    return;
  }

  const [legacyQuestionRows, legacyUploads] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Question" WHERE "contentJson" IS NULL`,
    prisma.$queryRaw<LegacyUploadRow[]>`
      SELECT *
      FROM "ExamUpload"
      WHERE "importJobId" IS NULL
      ORDER BY "createdAt" ASC
      LIMIT 500
    `,
  ]);

  console.log(JSON.stringify({
    mode: apply ? "APPLY" : "DRY_RUN",
    legacyQuestionsToUpgrade: Number(legacyQuestionRows[0]?.count ?? 0),
    legacyUploadsToLink: legacyUploads.length,
  }, null, 2));

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to update legacy questions and create import jobs.");
    return;
  }

  const questionUpdate = await prisma.$executeRaw`
    UPDATE "Question"
    SET
      "contentJson" = jsonb_build_object(
        'schemaVersion', 1,
        'format', 'NIDUS_QUESTION_CONTENT_V1',
        'questionType', 'SINGLE_CHOICE',
        'source', 'LEGACY_MIGRATION',
        'blocks', jsonb_build_array(
          jsonb_build_object('id', 'paragraph-1', 'type', 'paragraph', 'text', "questionText"),
          jsonb_build_object(
            'id', 'options-1',
            'type', 'options',
            'options', jsonb_build_array(
              jsonb_build_object('key', 'A', 'text', "optionA"),
              jsonb_build_object('key', 'B', 'text', "optionB"),
              jsonb_build_object('key', 'C', 'text', "optionC"),
              jsonb_build_object('key', 'D', 'text', "optionD")
            )
          )
        ),
        'answer', jsonb_build_object('type', 'SINGLE_CHOICE', 'correctOption', "correctAnswer"),
        'sourceReferences', jsonb_build_array(),
        'metadata', jsonb_build_object(
          'topic', "topic",
          'difficulty', "difficultyLevel",
          'marks', "marks",
          'negativeMarks', "negativeMarks",
          'schemaOwner', 'NDIE'
        )
      ),
      "assets" = CASE
        WHEN "questionImage" IS NOT NULL AND "questionImage" <> ''
        THEN jsonb_build_object('questionImage', "questionImage")
        ELSE COALESCE("assets", '{}'::jsonb)
      END,
      "layout" = COALESCE("layout", jsonb_build_object('documentClass', 'LEGACY_TEXT', 'pipeline', 'LEGACY_MIGRATION')),
      "renderMode" = CASE
        WHEN "questionImage" IS NOT NULL AND "questionImage" <> '' THEN 'RICH_VISUAL_MCQ'
        WHEN "visualReviewRequired" = true THEN 'RICH_REVIEWED_MCQ'
        ELSE 'LEGACY_MCQ'
      END,
      "aiConfidence" = COALESCE("aiConfidence", CASE WHEN "visualReviewRequired" = true THEN 0.72 ELSE 0.90 END),
      "reviewStatus" = COALESCE("reviewStatus", CASE WHEN "visualReviewRequired" = true THEN 'NEEDS_REVIEW' ELSE 'APPROVED' END),
      "publishedVersion" = COALESCE("publishedVersion", 1)
    WHERE "contentJson" IS NULL
  `;

  let linkedUploads = 0;
  for (const upload of legacyUploads) {
    const classification = classifyLegacyUpload(upload);
    const importJobId = randomUUID();
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO "ExamImportJob"
        ("id", "examId", "testId", "batchId", "subject", "topic", "sourceKind", "originalName", "fileType", "fileSize", "cloudinaryUrl", "publicId", "documentClass", "pipeline", "status", "classification", "confidence", "reviewStatus", "manualReviewRequired", "uploadedBy", "createdAt", "updatedAt")
        VALUES
        (${importJobId}, ${upload.examId}, ${upload.testId}, ${upload.batchId}, ${upload.subject}, ${upload.topic}, ${upload.sourceKind}, ${upload.originalName}, ${upload.fileType}, ${upload.fileSize}, ${upload.cloudinaryUrl}, ${upload.publicId}, ${classification.documentClass}, ${classification.pipeline}, 'MIGRATED', ${JSON.stringify(classification.classification)}::jsonb, ${classification.confidence}, ${classification.manualReviewRequired ? "PENDING_REVIEW" : "AUTO_CLASSIFIED"}, ${classification.manualReviewRequired}, ${upload.uploadedBy}, ${upload.createdAt}, ${new Date()})
      `,
      prisma.$executeRaw`
        UPDATE "ExamUpload"
        SET
          "importJobId" = ${importJobId},
          "documentClass" = ${classification.documentClass},
          "pipeline" = ${classification.pipeline},
          "classification" = ${JSON.stringify(classification.classification)}::jsonb,
          "manualReviewRequired" = ${classification.manualReviewRequired},
          "updatedAt" = ${new Date()}
        WHERE "id" = ${upload.id}
      `,
    ]);
    linkedUploads += 1;
  }

  console.log(JSON.stringify({
    migratedQuestions: Number(questionUpdate),
    linkedUploads,
    completedAt: new Date().toISOString(),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
