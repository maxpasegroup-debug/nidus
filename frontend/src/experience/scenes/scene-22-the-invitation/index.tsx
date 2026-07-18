"use client";

/**
 * Scene 22: The Invitation.
 * Offers a warm institutional welcome and clear next actions without sales pressure.
 */
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { experienceSceneAssets, getExperienceMotionPreset, SceneContainer, useRegisteredSceneProgress } from "@/experience";

const guidanceItems = ["Speak with admissions", "Understand the right programme", "Prepare documents", "Choose the next visit"];

/**
 * Renders a restrained invitation into the admissions conversation.
 */
export function InvitationScene() {
  const { ref } = useRegisteredSceneProgress<HTMLDivElement>("scene-22-the-invitation", "normal", "medium");

  return (
    <SceneContainer id="scene-22-the-invitation" ref={ref} mode="normal" length="medium" className="bg-[#fbf7ef] text-[#06172b]">
      <div className="mx-auto grid min-h-screen w-full max-w-[92rem] items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <motion.div variants={getExperienceMotionPreset("sectionReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }}>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#a87d22]">The Invitation</p>
          <h2 className="mt-5 text-[clamp(3rem,6.4vw,6rem)] font-black leading-[0.98] tracking-normal">
            Come with your questions. Leave with a path.
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-[#334762] sm:text-lg">
            The next conversation is simple, human and guided. No pressure. Just clarity.
          </p>
          <Link href="/admissions" className="mt-10 inline-flex rounded-full border border-[#d8c8a6] bg-white/76 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#06172b] transition hover:border-[#06172b] focus:outline-none focus:ring-2 focus:ring-[#a87d22] focus:ring-offset-2 focus:ring-offset-[#fbf7ef]">
            Admissions Guidance
          </Link>
        </motion.div>

        <motion.div variants={getExperienceMotionPreset("imageReveal")} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} className="relative min-h-[38rem] overflow-hidden rounded-[2rem] border border-[#dccdaf] bg-[#efe7d8] shadow-[0_32px_90px_rgba(6,23,43,0.14)]">
          <Image
            src={experienceSceneAssets.invitation.src}
            alt={experienceSceneAssets.invitation.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-74 saturate-[0.72]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(251,247,239,0.76),transparent_60%)]" />
          <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-2">
            {guidanceItems.map((item) => (
              <div key={item} className="rounded-2xl border border-white/48 bg-white/78 p-4 text-sm font-black uppercase tracking-[0.18em] text-[#06172b] backdrop-blur-xl">
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SceneContainer>
  );
}
