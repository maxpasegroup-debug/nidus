import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="premium-surface max-w-lg rounded-lg p-8 text-center">
        <Compass className="mx-auto h-10 w-10 text-gold-soft" />
        <h1 className="mt-5 text-2xl font-semibold text-ink">Route not found</h1>
        <p className="mt-3 text-sm text-muted">This NIDUS command route is unavailable or has moved.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
