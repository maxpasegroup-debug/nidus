"use client";

import { type FormEvent, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/services/api";
import { createPublicLead } from "@/services/crm";

const initialForm = {
  fullName: "",
  mobile: "",
  email: "",
  studentClass: "",
  message: ""
};

export function ProgramEnquiryForm({ programTitle, source = "Academy Program Page" }: { programTitle: string; source?: string }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createPublicLead({
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        studentClass: form.studentClass,
        targetExam: programTitle,
        source,
        message: form.message
      });
      setSubmitted(true);
      setForm(initialForm);
      showToast("Enquiry received. NIDUS support will follow up.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-[#071d36]/10 bg-white/86 p-5 shadow-[0_24px_80px_rgba(7,29,54,0.10)] backdrop-blur-2xl">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded bg-[#f7f3ea] text-[#3f4a32]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32]">Enquire Now</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#071d36]">{programTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">Your enquiry will be saved to the NIDUS lead management dashboard.</p>
        </div>
      </div>

      {submitted ? (
        <div className="mt-5 rounded border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
          Thank you. Your enquiry has been captured. Our team will contact you shortly.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={form.fullName} onChange={(value) => update("fullName", value)} required />
        <Field label="WhatsApp number" value={form.mobile} onChange={(value) => update("mobile", value)} required inputMode="tel" />
        <Field label="Email" value={form.email} onChange={(value) => update("email", value)} required type="email" />
        <Field label="Student Class" value={form.studentClass} onChange={(value) => update("studentClass", value)} required />
        <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
          Message
          <textarea value={form.message} onChange={(event) => update("message", event.target.value)} className="min-h-28 rounded border border-[#071d36]/14 bg-white px-3 py-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" placeholder="Tell us your goal, current class, preferred batch, or counselling question." />
        </label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-5 w-full sm:w-auto">
        <Send className="h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Enquiry"}
      </Button>
    </form>
  );
}

function Field({ label, value, onChange, required, type = "text", inputMode }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; inputMode?: "text" | "tel" }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#071d36]">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" />
    </label>
  );
}
