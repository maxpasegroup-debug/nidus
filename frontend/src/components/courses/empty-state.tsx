export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.045] p-8 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export function CourseSkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />
      ))}
    </div>
  );
}
