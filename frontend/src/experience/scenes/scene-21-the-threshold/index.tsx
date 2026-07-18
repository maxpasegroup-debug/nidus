"use client";

/**
 * Scene 21: The Threshold.
 * Creates the feeling of standing at the entrance to a life-changing journey.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders an open academy pathway with quiet anticipation and no primary CTA.
 */
export function ThresholdScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-21-the-threshold", "immersive", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-21-the-threshold" ref={ref} mode="immersive" length="long" className="bg-[#041120] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.threshold.src}
          alt={experienceSceneAssets.threshold.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-68 saturate-[0.78]"
          style={{ transform: `scale(1.06) translate3d(0,${depth * -20}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,17,32,0.94)_0%,rgba(4,17,32,0.42)_50%,rgba(4,17,32,0.82)_100%)]" />
        <div className="absolute inset-x-[18vw] top-[18vh] h-[62vh] rounded-t-[4rem] border-x border-t border-[#e7c873]/22" />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-[linear-gradient(0deg,rgba(4,17,32,1),transparent)]" />

        <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.48 }} className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[94rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Threshold</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.8rem,8.2vw,7.8rem)] font-black leading-[0.98] tracking-normal">
              The entrance is quiet. The decision is not.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/74 sm:text-xl">
              A path opens. The visitor stands before it with anticipation, not pressure.
            </p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
