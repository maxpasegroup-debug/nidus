"use client";

/**
 * Image optimization helper for NIDUS Experience V2.
 * It centralizes media loading intent so future scenes do not invent local rules.
 */
import { useMemo } from "react";

export type OptimizedImageIntent = "hero" | "cinematic" | "content" | "background";

/**
 * Returns recommended image priority and sizes for a given cinematic usage intent.
 */
export function useOptimizedImage(intent: OptimizedImageIntent) {
  return useMemo(() => {
    if (intent === "hero") return { priority: true, sizes: "100vw" };
    if (intent === "cinematic") return { priority: false, sizes: "(min-width: 1024px) 90vw, 100vw" };
    if (intent === "background") return { priority: false, sizes: "100vw" };
    return { priority: false, sizes: "(min-width: 1024px) 50vw, 100vw" };
  }, [intent]);
}
