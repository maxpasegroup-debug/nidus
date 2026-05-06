"use client";

export function MaintenanceBanner() {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true") return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] border-b border-gold/30 bg-navy-deep px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">
      Maintenance mode active
    </div>
  );
}
