"use client";

/**
 * Scene 5: The Question Of Identity.
 * Slow mirror composition with negative space and minimal movement.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the introspective identity scene where the visitor asks who they must become.
 */
export function QuestionOfIdentityScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-05-question-of-identity", "pinned", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-05-question-of-identity" ref={ref} mode="pinned" length="medium" className="bg-[#f7f3ea] p-0 text-[#071d36]">
      <div className="sticky top-0 min-h-screen overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f3ea_0%,#fbf8f1_52%,#dce9f3_100%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-14rem)] max-w-[96rem] gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#8a6426]">The Question Of Identity</p>
            <h2 className="mt-6 text-[clamp(3rem,6vw,6rem)] font-black leading-[1.02] tracking-normal">
              Who must I become?
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-[#40516a] sm:text-xl">
              Selection begins before the test. It begins in the quiet moment when ambition becomes identity.
            </p>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="relative min-h-[38rem] overflow-hidden rounded-[2rem] border border-[#071d36]/10 bg-white shadow-[0_34px_110px_rgba(7,29,54,0.12)]">
            <div className="absolute inset-8 rounded-[1.5rem] border border-[#071d36]/12 bg-[#071d36]/5" />
            <div className="absolute right-[10%] top-[8%] h-[78%] w-[48%] overflow-hidden rounded-[1.25rem] border border-[#071d36]/12 bg-[#071d36] shadow-[0_24px_80px_rgba(7,29,54,0.16)]" style={{ transform: `translate3d(0,${depth * -10}px,0)` }}>
              <Image
                src={experienceSceneAssets.identityQuestion.src}
                alt={experienceSceneAssets.identityQuestion.alt}
                fill
                sizes="(min-width: 1024px) 32vw, 80vw"
                className="object-cover opacity-70 saturate-[0.72]"
                style={{ transform: `scale(1.08) translate3d(0,${depth * -14}px,0)` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,243,234,0.12)_0%,rgba(7,29,54,0.52)_100%)]" />
            </div>
            <div className="absolute bottom-[18%] left-[9%] h-24 w-56 rounded-[1rem] border border-[#071d36]/10 bg-[#fbf8f1] shadow-[0_18px_54px_rgba(7,29,54,0.10)]" />
            <div className="absolute bottom-[27%] left-[13%] h-2 w-36 rounded-full bg-[#8a6426]/28" />
            <div className="absolute bottom-[23%] left-[13%] h-2 w-28 rounded-full bg-[#071d36]/18" />
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
