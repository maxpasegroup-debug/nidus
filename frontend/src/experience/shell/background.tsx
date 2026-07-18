/**
 * Global background system for the NIDUS Experience V2 shell.
 * It supports static, gradient, image, and atmospheric background states.
 */
import { cn } from "@/components/design-system/utils";
import type { ExperienceBackgroundState } from "./types";

const toneClasses = {
  dawn: "bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.24),transparent_28rem),linear-gradient(135deg,#071d36_0%,#f7f3ea_56%,#dce9f3_100%)]",
  ivory: "bg-[linear-gradient(135deg,#fbf8f1_0%,#f7f3ea_58%,#eef4f8_100%)]",
  navy: "bg-[radial-gradient(circle_at_50%_0%,rgba(185,145,63,0.16),transparent_30rem),linear-gradient(135deg,#041120_0%,#071d36_100%)]",
  gold: "bg-[radial-gradient(circle_at_22%_18%,rgba(231,200,115,0.32),transparent_24rem),linear-gradient(135deg,#fbf8f1_0%,#f7f3ea_100%)]",
  steel: "bg-[linear-gradient(135deg,#eef4f8_0%,#f7f3ea_58%,#ffffff_100%)]"
};

/**
 * Renders the permanent background layer behind all experience scenes.
 */
export function ExperienceBackgroundLayer({ background }: { background?: ExperienceBackgroundState }) {
  const tone = background?.tone ?? "ivory";
  const mode = background?.mode ?? "gradient";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className={cn("absolute inset-0 transition-colors duration-700", toneClasses[tone])} />
      {mode === "image" && background?.imageUrl ? <div className="absolute inset-0 bg-cover bg-center opacity-[0.32] transition-opacity duration-700" style={{ backgroundImage: `url(${background.imageUrl})` }} /> : null}
      {mode === "atmospheric" ? <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#e7c873]/18 blur-[96px]" /> : null}
      {mode === "atmospheric" ? <div className="absolute -right-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-[#6e8faf]/16 blur-[120px]" /> : null}
    </div>
  );
}
