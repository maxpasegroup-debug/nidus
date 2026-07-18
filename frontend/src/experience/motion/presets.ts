/**
 * Reusable Framer Motion presets for NIDUS Experience V2.
 * These presets encode the approved cinematic language without binding it to a specific scene.
 */
import type { Variants, Transition } from "framer-motion";
import type { ExperienceMotionName } from "../types";

export const experienceEasings = {
  cinematic: [0.16, 1, 0.3, 1],
  precise: [0.2, 0, 0, 1],
  exit: [0.7, 0, 0.84, 0],
  weighted: [0.22, 0.61, 0.36, 1]
} as const;

export const experienceDurations = {
  fast: 0.18,
  medium: 0.52,
  slow: 0.9,
  cinematic: 1.25
} as const;

const cinematicTransition: Transition = {
  duration: experienceDurations.slow,
  ease: experienceEasings.cinematic
};

export const experienceMotionPresets: Record<ExperienceMotionName, Variants> = {
  heroReveal: {
    hidden: { opacity: 0, y: 42, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: cinematicTransition }
  },
  sectionReveal: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: experienceDurations.medium, ease: experienceEasings.cinematic } }
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: experienceDurations.medium, ease: experienceEasings.precise } }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: cinematicTransition }
  },
  parallax: {
    hidden: { opacity: 0, y: 56 },
    visible: { opacity: 1, y: 0, transition: { duration: experienceDurations.cinematic, ease: experienceEasings.weighted } }
  },
  pinnedScene: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: cinematicTransition }
  },
  timelineReveal: {
    hidden: { opacity: 0, x: -18 },
    visible: { opacity: 1, x: 0, transition: { duration: experienceDurations.medium, ease: experienceEasings.precise } }
  },
  imageReveal: {
    hidden: { opacity: 0, scale: 1.04, filter: "blur(14px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: experienceDurations.cinematic, ease: experienceEasings.cinematic } }
  },
  buttonInteraction: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: experienceDurations.fast, ease: experienceEasings.precise } }
  },
  cardInteraction: {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: experienceDurations.medium, ease: experienceEasings.cinematic } }
  },
  pageTransition: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: experienceDurations.medium, ease: experienceEasings.precise } }
  },
  loading: {
    hidden: { opacity: 0.45 },
    visible: { opacity: 1, transition: { duration: experienceDurations.slow, repeat: Infinity, repeatType: "reverse", ease: experienceEasings.precise } }
  },
  success: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: experienceDurations.medium, ease: experienceEasings.cinematic } }
  }
};

/**
 * Returns a named cinematic motion preset.
 */
export function getExperienceMotionPreset(name: ExperienceMotionName): Variants {
  return experienceMotionPresets[name];
}

/**
 * Builds a stagger transition for ordered cinematic reveals.
 */
export function createStaggerTransition(delayChildren = 0.08, staggerChildren = 0.08): Transition {
  return { delayChildren, staggerChildren };
}
