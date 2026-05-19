import { Building2, Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.70),#030812_92%),url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(201,166,70,0.20),transparent_24rem),radial-gradient(circle_at_16%_46%,rgba(59,130,246,0.14),transparent_26rem)]" />
      <section className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">Contact NIDUS</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink sm:text-6xl">Bring elite defence training to your academy.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted">
            Speak with the NIDUS team about academy deployment, student onboarding, AI features, and management access.
          </p>
          <div className="mt-8 grid gap-4">
            {[
              [Mail, "admissions@nidus.defence", "Email"],
              [Phone, "+91 90000 00000", "Phone"],
              [MapPin, "India / Railway Cloud", "Deployment"],
              [Building2, "Academy onboarding and institutional setup", "Programs"]
            ].map(([Icon, value, label]) => (
              <div key={String(label)} className="flex items-center gap-4 rounded border border-white/10 bg-white/7 p-4 backdrop-blur-xl">
                <div className="rounded bg-gold/12 p-3 text-gold-soft"><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{String(label)}</p>
                  <p className="mt-1 font-semibold text-ink">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form className="relative overflow-hidden rounded-lg border border-gold/25 bg-white/[0.075] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/12 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-semibold text-ink">Contact the academy team</h2>
            <p className="mt-2 text-sm text-muted">This public contact surface is ready to connect with Resend or CRM lead capture.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input className="rounded border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-gold" placeholder="Full name" />
              <input className="rounded border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-gold" placeholder="Academy / Organization" />
              <input className="rounded border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-gold" placeholder="Email" />
              <input className="rounded border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-gold" placeholder="Phone" />
            </div>
            <textarea className="mt-4 min-h-36 w-full rounded border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-gold" placeholder="Tell us about your defence training requirements" />
            <button type="button" className="mt-5 inline-flex items-center gap-2 rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep">
              Send Request <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
