"use client";

/**
 * Scene 10: The Body Learns Discipline.
 * A stronger motion scene showing endurance, breath, rhythm, and physical training.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders a cinematic tracking movement through physical training.
 */
export function BodyLearnsDisciplineScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-10-the-body-learns-discipline", "parallax", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-10-the-body-learns-discipline" ref={ref} mode="parallax" length="long" className="bg-[#06111d] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.bodyLearnsDiscipline.src}
          alt={experienceSceneAssets.bodyLearnsDiscipline.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-76 saturate-[0.86]"
          style={{ transform: `scale(${1.08 + depth * 0.04}) translate3d(${depth * -28}px,0,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,17,29,0.92)_0%,rgba(6,17,29,0.36)_50%,rgba(6,17,29,0.74)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(6,17,29,1),transparent)]" />

        <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[96rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Body Learns Discipline</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.6rem,8vw,7.8rem)] font-black leading-[0.98] tracking-normal">
              Breath finds rhythm. Rhythm becomes will.
            </h2>
            <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3">
              {["Run", "Endure", "Repeat"].map((word) => (
                <div key={word} className="border-t border-[#e7c873]/44 pt-4 text-sm font-black uppercase tracking-[0.24em] text-white/84">
                  {word}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
