"use client";

/**
 * Scroll progress hook for NIDUS Experience V2.
 * It reports normalized progress for any scene element without scene-specific logic.
 */
import { useEffect, useRef, useState } from "react";
import { clampProgress } from "../motion";
import { logExperienceWarning } from "../runtime";

/**
 * Tracks an element's scroll progress from first contact to complete exit.
 */
export function useScrollProgress<TElement extends HTMLElement>() {
  const ref = useRef<TElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      try {
        const node = ref.current;
        if (!node || typeof window === "undefined") return;
        const rect = node.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const total = rect.height + viewportHeight;
        const current = viewportHeight - rect.top;
        setProgress(clampProgress(current / total));
      } catch (error) {
        logExperienceWarning("scroll-progress-failed", "Scene scroll progress update failed.", error);
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
  }, []);

  return { ref, progress };
}
