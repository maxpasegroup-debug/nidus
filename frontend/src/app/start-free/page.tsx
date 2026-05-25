"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AssistantOrbit } from "@/components/marketing/public-branding";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createPublicLead } from "@/services/crm";

const initialForm = {
  fullName: "",
  whatsapp: "",
  email: "",
  className: "",
  goal: "NDA",
  message: ""
};

const goals = ["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "Agniveer", "NIDUS Guru", "Not sure"];

export default function StartFreePage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mentorMessage = useMemo(() => {
    if (submitted) return "I have saved your details. I will help you begin with the right free step.";
    if (form.fullName && form.whatsapp && form.goal) return "Good. I can now guide you to the right assessment, arena, or academy path.";
    return "Hi, I am NIDUS AI. Tell me your goal and I will guide your first step.";
  }, [form.fullName, form.goal, form.whatsapp, submitted]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createPublicLead({
        fullName: form.fullName,
        mobile: form.whatsapp,
        email: form.email,
        studentClass: form.className,
        targetExam: form.goal,
        source: "Start Free AI Mentor",
        message: form.message || "Student requested free onboarding and NIDUS AI guidance."
      });
      setSubmitted(true);
      showToast("NIDUS AI saved your start-free request.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Start Free</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.95] text-[#071d36] sm:text-7xl">Let NIDUS AI guide your first step.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">Share basic details. NIDUS AI acts like a mentor and helps you begin with assessments, Top Rank, Guru quests, or academy counselling.</p>
            <AssistantOrbit message={mentorMessage} />
          </div>

          <form onSubmit={submit} className="rounded-lg border border-[#071d36]/10 bg-white/86 p-5 shadow-[0_28px_90px_rgba(7,29,54,0.10)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded bg-[#f7f3ea] text-[#3f4a32]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#071d36]">Free Onboarding</h2>
                <p className="text-sm text-[#64748b]">Your details reach the lead management dashboard.</p>
              </div>
            </div>

            {submitted ? (
              <div className="mt-5 rounded border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                Request saved. Start with a free assessment or wait for mentor support.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Student name" value={form.fullName} onChange={(value) => update("fullName", value)} required />
              <Field label="WhatsApp number" value={form.whatsapp} onChange={(value) => update("whatsapp", value)} required inputMode="tel" />
              <Field label="Email" value={form.email} onChange={(value) => update("email", value)} required type="email" />
              <Field label="Class / qualification" value={form.className} onChange={(value) => update("className", value)} required />
              <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
                Goal
                <select value={form.goal} onChange={(event) => update("goal", event.target.value)} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]">
                  {goals.map((goal) => <option key={goal}>{goal}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
                Message
                <textarea value={form.message} onChange={(event) => update("message", event.target.value)} className="min-h-28 rounded border border-[#071d36]/14 bg-white px-3 py-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" placeholder="Tell NIDUS AI what you want help with." />
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-[#071d36] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-70">
              {isSubmitting ? "Saving..." : "Start Free"} <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/psychometric" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#071d36]/14 bg-[#f7f3ea] px-4 py-2 text-sm font-semibold text-[#071d36]">
                <ShieldCheck className="h-4 w-4" /> Free Assessment
              </Link>
              <Link href="/join" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#25d366]/25 bg-[#eafff1] px-4 py-2 text-sm font-semibold text-[#178f45]">
                <MessageCircle className="h-4 w-4" /> WhatsApp Support
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", inputMode }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; inputMode?: "tel" | "text" }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#071d36]">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" />
    </label>
  );
}
