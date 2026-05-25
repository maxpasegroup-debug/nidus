"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BrainCircuit, LockKeyhole } from "lucide-react";
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
    <main className="relative min-h-screen overflow-hidden bg-[#f6f3ec] px-4 pb-16 pt-28 text-[#111827] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f3ec_100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_29rem] lg:items-center">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#263a8f]">Secure Academy Access</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#111827] sm:text-6xl">Continue your NIDUS journey.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072]">
            Students, parents, faculty, and guests enter through one secure platform.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Encrypted token session", "Role-aware routing", "Audit-ready access"].map((item) => (
              <div key={item} className="rounded border border-[#263a8f]/10 bg-white/78 p-4 text-sm font-semibold text-[#536072] shadow-sm backdrop-blur-xl">{item}</div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-[#263a8f]/10 bg-white/86 p-6 shadow-[0_28px_90px_rgba(19,35,72,0.14)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c9a646]/12 blur-3xl" />
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">NIDUS</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#111827]">Login / Signup</h2>
              <p className="mt-2 text-sm text-[#536072]">Use your assigned credentials to continue.</p>
            </div>
            <div className="rounded-full border border-[#c9a646]/30 bg-[#fff8dd] p-3">
              <BrainCircuit className="h-6 w-6 text-[#7c6418]" />
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error ? <div className="rounded border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <Input label="Email or mobile" type="text" placeholder="officer@nidus.mil" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
            <Input label="Password" type="password" placeholder="Enter secure password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Access Platform"}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#536072]">
            <LockKeyhole className="h-4 w-4 text-[#263a8f]" />
            <span>Student, parent, teacher, admin, and guest access resolves from one login.</span>
          </div>
          <p className="mt-4 text-center text-sm text-[#536072]"><Link href="/forgot-password" className="font-semibold text-[#263a8f]">Forgot password?</Link></p>
          <p className="mt-6 text-center text-sm text-[#536072]">New to NIDUS? <Link href="/register" className="font-semibold text-[#263a8f]">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
