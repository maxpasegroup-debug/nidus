export function PersonalityInsight({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">Recommendations</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-muted">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
