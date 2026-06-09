export function OMRPalette({
  total,
  activeIndex,
  answered,
  marked,
  skipped,
  visited,
  onSelect
}: {
  total: number;
  activeIndex: number;
  answered: Set<number>;
  marked: Set<number>;
  skipped: Set<number>;
  visited?: Set<number>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Question Palette</p>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">Jump to any question. Colors show your exam status.</p>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-10 rounded border text-sm font-semibold transition ${
              activeIndex === index
                ? "border-blue-600 bg-blue-600 text-white"
                : marked.has(index)
                  ? "border-yellow-400 bg-yellow-100 text-yellow-800"
                  : answered.has(index)
                    ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                    : visited?.has(index) || skipped.has(index)
                      ? "border-red-500 bg-red-100 text-red-800"
                    : "border-slate-300 bg-slate-100 text-slate-600"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Green Answered {answered.size}</span>
        <span className="rounded bg-red-100 px-2 py-1 text-red-800">Red Not answered {skipped.size}</span>
        <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">Yellow Review {marked.size}</span>
        <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">Blue Current {activeIndex + 1}</span>
      </div>
      {skipped.size ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">Not Answered</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from(skipped).map((index) => (
              <button key={index} type="button" onClick={() => onSelect(index)} className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                Q{index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
