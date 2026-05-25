import { LegalPage } from "@/components/legal/legal-page";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="NIDUS Academy maintains a transparent refund approach for admissions, digital services, subscriptions, and training programs."
      sections={[
        { title: "General Refund Principle", text: "Refund eligibility depends on the program type, access already provided, batch commencement, mentor allocation, digital content usage, and the written terms communicated at admission." },
        { title: "Digital Courses and Assessments", text: "Payments for digital courses, downloadable reports, completed assessments, AI reports, and activated subscriptions may be non-refundable once access or report generation has started." },
        { title: "Classroom and Physical Training", text: "For classroom, foundation, physical training, and integrated programs, refund requests are reviewed against batch start date, attendance, materials issued, and administrative costs." },
        { title: "Payment Gateway Charges", text: "Gateway fees, bank charges, taxes, and third-party service costs may be deducted where applicable." },
        { title: "How to Request a Refund", text: "Refund requests must be submitted through official support with student details, payment proof, program name, reason, and contact information. Approved refunds are processed to the original payment method where possible." }
      ]}
    />
  );
}
