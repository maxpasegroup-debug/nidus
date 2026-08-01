import type { NdieOcrResult } from "./ocr-result.js";
import type { NdieLayoutResult } from "./layout-result.js";
import type { NdieFormulaResult } from "./formula-result.js";
import type { NdieVisualResult } from "./visual-result.js";
import type { NdieAssessmentResult } from "./assessment-result.js";

export type NdieProviderKind = "OCR" | "LAYOUT" | "FORMULA" | "VISUAL" | "QUESTION" | "OPTION" | "ANSWER_KEY" | "SOLUTION" | "AI" | "RENDERER" | "STORAGE";

export type NdieProviderHealth = {
  id: string;
  kind: NdieProviderKind;
  enabled: boolean;
  configured: boolean;
  status: "READY" | "DISABLED" | "NOT_CONFIGURED";
};

export interface NdieProvider {
  id: string;
  kind: NdieProviderKind;
  displayName: string;
  isEnabled(): boolean;
  health(): NdieProviderHealth;
}

export interface OcrProvider extends NdieProvider {
  kind: "OCR";
  recognize(input: {
    importJobId: string;
    pageId: string;
    pageNumber: number;
    imageUrl?: string | null;
    imageBuffer?: Buffer;
    languageHints?: string[];
    rotation?: number | null;
    preprocessing?: Record<string, unknown>;
  }): Promise<{
    text: string;
    confidence: number | null;
    language?: string | null;
    languages?: string[];
    normalized?: NdieOcrResult["normalized"];
    raw: Record<string, unknown>;
  }>;
}

export interface LayoutProvider extends NdieProvider {
  kind: "LAYOUT";
  analyze(input: {
    importJobId: string;
    pageId: string;
    pageNumber: number;
    width?: number | null;
    height?: number | null;
    rotation?: number | null;
    dpi?: number | null;
    aspectRatio?: number | null;
    imageUrl?: string | null;
    ocrText?: string | null;
    ocrJson?: unknown;
  }): Promise<NdieLayoutResult>;
}

export interface FormulaProvider extends NdieProvider {
  kind: "FORMULA";
  detect(input: {
    importJobId: string;
    pageId: string;
    pageNumber: number;
    ocrText?: string | null;
    ocrJson?: unknown;
    layoutJson?: unknown;
    pageImageUrl?: string | null;
    layoutElements: Array<{
      id: string;
      elementType: string;
      text?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
      confidence?: number | null;
      metadata?: unknown;
    }>;
  }): Promise<NdieFormulaResult>;
}

export interface VisualProvider extends NdieProvider {
  kind: "VISUAL";
  detect(input: {
    importJobId: string;
    pageId: string;
    pageNumber: number;
    pageImageUrl?: string | null;
    ocrJson?: unknown;
    layoutJson?: unknown;
    formulaElements: Array<{
      id: string;
      elementType: string;
      text?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
      confidence?: number | null;
      metadata?: unknown;
    }>;
    layoutElements: Array<{
      id: string;
      elementType: string;
      text?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
      confidence?: number | null;
      metadata?: unknown;
    }>;
  }): Promise<NdieVisualResult>;
}

export interface QuestionProvider extends NdieProvider {
  kind: "QUESTION";
  detect(input: {
    importJobId: string;
    elements: Array<{
      id: string;
      pageNumber: number;
      elementType: string;
      text?: string | null;
      normalizedText?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
      confidence?: number | null;
      metadata?: unknown;
    }>;
    ocrPages?: unknown[];
    layoutPages?: unknown[];
    formulaElements?: unknown[];
    visualElements?: unknown[];
  }): Promise<NdieAssessmentResult>;
}

export interface OptionProvider extends NdieProvider {
  kind: "OPTION";
  detect(input: {
    importJobId: string;
    questions: Array<{ questionNumber: string; text: string; sourceElementIds: string[]; sourceMap: Record<string, unknown> }>;
  }): Promise<{
    optionsByQuestion: Array<{
      questionNumber: string;
      options: Array<{ key: string; text: string; confidence: number }>;
      confidence: number;
    }>;
    confidence: number | null;
  }>;
}

export interface AnswerKeyProvider extends NdieProvider {
  kind: "ANSWER_KEY";
  map(input: {
    importJobId: string;
    sourceKind: string;
    elements: Array<{ id: string; pageNumber: number; text?: string | null; coordinates: unknown; readingOrder?: number | null }>;
  }): Promise<{
    answers: Array<{
      questionNumber: string;
      answerJson: Record<string, unknown>;
      sourceDocumentId?: string;
      confidence: number;
    }>;
    confidence: number | null;
  }>;
}

export interface SolutionProvider extends NdieProvider {
  kind: "SOLUTION";
  map(input: {
    importJobId: string;
    elements: Array<{ id: string; pageNumber: number; text?: string | null; coordinates: unknown; readingOrder?: number | null }>;
  }): Promise<{
    solutions: Array<{
      questionNumber: string;
      solutionJson: Record<string, unknown>;
      sourceDocumentId?: string;
      confidence: number;
    }>;
    confidence: number | null;
  }>;
}

export interface AiProvider extends NdieProvider {
  kind: "AI";
  validate(input: {
    importJobId: string;
    candidates: Array<{
      id: string;
      questionNumber?: string | null;
      questionType: string;
      candidateJson: unknown;
      confidence?: number | null;
    }>;
    answerKeys: Array<{
      questionNumber?: string | null;
      answerJson: unknown;
      confidence?: number | null;
    }>;
    solutions: Array<{
      questionNumber?: string | null;
      solutionJson: unknown;
      confidence?: number | null;
    }>;
  }): Promise<{
    validations: Array<{
      candidateId: string;
      confidence: number;
      reviewStatus: "AUTO_APPROVED" | "NEEDS_REVIEW" | "MANUAL_CORRECTION_REQUIRED";
      issues: string[];
      notes: string[];
    }>;
    confidence: number | null;
    raw: Record<string, unknown>;
  }>;
}

export interface RendererProvider extends NdieProvider {
  kind: "RENDERER";
  render(input: {
    importJobId: string;
    sourceDocumentId: string;
    fileType: string;
    fileBuffer?: Buffer;
    storageUrl?: string;
    storagePublicId?: string;
  }): Promise<{
    pageCount: number;
    pages: Array<{
      pageNumber: number;
      width?: number;
      height?: number;
      rotation?: number;
      dpi?: number;
      aspectRatio?: number;
      imageSizeBytes?: number;
      checksum?: string;
      storageProvider?: string;
      storageLocation?: string;
      providerVersion?: string;
      renderDurationMs?: number;
      renderedAt?: string;
      diagnostics?: Record<string, unknown>;
      imageUrl?: string;
      imagePublicId?: string;
      thumbnailUrl?: string;
      previewImage?: { url: string; publicId: string; sizeBytes?: number; checksum?: string };
      reviewImage?: { url: string; publicId: string; sizeBytes?: number; checksum?: string };
      ocrImage?: { url: string; publicId: string; sizeBytes?: number; checksum?: string };
      thumbnailImage?: { url: string; publicId: string; sizeBytes?: number; checksum?: string };
      renderStatus: string;
    }>;
    diagnostics?: Record<string, unknown>;
    providerRun: Record<string, unknown>;
  }>;
}

export interface StorageProvider extends NdieProvider {
  kind: "STORAGE";
}
