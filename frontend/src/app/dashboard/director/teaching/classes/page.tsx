"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, GraduationCap, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getAcademyBatches } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicShell } from "../../academic/_components";

type Tone = "blue" | "green" | "gold" | "amber";

export default function DirectorTeachingClassesPage() {
  const coursesQuery = useCourses();
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const courses = coursesQuery.data ?? [];
  const batches = (batchesQuery.data ?? []).filter((batch) => batch.status !== "ARCHIVED");
  const loading = coursesQuery.isLoading || batchesQuery.isLoading;
  const totalStudents = batches.reduce((total, batch) => total + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const totalTeachers = batches.reduce((total, batch) => total + (batch._count?.teachers ?? batch.teachers?.length ?? 0), 0);

  const liveCourses = courses.slice(0, 6);
  const liveBatches = batches.slice(0, 8);
  const aiMessage = loading
    ? "Nidus AI is checking live courses and batches for teaching access."
    : batches.length
      ? `${batches.length} batch(es) are ready for teaching review. Open a batch to continue inside the existing class workspace.`
      : "No live batch is visible yet. Create a batch first, then teaching will appear here.";

  return (
    <AcademicShell>
      <header className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Teach</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Teach Today</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Open live classes, batch rooms and course-wise teaching from one simple Director entry.</p>
          </div>
          <Link href="/dashboard/director/academic" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black shadow-sm">
            Academics Home
          </Link>
        </div>
      </header>

      <section className="shrink-0 rounded-3xl border border-[var(--gold-border)] bg-white/92 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white"><Sparkles className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Teaching Briefing</p>
              <p className="mt-2 text-lg font-black leading-7 text-[var(--navy)]">{aiMessage}</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">This page is only the clean Director doorway. Full class tools remain unchanged after opening a course or batch.</p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2 sm:grid-cols-3 lg:w-[420px]">
            <MiniStat label="Batches" value={loading ? "..." : batches.length} />
            <MiniStat label="Students" value={loading ? "..." : totalStudents} />
            <MiniStat label="Teachers" value={loading ? "..." : totalTeachers} />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Courses" eyebrow="Choose course">
          <div className="grid gap-3 sm:grid-cols-2">
            {liveCourses.map((course) => (
              <ActionCard key={course.id} href={`/dashboard/director/teaching/classes/${course.slug}`} icon={GraduationCap} title={course.title} detail={`${course.category || "Course"} / ${course.examType || "Teaching"}`} tone="gold" />
            ))}
            {!loading && !liveCourses.length ? <EmptyState text="No course is visible yet. Add programs first." href="/dashboard/director/academic/programs" label="Open Programs" /> : null}
          </div>
        </Panel>

        <Panel title="Live Batches" eyebrow="Open batch room">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {liveBatches.map((batch) => (
              <ActionCard
                key={batch.id}
                href={`/dashboard/director/teaching/classes/${batch.programSlug || "course"}/${batch.id}`}
                icon={Users}
                title={batch.name}
                detail={`${batch.programSlug || "Program"} / ${batch._count?.students ?? batch.students?.length ?? 0} students`}
                tone="blue"
              />
            ))}
            {!loading && !liveBatches.length ? <EmptyState text="No live batch is visible yet." href="/dashboard/director/academic/batches" label="Create Batch" /> : null}
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--gold-soft)] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p><p className="text-xl font-black text-[var(--navy)]">{value}</p></div>;
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return <section className="min-h-0 rounded-3xl border border-[var(--border)] bg-white/86 p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">{children}</div></section>;
}

function ActionCard({ detail, href, icon: Icon, title, tone }: { detail: string; href: string; icon: LucideIcon; title: string; tone: Tone }) {
  const palette = tonePalette(tone);
  return <Link href={href} className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${palette.card}`}><div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-black text-[var(--navy)]">{title}</span><span className="mt-1 block truncate text-xs font-bold text-[var(--muted-blue)]">{detail}</span></span></div></Link>;
}

function EmptyState({ href, label, text }: { href: string; label: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4"><p className="text-sm font-bold text-[var(--muted-blue)]">{text}</p><Link href={href} className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 text-sm font-black text-[var(--navy)] shadow-sm">{label}</Link></div>;
}

function tonePalette(tone: Tone) {
  const styles: Record<Tone, { card: string; icon: string }> = {
    blue: { card: "border-[#c7dcf5] bg-[#f4f8ff]", icon: "bg-[#dcecff] text-[#123c6d]" },
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800" },
    gold: { card: "border-[var(--gold-border)] bg-[var(--gold-soft)]", icon: "bg-white text-[var(--navy)]" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800" },
  };
  return styles[tone];
}