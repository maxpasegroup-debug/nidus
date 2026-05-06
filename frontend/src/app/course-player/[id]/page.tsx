"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { LessonSidebar } from "@/components/courses/lesson-sidebar";
import { ProgressBar } from "@/components/courses/progress-bar";
import { VideoPlayer } from "@/components/courses/video-player";
import { useToast } from "@/components/providers/toast-provider";
import { useMyCourses } from "@/hooks/use-courses";
import type { Lesson } from "@/types/course";

export default function CoursePlayerPage() {
  const params = useParams<{ id: string }>();
  const courseOrEnrollmentId = params?.id ?? "";
  const { showToast } = useToast();
  const { data: enrollments = [], isLoading } = useMyCourses();
  const enrollment = enrollments.find((item) => item.course.id === courseOrEnrollmentId || item.id === courseOrEnrollmentId);
  const lessons = useMemo(
    () => enrollment?.course.modules?.flatMap((module) => module.lessons) ?? [],
    [enrollment]
  );
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(lessons[0]);
  const selectedLesson = activeLesson ?? lessons[0];
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson?.id);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />;
  }

  if (!enrollment || !selectedLesson) {
    return <EmptyState title="Course player unavailable" description="Enroll in this course before opening the player." />;
  }

  function markComplete() {
    showToast("Progress updated", "success");
  }

  function nextLesson() {
    const next = lessons[lessonIndex + 1];

    if (next) {
      setActiveLesson(next);
      showToast("Next lesson loaded", "info");
    }
  }

  return (
    <motion.div className="grid gap-6 lg:grid-cols-[320px_1fr]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <LessonSidebar
        course={enrollment.course}
        activeLessonId={selectedLesson.id}
        onLessonSelect={setActiveLesson}
      />
      <main className="space-y-5">
        <VideoPlayer lesson={selectedLesson} />
        <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{enrollment.course.title}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{selectedLesson.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{selectedLesson.description}</p>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-muted">
              <span>Course completion</span>
              <span>{enrollment.progress}%</span>
            </div>
            <ProgressBar value={enrollment.progress} />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={markComplete}>Mark lesson complete</Button>
            <Button type="button" onClick={nextLesson} disabled={lessonIndex >= lessons.length - 1} variant="secondary">
              Next lesson
            </Button>
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
            <p className="font-semibold text-white">Notes</p>
            <textarea
              className="mt-3 min-h-40 w-full rounded border border-white/10 bg-navy-deep/70 p-4 text-sm text-white outline-none focus:border-gold"
              placeholder="Write tactical study notes..."
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
            <p className="font-semibold text-white">PDF Viewer</p>
            <iframe src={selectedLesson.pdfUrl} title={`${selectedLesson.title} PDF`} className="mt-3 h-56 w-full rounded border border-white/10 bg-white" />
          </div>
        </section>
      </main>
    </motion.div>
  );
}
