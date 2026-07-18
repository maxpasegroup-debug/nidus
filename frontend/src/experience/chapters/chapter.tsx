"use client";

/**
 * Chapter grouping primitive for NIDUS Experience V2.
 * It registers chapter metadata for future navigation and analytics while preserving scene behavior.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExperienceChapterMetadata } from "../types";

type ExperienceChapterContextValue = {
  chapters: ExperienceChapterMetadata[];
  registerChapter: (chapter: ExperienceChapterMetadata) => void;
};

const ExperienceChapterContext = createContext<ExperienceChapterContextValue | null>(null);

/**
 * Provides chapter registration for future lazy loading, analytics, and chapter navigation.
 */
export function ExperienceChapterProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<ExperienceChapterMetadata[]>([]);

  const registerChapter = useCallback((chapter: ExperienceChapterMetadata) => {
    setChapters((current) => {
      const existing = current.findIndex((item) => item.id === chapter.id);
      if (existing >= 0) {
        const next = [...current];
        next[existing] = chapter;
        return next.sort((a, b) => a.order - b.order);
      }
      return [...current, chapter].sort((a, b) => a.order - b.order);
    });
  }, []);

  const value = useMemo(() => ({ chapters, registerChapter }), [chapters, registerChapter]);

  return <ExperienceChapterContext.Provider value={value}>{children}</ExperienceChapterContext.Provider>;
}

/**
 * Reads registered chapter metadata.
 */
export function useExperienceChapters() {
  const context = useContext(ExperienceChapterContext);
  if (!context) throw new Error("useExperienceChapters must be used inside ExperienceChapterProvider.");
  return context;
}

type ChapterProps = {
  metadata: ExperienceChapterMetadata;
  children: ReactNode;
  className?: string;
};

/**
 * Groups scenes under a stable chapter boundary without adding visual behavior.
 */
export function Chapter({ metadata, children, className }: ChapterProps) {
  const context = useContext(ExperienceChapterContext);

  useEffect(() => {
    context?.registerChapter(metadata);
  }, [context, metadata]);

  return (
    <section className={className} data-chapter-id={metadata.id} data-chapter-order={metadata.order} aria-label={metadata.title}>
      {children}
    </section>
  );
}
