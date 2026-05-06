"use client";

import { SettingsPanel } from "@/components/admin-center/SettingsPanel";
import { useSettings } from "@/hooks/use-admin-center";

export default function SettingsPage() {
  const settings = useSettings();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">System Configuration</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Settings</h1>
          <p className="mt-2 text-sm text-muted">App, branding, email, and security controls for production operations.</p>
        </div>
        <div className="mt-6">
          {settings.isLoading ? <div className="h-96 animate-pulse rounded-lg bg-white/10" /> : <SettingsPanel settings={settings.data ?? []} pending={settings.update.isPending} onSave={(payload) => settings.update.mutate(payload)} />}
        </div>
      </section>
    </main>
  );
}
