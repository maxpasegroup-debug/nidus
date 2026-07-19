"use client";

import Link from "next/link";
import { KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";

export function AcademicProfile() {
  const { user, loading } = useAuth();
  const role = String(user?.role || "Academic user").replaceAll("_", " ");
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">My Profile</p>
        <h1 className="mt-2 text-3xl font-black">Account and security</h1>
        <p className="mt-2 text-sm text-[var(--muted-blue)]">Your verified NIDUS identity and account controls.</p>
      </header>
      <section className="grid gap-5 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:grid-cols-[180px_1fr] sm:p-6">
        <div className="grid content-center justify-items-center rounded-2xl bg-slate-950 p-6 text-center text-white">
          <span className="grid h-20 w-20 overflow-hidden rounded-full bg-white text-3xl font-black text-slate-950">
            {user?.imageUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${user.imageUrl})` }} /> : <span className="m-auto">{(user?.name || "?").slice(0, 1).toUpperCase()}</span>}
          </span>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#e7c873]">{role}</p>
        </div>
        <div className="grid content-start gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">Name</p><h2 className="mt-1 text-2xl font-black">{loading ? "Loading..." : user?.name || "Name unavailable"}</h2></div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ProfileField icon={Mail} label="Email" value={user?.email || "Not added"} />
            <ProfileField icon={Phone} label="Mobile" value={user?.mobile || "Not added"} />
            <ProfileField icon={UserRound} label="Role" value={role} />
            <ProfileField icon={ShieldCheck} label="Account" value={user?.emailVerified ? "Verified" : "Active"} />
          </div>
          <Link href="/dashboard/settings" className="mt-3 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white"><KeyRound size={17} /> Change PIN</Link>
        </div>
      </section>
    </main>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white"><Icon size={16} /></span><span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--gold-dark)]">{label}</span><strong className="mt-1 block truncate text-sm">{value}</strong></span></div>;
}
