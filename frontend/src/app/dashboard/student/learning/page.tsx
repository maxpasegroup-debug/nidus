"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, FileText, Library, PlayCircle } from "lucide-react";

type Material = {
  id: string;
  batchName?: string | null;
  folder?: string | null;
  subject?: string | null;
  topic?: string | null;
  title: string;
  type: string;
  createdAt?: string;
};

type LiveClass = {
  id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  instructorName?: string | null;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
};

type StudentPlan = {
  batches?: Array<{ id: string; name: string; status?: string | null; course?: { title?: string | null } | null }>;
  materials?: Material[];
  liveClasses?: LiveClass[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload<T>(payload: unknown): T {
  if (isRecord(payload)) {
    if (payload.data !== undefined) return unwrapPayload<T>(payload.data);
    if (payload.result !== undefined) return unwrapPayload<T>(payload.result);
    if (payload.payload !== undefined) return unwrapPayload<T>(payload.payload);
  }
  return payload as T;
}

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Unable to load learning data");
  const payload = await response.json().catch(() => ({}));
  return unwrapPayload<T>(payload);
}

export default function StudentLearningPage() {
  const router = useRouter();
  const planQuery = useQuery({ queryKey: ["student", "my-learning"], queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan") });
  const activeBatches = (planQuery.data?.batches ?? []).filter((batch) => batch.status === "ACTIVE");
  const shouldOpenApplicantLobby = !planQuery.isLoading && !activeBatches.length;
  const materials = planQuery.data?.materials ?? [];
  const liveClasses = planQuery.data?.liveClasses ?? [];
  const upcomingLiveClasses = liveClasses.filter((item) => new Date(item.scheduledAt) >= new Date()).slice(0, 4);
  const recentLessons = [...materials].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))).slice(0, 4);
  const grouped = useMemo(() => groupMaterials(materials), [materials]);
  const lessonCount = materials.length;

  useEffect(() => {
    if (shouldOpenApplicantLobby) router.replace("/dashboard/guest");
  }, [router, shouldOpenApplicantLobby]);

  if (shouldOpenApplicantLobby) return null;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">My Learning</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">Program learning path</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">Your assigned program materials arranged as Program, Subject, Topic and Lesson.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={Library} label="Lessons Available" value={lessonCount} />
          <Metric icon={PlayCircle} label="Lessons Completed" value={0} />
          <Metric icon={FileText} label="Lessons Remaining" value={lessonCount} />
          <Metric icon={CalendarDays} label="Upcoming Live Classes" value={upcomingLiveClasses.length} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Recently Viewed / Added Lessons">
            <div className="grid gap-3">
              {recentLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
              {!recentLessons.length ? <Empty text="Lessons uploaded by teachers will appear here." /> : null}
            </div>
          </Panel>
          <Panel title="Upcoming Live Classes">
            <div className="grid gap-3">
              {upcomingLiveClasses.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.subject ?? "Live Class"}</p>
                  <h3 className="mt-2 text-lg font-black">{item.topic || item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-blue)]">{item.instructorName ?? "NIDUS Teacher"} / {new Date(item.scheduledAt).toLocaleString()}</p>
                  <a href={item.meetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">Join</a>
                </article>
              ))}
              {!upcomingLiveClasses.length ? <Empty text="No live class is scheduled right now." /> : null}
            </div>
          </Panel>
        </section>

        <Panel title="Learning Folders">
          <div className="space-y-5">
            {grouped.map((program) => (
              <section key={program.name} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Program</p>
                <h2 className="mt-2 text-2xl font-black">{program.name}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {program.subjects.map((subject) => (
                    <div key={subject.name} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                      <h3 className="text-xl font-black">{subject.name}</h3>
                      <div className="mt-3 space-y-3">
                        {subject.topics.map((topic) => (
                          <div key={topic.name} className="rounded-xl border border-[var(--border)] bg-white p-3">
                            <p className="text-sm font-black">{topic.name}</p>
                            <div className="mt-2 grid gap-2">
                              {topic.lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} compact />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {!grouped.length ? <Empty text="No learning folders are available yet." /> : null}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function groupMaterials(materials: Material[]) {
  const programMap = new Map<string, Map<string, Map<string, Material[]>>>();
  for (const material of materials) {
    const program = material.batchName ?? "My Program";
    const subject = material.subject ?? material.folder ?? "General";
    const topic = material.topic ?? "Lessons";
    if (!programMap.has(program)) programMap.set(program, new Map());
    const subjectMap = programMap.get(program)!;
    if (!subjectMap.has(subject)) subjectMap.set(subject, new Map());
    const topicMap = subjectMap.get(subject)!;
    topicMap.set(topic, [...(topicMap.get(topic) ?? []), material]);
  }
  return Array.from(programMap.entries()).map(([name, subjects]) => ({
    name,
    subjects: Array.from(subjects.entries()).map(([subjectName, topics]) => ({
      name: subjectName,
      topics: Array.from(topics.entries()).map(([topicName, lessons]) => ({ name: topicName, lessons })),
    })),
  }));
}

function Metric({ icon: Icon, label, value }: { icon: typeof Library; label: string; value: number }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-white p-5"><Icon className="h-5 w-5 text-[var(--gold)]" /><p className="mt-4 text-3xl font-black">{value}</p><p className="text-sm text-[var(--muted-blue)]">{label}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm"><h2 className="text-2xl font-black">{title}</h2><div className="mt-5">{children}</div></section>;
}

function LessonCard({ lesson, compact = false }: { lesson: Material; compact?: boolean }) {
  return (
    <Link href={`/dashboard/student/lesson/${lesson.id}`} className={`block rounded-xl border border-[var(--border)] bg-white p-3 ${compact ? "" : "p-4"}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">{lesson.type}</p>
      <h3 className="mt-1 font-black">{lesson.title}</h3>
      {!compact ? <p className="mt-1 text-sm text-[var(--muted-blue)]">{lesson.subject ?? "Subject"} / {lesson.topic ?? "Topic"}</p> : null}
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
