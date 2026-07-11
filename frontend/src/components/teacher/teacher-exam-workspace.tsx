"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Pencil, Plus, Send, Trash2, Trophy, X } from "lucide-react";

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
};

type QuestionDraft = {
  questionText: string;
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

type ResultsPayload = {
  exam: TeacherExamRecord;
  released: boolean;
  releasedAt?: string;
  results: ResultRow[];
};

type Props = {
  batches: TeacherExamBatch[];
  selectedBatchId?: string | null;
  selectedSubject?: string | null;
  exams: TeacherExamRecord[];
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

export function TeacherExamWorkspace({ batches, selectedBatchId, selectedSubject, exams, loading, autoOpenCreatorKey, onSelectBatch, onRefresh }: Props) {
  const [activeBatchId, setActiveBatchId] = useState(selectedBatchId || batches[0]?.id || "");
  const activeBatch = useMemo(() => batches.find((batch) => batch.id === activeBatchId) || batches[0] || null, [activeBatchId, batches]);
  const [targetBatchIds, setTargetBatchIds] = useState<string[]>(activeBatch?.id ? [activeBatch.id] : []);
  const [subject, setSubject] = useState(activeBatch?.subjects[0] || "General");
  const [showCreator, setShowCreator] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [questionSource, setQuestionSource] = useState("");
  const [answerGuide, setAnswerGuide] = useState("");
  const [uploadedQuestionPaper, setUploadedQuestionPaper] = useState("");
  const [uploadedAnswerGuide, setUploadedAnswerGuide] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultsExam, setResultsExam] = useState<TeacherExamRecord | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [editingExam, setEditingExam] = useState<TeacherExamRecord | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [handledAutoOpenKey, setHandledAutoOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBatchId && selectedBatchId !== activeBatchId) setActiveBatchId(selectedBatchId);
  }, [activeBatchId, selectedBatchId]);

  useEffect(() => {
    if (activeBatch?.id && !targetBatchIds.length) setTargetBatchIds([activeBatch.id]);
  }, [activeBatch?.id, targetBatchIds.length]);

  useEffect(() => {
    if (activeBatch?.subjects?.length && !activeBatch.subjects.includes(subject)) {
      setSubject(activeBatch.subjects[0]);
    }
  }, [activeBatch, subject]);

  useEffect(() => {
    if (selectedSubject && activeBatch?.subjects?.includes(selectedSubject) && subject !== selectedSubject) {
      setSubject(selectedSubject);
    }
  }, [activeBatch?.subjects, selectedSubject, subject]);

  const batchExams = useMemo(() => {
    if (!activeBatch) return [];
    return exams.filter((exam) => exam.batchId === activeBatch.id || exam.batchName === activeBatch.name);
  }, [activeBatch, exams]);
  const liveExamCount = batchExams.filter((exam) => !["ARCHIVED", "CANCELLED"].includes(String(exam.status || "").toUpperCase())).length;
  const submittedCount = batchExams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? 0), 0);

  const questions = useMemo(() => buildQuestions(questionSource, answerGuide, form.topic, Number(form.marks)), [answerGuide, form.marks, form.topic, questionSource]);
  const readiness = useMemo(() => paperReadiness(questions), [questions]);
  const canPublishPaper = questions.length > 0 && readiness.missingOptions === 0 && readiness.missingAnswers === 0;
  const questionsForPublish = useMemo(() => questions.map((question) => ({
    ...question,
    explanation: question.explanation && !/^Explanation will be reviewed/i.test(question.explanation)
      ? question.explanation
      : `The correct answer is option ${question.correctAnswer}. Review this answer against the uploaded faculty key and topic notes.`,
  })), [questions]);
  const duplicateQuestionIndexes = useMemo(() => new Set(readiness.duplicateQuestions.flatMap((item) => [item.firstIndex, item.index])), [readiness.duplicateQuestions]);
  const effectiveTopic = useMemo(() => inferExamTopic(questionSource, form.topic), [form.topic, questionSource]);
  const effectiveTitle = useMemo(() => form.title.trim() || inferExamTitle(questionSource, subject, activeBatch?.name), [activeBatch?.name, form.title, questionSource, subject]);

  useEffect(() => {
    if (!questionSource || !activeBatch?.subjects?.length) return;
    if (/mathematics|maths/i.test(questionSource) && activeBatch.subjects.includes("Mathematics") && subject !== "Mathematics") {
      setSubject("Mathematics");
    }
  }, [activeBatch?.subjects, questionSource, subject]);

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

  async function appendFileText(file: File | null, setter: (value: string) => void, current: string, setUploadedName?: (value: string) => void) {
    if (!file) return;
    setUploadedName?.(file.name);
    try {
      const fileName = file.name.toLowerCase();
      const isTxt = file.type.startsWith("text/") || fileName.endsWith(".txt");
      const isDocx = fileName.endsWith(".docx");
      const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";
      if (!isTxt && !isDocx && !isPdf) {
        setMessage(`${file.name} is attached, but only PDF, DOCX and TXT documents can be extracted.`);
        return;
      }
      const text = isDocx ? await extractDocxText(file) : isPdf ? await extractPdfText(file) : await file.text().catch(() => "");
      if (!text.trim()) {
        setMessage(`No readable text was found in ${file.name}.`);
        return;
      }
      setter([current, text].filter(Boolean).join("\n\n"));
      setMessage(isDocx ? `${file.name} extracted successfully. Review the questions before continuing.` : `${file.name} added successfully.`);
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
      setMessage(`Paper is incomplete: ${readiness.missingOptions} question(s) need options and ${readiness.missingAnswers} question(s) need answer keys before publishing.`);
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
            draft: canPublishPaper ? {
              title: effectiveTitle,
              subject,
              topic: effectiveTopic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions: questionsForPublish,
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
    <section className="grid gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Exams</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Create and publish an exam.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose a class, add questions plus answer explanations, preview once, then publish to students.</p>
            </div>
          </div>
          <button type="button" onClick={openCreator} disabled={!activeBatch} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50 sm:w-auto">
            <Plus size={18} /> New Exam
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{message}</div> : null}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">My Classes</p>
            <h3 className="mt-2 text-2xl font-black">Select batch</h3>
          </div>
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black">{batches.length} batch(es)</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {batches.map((batch) => (
            <button key={batch.id} type="button" onClick={() => openBatch(batch.id)} className={`rounded-2xl border p-4 text-left transition ${activeBatch?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white text-[var(--ink)] hover:-translate-y-0.5"}`}>
              <p className="text-lg font-black">{batch.name}</p>
              <p className="mt-2 text-sm opacity-80">{batch.studentCount} students</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] opacity-70">{batch.subjects.length} subjects</p>
            </button>
          ))}
        </div>
      </div>

      {activeBatch ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Batch Workspace</p>
              <h3 className="mt-2 text-2xl font-black">{activeBatch.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{activeBatch.studentCount} students will receive published exams.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[440px]">
              <Summary label="Live Exams" value={String(liveExamCount)} />
              <Summary label="Submitted" value={String(submittedCount)} />
              <label className="grid gap-2 text-sm font-black">
                Subject
                <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
                  {activeBatch.subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {loading ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">Loading exams...</p> : null}
            {!loading && !batchExams.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">No exams published for this batch yet.</p> : null}
            {batchExams.map((exam) => (
              <article key={exam.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ink)]">{statusLabel(exam.status)}</span>
                  <span className="text-xs font-black text-[var(--muted-blue)]">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : ""}</span>
                </div>
                <h4 className="mt-4 text-xl font-black">{exam.title || "Exam"}</h4>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">{exam.subject || subject} / {exam.topic || "Topic"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <span>{exam.questionCount ?? 0} Qs</span>
                  <span>{exam.durationMinutes ?? 0} min</span>
                  <span>{exam.attemptStats?.submitted ?? 0} done</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openEditor(exam)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-slate-950">
                    <Pencil size={16} /> Edit
                  </button>
                  <button type="button" onClick={() => void cancelExam(exam)} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-700 disabled:opacity-50">
                    <Trash2 size={16} /> Cancel
                  </button>
                  <button type="button" onClick={() => void publishChanges(exam)} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700 disabled:opacity-50">
                    <Send size={16} /> Publish
                  </button>
                  <button type="button" onClick={() => void openResults(exam)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-white px-3 text-sm font-black text-slate-950">
                    <Trophy size={16} /> Results
                  </button>
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
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Step {step} of 4</p>
              </div>
              <button type="button" onClick={() => setShowCreator(false)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)]">
                <X size={18} />
              </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["Exam details", "Upload paper", "Preview answers", "Publish"].map((label, index) => (
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
                    <p className="text-sm font-black">Publish To Batches</p>
                    <p className="mt-1 text-xs text-[var(--muted-blue)]">Select one or more assigned batches for a common exam.</p>
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
                      {Array.from(new Set(targetBatchIds.flatMap((id) => batches.find((batch) => batch.id === id)?.subjects ?? []).concat(activeBatch?.subjects ?? []))).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <Field label="Exam Name" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <Field label="Topic" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} placeholder="Algebra, Constitution, Motion..." />
                  <Field label="Date" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
                  <TimePickerField label="Time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
                  <Field label="Duration" type="number" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} />
                  <Field label="Marks" type="number" value={form.marks} onChange={(value) => setForm((current) => ({ ...current, marks: value }))} />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ExamInputCard title="Question Paper" description="Upload PDF, Word or TXT. NIDUS extracts numbered questions and A/B/C/D options for review.">
                    <textarea value={questionSource} onChange={(event) => setQuestionSource(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1. Question...\nA. Option\nB. Option\nC. Option\nD. Option"} />
                    <FileUploadRow
                      label="Upload question paper"
                      fileName={uploadedQuestionPaper}
                      accept=".txt,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(file) => void appendFileText(file, setQuestionSource, questionSource, setUploadedQuestionPaper)}
                    />
                  </ExamInputCard>
                  <ExamInputCard title="Answer Key + Explanations" description="Keep each answer and explanation together. Example: 1 - A Explanation: Sets common to both are 2 and 4.">
                    <textarea value={answerGuide} onChange={(event) => setAnswerGuide(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1 - A\nExplanation: Sets common to both are 2 and 4.\n\n2 - C\nExplanation: Substitute x = 4."} />
                    <FileUploadRow
                      label="Upload answer key + explanations"
                      fileName={uploadedAnswerGuide}
                      accept=".txt,.docx,.pdf"
                      onChange={(file) => void appendFileText(file, setAnswerGuide, answerGuide, setUploadedAnswerGuide)}
                    />
                  </ExamInputCard>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Student exam preview</p>
                    <h3 className="mt-2 text-2xl font-black">{effectiveTitle}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-white/10 px-3 py-2">{subject}</span>
                      <span className="rounded-full bg-white/10 px-3 py-2">{questionsForPublish.length} questions</span>
                      <span className="rounded-full bg-white/10 px-3 py-2">{form.marks} marks</span>
                      <span className="rounded-full bg-white/10 px-3 py-2"><Clock3 className="mr-1 inline h-4 w-4" />{form.duration} minutes</span>
                    </div>
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-sm font-black ${canPublishPaper ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                      {canPublishPaper
                        ? readiness.missingExplanations > 0
                          ? `Paper ready to publish. ${readiness.missingExplanations} explanation(s) will use the faculty-key fallback until edited.`
                          : "Paper ready: every question has four options, an answer key and an explanation."
                        : `${readiness.missingOptions} missing options / ${readiness.missingAnswers} missing answers / ${readiness.missingExplanations} missing explanations / ${readiness.duplicateQuestions.length} duplicates`}
                    </div>
                  </div>
                  <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-22rem)] lg:min-h-[24rem] lg:overflow-y-auto">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">Question palette</p>
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
                  <p className="mt-5 text-sm leading-6 text-[var(--muted-blue)]">Publish sends this exam to students. Students see only the question paper during the exam; after submission they receive score, correct answers, explanations and improvement feedback.</p>
                  {readiness.duplicateQuestions.length ? (
                    <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-800">
                      Fix {readiness.duplicateQuestions.length} duplicate question(s) before publishing. Question {readiness.duplicateQuestions[0].index + 1} repeats Question {readiness.duplicateQuestions[0].firstIndex + 1}.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {message ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-700">{message}</p> : null}
              </div>
            </div>
            <div className="grid shrink-0 gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex sm:justify-between sm:p-5">
              <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="min-h-12 rounded-xl border border-[var(--border)] px-5 font-black">Back</button>
              {step < 4 ? (
                <button type="button" onClick={goNextStep} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-6 font-black text-white">Continue</button>
              ) : (
                <button type="button" onClick={() => void publishExam()} disabled={busy || (!editingExam && !canPublishPaper)} className="min-h-12 rounded-xl border border-emerald-700 bg-emerald-700 px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? (editingExam ? "Saving..." : "Publishing...") : editingExam ? "Save Exam Changes" : "Publish To Students"}
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
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black">{results.results.length} submitted / {results.released ? "Released" : "Not released"}</p>
                  <button type="button" onClick={() => void releaseResults()} disabled={busy || results.released} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
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
    update({ [kind]: String(bounded).padStart(2, "0") });
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
