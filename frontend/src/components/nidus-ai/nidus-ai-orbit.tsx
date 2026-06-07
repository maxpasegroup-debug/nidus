"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

export type NidusAiMood = "guide" | "asking" | "thinking" | "report";

const moodCopy: Record<NidusAiMood, string> = {
  guide: "Guidance mode",
  asking: "Assessment mode",
  thinking: "Interpreting response",
  report: "Report mode"
};

export function NidusAiOrbit({ message, mood = "guide" }: { message: string; mood?: NidusAiMood }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#d7a642]/25 bg-white/80 p-5 shadow-[0_24px_80px_rgba(7,29,54,0.10)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(201,166,70,0.18),transparent_18rem),radial-gradient(circle_at_82%_28%,rgba(38,58,143,0.26),transparent_20rem)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid h-32 w-32 shrink-0 place-items-center self-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 16, ease: "linear" }} className="absolute inset-0 rounded-full border border-gold/30" />
          <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute inset-4 rounded-full border border-white/15" />
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2.8 }} className="grid h-20 w-20 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_20%,#f6df98,#263a8f_48%,#111827)] text-white shadow-[0_0_42px_rgba(201,166,70,0.24)]">
            <Bot className="h-8 w-8 text-white" />
          </motion.div>
          <Sparkles className="absolute right-3 top-5 h-4 w-4 text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6426]">{moodCopy[mood]}</p>
          <p className="mt-3 text-lg font-semibold leading-7 text-[#071d36]">{message}</p>
        </div>
      </div>
    </div>
  );
}
