"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { PermissionMatrix } from "@/components/admin-center/PermissionMatrix";
import { RoleCard } from "@/components/admin-center/RoleCard";
import { usePermissions, useRoles } from "@/hooks/use-admin-center";
import type { AdminRole } from "@/types/admin-center";

export default function RolesPage() {
  const roles = useRoles();
  const permissions = usePermissions();
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setDescription(editing.description ?? "");
    setSelected(editing.permissions.map((item) => item.permission.id));
  }, [editing]);

  function startCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setSelected([]);
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { name, description, permissionIds: selected };
    if (editing) roles.update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    else roles.create.mutate(payload, { onSuccess: () => setOpen(false) });
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Access Command</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Roles</h1>
          </div>
          <button onClick={startCreate} className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep">
            <Plus className="h-5 w-5" /> Create role
          </button>
        </div>
        {roles.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-white/10" />)}</div>}
        {!roles.isLoading && (roles.data?.length ?? 0) === 0 && <div className="premium-surface mt-6 rounded-lg p-10 text-center text-muted">No custom roles yet.</div>}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(roles.data ?? []).map((role) => <RoleCard key={role.id} role={role} onEdit={(item) => { setEditing(item); setOpen(true); }} onDelete={(id) => roles.remove.mutate(id)} />)}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="premium-surface max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? "Edit role" : "Create role"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-white/15 p-2 text-muted" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Role name" required />
              <input value={description} onChange={(event) => setDescription(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Description" />
            </div>
            <div className="mt-5">
              <PermissionMatrix permissions={permissions.data ?? []} selected={selected} onToggle={(id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
            </div>
            <button disabled={roles.create.isPending || roles.update.isPending} className="mt-5 rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep disabled:opacity-60">
              {editing ? "Save role" : "Create role"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
