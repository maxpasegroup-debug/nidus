import type { Faculty } from "@/types/erp";

export function FacultyCard({ faculty }: { faculty: Faculty }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><p className="text-xs text-gold">{faculty.department}</p><h3 className="mt-2 font-semibold text-white">{faculty.user?.name ?? faculty.userId}</h3><p className="mt-2 text-sm text-muted">{faculty.designation}</p><p className="mt-3 text-sm text-gold-soft">{faculty.status}</p></div>;
}
