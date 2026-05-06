import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="flex min-h-[calc(100vh-12rem)] flex-col justify-center gap-8 py-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
            NIDUS Command Training
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-7xl">
            Premium defence training command center.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            Plan, assign, and monitor structured readiness programs with a secure interface built for disciplined teams and high-stakes operations.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard">Enter Dashboard</Button>
          <Button href="/login" variant="secondary">Officer Login</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["96%", "Readiness visibility"],
            ["24/7", "Field access"],
            ["3", "Training tiers"]
          ].map(([value, label]) => (
            <Card key={label} className="p-5">
              <p className="text-3xl font-semibold text-gold-soft">{value}</p>
              <p className="mt-2 text-sm text-muted">{label}</p>
            </Card>
          ))}
        </div>
      </section>

      <aside className="flex items-center">
        <Card className="w-full p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-sm text-muted">Mission cycle</p>
              <h2 className="mt-1 text-2xl font-semibold">Alpha Readiness</h2>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-soft">
              Live
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ["Foundation", "Complete", "100%"],
              ["Field Command", "Active", "68%"],
              ["Simulation", "Queued", "24%"]
            ].map(([name, status, progress]) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-muted">{status}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: progress }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
