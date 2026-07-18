"use client";

/**
 * Scene 6: Discipline Begins.
 * Morning routine sequence with rhythmic reveals and elegant forward momentum.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const routineSteps = [
  ["05:00", "Alarm"],
  ["05:10", "Shoes"],
  ["05:20", "Bag"],
  ["05:30", "Books"],
  ["05:45", "Step outside"]
] as const;

/**
 * Renders the morning routine scene with faster, disciplined sequential pacing.
 */
export function DisciplineBeginsScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-06-discipline-begins", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-06-discipline-begins" ref={ref} mode="layered" length="medium" className="bg-[#071d36] p-0 text-white">
      <div className="relative min-h-screen overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <Image
          src={experienceSceneAssets.disciplineBegins.src}
          alt={experienceSceneAssets.disciplineBegins.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-38 saturate-[0.66]"
          style={{ transform: `scale(1.08) translate3d(0,${depth * -24}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,17,32,0.92)_0%,rgba(7,29,54,0.72)_48%,rgba(7,29,54,0.42)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-[linear-gradient(0deg,rgba(231,200,115,0.22)_0%,transparent_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-14rem)] max-w-[96rem] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">Discipline Begins</p>
            <h2 className="mt-6 text-[clamp(3rem,6.4vw,6.5rem)] font-black leading-[1.02] tracking-normal">
              Dreams become real through routine.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-white/72 sm:text-xl">
              The day starts before the world is loud. Alarm. Shoes. Bag. Books. One step outside.
            </p>
          </motion.div>

          <div className="grid gap-3">
            {routineSteps.map(([time, label]) => (
              <motion.div key={label} variants={getExperienceMotionPreset("timelineReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="flex items-center gap-4 rounded-[1.25rem] border border-white/14 bg-white/10 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7c873] text-sm font-black text-[#071d36]">{time}</span>
                <span className="text-xl font-black">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SceneContainer>
  );
}
