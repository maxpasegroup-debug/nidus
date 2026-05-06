export function AnalysisCard({
  title,
  value,
  note
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gold-soft">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{note}</p>
    </div>
  );
}
