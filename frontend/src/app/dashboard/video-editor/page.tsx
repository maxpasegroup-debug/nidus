"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Film, Link2, Loader2, Play, Upload } from "lucide-react";

import { AiOperatingLayer } from "@/components/ai/ai-operating-layer";
import { RoleDashboardGuard } from "@/components/dashboard/role-dashboard-guard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { getAcademyBatches, getMaterialSummary, publishStudyMaterial, type AcademyBatch, type StudyMaterialRecord } from "@/services/academy";
import { deleteMediaFile, uploadMediaFile } from "@/services/media";

type LocalResource = { id: string; file: File; previewUrl: string; kind: "VIDEO" | "FILE" };

function youtubeId(value: string) {
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);
  return match?.[1] ?? "";
}

function fieldClass() {
  return "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400";
}

export default function VideoEditorDashboard() {
  const [batches, setBatches] = useState<AcademyBatch[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
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
  const ready = Boolean(batch && subject && teacherId && chapter.trim() && topic.trim() && title.trim() && (resources.length || youtubeVideoId));
  const rejectedMaterials = materials.filter((item) => String(item.reviewStatus || item.status || "").toUpperCase() === "REJECTED");
  const publishedMaterials = materials.filter((item) => String(item.status || "").toUpperCase() === "PUBLISHED");

  useEffect(() => {
    Promise.all([getAcademyBatches({ status: "ACTIVE" }), getMaterialSummary()])
      .then(([batchRows, materialData]) => {
        setBatches(batchRows);
        setMaterials(materialData.materials ?? []);
        const firstCourse = batchRows[0]?.course?.title || batchRows[0]?.programSlug || "Academy";
        setCourse(firstCourse);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load the lesson desk."))
      .finally(() => setLoading(false));
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
      for (const resource of resources) {
        let mediaId = "";
        try {
          const uploaded = await uploadMediaFile({
            file: resource.file,
            storagePath: `${course}/${batch.name}/${subject}/${chapter}/${topic}`,
          });
          mediaId = uploaded.id;
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
      setMaterials((current) => [...published, ...current]);
      setMessage(`${published.length} lesson resource${published.length === 1 ? "" : "s"} published to ${batch.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The lesson could not be published.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <RoleDashboardGuard role="TEACHER">
      <WorkspaceDashboard
        roleTitle="Video Editor Workspace"
        greeting="Pending Videos"
        subtitle="Prepare, upload and publish class resources for enrolled students."
        focus={[
          { label: "Pending Videos", title: resources.length, detail: "Selected local resources waiting to be published.", icon: Film, tone: resources.length ? "warning" : "success" },
          { label: "Today's Uploads", title: ready ? "Ready to publish" : "Location pending", detail: ready ? "All required lesson details are selected." : "Choose course, batch, subject, faculty, chapter, topic and a resource.", icon: Upload, tone: ready ? "success" : "warning" },
          { label: "Rejected", title: rejectedMaterials.length, detail: "Rejected resources from the current library summary.", icon: FileText, tone: rejectedMaterials.length ? "danger" : "success" },
        ]}
        actions={[
          { label: "Uploads", href: "/dashboard/video-editor#uploads", icon: Upload },
          { label: "Pending Videos", href: "/dashboard/video-editor#pending", icon: Film },
          { label: "Published Videos", href: "/dashboard/video-editor#published", icon: CheckCircle2 },
        ]}
        metrics={[
          { label: "Published", value: loading ? "..." : publishedMaterials.length },
          { label: "Library Items", value: loading ? "..." : materials.length },
          { label: "Selected Files", value: resources.length },
          { label: "Rejected", value: rejectedMaterials.length, tone: rejectedMaterials.length ? "danger" : "success" },
        ]}
        activity={materials.slice(0, 5).map((item) => ({ title: item.title, detail: `${item.batchName} / ${item.subject}`, meta: item.status || item.reviewStatus || "Library" }))}
        upcoming={resources.slice(0, 5).map((item) => ({ title: item.file.name, detail: item.kind === "VIDEO" ? "Recorded video selected" : "Supporting file selected", meta: item.kind }))}
      >
      <div id="uploads" className="space-y-4 pb-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-700">Academic Media Desk</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Upload lessons for every class</h1>
            <p className="mt-1 text-sm text-slate-600">Choose where it belongs, preview it, then publish for enrolled students.</p>
          </div>
          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Jenifer KM · Video Editor</div>
        </header>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        {message ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={18} />{message}</div> : null}
        <AiOperatingLayer
          role="VIDEO_EDITOR"
          compact
          items={[
            { title: title.trim() ? `Title ready: ${title.trim()}` : "Title suggestion pending", detail: "Use the class topic and chapter to keep the recording title searchable.", icon: Film, tone: title.trim() ? "success" : "warning" },
            { title: topic.trim() ? "Chapter signal ready" : "Add topic for chaptering", detail: topic.trim() ? `${chapter || "Chapter"} / ${topic} can guide descriptions and chapters.` : "Topic is needed before chapter suggestions make sense.", icon: FileText, tone: topic.trim() ? "info" : "warning" },
            { title: resources.length || youtubeVideoId ? "Recording selected" : "No recording selected", detail: "Recording summaries and descriptions stay inside the existing publish workflow.", icon: Upload, tone: resources.length || youtubeVideoId ? "success" : "default" },
          ]}
        />

        <main className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">1. Lesson location</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="text-xs font-black text-slate-700">Course<select className={`${fieldClass()} mt-1`} value={course} onChange={(event) => setCourse(event.target.value)} disabled={loading}><option value="">Select course</option>{courses.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-xs font-black text-slate-700">Batch<select className={`${fieldClass()} mt-1`} value={batchId} onChange={(event) => setBatchId(event.target.value)} disabled={!course}><option value="">Select batch</option>{courseBatches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-xs font-black text-slate-700">Subject<select className={`${fieldClass()} mt-1`} value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!batch}><option value="">Select subject</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-xs font-black text-slate-700">Faculty<select className={`${fieldClass()} mt-1`} value={teacherId} onChange={(event) => setTeacherId(event.target.value)} disabled={!subject}><option value="">Upload on behalf of</option>{faculty.map((item) => <option key={item.teacher.id} value={item.teacher.id}>{item.teacher.name}</option>)}</select></label>
              <label className="text-xs font-black text-slate-700">Chapter<input className={`${fieldClass()} mt-1`} value={chapter} onChange={(event) => setChapter(event.target.value)} placeholder="e.g. Algebra" /></label>
              <label className="text-xs font-black text-slate-700">Topic<input className={`${fieldClass()} mt-1`} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Quadratic equations" /></label>
              <label className="text-xs font-black text-slate-700 sm:col-span-2 xl:col-span-1 2xl:col-span-2">Lesson title<input className={`${fieldClass()} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Recorded class title" /></label>
              <label className="text-xs font-black text-slate-700 sm:col-span-2 xl:col-span-1 2xl:col-span-2">Notes<textarea className={`${fieldClass()} mt-1 min-h-20 py-3`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional teacher notes" /></label>
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Student access:</strong> only active students enrolled in the selected batch receive the published lesson.</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">2. Resources and preview</h2><p className="text-sm text-slate-500">Nothing is uploaded until you publish.</p></div><Upload className="text-amber-700" /></div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-amber-500 hover:bg-amber-50"><Film /><span><strong className="block">Choose recorded video</strong><small>MP4, WebM or MOV</small></span><input className="sr-only" type="file" accept="video/*" onChange={(event) => addFiles(event.target.files, "VIDEO")} /></label>
              <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-amber-500 hover:bg-amber-50"><FileText /><span><strong className="block">Add supporting files</strong><small>PDF, PPT, Word or images</small></span><input className="sr-only" type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" onChange={(event) => addFiles(event.target.files, "FILE")} /></label>
            </div>
            <label className="mt-3 block text-xs font-black text-slate-700">YouTube link<div className="relative mt-1"><Link2 className="absolute left-3 top-3 text-red-600" size={20} /><input className={`${fieldClass()} pl-10`} value={youtube} onChange={(event) => setYoutube(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div></label>

            <div className="mt-4 min-h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              {video ? <video className="h-56 w-full bg-black object-contain" src={video.previewUrl} controls /> : youtubeVideoId ? <iframe className="h-56 w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`} title="YouTube lesson preview" allowFullScreen /> : <div className="grid h-56 place-items-center text-center text-white"><div><Play className="mx-auto mb-3" /><strong>Preview appears here</strong><p className="mt-1 text-xs text-slate-400">Play the selected video before publishing.</p></div></div>}
            </div>
            {resources.length ? <div className="mt-3 flex flex-wrap gap-2">{resources.map((resource) => <button type="button" key={resource.id} onClick={() => removeResource(resource.id)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold hover:border-red-300 hover:text-red-700" title="Remove">{resource.file.name} ×</button>)}</div> : null}
            <button type="button" onClick={publish} disabled={!ready || publishing} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{publishing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}{publishing ? "Publishing..." : "Publish to selected batch"}</button>
          </section>
        </main>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-black text-slate-950">Recently published</h2><span className="text-xs font-bold text-slate-500">{materials.length} library items</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{materials.slice(0, 4).map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><p className="truncate text-sm font-black">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{item.batchName} · {item.subject}</p><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-emerald-700">Published for {item.teacherName || "faculty"}</p></div>)}{!materials.length && !loading ? <p className="text-sm text-slate-500">No lessons published yet.</p> : null}</div>
        </section>
      </div>
      </WorkspaceDashboard>
    </RoleDashboardGuard>
  );
}
