/**
 * Subtle global progress system for NIDUS Experience V2.
 * It communicates scroll progress, current chapter, and reading position.
 */
import { cn } from "@/components/design-system/utils";
import type { ExperienceChapter, ExperienceSceneIndicator } from "./types";

type ExperienceProgressProps = {
  activeChapterId?: string;
  activeSceneId?: string;
  chapters?: ExperienceChapter[];
  progress: number;
  scenes?: ExperienceSceneIndicator[];
};

/**
 * Renders reading progress and current chapter indicators.
 */
export function ExperienceProgress({ activeChapterId, activeSceneId, chapters = [], progress, scenes = [] }: ExperienceProgressProps) {
  const activeIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeChapterId));
  const activeChapter = chapters[activeIndex];
  const activeScene = scenes.find((scene) => scene.id === activeSceneId);
  const percentage = Math.round(progress * 100);

  return (
    <aside aria-label="Experience progress" className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[96rem] items-end justify-between gap-4">
        <div className="hidden rounded-full border border-[#071d36]/10 bg-white/72 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#071d36] shadow-[0_10px_28px_rgba(7,29,54,0.06)] backdrop-blur-xl sm:block">
          {activeChapter ? activeChapter.label : "NIDUS"} <span className="ml-2 text-[#64748b]">{percentage}%</span>
          {activeScene ? <span className="ml-3 hidden text-[#64748b] lg:inline">{activeScene.label}</span> : null}
        </div>
        <div className="w-full max-w-xs rounded-full border border-[#071d36]/10 bg-white/58 p-1 shadow-[0_10px_28px_rgba(7,29,54,0.06)] backdrop-blur-xl sm:w-80">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#071d36]/10">
            <div className="h-full rounded-full bg-[#b9913f] transition-[width] duration-150" style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-[#071d36]/10 bg-white/72 px-3 py-2 shadow-[0_10px_28px_rgba(7,29,54,0.06)] backdrop-blur-xl md:flex">
          {chapters.map((chapter, index) => (
            <span key={chapter.id} aria-label={chapter.label} className={cn("h-1.5 rounded-full transition-all", index === activeIndex ? "w-6 bg-[#b9913f]" : "w-1.5 bg-[#071d36]/20")} />
          ))}
        </div>
      </div>
    </aside>
  );
}
