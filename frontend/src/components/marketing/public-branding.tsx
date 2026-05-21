"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PublicSectionIntro({ eyebrow, title, text, centered = false }: { eyebrow: string; title: string; text: string; centered?: boolean }) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#536072]">{text}</p>
    </div>
  );
}

export function PublicCta({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "whatsapp"; className?: string }) {
  const styles = {
    primary: "bg-[#263a8f] text-white shadow-[0_18px_40px_rgba(38,58,143,0.26)] hover:bg-[#1f2f75]",
    secondary: "border border-[#263a8f]/20 bg-white/70 text-[#263a8f] shadow-[0_12px_30px_rgba(38,58,143,0.10)] hover:border-[#c9a646]/60",
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
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-[0_28px_90px_rgba(19,35,72,0.14)] backdrop-blur-2xl">
      <div className="rounded-[1.1rem] bg-[#111827] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e9d27d]">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {metrics.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.06] p-4">
              <p className="text-2xl font-semibold text-[#e9d27d]">{value}</p>
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
      <Icon className="h-6 w-6 text-[#e9d27d]" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
    </div>
  );
}

export function AssistantOrbit({ message }: { message: string }) {
  return (
    <div className="relative mt-10 h-72 max-w-md">
      <div className="absolute inset-0 rounded-full bg-[#263a8f]/10 blur-3xl" />
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#263a8f]/20" />
      <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a646]/30" />
      <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#111827] text-white shadow-[0_24px_80px_rgba(17,24,39,0.25)]">
        <Bot className="h-12 w-12 text-[#e9d27d]" />
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 rounded-[1.25rem] border border-white/80 bg-white/80 p-4 text-sm font-semibold text-[#263a8f] shadow-[0_18px_50px_rgba(19,35,72,0.12)] backdrop-blur-xl">
        {message}
      </div>
    </div>
  );
}

export function PublicNextStepBand({ title, text, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: { title: string; text: string; primaryHref: string; primaryLabel: string; secondaryHref: string; secondaryLabel: string }) {
  return (
    <section className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.25rem] border border-[#263a8f]/10 bg-white p-5 shadow-[0_22px_60px_rgba(19,35,72,0.08)] sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Next Step</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#111827]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#536072]">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PublicCta href={primaryHref}>{primaryLabel}</PublicCta>
          <PublicCta href={secondaryHref} variant="secondary">{secondaryLabel}</PublicCta>
        </div>
      </div>
    </section>
  );
}
