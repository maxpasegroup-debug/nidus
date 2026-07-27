"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Pencil, Plus, Send, Trash2, Trophy, X } from "lucide-react";
import { ExamReportingPanel, ExaminationEngineBanner, ExaminationRoleActions, ExamTypePanel, QuestionBankHierarchyPanel, type ExaminationEngineRole } from "@/components/examination/examination-engine-workspace";

export type TeacherExamBatch = {
  id: string;
  name: string;
  program?: string;
  studentCount: number;
  subjects: string[];
};

export type TeacherExamRecord = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  course?: string | null;
  subject?: string | null;
  title?: string;
  topic?: string | null;
  questionCount?: number;
  durationMinutes?: number;
  difficulty?: string | null;
  status?: string;
  createdAt?: string;
  attemptStats?: { attempts?: number; submitted?: number; averageScore?: number };
  draft?: { questions?: QuestionDraft[] } | null;
  uploads?: ExamUploadRecord[];
};

type QuestionDraft = {
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficultyLevel: string;
  topic: string;
};

type ExtractionReport = {
  fileName: string;
  sourceKind: "QUESTION_PAPER" | "ANSWER_KEY";
  status: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  textCharacters: number;
  detectedQuestions: number;
  warnings: string[];
  blockers: string[];
  visualRisk: boolean;
  createdAt: string;
};

type ExamUploadRecord = {
  id: string;
  sourceKind: ExtractionReport["sourceKind"] | "EXPLANATION" | "SUPPORTING_ASSET";
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  signedUrl?: string;
  cloudinaryUrl?: string;
  localPreviewUrl?: string;
  extractionStatus?: string;
  extractionAudit?: ExtractionReport | null;
  manualReviewRequired?: boolean;
  manualReviewCompleted?: boolean;
  createdAt?: string;
};

type QuestionVisualAsset = {
  id: string;
  label: string;
  fileName: string;
  pageNumber?: number;
  dataUrl: string;
};

type VisualCropRegion = "FULL" | "TOP" | "MIDDLE" | "BOTTOM";

type ResultRow = {
  rank: number;
  attemptId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  timeTaken: number;
  submittedAt?: string | null;
};

type PaperUnderstandingReport = {
  inferredExamType: string;
  inferredSubject: string;
  inferredTopic: string;
  solutionMode: "ANSWER_KEY_ONLY" | "EXPLANATION_OPTIONAL" | "EXPLANATION_REQUIRED";
  markingScheme: {
    marksPerQuestion: number;
    negativeMarks: number;
    totalMarks: number;
    source: "DETECTED" | "FORM_DEFAULT";
  };
  sections: Array<{ title: string; startQuestion: number; questionCount: number }>;
  answerKey: {
    entries: number;
    missing: number[];
    extra: number[];
    withExplanations: number;
    mode: "WITH_EXPLANATIONS" | "ANSWER_KEY_ONLY" | "NOT_FOUND";
  };
  riskSignals: Array<{ type: string; count: number; severity: "LOW" | "MEDIUM" | "HIGH"; message: string }>;
  questionSignals: Array<{
    number: number;
    visualRequired: boolean;
    formulaRisk: boolean;
    tableRisk: boolean;
    graphRisk: boolean;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    notes: string[];
  }>;
  warnings: string[];
  blockers: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
};

type VisualFidelityReport = {
  sourcePreviewAvailable: boolean;
  visualQuestionCount: number;
  formulaQuestionCount: number;
  tableQuestionCount: number;
  graphQuestionCount: number;
  questionsNeedingSource: number[];
  questionsNeedingReview: number[];
  missingSourceForVisuals: boolean;
  warnings: string[];
  blockers: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
};

type ResultsPayload = {
  exam: TeacherExamRecord;
  released: boolean;
  releasedAt?: string;
  summary?: {
    assignedStudents: number;
    submitted: number;
    pending: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalMarks: number;
    releaseReady: boolean;
  };
  results: ResultRow[];
};

type Props = {
  batches: TeacherExamBatch[];
  selectedBatchId?: string | null;
  selectedSubject?: string | null;
  exams: TeacherExamRecord[];
  role?: Extract<ExaminationEngineRole, "ACADEMIC_HEAD" | "TEACHER">;
  loading?: boolean;
  autoOpenCreatorKey?: string | null;
  onSelectBatch: (id: string) => void;
  onRefresh: () => void | Promise<void>;
};

function resolveApiBase() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
  if (typeof window !== "undefined" && configured) {
    try {
      const configuredUrl = new URL(configured);
      if (window.location.hostname === "nidusacademy.in" && configuredUrl.hostname !== window.location.hostname) return "";
    } catch {
      return "";
    }
  }
  return configured;
}

const API_BASE = resolveApiBase();

const initialForm = {
  title: "",
  topic: "",
  date: "",
  time: "",
  duration: "60",
  marks: "100",
  instructions: "",
};

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) return (payload as { data: T }).data;
  return payload as T;
}

function extractErrorMessage(raw: string, fallback: string) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string };
    return parsed.message || parsed.error || fallback;
  } catch {
    return raw;
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(extractErrorMessage(raw, `Request failed: ${response.status}`));
  }
  return unwrap<T>(await response.json());
}

async function requestForm<T>(path: string, body: FormData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(extractErrorMessage(raw, `Request failed: ${response.status}`));
  }
  return unwrap<T>(await response.json());
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseNumberedBlocks(text: string) {
  const normalized = (text
    ? normalizeExtractedText(text)
      .replace(/(^|\s)(Q\s*\d+\s*[\).])/gi, "\n$2")
      .replace(/\s+(?=\d+\s*[\).]\s+)/g, "\n")
    : "")
    .trim();
  if (!normalized) return [];
  const parts = normalized.split(/\n(?=\s*(?:Q\s*)?\d+\s*[\).])/gi);
  return parts
    .map((part) => part.trim())
    .filter((part) => /^(?:Q\s*)?\d+\s*[\).]/i.test(part));
}

function readUInt16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUInt32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

async function inflateZipEntry(bytes: Uint8Array, method: number) {
  if (method === 0) return bytes;
  if (method !== 8) throw new Error("Unsupported Word compression.");
  const Decompression = (globalThis as unknown as { DecompressionStream?: new (format: string) => TransformStream }).DecompressionStream;
  if (!Decompression) throw new Error("Word extraction is not supported in this browser.");
  const part = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([part]).stream().pipeThrough(new Decompression("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function xmlToPlainText(xml: string) {
  const paragraphs = xml
    .split(/<\/w:p>/i)
    .map((paragraph) => {
      const runs = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
        .map((match) => match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'"));
      return runs.join("");
    })
    .map((line) => line.trim())
    .filter(Boolean);
  return paragraphs.join("\n");
}

async function extractDocxText(file: File) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocdOffset = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(view, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("This Word file could not be opened.");

  const centralDirectorySize = readUInt32(view, eocdOffset + 12);
  const centralDirectoryOffset = readUInt32(view, eocdOffset + 16);
  const decoder = new TextDecoder();
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end && readUInt32(view, offset) === 0x02014b50) {
    const method = readUInt16(view, offset + 10);
    const compressedSize = readUInt32(view, offset + 20);
    const fileNameLength = readUInt16(view, offset + 28);
    const extraLength = readUInt16(view, offset + 30);
    const commentLength = readUInt16(view, offset + 32);
    const localHeaderOffset = readUInt32(view, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));

    if (name === "word/document.xml") {
      const localNameLength = readUInt16(view, localHeaderOffset + 26);
      const localExtraLength = readUInt16(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const uncompressed = await inflateZipEntry(compressed, method);
      return xmlToPlainText(decoder.decode(uncompressed));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error("No readable Word document body was found.");
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let previousY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y: number | null = Array.isArray(item.transform) ? Number(item.transform[5]) : previousY;
      if (previousY !== null && y !== null && Math.abs(y - previousY) > 2) lines.push("\n");
      lines.push(item.str, " ");
      previousY = y;
    }
    pages.push(lines.join("").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim());
  }
  return pages.join("\n\n");
}

async function renderPdfPageAssets(file: File): Promise<QuestionVisualAsset[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const assets: QuestionVisualAsset[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 12); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.35, 980 / Math.max(1, baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    assets.push({
      id: `${file.name}-${pageNumber}-${Date.now()}`,
      label: `Page ${pageNumber}`,
      fileName: file.name,
      pageNumber,
      dataUrl: canvas.toDataURL("image/jpeg", 0.78),
    });
  }
  return assets;
}

async function renderImageAsset(file: File): Promise<QuestionVisualAsset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
  return {
    id: `${file.name}-image-${Date.now()}`,
    label: "Image",
    fileName: file.name,
    dataUrl,
  };
}

function cropRegionLabel(region: VisualCropRegion) {
  if (region === "FULL") return "Full";
  if (region === "TOP") return "Top";
  if (region === "MIDDLE") return "Middle";
  return "Bottom";
}

async function cropVisualAsset(dataUrl: string, region: VisualCropRegion): Promise<string> {
  if (region === "FULL") return dataUrl;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Unable to crop visual asset."));
    element.src = dataUrl;
  });
  const third = Math.floor(image.naturalHeight / 3);
  const sourceY = region === "TOP" ? 0 : region === "MIDDLE" ? third : third * 2;
  const sourceHeight = region === "BOTTOM" ? image.naturalHeight - sourceY : third;
  const outputWidth = Math.min(900, image.naturalWidth);
  const scale = outputWidth / Math.max(1, image.naturalWidth);
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function stripNumber(line: string) {
  return line.replace(/^\s*(?:Q\s*)?\d+\s*(?:[\).:-]|\u2013|\u2014)\s*/i, "").trim();
}

function stripQuestionNumber(line: string) {
  return line.replace(/^\s*(?:Q\s*)?(\d+)\s*[\).]\s*/i, "").trim();
}

function extractOptionText(block: string, option: "A" | "B" | "C" | "D") {
  const nextOption = option === "A" ? "B" : option === "B" ? "C" : option === "C" ? "D" : null;
  const pattern = nextOption
    ? new RegExp(`(?:^|\\s)[\\(\\[]?${option}[\\)\\].]\\s*([\\s\\S]*?)(?=\\s*[\\(\\[]?${nextOption}[\\)\\].]\\s*)`, "i")
    : new RegExp(`(?:^|\\s)[\\(\\[]?${option}[\\)\\].]\\s*([\\s\\S]*)$`, "i");
  const match = block.match(pattern);
  return match?.[1]?.trim().replace(/\s+/g, " ") || "";
}

function parseQuestionBlock(block: string, index: number) {
  const number = Number(block.match(/^\s*(?:Q\s*)?(\d+)\s*[\).]/i)?.[1] || index + 1);
  const normalized = block
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const withoutNumber = stripQuestionNumber(normalized);
  const firstOptionIndex = withoutNumber.search(/(?:^|\s)[\(\[]?A[\)\].]\s+/i);
  const questionText = (firstOptionIndex >= 0 ? withoutNumber.slice(0, firstOptionIndex) : withoutNumber)
    .trim()
    .replace(/\s+/g, " ");
  const optionText = firstOptionIndex >= 0 ? withoutNumber.slice(firstOptionIndex) : "";
  const optionA = extractOptionText(optionText, "A");
  const optionB = extractOptionText(optionText, "B");
  const optionC = extractOptionText(optionText, "C");
  const optionD = extractOptionText(optionText, "D");

  return { number, questionText, options: [optionA, optionB, optionC, optionD] };
}

function parseAnswerGuide(text: string) {
  return parseAnswerGuideV2(text);
}

function parseAnswerGuideV2(text: string) {
  const map = new Map<number, { answer?: string; explanation?: string }>();
  const normalized = normalizeExtractedText(text)
    .replace(/\s+(?=Q\s*\d{1,3}\s*(?:[\).:-]|\u2013|\u2014))/gi, "\n")
    .replace(/\s+(?=\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)\s*\(?[A-D]\)?\b)/gi, "\n")
    .replace(
      /\s+(?=\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)\s*.{0,220}?\b(?:answer|ans|correct answer)\b\s*[:\-])/gi,
      "\n"
    )
    .trim();

  if (!normalized) return map;

  normalized
    .split(/\n(?=\s*(?:Q\s*)?\d{1,3}\s*(?:[\).:-]|\u2013|\u2014))/gi)
    .map((block) => block.trim())
    .filter((block) => /^(?:Q\s*)?\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)/i.test(block))
    .forEach((block, index) => {
      const number = Number(block.match(/^\s*(?:Q\s*)?(\d+)/i)?.[1] || index + 1);
      const withoutNumber = stripNumber(block);
      const answerMatch = withoutNumber.match(/(?:^|\s)(?:answer|ans|correct answer)\s*[:\-]?\s*\(?([A-D])\)?\b/i)
        || withoutNumber.match(/^\s*\(?([A-D])\)?[\).:\-\s]/i);
      const answer = answerMatch?.[1]?.toUpperCase();
      const afterAnswer = answerMatch
        ? withoutNumber.slice((answerMatch.index || 0) + answerMatch[0].length)
        : withoutNumber;
      const explanationMatch = afterAnswer.match(/(?:explanation|reason)\s*[:\-]\s*([\s\S]*)/i);
      const explanation = (explanationMatch?.[1] || afterAnswer)
        .replace(/\s*(?:topic\/reference|reference|topic)\s*[:\-][\s\S]*$/i, "")
        .replace(/^\s*(?:[-:]|\u2013|\u2014)\s*/, "")
        .trim();

      if (answer || explanation) map.set(number, { answer, explanation });
    });

  if (map.size === 0) {
    [...normalized.matchAll(/(?:^|\s)(?:Q\s*)?(\d{1,3})\s*(?:[\).:\-]|\u2013|\u2014)?\s*\(?([A-D])\)?(?=\s|$)/gi)]
      .forEach((match) => {
        const number = Number(match[1]);
        const answer = match[2]?.toUpperCase();
        if (number && answer) map.set(number, { answer });
      });
  }

  return map;
}

function buildQuestions(source: string, answerGuide: string, topic: string, totalMarks: number): QuestionDraft[] {
  const answerGuideMap = parseAnswerGuide(answerGuide);
  const blocks = parseNumberedBlocks(source);
  const parsedQuestions = blocks.map((block, index) => {
    const parsed = parseQuestionBlock(block, index);
    const answerGuideEntry = answerGuideMap.get(parsed.number);
    return {
      questionText: parsed.questionText,
      optionA: parsed.options[0] || "Option A",
      optionB: parsed.options[1] || "Option B",
      optionC: parsed.options[2] || "Option C",
      optionD: parsed.options[3] || "Option D",
      correctAnswer: answerGuideEntry?.answer || "A",
      explanation: answerGuideEntry?.explanation || "Explanation will be reviewed by faculty.",
      marks: 1,
      negativeMarks: 0,
      difficultyLevel: "MEDIUM",
      topic: topic || "General",
    };
  }).filter((question) => {
    const realOptionCount = [question.optionA, question.optionB, question.optionC, question.optionD]
      .filter((option) => option && !/^Option [A-D]$/i.test(option)).length;
    return question.questionText && realOptionCount >= 2;
  });
  const perQuestionMarks = Math.max(1, Number(((Number.isFinite(totalMarks) ? totalMarks : 100) / Math.max(1, parsedQuestions.length)).toFixed(2)));
  return parsedQuestions.map((question) => ({ ...question, marks: perQuestionMarks }));
}

function inferSubjectFromText(source: string, fallback: string) {
  const text = source.toLowerCase();
  const signals: Array<[string, RegExp]> = [
    ["Mathematics", /\b(mathematics|maths|algebra|trigonometry|geometry|calculus|coordinate|probability|matrix|vector|quadratic)\b/i],
    ["Physics", /\b(physics|motion|force|velocity|acceleration|circuit|ray|lens|mirror|current|voltage|newton|projectile)\b/i],
    ["Chemistry", /\b(chemistry|mole|atomic|compound|reaction|acid|base|organic|periodic|valency)\b/i],
    ["English", /\b(english|grammar|synonym|antonym|passage|comprehension|sentence|idiom|vocabulary)\b/i],
    ["Reasoning", /\b(reasoning|series|coding|decoding|analogy|blood relation|direction|syllogism|venn)\b/i],
    ["General Studies", /\b(history|geography|polity|constitution|economics|current affairs|biology|science|gk)\b/i],
  ];
  return signals.find(([, pattern]) => pattern.test(text))?.[0] || fallback || "General";
}

function inferExamTypeFromText(source: string) {
  const upper = source.toUpperCase();
  for (const exam of ["NDA", "CDS", "AFCAT", "AGNIVEER", "SSB", "SSC", "RIMC", "AISSEE"]) {
    if (upper.includes(exam)) return exam;
  }
  if (/weekly\s+test/i.test(source)) return "Weekly Test";
  if (/scholarship/i.test(source)) return "Scholarship Exam";
  if (/mock\s+test/i.test(source)) return "Mock Test";
  return "Teacher Exam";
}

function detectMarkingScheme(source: string, questionCount: number, formTotalMarks: number) {
  const normalized = normalizeExtractedText(source);
  const perQuestionMatch = normalized.match(/(?:each question carries|each question|marks per question|marking)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:mark|marks)?/i)
    || normalized.match(/(\d+(?:\.\d+)?)\s*marks?\s*(?:each|per question)/i);
  const negativeMatch = normalized.match(/negative\s+mark(?:ing)?\s*[:\-]?\s*(\d+(?:\.\d+)?|1\/3|0\.33|0\.25|1\/4)/i)
    || normalized.match(/(?:minus|deduct(?:ion)?)\s*(\d+(?:\.\d+)?|1\/3|0\.33|0\.25|1\/4)/i);
  const marksPerQuestion = perQuestionMatch ? Number(perQuestionMatch[1]) : Math.max(1, Number((formTotalMarks / Math.max(1, questionCount)).toFixed(2)));
  const negativeRaw = negativeMatch?.[1];
  const negativeMarks = negativeRaw === "1/3" ? 0.33 : negativeRaw === "1/4" ? 0.25 : Number(negativeRaw || 0);
  return {
    marksPerQuestion: Number.isFinite(marksPerQuestion) ? marksPerQuestion : 1,
    negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : 0,
    totalMarks: formTotalMarks || Number((marksPerQuestion * questionCount).toFixed(2)),
    source: perQuestionMatch || negativeMatch ? "DETECTED" as const : "FORM_DEFAULT" as const,
  };
}

function detectSections(source: string, questionCount: number) {
  const lines = source.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections = lines
    .map((line) => {
      const match = line.match(/^(section|part)\s*[-:]?\s*([a-z0-9]+)?\s*[:\-]?\s*(.{0,80})$/i);
      if (!match) return null;
      const following = source.slice(source.indexOf(line));
      const nextQuestion = Number(following.match(/(?:Q\s*)?(\d+)\s*[\).]/i)?.[1] || 1);
      return { title: line.replace(/\s+/g, " "), startQuestion: nextQuestion, questionCount: 0 };
    })
    .filter((item): item is { title: string; startQuestion: number; questionCount: number } => Boolean(item));
  if (!sections.length) return [{ title: "Main Paper", startQuestion: 1, questionCount }];
  return sections.map((section, index) => {
    const next = sections[index + 1];
    return {
      ...section,
      questionCount: Math.max(0, (next?.startQuestion ?? questionCount + 1) - section.startQuestion),
    };
  });
}

function visualNotesForQuestion(question: QuestionDraft) {
  const text = [question.questionText, question.optionA, question.optionB, question.optionC, question.optionD].join(" ");
  const visualRequired = /\b(diagram|figure|fig\.|image|shown|following|above|below|circuit|ray diagram|map)\b/i.test(text);
  const tableRisk = /\b(table|data table|tabular|column|row)\b/i.test(text);
  const graphRisk = /\b(graph|chart|bar graph|pie chart|line graph|plot)\b/i.test(text);
  const formulaRisk = /[∫√πθλΩ≈≤≥÷×∞Σµ]|\\frac|\^\s*\d|\b(sin|cos|tan|log|lim)\b|[a-z]\s*=\s*[^.,;]+/i.test(text);
  const notes = [
    visualRequired ? "Visual reference detected" : "",
    tableRisk ? "Table/data dependency detected" : "",
    graphRisk ? "Graph/chart dependency detected" : "",
    formulaRisk ? "Formula/symbol risk detected" : "",
  ].filter(Boolean);
  const confidence = visualRequired || tableRisk || graphRisk ? "LOW" : formulaRisk ? "MEDIUM" : "HIGH";
  return { visualRequired, formulaRisk, tableRisk, graphRisk, confidence: confidence as "HIGH" | "MEDIUM" | "LOW", notes };
}

function understandPaper(source: string, answerGuide: string, questions: QuestionDraft[], formTopic: string, formSubject: string, formMarks: number): PaperUnderstandingReport {
  const answerMap = parseAnswerGuide(answerGuide);
  const numbers = questions.map((_, index) => index + 1);
  const answerNumbers = Array.from(answerMap.keys()).sort((a, b) => a - b);
  const missing = numbers.filter((number) => !answerMap.has(number));
  const extra = answerNumbers.filter((number) => number > questions.length);
  const withExplanations = answerNumbers.filter((number) => Boolean(answerMap.get(number)?.explanation?.trim())).length;
  const questionSignals = questions.map((question, index) => ({ number: index + 1, ...visualNotesForQuestion(question) }));
  const visualCount = questionSignals.filter((signal) => signal.visualRequired).length;
  const formulaCount = questionSignals.filter((signal) => signal.formulaRisk).length;
  const tableCount = questionSignals.filter((signal) => signal.tableRisk).length;
  const graphCount = questionSignals.filter((signal) => signal.graphRisk).length;
  const warnings = [
    missing.length ? `${missing.length} question(s) do not have a parsed answer key.` : "",
    extra.length ? `${extra.length} answer key item(s) do not match extracted questions.` : "",
    visualCount ? `${visualCount} question(s) refer to diagrams/images that must be checked against the original paper.` : "",
    tableCount || graphCount ? `${tableCount + graphCount} question(s) may depend on tables, charts or graphs.` : "",
    formulaCount ? `${formulaCount} formula/symbol-heavy question(s) need faculty review.` : "",
  ].filter(Boolean);
  const blockers = [
    questions.length === 0 ? "No valid MCQ questions were detected." : "",
    missing.length === questions.length && questions.length > 0 ? "No answer key could be matched to the extracted paper." : "",
  ].filter(Boolean);
  const solutionMode = answerNumbers.length && withExplanations === 0
    ? "ANSWER_KEY_ONLY"
    : withExplanations < answerNumbers.length
      ? "EXPLANATION_OPTIONAL"
      : "EXPLANATION_REQUIRED";
  const highRisk = blockers.length > 0 || visualCount + tableCount + graphCount > 0;
  const riskSignals: PaperUnderstandingReport["riskSignals"] = [];
  if (visualCount) riskSignals.push({ type: "VISUAL_REFERENCE", count: visualCount, severity: "HIGH", message: "Diagrams/images must be preserved or manually rebuilt." });
  if (tableCount) riskSignals.push({ type: "TABLE", count: tableCount, severity: "HIGH", message: "Table-based questions must be checked against source layout." });
  if (graphCount) riskSignals.push({ type: "GRAPH", count: graphCount, severity: "HIGH", message: "Graph/chart questions must be checked against source layout." });
  if (formulaCount) riskSignals.push({ type: "FORMULA", count: formulaCount, severity: "MEDIUM", message: "Formula rendering should be reviewed before publishing." });
  return {
    inferredExamType: inferExamTypeFromText(source),
    inferredSubject: inferSubjectFromText(source, formSubject),
    inferredTopic: inferExamTopic(source, formTopic),
    solutionMode,
    markingScheme: detectMarkingScheme(source, questions.length, formMarks),
    sections: detectSections(source, questions.length),
    answerKey: {
      entries: answerNumbers.length,
      missing,
      extra,
      withExplanations,
      mode: answerNumbers.length ? withExplanations ? "WITH_EXPLANATIONS" : "ANSWER_KEY_ONLY" : "NOT_FOUND",
    },
    riskSignals,
    questionSignals,
    warnings,
    blockers,
    confidence: blockers.length || highRisk ? "LOW" : warnings.length ? "MEDIUM" : "HIGH",
    createdAt: new Date().toISOString(),
  };
}

function buildVisualFidelityReport(report: PaperUnderstandingReport, uploads: ExamUploadRecord[]): VisualFidelityReport {
  const visualSignals = report.questionSignals.filter((signal) => signal.visualRequired);
  const formulaSignals = report.questionSignals.filter((signal) => signal.formulaRisk);
  const tableSignals = report.questionSignals.filter((signal) => signal.tableRisk);
  const graphSignals = report.questionSignals.filter((signal) => signal.graphRisk);
  const reviewSignals = report.questionSignals.filter((signal) => signal.visualRequired || signal.formulaRisk || signal.tableRisk || signal.graphRisk);
  const sourceUpload = uploads.find((upload) => upload.sourceKind === "QUESTION_PAPER") ?? null;
  const sourcePreviewAvailable = Boolean(sourceUpload?.localPreviewUrl || sourceUpload?.signedUrl || sourceUpload?.cloudinaryUrl);
  const questionsNeedingSource = Array.from(new Set([...visualSignals, ...tableSignals, ...graphSignals].map((signal) => signal.number))).sort((a, b) => a - b);
  const questionsNeedingReview = Array.from(new Set(reviewSignals.map((signal) => signal.number))).sort((a, b) => a - b);
  const missingSourceForVisuals = questionsNeedingSource.length > 0 && !sourcePreviewAvailable;
  const warnings = [
    visualSignals.length ? `${visualSignals.length} question(s) refer to a diagram, figure or image.` : "",
    tableSignals.length ? `${tableSignals.length} question(s) depend on table layout or tabular data.` : "",
    graphSignals.length ? `${graphSignals.length} question(s) depend on a graph or chart.` : "",
    formulaSignals.length ? `${formulaSignals.length} question(s) include formula or symbol risk.` : "",
  ].filter(Boolean);
  const blockers = [
    missingSourceForVisuals ? "Upload or preserve the original question paper before publishing visual/table/graph based questions." : "",
  ].filter(Boolean);
  return {
    sourcePreviewAvailable,
    visualQuestionCount: visualSignals.length,
    formulaQuestionCount: formulaSignals.length,
    tableQuestionCount: tableSignals.length,
    graphQuestionCount: graphSignals.length,
    questionsNeedingSource,
    questionsNeedingReview,
    missingSourceForVisuals,
    warnings,
    blockers,
    confidence: blockers.length ? "LOW" : questionsNeedingReview.length ? "MEDIUM" : "HIGH",
    createdAt: new Date().toISOString(),
  };
}

function auditExtractedSource(file: File, text: string, sourceKind: ExtractionReport["sourceKind"], isPdf: boolean): ExtractionReport {
  const normalized = normalizeExtractedText(text);
  const detectedQuestions = sourceKind === "QUESTION_PAPER" ? parseNumberedBlocks(normalized).length : parseAnswerGuide(normalized).size;
  const warnings: string[] = [];
  const blockers: string[] = [];
  const hasVisualReferences = /\b(diagram|figure|fig\.|graph|chart|table|circuit|image|shown|following|above|below|ray diagram|bar graph|pie chart|map|data table)\b/i.test(normalized);
  const hasFormulaSignals = /[∫√πθλΩ≈≤≥÷×∞Σµ]|\\frac|\^\s*\d|\b(sin|cos|tan|log|lim)\b|[a-z]\s*=\s*[^.,;]+/i.test(normalized);
  const visualRisk = isPdf && (hasVisualReferences || hasFormulaSignals);

  if (!normalized) blockers.push("No readable text was extracted. This is likely a scanned/image PDF.");
  if (sourceKind === "QUESTION_PAPER" && normalized.length < 350) blockers.push("Very little question text was extracted.");
  if (sourceKind === "QUESTION_PAPER" && detectedQuestions === 0) blockers.push("No numbered MCQ questions were detected.");
  if (visualRisk) blockers.push("Diagram/formula/chart-heavy PDF detected. Auto extraction cannot preserve visual content.");
  if (isPdf && /[^\x00-\x7F]/.test(normalized)) warnings.push("Special symbols were detected. Check formulas and units carefully.");
  if (isPdf && detectedQuestions > 0 && detectedQuestions < 5 && sourceKind === "QUESTION_PAPER") warnings.push("Only a few questions were detected from the PDF.");
  if (sourceKind === "ANSWER_KEY" && detectedQuestions === 0) warnings.push("No answer key entries were detected.");

  return {
    fileName: file.name,
    sourceKind,
    status: blockers.length ? "BLOCKED" : warnings.length ? "REVIEW_REQUIRED" : "READY",
    textCharacters: normalized.length,
    detectedQuestions,
    warnings,
    blockers,
    visualRisk,
    createdAt: new Date().toISOString(),
  };
}

function normalizeQuestionText(value?: string) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() || "";
}

function paperReadiness(questions: QuestionDraft[]) {
  const missingOptions = questions.filter((question) => [question.optionA, question.optionB, question.optionC, question.optionD]
    .some((option) => !option || /^Option [A-D]$/i.test(option))).length;
  const missingAnswers = questions.filter((question) => !/^[A-D]$/i.test(question.correctAnswer)).length;
  const missingExplanations = questions.filter((question) => !question.explanation || /^Explanation will be reviewed/i.test(question.explanation)).length;
  const seenQuestions = new Map<string, number>();
  const duplicateQuestions = questions.flatMap((question, index) => {
    const normalizedText = normalizeQuestionText(question.questionText);
    if (!normalizedText) return [];
    const firstIndex = seenQuestions.get(normalizedText);
    if (firstIndex !== undefined) return [{ index, firstIndex }];
    seenQuestions.set(normalizedText, index);
    return [];
  });
  return {
    missingOptions,
    missingAnswers,
    missingExplanations,
    duplicateQuestions,
    ready: questions.length > 0 && missingOptions === 0 && missingAnswers === 0 && missingExplanations === 0 && duplicateQuestions.length === 0,
  };
}

function statusLabel(status?: string) {
  const value = String(status || "DRAFT").replace(/_/g, " ").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function optionText(question: QuestionDraft, option: "A" | "B" | "C" | "D") {
  if (option === "A") return question.optionA;
  if (option === "B") return question.optionB;
  if (option === "C") return question.optionC;
  return question.optionD;
}

function inferExamTitle(source: string, subject: string, batchName?: string) {
  const upperSource = source.toUpperCase();
  const subjectTitle = subject && subject !== "General" ? subject : "Exam";
  if (upperSource.includes("MATHEMATICS MOCK TEST")) return "Mathematics Mock Test";
  const mockLine = source.split(/\n+/).map((line) => line.trim()).find((line) => /mock\s+test/i.test(line));
  if (mockLine) return mockLine.replace(/\s+/g, " ");
  return batchName ? `${subjectTitle} Test - ${batchName}` : `${subjectTitle} Test`;
}

function inferExamTopic(source: string, fallback: string) {
  const match = source.match(/Topics?\s*:\s*([\s\S]*?)(?=\n\s*(?:Q\s*)?\d+[\).]|\s+(?:Q\s*)?1[\).])/i);
  const topic = match?.[1]?.replace(/\s+/g, " ").trim();
  return topic || fallback || "General";
}

export function TeacherExamWorkspace({ batches, selectedBatchId, selectedSubject, exams, role = "TEACHER", loading, autoOpenCreatorKey, onSelectBatch, onRefresh }: Props) {
  const [activeBatchId, setActiveBatchId] = useState(selectedBatchId || batches[0]?.id || "");
  const activeBatch = useMemo(() => batches.find((batch) => batch.id === activeBatchId) || batches[0] || null, [activeBatchId, batches]);
  const subjectOptions = useMemo(() => {
    const options = Array.from(new Set((activeBatch?.subjects ?? []).map((item) => item.trim()).filter(Boolean)));
    return options.length ? options : ["General"];
  }, [activeBatch?.subjects]);
  const [targetBatchIds, setTargetBatchIds] = useState<string[]>(activeBatch?.id ? [activeBatch.id] : []);
  const [subject, setSubject] = useState(subjectOptions[0] || "General");
  const [showCreator, setShowCreator] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [questionSource, setQuestionSource] = useState("");
  const [answerGuide, setAnswerGuide] = useState("");
  const [uploadedQuestionPaper, setUploadedQuestionPaper] = useState("");
  const [uploadedAnswerGuide, setUploadedAnswerGuide] = useState("");
  const [examUploads, setExamUploads] = useState<ExamUploadRecord[]>([]);
  const uploadPreviewUrlsRef = useRef<string[]>([]);
  const [visualAssets, setVisualAssets] = useState<QuestionVisualAsset[]>([]);
  const [questionVisuals, setQuestionVisuals] = useState<Record<number, string>>({});
  const [extractionReports, setExtractionReports] = useState<ExtractionReport[]>([]);
  const [manualPaperReview, setManualPaperReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultsExam, setResultsExam] = useState<TeacherExamRecord | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [editingExam, setEditingExam] = useState<TeacherExamRecord | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [handledAutoOpenKey, setHandledAutoOpenKey] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (selectedBatchId && selectedBatchId !== activeBatchId) setActiveBatchId(selectedBatchId);
  }, [activeBatchId, selectedBatchId]);

  useEffect(() => {
    if (activeBatch?.id && !targetBatchIds.length) setTargetBatchIds([activeBatch.id]);
  }, [activeBatch?.id, targetBatchIds.length]);

  useEffect(() => {
    if (subjectOptions.length && !subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
    }
  }, [subject, subjectOptions]);

  useEffect(() => {
    if (selectedSubject && subjectOptions.includes(selectedSubject) && subject !== selectedSubject) {
      setSubject(selectedSubject);
    }
  }, [selectedSubject, subject, subjectOptions]);

  const batchExams = useMemo(() => {
    if (!activeBatch) return [];
    return exams.filter((exam) => exam.batchId === activeBatch.id || exam.batchName === activeBatch.name);
  }, [activeBatch, exams]);
  const liveExamCount = batchExams.filter((exam) => !["ARCHIVED", "CANCELLED"].includes(String(exam.status || "").toUpperCase())).length;
  const submittedCount = batchExams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? 0), 0);
  const averageScoreSource = batchExams.filter((exam) => typeof exam.attemptStats?.averageScore === "number");
  const averageScore = averageScoreSource.length ? averageScoreSource.reduce((total, exam) => total + Number(exam.attemptStats?.averageScore ?? 0), 0) / averageScoreSource.length : 0;

  const questions = useMemo(() => buildQuestions(questionSource, answerGuide, form.topic, Number(form.marks)), [answerGuide, form.marks, form.topic, questionSource]);
  const readiness = useMemo(() => paperReadiness(questions), [questions]);
  const understanding = useMemo(
    () => understandPaper(questionSource, answerGuide, questions, form.topic, subject, Number(form.marks)),
    [answerGuide, form.marks, form.topic, questionSource, questions, subject]
  );
  const visualFidelity = useMemo(() => buildVisualFidelityReport(understanding, examUploads), [examUploads, understanding]);
  const persistedExamUploads = useMemo(() => examUploads.map(({ localPreviewUrl, ...upload }) => upload), [examUploads]);
  const visualQuestionsWithoutAttachment = useMemo(() => understanding.questionSignals
    .filter((signal) => (signal.visualRequired || signal.tableRisk || signal.graphRisk) && !questionVisuals[signal.number])
    .map((signal) => signal.number), [questionVisuals, understanding.questionSignals]);
  const blockingExtractionReports = useMemo(() => extractionReports.filter((report) => report.status === "BLOCKED" && report.sourceKind === "QUESTION_PAPER"), [extractionReports]);
  const reviewExtractionReports = useMemo(() => extractionReports.filter((report) => report.status !== "READY"), [extractionReports]);
  const extractionNeedsManualReview = blockingExtractionReports.length > 0 || extractionReports.some((report) => report.visualRisk) || understanding.confidence === "LOW" || visualFidelity.confidence === "LOW";
  const canPublishPaper = questions.length > 0 && readiness.missingOptions === 0 && readiness.missingAnswers === 0 && !visualFidelity.missingSourceForVisuals && (!extractionNeedsManualReview || manualPaperReview);
  const questionsForPublish = useMemo(() => questions.map((question, index) => {
    const signal = understanding.questionSignals[index];
    const visualReviewNotes = signal?.notes ?? [];
    return {
      ...question,
      questionImage: questionVisuals[index + 1] || question.questionImage,
      visualReviewRequired: Boolean(signal && (signal.visualRequired || signal.tableRisk || signal.graphRisk || signal.formulaRisk)),
      visualReviewNotes,
      explanation: question.explanation && !/^Explanation will be reviewed/i.test(question.explanation)
        ? question.explanation
        : `The correct answer is option ${question.correctAnswer}. Review this answer against the uploaded faculty key and topic notes.`,
      marks: understanding.markingScheme.marksPerQuestion || question.marks,
      negativeMarks: understanding.markingScheme.negativeMarks,
    };
  }), [questionVisuals, questions, understanding.markingScheme.marksPerQuestion, understanding.markingScheme.negativeMarks, understanding.questionSignals]);
  const duplicateQuestionIndexes = useMemo(() => new Set(readiness.duplicateQuestions.flatMap((item) => [item.firstIndex, item.index])), [readiness.duplicateQuestions]);
  const effectiveTopic = useMemo(() => inferExamTopic(questionSource, form.topic), [form.topic, questionSource]);
  const effectiveTitle = useMemo(() => form.title.trim() || inferExamTitle(questionSource, subject, activeBatch?.name), [activeBatch?.name, form.title, questionSource, subject]);

  useEffect(() => () => {
    uploadPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    uploadPreviewUrlsRef.current = [];
  }, []);

  useEffect(() => {
    if (!questionSource || !subjectOptions.length) return;
    if (subjectOptions.includes(understanding.inferredSubject) && subject !== understanding.inferredSubject) {
      setSubject(understanding.inferredSubject);
    }
  }, [questionSource, subject, subjectOptions, understanding.inferredSubject]);

  useEffect(() => {
    if (!autoOpenCreatorKey || autoOpenCreatorKey === handledAutoOpenKey || !activeBatch) return;
    setHandledAutoOpenKey(autoOpenCreatorKey);
    openCreator();
  }, [activeBatch, autoOpenCreatorKey, handledAutoOpenKey]);

  function openBatch(batchId: string) {
    setActiveBatchId(batchId);
    setTargetBatchIds((ids) => ids.length ? Array.from(new Set([...ids, batchId])) : [batchId]);
    onSelectBatch(batchId);
  }

  function toggleTargetBatch(batchId: string) {
    setTargetBatchIds((ids) => ids.includes(batchId) ? ids.filter((id) => id !== batchId) : [...ids, batchId]);
  }

  async function preserveExamSource(file: File, sourceKind: ExtractionReport["sourceKind"], report: ExtractionReport) {
    if (!activeBatch?.id) throw new Error("Select a batch before uploading exam source files.");
    const body = new FormData();
    body.append("file", file);
    body.append("batchId", activeBatch.id);
    body.append("subject", subject);
    body.append("topic", form.topic || effectiveTopic || "General");
    body.append("sourceKind", sourceKind);
    body.append("extractionStatus", report.status);
    body.append("manualReviewRequired", String(report.status === "BLOCKED" || report.visualRisk));
    body.append("manualReviewCompleted", String(manualPaperReview));
    body.append("extractionAudit", JSON.stringify({ ...report, paperUnderstanding: understanding, visualFidelity }));
    const result = await requestForm<{ upload: ExamUploadRecord }>("/api/academy/exams/uploads", body);
    const localPreviewUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : undefined;
    if (localPreviewUrl) uploadPreviewUrlsRef.current.push(localPreviewUrl);
    const uploadWithPreview = { ...result.upload, localPreviewUrl };
    setExamUploads((uploads) => [
      ...uploads.filter((upload) => !(upload.sourceKind === sourceKind && upload.originalName === file.name)),
      uploadWithPreview,
    ]);
    return uploadWithPreview;
  }

  async function appendFileText(file: File | null, setter: (value: string) => void, current: string, sourceKind: ExtractionReport["sourceKind"], setUploadedName?: (value: string) => void) {
    if (!file) return;
    setUploadedName?.(file.name);
    try {
      const fileName = file.name.toLowerCase();
      const isTxt = file.type.startsWith("text/") || fileName.endsWith(".txt");
      const isDocx = fileName.endsWith(".docx");
      const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      if (!isTxt && !isDocx && !isPdf && !(sourceKind === "QUESTION_PAPER" && isImage)) {
        setMessage(`${file.name} is attached, but only PDF, DOCX, TXT and question-paper images can be extracted.`);
        return;
      }
      if (sourceKind === "QUESTION_PAPER" && isPdf) {
        const assets = await renderPdfPageAssets(file).catch(() => []);
        if (assets.length) setVisualAssets((current) => [...current.filter((asset) => asset.fileName !== file.name), ...assets]);
      }
      if (sourceKind === "QUESTION_PAPER" && isImage) {
        const asset = await renderImageAsset(file);
        setVisualAssets((current) => [...current.filter((item) => item.fileName !== file.name), asset]);
      }
      const text = isDocx ? await extractDocxText(file) : isPdf ? await extractPdfText(file) : isTxt ? await file.text().catch(() => "") : "";
      const report = auditExtractedSource(file, text, sourceKind, isPdf);
      setExtractionReports((reports) => [...reports.filter((item) => !(item.sourceKind === sourceKind && item.fileName === file.name)), report]);
      let preserved = false;
      try {
        await preserveExamSource(file, sourceKind, report);
        preserved = true;
      } catch (uploadError) {
        setMessage(uploadError instanceof Error ? `Extraction completed, but source preservation failed: ${uploadError.message}` : "Extraction completed, but source preservation failed.");
      }
      if (sourceKind === "QUESTION_PAPER") setManualPaperReview(false);
      if (!text.trim()) {
        setMessage(`No readable text was found in ${file.name}. Upload a text/DOCX version or manually paste the questions.`);
        return;
      }
      setter([current, text].filter(Boolean).join("\n\n"));
      setMessage(report.status === "BLOCKED"
        ? `${file.name} ${preserved ? "was preserved and" : ""} needs manual review before publishing: ${report.blockers.join(" ")}`
        : report.status === "REVIEW_REQUIRED"
          ? `${file.name} ${preserved ? "was preserved and" : "was"} extracted, but please review: ${report.warnings.join(" ")}`
          : `${file.name} ${preserved ? "was preserved and" : "was"} extracted successfully. Review the questions before continuing.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to read ${file.name}.`);
      return;
    }
  }

  function openCreator() {
    setEditingExam(null);
    setForm({
      ...initialForm,
      title: activeBatch && subject ? `${subject} Test - ${activeBatch.name}` : "",
      date: new Date().toISOString().slice(0, 10),
    });
    setQuestionSource("");
    setAnswerGuide("");
    setUploadedQuestionPaper("");
    setUploadedAnswerGuide("");
    setExamUploads([]);
    setVisualAssets([]);
    setQuestionVisuals({});
    setExtractionReports([]);
    setManualPaperReview(false);
    setTargetBatchIds(activeBatch?.id ? [activeBatch.id] : []);
    setStep(1);
    setPreviewIndex(0);
    setMessage("");
    setShowCreator(true);
  }

  function openEditor(exam: TeacherExamRecord) {
    if (exam.batchId && exam.batchId !== activeBatchId) openBatch(exam.batchId);
    setEditingExam(exam);
    setSubject(exam.subject || subject || activeBatch?.subjects[0] || "General");
    setForm({
      title: exam.title || "",
      topic: exam.topic || "",
      date: exam.createdAt ? new Date(exam.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      time: "",
      duration: String(exam.durationMinutes ?? 60),
      marks: "100",
      instructions: "",
    });
    const savedQuestions = Array.isArray(exam.draft?.questions) ? exam.draft.questions : [];
    setQuestionVisuals(savedQuestions.reduce<Record<number, string>>((acc, question, index) => {
      if (question.questionImage) acc[index + 1] = question.questionImage;
      return acc;
    }, {}));
    setVisualAssets(savedQuestions
      .map((question, index) => question.questionImage ? {
        id: `saved-question-${index + 1}`,
        label: `Saved Q${index + 1}`,
        fileName: "Saved question image",
        dataUrl: question.questionImage,
      } : null)
      .filter((asset): asset is QuestionVisualAsset => Boolean(asset)));
    setQuestionSource(savedQuestions.map((question, index) => [
      `Q${index + 1}. ${question.questionText}`,
      `(A) ${question.optionA}`,
      `(B) ${question.optionB}`,
      `(C) ${question.optionC}`,
      `(D) ${question.optionD}`,
    ].join("\n")).join("\n\n"));
    setAnswerGuide(savedQuestions.map((question, index) => `${index + 1} - ${question.correctAnswer}\nExplanation: ${question.explanation}`).join("\n\n"));
    setUploadedQuestionPaper("");
    setUploadedAnswerGuide("");
    setExamUploads(exam.uploads ?? []);
    const savedReports = (exam.uploads ?? [])
      .map((upload) => upload.extractionAudit)
      .filter((report): report is ExtractionReport => Boolean(report));
    setExtractionReports(savedReports);
    setManualPaperReview((exam.uploads ?? []).some((upload) => upload.manualReviewCompleted));
    setStep(1);
    setPreviewIndex(0);
    setMessage("");
    setShowCreator(true);
  }

  async function publishExam() {
    if (!activeBatch) return;
    const firstDuplicate = readiness.duplicateQuestions[0];
    if (!editingExam && firstDuplicate) {
      setPreviewIndex(firstDuplicate.index);
      setStep(3);
      setMessage(`Duplicate question found: Question ${firstDuplicate.index + 1} repeats Question ${firstDuplicate.firstIndex + 1}. Please edit the uploaded paper before publishing.`);
      return;
    }
    const selectedBatches = (targetBatchIds.length ? targetBatchIds : [activeBatch.id])
      .map((id) => batches.find((batch) => batch.id === id))
      .filter((batch): batch is TeacherExamBatch => Boolean(batch));
    if (!selectedBatches.length) {
      setMessage("Select at least one assigned batch.");
      return;
    }
    if (!editingExam && !canPublishPaper) {
      setMessage(visualFidelity.missingSourceForVisuals
        ? "Original question paper source is required before publishing diagram, table or graph based questions."
        : extractionNeedsManualReview && !manualPaperReview
        ? "Manual review is required for this uploaded paper before publishing. Check/correct every question, then tick manual review completed."
        : `Paper is incomplete: ${readiness.missingOptions} question(s) need options and ${readiness.missingAnswers} question(s) need answer keys before publishing.`);
      return;
    }
    if (!effectiveTitle.trim() || !effectiveTopic.trim()) {
      setMessage("Enter or upload an exam name and topic before publishing.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (editingExam) {
        if (questionSource && !canPublishPaper) {
          setMessage(`Paper is incomplete: ${readiness.missingOptions} question(s) need options and ${readiness.missingAnswers} question(s) need answer keys before saving.`);
          return;
        }
        await requestJson(`/api/academy/exams/${editingExam.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            subject,
            title: effectiveTitle,
            topic: effectiveTopic,
            durationMinutes: Number(form.duration),
            difficulty: editingExam.difficulty || "MEDIUM",
            instructions: form.instructions,
            status: editingExam.status || "PUBLISHED",
            examUploadIds: persistedExamUploads.map((upload) => upload.id),
            draft: canPublishPaper ? {
              title: effectiveTitle,
              subject,
              topic: effectiveTopic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions: questionsForPublish,
              extractionAudit: extractionReports,
              examUploads: persistedExamUploads,
              paperUnderstanding: understanding,
              visualFidelity: { ...visualFidelity, questionImageAssignments: Object.keys(questionVisuals).length, visualQuestionsWithoutAttachment },
              manualPaperReview,
            } : undefined,
          }),
        });
        setShowCreator(false);
        setEditingExam(null);
        await onRefresh();
        return;
      }
      const publishAt = form.date && form.time
        ? new Date(`${form.date}T${form.time}:00`).toISOString()
        : undefined;
      await Promise.all(selectedBatches.map((targetBatch) =>
        requestJson("/api/academy/exams", {
          method: "POST",
          body: JSON.stringify({
            batchId: targetBatch.id,
            batchName: targetBatch.name,
            course: targetBatch.program,
            subject,
            title: effectiveTitle,
            topic: effectiveTopic,
            questionCount: questionsForPublish.length,
            durationMinutes: Number(form.duration),
            difficulty: "MEDIUM",
            instructions: [
              form.instructions,
              selectedBatches.length > 1 ? `Common exam published to: ${selectedBatches.map((batch) => batch.name).join(", ")}` : "",
            ].filter(Boolean).join("\n"),
            publishDate: form.date,
            publishTime: form.time,
            publishAt,
            examUploadIds: persistedExamUploads.map((upload) => upload.id),
            draft: {
              title: effectiveTitle,
              description: form.instructions || `Faculty published ${subject} exam for ${targetBatch.name}.`,
              examType: "Teacher Exam",
              category: "Defence LMS",
              subject,
              topic: effectiveTopic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions: questionsForPublish,
              extractionAudit: extractionReports,
              examUploads: persistedExamUploads,
              paperUnderstanding: understanding,
              visualFidelity: { ...visualFidelity, questionImageAssignments: Object.keys(questionVisuals).length, visualQuestionsWithoutAttachment },
              manualPaperReview,
            },
          }),
        }),
      ));
      setShowCreator(false);
      setMessage(`Exam published to ${selectedBatches.length} batch(es).`);
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : editingExam ? "Unable to update exam." : "Unable to publish exam.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelExam(exam: TeacherExamRecord) {
    if (!window.confirm(`Cancel ${exam.title || "this exam"}? Students will no longer see it.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`/api/academy/exams/${exam.id}/archive`, { method: "POST", body: JSON.stringify({}) });
      setMessage("Exam cancelled.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel exam.");
    } finally {
      setBusy(false);
    }
  }

  async function publishChanges(exam: TeacherExamRecord) {
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`/api/academy/exams/${exam.id}/publish`, { method: "POST", body: JSON.stringify({}) });
      setMessage("Exam changes published.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish exam changes.");
    } finally {
      setBusy(false);
    }
  }

  async function openResults(exam: TeacherExamRecord) {
    setResultsExam(exam);
    setResults(null);
    setMessage("");
    try {
      setResults(await requestJson<ResultsPayload>(`/api/academy/exams/${exam.id}/results`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load results.");
    }
  }

  async function releaseResults() {
    if (!resultsExam) return;
    if (!results?.results.length) {
      setMessage("At least one submitted attempt is required before releasing results.");
      return;
    }
    if (!window.confirm("Release official results now? Students will immediately see scores, ranks, answer keys and explanations.")) return;
    setBusy(true);
    try {
      setResults(await requestJson<ResultsPayload>(`/api/academy/exams/${resultsExam.id}/release-results`, { method: "POST", body: JSON.stringify({}) }));
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to release results.");
    } finally {
      setBusy(false);
    }
  }

  function goNextStep() {
    if (step === 1) {
      if (!(targetBatchIds.length || activeBatch?.id)) {
        setMessage("Select at least one batch.");
        return;
      }
      if (!subject) {
        setMessage("Select a subject.");
        return;
      }
      if (!effectiveTitle.trim() || !form.topic.trim() || !form.date || !form.time) {
        setMessage("Exam name, topic, date and start time are required.");
        return;
      }
      if (Number(form.duration) <= 0 || Number(form.marks) <= 0) {
        setMessage("Duration and total marks must be greater than zero.");
        return;
      }
    }
    if (step === 2 && !editingExam && questions.length === 0) {
      setMessage("No valid MCQ questions were found. Please upload or paste questions with A, B, C and D options.");
      return;
    }
    if (step === 2 && !editingExam && readiness.missingAnswers > 0) {
      setMessage(`Answer key review required: ${readiness.missingAnswers} question(s) need answer keys before preview.`);
      return;
    }
    if (step === 2 && !editingExam && visualFidelity.missingSourceForVisuals) {
      setMessage("Upload the original question paper/source so diagram, table and graph questions can be verified beside the extracted preview.");
      return;
    }
    if (step === 2 && !editingExam && extractionNeedsManualReview && !manualPaperReview) {
      setMessage("The engine found visual, table, graph, formula or low-confidence extraction risk. Correct the extracted questions if needed, then tick manual review completed before preview.");
      return;
    }
    if (step === 2 && !editingExam && readiness.duplicateQuestions.length > 0) {
      const firstDuplicate = readiness.duplicateQuestions[0];
      setPreviewIndex(firstDuplicate.index);
      setMessage(`Preview opened with duplicate questions flagged. Question ${firstDuplicate.index + 1} repeats Question ${firstDuplicate.firstIndex + 1}; fix it before publishing.`);
    } else if (step === 2 && !editingExam && (readiness.missingOptions > 0 || readiness.missingExplanations > 0)) {
      setMessage(`Preview opened with ${questions.length} valid question(s). Review ${readiness.missingOptions} option issue(s) and ${readiness.missingExplanations} explanation issue(s) before publishing.`);
    } else {
      setMessage("");
    }
    setStep((value) => Math.min(4, value + 1));
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Exams</p>
              <h2 className="mt-1 text-2xl font-black">Create exam and check results</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose a batch, add the question paper, check once, and publish to students.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">
              {showAdvanced ? "Hide engine details" : "Engine details"}
            </button>
            <button type="button" onClick={openCreator} disabled={!activeBatch} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <Plus size={18} /> New Exam
            </button>
          </div>
        </div>
      </div>

      {showAdvanced ? (
        <div className="grid gap-4">
          <ExaminationEngineBanner
            role={role}
            title={role === "ACADEMIC_HEAD" ? "Academic Head Examination Engine" : "Teacher Examination Engine"}
            description="Approved hosting engine, question bank structure, CBT results and reporting controls."
            metrics={[
              { label: "Question Bank", value: batchExams.length, tone: "success" },
              { label: "Published Tests", value: liveExamCount, tone: liveExamCount ? "info" : "default" },
              { label: "Submitted Attempts", value: submittedCount, tone: submittedCount ? "success" : "default" },
              { label: "Average Score", value: `${Math.round(averageScore)}%`, tone: averageScore ? "info" : "default" },
            ]}
          />
          <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
            <ExaminationRoleActions role={role} />
            <ExamReportingPanel attempts={submittedCount} averageScore={averageScore} reports={submittedCount} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
            <QuestionBankHierarchyPanel questionCount={batchExams.reduce((total, exam) => total + Number(exam.questionCount ?? exam.draft?.questions?.length ?? 0), 0)} />
            <ExamTypePanel />
          </section>
        </div>
      ) : null}

      {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{message}</div> : null}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Step 1</p>
            <h3 className="mt-1 text-xl font-black">Select batch</h3>
          </div>
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black">{batches.length} batch(es)</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {batches.map((batch) => (
            <button key={batch.id} type="button" onClick={() => openBatch(batch.id)} className={`rounded-xl border p-3 text-left transition ${activeBatch?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)] hover:-translate-y-0.5"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-base font-black">{batch.name}</p>
                {activeBatch?.id === batch.id ? <span className="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black text-slate-950">Selected</span> : null}
              </div>
              <p className={`mt-2 text-xs ${activeBatch?.id === batch.id ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{batch.studentCount} students / {batch.subjects.length} subjects</p>
            </button>
          ))}
        </div>
      </div>

      {activeBatch ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Published Exams</p>
              <h3 className="mt-1 text-xl font-black">{activeBatch.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{activeBatch.studentCount} students receive exams published here.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[440px]">
              <Summary label="Live Exams" value={String(liveExamCount)} />
              <Summary label="Submitted" value={String(submittedCount)} />
              <label className="grid gap-2 text-sm font-black">
                Subject
                <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {loading ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">Loading exams...</p> : null}
            {!loading && !batchExams.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">No exams published for this batch yet.</p> : null}
            {batchExams.map((exam) => (
              <article key={exam.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ink)]">{statusLabel(exam.status)}</span>
                      <span className="text-xs font-black text-[var(--muted-blue)]">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                    <h4 className="mt-2 truncate text-lg font-black">{exam.title || "Exam"}</h4>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.subject || subject} / {exam.topic || "Topic"} / {exam.questionCount ?? 0} Qs / {exam.durationMinutes ?? 0} min / {exam.attemptStats?.submitted ?? 0} submitted</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button type="button" onClick={() => openEditor(exam)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-slate-950">
                      <Pencil size={16} /> Edit
                    </button>
                    <button type="button" onClick={() => void openResults(exam)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-white px-3 text-sm font-black text-slate-950">
                      <Trophy size={16} /> Results
                    </button>
                    <details className="relative">
                      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">More</summary>
                      <div className="absolute right-0 z-20 mt-2 grid min-w-40 gap-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">
                        <button type="button" onClick={() => void publishChanges(exam)} disabled={busy} className="rounded-lg px-3 py-2 text-left text-xs font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Publish changes</button>
                        <button type="button" onClick={() => void cancelExam(exam)} disabled={busy} className="rounded-lg px-3 py-2 text-left text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel exam</button>
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {showCreator ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-4 sm:px-8">
              <div className="mx-auto max-w-7xl">
              <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">{editingExam ? "Edit Exam" : "New Exam"}</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">{activeBatch?.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Step {step} of 4. Complete only what is shown on this screen.</p>
              </div>
              <button type="button" onClick={() => setShowCreator(false)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)]">
                <X size={18} />
              </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["Details", "Questions", "Check", "Publish"].map((label, index) => (
                  <button key={label} type="button" onClick={() => index + 1 < step && setStep(index + 1)} className={`min-h-10 rounded-xl border px-2 text-xs font-black sm:text-sm ${step === index + 1 ? "border-slate-950 bg-slate-950 text-white" : index + 1 < step ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--border)] bg-white text-[var(--muted-blue)]"}`}>{index + 1}. {label}</button>
                ))}
              </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
              <div className="mx-auto max-w-7xl">
              {step === 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 md:col-span-2">
                    <p className="text-sm font-black">Who should get this exam?</p>
                    <p className="mt-1 text-xs text-[var(--muted-blue)]">Select one or more batches. Keep only one selected for a normal class exam.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {batches.map((batch) => (
                        <label key={batch.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-black ${targetBatchIds.includes(batch.id) ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-[var(--border)] bg-white text-[var(--ink)]"}`}>
                          <input type="checkbox" checked={targetBatchIds.includes(batch.id)} onChange={() => toggleTargetBatch(batch.id)} />
                          <span>{batch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="grid gap-2 text-sm font-black">
                    Subject
                    <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
                      {Array.from(new Set(targetBatchIds.flatMap((id) => {
                        const options = batches.find((batch) => batch.id === id)?.subjects ?? [];
                        return options.length ? options : ["General"];
                      }).concat(subjectOptions))).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <Field label="Exam name" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <Field label="Topic" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} placeholder="Algebra, Constitution, Motion..." />
                  <Field label="Date" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
                  <TimePickerField label="Time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
                  <Field label="Duration in minutes" type="number" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} />
                  <Field label="Total marks" type="number" value={form.marks} onChange={(value) => setForm((current) => ({ ...current, marks: value }))} />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ExamInputCard title="Question paper" description="Paste or upload MCQ questions. Format: question, then A, B, C and D options.">
                    <textarea value={questionSource} onChange={(event) => setQuestionSource(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1. Question...\nA. Option\nB. Option\nC. Option\nD. Option"} />
                    <FileUploadRow
                      label="Upload question paper"
                      fileName={uploadedQuestionPaper}
                      accept=".txt,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={(file) => void appendFileText(file, setQuestionSource, questionSource, "QUESTION_PAPER", setUploadedQuestionPaper)}
                    />
                  </ExamInputCard>
                  <ExamInputCard title="Answer key" description="Add the correct option and a short explanation. Example: 1 - A Explanation: ...">
                    <textarea value={answerGuide} onChange={(event) => setAnswerGuide(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1 - A\nExplanation: Sets common to both are 2 and 4.\n\n2 - C\nExplanation: Substitute x = 4."} />
                    <FileUploadRow
                      label="Upload answer key + explanations"
                      fileName={uploadedAnswerGuide}
                      accept=".txt,.docx,.pdf"
                      onChange={(file) => void appendFileText(file, setAnswerGuide, answerGuide, "ANSWER_KEY", setUploadedAnswerGuide)}
                    />
                  </ExamInputCard>
                  {reviewExtractionReports.length ? (
                    <ExtractionAuditPanel reports={reviewExtractionReports} manualReview={manualPaperReview} onManualReviewChange={setManualPaperReview} />
                  ) : null}
                  {questions.length ? <PaperUnderstandingPanel report={understanding} /> : null}
                  {questions.length ? <VisualFidelityPanel report={visualFidelity} /> : null}
                  {examUploads.length ? <SourceFilesPanel uploads={examUploads} /> : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Check before publishing</p>
                    <h3 className="mt-2 text-2xl font-black">{effectiveTitle}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-white/10 px-3 py-2">{subject}</span>
                      <span className="rounded-full bg-white/10 px-3 py-2">{questionsForPublish.length} questions</span>
                      <span className="rounded-full bg-white/10 px-3 py-2">{form.marks} marks</span>
                      <span className="rounded-full bg-white/10 px-3 py-2"><Clock3 className="mr-1 inline h-4 w-4" />{form.duration} minutes</span>
                    </div>
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-sm font-black ${canPublishPaper ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                      {canPublishPaper
                        ? understanding.solutionMode === "ANSWER_KEY_ONLY"
                          ? "Ready. Answer-key-only paper detected; explanations are optional for this exam."
                          : readiness.missingExplanations > 0
                            ? `Ready. ${readiness.missingExplanations} explanation(s) will use a simple fallback if not edited.`
                            : "Ready. Questions, options and answer key are available."
                        : extractionNeedsManualReview && !manualPaperReview
                          ? "Manual review is required because the uploaded paper may contain diagrams, formulas, charts or scanned content."
                          : `${readiness.missingOptions} option issue(s) / ${readiness.missingAnswers} answer issue(s) / ${readiness.duplicateQuestions.length} duplicate(s)`}
                    </div>
                  </div>
                  {reviewExtractionReports.length ? <ExtractionAuditPanel reports={reviewExtractionReports} manualReview={manualPaperReview} onManualReviewChange={setManualPaperReview} compact /> : null}
                  <PaperUnderstandingPanel report={understanding} compact />
                  <VisualFidelityPanel report={visualFidelity} compact />
                  {visualQuestionsWithoutAttachment.length ? (
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">
                      Visual attachment reminder: question(s) {visualQuestionsWithoutAttachment.join(", ")} still rely on the preserved source instead of a direct question image.
                    </p>
                  ) : null}
                  {examUploads.length ? <SourceFilesPanel uploads={examUploads} compact /> : null}
                  <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_340px]">
                    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-22rem)] lg:min-h-[24rem] lg:overflow-y-auto">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">Questions</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--muted-blue)]">{questions.length} Qs</span>
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {questions.map((_, index) => {
                          const isDuplicate = duplicateQuestionIndexes.has(index);
                          return <button key={index} type="button" onClick={() => setPreviewIndex(index)} className={`grid h-11 w-full place-items-center rounded-lg border text-xs font-black transition ${isDuplicate ? "animate-pulse border-rose-500 bg-rose-100 text-rose-900 shadow-sm shadow-rose-200 hover:border-rose-600" : previewIndex === index ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-[var(--border)] bg-white hover:border-slate-300 hover:bg-slate-50"}`}>{index + 1}</button>;
                        })}
                      </div>
                    </aside>
                    {questions[previewIndex] ? (
                      <article className={`rounded-2xl border p-5 shadow-sm sm:p-7 lg:self-start ${duplicateQuestionIndexes.has(previewIndex) ? "animate-pulse border-rose-500 bg-rose-50 shadow-rose-100" : "border-[var(--border)] bg-white"}`}>
                        <div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-[var(--gold-dark)]">Question {previewIndex + 1} of {questions.length}</span><span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{questions[previewIndex].marks} mark(s)</span></div>
                        <h4 className="mt-5 text-lg font-black leading-7 sm:text-xl">{questions[previewIndex].questionText}</h4>
                        <QuestionFidelityNotice signal={understanding.questionSignals[previewIndex]} />
                        {questionVisuals[previewIndex + 1] ? (
                          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-black">Attached visual for Question {previewIndex + 1}</p>
                              <button type="button" onClick={() => setQuestionVisuals((current) => {
                                const next = { ...current };
                                delete next[previewIndex + 1];
                                return next;
                              })} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">
                                Remove
                              </button>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={questionVisuals[previewIndex + 1]} alt="" className="mt-3 max-h-80 w-auto rounded-xl border border-[var(--border)] bg-white object-contain" />
                          </div>
                        ) : null}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {(["A", "B", "C", "D"] as const).map((option) => <div key={option} className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-bold"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--page-bg)] font-black">{option}</span>{optionText(questions[previewIndex], option)}</div>)}
                        </div>
                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-sm font-black text-emerald-900">Correct Answer: {questions[previewIndex].correctAnswer}</p>
                          <p className="mt-2 text-sm leading-6 text-emerald-900">{questions[previewIndex].explanation}</p>
                        </div>
                        {readiness.duplicateQuestions.filter((item) => item.index === previewIndex || item.firstIndex === previewIndex).map((item) => (
                          <div key={`${item.firstIndex}-${item.index}`} className="mt-4 animate-pulse rounded-2xl border border-rose-500 bg-rose-100 p-4 text-sm font-black text-rose-900 shadow-sm shadow-rose-200">
                            <p>{previewIndex === item.index ? `Duplicate warning: this repeats Question ${item.firstIndex + 1}.` : `Duplicate warning: Question ${item.index + 1} repeats this question.`}</p>
                            <div className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2">
                              <div className="rounded-xl border border-rose-300 bg-white/75 p-3">
                                <span className="block text-rose-700">Question {item.firstIndex + 1}</span>
                                {questions[item.firstIndex]?.questionText}
                              </div>
                              <div className="rounded-xl border border-rose-300 bg-white/75 p-3">
                                <span className="block text-rose-700">Question {item.index + 1}</span>
                                {questions[item.index]?.questionText}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5"><button type="button" disabled={previewIndex === 0} onClick={() => setPreviewIndex((value) => Math.max(0, value - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-black disabled:opacity-40"><ChevronLeft size={16} />Previous</button><button type="button" disabled={previewIndex >= questions.length - 1} onClick={() => setPreviewIndex((value) => Math.min(questions.length - 1, value + 1))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-40">Next<ChevronRight size={16} /></button></div>
                      </article>
                    ) : <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center font-bold text-[var(--muted-blue)]">Upload a valid question paper to preview the student exam.</p>}
                    <VisualSourcePreviewPanel
                      uploads={examUploads}
                      report={understanding}
                      activeIndex={previewIndex}
                      assets={visualAssets}
                      attachedImage={questionVisuals[previewIndex + 1]}
                      onAttachVisual={(dataUrl) => setQuestionVisuals((current) => ({ ...current, [previewIndex + 1]: dataUrl }))}
                    />
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Summary label="Batches" value={String((targetBatchIds.length ? targetBatchIds : activeBatch?.id ? [activeBatch.id] : []).length)} />
                    <Summary label="Subject" value={subject} />
                    <Summary label="Questions" value={String(editingExam?.questionCount ?? questionsForPublish.length)} />
                    <Summary label="Timer" value={`${form.duration} min`} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Exam</p>
                    <p className="mt-2 text-lg font-black">{effectiveTitle}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{effectiveTopic}</p>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <p><b>Date:</b> {form.date || "Not set"}</p><p><b>Time:</b> {form.time || "Not set"}</p>
                      <p><b>Duration:</b> {form.duration} minutes</p><p><b>Total marks:</b> {form.marks}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[var(--muted-blue)]">Publishing sends this exam to students. They can open it from their Student dashboard.</p>
                  {readiness.duplicateQuestions.length ? (
                    <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-800">
                      Fix {readiness.duplicateQuestions.length} duplicate question(s) before publishing. Question {readiness.duplicateQuestions[0].index + 1} repeats Question {readiness.duplicateQuestions[0].firstIndex + 1}.
                    </p>
                  ) : null}
                  {reviewExtractionReports.length ? <ExtractionAuditPanel reports={reviewExtractionReports} manualReview={manualPaperReview} onManualReviewChange={setManualPaperReview} compact /> : null}
                  <PaperUnderstandingPanel report={understanding} compact />
                  <VisualFidelityPanel report={visualFidelity} compact />
                  {visualQuestionsWithoutAttachment.length ? (
                    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">
                      Visual attachment reminder: question(s) {visualQuestionsWithoutAttachment.join(", ")} will depend on teacher-reviewed source preservation unless you attach page snapshots.
                    </p>
                  ) : null}
                  {examUploads.length ? <SourceFilesPanel uploads={examUploads} compact /> : null}
                </div>
              ) : null}

              {message ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-700">{message}</p> : null}
              </div>
            </div>
            <div className="grid shrink-0 gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex sm:justify-between sm:p-5">
              <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="min-h-12 rounded-xl border border-[var(--border)] px-5 font-black">Back</button>
              {step < 4 ? (
                <button type="button" onClick={goNextStep} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-6 font-black text-white">{step === 1 ? "Next: Questions" : step === 2 ? "Next: Check" : "Next: Publish"}</button>
              ) : (
                <button type="button" onClick={() => void publishExam()} disabled={busy || (!editingExam && !canPublishPaper)} className="min-h-12 rounded-xl border border-emerald-700 bg-emerald-700 px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? (editingExam ? "Saving..." : "Publishing...") : editingExam ? "Save changes" : "Publish to students"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {resultsExam ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-3">
          <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-950 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] p-4 sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Result Review</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">{resultsExam.title}</h3>
              </div>
              <button type="button" onClick={() => setResultsExam(null)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)]">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {!results ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5">Loading results...</p> : null}
              {results ? (
                <>
                <ResultReleasePanel payload={results} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black">{results.results.length} submitted / {results.released ? "Released" : "Not released"}</p>
                  <button type="button" onClick={() => void releaseResults()} disabled={busy || results.released || !results.results.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
                    <CheckCircle2 size={16} /> Release Results
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  {results.results.map((row) => (
                    <div key={row.attemptId} className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[80px_1fr_120px_120px] md:items-center">
                      <span className="text-2xl font-black">#{row.rank}</span>
                      <div>
                        <p className="font-black">{row.studentName || row.studentEmail || "Student"}</p>
                        <p className="text-sm text-[var(--muted-blue)]">{row.correct} correct / {row.wrong} wrong</p>
                      </div>
                      <span className="font-black">{row.score}/{row.totalMarks}</span>
                      <span className="font-black">{row.percentage}%</span>
                    </div>
                  ))}
                  {!results.results.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5">No submitted attempts yet.</p> : null}
                </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4" />
    </label>
  );
}

function ResultReleasePanel({ payload }: { payload: ResultsPayload }) {
  const summary = payload.summary ?? {
    assignedStudents: payload.results.length,
    submitted: payload.results.length,
    pending: 0,
    averageScore: payload.results.length ? Math.round(payload.results.reduce((sum, row) => sum + row.score, 0) / payload.results.length) : 0,
    highestScore: payload.results.length ? Math.max(...payload.results.map((row) => row.score)) : 0,
    lowestScore: payload.results.length ? Math.min(...payload.results.map((row) => row.score)) : 0,
    totalMarks: payload.results[0]?.totalMarks ?? 0,
    releaseReady: payload.results.length > 0,
  };
  const tone = payload.released
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : summary.releaseReady
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Result release audit</p>
          <h4 className="mt-1 text-lg font-black">{payload.released ? "Official result published" : summary.releaseReady ? "Ready for faculty release" : "Waiting for submissions"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Release unlocks score, rank, solved paper, answer key and explanations for students.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{payload.released ? "Released" : "Locked"}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Submitted" value={`${summary.submitted}/${summary.assignedStudents || summary.submitted}`} />
        <MiniFact label="Pending" value={summary.pending} />
        <MiniFact label="Average" value={`${summary.averageScore}/${summary.totalMarks || "-"}`} />
        <MiniFact label="Top Score" value={`${summary.highestScore}/${summary.totalMarks || "-"}`} />
      </div>
    </section>
  );
}

function VisualFidelityPanel({ report, compact = false }: { report: VisualFidelityReport; compact?: boolean }) {
  const tone = report.confidence === "HIGH"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : report.confidence === "MEDIUM"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <div className={`rounded-2xl border p-4 ${tone} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Visual fidelity</p>
          <h4 className="mt-1 text-lg font-black">{report.sourcePreviewAvailable ? "Source preview attached" : "Source preview not attached"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Diagrams, tables, graphs and formula-heavy questions are checked before publish.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{report.confidence} confidence</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Visual" value={report.visualQuestionCount} />
        <MiniFact label="Tables" value={report.tableQuestionCount} />
        <MiniFact label="Graphs" value={report.graphQuestionCount} />
        <MiniFact label="Formula" value={report.formulaQuestionCount} />
      </div>
      {report.questionsNeedingReview.length ? (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
          Review question(s): {report.questionsNeedingReview.slice(0, compact ? 12 : 24).join(", ")}
          {report.questionsNeedingReview.length > (compact ? 12 : 24) ? "..." : ""}
        </p>
      ) : null}
      {[...report.blockers, ...report.warnings].length ? (
        <ul className="mt-3 grid gap-1 text-xs font-bold leading-5">
          {[...report.blockers, ...report.warnings].slice(0, compact ? 4 : 8).map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-bold opacity-75">No visual fidelity risk detected in the extracted questions.</p>
      )}
    </div>
  );
}

function QuestionFidelityNotice({ signal }: { signal?: PaperUnderstandingReport["questionSignals"][number] }) {
  if (!signal || !signal.notes.length) return null;
  const tone = signal.confidence === "LOW" ? "border-amber-300 bg-amber-50 text-amber-950" : "border-blue-200 bg-blue-50 text-blue-950";
  return (
    <div className={`mt-4 rounded-2xl border p-4 text-sm ${tone}`}>
      <p className="font-black">Faculty visual review needed</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {signal.notes.map((note) => (
          <span key={note} className="rounded-full border border-current/10 bg-white/75 px-3 py-1 text-xs font-black">{note}</span>
        ))}
      </div>
    </div>
  );
}

function VisualSourcePreviewPanel({
  uploads,
  report,
  activeIndex,
  assets = [],
  attachedImage,
  onAttachVisual,
}: {
  uploads: ExamUploadRecord[];
  report: PaperUnderstandingReport;
  activeIndex: number;
  assets?: QuestionVisualAsset[];
  attachedImage?: string;
  onAttachVisual?: (dataUrl: string) => void;
}) {
  const source = uploads.find((upload) => upload.sourceKind === "QUESTION_PAPER") ?? uploads[0];
  const sourceUrl = source?.localPreviewUrl || source?.signedUrl || source?.cloudinaryUrl || "";
  const fileType = source?.fileType || "";
  const fileName = (source?.originalName || source?.fileName || "").toLowerCase();
  const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
  const isImage = fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const signal = report.questionSignals[activeIndex];
  const [cropMessage, setCropMessage] = useState("");

  async function attachRegion(asset: QuestionVisualAsset, region: VisualCropRegion) {
    if (!onAttachVisual) return;
    setCropMessage("");
    try {
      const dataUrl = await cropVisualAsset(asset.dataUrl, region);
      onAttachVisual(dataUrl);
      setCropMessage(`${cropRegionLabel(region)} region attached to Question ${activeIndex + 1}.`);
    } catch (error) {
      setCropMessage(error instanceof Error ? error.message : "Unable to attach cropped visual.");
    }
  }

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100dvh-22rem)] xl:min-h-[24rem] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Original source</p>
          <h4 className="mt-1 text-sm font-black">{source?.originalName || source?.fileName || "No question paper source"}</h4>
        </div>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
            Open
          </a>
        ) : null}
      </div>
      <div className="mt-3 min-h-[22rem] overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        {sourceUrl && isPdf ? (
          <iframe src={sourceUrl} title="Original question paper preview" className="h-[28rem] w-full" />
        ) : sourceUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sourceUrl} alt="Original question paper preview" className="h-auto min-h-[22rem] w-full object-contain" />
        ) : sourceUrl ? (
          <div className="grid min-h-[22rem] place-items-center p-5 text-center text-sm font-bold text-[var(--muted-blue)]">
            This source file is preserved. Open it in a new tab to compare the original layout.
          </div>
        ) : (
          <div className="grid min-h-[22rem] place-items-center p-5 text-center text-sm font-bold text-[var(--muted-blue)]">
            Upload a question paper PDF or image to compare diagrams, tables and graphs beside this preview.
          </div>
        )}
      </div>
      {signal?.notes.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          <p className="font-black">Question {signal.number} source check</p>
          <p className="mt-1">{signal.notes.join(" / ")}</p>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-950">
          This question has no detected visual dependency.
        </p>
      )}
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Question visual assets</p>
          <span className="rounded-full bg-[var(--page-bg)] px-2 py-1 text-[10px] font-black text-[var(--muted-blue)]">{assets.length} ready</span>
        </div>
        {assets.length ? (
          <div className="mt-3 grid gap-2">
            {assets.slice(0, 12).map((asset) => (
              <div
                key={asset.id}
                className={`grid gap-2 rounded-lg border p-2 text-left transition ${attachedImage === asset.dataUrl ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)] bg-white"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.dataUrl} alt="" className="h-28 w-full rounded border border-[var(--border)] object-contain" />
                <span className="text-xs font-black">{asset.label} / {asset.fileName}</span>
                <div className="grid grid-cols-4 gap-1">
                  {(["FULL", "TOP", "MIDDLE", "BOTTOM"] as VisualCropRegion[]).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => void attachRegion(asset, region)}
                      className="min-h-8 rounded border border-[var(--border)] bg-[var(--page-bg)] px-2 text-[10px] font-black text-[var(--ink)] transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                    >
                      {cropRegionLabel(region)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs font-bold leading-5 text-[var(--muted-blue)]">
            Upload a PDF or image question paper to create attachable page snapshots for diagram questions.
          </p>
        )}
        {cropMessage ? <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] p-2 text-xs font-black text-[var(--muted-blue)]">{cropMessage}</p> : null}
      </div>
    </aside>
  );
}

function SourceFilesPanel({ uploads, compact = false }: { uploads: ExamUploadRecord[]; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-4 ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Preserved source files</p>
          <h4 className="mt-1 text-lg font-black text-emerald-950">{uploads.length} original file{uploads.length === 1 ? "" : "s"} saved</h4>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800">Exam audit ready</span>
      </div>
      <div className="mt-3 grid gap-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="rounded-xl border border-emerald-100 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-slate-950">{upload.originalName || upload.fileName}</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{String(upload.sourceKind).replace(/_/g, " ")} / {Math.max(1, Math.round(upload.fileSize / 1024))} KB / {upload.extractionStatus || "UPLOADED"}</p>
              </div>
              {upload.localPreviewUrl || upload.signedUrl || upload.cloudinaryUrl ? (
                <a href={upload.localPreviewUrl || upload.signedUrl || upload.cloudinaryUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                  Open source
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaperUnderstandingPanel({ report, compact = false }: { report: PaperUnderstandingReport; compact?: boolean }) {
  const tone = report.confidence === "HIGH"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : report.confidence === "MEDIUM"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <div className={`rounded-2xl border p-4 ${tone} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Paper understanding</p>
          <h4 className="mt-1 text-lg font-black">{report.inferredExamType} / {report.inferredSubject}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">{report.inferredTopic} / {report.solutionMode.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{report.confidence} confidence</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Sections" value={report.sections.length} />
        <MiniFact label="Answers" value={`${report.answerKey.entries}/${report.answerKey.entries + report.answerKey.missing.length}`} />
        <MiniFact label="Marks/Q" value={report.markingScheme.marksPerQuestion} />
        <MiniFact label="Negative" value={report.markingScheme.negativeMarks} />
      </div>
      {report.riskSignals.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.riskSignals.map((risk) => (
            <span key={risk.type} className="rounded-full border border-current/10 bg-white/75 px-3 py-1 text-xs font-black">
              {risk.type.replace(/_/g, " ")}: {risk.count}
            </span>
          ))}
        </div>
      ) : null}
      {[...report.blockers, ...report.warnings].length ? (
        <ul className="mt-3 grid gap-1 text-xs font-bold leading-5">
          {[...report.blockers, ...report.warnings].slice(0, compact ? 4 : 8).map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-bold opacity-75">No paper-structure issues detected. Still review the student preview before publishing.</p>
      )}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-current/10 bg-white/75 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function ExtractionAuditPanel({ reports, manualReview, onManualReviewChange, compact = false }: { reports: ExtractionReport[]; manualReview: boolean; onManualReviewChange: (value: boolean) => void; compact?: boolean }) {
  const hasBlocker = reports.some((report) => report.status === "BLOCKED");
  return (
    <div className={`rounded-2xl border p-4 ${hasBlocker ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.24em] ${hasBlocker ? "text-amber-800" : "text-blue-800"}`}>Paper digitizing check</p>
          <h4 className="mt-1 text-lg font-black">{hasBlocker ? "Manual review required" : "Review recommended"}</h4>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">PDF text extraction cannot preserve diagrams, formula layout, charts or scanned images. Check the extracted questions before publishing.</p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">
          <input type="checkbox" checked={manualReview} onChange={(event) => onManualReviewChange(event.target.checked)} />
          Manual review completed
        </label>
      </div>
      <div className="mt-3 grid gap-2">
        {reports.map((report) => (
          <div key={`${report.sourceKind}-${report.fileName}`} className="rounded-xl border border-white/80 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black">{report.fileName}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${report.status === "BLOCKED" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}>{report.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{report.detectedQuestions} detected item(s) / {report.textCharacters} text characters</p>
            {[...report.blockers, ...report.warnings].length ? (
              <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-slate-700">
                {[...report.blockers, ...report.warnings].map((item) => <li key={item}>- {item}</li>)}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseTimeValue(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return { hour: "", minute: "", meridiem: "AM" as const };
  const [hourRaw, minuteRaw] = value.split(":");
  const hour24 = Number(hourRaw);
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12).padStart(2, "0"), minute: minuteRaw, meridiem: meridiem as "AM" | "PM" };
}

function buildTimeValue(hour: string, minute: string, meridiem: "AM" | "PM") {
  if (!hour || !minute) return "";
  const hourNumber = Math.min(12, Math.max(1, Number(hour) || 0));
  const minuteNumber = Math.min(59, Math.max(0, Number(minute) || 0));
  let hour24 = hourNumber;
  if (meridiem === "AM" && hour24 === 12) hour24 = 0;
  if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minuteNumber).padStart(2, "0")}`;
}

function displayTimeValue(value: string) {
  const parsed = parseTimeValue(value);
  if (!parsed.hour || !parsed.minute) return "Select exam start time";
  return `${parsed.hour}:${parsed.minute} ${parsed.meridiem}`;
}

function TimePickerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parseTimeValue(value);
  const [draft, setDraft] = useState(parsed);

  useEffect(() => {
    setDraft(parseTimeValue(value));
  }, [value]);

  function update(next: Partial<typeof draft>) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    if (merged.hour && merged.minute) {
      onChange(buildTimeValue(merged.hour, merged.minute, merged.meridiem));
    } else if (!merged.hour && !merged.minute) {
      onChange("");
    }
  }

  function updateNumber(kind: "hour" | "minute", rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 2);
    if (!digits) {
      update({ [kind]: "" });
      return;
    }
    const max = kind === "hour" ? 12 : 59;
    const min = kind === "hour" ? 1 : 0;
    const bounded = Math.min(max, Math.max(min, Number(digits)));
    update({ [kind]: String(bounded) });
  }

  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-2xl border border-[var(--border)] bg-white p-2">
        <input
          inputMode="numeric"
          value={draft.hour}
          onChange={(event) => updateNumber("hour", event.target.value)}
          placeholder="HH"
          className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-center font-black outline-none focus:border-[var(--ink)]"
        />
        <span className="font-black text-[var(--muted-blue)]">:</span>
        <input
          inputMode="numeric"
          value={draft.minute}
          onChange={(event) => updateNumber("minute", event.target.value)}
          placeholder="MM"
          className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-center font-black outline-none focus:border-[var(--ink)]"
        />
        <div className="grid grid-cols-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-1">
          {(["AM", "PM"] as const).map((meridiem) => (
            <button
              key={meridiem}
              type="button"
              onClick={() => update({ meridiem })}
              className={`rounded-lg px-3 py-2 text-xs font-black transition ${draft.meridiem === meridiem ? "bg-[var(--ink)] text-white" : "text-[var(--ink)] hover:bg-white"}`}
            >
              {meridiem}
            </button>
          ))}
        </div>
      </div>
      <span className="text-xs font-bold text-[var(--muted-blue)]">{displayTimeValue(value)}</span>
    </label>
  );
}

function ExamInputCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--page-bg)]">
          <FileText size={18} />
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FileUploadRow({ label, fileName, accept, onChange }: { label: string; fileName: string; accept: string; onChange: (file: File | null) => void }) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-white p-3">
      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-black transition hover:border-slate-950">
        <span>{label}</span>
        <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs">Choose File</span>
        <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      <div className="mt-2 flex min-h-7 items-center justify-between gap-2 text-xs">
        <span className="truncate font-black text-[var(--ink)]">{fileName || "No document selected"}</span>
        {fileName ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-700">Attached</span> : null}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
