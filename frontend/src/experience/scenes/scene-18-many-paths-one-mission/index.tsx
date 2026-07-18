"use client";

/**
 * Scene 18: Many Paths, One Mission.
 * Presents defence opportunities as connected journeys rather than separate products.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const pathways = ["NDA", "CDS", "AFCAT", "Agniveer", "SSB", "Military Schools"];

/**
 * Renders a unified defence pathway map under one mission.
 */
export function ManyPathsOneMissionScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-18-many-paths-one-mission", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-18-many-paths-one-mission" ref={ref} mode="layered" length="medium" className="bg-[#f8f5ed] text-[#06172b]">
      <div className="relative min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.manyPathsOneMission.src}
          alt={experienceSceneAssets.manyPathsOneMission.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-12 saturate-[0.7]"
          style={{ transform: `scale(1.05) translate3d(0,${depth * -12}px,0)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.92),rgba(248,245,237,0.94)_58%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[94rem] flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">Many Paths, One Mission</p>
            <h2 className="mt-5 text-[clamp(3rem,6.8vw,6.5rem)] font-black leading-[0.98] tracking-normal">
              Different gates. One discipline.
            </h2>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("timelineReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.28 }} className="mt-14 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {pathways.map((path, index) => (
              <div key={path} className="min-h-40 rounded-3xl border border-[#d9caa8] bg-white/76 p-5 shadow-[0_18px_46px_rgba(6,23,43,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a87d22]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-6 text-2xl font-black text-[#06172b]">{path}</p>
                <div className="mt-7 h-px bg-[#d8c8a6]" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
