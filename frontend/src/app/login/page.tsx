"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BrainCircuit, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || password.length < 8) return;
    setIsSubmitting(true);

    try {
      await login({ identifier, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.44),#030812_86%),url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(201,166,70,0.22),transparent_24rem),radial-gradient(circle_at_18%_40%,rgba(59,130,246,0.16),transparent_28rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_29rem] lg:items-center">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">Secure Academy Access</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink sm:text-6xl">Enter the NIDUS command environment.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted">
            One unified authentication system for students, parents, faculty, staff, administrators, and guests.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Encrypted token session", "Role-aware routing", "Audit-ready access"].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-white/7 p-4 text-sm text-muted backdrop-blur-xl">{item}</div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-gold/25 bg-white/[0.075] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/12 blur-3xl" />
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">NIDUS</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Officer Login</h2>
              <p className="mt-2 text-sm text-muted">Use your assigned credentials to continue.</p>
            </div>
            <div className="rounded-full border border-gold/30 bg-gold/10 p-3">
              <BrainCircuit className="h-6 w-6 text-gold-soft" />
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input label="Email or mobile" type="text" placeholder="officer@nidus.mil" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
            <Input label="Password" type="password" placeholder="Enter secure password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Authenticating..." : "Access Platform"}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <LockKeyhole className="h-4 w-4 text-gold-soft" />
            <span>Student, parent, teacher, admin, and guest access resolves from one login.</span>
          </div>
          <p className="mt-4 text-center text-sm text-muted"><Link href="/forgot-password" className="font-semibold text-gold-soft">Forgot password?</Link></p>
          <p className="mt-6 text-center text-sm text-muted">New to NIDUS? <Link href="/register" className="font-semibold text-gold-soft">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
