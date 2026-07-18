"use client";

/**
 * Scene 1: The First Breath.
 * Immersive dawn opening that slows the visitor before the officer journey begins.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/components/design-system/utils";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the opening dawn scene with no CTA and a natural handoff into Scene 2.
 */
export function FirstBreathScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-01-first-breath", "pinned", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;
  const imageScale = 1.08 - depth * 0.035;
  const dawnOpacity = Math.min(0.9, 0.16 + depth * 0.92);
  const fieldOpacity = Math.min(0.72, 0.18 + depth * 0.62);

  return (
    <SceneContainer id="scene-01-first-breath" ref={ref} mode="pinned" length="long" className="bg-[#041120] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={experienceSceneAssets.firstBreathGround.src}
            alt={experienceSceneAssets.firstBreathGround.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55 saturate-[0.72]"
            style={{ transform: `scale(${imageScale}) translate3d(0,${depth * -18}px,0)` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,17,32,0.92)_0%,rgba(7,29,54,0.74)_42%,rgba(7,29,54,0.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-[linear-gradient(0deg,rgba(247,243,234,0.82)_0%,rgba(231,200,115,0.34)_28%,transparent_72%)]" style={{ opacity: dawnOpacity }} />
          <div className="absolute inset-x-0 bottom-[12vh] h-px bg-[#e7c873]" style={{ opacity: fieldOpacity }} />
          <div className={cn("absolute left-1/2 top-[56%] h-[30rem] w-[70vw] -translate-x-1/2 rounded-full bg-[#e7c873]/16 blur-[110px]", shouldReduceEffects ? "opacity-20" : "opacity-60")} />
        </div>

        <div className="relative z-10 flex min-h-screen items-end px-4 pb-[18vh] sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="mx-auto w-full max-w-[96rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">NIDUS Defence Academy</p>
            <h1 className="mt-6 max-w-5xl text-[clamp(4rem,9vw,8.5rem)] font-black leading-[0.98] tracking-normal">
              Before the uniform, there is a decision.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/76 sm:text-xl">
              A quiet morning. A training ground. The first breath before discipline begins.
            </p>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
