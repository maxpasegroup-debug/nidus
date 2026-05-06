import { CourseCard } from "@/components/courses/course-card";
import { ProgressBar } from "@/components/courses/progress-bar";
import type { Course, Enrollment } from "@/types/course";

export function ContinueLearning({ enrollments }: { enrollments: Enrollment[] }) {
  const active = enrollments[0];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Continue Learning</p>
      {active ? (
        <>
          <h3 className="mt-3 text-xl font-semibold text-white">{active.course.title}</h3>
          <p className="mt-2 text-sm text-muted">{active.course.examType} · {active.course.duration}</p>
          <div className="mt-5">
            <ProgressBar value={active.progress} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">Enroll in a course to start your learning queue.</p>
      )}
    </div>
  );
}

export function RecommendedCourses({ courses }: { courses: Course[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {courses.slice(0, 3).map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </section>
  );
}

export function UpcomingLiveClasses() {
  const classes = ["NDA current affairs briefing", "SSB psychology live lab", "AFCAT reasoning sprint"];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Upcoming Live Classes</p>
      <div className="mt-4 space-y-3">
        {classes.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.035] px-4 py-3">
            <span className="text-sm text-white">{item}</span>
            <span className="text-xs text-muted">D+{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
