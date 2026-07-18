"use client";

/**
 * Global cinematic shell for NIDUS Experience V2.
 * It provides the permanent framework around future storyboard scenes.
 */
import { ExperienceProvider } from "../providers";
import { ExperienceAccessibilityLayer } from "./accessibility";
import { ExperienceBackgroundLayer } from "./background";
import { ExperienceDebugLayer } from "./debug";
import { ExperienceNavigation } from "./navigation";
import { ExperienceOverlayLayer } from "./overlays";
import { ExperienceProgress } from "./progress";
import type { ExperienceShellProps } from "./types";
import { useExperienceShellState } from "./use-shell-state";

/**
 * Wraps future cinematic scenes with background, atmosphere, navigation, progress, and accessibility layers.
 */
export function ExperienceShell({ background, chapters = [], children, debug = false, navigationItems = [], overlays = [], scenes = [] }: ExperienceShellProps) {
  const shellState = useExperienceShellState(chapters, scenes);

  return (
    <ExperienceProvider>
      <div className="relative min-h-screen overflow-x-hidden text-[#071d36]" data-experience-root>
        <ExperienceAccessibilityLayer />
        <ExperienceBackgroundLayer background={background} />
        <ExperienceOverlayLayer overlays={overlays} />
        <div className="pointer-events-none fixed inset-0 z-[5]" data-experience-atmosphere-layer />
        <ExperienceNavigation activeId={shellState.activeChapterId} hidden={shellState.isHidden} items={navigationItems} scrolled={shellState.isScrolled} />
        <main id="main-content" className="relative z-10" data-experience-scroll-container>
          <div className="relative" data-experience-scene-viewport>{children}</div>
        </main>
        <div className="pointer-events-none fixed inset-0 z-[40]" data-experience-overlay-layer />
        <ExperienceProgress activeChapterId={shellState.activeChapterId} activeSceneId={shellState.activeSceneId} chapters={chapters} progress={shellState.progress} scenes={scenes} />
        <ExperienceDebugLayer activeChapterId={shellState.activeChapterId} enabled={debug} progress={shellState.progress} scrollY={shellState.scrollY} />
      </div>
    </ExperienceProvider>
  );
}
