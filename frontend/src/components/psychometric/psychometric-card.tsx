import { motion } from "framer-motion";
import type { PsychometricTest } from "@/types/psychometric";

export function PsychometricCard({ test, onStart }: { test: PsychometricTest; onStart: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      type="button"
      onClick={onStart}
      className="rounded-lg border border-white/10 bg-white/[0.055] p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl transition hover:border-gold/35"
    >
      <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{test.type}</span>
      <h3 className="mt-4 text-xl font-semibold text-white">{test.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{test.description}</p>
      <p className="mt-5 text-sm text-gold-soft">{test.duration} min · {test._count?.questions ?? test.questions?.length ?? 0} prompts</p>
    </motion.button>
  );
}
