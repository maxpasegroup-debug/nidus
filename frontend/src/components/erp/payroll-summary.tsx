import type { Payroll } from "@/types/erp";

export function PayrollSummary({ payroll }: { payroll: Payroll[] }) {
  const total = payroll.reduce((sum, item) => sum + item.totalSalary, 0);
  return <div className="rounded-lg border border-gold/20 bg-gold/10 p-5 backdrop-blur-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Monthly Payroll</p><p className="mt-3 text-3xl font-semibold text-gold-soft">Rs {Math.round(total).toLocaleString("en-IN")}</p><p className="mt-2 text-sm text-muted">{payroll.length} salary records</p></div>;
}
