"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await forgotPassword(identifier);
      const message = response.message ?? "Password reset instructions sent";
      setSuccessMessage(message);
      showToast(message, "success");
    } catch (error) {
      const message = getApiErrorMessage(error);
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md rounded-lg border border-gold/25 bg-white/[0.075] p-8 backdrop-blur-2xl">
        <KeyRound className="h-8 w-8 text-gold-soft" />
        <h1 className="mt-4 text-3xl font-semibold text-ink">Reset Password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email or mobile number. Email accounts receive a secure reset link; mobile recovery is prepared for OTP support later.</p>
        {successMessage ? <div className="mt-5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</div> : null}
        {errorMessage ? <div className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</div> : null}
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input label="Email or Mobile Number" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Reset Link"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="font-semibold text-gold-soft">Back to login</Link></p>
      </section>
    </main>
  );
}
