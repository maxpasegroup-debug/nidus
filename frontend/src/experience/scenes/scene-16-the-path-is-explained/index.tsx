"use client";

/**
 * Scene 16: The Path Is Explained.
 * Removes uncertainty with a premium admission journey and the first primary admission CTA.
 */
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const admissionSteps = ["Inquiry", "Counselling", "Application", "Verification", "Admission", "Welcome"];

/**
 * Renders the admissions path and introduces the first primary CTA at the final stage.
 */
export function PathExplainedScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-16-the-path-is-explained", "layered", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-16-the-path-is-explained" ref={ref} mode="layered" length="long" className="bg-[#06172b] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.pathExplained.src}
          alt={experienceSceneAssets.pathExplained.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-18 saturate-[0.72]"
          style={{ transform: `scale(1.06) translate3d(0,${depth * -18}px,0)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_28%,rgba(231,200,115,0.18),rgba(6,23,43,0.96)_58%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[96rem] flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The Path Is Explained</p>
            <h2 className="mt-5 text-[clamp(3.1rem,7vw,6.8rem)] font-black leading-[0.98] tracking-normal">
              Uncertainty leaves when the path is clear.
            </h2>
          </motion.div>

          <motion.div variants={getExperienceMotionPreset("timelineReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.28 }} className="mt-14 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {admissionSteps.map((step, index) => (
              <div key={step} className="min-h-44 rounded-3xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c873]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-5 text-xl font-black text-white">{step}</p>
                {index === admissionSteps.length - 1 ? (
                  <Link href="/admissions" className="mt-7 inline-flex rounded-full bg-[#e7c873] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#06172b] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#e7c873] focus:ring-offset-2 focus:ring-offset-[#06172b]">
                    Begin Admission
                  </Link>
                ) : (
                  <div className="mt-8 h-1 rounded-full bg-white/14">
                    <div className="h-1 w-1/2 rounded-full bg-[#e7c873]/72" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
