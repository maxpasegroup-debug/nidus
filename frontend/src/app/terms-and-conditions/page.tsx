import { LegalPage } from "@/components/legal/legal-page";

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These terms govern public enquiries, admissions, digital learning, assessments, mentoring, subscriptions, and use of the NIDUS Academy platform."
      sections={[
        { title: "Platform Use", text: "Users must provide accurate details, protect login credentials, and use NIDUS services only for lawful learning, assessment, admission, and academy purposes." },
        { title: "Programs and Subscriptions", text: "Program access, batch timing, mentor support, assessment access, exam coaching access, and NIDUS Guru quests may vary by plan, eligibility, payment status, and academy approval." },
        { title: "Digital Course Terms", text: "Recorded classes, PDFs, tests, dashboards, reports, AI summaries, and internal materials are for enrolled users only and may not be copied, resold, shared publicly, or misused." },
        { title: "Payments", text: "Fees, subscriptions, instalments, discounts, scholarships, and approvals are managed through official NIDUS records. Payment gateway terms may also apply." },
        { title: "Mentorship and Guidance", text: "Mentors provide educational and career guidance. Final academic, career, medical, psychological, and legal decisions remain with the student, parent, and qualified professionals where applicable." },
        { title: "Changes to Services", text: "NIDUS may improve, modify, pause, or replace features, schedules, content, or integrations to maintain quality, security, and operational stability." }
      ]}
    />
  );
}
