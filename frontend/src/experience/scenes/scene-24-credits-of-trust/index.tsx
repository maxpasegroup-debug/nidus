"use client";

/**
 * Scene 24: Credits of Trust.
 * Closes the cinematic experience with institutional values, recognition, and gratitude.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, useRegisteredSceneProgress } from "@/experience";

const values = ["Discipline", "Guidance", "Courage", "Service"];

/**
 * Renders the calm closing credits and footer transition for NIDUS Experience V2.
 */
export function CreditsOfTrustScene() {
  const { ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-24-credits-of-trust", "normal", "medium");

  return (
    <SceneContainer id="scene-24-credits-of-trust" ref={ref} mode="normal" length="medium" className="bg-[#041120] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.creditsOfTrust.src}
          alt={experienceSceneAssets.creditsOfTrust.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-16 saturate-[0.68]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,17,32,1),rgba(4,17,32,0.86))]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[90rem] flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">Credits of Trust</p>
            <h2 className="mt-6 text-[clamp(3.2rem,7vw,6.8rem)] font-black leading-[0.98] tracking-normal">
              Built for students who are ready to begin.
            </h2>
            <p className="mt-8 max-w-2xl text-base font-semibold leading-8 text-white/72 sm:text-xl">
              NIDUS Defence Academy stands with the families, mentors and students who believe preparation can shape a life.
            </p>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("timelineReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value} className="rounded-3xl border border-white/12 bg-white/[0.05] p-6">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#e7c873]">{value}</p>
              </div>
            ))}
          </motion.div>

          <div className="mt-16 border-t border-white/12 pt-8 text-xs font-black uppercase tracking-[0.26em] text-white/52">
            NIDUS Defence Academy
          </div>
        </div>
      </div>
    </SceneContainer>
  );
}
