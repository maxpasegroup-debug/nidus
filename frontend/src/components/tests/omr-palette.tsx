export function OMRPalette({
  total,
  activeIndex,
  answered,
  marked,
  skipped,
  onSelect
}: {
  total: number;
  activeIndex: number;
  answered: Set<number>;
  marked: Set<number>;
  skipped: Set<number>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Question Sidebar</p>
      <p className="mt-2 text-xs leading-5 text-muted">Jump to any question. Skipped questions are shown separately below.</p>
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
                    : skipped.has(index)
                      ? "border-amber-300/40 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-muted"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
        <span className="rounded bg-emerald-400/15 px-2 py-1 text-emerald-100">Answered {answered.size}</span>
        <span className="rounded bg-amber-400/15 px-2 py-1 text-amber-100">Skipped {skipped.size}</span>
        <span className="rounded bg-purple-400/15 px-2 py-1 text-purple-100">Review {marked.size}</span>
        <span className="rounded bg-gold/15 px-2 py-1 text-gold-soft">Current {activeIndex + 1}</span>
      </div>
      {skipped.size ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">Skipped Questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from(skipped).map((index) => (
              <button key={index} type="button" onClick={() => onSelect(index)} className="rounded border border-amber-300/35 bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-100">
                Q{index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
