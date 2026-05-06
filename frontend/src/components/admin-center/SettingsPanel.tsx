"use client";

import { useEffect, useState } from "react";
import type { SystemSetting } from "@/types/admin-center";
import { groupByModule } from "./admin-utils";

type LocalSetting = SystemSetting & { module: string };

export function SettingsPanel({ settings, onSave, pending }: { settings: SystemSetting[]; onSave: (settings: Array<{ key: string; value: string; category: string }>) => void; pending?: boolean }) {
  const [draft, setDraft] = useState<SystemSetting[]>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const grouped = groupByModule(draft.map((setting) => ({ ...setting, module: setting.category } as LocalSetting)));

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="premium-surface rounded-lg p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">{category}</p>
            <h2 className="mt-2 text-lg font-semibold capitalize text-ink">{category} settings</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((setting) => (
              <label key={setting.key} className="block">
                <span className="text-xs text-muted">{setting.key}</span>
                <input
                  value={setting.value}
                  onChange={(event) => setDraft((current) => current.map((item) => item.key === setting.key ? { ...item, value: event.target.value } : item))}
                  className="mt-1 w-full rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60"
                />
              </label>
            ))}
          </div>
        </section>
      ))}
      <button
        type="button"
        onClick={() => onSave(draft.map(({ key, value, category }) => ({ key, value, category })))}
        disabled={pending}
        className="rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
