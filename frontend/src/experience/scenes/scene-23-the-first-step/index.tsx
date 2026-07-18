"use client";

/**
 * Scene 23: The First Step.
 * Presents the strongest action point in the experience with clear hierarchy.
 */
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const firstStepGuidance = ["Share student details", "Book counselling", "Visit or speak online"];

/**
 * Renders the primary admission action and a secondary contact option.
 */
export function FirstStepScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-23-the-first-step", "layered", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-23-the-first-step" ref={ref} mode="layered" length="long" className="bg-[#06172b] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.firstStep.src}
          alt={experienceSceneAssets.firstStep.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-20 saturate-[0.72]"
          style={{ transform: `scale(1.06) translate3d(0,${depth * -18}px,0)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_30%,rgba(231,200,115,0.2),rgba(6,23,43,0.98)_58%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[92rem] flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The First Step</p>
            <h2 className="mt-6 text-[clamp(3.8rem,8.4vw,8rem)] font-black leading-[0.98] tracking-normal">
              Begin with one clear conversation.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/74 sm:text-xl">
              Tell us where the student is today. We will help explain the right next step.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/admissions" className="inline-flex rounded-full bg-[#e7c873] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#06172b] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#e7c873] focus:ring-offset-2 focus:ring-offset-[#06172b]">
                Start Admission
              </Link>
              <Link href="/contact" className="inline-flex rounded-full border border-white/18 bg-white/[0.06] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[#e7c873] focus:outline-none focus:ring-2 focus:ring-[#e7c873] focus:ring-offset-2 focus:ring-offset-[#06172b]">
                Contact NIDUS
              </Link>
            </div>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("timelineReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="mt-14 grid gap-4 md:grid-cols-3">
            {firstStepGuidance.map((item, index) => (
              <div key={item} className="rounded-3xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c873]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-5 text-xl font-black text-white">{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
