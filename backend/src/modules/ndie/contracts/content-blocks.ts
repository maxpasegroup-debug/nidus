export const NDIE_CONTENT_FORMAT = "NIDUS_DOCUMENT_INTELLIGENCE_CONTENT_V1";

export type NdieCoordinate = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type NdieSourceReference = {
  importJobId?: string;
  sourceDocumentId?: string;
  pageId?: string;
  pageNumber: number;
  coordinates: NdieCoordinate;
  sourceImageUrl?: string;
};

export type NdieQuestionType =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "TRUE_FALSE"
  | "NUMERICAL"
  | "INTEGER"
  | "FILL_BLANK"
  | "ESSAY"
  | "PROGRAMMING"
  | "MATCHING"
  | "ORDERING"
  | "CASE_STUDY"
  | "PASSAGE_BASED"
  | "DIAGRAM_BASED"
  | "IMAGE_BASED"
  | "DRAWING"
  | "HOTSPOT"
  | "DRAG_DROP"
  | "FILE_UPLOAD"
  | "VOICE_ANSWER";

export type NdieBlockBase = {
  id: string;
  confidence?: number;
  sourceReference?: NdieSourceReference;
};

export type NdieContentBlock =
  | (NdieBlockBase & { type: "ParagraphBlock"; text: string })
  | (NdieBlockBase & { type: "FormulaBlock"; latex?: string; mathMl?: string; text?: string; formulaImageUrl?: string })
  | (NdieBlockBase & { type: "ImageBlock"; url: string; alt?: string; caption?: string })
  | (NdieBlockBase & { type: "DiagramBlock"; url?: string; description?: string; labels?: string[] })
  | (NdieBlockBase & { type: "TableBlock"; rows?: string[][]; tableImageUrl?: string; caption?: string })
  | (NdieBlockBase & { type: "GraphBlock"; url?: string; description?: string; graphType?: string })
  | (NdieBlockBase & { type: "OptionBlock"; key: string; blocks: NdieContentBlock[] })
  | (NdieBlockBase & { type: "ExplanationBlock"; blocks: NdieContentBlock[] })
  | (NdieBlockBase & { type: "PassageBlock"; blocks: NdieContentBlock[] })
  | (NdieBlockBase & { type: "HintBlock"; blocks: NdieContentBlock[] })
  | (NdieBlockBase & { type: "MetadataBlock"; metadata: Record<string, unknown> });

export type NdieExtractionCandidate = {
  id: string;
  questionNumber?: string;
  questionType: NdieQuestionType;
  blocks: NdieContentBlock[];
  answer?: Record<string, unknown>;
  confidence?: number;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_EDIT";
};
