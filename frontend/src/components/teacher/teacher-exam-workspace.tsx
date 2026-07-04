"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, Clock3, Eye, FileText, Pencil, Plus, Send, Trash2, Trophy, X } from "lucide-react";

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
  exams: TeacherExamRecord[];
  loading?: boolean;
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

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error((await response.text().catch(() => "")) || `Request failed: ${response.status}`);
  return unwrap<T>(await response.json());
}

function parseNumberedBlocks(text: string) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [];
  const parts = normalized.split(/\n(?=\s*\d+[\).]\s+)/g);
  return parts.map((part) => part.trim()).filter(Boolean);
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

function stripNumber(line: string) {
  return line.replace(/^\s*\d+[\).]\s*/, "").trim();
}

function parseAnswerMap(text: string) {
  const map = new Map<number, string>();
  text.split(/\n+/).forEach((line) => {
    const match = line.match(/^\s*(\d+)\D+([A-D])\b/i);
    if (match) map.set(Number(match[1]), match[2].toUpperCase());
  });
  return map;
}

function parseExplanationMap(text: string) {
  const map = new Map<number, string>();
  parseNumberedBlocks(text).forEach((block, index) => {
    const number = Number(block.match(/^\s*(\d+)/)?.[1] || index + 1);
    map.set(number, stripNumber(block));
  });
  return map;
}

function buildQuestions(source: string, answerKey: string, explanations: string, topic: string, totalMarks: number): QuestionDraft[] {
  const answerMap = parseAnswerMap(answerKey);
  const explanationMap = parseExplanationMap(explanations);
  const blocks = parseNumberedBlocks(source);
  const perQuestionMarks = Math.max(1, Math.round((Number.isFinite(totalMarks) ? totalMarks : 100) / Math.max(1, blocks.length)));

  return blocks.map((block, index) => {
    const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const number = Number(lines[0]?.match(/^\s*(\d+)/)?.[1] || index + 1);
    const optionLines = lines.filter((line) => /^[A-D][\).]\s+/i.test(line));
    const questionLines = lines.filter((line) => !/^[A-D][\).]\s+/i.test(line));
    const options = optionLines.map((line) => line.replace(/^[A-D][\).]\s+/i, "").trim());
    return {
      questionText: stripNumber(questionLines.join(" ")),
      optionA: options[0] || "Option A",
      optionB: options[1] || "Option B",
      optionC: options[2] || "Option C",
      optionD: options[3] || "Option D",
      correctAnswer: answerMap.get(number) || "A",
      explanation: explanationMap.get(number) || "Explanation will be reviewed by faculty.",
      marks: perQuestionMarks,
      negativeMarks: 0,
      difficultyLevel: "MEDIUM",
      topic: topic || "General",
    };
  }).filter((question) => question.questionText);
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

export function TeacherExamWorkspace({ batches, selectedBatchId, exams, loading, onSelectBatch, onRefresh }: Props) {
  const [activeBatchId, setActiveBatchId] = useState(selectedBatchId || batches[0]?.id || "");
  const activeBatch = useMemo(() => batches.find((batch) => batch.id === activeBatchId) || batches[0] || null, [activeBatchId, batches]);
  const [targetBatchIds, setTargetBatchIds] = useState<string[]>(activeBatch?.id ? [activeBatch.id] : []);
  const [subject, setSubject] = useState(activeBatch?.subjects[0] || "General");
  const [showCreator, setShowCreator] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [questionSource, setQuestionSource] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [explanations, setExplanations] = useState("");
  const [uploadedQuestionPaper, setUploadedQuestionPaper] = useState("");
  const [uploadedAnswerKey, setUploadedAnswerKey] = useState("");
  const [uploadedExplanations, setUploadedExplanations] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultsExam, setResultsExam] = useState<TeacherExamRecord | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [editingExam, setEditingExam] = useState<TeacherExamRecord | null>(null);

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

  const batchExams = useMemo(() => {
    if (!activeBatch) return [];
    return exams.filter((exam) => exam.batchId === activeBatch.id || exam.batchName === activeBatch.name);
  }, [activeBatch, exams]);
  const liveExamCount = batchExams.filter((exam) => !["ARCHIVED", "CANCELLED"].includes(String(exam.status || "").toUpperCase())).length;
  const submittedCount = batchExams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? 0), 0);

  const questions = useMemo(() => buildQuestions(questionSource, answerKey, explanations, form.topic, Number(form.marks)), [answerKey, explanations, form.marks, form.topic, questionSource]);

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
      if (!isTxt && !isDocx) {
        setMessage(`${file.name} is attached, but automatic extraction is available only for TXT and DOCX here. Paste the question text if this is a PDF or old DOC file.`);
        return;
      }
      const text = isDocx ? await extractDocxText(file) : await file.text().catch(() => "");
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
    setAnswerKey("");
    setExplanations("");
    setUploadedQuestionPaper("");
    setUploadedAnswerKey("");
    setUploadedExplanations("");
    setTargetBatchIds(activeBatch?.id ? [activeBatch.id] : []);
    setStep(1);
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
    setQuestionSource("");
    setAnswerKey("");
    setExplanations("");
    setUploadedQuestionPaper("");
    setUploadedAnswerKey("");
    setUploadedExplanations("");
    setStep(1);
    setMessage("");
    setShowCreator(true);
  }

  async function publishExam() {
    if (!activeBatch) return;
    const selectedBatches = (targetBatchIds.length ? targetBatchIds : [activeBatch.id])
      .map((id) => batches.find((batch) => batch.id === id))
      .filter((batch): batch is TeacherExamBatch => Boolean(batch));
    if (!selectedBatches.length) {
      setMessage("Select at least one assigned batch.");
      return;
    }
    if (!editingExam && !questions.length) {
      setMessage("Add at least one question before publishing.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (editingExam) {
        await requestJson(`/api/academy/exams/${editingExam.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            subject,
            title: form.title,
            topic: form.topic,
            durationMinutes: Number(form.duration),
            difficulty: editingExam.difficulty || "MEDIUM",
            instructions: form.instructions,
            status: editingExam.status || "PUBLISHED",
          }),
        });
        setShowCreator(false);
        setEditingExam(null);
        await onRefresh();
        return;
      }
      await Promise.all(selectedBatches.map((targetBatch) =>
        requestJson("/api/academy/exams", {
          method: "POST",
          body: JSON.stringify({
            batchId: targetBatch.id,
            batchName: targetBatch.name,
            course: targetBatch.program,
            subject,
            title: form.title,
            topic: form.topic,
            questionCount: questions.length,
            durationMinutes: Number(form.duration),
            difficulty: "MEDIUM",
            instructions: [
              form.instructions,
              selectedBatches.length > 1 ? `Common exam published to: ${selectedBatches.map((batch) => batch.name).join(", ")}` : "",
            ].filter(Boolean).join("\n"),
            publishDate: form.date,
            publishTime: form.time,
            draft: {
              title: form.title,
              description: form.instructions || `Faculty published ${subject} exam for ${targetBatch.name}.`,
              examType: "Teacher Exam",
              category: "Defence LMS",
              subject,
              topic: form.topic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions,
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
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose a class, add questions, answer key and explanations, preview once, then publish to students.</p>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-3">
          <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-slate-950 bg-white shadow-2xl sm:rounded-3xl">
            <div className="shrink-0 border-b border-[var(--border)] p-4 sm:p-5">
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
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
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
                  <Field label="Exam Name" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <Field label="Topic" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} placeholder="Algebra, Constitution, Motion..." />
                  <Field label="Date" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
                  <Field label="Time" type="time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
                  <Field label="Duration" type="number" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} />
                  <Field label="Marks" type="number" value={form.marks} onChange={(value) => setForm((current) => ({ ...current, marks: value }))} />
                </div>
              ) : null}

              {step === 2 && !editingExam ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <ExamInputCard title="Questions" description="Paste questions or upload a DOCX/TXT paper. PDF and old DOC can be attached, but paste the extracted text before publishing.">
                    <textarea value={questionSource} onChange={(event) => setQuestionSource(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1. Question...\nA. Option\nB. Option\nC. Option\nD. Option"} />
                    <FileUploadRow
                      label="Upload question paper"
                      fileName={uploadedQuestionPaper}
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={(file) => void appendFileText(file, setQuestionSource, questionSource, setUploadedQuestionPaper)}
                    />
                  </ExamInputCard>
                  <ExamInputCard title="Answer Key" description="One line per answer. Example: 1 - A">
                    <textarea value={answerKey} onChange={(event) => setAnswerKey(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1 - A\n2 - C\n3 - B"} />
                    <FileUploadRow
                      label="Upload answer key"
                      fileName={uploadedAnswerKey}
                      accept=".txt,.docx"
                      onChange={(file) => void appendFileText(file, setAnswerKey, answerKey, setUploadedAnswerKey)}
                    />
                  </ExamInputCard>
                  <ExamInputCard title="Explanations" description="These become the final student report after release.">
                    <textarea value={explanations} onChange={(event) => setExplanations(event.target.value)} rows={12} className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-6" placeholder={"1. Explanation...\n2. Explanation..."} />
                    <FileUploadRow
                      label="Upload explanations"
                      fileName={uploadedExplanations}
                      accept=".txt,.docx"
                      onChange={(file) => void appendFileText(file, setExplanations, explanations, setUploadedExplanations)}
                    />
                  </ExamInputCard>
                </div>
              ) : null}

              {step === 2 && editingExam ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <h4 className="text-xl font-black">Question paper already exists</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                    This edit updates the title, subject, topic and timer. Create a fresh exam if the full question paper must be replaced.
                  </p>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <p className="font-black">{questions.length} questions / {form.marks} marks / {form.duration} minutes</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{subject} - {form.topic || "General"}</p>
                  </div>
                  <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-2">
                    {questions.map((question, index) => (
                      <div key={`${question.questionText}-${index}`} className="rounded-2xl border border-[var(--border)] p-4">
                        <p className="font-black">Q{index + 1}. {question.questionText}</p>
                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                          {["A", "B", "C", "D"].map((option) => (
                            <span key={option} className={`rounded-xl border px-3 py-2 ${question.correctAnswer === option ? "border-emerald-500 bg-emerald-50 font-black" : "border-[var(--border)]"}`}>
                              {option}. {optionText(question, option as "A" | "B" | "C" | "D")}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--muted-blue)]">Explanation: {question.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Summary label="Batches" value={String((targetBatchIds.length ? targetBatchIds : activeBatch?.id ? [activeBatch.id] : []).length)} />
                    <Summary label="Subject" value={subject} />
                    <Summary label="Questions" value={String(editingExam?.questionCount ?? questions.length)} />
                    <Summary label="Timer" value={`${form.duration} min`} />
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[var(--muted-blue)]">Publish sends this exam to students in this batch. Student result reports stay hidden until you review and release results.</p>
                </div>
              ) : null}

              {message ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-700">{message}</p> : null}
            </div>
            <div className="grid shrink-0 gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex sm:justify-between sm:p-5">
              <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="min-h-12 rounded-xl border border-[var(--border)] px-5 font-black">Back</button>
              {step < 4 ? (
                <button type="button" onClick={() => setStep((value) => Math.min(4, value + 1))} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-6 font-black text-white">Continue</button>
              ) : (
                <button type="button" onClick={() => void publishExam()} disabled={busy} className="min-h-12 rounded-xl border border-emerald-700 bg-emerald-700 px-6 font-black text-white disabled:opacity-60">
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
