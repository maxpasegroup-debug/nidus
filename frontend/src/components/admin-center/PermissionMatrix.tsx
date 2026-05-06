"use client";

import type { Permission } from "@/types/admin-center";
import { groupByModule } from "./admin-utils";

export function PermissionMatrix({ permissions, selected = [], onToggle }: { permissions: Permission[]; selected?: string[]; onToggle?: (id: string) => void }) {
  const groups = groupByModule(permissions);

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([module, items]) => (
        <section key={module} className="rounded border border-white/10 bg-navy-deep/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold capitalize text-ink">{module}</h3>
            <span className="text-xs text-muted">{items.length} controls</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((permission) => {
              const active = selected.includes(permission.id);
              return (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => onToggle?.(permission.id)}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-left text-sm transition ${active ? "border-gold/50 bg-gold/15 text-gold-soft" : "border-white/10 text-muted hover:text-ink"}`}
                >
                  <span>{permission.name}</span>
                  <span className={`h-5 w-9 rounded-full p-0.5 transition ${active ? "bg-gold" : "bg-white/15"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-navy-deep transition ${active ? "translate-x-4" : ""}`} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
