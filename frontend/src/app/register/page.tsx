"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { roleDashboardPath } from "@/lib/dashboard-data";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fieldClass = "border-[#071d36]/14 bg-white text-[#071d36] placeholder:text-[#64748b]/70 focus:border-[#b9913f] focus:bg-white focus:ring-[#b9913f]/25";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const result = await signup({ name, email, mobile, password });
      if (result.success && result.user) {
        window.location.assign(roleDashboardPath[result.user.role] ?? "/dashboard");
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f3ea] px-4 pb-16 pt-28 text-[#101827] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_31rem] lg:items-center">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3f4a32]">Start Free</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Create your NIDUS account.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">Start with free access, explore assessments, and understand the right defence training path.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {["Free profile access", "Assessment guidance", "Academy counselling", "Student dashboard"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-white/78 p-4 text-sm font-semibold text-[#64748b] shadow-sm backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4 text-[#b9913f]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-[#071d36]/10 bg-white/86 p-6 shadow-[0_28px_90px_rgba(7,29,54,0.12)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#b9913f]/12 blur-3xl" />
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">NIDUS Registration</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Create Account</h2>
              <p className="mt-2 text-sm text-[#64748b]">Fill basic details to start.</p>
            </div>
            <Sparkles className="h-7 w-7 text-[#b9913f]" />
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {error ? <div className="rounded border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} required />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} required />
            <Input label="Mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} className={fieldClass} required />
            <Input label="Password" type="password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} minLength={8} required />
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Join NIDUS"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">Already registered? <Link href="/login" className="font-semibold text-[#071d36]">Login</Link></p>
        </section>
      </div>
    </main>
  );
}
