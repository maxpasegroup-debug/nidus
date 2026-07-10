import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This Privacy Policy explains how Unique Solution, operating NIDUS Academy, collects, uses, stores, and protects information for admissions, LMS access, assessments, payments, communication, and academy operations."
      sections={[
        { title: "Data Controller and Contact", text: "NIDUS Academy is operated by Unique Solution, Ground Floor, Dalam Arcade, Near Paimelikavu Ksethram, Kollam Kadavu Road, Chinnakada, Kollam - 691001, Kerala. GSTIN: 32AAZFN9320K1ZP. Privacy contact: info@uniquesolutionkochi.com, 9020905655." },
        { title: "Information We Collect", text: "We may collect name, phone number, email, password credentials, class, school, parent details, address, program interest, application details, documents, batch allocation, attendance, leave requests, assignments, exam attempts, answers, marks, reports, uploaded files, payment records, counselling notes, support messages, device/session data, and usage logs." },
        { title: "How We Use Information", text: "We use information to create accounts, process enquiries and admissions, verify documents, record fees, issue receipts, allocate batches, provide classes, exams, assignments, library access, assessment reports, progress tracking, parent visibility, staff operations, support, security, and compliance." },
        { title: "Assessments, AI, and Reports", text: "Assessment responses and LMS performance data may be used to generate readiness scores, progress reports, recommendations, and AI-supported explanations. These insights support education and mentoring; they are not medical, psychological, legal, or guaranteed career decisions." },
        { title: "Payments and Financial Records", text: "Payment details, receipt records, fee dues, GST information, and transaction references are used for billing, accounting, refunds, dispute handling, and statutory compliance. Card, UPI, or banking processing may be handled by authorised payment providers." },
        { title: "Sharing and Service Providers", text: "We may share necessary information with authorised staff, academic heads, teachers, parents, payment gateways, hosting providers, cloud storage providers, messaging providers, live class providers, analytics/security services, professional advisers, and authorities where required by law. We do not sell student personal information." },
        { title: "Children and Parent Access", text: "For minor learners, parent or guardian consent may be required. Parents may receive visibility into attendance, assignments, exams, fees, progress, and academy communication where enabled by NIDUS policy." },
        { title: "Security and Retention", text: "We use role-based access, session security, operational controls, and reasonable technical safeguards. Records may be retained for academic, financial, legal, security, audit, and dispute-resolution purposes even after account closure where required." },
        { title: "Your Choices and Requests", text: "Users may request access, correction, update, or deletion where legally and operationally possible. Some requests may be limited where records are required for admission, payment, academic, compliance, safety, or dispute purposes." }
      ]}
    />
  );
}
