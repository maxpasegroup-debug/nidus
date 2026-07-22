"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, FileText, Film, Link2, Loader2, Play, RefreshCw, Search, Upload } from "lucide-react";

import { AiOperatingLayer } from "@/components/ai/ai-operating-layer";
import { RoleDashboardGuard } from "@/components/dashboard/role-dashboard-guard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { archiveStudyMaterial, getAcademyBatches, getMaterialSummary, publishStudyMaterial, type AcademyBatch, type StudyMaterialRecord } from "@/services/academy";
import { deleteMediaFile, uploadMediaFile } from "@/services/media";

type LocalResource = { id: string; file: File; previewUrl: string; kind: "VIDEO" | "FILE" };
type EditorTab = "UPLOAD" | "PENDING" | "PUBLISHED" | "REJECTED";

const tabs: Array<{ key: EditorTab; label: string }> = [
  { key: "UPLOAD", label: "Upload Lesson" },
  { key: "PENDING", label: "Selected Files" },
  { key: "PUBLISHED", label: "Published Library" },
  { key: "REJECTED", label: "Needs Fix" },
];

function youtubeId(value: string) {
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);
  return match?.[1] ?? "";
}

function fieldClass() {
  return "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400";
}

function fileSizeLabel(size: number) {
  if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function materialStatus(item: StudyMaterialRecord) {
  const review = String(item.reviewStatus || "").toUpperCase();
  const status = String(item.status || "").toUpperCase();
  if (review === "REJECTED" || status === "REJECTED") return "REJECTED";
  if (status === "ARCHIVED") return "ARCHIVED";
  if (status === "PUBLISHED") return "PUBLISHED";
  return review || status || "LIBRARY";
}

export default function VideoEditorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<EditorTab>("UPLOAD");
  const [batches, setBatches] = useState<AcademyBatch[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [course, setCourse] = useState("");
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [youtube, setYoutube] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryBatchId, setLibraryBatchId] = useState("");
  const [resources, setResources] = useState<LocalResource[]>([]);
  const resourcesRef = useRef<LocalResource[]>([]);

  const courses = useMemo(() => Array.from(new Set(batches.map((batch) => batch.course?.title || batch.programSlug || "Academy").filter(Boolean))).sort(), [batches]);
  const courseBatches = useMemo(() => batches.filter((batch) => (batch.course?.title || batch.programSlug || "Academy") === course), [batches, course]);
  const batch = useMemo(() => batches.find((item) => item.id === batchId) ?? null, [batches, batchId]);
  const subjects = useMemo(() => Array.from(new Set((batch?.teachers ?? []).map((item) => item.subject).filter(Boolean))).sort(), [batch]);
  const faculty = useMemo(() => (batch?.teachers ?? []).filter((item) => item.subject.toLowerCase() === subject.toLowerCase() && item.status === "ACTIVE"), [batch, subject]);
  const selectedTeacher = faculty.find((item) => item.teacher.id === teacherId)?.teacher;
  const video = resources.find((resource) => resource.kind === "VIDEO");
  const youtubeVideoId = youtubeId(youtube);
  const selectedBytes = resources.reduce((sum, resource) => sum + resource.file.size, 0);
  const ready = Boolean(batch && subject && teacherId && chapter.trim() && topic.trim() && title.trim() && (resources.length || youtubeVideoId));
  const rejectedMaterials = materials.filter((item) => materialStatus(item) === "REJECTED");
  const publishedMaterials = materials.filter((item) => materialStatus(item) === "PUBLISHED");
  const visibleLibrary = publishedMaterials.filter((item) => {
    const matchesBatch = !libraryBatchId || item.batchId === libraryBatchId;
    const text = [item.title, item.batchName, item.subject, item.topic, item.teacherName, item.fileName, item.type].join(" ").toLowerCase();
    return matchesBatch && text.includes(librarySearch.trim().toLowerCase());
  });

  async function loadDesk() {
    setLoading(true);
    setError("");
    try {
      const [batchRows, materialData] = await Promise.all([getAcademyBatches({ status: "ACTIVE" }), getMaterialSummary()]);
      setBatches(batchRows);
      setMaterials(materialData.materials ?? []);
      const firstCourse = batchRows[0]?.course?.title || batchRows[0]?.programSlug || "Academy";
      setCourse((current) => current || firstCourse);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the lesson desk.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDesk();
  }, []);

  useEffect(() => {
    setBatchId("");
    setSubject("");
    setTeacherId("");
  }, [course]);

  useEffect(() => {
    setSubject("");
    setTeacherId("");
  }, [batchId]);

  useEffect(() => setTeacherId(""), [subject]);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => () => resourcesRef.current.forEach((resource) => URL.revokeObjectURL(resource.previewUrl)), []);

  function addFiles(files: FileList | null, kind: "VIDEO" | "FILE") {
    if (!files?.length) return;
    const next = Array.from(files).map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file), kind }));
    setResources((current) => kind === "VIDEO" ? [...current.filter((item) => item.kind !== "VIDEO"), next[0]] : [...current, ...next]);
    setTab("PENDING");
  }

  function removeResource(id: string) {
    setResources((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function publish() {
    if (!ready || !batch || !selectedTeacher) return;
    setPublishing(true);
    setError("");
    setMessage("");
    const published: StudyMaterialRecord[] = [];
    try {
      let index = 0;
      for (const resource of resources) {
        index += 1;
        setUploadStep(`Uploading ${index} of ${resources.length}: ${resource.file.name}`);
        let mediaId = "";
        try {
          const uploaded = await uploadMediaFile({
            file: resource.file,
            storagePath: `${course}/${batch.name}/${subject}/${chapter}/${topic}`,
          });
          mediaId = uploaded.id;
          setUploadStep(`Publishing ${resource.file.name}`);
          const material = await publishStudyMaterial({
            batchId: batch.id,
            batchName: batch.name,
            course,
            folder: chapter.trim(),
            subject,
            topic: topic.trim(),
            title: resources.length > 1 ? `${title.trim()} - ${resource.file.name}` : title.trim(),
            description: notes.trim(),
            type: resource.kind === "VIDEO" ? "VIDEO" : resource.file.type || "FILE",
            url: uploaded.signedUrl || uploaded.cloudinaryUrl,
            fileName: resource.file.name,
            cloudinaryPublicId: uploaded.publicId,
            fileSize: resource.file.size,
            lessonName: title.trim(),
            status: "PUBLISHED",
            reviewStatus: "APPROVED",
            targetTeacherId: selectedTeacher.id,
            targetTeacherName: selectedTeacher.name,
          });
          published.push(material);
        } catch (reason) {
          if (mediaId) await deleteMediaFile(mediaId).catch(() => undefined);
          throw reason;
        }
      }
      if (youtubeVideoId) {
        setUploadStep("Publishing YouTube lesson");
        published.push(await publishStudyMaterial({
          batchId: batch.id,
          batchName: batch.name,
          course,
          folder: chapter.trim(),
          subject,
          topic: topic.trim(),
          title: title.trim(),
          description: notes.trim(),
          type: "YOUTUBE",
          url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
          lessonName: title.trim(),
          status: "PUBLISHED",
          reviewStatus: "APPROVED",
          targetTeacherId: selectedTeacher.id,
          targetTeacherName: selectedTeacher.name,
        }));
      }
      resources.forEach((resource) => URL.revokeObjectURL(resource.previewUrl));
      setResources([]);
      setYoutube("");
      setTitle("");
      setNotes("");
      setUploadStep("");
      setMaterials((current) => [...published, ...current]);
      setMessage(`${published.length} lesson resource${published.length === 1 ? "" : "s"} published to ${batch.name}.`);
      setTab("PUBLISHED");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The lesson could not be published.");
    } finally {
      setPublishing(false);
      setUploadStep("");
    }
  }

  async function archiveMaterial(id: string) {
    setError("");
    setMessage("");
    try {
      const archived = await archiveStudyMaterial(id);
      setMaterials((current) => current.map((item) => item.id === id ? { ...item, ...archived } : item));
      setMessage("Lesson archived from the student library.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not archive lesson.");
    }
  }

  return (
    <RoleDashboardGuard role="TEACHER">
      <WorkspaceDashboard
        roleTitle="Video Editor Workspace"
        greeting="Lesson Upload Desk"
        subtitle="Upload recorded classes and learning files into the correct student batch."
        focus={[
          { label: "Ready Files", title: resources.length, detail: resources.length ? `${fileSizeLabel(selectedBytes)} selected for upload.` : "Choose a video, file or YouTube link.", icon: Film, tone: resources.length ? "warning" : "success" },
          { label: "Publish Status", title: ready ? "Ready" : "Pending", detail: ready ? "All lesson details are selected." : "Complete class, subject, teacher, title and resource.", icon: Upload, tone: ready ? "success" : "warning" },
          { label: "Needs Fix", title: rejectedMaterials.length, detail: "Rejected resources in the current library.", icon: FileText, tone: rejectedMaterials.length ? "danger" : "success" },
        ]}
        actions={[
          { label: "Upload", href: "/dashboard/video-editor#upload", icon: Upload },
          { label: "Files", href: "/dashboard/video-editor#pending", icon: Film },
          { label: "Library", href: "/dashboard/video-editor#published", icon: CheckCircle2 },
        ]}
        metrics={[
          { label: "Published", value: loading ? "..." : publishedMaterials.length },
          { label: "Library Items", value: loading ? "..." : materials.length },
          { label: "Selected Files", value: resources.length },
          { label: "Needs Fix", value: rejectedMaterials.length, tone: rejectedMaterials.length ? "danger" : "success" },
        ]}
        activity={materials.slice(0, 5).map((item) => ({ title: item.title, detail: `${item.batchName || "Batch"} / ${item.subject || "Subject"}`, meta: materialStatus(item) }))}
        upcoming={resources.slice(0, 5).map((item) => ({ title: item.file.name, detail: item.kind === "VIDEO" ? "Recorded video selected" : "Supporting file selected", meta: fileSizeLabel(item.file.size) }))}
      >
        <div className="space-y-4 pb-6">
          <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-700">Academic Media Desk</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Publish lessons to students</h1>
              <p className="mt-1 text-sm text-slate-600">Pick the class, add the recording, preview once, and publish.</p>
            </div>
            <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{user?.name || "Video Editor"} / Video Editor</div>
          </header>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
          {message ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={18} />{message}</div> : null}
          {uploadStep ? <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"><Loader2 className="animate-spin" size={18} />{uploadStep}</div> : null}

          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Video editor sections">
            {tabs.map((item) => (
              <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-black ${tab === item.key ? "bg-slate-950 text-white" : "hover:bg-slate-50"}`}>
                {item.label}
              </button>
            ))}
            <button type="button" onClick={() => void loadDesk()} className="ml-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black">
              <RefreshCw size={16} /> Refresh
            </button>
          </nav>

          {tab === "UPLOAD" ? (
            <section id="upload" className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">1. Lesson details</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SelectField label="Course" value={course} onChange={setCourse} disabled={loading}>
                    <option value="">Select course</option>
                    {courses.map((item) => <option key={item}>{item}</option>)}
                  </SelectField>
                  <SelectField label="Batch" value={batchId} onChange={setBatchId} disabled={!course}>
                    <option value="">Select batch</option>
                    {courseBatches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </SelectField>
                  <SelectField label="Subject" value={subject} onChange={setSubject} disabled={!batch}>
                    <option value="">Select subject</option>
                    {subjects.map((item) => <option key={item}>{item}</option>)}
                  </SelectField>
                  <SelectField label="Teacher" value={teacherId} onChange={setTeacherId} disabled={!subject}>
                    <option value="">Upload for teacher</option>
                    {faculty.map((item) => <option key={item.teacher.id} value={item.teacher.id}>{item.teacher.name}</option>)}
                  </SelectField>
                  <Field label="Chapter" value={chapter} onChange={setChapter} placeholder="e.g. Algebra" />
                  <Field label="Topic" value={topic} onChange={setTopic} placeholder="e.g. Quadratic equations" />
                  <div className="sm:col-span-2"><Field label="Lesson title" value={title} onChange={setTitle} placeholder="Recorded class title" /></div>
                  <label className="grid gap-1 text-xs font-black text-slate-700 sm:col-span-2">
                    Notes
                    <textarea className={`${fieldClass()} min-h-20 py-3`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note shown with the lesson" />
                  </label>
                </div>
                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Student access:</strong> only active students in this batch can see the published lesson.</div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">2. Add recording</h2>
                    <p className="text-sm text-slate-500">Preview before publishing. Nothing uploads until Publish.</p>
                  </div>
                  <Upload className="text-amber-700" />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-amber-500 hover:bg-amber-50"><Film /><span><strong className="block">Choose video</strong><small>MP4, WebM or MOV</small></span><input className="sr-only" type="file" accept="video/*" onChange={(event) => addFiles(event.target.files, "VIDEO")} /></label>
                  <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-amber-500 hover:bg-amber-50"><FileText /><span><strong className="block">Add files</strong><small>PDF, PPT, Word or images</small></span><input className="sr-only" type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" onChange={(event) => addFiles(event.target.files, "FILE")} /></label>
                </div>
                <label className="mt-3 block text-xs font-black text-slate-700">YouTube link<div className="relative mt-1"><Link2 className="absolute left-3 top-3 text-red-600" size={20} /><input className={`${fieldClass()} pl-10`} value={youtube} onChange={(event) => setYoutube(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div></label>

                <div className="mt-4 min-h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                  {video ? <video className="h-64 w-full bg-black object-contain" src={video.previewUrl} controls /> : youtubeVideoId ? <iframe className="h-64 w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`} title="YouTube lesson preview" allowFullScreen /> : <div className="grid h-64 place-items-center text-center text-white"><div><Play className="mx-auto mb-3" /><strong>Preview appears here</strong><p className="mt-1 text-xs text-slate-400">Add a video or YouTube link.</p></div></div>}
                </div>
                <button type="button" onClick={publish} disabled={!ready || publishing} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{publishing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}{publishing ? "Publishing..." : "Publish to Students"}</button>
              </section>
            </section>
          ) : null}

          {tab === "PENDING" ? <PendingFiles resources={resources} youtubeVideoId={youtubeVideoId} removeResource={removeResource} publish={publish} ready={ready} publishing={publishing} /> : null}

          {tab === "PUBLISHED" ? (
            <LibraryPanel
              batches={batches}
              search={librarySearch}
              setSearch={setLibrarySearch}
              batchId={libraryBatchId}
              setBatchId={setLibraryBatchId}
              materials={visibleLibrary}
              archiveMaterial={archiveMaterial}
            />
          ) : null}

          {tab === "REJECTED" ? <RejectedPanel materials={rejectedMaterials} /> : null}

          <AiOperatingLayer
            role="VIDEO_EDITOR"
            compact
            items={[
              { title: title.trim() ? `Title ready: ${title.trim()}` : "Title needed", detail: "Use the class topic and chapter so students can search the lesson later.", icon: Film, tone: title.trim() ? "success" : "warning" },
              { title: batch ? `Batch selected: ${batch.name}` : "Select class", detail: batch ? `${subject || "Subject pending"} / ${selectedTeacher?.name || "Teacher pending"}` : "Select class before adding the recording.", icon: FileText, tone: batch ? "info" : "warning" },
              { title: resources.length || youtubeVideoId ? "Recording selected" : "No recording selected", detail: resources.length ? `${resources.length} file(s), ${fileSizeLabel(selectedBytes)}` : "Add local file or YouTube link.", icon: Upload, tone: resources.length || youtubeVideoId ? "success" : "default" },
            ]}
          />
        </div>
      </WorkspaceDashboard>
    </RoleDashboardGuard>
  );
}

function PendingFiles({ resources, youtubeVideoId, removeResource, publish, ready, publishing }: { resources: LocalResource[]; youtubeVideoId: string; removeResource: (id: string) => void; publish: () => void; ready: boolean; publishing: boolean }) {
  return (
    <section id="pending" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Selected Files</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Review before publishing</h2>
        </div>
        <button type="button" onClick={publish} disabled={!ready || publishing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white disabled:bg-slate-300"><Upload size={16} /> Publish</button>
      </div>
      <div className="mt-5 grid gap-3">
        {resources.map((resource) => (
          <article key={resource.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <h3 className="font-black text-slate-950">{resource.file.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{resource.kind} / {fileSizeLabel(resource.file.size)}</p>
            </div>
            {resource.kind === "VIDEO" ? <video className="h-20 w-32 rounded-lg bg-black object-contain" src={resource.previewUrl} controls /> : <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black">Supporting file</span>}
            <button type="button" onClick={() => removeResource(resource.id)} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700">Remove</button>
          </article>
        ))}
        {youtubeVideoId ? <article className="rounded-xl border border-slate-200 p-4"><h3 className="font-black text-slate-950">YouTube lesson selected</h3><p className="mt-1 text-sm text-slate-500">Video ID: {youtubeVideoId}</p></article> : null}
        {!resources.length && !youtubeVideoId ? <Empty text="No files selected. Open Upload Lesson and choose a video, file or YouTube link." /> : null}
      </div>
    </section>
  );
}

function LibraryPanel({ batches, search, setSearch, batchId, setBatchId, materials, archiveMaterial }: { batches: AcademyBatch[]; search: string; setSearch: (value: string) => void; batchId: string; setBatchId: (value: string) => void; materials: StudyMaterialRecord[]; archiveMaterial: (id: string) => void }) {
  return (
    <section id="published" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, teacher, subject or topic" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className={fieldClass()}>
          <option value="">All batches</option>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden grid-cols-[1.3fr_1fr_1fr_120px_110px] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:grid">
          <span>Lesson</span><span>Class</span><span>Teacher</span><span>Type</span><span>Action</span>
        </div>
        {materials.map((item) => (
          <article key={item.id} className="grid gap-3 border-t border-slate-200 p-4 first:border-t-0 lg:grid-cols-[1.3fr_1fr_1fr_120px_110px] lg:items-center">
            <div><h3 className="font-black text-slate-950">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.folder || "Chapter"} / {item.topic || "Topic"}</p></div>
            <p className="text-sm font-bold">{item.batchName || "Batch"}<span className="block text-xs text-slate-500">{item.subject || "Subject"}</span></p>
            <p className="text-sm font-bold">{item.teacherName || "Faculty"}</p>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{item.type || "FILE"}</span>
            <button type="button" onClick={() => archiveMaterial(item.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black"><Archive size={15} /> Archive</button>
          </article>
        ))}
        {!materials.length ? <Empty text="No published lessons match this search." /> : null}
      </div>
    </section>
  );
}

function RejectedPanel({ materials }: { materials: StudyMaterialRecord[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Needs Fix</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Rejected or blocked lessons</h2>
      <div className="mt-5 grid gap-3">
        {materials.map((item) => (
          <article key={item.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-black text-red-950">{item.title}</h3>
            <p className="mt-1 text-sm text-red-800">{item.batchName || "Batch"} / {item.subject || "Subject"} / {item.teacherName || "Faculty"}</p>
            <p className="mt-2 text-sm font-bold text-red-900">{item.reviewNote || "No review note was added."}</p>
          </article>
        ))}
        {!materials.length ? <Empty text="No rejected lessons. The library is clean." /> : null}
      </div>
    </section>
  );
}

function SelectField({ label, value, onChange, disabled, children }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-black text-slate-700">{label}<select className={fieldClass()} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>{children}</select></label>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-1 text-xs font-black text-slate-700">{label}<input className={fieldClass()} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm font-bold text-slate-500">{text}</p>;
}
