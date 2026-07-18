"use client";

/**
 * Scene 9: The Written Battle.
 * Academic preparation scene focused on faculty guidance, silence, and question solving.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const solvingSteps = ["Read", "Think", "Solve", "Correct"];

/**
 * Renders the classroom preparation atmosphere before the story moves into physical discipline.
 */
export function WrittenBattleScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-09-the-written-battle", "split", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-09-the-written-battle" ref={ref} mode="split" length="medium" className="bg-[#071522] text-white">
      <div className="grid min-h-screen items-stretch lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[34rem] overflow-hidden">
          <Image
            src={experienceSceneAssets.writtenBattle.src}
            alt={experienceSceneAssets.writtenBattle.alt}
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover opacity-74 saturate-[0.72]"
            style={{ transform: `scale(1.08) translate3d(0,${depth * -24}px,0)` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,34,0.10),rgba(7,21,34,0.80))]" />
        </div>

        <div className="flex items-center px-4 py-24 sm:px-8 lg:px-12">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="w-full">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Written Battle</p>
            <h2 className="mt-5 text-[clamp(3rem,6.6vw,6.2rem)] font-black leading-[0.98] tracking-normal">
              Silence becomes strategy.
            </h2>
            <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-white/72 sm:text-lg">
              In the classroom, concentration becomes a form of courage. Faculty guidance turns pressure into method.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {solvingSteps.map((step) => (
                <div key={step} className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e7c873]">{step}</p>
                  <div className="mt-4 h-1 rounded-full bg-white/12">
                    <div className="h-1 w-2/3 rounded-full bg-[#e7c873]" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
