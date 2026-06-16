import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7fb] px-4 pb-20 pt-28 text-[#111827] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.16),transparent_28rem),radial-gradient(circle_at_82%_18%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
      <section className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#263a8f]">Contact NIDUS</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Speak with the academy team.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#536072]">
            Use this form for admissions, program guidance, school campaigns, assessments, TOP RANK, or NIDUS Guru enquiries.
          </p>
          <div className="mt-8 grid gap-4">
            {[
              [Mail, "support@nidusacademy.in", "Email"],
              [Phone, "+91 99695 94411", "WhatsApp / Phone"],
              [MapPin, "Kerala, India", "Academy Region"],
              [Building2, "Admissions, programs, assessments, and partnerships", "Support"]
            ].map(([Icon, value, label]) => {
              const ContactIcon = Icon as typeof Mail;
              return (
                <div key={String(label)} className="flex items-center gap-4 rounded border border-[#263a8f]/10 bg-white/76 p-4 shadow-sm backdrop-blur-xl">
                  <div className="rounded bg-[#263a8f]/10 p-3 text-[#263a8f]"><ContactIcon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#536072]">{String(label)}</p>
                    <p className="mt-1 font-semibold text-[#111827]">{String(value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ProgramEnquiryForm programTitle="General NIDUS Enquiry" source="Contact Page" />
      </section>
    </main>
  );
}
