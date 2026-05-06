"use client";

import { ShieldCheck } from "lucide-react";
import { PermissionMatrix } from "@/components/admin-center/PermissionMatrix";
import { groupByModule } from "@/components/admin-center/admin-utils";
import { usePermissions } from "@/hooks/use-admin-center";

export default function PermissionsPage() {
  const permissions = usePermissions();
  const groups = groupByModule(permissions.data ?? []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Security Grid</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Permissions</h1>
          <p className="mt-2 text-sm text-muted">Module-based controls for route access and sensitive command operations.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Object.entries(groups).map(([module, items]) => (
            <div key={module} className="premium-surface rounded-lg p-4">
              <ShieldCheck className="h-5 w-5 text-gold-soft" />
              <p className="mt-3 text-2xl font-semibold">{items.length}</p>
              <p className="text-sm capitalize text-muted">{module}</p>
            </div>
          ))}
        </div>
        <div className="premium-surface mt-6 rounded-lg p-5">
          {permissions.isLoading ? <div className="h-96 animate-pulse rounded bg-white/10" /> : <PermissionMatrix permissions={permissions.data ?? []} selected={(permissions.data ?? []).map((item) => item.id)} />}
        </div>
      </section>
    </main>
  );
}
