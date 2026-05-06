export function OMRPalette({
  total,
  activeIndex,
  answered,
  marked,
  onSelect
}: {
  total: number;
  activeIndex: number;
  answered: Set<number>;
  marked: Set<number>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">OMR Palette</p>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-10 rounded border text-sm font-semibold transition ${
              activeIndex === index
                ? "border-gold bg-gold text-navy"
                : marked.has(index)
                  ? "border-purple-300/40 bg-purple-400/15 text-purple-100"
                  : answered.has(index)
                    ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                    : "border-white/10 bg-white/[0.04] text-muted"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
