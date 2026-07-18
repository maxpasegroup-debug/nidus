"use client";

/**
 * Global cinematic shell for NIDUS Experience V2.
 * It provides the permanent framework around future storyboard scenes.
 */
import { ExperienceProvider } from "../providers";
import { ExperienceErrorBoundary, ExperienceGlobalErrorListener } from "../runtime";
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
    <ExperienceErrorBoundary boundaryId="experience-shell">
      <ExperienceProvider>
        <ExperienceGlobalErrorListener />
        <div className="relative min-h-screen overflow-x-hidden text-[#071d36]" data-experience-root>
          <ExperienceAccessibilityLayer />
          <ExperienceErrorBoundary boundaryId="experience-background">
            <ExperienceBackgroundLayer background={background} />
          </ExperienceErrorBoundary>
          <ExperienceErrorBoundary boundaryId="experience-overlays">
            <ExperienceOverlayLayer overlays={overlays} />
          </ExperienceErrorBoundary>
          <div className="pointer-events-none fixed inset-0 z-[5]" data-experience-atmosphere-layer />
          <ExperienceErrorBoundary boundaryId="experience-navigation">
            <ExperienceNavigation activeId={shellState.activeChapterId} hidden={shellState.isHidden} items={navigationItems} scrolled={shellState.isScrolled} />
          </ExperienceErrorBoundary>
          <main id="main-content" className="relative z-10" data-experience-scroll-container>
            <div className="relative" data-experience-scene-viewport>
              <ExperienceErrorBoundary boundaryId="experience-composer">{children}</ExperienceErrorBoundary>
            </div>
          </main>
          <div className="pointer-events-none fixed inset-0 z-[40]" data-experience-overlay-layer />
          <ExperienceErrorBoundary boundaryId="experience-progress">
            <ExperienceProgress activeChapterId={shellState.activeChapterId} activeSceneId={shellState.activeSceneId} chapters={chapters} progress={shellState.progress} scenes={scenes} />
          </ExperienceErrorBoundary>
          <ExperienceDebugLayer activeChapterId={shellState.activeChapterId} enabled={debug} progress={shellState.progress} scrollY={shellState.scrollY} />
        </div>
      </ExperienceProvider>
    </ExperienceErrorBoundary>
  );
}
