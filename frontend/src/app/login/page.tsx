"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login({ identifier, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-9rem)] items-center gap-8 lg:grid-cols-[1fr_460px]">
      <section className="hidden lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
          Secure Access
        </p>
        <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight text-white">
          Authenticate into the NIDUS command environment.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted">
          A minimal officer login surface prepared for token-based backend authentication.
        </p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">NIDUS</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Officer Login</h2>
          <p className="mt-2 text-sm text-muted">Use your assigned credentials to continue.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Email or mobile"
            type="text"
            placeholder="officer@nidus.mil"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter secure password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Authenticating..." : "Access Platform"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
