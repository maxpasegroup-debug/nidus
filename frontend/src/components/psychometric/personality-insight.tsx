export function PersonalityInsight({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1020]/92 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="font-semibold text-white">Recommendations</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white/65">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
