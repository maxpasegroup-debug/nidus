import { examCards } from "@/lib/dashboard-data";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export function ExamHomepageCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {examCards.map((exam) => (
        <DashboardCard key={exam.title} className="p-5">
          <p className="text-3xl font-semibold text-gold-soft">{exam.title}</p>
          <p className="mt-2 text-sm text-white">{exam.subtitle}</p>
          <p className="mt-5 text-sm text-muted">{exam.metric}</p>
        </DashboardCard>
      ))}
    </section>
  );
}

