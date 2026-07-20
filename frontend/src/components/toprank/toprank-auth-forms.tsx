"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { loginTopRankUser, registerTopRankUser, requestTopRankPasswordReset } from "@/services/toprank-auth-service";

const inputClass = "min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]";

function Notice({ message, tone }: { message: string; tone: "error" | "success" }) {
  return <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${tone === "error" ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"}`}>{message}</p>;
}

export function TopRankLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = await loginTopRankUser(form);
      router.push(result.redirectTo);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mx-auto grid max-w-xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {error ? <Notice message={error} tone="error" /> : null}
      <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} className={inputClass} required /></label>
      <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Password<input type="password" value={form.password} onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))} className={inputClass} required /></label>
      <label className="flex items-center gap-3 text-sm font-bold text-[#c9d0c2]"><input type="checkbox" checked={form.rememberMe} onChange={(event) => setForm((state) => ({ ...state, rememberMe: event.target.checked }))} /> Remember me</label>
      <div className="flex items-center justify-between gap-4">
        <Link href="/toprank/forgot-password" className="text-sm font-bold text-[#f6d17a]">Forgot Password</Link>
        <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] disabled:opacity-60">{busy ? "Logging in" : "Login"}</button>
      </div>
    </form>
  );
}

export function TopRankRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", state: "", district: "", language: "", acceptTerms: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await registerTopRankUser(form);
      router.push("/toprank/onboarding");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const setField = (key: keyof typeof form, value: string | boolean) => setForm((state) => ({ ...state, [key]: value }));

  return (
    <form className="mx-auto grid max-w-2xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {error ? <Notice message={error} tone="error" /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Full Name<input value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} required /></label>
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Mobile Number<input value={form.phone} onChange={(event) => setField("phone", event.target.value)} className={inputClass} required /></label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className={inputClass} required /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Password<input type="password" value={form.password} onChange={(event) => setField("password", event.target.value)} className={inputClass} required /></label>
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Confirm Password<input type="password" value={form.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} className={inputClass} required /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">State<input value={form.state} onChange={(event) => setField("state", event.target.value)} className={inputClass} required /></label>
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">District<input value={form.district} onChange={(event) => setField("district", event.target.value)} className={inputClass} required /></label>
        <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Language<input value={form.language} onChange={(event) => setField("language", event.target.value)} className={inputClass} required /></label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-[#c9d0c2]"><input type="checkbox" checked={form.acceptTerms} onChange={(event) => setField("acceptTerms", event.target.checked)} className="mt-1" /> I agree to the TopRank terms and admission communication policy.</label>
      <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] disabled:opacity-60">{busy ? "Creating account" : "Register"}</button>
    </form>
  );
}

export function TopRankForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setNotice("");
    setError("");
    try {
      const result = await requestTopRankPasswordReset(email);
      setNotice(result.message);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <form className="mx-auto grid max-w-xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {notice ? <Notice message={notice} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}
      <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required /></label>
      <button type="submit" className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Send Reset Instructions</button>
    </form>
  );
}

