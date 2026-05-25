"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardList, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { AssistantOrbit, PublicCta } from "@/components/marketing/public-branding";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createPublicLead } from "@/services/crm";

const programs = ["NDA", "CDS", "AFCAT", "SSB", "Foundation", "AISSEE / RIMC", "NIDUS Guru", "Not sure"];

const initialForm = {
  studentName: "",
  parentName: "",
  phone: "",
  email: "",
  qualification: "",
  program: "NDA",
  location: "",
  counsellingTime: ""
};

const assistantSteps = [
  "Collect basic details",
  "Prepare application message",
  "Connect on WhatsApp"
];

export default function JoinPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappMessage = useMemo(() => {
    return `Hello NIDUS Academy,\n\nI am interested in joining NIDUS Academy.\n\nStudent Name: ${form.studentName || "-"}\nParent Name: ${form.parentName || "-"}\nPhone: ${form.phone || "-"}\nEmail: ${form.email || "-"}\nClass/Qualification: ${form.qualification || "-"}\nInterested Program: ${form.program || "-"}\nLocation: ${form.location || "-"}\nPreferred Counselling Time: ${form.counsellingTime || "-"}\n\nPlease guide me with admission details and counselling support.`;
  }, [form]);

  const whatsappHref = `https://wa.me/919969594411?text=${encodeURIComponent(whatsappMessage)}`;
  const completedFields = Object.entries(form).filter(([, value]) => value.trim().length > 0).length;
  const assistantMessage = submitted
    ? "Thank you. Your WhatsApp application is ready for immediate NIDUS support."
    : completedFields > 3
      ? "Good. I have enough details to prepare your NIDUS application message."
      : "Hi, I am your NIDUS AI Assistant. I will help you start your defence journey.";

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createPublicLead({
        fullName: form.studentName,
        mobile: form.phone,
        email: form.email,
        studentClass: form.qualification,
        targetExam: form.program,
        source: "Join Page AI Assistant",
        message: `Parent: ${form.parentName || "-"}\nLocation: ${form.location || "-"}\nPreferred counselling time: ${form.counsellingTime || "-"}`
      });
      setSubmitted(true);
      showToast("Application details saved. WhatsApp message is ready.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#f6f7fb] pt-20 text-[#111827]">
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(38,58,143,0.18),transparent_28rem),radial-gradient(circle_at_76%_18%,rgba(201,166,70,0.24),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Join NIDUS</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[0.98] sm:text-7xl">Meet your NIDUS AI Assistant.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#536072] sm:text-lg">Share a few basic details. The assistant will prepare your application message and connect you to NIDUS Academy on WhatsApp for immediate support.</p>

            <AssistantOrbit message={assistantMessage} />

            <div className="mt-8 grid gap-3">
              {assistantSteps.map((step, index) => {
                const active = submitted ? true : index === 0 || (completedFields > 3 && index === 1);
                return (
                  <div key={step} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${active ? "border-[#263a8f]/18 bg-white/75 text-[#263a8f]" : "border-[#263a8f]/8 bg-white/40 text-[#536072]"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? "bg-[#263a8f] text-white" : "bg-[#263a8f]/7 text-[#263a8f]"}`}>{active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>
                    {step}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65 }} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_28px_90px_rgba(19,35,72,0.14)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#263a8f]/7 text-[#263a8f]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Application Assistant</h2>
                <p className="text-sm text-[#536072]">Basic information only. WhatsApp support follows next.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-7 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student name" value={form.studentName} onChange={(value) => updateField("studentName", value)} autoComplete="name" required />
                <Field label="Parent name" value={form.parentName} onChange={(value) => updateField("parentName", value)} autoComplete="name" />
                <Field label="Phone number" value={form.phone} onChange={(value) => updateField("phone", value)} autoComplete="tel" inputMode="tel" required />
                <Field label="Email" value={form.email} onChange={(value) => updateField("email", value)} autoComplete="email" type="email" required />
                <Field label="Class / qualification" value={form.qualification} onChange={(value) => updateField("qualification", value)} autoComplete="organization-title" required />
                <label className="grid gap-2 text-sm font-semibold text-[#111827]">
                  Interested program
                  <select value={form.program} onChange={(event) => updateField("program", event.target.value)} className="h-12 rounded border border-[#263a8f]/15 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#263a8f]">
                    {programs.map((program) => <option key={program}>{program}</option>)}
                  </select>
                </label>
                <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} autoComplete="address-level2" />
                <Field label="Preferred counselling time" value={form.counsellingTime} onChange={(value) => updateField("counsellingTime", value)} className="md:col-span-2" />
              </div>

              {submitted ? (
                <div className="rounded-lg border border-[#25d366]/25 bg-[#25d366]/8 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-1 h-5 w-5 text-[#178f45]" />
                    <div>
                      <h3 className="font-semibold text-[#111827]">Thank you. I will connect you through WhatsApp now.</h3>
                      <p className="mt-1 text-sm leading-6 text-[#536072]">Your greeting and application message is ready for NIDUS Academy support.</p>
                    </div>
                  </div>
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-[#25d366] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,211,102,0.24)] transition hover:-translate-y-0.5 sm:w-auto">
                    Send on WhatsApp <ArrowRight className="h-4 w-4" />
                  </a>
                  <button type="button" onClick={() => setSubmitted(false)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded border border-[#263a8f]/15 bg-white px-4 py-2 text-sm font-semibold text-[#263a8f] transition hover:border-[#c9a646]/60 sm:ml-3 sm:mt-4 sm:w-auto">
                    Edit Details
                  </button>
                </div>
              ) : (
                <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.26)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
                  {isSubmitting ? "Saving Details..." : "Prepare WhatsApp Application"} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </form>

            <div className="mt-6 rounded-lg border border-[#263a8f]/10 bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                <ClipboardList className="h-4 w-4 text-[#263a8f]" />
                WhatsApp message preview
              </div>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-[#263a8f]/8 bg-white p-3 text-xs leading-6 text-[#536072]">{whatsappMessage}</pre>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [ShieldCheck, "Defence guidance"],
                [Phone, "Immediate support"],
                [MessageCircle, "WhatsApp connect"]
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={String(label)} className="rounded-lg border border-[#263a8f]/10 bg-[#f8fafc] p-3 text-sm font-semibold text-[#263a8f]">
                    <ItemIcon className="mb-2 h-4 w-4" />
                    {String(label)}
                  </div>
                );
              })}
            </div>
            <div className="mt-5">
              <PublicCta href="/programs" variant="secondary" className="w-full sm:w-auto">
                Review Programs First
              </PublicCta>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required = false, className = "", autoComplete, inputMode, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string; autoComplete?: string; inputMode?: "text" | "tel"; type?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-[#111827] ${className}`}>
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} inputMode={inputMode} className="h-12 rounded border border-[#263a8f]/15 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#263a8f]" />
    </label>
  );
}
