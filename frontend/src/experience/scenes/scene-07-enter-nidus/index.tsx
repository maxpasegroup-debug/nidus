"use client";

/**
 * Scene 7: Enter NIDUS.
 * Institutional threshold scene that marks entry into the NIDUS world.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, usePerformanceGuard, useRegisteredSceneProgress } from "@/experience";

/**
 * Renders the first academy reveal with dignified tracking and threshold atmosphere.
 */
export function EnterNidusScene() {
  const { progress, ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-07-enter-nidus", "immersive", "long");
  const { shouldReduceEffects } = usePerformanceGuard();
  const depth = shouldReduceEffects ? 0 : progress;
  const gateOpacity = Math.min(1, 0.38 + depth * 0.7);

  return (
    <SceneContainer id="scene-07-enter-nidus" ref={ref} mode="immersive" length="long" className="bg-[#041120] p-0 text-white">
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <Image
          src={experienceSceneAssets.enterNidus.src}
          alt={experienceSceneAssets.enterNidus.alt}
          fill
          sizes="100vw"
          className="object-cover opacity-62 saturate-[0.78]"
          style={{ transform: `scale(1.07) translate3d(0,${depth * -30}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,17,32,0.90)_0%,rgba(7,29,54,0.62)_48%,rgba(7,29,54,0.24)_100%)]" />
        <div className="absolute inset-x-[14vw] top-[18vh] h-[62vh] rounded-t-[3rem] border-x border-t border-[#e7c873]/26" style={{ opacity: gateOpacity }} />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-[linear-gradient(0deg,rgba(247,243,234,0.35)_0%,transparent_100%)]" />

        <div className="relative z-10 flex min-h-screen items-center px-4 py-28 sm:px-6 lg:px-8">
          <motion.div variants={getExperienceMotionPreset("heroReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} className="mx-auto w-full max-w-[96rem]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">Enter NIDUS</p>
            <h2 className="mt-6 max-w-5xl text-[clamp(3.8rem,8.4vw,8rem)] font-black leading-[0.98] tracking-normal">
              Cross into a place built for purpose.
            </h2>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/76 sm:text-xl">
              Not a commercial campus. A disciplined threshold where preparation becomes environment.
            </p>
            <div className="mt-12 inline-flex rounded-full border border-[#e7c873]/34 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.26em] text-[#e7c873] backdrop-blur-xl">
              NIDUS Defence Academy
            </div>
          </motion.div>
        </div>
      </div>
    </SceneContainer>
  );
}
