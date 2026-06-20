"use client";

import { useMemo, useState } from "react";

type PaletteFilter = "ALL" | "ANSWERED" | "SKIPPED" | "REVIEW" | "UNANSWERED";

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
  const [activeGroup, setActiveGroup] = useState(0);
  const [filter, setFilter] = useState<PaletteFilter>("ALL");
  const groupSize = 20;
  const groups = Math.max(1, Math.ceil(total / groupSize));
  const visibleIndexes = useMemo(() => {
    const start = activeGroup * groupSize;
    const indexes = Array.from({ length: Math.min(groupSize, total - start) }).map((_, offset) => start + offset);
    return indexes.filter((index) => {
      if (filter === "ANSWERED") return answered.has(index);
      if (filter === "SKIPPED") return skipped.has(index);
      if (filter === "REVIEW") return marked.has(index);
      if (filter === "UNANSWERED") return !answered.has(index) && !marked.has(index) && !skipped.has(index);
      return true;
    });
  }, [activeGroup, answered, filter, marked, skipped, total]);

  function statusClass(index: number) {
    if (activeIndex === index) return "border-blue-600 bg-blue-600 text-white";
    if (marked.has(index)) return "border-yellow-400 bg-yellow-100 text-yellow-800";
    if (answered.has(index)) return "border-emerald-500 bg-emerald-100 text-emerald-800";
    if (visited?.has(index) || skipped.has(index)) return "border-red-500 bg-red-100 text-red-800";
    return "border-slate-300 bg-slate-100 text-slate-600";
  }

  return (
    <div className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Question Palette</p>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">Jump to any question. Use groups and filters for long papers.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: groups }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveGroup(index)}
            className={`rounded border px-3 py-2 text-xs font-semibold ${activeGroup === index ? "border-[#071d36] bg-[#071d36] text-white" : "border-slate-300 bg-white text-[#071d36]"}`}
          >
            {index * groupSize + 1}-{Math.min(total, (index + 1) * groupSize)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["ALL", "ANSWERED", "SKIPPED", "REVIEW", "UNANSWERED"] as PaletteFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${filter === item ? "border-[#b9913f] bg-[#fff7de] text-[#071d36]" : "border-slate-200 bg-slate-50 text-slate-600"}`}
          >
            {item.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {visibleIndexes.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-10 rounded border text-sm font-semibold transition ${statusClass(index)}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Answered {answered.size}</span>
        <span className="rounded bg-red-100 px-2 py-1 text-red-800">Skipped {skipped.size}</span>
        <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">Review {marked.size}</span>
        <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Unanswered {Math.max(0, total - answered.size - skipped.size - marked.size)}</span>
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
