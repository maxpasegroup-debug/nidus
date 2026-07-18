/**
 * Central animation sequencing helpers for NIDUS Experience V2.
 * These utilities create shared timing and scroll-progress math for future scenes.
 */
import type { Transition, Variants } from "framer-motion";
import { experienceDurations, experienceEasings } from "./presets";

export type RevealSequenceItem = {
  id: string;
  delay?: number;
  duration?: number;
};

/**
 * Creates a parent variant with children revealed in a cinematic sequence.
 */
export function createRevealTimeline(items: RevealSequenceItem[]): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: items.length > 6 ? 0.055 : 0.085,
        delayChildren: items[0]?.delay ?? 0
      }
    }
  };
}

/**
 * Creates a weighted transition for high-emotion scene movement.
 */
export function createWeightedTransition(duration = experienceDurations.slow): Transition {
  return { duration, ease: experienceEasings.weighted };
}

/**
 * Clamps scroll progress into a safe 0 to 1 range.
 */
export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Maps a scene progress range into a local 0 to 1 animation segment.
 */
export function mapProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clampProgress((progress - start) / (end - start));
}

/**
 * Converts a normalized progress value into a numeric depth offset.
 */
export function createDepthOffset(progress: number, depth = 32): number {
  return (clampProgress(progress) - 0.5) * depth;
}
