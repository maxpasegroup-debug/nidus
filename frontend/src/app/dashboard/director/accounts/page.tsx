"use client";

import { BadgeIndianRupee, BarChart3, CreditCard, FileText, ReceiptText, Settings, ShieldCheck, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const accountSections = [
  { id: "fees", title: "Fee Management", text: "Course fees, student payments and pending dues.", icon: BadgeIndianRupee },
  { id: "invoices", title: "Invoices & Receipts", text: "Generate and track payment receipts.", icon: ReceiptText },
  { id: "expenses", title: "Expenses", text: "Office, salary, rent, marketing and operational expenses.", icon: CreditCard },
  { id: "subscriptions", title: "Subscriptions", text: "TOPRANK, assessments and premium module subscriptions.", icon: WalletCards },
  { id: "reports", title: "Reports", text: "Academic, admissions, marketing, finance and staff reports.", icon: BarChart3 },
  { id: "settings", title: "Settings", text: "Company details, contact number, branch and system controls.", icon: Settings },
  { id: "audit", title: "Audit Logs", text: "Track important actions by staff and management.", icon: FileText },
];

export default function DirectorAccountsPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Admin & Accounts</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Finance and operations control</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            A clean Director-owned accounts room. Connect these cards to real payment, expense, invoice and audit data as each
            operations workflow goes live.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountSections.map((section) => (
            <AccountCard key={section.id} section={section} />
          ))}
        </section>
      </section>
    </main>
  );
}

function AccountCard({ section }: { section: { id: string; title: string; text: string; icon: LucideIcon } }) {
  const Icon = section.icon;
  return (
    <article id={section.id} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-2xl font-black">{section.title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">{section.text}</p>
      <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-blue)]">
        <ShieldCheck className="mb-2 h-5 w-5 text-[var(--gold)]" />
        Live data connection ready. No demo finance data is displayed.
      </div>
    </article>
  );
}
