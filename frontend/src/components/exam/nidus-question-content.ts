export const NIDUS_QUESTION_CONTENT_FORMAT = "NIDUS_QUESTION_CONTENT_V1";

export type NidusCoordinateBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NidusSourceReference = {
  documentId?: string;
  uploadId?: string;
  importJobId?: string | null;
  page?: number;
  coordinates?: NidusCoordinateBox;
  note?: string;
};

type BaseBlock = {
  id: string;
  sourceReference?: NidusSourceReference;
  confidence?: number;
  reviewStatus?: "AUTO_APPROVED" | "APPROVED" | "NEEDS_REVIEW" | "MANUAL_CORRECTION_REQUIRED";
};

export type NidusQuestionContentBlock =
  | (BaseBlock & { type: "paragraph"; text: string })
  | (BaseBlock & { type: "formula"; latex: string; text?: string; displayMode?: boolean })
  | (BaseBlock & { type: "image"; url: string; alt?: string; caption?: string; assetRole?: "QUESTION_IMAGE" | "DIAGRAM" | "GRAPH" | "CHART" | "TABLE_IMAGE" | "TEACHER_ATTACHED_VISUAL" })
  | (BaseBlock & { type: "table"; rows: string[][]; caption?: string })
  | (BaseBlock & { type: "diagram"; url?: string; description: string; labels?: string[] })
  | (BaseBlock & { type: "graph"; url?: string; description: string; graphType?: string })
  | (BaseBlock & { type: "options"; options: Array<{ key: "A" | "B" | "C" | "D"; text: string; latex?: string; sourceReference?: NidusSourceReference }> })
  | (BaseBlock & { type: "explanation"; text: string; latex?: string });

export type NidusQuestionContent = {
  schemaVersion: 1;
  format: typeof NIDUS_QUESTION_CONTENT_FORMAT;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_ANSWER" | "NUMERICAL" | "FILL_BLANK" | "ASSERTION_REASON" | "CASE_STUDY" | "MATCHING" | "DIAGRAM_LABEL" | "FILE_UPLOAD";
  source: "TEACHER_IMPORT" | "AI_IMPORT" | "LEGACY_MIGRATION" | "MANUAL_ENTRY";
  blocks: NidusQuestionContentBlock[];
  answer: {
    type: "SINGLE_CHOICE" | "MULTIPLE_ANSWER" | "NUMERICAL" | "TEXT";
    correctOption?: "A" | "B" | "C" | "D";
    correctOptions?: Array<"A" | "B" | "C" | "D">;
    value?: string;
  };
  sourceReferences: NidusSourceReference[];
  metadata: Record<string, unknown>;
};

function hasDelimitedFormula(value: string) {
  return /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$|\\frac|\\sqrt|\\sum|\\int)/.test(value);
}

function sourceReference(input: { sourceDocumentId?: string; uploadId?: string | null; importJobId?: string | null; page?: number }): NidusSourceReference | undefined {
  if (!input.sourceDocumentId && !input.uploadId && !input.importJobId && !input.page) return undefined;
  return {
    documentId: input.sourceDocumentId,
    uploadId: input.uploadId || undefined,
    importJobId: input.importJobId || undefined,
    page: input.page,
  };
}

export function buildNidusQuestionContent(input: {
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  questionType?: NidusQuestionContent["questionType"];
  formulaLatex?: string;
  formulaReviewStatus?: "PENDING" | "TEACHER_CONFIRMED";
  sourceDocumentId?: string;
  sourceUploadId?: string | null;
  importJobId?: string | null;
  page?: number;
  sourceReference?: NidusSourceReference;
  subject?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
  negativeMarks?: number;
  aiConfidence?: number;
  reviewStatus?: string;
  visualReviewNotes?: string[];
  relationshipGroups?: unknown;
  importReplay?: unknown;
  importQualityScore?: unknown;
}): NidusQuestionContent {
  const reference = input.sourceReference || sourceReference({
    sourceDocumentId: input.sourceDocumentId,
    uploadId: input.sourceUploadId,
    importJobId: input.importJobId,
    page: input.page,
  });
  const questionType = input.questionType || "SINGLE_CHOICE";
  const formulaLatex = input.formulaLatex?.trim();
  const blocks: NidusQuestionContentBlock[] = [
    {
      id: "paragraph-1",
      type: "paragraph",
      text: input.questionText,
      sourceReference: reference,
      confidence: input.aiConfidence,
      reviewStatus: input.reviewStatus === "APPROVED" ? "APPROVED" : undefined,
    },
  ];
  if (formulaLatex || hasDelimitedFormula(input.questionText)) {
    blocks.push({
      id: "formula-1",
      type: "formula",
      latex: formulaLatex || input.questionText,
      text: input.questionText,
      displayMode: Boolean(formulaLatex?.includes("\\frac") || formulaLatex?.includes("\\sqrt") || formulaLatex?.includes("\\sum") || formulaLatex?.includes("\\int")),
      sourceReference: reference,
      confidence: input.aiConfidence,
      reviewStatus: input.formulaReviewStatus === "TEACHER_CONFIRMED" ? "APPROVED" : undefined,
    });
  }
  if (input.questionImage) {
    blocks.push({
      id: "image-1",
      type: "image",
      url: input.questionImage,
      alt: "Question visual",
      assetRole: "TEACHER_ATTACHED_VISUAL",
      sourceReference: reference,
    });
  }
  blocks.push({
    id: "options-1",
    type: "options",
    options: [
      { key: "A", text: input.optionA },
      { key: "B", text: input.optionB },
      { key: "C", text: input.optionC },
      { key: "D", text: input.optionD },
    ],
  });
  if (input.explanation?.trim()) {
    blocks.push({ id: "explanation-1", type: "explanation", text: input.explanation });
  }
  return {
    schemaVersion: 1,
    format: NIDUS_QUESTION_CONTENT_FORMAT,
    questionType,
    source: "TEACHER_IMPORT",
    blocks,
    answer: questionType === "MULTIPLE_ANSWER"
      ? { type: "MULTIPLE_ANSWER", correctOptions: input.correctAnswer.split(/[,\s]+/).map((item) => item.trim().toUpperCase()).filter((item): item is "A" | "B" | "C" | "D" => ["A", "B", "C", "D"].includes(item)) }
      : questionType === "NUMERICAL" || questionType === "FILL_BLANK"
        ? { type: "TEXT", value: input.correctAnswer.trim() }
        : { type: "SINGLE_CHOICE", correctOption: input.correctAnswer.trim().toUpperCase() as "A" | "B" | "C" | "D" },
    sourceReferences: reference ? [reference] : [],
    metadata: {
      subject: input.subject,
      topic: input.topic,
      difficulty: input.difficulty,
      marks: input.marks,
      negativeMarks: input.negativeMarks,
      aiConfidence: input.aiConfidence,
      reviewStatus: input.reviewStatus,
      visualReviewNotes: input.visualReviewNotes,
      formulaLatex,
      formulaReviewStatus: input.formulaReviewStatus,
      relationshipGroups: input.relationshipGroups,
      importReplay: input.importReplay,
      importQualityScore: input.importQualityScore,
      legacyCbtMode: "MCQ_COMPATIBLE",
      schemaOwner: "NDIE",
    },
  };
}
