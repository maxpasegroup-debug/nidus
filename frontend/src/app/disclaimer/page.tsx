import { LegalPage } from "@/components/legal/legal-page";

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      intro="NIDUS Academy provides defence preparation, learning support, assessments, mentoring, AI-assisted guidance, and transformation programs. The platform supports decisions; it does not guarantee outcomes."
      sections={[
        { title: "No Selection Guarantee", text: "NIDUS training, assessments, reports, mentoring, AI guidance, and TOPRANK missions do not guarantee selection, admission, interview success, rank, score, or employment." },
        { title: "Assessment Interpretation", text: "Psychometric and AI-assisted reports are educational and guidance tools. They are not clinical diagnosis, medical advice, psychological treatment, or official SSB evaluation." },
        { title: "AI Output Limits", text: "AI-generated summaries, recommendations, reports, and interpretations may require human review. Students and parents should use mentor guidance and independent judgment." },
        { title: "Health and Physical Training", text: "Physical training participation should consider personal health, fitness, medical advice, and safety instructions. NIDUS is not responsible for undisclosed medical conditions." },
        { title: "External Integrations", text: "Where NIDUS integrates approved third-party infrastructure for exams, payments, communication, or AI training, those services may have their own terms, availability, and policies." }
      ]}
    />
  );
}
