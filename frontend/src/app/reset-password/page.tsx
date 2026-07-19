"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";
  const router = useRouter();
  const { showToast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(token ? "" : "Invalid or missing reset token.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    if (!token) {
      setErrorMessage("Invalid or missing reset token.");
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage("PINs do not match.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage("PIN must be exactly 4 digits.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, pin);
      const message = response.message ?? "PIN reset successfully";
      setSuccessMessage(message);
      showToast(message, "success");
      setTimeout(() => router.replace("/login"), 1200);
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
        <LockKeyhole className="h-8 w-8 text-gold-soft" />
        <h1 className="mt-4 text-3xl font-semibold text-ink">Choose New PIN</h1>
        {successMessage ? <div className="mt-5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</div> : null}
        {errorMessage ? <div className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</div> : null}
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <PasswordInput label="New 4 Digit PIN" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
          <PasswordInput label="Confirm PIN" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
          <Button type="submit" className="w-full" disabled={isSubmitting || !token || Boolean(successMessage)}>{isSubmitting ? "Updating..." : "Update PIN"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted"><Link href="/forgot-password" className="font-semibold text-gold-soft">Request a new link</Link></p>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="px-4 pt-28 text-center text-muted">Loading...</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
