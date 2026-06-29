"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardCopy, FileText, LayoutTemplate, Presentation, RefreshCw, Sparkles } from "lucide-react";
import { apiGet, getApiErrorMessage } from "@/services/api";

type PptBatch = {
  id: string;
  name?: string | null;
  batchName?: string | null;
  subject?: string | null;
  assignedSubjects?: string[];
  course?: { title?: string | null; name?: string | null } | null;
};

type SlidePlan = {
  title: string;
  bullets: string[];
  note: string;
};

const templates = [
  { id: "concept", name: "Concept Class", text: "Best for teaching a new topic with examples." },
  { id: "revision", name: "Revision Drill", text: "Best for quick recap, formulas and practice." },
  { id: "exam", name: "Exam Practice", text: "Best for question solving and answer logic." },
  { id: "ssb", name: "SSB Briefing", text: "Best for defence mindset and officer qualities." },
];

function recordsFrom<T>(value: unknown, key: string): T[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  if (record.data && typeof record.data === "object" && Array.isArray((record.data as Record<string, unknown>)[key])) {
    return (record.data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function batchName(batch?: PptBatch | null) {
  return batch?.name || batch?.batchName || batch?.course?.title || batch?.course?.name || "Assigned batch";
}

function subjectsFor(batch?: PptBatch | null) {
  const subjects = new Set<string>();
  batch?.assignedSubjects?.forEach((subject) => subject && subjects.add(subject));
  if (batch?.subject) subjects.add(batch.subject);
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
}

function buildSlides(input: { topic: string; subject: string; template: string; duration: string; level: string }): SlidePlan[] {
  const topic = input.topic.trim() || "Today's Topic";
  const subject = input.subject || "Subject";
  const duration = input.duration || "45";
  const isExam = input.template === "exam";
  const isRevision = input.template === "revision";
  const isSsb = input.template === "ssb";

  return [
    {
      title: `${subject}: ${topic}`,
      bullets: [`Class duration: ${duration} minutes`, `Level: ${input.level}`, "What students will learn today"],
      note: "Open with the exact outcome students should remember.",
    },
    {
      title: "Why this matters",
      bullets: isSsb ? ["Defence relevance", "Officer-like behaviour", "Real academy application"] : ["Exam importance", "Common mistakes", "Where this appears in practice"],
      note: "Connect the topic to the student's defence goal.",
    },
    {
      title: isRevision ? "Quick recap" : "Core concept",
      bullets: ["Definition or rule", "Key formula / idea", "One simple example"],
      note: "Keep this slide clean. Avoid paragraphs.",
    },
    {
      title: "Teacher explanation",
      bullets: ["Step 1: Build the idea", "Step 2: Show one solved example", "Step 3: Ask one oral question"],
      note: "Use the board or tab for live working.",
    },
    {
      title: isExam ? "Question practice" : "Class activity",
      bullets: ["Easy question", "Medium question", "Challenge question"],
      note: "Let students attempt before showing the answer.",
    },
    {
      title: "Check understanding",
      bullets: ["One-minute quiz", "Ask students to explain the rule", "Identify who needs support"],
      note: "Use this to decide homework or revision.",
    },
    {
      title: "Homework / next action",
      bullets: ["Practice set", "Revision topic", "Next class continuation"],
      note: "End with one clear action.",
    },
  ];
}

export function PptGeneratorPage({ role, backHref }: { role: "TEACHER" | "ACADEMIC_HEAD"; backHref: string }) {
  const [batches, setBatches] = useState<PptBatch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState("concept");
  const [duration, setDuration] = useState("45");
  const [level, setLevel] = useState("Average");
  const [slides, setSlides] = useState<SlidePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await apiGet<unknown>("/academy/my-teaching-plan");
      const nextBatches = recordsFrom<PptBatch>(plan, "batches");
      setBatches(nextBatches);
      setBatchId((current) => current || nextBatches[0]?.id || "");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === batchId) ?? batches[0] ?? null, [batchId, batches]);
  const subjects = useMemo(() => subjectsFor(selectedBatch), [selectedBatch]);

  useEffect(() => {
    setSubject((current) => current && subjects.includes(current) ? current : subjects[0] || "");
  }, [subjects]);

  function generate() {
    setSlides(buildSlides({ topic, subject, template, duration, level }));
    setCopied(false);
  }

  async function copyOutline() {
    const text = slides.map((slide, index) => `${index + 1}. ${slide.title}\n${slide.bullets.map((bullet) => `- ${bullet}`).join("\n")}\nTeacher note: ${slide.note}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4">
      <header className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> My Workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{role === "ACADEMIC_HEAD" ? "Teacher + HOD" : "Teacher"} PPT Generator</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">Create teaching slides faster.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose batch, subject and topic. NIDUS prepares a clean slide structure that teachers can copy into PowerPoint, Canva or Google Slides.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); generate(); }}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Presentation size={20} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Slide Brief</p>
              <h2 className="text-2xl font-black">Class input</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black">Batch
              <select value={selectedBatch?.id || ""} onChange={(event) => setBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {batches.map((batch) => <option key={batch.id} value={batch.id}>{batchName(batch)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">Subject
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">Topic
              <input value={topic} onChange={(event) => setTopic(event.target.value)} required placeholder="Example: Algebra identities" className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black">Duration
                <select value={duration} onChange={(event) => setDuration(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                  {["30", "45", "60", "90"].map((item) => <option key={item} value={item}>{item} minutes</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black">Student Level
                <select value={level} onChange={(event) => setLevel(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                  {["Beginner", "Average", "Advanced", "Mixed"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-black">Template</p>
            <div className="mt-3 grid gap-2">
              {templates.map((item) => (
                <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-2xl border p-3 text-left transition ${template === item.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
                  <span className="text-sm font-black">{item.name}</span>
                  <span className="mt-1 block text-xs opacity-80">{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={!batches.length || !subject || !topic.trim()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
            <Sparkles size={17} /> Generate Slide Plan
          </button>
        </form>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Preview</p>
              <h2 className="text-2xl font-black">Slide outline</h2>
            </div>
            <button type="button" onClick={() => void copyOutline()} disabled={!slides.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
              <ClipboardCopy size={16} /> {copied ? "Copied" : "Copy Outline"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {slides.map((slide, index) => (
              <article key={`${slide.title}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sm font-black shadow-sm">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-black">{slide.title}</h3>
                    <ul className="mt-3 grid gap-2 text-sm">
                      {slide.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-950" /> <span>{bullet}</span></li>)}
                    </ul>
                    <p className="mt-4 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-bold text-[var(--muted-blue)]">{slide.note}</p>
                  </div>
                </div>
              </article>
            ))}
            {!slides.length ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
                <LayoutTemplate className="mx-auto h-10 w-10 text-[var(--muted-blue)]" />
                <h3 className="mt-4 text-xl font-black">{loading ? "Loading batches..." : "No slide plan yet"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">Fill the brief and generate a teacher-ready slide structure.</p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex gap-3">
              <FileText size={18} className="mt-0.5 shrink-0" />
              <p><b>Teacher note:</b> Phase 5 creates the dedicated slide-planning workspace. Direct PPTX/Canva export can be connected in the next AI content sprint.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
