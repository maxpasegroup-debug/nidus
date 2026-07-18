"use client";

/**
 * Global shell behavior hook for NIDUS Experience V2.
 * It centralizes scroll state, reveal state, and active chapter detection.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { logExperienceWarning } from "../runtime";
import type { ExperienceChapter, ExperienceSceneIndicator } from "./types";

const SCROLLED_OFFSET = 32;
const HIDDEN_OFFSET = 140;

/**
 * Tracks shell state such as scrolled, hidden, revealed, progress, and active chapter.
 */
export function useExperienceShellState(chapters: ExperienceChapter[], scenes: ExperienceSceneIndicator[] = []) {
  const [scrollY, setScrollY] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id ?? "");
  const [activeSceneId, setActiveSceneId] = useState(scenes[0]?.id ?? "");
  const previousScrollY = useRef(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      try {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        const nextY = window.scrollY;
        const documentHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const nextProgress = Math.min(1, Math.max(0, nextY / documentHeight));
        const scrollingDown = nextY > previousScrollY.current;
        setScrollY(nextY);
        setProgress(nextProgress);
        setIsHidden(scrollingDown && nextY > HIDDEN_OFFSET);
        previousScrollY.current = nextY;

        const active = chapters.findLast((chapter) => {
          const node = document.getElementById(chapter.id);
          return node ? node.getBoundingClientRect().top <= window.innerHeight * 0.42 : false;
        });
        if (active) setActiveChapterId(active.id);

        const activeScene = scenes.findLast((scene) => {
          const node = document.getElementById(scene.id);
          return node ? node.getBoundingClientRect().top <= window.innerHeight * 0.45 : false;
        });
        if (activeScene) setActiveSceneId(activeScene.id);
      } catch (error) {
        logExperienceWarning("shell-state-update-failed", "Experience shell state update failed.", error);
      }
    };

    const requestUpdate = () => {
      if (typeof requestAnimationFrame === "undefined") {
        update();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    if (typeof window === "undefined") return;
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [chapters, scenes]);

  return useMemo(() => ({
    activeChapterId,
    activeSceneId,
    isHidden,
    isRevealed: !isHidden,
    isScrolled: scrollY > SCROLLED_OFFSET,
    progress,
    scrollY
  }), [activeChapterId, activeSceneId, isHidden, progress, scrollY]);
}
