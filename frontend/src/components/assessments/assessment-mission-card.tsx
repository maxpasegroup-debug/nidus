"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock, PlayCircle, RotateCw } from "lucide-react";
import type { AssessmentProgress, AssessmentStatus } from "@/components/assessments/assessment-catalog";

const statusStyles: Record<AssessmentStatus, string> = {
  COMPLETED: "border-emerald-500/25 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-500/25 bg-sky-50 text-sky-700",
  NOT_STARTED: "border-[#c89b3c]/35 bg-[#fff7de] text-[#8a6426]",
  LOCKED: "border-[#071d36]/10 bg-[#f4f1e8] text-[#64748b]"
};

const accessStyles = {
  FREE: "bg-[#fff7de] text-[#8a6426] border-[#c89b3c]/35",
  CORE: "bg-sky-50 text-sky-700 border-sky-500/25",
  PREMIUM: "bg-[#071d36] text-[#f7d37c] border-[#071d36]"
};

function StatusIcon({ status }: { status: AssessmentStatus }) {
  if (status === "COMPLETED") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "IN_PROGRESS") return <RotateCw className="h-4 w-4" />;
  if (status === "LOCKED") return <Lock className="h-4 w-4" />;
  return <PlayCircle className="h-4 w-4" />;
}

export function AssessmentMissionCard({ assessment, compact = false }: { assessment: AssessmentProgress; compact?: boolean }) {
  const Icon = assessment.icon;

  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="flex h-full flex-col rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_22px_60px_rgba(7,29,54,0.10)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded border border-[#c89b3c]/35 bg-[#fff7de] text-[#8a6426]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className={`rounded border px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${accessStyles[assessment.access]}`}>{assessment.access}</span>
          <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${statusStyles[assessment.status]}`}>
            <StatusIcon status={assessment.status} />
            {assessment.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <p className="mt-5 text-lg font-semibold leading-tight text-[#071d36]">{assessment.title}</p>
      <p className="mt-3 text-sm leading-6 text-[#40516a]">{assessment.subtitle}</p>

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {assessment.measures.slice(0, 4).map((measure) => (
            <span key={measure} className="rounded-full border border-[#071d36]/10 bg-[#f8f5ec] px-3 py-1 text-[0.7rem] font-semibold capitalize text-[#40516a]">{measure}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 rounded border border-[#071d36]/10 bg-[#fffdf8] p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-[#64748b]">Score</span>
          <span className="font-semibold text-[#8a6426]">{assessment.score === null ? "--" : `${assessment.score}/100`}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-[#64748b]">Report</span>
          <span className="text-right font-semibold text-[#071d36]">{assessment.reportStatus}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-[#64748b]">Guru Link</span>
          <span className="text-right font-semibold text-[#8a6426]">{assessment.relatedGuruQuest}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-[#64748b]">Access</span>
          <span className="text-right font-semibold text-[#071d36]">{assessment.accessNote}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#40516a]">{assessment.nextStep}</p>

      <Link href={assessment.href} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#c89b3c]/40 bg-gradient-to-r from-[#f8d77c] via-[#d7a642] to-[#a8741f] px-4 py-3 text-sm font-semibold text-[#071d36] shadow-[0_12px_28px_rgba(168,116,31,0.22)] transition hover:-translate-y-0.5">
        {assessment.actionLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}
