"use client";

/**
 * Root provider for NIDUS Experience V2 foundations.
 * It combines scene registration with future adapter space for smooth-scroll engines.
 */
import type { ReactNode } from "react";
import { ExperienceChapterProvider } from "../chapters";
import { ExperienceScrollProvider } from "../scroll";

/**
 * Provides shared Experience V2 runtime context to future cinematic scenes.
 */
export function ExperienceProvider({ children }: { children: ReactNode }) {
  return (
    <ExperienceChapterProvider>
      <ExperienceScrollProvider>{children}</ExperienceScrollProvider>
    </ExperienceChapterProvider>
  );
}
