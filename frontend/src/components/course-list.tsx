"use client";

import { useCourses } from "@/hooks/use-courses";

export function CourseList() {
  const { courses, error, isLoading } = useCourses();

  if (isLoading) {
    return <p className="text-steel/70">Loading training courses...</p>;
  }

  if (error) {
    return (
      <div className="rounded border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {courses.map((course) => (
        <article key={course.id} className="rounded border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">
            {course.level}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">{course.title}</h2>
          <p className="mt-3 text-sm leading-6 text-steel/75">{course.description}</p>
        </article>
      ))}
    </section>
  );
}

