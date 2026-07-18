"use client";

/**
 * Scene 3: The Dream Appears.
 * First major aspirational peak that expands the private dream into a defence future.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the defence aspiration scene with restrained parallax and no CTA.
 */
export function DreamAppearsScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-03-dream-appears", "parallax", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;
  const imageScale = 1.08 + depth * 0.035;

  return (
    <SceneContainer id="scene-03-dream-appears" ref={ref} mode="parallax" length="long" className="bg-[#071d36] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.dreamAppears.src}
          alt={experienceSceneAssets.dreamAppears.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-76 saturate-[0.9]"
          style={{ transform: `scale(${imageScale}) translate3d(0,${depth * -26}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,17,32,0.84)_0%,rgba(7,29,54,0.56)_44%,rgba(7,29,54,0.18)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(247,243,234,0.28)_0%,transparent_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-[linear-gradient(0deg,rgba(4,17,32,0.86)_0%,transparent_100%)]" />

        <div className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="mx-auto w-full max-w-[96rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Dream Appears</p>
            <h2 className="mt-6 max-w-6xl text-[clamp(4rem,9vw,9rem)] font-black leading-[0.96] tracking-normal">
              The uniform is not a costume. It is a future self.
            </h2>
            <p className="mt-7 max-w-3xl text-base font-semibold leading-8 text-white/76 sm:text-2xl">
              For a moment, the private dream becomes visible: service, honour, family pride, and the life of an officer.
            </p>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
