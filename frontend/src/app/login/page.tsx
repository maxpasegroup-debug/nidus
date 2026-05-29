"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { roleDashboardPath } from "@/lib/dashboard-data";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fieldClass = "!border-[#071d36]/14 !bg-white !text-[#071d36] placeholder:!text-[#64748b]/70 focus:!border-[#b9913f] focus:!bg-white focus:!ring-[#b9913f]/25";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || password.length < 8) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await login({ identifier, password });
      if (result.success && result.user) {
        window.location.assign(result.user.mustChangePassword ? "/dashboard/settings?mustChangePassword=1" : roleDashboardPath[result.user.role] ?? "/dashboard");
      } else {
        setError(result.message || "Login failed. Please check your details.");
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
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">NIDUS Academy</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#071d36]">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">Enter your email or mobile number to open your dashboard.</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {error ? <div className="rounded border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Input label="Email or mobile" type="text" placeholder="Email or mobile number" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={fieldClass} required />
          <Input label="Password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} minLength={8} required />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <Link href="/forgot-password" className="font-semibold text-[#3f4a32]">Forgot password?</Link>
          <Link href="/register" className="font-semibold text-[#071d36]">Create account</Link>
        </div>
      </section>
    </main>
  );
}
