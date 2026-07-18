"use client";

/**
 * Scene 2: The Student Before The Dream.
 * Quiet documentary study-room composition that lets visitors recognize themselves.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the private pre-dream student scene with layered photography and reflective typography.
 */
export function StudentBeforeDreamScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-02-student-before-dream", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-02-student-before-dream" ref={ref} mode="layered" length="medium" className="bg-[#f7f3ea] p-0 text-[#071d36]">
      <div className="relative min-h-screen overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(185,145,63,0.16),transparent_28rem),linear-gradient(180deg,#f7f3ea_0%,#fbf8f1_100%)]" />
        <div className="absolute left-[6vw] top-[18vh] h-40 w-56 rounded-[1.4rem] border border-[#071d36]/10 bg-white/54 shadow-[0_24px_80px_rgba(7,29,54,0.10)] backdrop-blur-xl" style={{ transform: `translate3d(0,${depth * -16}px,0)` }} />
        <div className="absolute bottom-[12vh] left-[12vw] h-3 w-48 rounded-full bg-[#071d36]/18 blur-sm" />

        <div className="relative mx-auto grid min-h-[calc(100vh-14rem)] max-w-[96rem] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#8a6426]">The Student Before The Dream</p>
            <h2 className="mt-6 text-[clamp(2.8rem,5.6vw,5.8rem)] font-black leading-[1.02] tracking-normal">
              Every officer begins as a student in a quiet room.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-[#40516a] sm:text-xl">
              The books are open. The morning is still. The dream is not yet public, but it has already started asking for discipline.
            </p>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#071d36]/10 bg-[#071d36] shadow-[0_34px_110px_rgba(7,29,54,0.18)]">
            <Image
              src={experienceSceneAssets.studentBeforeDream.src}
              alt={experienceSceneAssets.studentBeforeDream.alt}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover opacity-82 saturate-[0.84]"
              style={{ transform: `scale(1.04) translate3d(0,${depth * -22}px,0)` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,29,54,0.58)_0%,rgba(7,29,54,0.12)_52%,rgba(247,243,234,0.18)_100%)]" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[1.25rem] border border-white/20 bg-white/76 p-5 text-[#071d36] shadow-[0_18px_60px_rgba(7,29,54,0.18)] backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8a6426]">Private Thought</p>
              <p className="mt-3 text-lg font-black leading-7">That could be me.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
