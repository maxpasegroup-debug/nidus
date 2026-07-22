"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/services/api";
import { createPublicLead } from "@/services/crm";

const initialForm = {
  fullName: "",
  parentName: "",
  mobile: "",
  email: "",
  studentClass: "",
  school: "",
  bloodGroup: "",
  address: "",
  message: ""
};

export function ProgramEnquiryForm({ programTitle, source = "Academy Program Page" }: { programTitle: string; source?: string }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
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
        source: `${source} - Academy Application`,
        message: [
          "APPLICATION_STATUS: SUBMITTED",
          "AO_QUEUE: YES",
          "ACADEMY APPLICATION",
          `Program: ${programTitle}`,
          `Student Name: ${form.fullName}`,
          `Parent Name: ${form.parentName}`,
          `WhatsApp: ${form.mobile}`,
          `Email: ${form.email}`,
          `Class: ${form.studentClass}`,
          `School: ${form.school}`,
          `Blood Group: ${form.bloodGroup}`,
          `Address: ${form.address}`,
          `Message: ${form.message || "-"}`,
          user ? `Applicant User ID: ${user.id}` : "",
          user?.mobile ? `Applicant Login Mobile: ${user.mobile}` : "",
          user?.email ? `Applicant Login Email: ${user.email}` : ""
        ].join("\n")
      });
      setSubmitted(true);
      setForm(initialForm);
      showToast("Application submitted. Administration will review and approve.", "success");
      if (user?.role === "GUEST" || user?.role === "STUDENT") {
        router.push("/dashboard/guest/applications");
      }
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32]">Apply Now</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#071d36]">{programTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">Your application will reach the Administration dashboard for review and approval.</p>
        </div>
      </div>

      {submitted ? (
        <div className="mt-5 rounded border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
          Thank you. Your application has been captured. Administration will review and contact you.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={form.fullName} onChange={(value) => update("fullName", value)} required />
        <Field label="Parent Name" value={form.parentName} onChange={(value) => update("parentName", value)} required />
        <Field label="WhatsApp number" value={form.mobile} onChange={(value) => update("mobile", value)} required inputMode="tel" />
        <Field label="Email" value={form.email} onChange={(value) => update("email", value)} required type="email" />
        <Field label="Student Class" value={form.studentClass} onChange={(value) => update("studentClass", value)} required />
        <Field label="School / College" value={form.school} onChange={(value) => update("school", value)} required />
        <Field label="Blood Group" value={form.bloodGroup} onChange={(value) => update("bloodGroup", value)} required placeholder="Example: O+" />
        <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
          Address
          <textarea required value={form.address} onChange={(event) => update("address", event.target.value)} className="min-h-20 rounded border border-[#071d36]/14 bg-white px-3 py-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" placeholder="House name, place, district" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#071d36] sm:col-span-2">
          Message / Goal
          <textarea value={form.message} onChange={(event) => update("message", event.target.value)} className="min-h-28 rounded border border-[#071d36]/14 bg-white px-3 py-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" placeholder="Tell us your goal, current class, preferred batch, or counselling question." />
        </label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-5 w-full sm:w-auto">
        <Send className="h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}

function Field({ label, value, onChange, required, type = "text", inputMode, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; inputMode?: "text" | "tel"; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#071d36]">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} className="h-12 rounded border border-[#071d36]/14 bg-white px-3 text-sm font-medium text-[#101827] outline-none focus:border-[#3f4a32]" />
    </label>
  );
}
