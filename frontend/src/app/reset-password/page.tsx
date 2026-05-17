"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      showToast(response.message ?? "Password reset successfully", "success");
      router.replace("/login");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md rounded-lg border border-gold/25 bg-white/[0.075] p-8 backdrop-blur-2xl">
        <LockKeyhole className="h-8 w-8 text-gold-soft" />
        <h1 className="mt-4 text-3xl font-semibold text-ink">Choose New Password</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
          <Button type="submit" className="w-full" disabled={isSubmitting || !token}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
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
