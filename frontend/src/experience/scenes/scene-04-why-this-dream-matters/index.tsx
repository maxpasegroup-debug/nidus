"use client";

/**
 * Scene 4: Why This Dream Matters.
 * Warm close-up storytelling that connects the officer dream to family, purpose, and preparation.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const symbolicObjects = [
  ["Books", "The exam is visible, but the purpose is larger."],
  ["Shoes", "Discipline begins before the academy gate."],
  ["Family", "The dream carries responsibility and pride."]
] as const;

/**
 * Renders the warm purpose scene with parent, student, and symbolic preparation moments.
 */
export function WhyThisDreamMattersScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-04-why-this-dream-matters", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-04-why-this-dream-matters" ref={ref} mode="layered" length="medium" className="bg-[#fbf8f1] p-0 text-[#071d36]">
      <div className="relative min-h-screen overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(185,145,63,0.18),transparent_28rem),linear-gradient(180deg,#fbf8f1_0%,#f7f3ea_100%)]" />
        <div className="absolute right-[8vw] top-[12vh] h-72 w-72 rounded-full bg-[#e7c873]/18 blur-[88px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-14rem)] max-w-[96rem] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#071d36]/10 bg-[#071d36] shadow-[0_34px_110px_rgba(7,29,54,0.14)]">
            <Image
              src={experienceSceneAssets.dreamMatters.src}
              alt={experienceSceneAssets.dreamMatters.alt}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover opacity-78 saturate-[0.78]"
              style={{ transform: `scale(1.04) translate3d(0,${depth * -18}px,0)` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,29,54,0.10)_0%,rgba(7,29,54,0.66)_100%)]" />
            <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
              {symbolicObjects.map(([label, text]) => (
                <div key={label} className="rounded-[1rem] border border-white/18 bg-white/78 p-4 text-[#071d36] shadow-[0_14px_44px_rgba(7,29,54,0.16)] backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6426]">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.42 }} className="max-w-2xl lg:ml-auto">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#8a6426]">Why This Dream Matters</p>
            <h2 className="mt-6 text-[clamp(2.8rem,5.4vw,5.8rem)] font-black leading-[1.02] tracking-normal">
              This is bigger than an exam.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-[#40516a] sm:text-xl">
              A parent&apos;s hope, a student&apos;s private promise, the books, the shoes, the quiet preparation. The defence dream asks for responsibility before it asks for marks.
            </p>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
