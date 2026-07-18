"use client";

/**
 * Scene 8: The Academy System.
 * Converts emotional belief into confidence by showing the complete preparation structure.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const pathways = [
  "Academic planner",
  "Physical training schedule",
  "Mentor reviews",
  "Test preparation",
  "Progress structure"
];

/**
 * Renders a top-down mission planning composition for the NIDUS system.
 */
export function AcademySystemScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-08-the-academy-system", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-08-the-academy-system" ref={ref} mode="layered" length="medium" className="bg-[#f7f3ea] text-[#06172b]">
      <div className="mx-auto grid min-h-screen w-full max-w-[92rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">The Academy System</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(3rem,6.8vw,6.5rem)] font-black leading-[0.98] tracking-normal">
            Success has a structure.
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
            Every class, run, review, test and correction becomes part of one connected path.
          </p>
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[36rem] overflow-hidden rounded-[2rem] border border-[#d9caa8] bg-[#efe7d8] shadow-[0_32px_90px_rgba(6,23,43,0.16)]">
          <Image
            src={experienceSceneAssets.academySystem.src}
            alt={experienceSceneAssets.academySystem.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-22 saturate-[0.75]"
            style={{ transform: `scale(1.05) translate3d(0,${depth * -18}px,0)` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.82),rgba(239,231,216,0.92)_62%)]" />
          <div className="relative z-10 grid min-h-[36rem] content-center gap-4 p-6 sm:p-8">
            {pathways.map((item, index) => (
              <div key={item} className="grid grid-cols-[2.75rem_1fr] items-center gap-4 rounded-2xl border border-[#d4c49f] bg-white/74 p-4 backdrop-blur-md">
                <span className="flex size-11 items-center justify-center rounded-full bg-[#06172b] text-sm font-black text-[#e7c873]">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[#06172b]">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
