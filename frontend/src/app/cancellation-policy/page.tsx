import { LegalPage } from "@/components/legal/legal-page";

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      intro="This policy explains how students, parents, and subscribers may request cancellation of services, subscriptions, counselling bookings, or program enrolment."
      sections={[
        { title: "Admission or Program Cancellation", text: "Cancellation requests must be made in writing through official NIDUS support. The final treatment of paid fees follows the applicable refund policy and admission terms." },
        { title: "Subscription Cancellation", text: "Users may request cancellation or non-renewal of eligible subscriptions. Access may continue until the end of the paid period unless otherwise stated." },
        { title: "Counselling and Mentor Sessions", text: "Counselling or mentor session changes should be requested in advance. Missed sessions, late cancellations, or repeated rescheduling may be handled according to academy policy." },
        { title: "NIDUS-Initiated Cancellation", text: "NIDUS may suspend or cancel access for policy violations, misuse, non-payment, abusive conduct, security risk, or operational necessity." },
        { title: "Support Process", text: "Cancellation support requires student name, registered phone/email, program name, payment details if applicable, and reason for cancellation." }
      ]}
    />
  );
}
