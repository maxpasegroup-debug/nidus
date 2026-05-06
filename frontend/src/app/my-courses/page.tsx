"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/courses/course-card";
import { CourseSkeletonGrid, EmptyState } from "@/components/courses/empty-state";
import { ContinueLearning, UpcomingLiveClasses } from "@/components/courses/course-widgets";
import { SectionHeader } from "@/components/dashboard";
import { useMyCourses } from "@/hooks/use-courses";
import { getApiErrorMessage } from "@/services/api";

export default function MyCoursesPage() {
  const { data: enrollments = [], isLoading, error } = useMyCourses();

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="My Courses" title="Continue your training" action={`${enrollments.length} active enrollments`} />

      {isLoading ? <CourseSkeletonGrid /> : null}
      {error ? <EmptyState title="Unable to load my courses" description={getApiErrorMessage(error)} /> : null}

      {!isLoading && !error ? (
        enrollments.length > 0 ? (
          <>
            <ContinueLearning enrollments={enrollments} />
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="space-y-3">
                  <CourseCard course={enrollment.course} progress={enrollment.progress} />
                  <Link
                    href={`/course-player/${enrollment.course.id}`}
                    className="block rounded border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm font-semibold text-gold transition hover:bg-gold/15"
                  >
                    Continue Learning
                  </Link>
                </div>
              ))}
            </section>
            <UpcomingLiveClasses />
          </>
        ) : (
          <EmptyState title="No enrolled courses" description="Enroll in a course to activate your learning dashboard." />
        )
      ) : null}
    </motion.div>
  );
}
