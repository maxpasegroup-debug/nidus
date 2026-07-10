import { LegalPage } from "@/components/legal/legal-page";

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These Terms & Conditions govern enquiries, admissions, LMS access, assessments, live classes, recorded lessons, payments, mentoring, and use of the NIDUS Academy platform operated by Unique Solution."
      sections={[
        { title: "Business Identity", text: "NIDUS Academy is operated by Unique Solution, Ground Floor, Dalam Arcade, Near Paimelikavu Ksethram, Kollam Kadavu Road, Chinnakada, Kollam - 691001, Kerala. GSTIN: 32AAZFN9320K1ZP. Contact: info@uniquesolutionkochi.com, 9020905655." },
        { title: "Account and Eligibility", text: "Users must provide accurate name, email, mobile number, admission, payment, and academic details. Login credentials must be kept confidential. For minor students, a parent or guardian is responsible for consent, payment, and platform usage." },
        { title: "Admissions and Batch Access", text: "Guest accounts may explore available services. Full learner access, batch allocation, classes, assignments, exams, attendance, library materials, reports, and certificates are enabled only after application approval, fee confirmation, and academic allocation by NIDUS." },
        { title: "Learning Content and LMS Use", text: "Live classes, recorded videos, PDFs, PPTs, tests, answer keys, explanations, reports, dashboards, and internal materials are for authorised NIDUS users only. Users must not copy, resell, redistribute, publicly share, scrape, record, or misuse academy content." },
        { title: "Exams, Assessments, and Integrity", text: "Students must attend exams and assessments honestly. NIDUS may monitor attempts, timestamps, submissions, suspicious activity, and result integrity. Results, ranks, reports, and AI-supported feedback are educational guidance and do not guarantee selection, rank, admission, employment, or any defence service outcome." },
        { title: "Payments and Taxes", text: "Fees, instalments, subscriptions, discounts, scholarships, receipts, and taxes are recorded through official NIDUS systems. Payment gateway, bank, GST, and third-party terms may also apply. Access may be withheld, paused, or cancelled for unpaid dues, failed payment verification, misuse, or policy violation." },
        { title: "User Uploads and Communication", text: "Users may upload documents, assignments, images, answers, and messages where permitted. The user confirms that uploaded content is lawful, relevant, and does not violate another person's rights. NIDUS may remove unsafe, abusive, irrelevant, or unauthorised content." },
        { title: "Third-Party Services", text: "The platform may use third-party providers for hosting, storage, video, payments, messaging, analytics, live classes, and AI-supported services. These providers may process data only as needed to operate the platform and may have their own terms." },
        { title: "Suspension and Termination", text: "NIDUS may restrict or terminate access for misuse, abusive behaviour, cheating, unauthorised sharing, payment default, false information, security risk, or violation of these terms." },
        { title: "Liability and Jurisdiction", text: "To the maximum extent permitted by law, NIDUS and Unique Solution are not liable for indirect, incidental, consequential, or loss-of-opportunity damages. Any dispute is subject to the laws of India and the competent courts at Kollam, Kerala, unless mandatory law provides otherwise." }
      ]}
    />
  );
}
