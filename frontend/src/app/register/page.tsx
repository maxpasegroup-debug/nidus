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
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.40),#030812_86%),url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_22%,rgba(201,166,70,0.24),transparent_26rem),radial-gradient(circle_at_18%_42%,rgba(59,130,246,0.14),transparent_26rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_31rem] lg:items-center">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">Start Your Mission</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-6xl">From aspirant to officer, your command journey begins here.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted">Create one secure NIDUS identity and enter the academy ecosystem built for defence readiness.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {["AI-powered training", "SSB + OLQ analytics", "Mock tests and courses", "Parent visibility"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded border border-white/10 bg-white/7 p-4 text-sm text-muted backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4 text-gold-soft" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-gold/25 bg-white/[0.075] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/12 blur-3xl" />
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">NIDUS Registration</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Create Account</h2>
            </div>
            <Sparkles className="h-7 w-7 text-gold-soft" />
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {error ? <div className="rounded border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input label="Mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Join NIDUS"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-gold-soft">Login</Link></p>
        </section>
      </div>
    </main>
  );
}
