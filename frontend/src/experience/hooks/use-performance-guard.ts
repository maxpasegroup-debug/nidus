"use client";

/**
 * Performance guard hook for NIDUS Experience V2.
 * It gives future scenes a single place to decide when heavy effects should be avoided.
 */
import { useEffect, useState } from "react";
import { useReducedMotionSetting } from "./use-reduced-motion-setting";

/**
 * Returns conservative flags for reducing expensive visual work on constrained contexts.
 */
export function usePerformanceGuard() {
  const prefersReducedMotion = useReducedMotionSetting();
  const [isLowPowerViewport, setIsLowPowerViewport] = useState(false);

  useEffect(() => {
    const update = () => setIsLowPowerViewport(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    prefersReducedMotion,
    isLowPowerViewport,
    shouldReduceEffects: prefersReducedMotion || isLowPowerViewport
  };
}
