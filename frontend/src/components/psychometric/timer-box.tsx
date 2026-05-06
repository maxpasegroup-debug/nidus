export function TimerBox({ minutes }: { minutes: number }) {
  return (
    <div className="rounded-lg border border-gold/25 bg-gold/10 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Assessment Window</p>
      <p className="mt-2 text-3xl font-semibold text-gold-soft">{minutes}m</p>
    </div>
  );
}
