"use client";

/**
 * Scene 11: The Mentor.
 * Recovery scene after intensity, centered on guidance and human connection.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders a calm progress-review scene between mentor and student.
 */
export function MentorScene() {
  const { ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-11-the-mentor", "normal", "medium");

  return (
    <SceneContainer id="scene-11-the-mentor" ref={ref} mode="normal" length="medium" className="bg-[#fbf8f1] text-[#06172b]">
      <div className="mx-auto grid min-h-screen w-full max-w-[90rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#ddcfb1] bg-[#efe7d8] shadow-[0_28px_90px_rgba(6,23,43,0.14)]">
          <Image
            src={experienceSceneAssets.mentor.src}
            alt={experienceSceneAssets.mentor.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover opacity-82 saturate-[0.72]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,23,43,0.46),transparent_58%)]" />
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">The Mentor</p>
          <h2 className="mt-5 text-[clamp(3rem,6.4vw,6rem)] font-black leading-[0.98] tracking-normal">
            Someone sees the progress before you do.
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
            After intensity comes correction. A mentor reads the marks, the posture, the hesitation and the promise.
          </p>
          <div className="mt-10 rounded-3xl border border-[#d8c8a6] bg-white/76 p-6">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#a87d22]">Progress review</p>
            <p className="mt-4 text-lg font-semibold leading-8 text-[#233956]">Guidance turns effort into direction.</p>
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
