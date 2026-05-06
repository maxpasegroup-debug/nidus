"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CourseSkeletonGrid, EmptyState } from "@/components/courses/empty-state";
import { ProgressBar } from "@/components/courses/progress-bar";
import { SectionHeader } from "@/components/dashboard";
import { useCourseDetails, useEnrollCourse } from "@/hooks/use-courses";
import { getApiErrorMessage } from "@/services/api";

export default function CourseDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { data: course, isLoading, error } = useCourseDetails(slug);
  const enrollMutation = useEnrollCourse();

  if (isLoading) {
    return <CourseSkeletonGrid />;
  }

  if (error || !course) {
    return <EmptyState title="Unable to load course" description={getApiErrorMessage(error)} />;
  }

  const lessonCount = course.modules?.reduce((count, module) => count + module.lessons.length, 0) ?? 0;

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="overflow-hidden rounded-lg border border-gold/20 bg-white/[0.055] backdrop-blur-xl">
        <div className="relative h-72">
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{course.examType}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-white">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{course.description}</p>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-4">
          <div><p className="text-xs text-muted">Duration</p><p className="mt-1 font-semibold text-white">{course.duration}</p></div>
          <div><p className="text-xs text-muted">Lessons</p><p className="mt-1 font-semibold text-white">{lessonCount}</p></div>
          <div><p className="text-xs text-muted">Price</p><p className="mt-1 font-semibold text-gold-soft">Rs {course.price.toLocaleString("en-IN")}</p></div>
          <Button type="button" onClick={() => enrollMutation.mutate(course.id)} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <SectionHeader eyebrow="Curriculum" title="Modules and lessons" />
          {course.modules?.map((module) => (
            <div key={module.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
              <p className="font-semibold text-white">{module.order}. {module.title}</p>
              <div className="mt-4 space-y-3">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex flex-col justify-between gap-2 rounded border border-white/10 bg-white/[0.035] p-4 sm:flex-row">
                    <div>
                      <p className="font-medium text-white">{lesson.title}</p>
                      <p className="mt-1 text-sm text-muted">{lesson.description}</p>
                    </div>
                    <span className="text-sm text-gold">{lesson.isPreview ? "Preview" : lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Instructor</p>
            <h2 className="mt-3 text-xl font-semibold text-white">NIDUS Defence Faculty Cell</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Mentors with defence exam, SSB, academics and physical readiness experience.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
            <p className="text-xs text-muted">Course readiness</p>
            <p className="mt-2 text-3xl font-semibold text-gold-soft">92%</p>
            <div className="mt-4"><ProgressBar value={92} /></div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
