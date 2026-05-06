import type { RevisionSchedule } from "@/types/ai-planner";

export function RevisionCard({ revision }: { revision: RevisionSchedule }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white">{revision.topic}</p>
        <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-xs text-gold">{revision.priority}</span>
      </div>
      <p className="mt-2 text-sm text-muted">{new Date(revision.revisionDate).toLocaleDateString()} · {revision.status}</p>
    </div>
  );
}
