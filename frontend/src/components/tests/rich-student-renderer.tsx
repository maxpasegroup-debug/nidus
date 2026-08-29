"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Expand, FileText, ImageIcon, Maximize2, Minus, Plus, X } from "lucide-react";
import { NidusMathText, NidusRichSegments, type NidusRichSegment } from "@/components/exam/nidus-math-renderer";
import type { Question } from "@/types/test";

type SourceReference = {
  page?: number;
  coordinates?: { x?: number; y?: number; width?: number; height?: number };
};

type RichBlock = {
  id?: string;
  type?: string;
  text?: string;
  latex?: string;
  displayMode?: boolean;
  url?: string;
  alt?: string;
  caption?: string;
  description?: string;
  graphType?: string;
  rows?: string[][];
  labels?: string[];
  options?: Array<{ key?: string; text?: string; latex?: string; segments?: NidusRichSegment[] }>;
  sourceReference?: SourceReference;
  confidence?: number;
  segments?: NidusRichSegment[];
};

type RichContent = {
  questionType?: string;
  blocks?: RichBlock[];
  metadata?: Record<string, unknown>;
};

type StudentOption = {
  key: string;
  text: string;
  latex?: string;
  segments?: NidusRichSegment[];
};

const legacyOptions = ["A", "B", "C", "D"] as const;

function contentRecord(value: unknown): RichContent {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RichContent : {};
}

function richBlocks(content: RichContent) {
  return Array.isArray(content.blocks) ? content.blocks.filter((block) => block && typeof block === "object") : [];
}

function optionBlocks(question: Question, content: RichContent): StudentOption[] {
  const richOptions = richBlocks(content).find((block) => block.type === "options")?.options;
  if (Array.isArray(richOptions) && richOptions.length) {
    return richOptions.map((option) => ({
      key: String(option.key || "").toUpperCase(),
      text: String(option.text || ""),
      latex: option.latex,
      segments: option.segments
    })).filter((option) => option.key);
  }
  return legacyOptions.map((key) => ({
    key,
    text: String(question[`option${key}` as keyof Question] || ""),
    latex: undefined
  }));
}

function questionType(content: RichContent) {
  const metadataType = typeof content.metadata?.originalQuestionType === "string" ? content.metadata.originalQuestionType : "";
  return String(metadataType || content.questionType || "SINGLE_CHOICE").toUpperCase();
}

function isMultiple(type: string) {
  return type === "MULTIPLE_ANSWER" || type === "MULTIPLE_CORRECT_MCQ";
}

function isTextAnswer(type: string) {
  return ["NUMERICAL", "NUMERICAL_ANSWER", "INTEGER_TYPE", "FILL_BLANK", "DESCRIPTIVE", "PROGRAMMING", "FILE_UPLOAD", "DRAWING", "VOICE_RESPONSE"].includes(type);
}

function selectionSet(value?: string) {
  return new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean));
}

function toggleMulti(selected: string | undefined, key: string) {
  const values = selectionSet(selected);
  if (values.has(key)) values.delete(key);
  else values.add(key);
  return Array.from(values).sort().join(",");
}

function copyLatex(latex?: string) {
  if (!latex || typeof navigator === "undefined") return;
  void navigator.clipboard?.writeText(latex);
}

function AssetViewer({ url, alt, caption }: { url: string; alt?: string; caption?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  return (
    <>
      <figure className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-2">
        <div className="flex items-center justify-between gap-2 border-b border-[#071d36]/10 pb-2">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">
            <ImageIcon size={14} /> Visual
          </span>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-2 rounded border border-[#071d36]/10 px-3 text-xs font-black text-[#071d36]">
            <Expand size={14} /> Open
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt || caption || "Question visual"} className="mt-3 max-h-[420px] w-auto max-w-full rounded object-contain" loading="lazy" />
        {caption ? <figcaption className="mt-2 text-sm font-semibold text-[#64748b]">{caption}</figcaption> : null}
      </figure>
      {open ? (
        <div className="fixed inset-0 z-50 grid bg-[#071d36]/90 p-4 text-white" role="dialog" aria-modal="true">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e0bd65]">High Resolution Viewer</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} className="grid h-10 w-10 place-items-center rounded border border-white/20 bg-white/10" aria-label="Zoom out"><Minus size={16} /></button>
              <button type="button" onClick={() => setZoom((value) => Math.min(4, value + 0.25))} className="grid h-10 w-10 place-items-center rounded border border-white/20 bg-white/10" aria-label="Zoom in"><Plus size={16} /></button>
              <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="grid h-10 w-10 place-items-center rounded border border-white/20 bg-white/10" aria-label="Fullscreen"><Maximize2 size={16} /></button>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded border border-white/20 bg-white/10" aria-label="Close"><X size={16} /></button>
            </div>
          </div>
          <div className="overflow-auto rounded-lg border border-white/15 bg-white/5 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt || caption || "Question visual"} style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }} className="max-w-none rounded bg-white" />
          </div>
        </div>
      ) : null}
    </>
  );
}

function RenderBlock({ block }: { block: RichBlock }) {
  const key = block.id || `${block.type}-${block.text || block.url || ""}`;
  if (block.type === "paragraph") return <p key={key} className="text-lg font-semibold leading-8 text-[#071d36]">{block.segments?.length ? <NidusRichSegments segments={block.segments} /> : <NidusMathText text={block.text} />}</p>;
  if (block.type === "formula") {
    const latex = block.latex || block.text || "";
    return (
      <div key={key} className="rounded-lg border border-[#d9c79d] bg-[#fffdf8] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6426]">Formula</span>
          {block.latex ? (
            <button type="button" onClick={() => copyLatex(block.latex)} className="inline-flex min-h-8 items-center gap-2 rounded border border-[#071d36]/10 px-3 text-xs font-black text-[#071d36]">
              <Copy size={13} /> LaTeX
            </button>
          ) : null}
        </div>
        <div className="mt-2 overflow-x-auto text-lg">
          <NidusMathText text={block.latex ? (block.displayMode ? `$$${latex}$$` : `$${latex}$`) : latex} />
        </div>
      </div>
    );
  }
  if (block.type === "image" && block.url) return <AssetViewer key={key} url={block.url} alt={block.alt} caption={block.caption} />;
  if (block.type === "diagram" || block.type === "graph") {
    return (
      <div key={key} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
        <p className="font-black">{block.type === "graph" ? "Graph" : "Diagram"}</p>
        {block.url ? <AssetViewer url={block.url} alt={block.description} caption={block.caption} /> : <p className="mt-1">{block.description}</p>}
        {block.labels?.length ? <p className="mt-2 text-xs">Labels: {block.labels.join(", ")}</p> : null}
      </div>
    );
  }
  if (block.type === "table" && Array.isArray(block.rows)) {
    return (
      <div key={key} className="overflow-x-auto rounded-lg border border-[#071d36]/10">
        <table className="min-w-full border-collapse bg-white text-sm">
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-[#071d36]/10 px-3 py-2 align-top">
                    <NidusMathText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

export function RichStudentQuestionRenderer({
  question,
  selectedAnswer,
  onSelect,
  fallbackVisualNotes = []
}: {
  question: Question;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  fallbackVisualNotes?: string[];
}) {
  const content = useMemo(() => contentRecord(question.contentJson), [question.contentJson]);
  const blocks = useMemo(() => richBlocks(content).filter((block) => block.type !== "options" && block.type !== "explanation"), [content]);
  const options = useMemo(() => optionBlocks(question, content), [content, question]);
  const type = questionType(content);
  const selectedValues = selectionSet(selectedAnswer);
  const hasRichPackage = question.renderMode === "NDIE_RICH_V1" || typeof content.metadata?.ndiePackageId === "string";

  return (
    <section className="space-y-5" aria-label="Question content">
      <div className="flex flex-wrap gap-2">
        <span className="rounded border border-[#b9913f]/35 bg-[#fff7de] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#8a6426]">{type.replaceAll("_", " ")}</span>
        {hasRichPackage ? <span className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">Teacher approved rich paper</span> : null}
        {question.aiConfidence !== null && question.aiConfidence !== undefined ? <span className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-xs font-black text-[#64748b]">Confidence {Math.round(question.aiConfidence * 100)}%</span> : null}
      </div>

      <div className="grid gap-4 text-[#071d36]">
        {blocks.length ? blocks.map((block) => <RenderBlock key={block.id || `${block.type}-${block.text || block.url}`} block={block} />) : (
          <>
            <p className="text-lg font-semibold leading-8"><NidusMathText text={question.questionText} /></p>
            {question.questionImage ? <AssetViewer url={question.questionImage} alt="Question visual" /> : null}
          </>
        )}
      </div>

      {fallbackVisualNotes.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          <p className="font-black">Read the question exactly as approved.</p>
          <p className="mt-1">{fallbackVisualNotes.join(" / ")}</p>
        </div>
      ) : null}

      {isTextAnswer(type) ? (
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#071d36]">Your answer</span>
          <textarea
            value={selectedAnswer || ""}
            onChange={(event) => onSelect(event.target.value)}
            className="min-h-28 rounded-lg border border-[#071d36]/15 bg-[#fffdf8] p-3 text-base font-semibold text-[#071d36] outline-none focus:border-[#b9913f]"
            placeholder={type === "NUMERICAL" || type === "NUMERICAL_ANSWER" || type === "INTEGER_TYPE" ? "Enter numerical answer" : "Type your response"}
            aria-label="Answer input"
          />
        </label>
      ) : (
        <div className="grid gap-3" role={isMultiple(type) ? "group" : "radiogroup"} aria-label="Answer options">
          {options.map((option) => {
            const selected = isMultiple(type) ? selectedValues.has(option.key) : selectedAnswer === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect(isMultiple(type) ? toggleMulti(selectedAnswer, option.key) : option.key)}
                className={`flex min-h-14 items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#b9913f] ${
                  selected
                    ? "border-[#b9913f] bg-[#fff7de] text-[#071d36]"
                    : "border-[#071d36]/10 bg-[#fffdf8] text-[#071d36] hover:border-[#b9913f]/50"
                }`}
                aria-pressed={selected}
              >
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded border text-xs font-black ${selected ? "border-[#b9913f] bg-[#071d36] text-white" : "border-[#071d36]/20 bg-white text-[#071d36]"}`}>
                  {selected ? <Check size={14} /> : option.key}
                </span>
                <span className="leading-6">
                  {option.segments?.length ? <NidusRichSegments segments={option.segments} /> : option.latex ? <NidusMathText text={`$${option.latex}$`} /> : <NidusMathText text={option.text} />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-3 text-xs font-semibold leading-5 text-[#64748b]">
        <p className="inline-flex items-center gap-2 font-black text-[#071d36]"><FileText size={14} /> Delivery integrity</p>
        <p className="mt-1">This question is rendered from the teacher-approved exam package. Original document references stay linked for audit and result review.</p>
      </div>
    </section>
  );
}
