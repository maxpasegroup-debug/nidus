"use client";

/**
 * Scene 13: The Progress Wall.
 * Makes growth visible through structured academic, attendance, physical, and mentor evidence.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

const progressMetrics = [
  { label: "Academic milestones", value: "72%", note: "chapters moving forward" },
  { label: "Attendance rhythm", value: "94%", note: "presence becomes habit" },
  { label: "Physical development", value: "8.2", note: "endurance trend" },
  { label: "Mentor observations", value: "12", note: "guided corrections" }
];

/**
 * Renders a premium progress dashboard aesthetic without becoming a software dashboard.
 */
export function ProgressWallScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-13-the-progress-wall", "layered", "medium");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;

  return (
    <SceneContainer id="scene-13-the-progress-wall" ref={ref} mode="layered" length="medium" className="bg-[#f8f5ed] text-[#06172b]">
      <div className="mx-auto grid min-h-screen w-full max-w-[94rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">The Progress Wall</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(3rem,6.8vw,6.4rem)] font-black leading-[0.98] tracking-normal">
            Improvement becomes visible.
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
            Growth is not left to feeling. It is observed, measured, corrected and carried forward.
          </p>
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative overflow-hidden rounded-[2rem] border border-[#d9caa8] bg-[#efe7d8] p-5 shadow-[0_32px_90px_rgba(6,23,43,0.16)] sm:p-7">
          <Image
            src={experienceSceneAssets.progressWall.src}
            alt={experienceSceneAssets.progressWall.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-14 saturate-[0.72]"
            style={{ transform: `scale(1.05) translate3d(0,${depth * -14}px,0)` }}
          />
          <div className="relative z-10 grid gap-4">
            {progressMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[#d5c49f] bg-white/78 p-5 backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a87d22]">{metric.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#4a5c73]">{metric.note}</p>
                  </div>
                  <p className="text-3xl font-black text-[#06172b]">{metric.value}</p>
                </div>
                <div className="mt-5 h-1.5 rounded-full bg-[#e0d2b2]">
                  <div className="h-1.5 w-3/4 rounded-full bg-[#06172b]" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
