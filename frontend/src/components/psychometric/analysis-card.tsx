export function AnalysisCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}
