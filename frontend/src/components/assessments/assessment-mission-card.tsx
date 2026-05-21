"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock, PlayCircle, RotateCw } from "lucide-react";
import type { AssessmentProgress, AssessmentStatus } from "@/components/assessments/assessment-catalog";

const statusStyles: Record<AssessmentStatus, string> = {
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  IN_PROGRESS: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  NOT_STARTED: "border-gold/30 bg-gold/10 text-gold",
  LOCKED: "border-white/15 bg-white/[0.06] text-muted"
};

const accessStyles = {
  FREE: "bg-gold/10 text-gold border-gold/30",
  CORE: "bg-sky-300/10 text-sky-200 border-sky-300/25",
  PREMIUM: "bg-white/10 text-white border-white/20"
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
      className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded border border-gold/25 bg-gold/10 text-gold">
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

      <p className="mt-5 text-lg font-semibold leading-tight text-white">{assessment.title}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{assessment.subtitle}</p>

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {assessment.measures.slice(0, 4).map((measure) => (
            <span key={measure} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.7rem] font-semibold capitalize text-muted">{measure}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 rounded border border-white/10 bg-navy-deep/45 p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted">Score</span>
          <span className="font-semibold text-gold-soft">{assessment.score === null ? "--" : `${assessment.score}/100`}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted">Report</span>
          <span className="text-right font-semibold text-white">{assessment.reportStatus}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted">Guru Link</span>
          <span className="text-right font-semibold text-gold-soft">{assessment.relatedGuruQuest}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted">Access</span>
          <span className="text-right font-semibold text-white">{assessment.accessNote}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted">{assessment.nextStep}</p>

      <Link href={assessment.href} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
        {assessment.actionLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}
