"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, FileText, Filter, Maximize2, RefreshCw, RotateCw, Save, Search, SkipForward, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { getApiErrorMessage } from "@/services/api";
import {
  bulkReviewNdieCandidates,
  generateNdieQualityReport,
  getNdieReviewWorkspace,
  publishNdieImport,
  replayNdieImport,
  reviewNdieCandidate,
  saveNdieReviewSession,
  validateNdieImport,
  type NdieQuestionCandidate,
  type NdieReviewDecision
} from "@/services/ndie";

type ReviewTab = "question" | "formula" | "visual" | "answer" | "validation" | "history";

function percent(value?: number | null) {
  if (typeof value !== "number") return "Not scored";
  return `${Math.round(value * 100)}%`;
}

function numericPercent(value: unknown) {
  return typeof value === "number" ? `${Math.round(value)}%` : typeof value === "string" ? value : "0%";
}

function confidenceTone(value?: number | null) {
  if (typeof value !== "number") return "border-slate-200 bg-slate-50 text-slate-700";
  if (value >= 0.82) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value >= 0.45) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function riskTone(value?: string) {
  if (value === "CRITICAL" || value === "BLOCKED") return "border-rose-200 bg-rose-50 text-rose-800";
  if (value === "HIGH") return "border-orange-200 bg-orange-50 text-orange-800";
  if (value === "MEDIUM" || value === "READY_WITH_REVIEW") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function bandTone(band: string) {
  if (band === "GREEN") return "bg-emerald-500";
  if (band === "AMBER") return "bg-amber-400";
  if (band === "RED") return "bg-rose-500";
  return "bg-slate-300";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function assessment(candidate?: NdieQuestionCandidate | null) {
  return asRecord(candidate?.candidateJson?.assessment ?? candidate?.candidateJson);
}

function blocks(candidate?: NdieQuestionCandidate | null) {
  const source = assessment(candidate);
  const candidateBlocks = candidate?.candidateJson?.blocks;
  const assessmentBlocks = source.blocks;
  return Array.isArray(assessmentBlocks) ? assessmentBlocks as Array<Record<string, unknown>> : Array.isArray(candidateBlocks) ? candidateBlocks : [];
}

function questionText(candidate?: NdieQuestionCandidate | null) {
  const source = assessment(candidate);
  const text = typeof source.text === "string" ? source.text : "";
  if (text) return text;
  return blocks(candidate)
    .map((block) => {
      if (typeof block.text === "string") return block.text;
      if (block.type === "OptionBlock" && Array.isArray(block.blocks)) {
        return `${block.key || ""}. ${block.blocks.map((item) => typeof asRecord(item).text === "string" ? asRecord(item).text : "").filter(Boolean).join(" ")}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function firstPage(candidate?: NdieQuestionCandidate | null) {
  const source = assessment(candidate);
  const boxes = Array.isArray(source.boundingBoxes) ? source.boundingBoxes : [];
  const sourceMap = asRecord(candidate?.sourceMap);
  return Number(asRecord(boxes[0]).page ?? sourceMap.firstPage ?? 1);
}

function firstBox(candidate?: NdieQuestionCandidate | null) {
  const source = assessment(candidate);
  const boxes = Array.isArray(source.boundingBoxes) ? source.boundingBoxes : [];
  const box = asRecord(boxes[0]);
  const x = Number(asRecord(box.normalized).x ?? box.x ?? 0);
  const y = Number(asRecord(box.normalized).y ?? box.y ?? 0);
  const width = Number(asRecord(box.normalized).width ?? box.width ?? 0);
  const height = Number(asRecord(box.normalized).height ?? box.height ?? 0);
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function optionList(candidate?: NdieQuestionCandidate | null) {
  const source = assessment(candidate);
  return Array.isArray(source.options) ? source.options.map((option) => asRecord(option)) : [];
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function TeacherReviewWorkspace({ importId }: { importId: string }) {
  const queryClient = useQueryClient();
  const pagePanelRef = useRef<HTMLDivElement | null>(null);
  const extractedPanelRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [issueOnly, setIssueOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>("question");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [publishTitle, setPublishTitle] = useState("");
  const [duration, setDuration] = useState(60);

  const query = useQuery({
    queryKey: ["ndie", "review", importId],
    queryFn: () => getNdieReviewWorkspace(importId),
    enabled: Boolean(importId)
  });

  const workspace = query.data;
  const insights = workspace?.reviewInsights;
  const questionIssues = useMemo(() => insights?.questionIssues ?? {}, [insights?.questionIssues]);
  const candidates = useMemo(() => workspace?.questionCandidates ?? [], [workspace?.questionCandidates]);

  const filteredCandidates = useMemo(() => candidates.filter((candidate) => {
    const text = `${candidate.questionNumber ?? ""} ${candidate.questionType} ${questionText(candidate)}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "ALL" || candidate.reviewStatus === statusFilter;
    const matchesIssue = !issueOnly || (questionIssues[candidate.id]?.length ?? 0) > 0 || Number(candidate.confidence ?? 1) < 0.82;
    return matchesSearch && matchesStatus && matchesIssue;
  }), [candidates, issueOnly, questionIssues, search, statusFilter]);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? filteredCandidates[0] ?? candidates[0] ?? null;
  const selectedIssues = selected ? questionIssues[selected.id] ?? [] : [];
  const selectedPageNumber = firstPage(selected);
  const sourcePage = workspace?.pages.find((page) => page.pageNumber === selectedPageNumber) ?? workspace?.pages[0] ?? null;
  const selectedBox = firstBox(selected);
  const dashboard = insights?.dashboard;
  const completion = asRecord(dashboard?.completion);
  const publishReadiness = asRecord(dashboard?.publishReadiness);

  const validateMutation = useMutation({
    mutationFn: () => validateNdieImport(importId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: NdieReviewDecision) => {
      if (!selected) throw new Error("Select a question candidate first");
      return reviewNdieCandidate(selected.id, { decision, notes: notes.trim() || undefined });
    },
    onSuccess: () => {
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] });
      jumpToNextIssue();
    }
  });

  const bulkMutation = useMutation({
    mutationFn: (decision: NdieReviewDecision) => bulkReviewNdieCandidates(importId, {
      candidateIds: filteredCandidates.map((candidate) => candidate.id),
      decision,
      notes: notes.trim() || undefined
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const replayMutation = useMutation({
    mutationFn: () => replayNdieImport(importId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const publishMutation = useMutation({
    mutationFn: () => publishNdieImport(importId, {
      title: publishTitle.trim() || undefined,
      duration,
      allowAutoApproved: false
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const qualityMutation = useMutation({
    mutationFn: () => generateNdieQualityReport(importId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ndie", "review", importId] })
  });

  const autosaveMutation = useMutation({
    mutationFn: () => saveNdieReviewSession(importId, {
      selectedCandidateId: selected?.id ?? null,
      selectedPageNumber: sourcePage?.pageNumber ?? null,
      filters: { search, statusFilter, issueOnly, activeTab },
      scroll: {
        page: pagePanelRef.current?.scrollTop ?? 0,
        extracted: extractedPanelRef.current?.scrollTop ?? 0
      },
      shortcuts: { enabled: true }
    })
  });
  const autosaveReviewSession = autosaveMutation.mutate;

  const errorMessage = [query.error, validateMutation.error, reviewMutation.error, replayMutation.error, publishMutation.error, qualityMutation.error, bulkMutation.error, autosaveMutation.error].find(Boolean) as unknown;

  const jumpTo = useCallback((offset: number) => {
    if (!filteredCandidates.length) return;
    const index = Math.max(0, filteredCandidates.findIndex((candidate) => candidate.id === selected?.id));
    const next = filteredCandidates[(index + offset + filteredCandidates.length) % filteredCandidates.length];
    setSelectedId(next.id);
  }, [filteredCandidates, selected?.id]);

  const jumpToNextIssue = useCallback(() => {
    const issueCandidates = filteredCandidates.filter((candidate) => (questionIssues[candidate.id]?.length ?? 0) > 0 || Number(candidate.confidence ?? 1) < 0.82);
    if (!issueCandidates.length) return;
    const index = Math.max(0, issueCandidates.findIndex((candidate) => candidate.id === selected?.id));
    setSelectedId(issueCandidates[(index + 1) % issueCandidates.length].id);
  }, [filteredCandidates, questionIssues, selected?.id]);

  useEffect(() => {
    if (!workspace || selectedId) return;
    const session = asRecord(asRecord(workspace.teacherSummary).reviewSession);
    const restored = typeof session.selectedCandidateId === "string" ? session.selectedCandidateId : filteredCandidates[0]?.id;
    if (restored) setSelectedId(restored);
    if (asRecord(session.filters).search && typeof asRecord(session.filters).search === "string") setSearch(String(asRecord(session.filters).search));
  }, [filteredCandidates, selectedId, workspace]);

  useEffect(() => {
    if (!importId || !workspace) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(`ndie-review-${importId}`, JSON.stringify({ selectedId: selected?.id ?? null, search, statusFilter, issueOnly, activeTab, notes, savedAt: new Date().toISOString() }));
      autosaveReviewSession();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeTab, autosaveReviewSession, importId, issueOnly, notes, search, selected?.id, statusFilter, workspace]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowDown") { event.preventDefault(); jumpTo(1); }
      if (event.key === "ArrowUp") { event.preventDefault(); jumpTo(-1); }
      if (event.key.toLowerCase() === "n") { event.preventDefault(); jumpToNextIssue(); }
      if (event.key.toLowerCase() === "a") { event.preventDefault(); reviewMutation.mutate("APPROVED"); }
      if (event.key.toLowerCase() === "r") { event.preventDefault(); reviewMutation.mutate("REJECTED"); }
      if (event.key.toLowerCase() === "e") { event.preventDefault(); reviewMutation.mutate("NEEDS_EDIT"); }
      if (event.key === "/") { event.preventDefault(); document.getElementById("ndie-review-search")?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jumpTo, jumpToNextIssue, reviewMutation]);

  if (!importId) return <EmptyReview message="Open this page with ?importId=NDIE_IMPORT_ID to review a processed paper." />;
  if (query.isLoading) return <EmptyReview message="Loading NDIE review workspace..." />;
  if (query.isError) return <EmptyReview message={getApiErrorMessage(query.error)} />;
  if (!workspace) return <EmptyReview message="NDIE import not found." />;

  const approvedCount = candidates.filter((candidate) => candidate.reviewStatus === "APPROVED").length;
  const latestQuality = workspace.qualityScores[0];
  const shownError = errorMessage ? getApiErrorMessage(errorMessage) : "";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-4 text-[var(--navy)] md:px-5">
      <section className="mx-auto grid max-w-[1760px] gap-3">
        <header className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">NDIE Teacher Review</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Document Review Workspace</h1>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{workspace.sourceDocuments[0]?.originalName || "Source document"} / {workspace.status} / {workspace.reviewStatus}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <HeaderButton icon={<RefreshCw size={16} />} label="Replay" onClick={() => replayMutation.mutate()} disabled={replayMutation.isPending} />
              <HeaderButton icon={<RefreshCw size={16} />} label="Validate" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending} />
              <HeaderButton icon={<Save size={16} />} label="Quality" onClick={() => qualityMutation.mutate()} disabled={qualityMutation.isPending} />
              <HeaderButton icon={<Check size={16} />} label="Bulk Approve" onClick={() => bulkMutation.mutate("APPROVED")} disabled={!filteredCandidates.length || bulkMutation.isPending} />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Confidence" value={percent(dashboard?.overallConfidence ?? latestQuality?.aiConfidence)} tone={confidenceTone(dashboard?.overallConfidence ?? latestQuality?.aiConfidence)} />
          <Metric label="Risk" value={String(dashboard?.riskLevel ?? "LOW")} tone={riskTone(String(dashboard?.riskLevel ?? "LOW"))} />
          <Metric label="Readiness" value={String(publishReadiness.status ?? "PENDING")} tone={riskTone(String(publishReadiness.status ?? "PENDING"))} />
          <Metric label="Completion" value={numericPercent(completion.completionPercent)} />
          <Metric label="Questions" value={candidates.length} />
          <Metric label="Issues" value={Number(insights?.counts.missingAnswers ?? 0) + Number(insights?.counts.duplicateNumbering ?? 0) + Number(insights?.counts.missingDiagrams ?? 0)} tone="border-amber-200 bg-amber-50 text-amber-900" />
        </section>

        <section className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Search size={16} className="text-slate-500" />
              <input id="ndie-review-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" className="min-h-10 flex-1 text-sm font-bold outline-none" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs font-black">
                <option value="ALL">All</option>
                <option value="PENDING_REVIEW">Pending</option>
                <option value="NEEDS_EDIT">Needs Edit</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SKIPPED">Skipped</option>
              </select>
              <button onClick={() => setIssueOnly((value) => !value)} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-black ${issueOnly ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <Filter size={14} />
                Issues
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(insights?.heatmap ?? []).slice(0, 120).map((item) => (
                <button key={item.candidateId} onClick={() => setSelectedId(item.candidateId)} className={`min-h-8 min-w-10 rounded-md px-1 text-[11px] font-black text-white ${bandTone(item.band)} ${selected?.id === item.candidateId ? "ring-2 ring-[var(--navy)]" : ""}`} title={`${item.reviewStatus} / ${percent(item.confidence)}`}>
                  {item.questionNumber || "?"}
                </button>
              ))}
            </div>
            <div className="mt-3 max-h-[62vh] overflow-auto rounded-lg border border-slate-200">
              {filteredCandidates.map((candidate) => (
                <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`block w-full border-b border-slate-100 p-3 text-left ${selected?.id === candidate.id ? "bg-amber-50" : "bg-white hover:bg-slate-50"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-black">Q{candidate.questionNumber || "?"}</p>
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${confidenceTone(candidate.confidence)}`}>{percent(candidate.confidence)}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{candidate.questionType} / {candidate.reviewStatus}</p>
                  {(questionIssues[candidate.id]?.length ?? 0) > 0 ? <p className="mt-2 text-xs font-black text-amber-700">{questionIssues[candidate.id].length} issue(s)</p> : null}
                </button>
              ))}
            </div>
          </aside>

          <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
            <Panel title="Original Rendered Page" eyebrow={`Page ${sourcePage?.pageNumber ?? 1}`}>
              <div className="mb-3 flex flex-wrap gap-2">
                <HeaderButton icon={<ZoomIn size={16} />} label={`${Math.round(zoom * 100)}%`} onClick={() => setZoom((value) => value >= 1.8 ? 1 : Number((value + 0.2).toFixed(1)))} />
                <HeaderButton icon={<RotateCw size={16} />} label={`${rotation}°`} onClick={() => setRotation((value) => (value + 90) % 360)} />
                <HeaderButton icon={<Maximize2 size={16} />} label="Fullscreen" onClick={() => pagePanelRef.current?.requestFullscreen?.()} />
              </div>
              <div ref={pagePanelRef} className="relative max-h-[76vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50">
                {sourcePage?.imageUrl ? (
                  <div className="relative mx-auto min-h-[720px] w-full origin-top" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "top center" }}>
                    <Image src={sourcePage.imageUrl} alt={`Page ${sourcePage.pageNumber}`} fill sizes="(min-width: 1280px) 48vw, 100vw" className="object-contain" />
                    {selectedBox ? <div className="absolute border-2 border-amber-400 bg-amber-200/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.08)]" style={{ left: `${selectedBox.x * 100}%`, top: `${selectedBox.y * 100}%`, width: `${selectedBox.width * 100}%`, height: `${selectedBox.height * 100}%` }} /> : null}
                  </div>
                ) : (
                  <EmptyReview message="Rendered page image is pending. The original file is preserved and linked to this import." compact />
                )}
              </div>
            </Panel>

            <Panel title="Extracted Review" eyebrow={selected ? `Q${selected.questionNumber || "?"}` : "No candidate"}>
              <div ref={extractedPanelRef} className="max-h-[76vh] overflow-auto">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white pb-3">
                  <div className="flex flex-wrap gap-2">
                    {(["question", "formula", "visual", "answer", "validation", "history"] as ReviewTab[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`min-h-9 rounded-lg border px-3 text-xs font-black capitalize ${activeTab === tab ? "border-[var(--gold)] bg-amber-50" : "border-slate-200 bg-white"}`}>{tab}</button>
                    ))}
                  </div>
                  {selected ? <div className={`mt-3 rounded-lg border p-3 text-sm font-black ${confidenceTone(selected.confidence)}`}>Confidence {percent(selected.confidence)} / {selected.reviewStatus}</div> : null}
                </div>
                <div className="pt-3">
                  {activeTab === "question" ? <QuestionReview candidate={selected} issues={selectedIssues} /> : null}
                  {activeTab === "formula" ? <FormulaReview formulas={insights?.formulas ?? []} pageNumber={sourcePage?.pageNumber ?? 1} /> : null}
                  {activeTab === "visual" ? <VisualReview visuals={insights?.visuals ?? []} pageNumber={sourcePage?.pageNumber ?? 1} /> : null}
                  {activeTab === "answer" ? <AnswerReview workspace={workspace} selected={selected} /> : null}
                  {activeTab === "validation" ? <ValidationReview insights={insights} /> : null}
                  {activeTab === "history" ? <HistoryReview workspace={workspace} /> : null}
                </div>
                <div className="mt-4 grid gap-2">
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Review notes, correction reason, or formula/visual instruction" className="min-h-24 rounded-lg border border-slate-200 p-3 text-sm font-bold outline-none focus:border-[var(--gold)]" />
                  <div className="grid gap-2 md:grid-cols-4">
                    <ActionButton icon={<Check size={16} />} label="Approve" onClick={() => reviewMutation.mutate("APPROVED")} />
                    <ActionButton icon={<AlertTriangle size={16} />} label="Needs Edit" onClick={() => reviewMutation.mutate("NEEDS_EDIT")} />
                    <ActionButton icon={<SkipForward size={16} />} label="Skip" onClick={() => reviewMutation.mutate("SKIPPED")} />
                    <ActionButton icon={<X size={16} />} label="Reject" onClick={() => reviewMutation.mutate("REJECTED")} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-600">
                    <span>Shortcuts: ↑/↓ navigate, N next issue, A approve, E edit, R reject, / search</span>
                    <span>{autosaveMutation.isPending ? "Saving..." : "Autosaved"}</span>
                  </div>
                </div>
              </div>
            </Panel>
          </section>
        </section>

        {shownError ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{shownError}</div> : null}
        {publishMutation.isSuccess ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">NDIE import published to CBT successfully.</div> : null}

        <Panel title="Publish Handoff" eyebrow="Teacher certified only">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
            <input value={publishTitle} onChange={(event) => setPublishTitle(event.target.value)} placeholder="Exam title" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[var(--gold)]" />
            <input value={duration} onChange={(event) => setDuration(Math.max(1, Number(event.target.value || 60)))} type="number" min={1} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[var(--gold)]" />
            <button onClick={() => publishMutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60" disabled={publishMutation.isPending || approvedCount === 0}>
              <Check size={16} />
              Publish Approved
            </button>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function QuestionReview({ candidate, issues }: { candidate: NdieQuestionCandidate | null; issues: string[] }) {
  if (!candidate) return <EmptyReview message="No question selected." compact />;
  const options = optionList(candidate);
  return (
    <div className="grid gap-3">
      <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-900">{questionText(candidate) || "No candidate text detected."}</pre>
      {options.length ? <div className="grid gap-2">{options.map((option) => <div key={String(option.key)} className="rounded-lg border border-slate-200 p-3 text-sm font-bold">{String(option.key ?? "?")}. {String(option.text ?? "")}</div>)}</div> : null}
      {issues.length ? <IssueList title="Question Issues" issues={issues} /> : <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-800">No blocking question issue detected.</div>}
    </div>
  );
}

function FormulaReview({ formulas, pageNumber }: { formulas: Array<{ id: string; pageNumber: number; text?: string | null; confidence?: number | null; status: string }>; pageNumber: number }) {
  const items = formulas.filter((formula) => formula.pageNumber === pageNumber);
  return <ReviewList empty="No formula regions found on this page." items={items.map((formula) => ({ id: formula.id, title: formula.text || "Formula crop", meta: `${percent(formula.confidence)} / ${formula.status}`, body: formula.text || "Original crop is linked in NDIE assets." }))} />;
}

function VisualReview({ visuals, pageNumber }: { visuals: Array<{ id: string; pageNumber: number; type: string; text?: string | null; confidence?: number | null; status: string }>; pageNumber: number }) {
  const items = visuals.filter((visual) => visual.pageNumber === pageNumber);
  return <ReviewList empty="No diagram, table, graph or image found on this page." items={items.map((visual) => ({ id: visual.id, title: visual.type, meta: `${percent(visual.confidence)} / ${visual.status}`, body: visual.text || "Crop tools: zoom, rotate, recrop and replace are prepared for this visual object." }))} />;
}

function AnswerReview({ workspace, selected }: { workspace: { reviewInsights?: { answers?: Array<{ id: string; questionNumber?: string | null; answerJson: unknown; confidence?: number | null; status: string }>; solutions?: Array<{ id: string; questionNumber?: string | null; solutionJson: unknown; confidence?: number | null; status: string }> } }; selected: NdieQuestionCandidate | null }) {
  const q = selected?.questionNumber;
  const answers = (workspace.reviewInsights?.answers ?? []).filter((answer) => !q || answer.questionNumber === q);
  const solutions = (workspace.reviewInsights?.solutions ?? []).filter((solution) => !q || solution.questionNumber === q);
  return (
    <div className="grid gap-3">
      <ReviewList empty="No mapped answer for this question." items={answers.map((answer) => ({ id: answer.id, title: `Answer Q${answer.questionNumber ?? "?"}`, meta: `${percent(answer.confidence)} / ${answer.status}`, body: stringify(answer.answerJson) }))} />
      <ReviewList empty="No mapped solution or rubric for this question." items={solutions.map((solution) => ({ id: solution.id, title: `Solution Q${solution.questionNumber ?? "?"}`, meta: `${percent(solution.confidence)} / ${solution.status}`, body: stringify(solution.solutionJson) }))} />
    </div>
  );
}

function ValidationReview({ insights }: { insights: { validation?: { issues?: unknown[]; warnings?: unknown[]; recommendations?: string[]; publishReadiness?: Record<string, unknown> } } | undefined }) {
  const issues = (insights?.validation?.issues ?? []).map((item) => asRecord(item));
  const warnings = (insights?.validation?.warnings ?? []).map((item) => asRecord(item));
  return (
    <div className="grid gap-3">
      <div className={`rounded-lg border p-3 text-sm font-black ${riskTone(String(insights?.validation?.publishReadiness?.status ?? "PENDING"))}`}>Publish readiness: {String(insights?.validation?.publishReadiness?.status ?? "PENDING")}</div>
      <ReviewList empty="No validation issues." items={issues.map((item) => ({ id: String(item.issueId), title: `${String(item.severity)} / ${String(item.issueType)}`, meta: String(item.targetType), body: `${String(item.reason)}\nAction: ${String(item.recommendedAction)}` }))} />
      <ReviewList empty="No validation warnings." items={warnings.map((item) => ({ id: String(item.issueId), title: `${String(item.severity)} / ${String(item.issueType)}`, meta: String(item.targetType), body: `${String(item.reason)}\nAction: ${String(item.recommendedAction)}` }))} />
      {insights?.validation?.recommendations?.length ? <IssueList title="Recommendations" issues={insights.validation.recommendations} /> : null}
    </div>
  );
}

function HistoryReview({ workspace }: { workspace: { reviewInsights?: { revisionSummary?: Array<{ id: string; revision: number; changeType: string; changedBy?: string | null; createdAt: string }> } } }) {
  return <ReviewList empty="No review history yet." items={(workspace.reviewInsights?.revisionSummary ?? []).map((revision) => ({ id: revision.id, title: `Revision ${revision.revision}`, meta: `${revision.changeType} / ${revision.changedBy ?? "System"}`, body: new Date(revision.createdAt).toLocaleString() }))} />;
}

function ReviewList({ items, empty }: { items: Array<{ id: string; title: string; meta: string; body: string }>; empty: string }) {
  if (!items.length) return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-600">{empty}</div>;
  return <div className="grid gap-2">{items.map((item) => <details key={item.id} open className="rounded-lg border border-slate-200 bg-white p-3"><summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-black"><span>{item.title}</span><span className="text-xs text-slate-500">{item.meta}</span></summary><pre className="mt-3 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-700">{item.body}</pre></details>)}</div>;
}

function IssueList({ title, issues }: { title: string; issues: string[] }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-black text-amber-900">{title}</p><ul className="mt-2 grid gap-1 text-xs font-bold text-amber-800">{issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul></div>;
}

function EmptyReview({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`flex ${compact ? "min-h-64" : "min-h-screen"} items-center justify-center bg-[var(--page-bg)] p-6 text-center`}><div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm"><FileText className="mx-auto text-[var(--gold)]" /><p className="mt-3 text-sm font-black text-[var(--navy)]">{message}</p></div></div>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Metric({ label, value, tone = "border-[var(--border)] bg-white text-[var(--navy)]" }: { label: string; value: string | number; tone?: string }) {
  return <div className={`rounded-lg border p-4 shadow-sm ${tone}`}><p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function HeaderButton({ icon, label, onClick, disabled = false }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black hover:bg-slate-50 disabled:opacity-60">{icon}{label}</button>;
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black hover:bg-slate-50">{icon}{label}</button>;
}
