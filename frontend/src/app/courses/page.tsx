"use client";

import { motion } from "framer-motion";
import { useMemo, useState, type FormEvent } from "react";
import { CourseCard } from "@/components/courses/course-card";
import { CourseSkeletonGrid, EmptyState } from "@/components/courses/empty-state";
import { FilterBar } from "@/components/courses/filter-bar";
import { RecommendedCourses, UpcomingLiveClasses } from "@/components/courses/course-widgets";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { getApiErrorMessage } from "@/services/api";

export default function CoursesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState("");
  const { data: courses = [], isLoading, error } = useCourses({ search, category, examType });
  const createCourse = useCreateCourse();

  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))), [courses]);
  const examTypes = useMemo(() => Array.from(new Set(courses.map((course) => course.examType))), [courses]);
  const featured = courses.filter((course) => course.isPremium).slice(0, 3);
  const isAdmin = user?.role === "ADMIN";

  function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    createCourse.mutate(
      {
        title: String(data.get("title") ?? ""),
        slug: String(data.get("slug") ?? ""),
        description: String(data.get("description") ?? ""),
        thumbnail: String(data.get("thumbnail") ?? ""),
        category: String(data.get("category") ?? ""),
        examType: String(data.get("examType") ?? ""),
        duration: String(data.get("duration") ?? ""),
        price: Number(data.get("price") ?? 0),
        isPremium: data.get("isPremium") === "on"
      },
      {
        onSuccess: () => form.reset()
      }
    );
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-gradient-to-br from-white/10 to-white/[0.04] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">LMS / Learning Hub</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Manage online and hybrid courses</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Create course tracks, upload recorded lessons, attach PDFs, plan live classes, and give students a simple learning path.
        </p>
      </section>

      {isAdmin ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCreateCourse} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <SectionHeader eyebrow="Course Builder" title="Create a course shell" action="Admin only" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="title" label="Course title" placeholder="NDA Foundation 2026" required />
              <Input name="slug" label="Course slug" placeholder="nda-foundation-2026" required />
              <Input name="category" label="Category" placeholder="Foundation" required />
              <Input name="examType" label="Exam type" placeholder="NDA" required />
              <Input name="duration" label="Duration" placeholder="6 months" required />
              <Input name="price" label="Price" type="number" min="0" placeholder="15000" required />
              <Input name="thumbnail" label="Thumbnail URL" placeholder="https://images.unsplash.com/..." required className="md:col-span-2" />
              <Input name="description" label="Description" placeholder="Complete NDA learning path with tests and mentoring." required className="md:col-span-2" />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-muted">
              <input name="isPremium" type="checkbox" className="h-4 w-4 rounded border-white/20 bg-navy-deep" />
              Premium course
            </label>
            <Button type="submit" className="mt-5 w-full" disabled={createCourse.isPending}>{createCourse.isPending ? "Creating..." : "Create course"}</Button>
          </form>
          <div className="grid gap-4">
            <AnnouncementCard title="1. Create course shell" description="Add title, exam, price, duration, and thumbnail so the course appears in the catalog." tag="Step" />
            <AnnouncementCard title="2. Upload lessons" description="Use Media Library for video lessons, PDFs, notes, assignments, and lecture folders." tag="Step" />
            <AnnouncementCard title="3. Assign and monitor" description="Use dashboards to connect students, tests, live classes, and progress reports." tag="Step" />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={String(courses.length)} note="Visible catalog items" />
        <StatCard label="Categories" value={String(categories.length)} note="Course groupings" />
        <StatCard label="Exam Tracks" value={String(examTypes.length)} note="NDA, CDS, AFCAT and more" />
        <StatCard label="Premium" value={String(courses.filter((course) => course.isPremium).length)} note="Paid course programs" />
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
          {featured.length > 0 ? <RecommendedCourses courses={featured} /> : <EmptyState title="No featured courses" description="Featured courses will appear after they are created and marked premium." />}

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

          {isAdmin ? (
            <>
              <SectionHeader eyebrow="LMS Shortcuts" title="Manage course assets" />
              <section className="grid gap-4 md:grid-cols-3">
                <QuickActionCard title="Upload videos and PDFs" description="Keep lectures, notes, worksheets, and folders in the media library." href="/media-library" />
                <QuickActionCard title="Schedule live classes" description="Manage upcoming online and hybrid live sessions." href="/live-classes" />
                <QuickActionCard title="Create linked tests" description="Add course practice tests and monthly assessments." href="/tests" />
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </motion.div>
  );
}
