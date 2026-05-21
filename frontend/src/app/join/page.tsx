"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";

const programs = ["NDA", "CDS", "AFCAT", "SSB", "Foundation", "AISSEE / RIMC", "NIDUS Guru", "Not sure"];

const initialForm = {
  studentName: "",
  parentName: "",
  phone: "",
  qualification: "",
  program: "NDA",
  location: "",
  counsellingTime: ""
};

export default function JoinPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const whatsappMessage = useMemo(() => {
    return `Hello NIDUS Academy,\n\nI am interested in joining NIDUS Academy.\n\nStudent Name: ${form.studentName || "-"}\nParent Name: ${form.parentName || "-"}\nPhone: ${form.phone || "-"}\nClass/Qualification: ${form.qualification || "-"}\nInterested Program: ${form.program || "-"}\nLocation: ${form.location || "-"}\nPreferred Counselling Time: ${form.counsellingTime || "-"}\n\nPlease guide me with admission details and counselling support.`;
  }, [form]);

  const whatsappHref = `https://wa.me/919969594411?text=${encodeURIComponent(whatsappMessage)}`;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="bg-[#f6f7fb] pt-20 text-[#111827]">
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(38,58,143,0.18),transparent_28rem),radial-gradient(circle_at_76%_18%,rgba(201,166,70,0.24),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Join NIDUS</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.98] sm:text-7xl">Meet your NIDUS AI Assistant.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#536072] sm:text-lg">Share a few basic details. The assistant will prepare your application message and connect you to NIDUS Academy on WhatsApp for immediate support.</p>

            <div className="relative mt-10 h-72 max-w-md">
              <div className="absolute inset-0 rounded-full bg-[#263a8f]/10 blur-3xl" />
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }} className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#263a8f]/20" />
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a646]/30" />
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#111827] text-white shadow-[0_24px_80px_rgba(17,24,39,0.25)]">
                <Bot className="h-12 w-12 text-[#e9d27d]" />
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 rounded-[1.25rem] border border-white/80 bg-white/80 p-4 text-sm font-semibold text-[#263a8f] shadow-[0_18px_50px_rgba(19,35,72,0.12)] backdrop-blur-xl">
                Hi, I am your NIDUS AI Assistant. I will help you start your defence journey.
              </div>
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
                <Field label="Student name" value={form.studentName} onChange={(value) => updateField("studentName", value)} required />
                <Field label="Parent name" value={form.parentName} onChange={(value) => updateField("parentName", value)} />
                <Field label="Phone number" value={form.phone} onChange={(value) => updateField("phone", value)} required />
                <Field label="Class / qualification" value={form.qualification} onChange={(value) => updateField("qualification", value)} required />
                <label className="grid gap-2 text-sm font-semibold text-[#111827]">
                  Interested program
                  <select value={form.program} onChange={(event) => updateField("program", event.target.value)} className="h-12 rounded border border-[#263a8f]/15 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#263a8f]">
                    {programs.map((program) => <option key={program}>{program}</option>)}
                  </select>
                </label>
                <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
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
                </div>
              ) : (
                <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(38,58,143,0.26)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
                  Prepare WhatsApp Application <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </form>

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
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required = false, className = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-[#111827] ${className}`}>
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded border border-[#263a8f]/15 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#263a8f]" />
    </label>
  );
}
