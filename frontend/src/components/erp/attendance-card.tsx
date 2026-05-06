export function AttendanceCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-3xl font-semibold text-gold-soft">{value}</p></div>;
}
