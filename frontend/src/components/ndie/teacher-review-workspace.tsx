"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, FileText, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { getApiErrorMessage } from "@/services/api";
import { getNdieReviewWorkspace, reviewNdieCandidate, validateNdieImport, type NdieQuestionCandidate } from "@/services/ndie";

function percent(value?: number | null) {
  if (typeof value !== "number") return "Not scored";
  return `${Math.round(value * 100)}%`;
}

function confidenceTone(value?: number | null) {
  if (typeof value !== "number") return "border-slate-200 bg-slate-50 text-slate-700";
  if (value >= 0.82) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value >= 0.45) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function blockText(candidate: NdieQuestionCandidate) {
  const blocks = candidate.candidateJson?.blocks ?? [];
  return blocks
    .map((block) => {
      if (typeof block.text === "string") return block.text;
      if (block.type === "OptionBlock" && Array.isArray(block.blocks)) {
        return `${block.key || ""}. ${block.blocks.map((item) => typeof item.text === "string" ? item.text : "").filter(Boolean).join(" ")}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function TeacherReviewWorkspace({ importId }: { importId: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const query = useQuery({
    queryKey: ["ndie", "review", importId],
    queryFn: () => getNdieReviewWorkspace(importId),
    enabled: Boolean(importId)
  });

  const workspace = query.data;
  const candidates = workspace?.questionCandidates ?? [];
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0] ?? null;
  const selectedText = selected ? blockText(selected) : "";
  const sourcePage = useMemo(() => {
    const pageNumber = Number(selected?.sourceMap?.firstPage || 1);
    return workspace?.pages.find((page) => page.pageNumber === pageNumber) ?? workspace?.pages[0] ?? null;
  }, [selected, workspace?.pages]);

  const validateMutation = useMutation({
    mutationFn: () => validateNdieImport(importId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED" | "NEEDS_EDIT") => {
      if (!selected) throw new Error("Select a question candidate first");
      return reviewNdieCandidate(selected.id, { decision, notes: notes.trim() || undefined });
    },
    onSuccess: () => {
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] });
    }
  });

  if (!importId) {
    return <EmptyReview message="Open this page with ?importId=NDIE_IMPORT_ID to review a processed paper." />;
  }

  if (query.isLoading) return <EmptyReview message="Loading NDIE review workspace..." />;
  if (query.isError) return <EmptyReview message={getApiErrorMessage(query.error)} />;
  if (!workspace) return <EmptyReview message="NDIE import not found." />;

  const errorMessage = validateMutation.error || reviewMutation.error ? getApiErrorMessage(validateMutation.error || reviewMutation.error) : "";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">NDIE Teacher Review</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Review Imported Paper</h1>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{workspace.sourceDocuments[0]?.originalName || "Source document"} / {workspace.status} / {workspace.reviewStatus}</p>
            </div>
            <button onClick={() => validateMutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60" disabled={validateMutation.isPending}>
              <RefreshCw size={16} />
              Re-run AI Check
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Questions" value={candidates.length} />
          <Metric label="Answers" value={workspace.answerKeyCandidates.length} />
          <Metric label="Visual Elements" value={workspace.elements.filter((element) => ["FORMULA", "TABLE", "DIAGRAM", "GRAPH", "CHEMICAL_EQUATION"].includes(element.elementType)).length} />
          <Metric label="Quality" value={workspace.qualityScores[0]?.grade || "Pending"} />
        </section>

        {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{errorMessage}</div> : null}

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Original Paper" eyebrow="Source of truth">
            <div className="grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                Page {sourcePage?.pageNumber ?? 1} / {workspace.pages.length || "No pages"}
              </div>
              {sourcePage?.imageUrl ? (
                <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Image src={sourcePage.imageUrl} alt={`Page ${sourcePage.pageNumber}`} fill sizes="(min-width: 1280px) 47vw, 100vw" className="object-contain" />
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-600">
                  Rendered page image is pending. The original file is preserved and linked to this import.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Extracted Candidate" eyebrow="Approve or correct">
            <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
              <div className="max-h-[680px] overflow-auto rounded-lg border border-slate-200">
                {candidates.map((candidate) => (
                  <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`block w-full border-b border-slate-100 p-3 text-left ${selected?.id === candidate.id ? "bg-amber-50" : "bg-white hover:bg-slate-50"}`}>
                    <p className="font-black">Q{candidate.questionNumber || "?"}</p>
                    <p className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${confidenceTone(candidate.confidence)}`}>{percent(candidate.confidence)}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{candidate.reviewStatus}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                {selected ? (
                  <>
                    <div className={`rounded-lg border p-3 text-sm font-black ${confidenceTone(selected.confidence)}`}>
                      AI confidence: {percent(selected.confidence)} / {selected.reviewStatus}
                    </div>
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-900">{selectedText || "No candidate text detected."}</pre>
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Review notes" className="min-h-24 rounded-lg border border-slate-200 p-3 text-sm font-bold outline-none focus:border-[var(--gold)]" />
                    <div className="grid gap-2 md:grid-cols-3">
                      <ActionButton icon={<Check size={16} />} label="Approve" onClick={() => reviewMutation.mutate("APPROVED")} />
                      <ActionButton icon={<AlertTriangle size={16} />} label="Needs Edit" onClick={() => reviewMutation.mutate("NEEDS_EDIT")} />
                      <ActionButton icon={<X size={16} />} label="Reject" onClick={() => reviewMutation.mutate("REJECTED")} />
                    </div>
                  </>
                ) : (
                  <EmptyReview message="No question candidates found yet. Run question detection first." compact />
                )}
              </div>
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function EmptyReview({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div className={`flex ${compact ? "min-h-64" : "min-h-screen"} items-center justify-center bg-[var(--page-bg)] p-6 text-center`}>
      <div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <FileText className="mx-auto text-[var(--gold)]" />
        <p className="mt-3 text-sm font-black text-[var(--navy)]">{message}</p>
      </div>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--gold)]">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black hover:bg-slate-50">
      {icon}
      {label}
    </button>
  );
}
