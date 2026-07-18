"use client";

/**
 * Scene 14: Proof Without Noise.
 * Establishes credibility quietly through editorial evidence and restrained achievement signals.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, useRegisteredSceneProgress } from "@/experience";

const proofNotes = [
  "Student achievements recorded with context",
  "Parent reassurance through steady progress",
  "Mentor observations over time"
];

/**
 * Renders quiet credibility without marketing exaggeration.
 */
export function ProofWithoutNoiseScene() {
  const { ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-14-proof-without-noise", "normal", "medium");

  return (
    <SceneContainer id="scene-14-proof-without-noise" ref={ref} mode="normal" length="medium" className="bg-[#071522] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[92rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[38rem] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04]">
          <Image
            src={experienceSceneAssets.proofWithoutNoise.src}
            alt={experienceSceneAssets.proofWithoutNoise.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover opacity-76 saturate-[0.74]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,21,34,0.76),rgba(7,21,34,0.04)_56%)]" />
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">Proof Without Noise</p>
          <h2 className="mt-5 text-[clamp(3rem,6.4vw,6.1rem)] font-black leading-[0.98] tracking-normal">
            Evidence does not need to shout.
          </h2>
          <div className="mt-9 grid gap-4">
            {proofNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
                <p className="text-base font-semibold leading-7 text-white/78">{note}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
