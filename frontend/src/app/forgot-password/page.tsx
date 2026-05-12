"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(identifier);
      showToast(response.message, "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md rounded-lg border border-gold/25 bg-white/[0.075] p-8 backdrop-blur-2xl">
        <KeyRound className="h-8 w-8 text-gold-soft" />
        <h1 className="mt-4 text-3xl font-semibold text-ink">Reset Password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email or mobile and we will send a secure reset link.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input label="Email or mobile" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Reset Link"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="font-semibold text-gold-soft">Back to login</Link></p>
      </section>
    </main>
  );
}
