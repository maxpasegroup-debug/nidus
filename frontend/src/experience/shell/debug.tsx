/**
 * Development-only debug layer for the NIDUS Experience V2 shell.
 * It is inert unless explicitly enabled in a non-production environment.
 */
type ExperienceDebugLayerProps = {
  activeChapterId?: string;
  enabled?: boolean;
  progress: number;
  scrollY: number;
};

/**
 * Renders shell diagnostics for development builds only.
 */
export function ExperienceDebugLayer({ activeChapterId, enabled = false, progress, scrollY }: ExperienceDebugLayerProps) {
  if (!enabled || process.env.NODE_ENV === "production") return null;

  return (
    <aside className="fixed bottom-20 right-4 z-[110] rounded-lg border border-[#071d36]/12 bg-white/88 p-3 text-xs font-semibold text-[#071d36] shadow-[0_18px_54px_rgba(7,29,54,0.14)] backdrop-blur-xl" aria-label="Experience debug information">
      <p>chapter: {activeChapterId || "none"}</p>
      <p>progress: {Math.round(progress * 100)}%</p>
      <p>scrollY: {Math.round(scrollY)}</p>
    </aside>
  );
}
