"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CourseCard } from "@/components/courses/course-card";
import { CourseSkeletonGrid, EmptyState } from "@/components/courses/empty-state";
import { FilterBar } from "@/components/courses/filter-bar";
import { RecommendedCourses, UpcomingLiveClasses } from "@/components/courses/course-widgets";
import { SectionHeader } from "@/components/dashboard";
import { useCourses } from "@/hooks/use-courses";
import { getApiErrorMessage } from "@/services/api";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState("");
  const { data: courses = [], isLoading, error } = useCourses({ search, category, examType });

  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))), [courses]);
  const examTypes = useMemo(() => Array.from(new Set(courses.map((course) => course.examType))), [courses]);
  const featured = courses.filter((course) => course.isPremium).slice(0, 3);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-gradient-to-br from-white/10 to-white/[0.04] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Course Arsenal</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Choose your defence preparation path</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Explore NDA, CDS, AFCAT, SSB, AISSEE and RIMC programs with structured modules, previews and premium training tracks.
        </p>
      </section>

      <FilterBar
        search={search}
        category={category}
        examType={examType}
        categories={categories}
        examTypes={examTypes}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onExamTypeChange={setExamType}
      />

      {isLoading ? <CourseSkeletonGrid /> : null}
      {error ? <EmptyState title="Unable to load courses" description={getApiErrorMessage(error)} /> : null}

      {!isLoading && !error ? (
        <>
          <SectionHeader eyebrow="Featured" title="Premium course formations" />
          {featured.length > 0 ? <RecommendedCourses courses={featured} /> : <EmptyState title="No featured courses" description="Featured courses will appear after seeding." />}

          <SectionHeader eyebrow="Catalog" title="All courses" action={`${courses.length} courses available`} />
          {courses.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </section>
          ) : (
            <EmptyState title="No courses found" description="Try changing search or filters." />
          )}

          <UpcomingLiveClasses />
        </>
      ) : null}
    </motion.div>
  );
}
