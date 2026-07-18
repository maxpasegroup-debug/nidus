"use client";

/**
 * Scene 20: The Moment of Pride.
 * Strong emotional payoff before the closing chapter, centered on ceremony and family pride.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders a restrained ceremonial pause for officer identity and family pride.
 */
export function MomentOfPrideScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-20-the-moment-of-pride", "immersive", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-20-the-moment-of-pride" ref={ref} mode="immersive" length="long" className="bg-[#041120] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.momentOfPride.src}
          alt={experienceSceneAssets.momentOfPride.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-72 saturate-[0.78]"
          style={{ transform: `scale(${1.05 + depth * 0.025}) translate3d(0,${depth * -14}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,17,32,0.92)_0%,rgba(4,17,32,0.42)_48%,rgba(4,17,32,0.84)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(0deg,rgba(4,17,32,1),transparent)]" />
        <div className="absolute right-[12vw] top-[16vh] h-[58vh] w-[28vw] rounded-full border border-[#e7c873]/18" />

        <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.48 }} className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[94rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Moment of Pride</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.8rem,8.4vw,8rem)] font-black leading-[0.98] tracking-normal">
              The quiet moment a family remembers.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/74 sm:text-xl">
              Achievement does not need spectacle. It needs a pause long enough to feel what the journey has made possible.
            </p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
