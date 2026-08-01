export type NdieOcrBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NdieOcrSymbol = {
  text: string;
  confidence: number | null;
  boundingBox?: NdieOcrBox;
};

export type NdieOcrWord = {
  text: string;
  confidence: number | null;
  boundingBox?: NdieOcrBox;
  symbols?: NdieOcrSymbol[];
};

export type NdieOcrLine = {
  text: string;
  confidence: number | null;
  boundingBox?: NdieOcrBox;
  readingOrder: number;
  words: NdieOcrWord[];
};

export type NdieOcrParagraph = {
  text: string;
  confidence: number | null;
  boundingBox?: NdieOcrBox;
  readingOrder: number;
  lines: NdieOcrLine[];
};

export type NdieOcrBlock = {
  blockType: "TEXT" | "TABLE_TEXT" | "UNKNOWN";
  text: string;
  confidence: number | null;
  boundingBox?: NdieOcrBox;
  readingOrder: number;
  paragraphs: NdieOcrParagraph[];
};

export type NdieOcrDiagnostics = {
  blankPage: boolean;
  lowConfidence: boolean;
  missingText: boolean;
  languageMismatch: boolean;
  rotatedPage: boolean;
  providerFailure: boolean;
  retryable: boolean;
  issues: string[];
};

export type NdieNormalizedOcrPage = {
  schemaVersion: "ndie-ocr-v1";
  providerId: string;
  providerVersion: string;
  pageId: string;
  pageNumber: number;
  language: string | null;
  languages: string[];
  rotation: number | null;
  confidence: number | null;
  text: string;
  blocks: NdieOcrBlock[];
  diagnostics: NdieOcrDiagnostics;
  preprocessing: Record<string, unknown>;
  durationMs: number;
  createdAt: string;
};

export type NdieOcrResult = {
  text: string;
  confidence: number | null;
  language: string | null;
  languages: string[];
  normalized: NdieNormalizedOcrPage;
  raw: Record<string, unknown>;
};
