"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/types/course";
import { ProgressBar } from "@/components/courses/progress-bar";

export function CourseCard({
  course,
  progress
}: {
  course: Course;
  progress?: number;
}) {
  return (
    <motion.article whileHover={{ y: -6 }} className="h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.065] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-gold/35"
      >
        <div className="relative h-44 overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded border border-gold/30 bg-navy-deep/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
            {course.examType}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{course.category}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{course.title}</h3>
            </div>
            {course.isPremium ? (
              <span className="rounded bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">Premium</span>
            ) : null}
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{course.description}</p>
          <div className="mt-5 flex items-center justify-between text-sm text-muted">
            <span>{course.duration}</span>
            <span className="font-semibold text-gold-soft">Rs {course.price.toLocaleString("en-IN")}</span>
          </div>
          {typeof progress === "number" ? (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}
