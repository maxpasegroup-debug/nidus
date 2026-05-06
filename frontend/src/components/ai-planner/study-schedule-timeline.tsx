import type { StudyPlan } from "@/types/ai-planner";

export function StudyScheduleTimeline({ plan }: { plan: StudyPlan | null | undefined }) {
  const items = plan?.generatedPlan ?? [];
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">AI-generated schedule</p>
      <div className="mt-5 space-y-4">
        {items.length ? items.map((item) => (
          <div key={`${item.day}-${item.focus}`} className="rounded border border-white/10 bg-white/[0.035] p-4">
            <p className="font-semibold text-gold">{item.day} · {item.focus}</p>
            <p className="mt-1 text-sm text-muted">{item.hours} hours · {item.mission}</p>
          </div>
        )) : <p className="text-sm text-muted">Generate a plan to activate your AI schedule.</p>}
      </div>
    </div>
  );
}
