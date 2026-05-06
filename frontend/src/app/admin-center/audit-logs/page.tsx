"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AuditTimeline } from "@/components/admin-center/AuditTimeline";
import { useAuditLogs } from "@/hooks/use-admin-center";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const logs = useAuditLogs({ search: search || undefined, module: module || undefined });

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Security Ledger</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Audit Logs</h1>
        </div>
        <div className="premium-surface mt-6 grid gap-3 rounded-lg p-3 sm:grid-cols-[1fr_14rem]">
          <div className="flex items-center gap-2 rounded bg-navy-deep/70 px-3 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search action, user, or description" />
          </div>
          <select value={module} onChange={(event) => setModule(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none">
            <option value="">All modules</option>
            {["auth", "roles", "settings", "branches", "media", "documents"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-6">
          {logs.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-white/10" />)}</div> : <AuditTimeline logs={logs.data ?? []} />}
        </div>
      </section>
    </main>
  );
}
