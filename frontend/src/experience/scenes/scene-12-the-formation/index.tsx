"use client";

/**
 * Scene 12: The Formation.
 * Belonging scene where the individual becomes part of a disciplined team.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the formation and shared-purpose moment that closes this chapter.
 */
export function FormationScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-12-the-formation", "immersive", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-12-the-formation" ref={ref} mode="immersive" length="long" className="bg-[#05111f] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.formation.src}
          alt={experienceSceneAssets.formation.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-74 saturate-[0.78]"
          style={{ transform: `scale(1.06) translate3d(0,${depth * -20}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,17,31,0.88)_0%,rgba(5,17,31,0.40)_48%,rgba(5,17,31,0.74)_100%)]" />
        <div className="absolute left-1/2 top-[18vh] h-[68vh] w-px bg-[#e7c873]/28" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-[linear-gradient(0deg,rgba(5,17,31,1),transparent)]" />

        <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[96rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Formation</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.8rem,8.2vw,7.9rem)] font-black leading-[0.98] tracking-normal">
              The individual becomes part of something larger.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/76 sm:text-xl">
              Shared purpose changes the sound of preparation. The visitor should feel: I belong here.
            </p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
