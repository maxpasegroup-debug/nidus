"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendVerification, verifyEmail } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

function VerifyEmailContent() {
  const params = useSearchParams();
  const { showToast } = useToast();
  const token = params?.get("token");
  const [identifier, setIdentifier] = useState(params?.get("identifier") ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => {
        showToast("Account verified successfully", "success");
        window.location.assign("/dashboard");
      })
      .catch((error) => showToast(getApiErrorMessage(error), "error"));
  }, [showToast, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await resendVerification(identifier);
      showToast(response.message ?? "Verification request completed", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md rounded-lg border border-gold/25 bg-white/[0.075] p-8 backdrop-blur-2xl">
        <ShieldCheck className="h-8 w-8 text-gold-soft" />
        <h1 className="mt-4 text-3xl font-semibold text-ink">Account Access</h1>
        <p className="mt-2 text-sm text-muted">NIDUS login uses your registered mobile number and 4 digit PIN. Email verification is not required for academy access.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input label="Registered mobile number" value={identifier} onChange={(event) => setIdentifier(event.target.value.replace(/\D/g, "").slice(0, 15))} inputMode="tel" required />
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Checking..." : "Check Account"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="font-semibold text-gold-soft">Back to login</Link></p>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="px-4 pt-28 text-center text-muted">Loading...</main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
