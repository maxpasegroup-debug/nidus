"use client";

/**
 * Motion preference hook for NIDUS Experience V2.
 * It lets future scenes respect visitors who prefer reduced motion.
 */
import { useEffect, useState } from "react";

/**
 * Returns true when the visitor has requested reduced motion at the system level.
 */
export function useReducedMotionSetting() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return reduced;
}
