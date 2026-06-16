"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, GraduationCap, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";
import { AssistantOrbit } from "@/components/marketing/public-branding";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { signup } from "@/services/auth.v2";
import { createPublicLead } from "@/services/crm";

const intentLabels: Record<string, string> = {
  academy: "Academy Admission",
  exam: "TOP RANK",
  "top-rank": "TOP RANK",
  guru: "NIDUS Guru",
  assessment: "Assessments",
  counselling: "Counselling",
  general: "Start Free"
};

const goals = ["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "Agniveer", "SSR", "MR", "Navik", "Foundation Programs", "TOP RANK", "NIDUS Guru", "Assessments", "Not sure"];

const initialForm = {
  fullName: "",
  whatsapp: "",
  email: "",
  className: "",
  goal: "NDA",
  password: "",
  message: ""
};

export default function StartFreePage() {
  const { showToast } = useToast();
  const [intent, setIntent] = useState("general");
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextIntent = params.get("intent") ?? "general";
    const program = params.get("program");
    setIntent(intentLabels[nextIntent] ? nextIntent : "general");
    if (program) setForm((current) => ({ ...current, goal: program }));
  }, []);

  const selectedIntent = intentLabels[intent] ?? intentLabels.general;
  const mentorMessage = useMemo(() => {
    if (accountExists) return "Your details are saved. This email or mobile already has an account, so please login to continue your journey.";
    if (submitted) return "Your free NIDUS account is ready. I am opening your My Journey dashboard now.";
    if (form.fullName && form.whatsapp && form.goal) return `Good. I will save your ${selectedIntent.toLowerCase()} interest and open your guest dashboard.`;
    return "Hi, I am NIDUS AI. Create a free account and I will guide your first step.";
  }, [accountExists, form.fullName, form.goal, form.whatsapp, selectedIntent, submitted]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setAccountExists(false);
    try {
      await createPublicLead({
        fullName: form.fullName,
        mobile: form.whatsapp,
        email: form.email,
        studentClass: form.className,
        targetExam: form.goal,
        source: `Universal Start Free - ${selectedIntent}`,
        message: [
          `Intent: ${selectedIntent}`,
          form.message || "Student requested free onboarding and NIDUS AI guidance.",
          "Pipeline: NEW_LEAD -> STUDENT_CREATED -> APPLICATION_READY"
        ].join("\n")
      });

      const result = await signup({
        name: form.fullName,
        email: form.email,
        mobile: form.whatsapp,
        password: form.password
      });

      if (result.success) {
        setSubmitted(true);
        showToast("Free NIDUS student account created. Opening your journey.", "success");
        window.setTimeout(() => window.location.assign("/dashboard/student"), 650);
      } else {
        throw new Error(result.message || "Could not create account");
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (/unique|already|registered/i.test(message)) {
        setAccountExists(true);
        showToast("Lead updated. Please login with the existing account.", "success");
      } else {
        showToast(message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Universal Onboarding</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.95] text-[#071d36] sm:text-7xl">Start free. Continue with NIDUS.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">One free account for academy admission, TOP RANK defence career guidance, NIDUS Guru and assessments. Your interest reaches the admissions team, and your My Journey dashboard opens next.</p>
            <AssistantOrbit message={mentorMessage} />
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [GraduationCap, "Academy"],
                [BrainCircuit, "TOP RANK"],
                [ClipboardCheck, "Assessments"]
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof GraduationCap;
                return (
                  <div key={String(label)} className="rounded-lg border border-[#071d36]/10 bg-white/74 p-4 text-sm font-semibold text-[#071d36] shadow-sm">
                    <ItemIcon className="mb-3 h-5 w-5 text-[#b9913f]" />
                    {String(label)}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={submit} className="rounded-lg border border-[#071d36]/10 bg-white/86 p-5 shadow-[0_28px_90px_rgba(7,29,54,0.10)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded bg-[#f7f3ea] text-[#3f4a32]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#071d36]">Create Free Guest Account</h2>
                <p className="text-sm text-[#64748b]">Current intent: {selectedIntent}</p>
              </div>
            </div>

            {submitted ? (
              <div className="mt-5 rounded border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                Account created. Opening your My Journey dashboard.
              </div>
            ) : null}

            {accountExists ? (
              <div className="mt-5 rounded border border-[#b9913f]/25 bg-[#fff8df] p-4 text-sm leading-6 text-[#071d36]">
                Your lead is updated. This email or mobile already has an account. Login to continue.
                <Link href="/login" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-2 font-semibold text-[#071d36]">
                  Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Student name" value={form.fullName} onChange={(value) => update("fullName", value)} required />
              <Field label="WhatsApp number" value={form.whatsapp} onChange={(value) => update("whatsapp", value)} required inputMode="tel" />
              <Field label="Email" value={form.email} onChange={(value) => update("email", value)} required type="email" />
              <Field label="Class / qualification" value={form.className} onChange={(value) => update("className", value)} required />
              <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
                Interest / goal
                <select value={form.goal} onChange={(event) => update("goal", event.target.value)} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]">
                  {goals.map((goal) => <option key={goal}>{goal}</option>)}
                </select>
              </label>
              <Field label="Create password" value={form.password} onChange={(value) => update("password", value)} required type="password" minLength={8} />
              <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
                Message
                <textarea value={form.message} onChange={(event) => update("message", event.target.value)} className="min-h-24 rounded border border-[#071d36]/14 bg-white px-3 py-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" placeholder="Tell NIDUS AI what you want help with." />
              </label>
            </div>

            <button type="submit" disabled={isSubmitting || submitted} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-70">
              {isSubmitting ? "Creating..." : "Start Free & Open My Journey"} <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#071d36]/14 bg-[#f7f3ea] px-4 py-2 text-sm font-semibold text-[#071d36]">
                <LockKeyhole className="h-4 w-4" /> Already have account
              </Link>
              <Link href="/join" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#25d366]/25 bg-[#eafff1] px-4 py-2 text-sm font-semibold text-[#178f45]">
                <MessageCircle className="h-4 w-4" /> Direct application
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", inputMode, minLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; inputMode?: "tel" | "text"; minLength?: number }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#071d36]">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} minLength={minLength} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" />
    </label>
  );
}
