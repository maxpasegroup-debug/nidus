import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="premium-surface max-w-lg rounded-lg p-8 text-center">
        <WifiOff className="mx-auto h-10 w-10 text-gold-soft" />
        <h1 className="mt-5 text-2xl font-semibold text-ink">Offline command mode</h1>
        <p className="mt-3 text-sm text-muted">NIDUS is waiting for network access. Cached screens remain available where possible.</p>
      </section>
    </main>
  );
}
