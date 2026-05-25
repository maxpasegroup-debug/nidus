import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="NIDUS Academy handles student, parent, lead, assessment, learning, payment, and support information with care for admission, training, reporting, counselling, and platform operations."
      sections={[
        { title: "Information We Collect", text: "We may collect name, phone, email, class, program interest, admission details, attendance, test responses, assessment reports, payment records, counselling notes, device/session data, and support messages." },
        { title: "How We Use Information", text: "Information is used to manage admissions, learning access, assessments, TOPRANK launch sessions, NIDUS Guru guidance, mentoring, reports, communication, payments, support, and safety of the platform." },
        { title: "AI and Assessment Data", text: "AI-supported insights are used to provide guidance, summaries, recommendations, learning direction, and report interpretation. AI outputs are supportive tools and should be reviewed by mentors, parents, or qualified professionals where needed." },
        { title: "Sharing and Service Providers", text: "We may use trusted providers for hosting, payments, notifications, analytics, communication, and integrated training infrastructure. We do not sell student personal information." },
        { title: "Security and Access", text: "Access is role-based inside the platform. Staff, mentors, administrators, students, and parents see information based on their permitted responsibilities." },
        { title: "Your Choices", text: "Users may request correction, access, or deletion where legally and operationally possible. Some records may be retained for academic, financial, compliance, or dispute-resolution purposes." }
      ]}
    />
  );
}
