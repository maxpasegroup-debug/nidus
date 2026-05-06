export function AIInsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gold/20 bg-gradient-to-br from-gold/10 to-white/[0.045] p-5 backdrop-blur-xl">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}
