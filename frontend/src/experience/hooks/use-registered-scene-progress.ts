"use client";

/**
 * Registers a scene and tracks its scroll progress through the shared Experience scroll engine.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useExperienceScrollRegistry } from "../scroll";
import type { ExperienceSceneLength, ExperienceSceneMode } from "../types";
import { useScrollProgress } from "./use-scroll-progress";

/**
 * Returns a ref callback and normalized progress for a registered cinematic scene.
 */
export function useRegisteredSceneProgress<TElement extends HTMLElement>(id: string, mode: ExperienceSceneMode, length: ExperienceSceneLength) {
  const { ref, progress } = useScrollProgress<TElement>();
  const { registerScene, updateSceneProgress } = useExperienceScrollRegistry();
  const registration = useMemo(() => ({ id, mode, length }), [id, mode, length]);
  const register = useMemo(() => registerScene(registration), [registerScene, registration]);

  const setRef = useCallback((element: TElement | null) => {
    ref.current = element;
    register(element);
  }, [ref, register]);

  useEffect(() => {
    const element = ref.current;
    let bounds: DOMRectReadOnly | null = null;
    try {
      bounds = element ? element.getBoundingClientRect() : null;
    } catch {
      bounds = null;
    }
    updateSceneProgress({
      id,
      progress,
      isActive: progress > 0 && progress < 1,
      bounds
    });
  }, [id, progress, ref, updateSceneProgress]);

  return { progress, ref: setRef };
}
