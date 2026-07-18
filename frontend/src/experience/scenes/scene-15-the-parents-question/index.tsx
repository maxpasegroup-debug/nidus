"use client";

/**
 * Scene 15: The Parent's Question.
 * A slow trust scene for parent concerns, counselling, documentation, and reassurance.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, useRegisteredSceneProgress } from "@/experience";

const reassurancePoints = ["Safety", "Discipline", "Progress", "Communication"];

/**
 * Renders a warm consultation moment without turning the scene into a sales section.
 */
export function ParentsQuestionScene() {
  const { ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-15-the-parents-question", "sticky", "long");

  return (
    <SceneContainer id="scene-15-the-parents-question" ref={ref} mode="sticky" length="long" className="bg-[#fbf7ef] text-[#06172b]">
      <div className="mx-auto grid min-h-screen w-full max-w-[92rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">The Parent's Question</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(3rem,6.4vw,6rem)] font-black leading-[0.98] tracking-normal">
            Will my child be guided with care?
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
            The answer is given calmly: through counselling, documentation, clear expectations and steady communication.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {reassurancePoints.map((point) => (
              <span key={point} className="rounded-full border border-[#d8c8a6] bg-white/72 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#06172b]">
                {point}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#a87d22]">Talk to Admissions</p>
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[38rem] overflow-hidden rounded-[2rem] border border-[#dccdaf] bg-[#efe7d8] shadow-[0_32px_90px_rgba(6,23,43,0.14)]">
          <Image
            src={experienceSceneAssets.parentsQuestion.src}
            alt={experienceSceneAssets.parentsQuestion.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-78 saturate-[0.72]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(251,247,239,0.72),transparent_58%)]" />
          <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/46 bg-white/76 p-6 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#a87d22]">Counselling table</p>
            <p className="mt-3 text-lg font-semibold leading-8 text-[#233956]">A parent, a student and a counsellor align before the first step is taken.</p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
