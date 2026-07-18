/**
 * Accessibility layer for NIDUS Experience V2.
 * It keeps skip navigation and semantic helper regions available across the journey.
 */

/**
 * Renders skip links for keyboard and assistive technology users.
 */
export function ExperienceAccessibilityLayer() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a href="#main-content" className="fixed left-4 top-4 z-[120] rounded-full bg-[#f7f3ea] px-5 py-3 text-sm font-black text-[#071d36] shadow-[0_18px_54px_rgba(7,29,54,0.18)] focus:outline-none focus:ring-2 focus:ring-[#b9913f]">
        Skip to experience
      </a>
    </div>
  );
}
