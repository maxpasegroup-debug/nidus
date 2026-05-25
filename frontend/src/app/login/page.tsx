"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
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
  const fieldClass = "border-[#071d36]/14 bg-white text-[#071d36] placeholder:text-[#64748b]/70 focus:border-[#b9913f] focus:bg-white focus:ring-[#b9913f]/25";

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
        setError(result.message || "Login failed");
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
      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_29rem] lg:items-center">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3f4a32]">NIDUS Academy Login</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Welcome back to your training dashboard.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">
            Students, parents, faculty, and guests can continue from the right dashboard after login.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Student training", "Parent updates", "Faculty tools"].map((item) => (
              <div key={item} className="rounded border border-[#071d36]/10 bg-white/78 p-4 text-sm font-semibold text-[#64748b] shadow-sm backdrop-blur-xl">{item}</div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-[#071d36]/10 bg-white/86 p-6 shadow-[0_28px_90px_rgba(7,29,54,0.12)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#b9913f]/12 blur-3xl" />
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Secure Access</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Login</h2>
              <p className="mt-2 text-sm text-[#64748b]">Enter your email or mobile and password.</p>
            </div>
            <div className="rounded-full border border-[#b9913f]/30 bg-[#f7f3ea] p-3">
              <ShieldCheck className="h-6 w-6 text-[#3f4a32]" />
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error ? <div className="rounded border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <Input label="Email or mobile" type="text" placeholder="Enter email or mobile number" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={fieldClass} required />
            <Input label="Password" type="password" placeholder="Enter password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} minLength={8} required />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#64748b]">
            <LockKeyhole className="h-4 w-4 text-[#3f4a32]" />
            <span>Your dashboard opens automatically based on your role.</span>
          </div>
          <p className="mt-4 text-center text-sm text-[#64748b]"><Link href="/forgot-password" className="font-semibold text-[#071d36]">Forgot password?</Link></p>
          <p className="mt-6 text-center text-sm text-[#64748b]">New to NIDUS? <Link href="/register" className="font-semibold text-[#071d36]">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
