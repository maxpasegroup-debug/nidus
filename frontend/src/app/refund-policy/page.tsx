import { LegalPage } from "@/components/legal/legal-page";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="This Refund Policy explains how refund requests are reviewed for NIDUS Academy admissions, classroom programs, online programs, digital learning access, assessments, subscriptions, and academy services."
      sections={[
        { title: "Business Identity", text: "NIDUS Academy is operated by Unique Solution, Ground Floor, Dalam Arcade, Near Paimelikavu Ksethram, Kollam Kadavu Road, Chinnakada, Kollam - 691001, Kerala. GSTIN: 32AAZFN9320K1ZP. Refund contact: info@uniquesolutionkochi.com, 9020905655." },
        { title: "General Refund Principle", text: "Refund eligibility depends on the program type, admission terms, payment date, batch start date, attendance, LMS access, digital content usage, assessment/report generation, materials issued, mentor allocation, and administrative work already completed." },
        { title: "Admissions and Classroom Programs", text: "For classroom, offline, hybrid, physical training, foundation, crash course, and integrated academy programs, refund requests are reviewed case by case against batch commencement, classes attended, materials issued, faculty allocation, and written admission terms." },
        { title: "Online, Digital, and Assessment Services", text: "Payments for activated LMS access, recorded classes, digital materials, online classes, attempted exams, completed assessments, generated reports, AI-supported reports, subscriptions, and consumed services may be non-refundable once access or delivery has started." },
        { title: "Non-Refundable Deductions", text: "Registration or admission processing charges, payment gateway fees, bank charges, GST/taxes, issued materials, third-party service costs, and administrative costs may be deducted where applicable and legally permitted." },
        { title: "How to Request a Refund", text: "Send a written refund request to info@uniquesolutionkochi.com with student name, registered mobile number, program name, batch, payment proof, receipt number if available, reason for refund, and bank/payment details. Requests raised through unofficial channels may not be treated as valid." },
        { title: "Review and Processing Timeline", text: "Eligible requests are reviewed by the academy office. Approved refunds are normally processed within 7 to 15 working days after approval and required verification. Refunds are preferably issued to the original payment method or verified bank account." },
        { title: "Academy Cancellation", text: "If NIDUS cancels a paid program before meaningful access or batch delivery begins, the academy may offer a refund, transfer, credit, or alternate batch as appropriate." },
        { title: "No Outcome Guarantee", text: "Fees are charged for training, platform access, mentoring, exams, assessments, and services. Refunds are not granted merely because a student does not obtain a desired rank, selection, score, admission, job, or personal outcome." }
      ]}
    />
  );
}
