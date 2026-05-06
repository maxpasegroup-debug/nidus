"use client";

import type { Course, Lesson } from "@/types/course";

export function LessonSidebar({
  course,
  activeLessonId,
  onLessonSelect
}: {
  course: Course;
  activeLessonId?: string;
  onLessonSelect: (lesson: Lesson) => void;
}) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Lessons</p>
      <h2 className="mt-2 font-semibold text-white">{course.title}</h2>
      <div className="mt-5 space-y-5">
        {course.modules?.map((module) => (
          <div key={module.id}>
            <p className="text-sm font-semibold text-white">{module.order}. {module.title}</p>
            <div className="mt-2 space-y-2">
              {module.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onLessonSelect(lesson)}
                  className={`w-full rounded border px-3 py-3 text-left text-sm transition ${
                    activeLessonId === lesson.id
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-white/10 bg-white/[0.035] text-muted hover:border-gold/25 hover:text-white"
                  }`}
                >
                  <span className="block font-medium">{lesson.title}</span>
                  <span className="mt-1 block text-xs">{lesson.duration}{lesson.isPreview ? " · Preview" : ""}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
