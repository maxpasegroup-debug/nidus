"use client";

/**
 * Scene 17: The Future Self.
 * Helps the visitor visualize the officer identity they are becoming.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders a slow cinematic reflection between present preparation and future officer identity.
 */
export function FutureSelfScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-17-the-future-self", "pinned", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-17-the-future-self" ref={ref} mode="pinned" length="long" className="bg-[#05111f] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.futureSelf.src}
          alt={experienceSceneAssets.futureSelf.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-64 saturate-[0.74]"
          style={{ transform: `scale(1.06) translate3d(0,${depth * -18}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,17,31,0.92)_0%,rgba(5,17,31,0.46)_50%,rgba(5,17,31,0.88)_100%)]" />
        <div className="absolute left-1/2 top-[14vh] h-[72vh] w-px bg-[#e7c873]/28" />
        <div className="absolute inset-x-[18vw] top-[20vh] h-[60vh] rounded-t-full border border-[#e7c873]/18" />

        <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.48 }} className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[94rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Future Self</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.8rem,8.2vw,7.8rem)] font-black leading-[0.98] tracking-normal">
              One day, the reflection looks back with command.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/74 sm:text-xl">
              The person in preparation begins to recognize the officer they can become.
            </p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
