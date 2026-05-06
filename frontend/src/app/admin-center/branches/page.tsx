"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { BranchCard } from "@/components/admin-center/BranchCard";
import { useBranches } from "@/hooks/use-admin-center";

export default function BranchesPage() {
  const branches = useBranches();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    branches.create.mutate({ name, location, contactNumber }, { onSuccess: () => { setName(""); setLocation(""); setContactNumber(""); } });
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Multi-Branch Command</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Branches</h1>
        </div>
        <form onSubmit={submit} className="premium-surface mt-6 grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_1fr_14rem_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Branch name" required />
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Location" required />
          <input value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Contact" required />
          <button className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-2 text-sm font-semibold text-navy-deep disabled:opacity-60" disabled={branches.create.isPending}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
        {branches.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-white/10" />)}</div>}
        {!branches.isLoading && (branches.data?.length ?? 0) === 0 && <div className="premium-surface mt-6 rounded-lg p-10 text-center text-muted">No branches registered yet.</div>}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(branches.data ?? []).map((branch) => <BranchCard key={branch.id} branch={branch} />)}
        </div>
      </section>
    </main>
  );
}
