export function AnalysisCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1020]/92 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/65">{body}</p>
    </div>
  );
}
