"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("NIDUS route error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="premium-surface max-w-lg rounded-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-gold-soft" />
        <h1 className="mt-5 text-2xl font-semibold text-ink">Command view interrupted</h1>
        <p className="mt-3 text-sm text-muted">The interface hit a recoverable error. Your session and saved data remain protected.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex items-center justify-center gap-2 rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep">
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </section>
    </main>
  );
}
