"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Plus, UserRound } from "lucide-react";
import { useUsers } from "@/hooks/use-admin-center";
import type { AuthRole } from "@/services/auth.v2";

const roles: Array<{ label: string; value: AuthRole }> = [
  { label: "Director", value: "DIRECTOR" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Student", value: "STUDENT" },
  { label: "Parent", value: "PARENT" },
  { label: "Telecaller", value: "TELECALLER" },
  { label: "Marketing", value: "MARKETING_COORDINATOR" }
];

export default function UsersPage() {
  const users = useUsers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<Exclude<AuthRole, "ADMIN" | "GUEST">>("STUDENT");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    users.create.mutate(
      { name, email, mobile, role },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEmail("");
          setMobile("");
          setRole("STUDENT");
        }
      }
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">User Command</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Users</h1>
            <p className="mt-2 text-sm text-muted">Create and review in-house accounts. New users receive the default password: 123456789.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep">
            <Plus className="h-5 w-5" /> Create user
          </button>
        </div>

        {users.isLoading && <div className="mt-6 grid gap-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-white/10" />)}</div>}

        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_0.8fr] bg-white/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Reset</span>
          </div>
          {(users.data ?? []).map((user) => (
            <div key={user.id} className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_0.8fr] items-center border-t border-white/10 px-4 py-4 text-sm">
              <span className="font-semibold text-ink">{user.name}</span>
              <span className="text-muted">{user.email}</span>
              <span className="text-gold-soft">{user.role}</span>
              <span className="text-muted">{user.roleMetadata?.defaultPassword ? "Default password" : user.roleOnboardingStatus ?? "ACTIVE"}</span>
              <button type="button" onClick={() => users.resetPassword.mutate(user.id)} disabled={users.resetPassword.isPending} className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 text-gold-soft transition hover:border-gold/50 disabled:opacity-50" aria-label={`Reset password for ${user.name}`}>
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="premium-surface w-full max-w-2xl rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="rounded bg-gold/15 p-3 text-gold-soft">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Create user</h2>
                <p className="text-sm text-muted">The user can sign in immediately with default password 123456789.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Full name" required />
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Email" type="email" required />
              <input value={mobile} onChange={(event) => setMobile(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Mobile" required />
              <select value={role} onChange={(event) => setRole(event.target.value as Exclude<AuthRole, "ADMIN" | "GUEST">)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60 sm:col-span-2">
                {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <div className="rounded border border-gold/20 bg-gold/10 px-3 py-2 text-sm text-gold-soft sm:col-span-2">Default password: 123456789</div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-white/15 px-5 py-3 text-sm font-semibold text-muted">Cancel</button>
              <button disabled={users.create.isPending} className="rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep disabled:opacity-60">Create user</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
