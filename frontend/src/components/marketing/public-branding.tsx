"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PublicSectionIntro({ eyebrow, title, text, centered = false, light = false }: { eyebrow: string; title: string; text: string; centered?: boolean; light?: boolean }) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${light ? "text-[#e7c873]" : "text-[#3f4a32]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-4xl font-semibold leading-tight sm:text-5xl ${light ? "text-white" : "text-[#071d36]"}`}>{title}</h2>
      <p className={`mt-4 text-sm leading-7 ${light ? "text-white/72" : "text-[#64748b]"}`}>{text}</p>
    </div>
  );
}

export function PublicCta({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "whatsapp"; className?: string }) {
  const styles = {
    primary: "border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] text-[#071d36] shadow-[0_18px_40px_rgba(185,145,63,0.24)] hover:brightness-105",
    secondary: "border border-[#071d36]/14 bg-white/76 text-[#071d36] shadow-[0_12px_30px_rgba(7,29,54,0.08)] hover:border-[#b9913f]/55",
    whatsapp: "bg-[#25d366] text-white shadow-[0_16px_36px_rgba(37,211,102,0.24)] hover:bg-[#20bd5a]"
  };

  return (
    <Link href={href} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 sm:w-auto ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function PublicMetricPanel({ eyebrow, title, metrics }: { eyebrow: string; title: string; metrics: Array<[string, string]> }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="rounded-[1.5rem] border border-[#071d36]/10 bg-white/74 p-5 shadow-[0_28px_90px_rgba(7,29,54,0.12)] backdrop-blur-2xl">
      <div className="rounded-[1.1rem] bg-[#071d36] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e7c873]">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {metrics.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.06] p-4">
              <p className="text-2xl font-semibold text-[#e7c873]">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.13em] text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function PublicFeatureCard({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
      <Icon className="h-6 w-6 text-[#e7c873]" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
    </div>
  );
}

export function AssistantOrbit({ message }: { message: string }) {
  return (
    <div className="relative mt-10 h-72 max-w-md">
      <div className="absolute inset-0 rounded-full bg-[#6e8faf]/14 blur-3xl" />
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#071d36]/14" />
      <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b9913f]/28" />
      <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#071d36] text-white shadow-[0_24px_80px_rgba(7,29,54,0.18)]">
        <Bot className="h-12 w-12 text-[#e7c873]" />
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 rounded-[1.25rem] border border-[#071d36]/10 bg-white/84 p-4 text-sm font-semibold text-[#071d36] shadow-[0_18px_50px_rgba(7,29,54,0.10)] backdrop-blur-xl">
        {message}
      </div>
    </div>
  );
}

export function PublicNextStepBand({ title, text, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: { title: string; text: string; primaryHref: string; primaryLabel: string; secondaryHref: string; secondaryLabel: string }) {
  return (
    <section className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.25rem] border border-[#071d36]/10 bg-white/84 p-5 shadow-[0_22px_60px_rgba(7,29,54,0.08)] sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Next Step</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#071d36]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#64748b]">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PublicCta href={primaryHref}>{primaryLabel}</PublicCta>
          <PublicCta href={secondaryHref} variant="secondary">{secondaryLabel}</PublicCta>
        </div>
      </div>
    </section>
  );
}
