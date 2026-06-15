"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signup } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { effectiveDashboardPath } from "@/lib/dashboard-data";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fieldClass = "!border-[#071d36]/14 !bg-white !text-[#071d36] placeholder:!text-[#64748b]/70 focus:!border-[#b9913f] focus:!bg-white focus:!ring-[#b9913f]/25";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await signup({ name, email, mobile, password });
      if (result.success && result.user) {
        window.location.assign(effectiveDashboardPath(result.user));
      } else {
        setError(result.message || "Account creation failed. Please try again.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f3ea] px-4 py-24 text-[#071d36]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(185,145,63,0.16),transparent_28rem),radial-gradient(circle_at_82%_18%,rgba(63,74,50,0.12),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-[#071d36]/10 bg-white/92 p-6 shadow-[0_28px_90px_rgba(7,29,54,0.14)] backdrop-blur-2xl sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#b9913f]/35 bg-[#fff7de] text-[#8a6426]">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Start Free</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#071d36]">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">Fill these basic details. You can explore NIDUS from your dashboard.</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          {error ? <div className="rounded border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Input label="Full name" placeholder="Student name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} required />
          <Input label="Email" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} required />
          <Input label="Mobile Number" placeholder="WhatsApp mobile number" value={mobile} onChange={(event) => setMobile(event.target.value)} className={fieldClass} required />
          <PasswordInput label="Password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} minLength={8} required />
          <PasswordInput label="Confirm Password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClass} minLength={8} required />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Start free"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[#64748b]">
          Already have an account? <Link href="/login" className="font-semibold text-[#071d36]">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
