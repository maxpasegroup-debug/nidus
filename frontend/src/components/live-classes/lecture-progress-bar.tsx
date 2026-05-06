export function LectureProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
