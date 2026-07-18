"use client";

/**
 * Scene 19: Academy Culture.
 * Reveals daily life inside NIDUS through teamwork, leadership, respect, and mentorship.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const cultureNotes = ["Teamwork", "Leadership", "Discipline", "Respect", "Mentorship", "Camaraderie"];

/**
 * Renders warm documentary storytelling about daily academy culture.
 */
export function AcademyCultureScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-19-academy-culture", "split", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-19-academy-culture" ref={ref} mode="split" length="medium" className="bg-[#fbf7ef] text-[#06172b]">
      <div className="grid min-h-screen items-stretch lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[36rem] overflow-hidden">
          <Image
            src={experienceSceneAssets.academyCulture.src}
            alt={experienceSceneAssets.academyCulture.alt}
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover opacity-82 saturate-[0.74]"
            style={{ transform: `scale(1.06) translate3d(0,${depth * -16}px,0)` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,247,239,0.04),rgba(251,247,239,0.78))]" />
        </div>

        <div className="flex items-center px-4 py-24 sm:px-8 lg:px-12">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="w-full">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">Academy Culture</p>
            <h2 className="mt-5 text-[clamp(3rem,6.4vw,6rem)] font-black leading-[0.98] tracking-normal">
              Daily life teaches what lectures cannot.
            </h2>
            <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
              Culture is built in ordinary moments: how students stand together, listen, lead and return for the next day.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {cultureNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-[#d8c8a6] bg-white/72 p-4 text-sm font-black uppercase tracking-[0.2em] text-[#06172b]">
                  {note}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
