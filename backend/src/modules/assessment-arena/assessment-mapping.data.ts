type TraitMappingSeed = {
  traitSlug: string;
  weight: number;
  isCritical?: boolean;
  isReadinessTrait?: boolean;
  isRiskTrait?: boolean;
  rationale: string;
};

export type AssessmentMappingSeed = {
  assessmentName: string;
  traits: TraitMappingSeed[];
};

const readiness = true;

export const assessmentMappingSeeds: AssessmentMappingSeed[] = [
  {
    assessmentName: "Defence Career Fit Index",
    traits: [
      { traitSlug: "service-orientation", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Service motivation is the core fit signal for defence careers." },
      { traitSlug: "resilience", weight: 18, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Career fit requires long-cycle preparation resilience." },
      { traitSlug: "discipline", weight: 18, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Discipline predicts academy continuity." },
      { traitSlug: "teamwork", weight: 15, isReadinessTrait: readiness, rationale: "Defence fit depends on unit and group orientation." },
      { traitSlug: "physical-toughness", weight: 15, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Physical mindset separates interest from readiness." },
      { traitSlug: "leadership", weight: 10, isReadinessTrait: readiness, rationale: "Leadership supports officer-track potential." }
    ]
  },
  {
    assessmentName: "Officer Potential Index",
    traits: [
      { traitSlug: "leadership", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Officer potential requires leadership under pressure." },
      { traitSlug: "decision-making", weight: 20, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Timely judgment is central to officer readiness." },
      { traitSlug: "confidence", weight: 16, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Stable confidence drives command behaviour." },
      { traitSlug: "communication", weight: 14, isReadinessTrait: readiness, rationale: "Power of expression supports SSB and leadership." },
      { traitSlug: "service-orientation", weight: 14, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Purpose and responsibility must be stable." },
      { traitSlug: "resilience", weight: 12, isReadinessTrait: readiness, rationale: "Officers must recover and persist." }
    ]
  },
  {
    assessmentName: "Soldier Readiness Index",
    traits: [
      { traitSlug: "discipline", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Soldier readiness starts with dependable discipline." },
      { traitSlug: "physical-toughness", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Physical effort tolerance is essential." },
      { traitSlug: "resilience", weight: 18, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Training demands persistence after setbacks." },
      { traitSlug: "service-orientation", weight: 14, isReadinessTrait: readiness, rationale: "Duty motivation sustains preparation." },
      { traitSlug: "teamwork", weight: 12, isReadinessTrait: readiness, rationale: "Unit behaviour matters in defence settings." },
      { traitSlug: "focus", weight: 10, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Task completion and attention affect reliability." }
    ]
  },
  {
    assessmentName: "Exam Warrior Index",
    traits: [
      { traitSlug: "focus", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Exam success requires sustained attention." },
      { traitSlug: "discipline", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Routine execution predicts exam preparation quality." },
      { traitSlug: "resilience", weight: 18, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Low-score recovery is essential." },
      { traitSlug: "decision-making", weight: 14, isReadinessTrait: readiness, rationale: "Exam time strategy depends on quick judgment." },
      { traitSlug: "confidence", weight: 12, isReadinessTrait: readiness, rationale: "Composure affects performance." },
      { traitSlug: "service-orientation", weight: 10, isReadinessTrait: readiness, rationale: "Purpose sustains effort." }
    ]
  },
  {
    assessmentName: "Focus & Concentration Index",
    traits: [
      { traitSlug: "focus", weight: 35, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Primary measurement construct." },
      { traitSlug: "discipline", weight: 20, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Routine protects focus." },
      { traitSlug: "resilience", weight: 15, isReadinessTrait: readiness, rationale: "Recovery from distraction matters." },
      { traitSlug: "decision-making", weight: 12, isReadinessTrait: readiness, rationale: "Focus improves choice quality." },
      { traitSlug: "confidence", weight: 10, isReadinessTrait: readiness, rationale: "Confidence reduces overthinking." },
      { traitSlug: "physical-toughness", weight: 8, isReadinessTrait: readiness, rationale: "Energy and stamina affect concentration." }
    ]
  },
  {
    assessmentName: "Competitive Mindset Index",
    traits: [
      { traitSlug: "confidence", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Competition requires stable confidence." },
      { traitSlug: "resilience", weight: 20, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Competitive students must rebound quickly." },
      { traitSlug: "focus", weight: 18, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Competitive advantage depends on attention control." },
      { traitSlug: "discipline", weight: 16, isReadinessTrait: readiness, rationale: "Daily execution converts intent into performance." },
      { traitSlug: "decision-making", weight: 14, isReadinessTrait: readiness, rationale: "Strategy choices shape outcomes." },
      { traitSlug: "leadership", weight: 10, isReadinessTrait: readiness, rationale: "Self-leadership supports competition." }
    ]
  },
  {
    assessmentName: "OLQ Master Assessment",
    traits: [
      { traitSlug: "leadership", weight: 18, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Maps to multiple officer-like qualities." },
      { traitSlug: "decision-making", weight: 16, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Maps to speed of decision and reasoning." },
      { traitSlug: "communication", weight: 14, isReadinessTrait: readiness, rationale: "Maps to power of expression." },
      { traitSlug: "teamwork", weight: 14, isReadinessTrait: readiness, rationale: "Maps to cooperation and social adaptability." },
      { traitSlug: "confidence", weight: 14, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Maps to self confidence and liveliness." },
      { traitSlug: "resilience", weight: 12, isReadinessTrait: readiness, rationale: "Maps to determination, courage and stamina." },
      { traitSlug: "service-orientation", weight: 12, isReadinessTrait: readiness, rationale: "Maps to responsibility and duty." }
    ]
  },
  {
    assessmentName: "Psychological Suitability Assessment",
    traits: [
      { traitSlug: "confidence", weight: 20, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Suitability requires stable self-belief without overclaiming." },
      { traitSlug: "resilience", weight: 20, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Stress recovery is a core psychological signal." },
      { traitSlug: "decision-making", weight: 16, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Judgment and maturity are suitability signals." },
      { traitSlug: "service-orientation", weight: 14, isReadinessTrait: readiness, rationale: "Purpose maturity reduces instability." },
      { traitSlug: "communication", weight: 12, isReadinessTrait: readiness, rationale: "Self-awareness is expressed through communication." },
      { traitSlug: "discipline", weight: 10, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Behaviour reliability needs discipline." },
      { traitSlug: "teamwork", weight: 8, isReadinessTrait: readiness, rationale: "Social awareness affects suitability." }
    ]
  },
  {
    assessmentName: "Group Dynamics Assessment",
    traits: [
      { traitSlug: "teamwork", weight: 28, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Primary group behaviour construct." },
      { traitSlug: "communication", weight: 20, isCritical: true, isReadinessTrait: readiness, rationale: "Group contribution requires expression and listening." },
      { traitSlug: "leadership", weight: 18, isReadinessTrait: readiness, rationale: "Influence matters in GTO-like settings." },
      { traitSlug: "confidence", weight: 12, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Social confidence affects participation." },
      { traitSlug: "decision-making", weight: 12, isReadinessTrait: readiness, rationale: "Group tasks require practical judgment." },
      { traitSlug: "service-orientation", weight: 10, isReadinessTrait: readiness, rationale: "Group-first duty mindset reduces selfish behaviour." }
    ]
  },
  {
    assessmentName: "Leadership DNA Assessment",
    traits: [
      { traitSlug: "leadership", weight: 30, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Primary leadership construct." },
      { traitSlug: "decision-making", weight: 18, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Leaders must choose and act." },
      { traitSlug: "communication", weight: 16, isReadinessTrait: readiness, rationale: "Leadership requires clarity and influence." },
      { traitSlug: "confidence", weight: 14, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Command presence requires confidence." },
      { traitSlug: "teamwork", weight: 12, isReadinessTrait: readiness, rationale: "Leadership must preserve team trust." },
      { traitSlug: "service-orientation", weight: 10, isReadinessTrait: readiness, rationale: "Leadership must be duty-led." }
    ]
  },
  {
    assessmentName: "Physical Readiness Index",
    traits: [
      { traitSlug: "physical-toughness", weight: 34, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Primary physical readiness construct." },
      { traitSlug: "discipline", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Fitness requires routine adherence." },
      { traitSlug: "resilience", weight: 18, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Physical training requires recovery from discomfort." },
      { traitSlug: "focus", weight: 10, isReadinessTrait: readiness, rationale: "Training quality needs attention." },
      { traitSlug: "confidence", weight: 8, isReadinessTrait: readiness, rationale: "Confidence supports physical challenge attempts." },
      { traitSlug: "service-orientation", weight: 8, isReadinessTrait: readiness, rationale: "Purpose sustains physical preparation." }
    ]
  },
  {
    assessmentName: "Lifestyle Discipline Index",
    traits: [
      { traitSlug: "discipline", weight: 34, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Primary lifestyle construct." },
      { traitSlug: "focus", weight: 18, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Lifestyle discipline requires distraction resistance." },
      { traitSlug: "physical-toughness", weight: 16, isReadinessTrait: readiness, rationale: "Fitness routine is part of lifestyle." },
      { traitSlug: "resilience", weight: 14, isReadinessTrait: readiness, rationale: "Recovery from routine breaks matters." },
      { traitSlug: "service-orientation", weight: 10, isReadinessTrait: readiness, rationale: "Purpose makes habits meaningful." },
      { traitSlug: "decision-making", weight: 8, isReadinessTrait: readiness, rationale: "Daily choices shape lifestyle." }
    ]
  },
  {
    assessmentName: "Exam Muscle Memory Assessment",
    traits: [
      { traitSlug: "focus", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Exam reflexes depend on focus." },
      { traitSlug: "discipline", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Repeated practice creates muscle memory." },
      { traitSlug: "decision-making", weight: 18, isReadinessTrait: readiness, rationale: "Question selection and timing are decision patterns." },
      { traitSlug: "confidence", weight: 14, isReadinessTrait: readiness, rationale: "Confidence prevents panic switching." },
      { traitSlug: "resilience", weight: 12, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Mistake recovery affects exam rhythm." },
      { traitSlug: "physical-toughness", weight: 10, isReadinessTrait: readiness, rationale: "Energy stamina supports long exam attempts." }
    ]
  },
  {
    assessmentName: "Performance Growth Assessment",
    traits: [
      { traitSlug: "resilience", weight: 24, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Growth requires recovery and persistence." },
      { traitSlug: "discipline", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Growth is built through routine." },
      { traitSlug: "focus", weight: 18, isReadinessTrait: readiness, rationale: "Focused correction drives improvement." },
      { traitSlug: "decision-making", weight: 14, isReadinessTrait: readiness, rationale: "Students must choose better preparation actions." },
      { traitSlug: "confidence", weight: 12, isReadinessTrait: readiness, rationale: "Confidence supports sustained improvement." },
      { traitSlug: "service-orientation", weight: 10, isReadinessTrait: readiness, rationale: "Purpose gives growth direction." }
    ]
  },
  {
    assessmentName: "Rank Prediction Index",
    traits: [
      { traitSlug: "decision-making", weight: 22, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Prediction readiness depends on exam strategy choices." },
      { traitSlug: "focus", weight: 20, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Rank readiness requires sustained accuracy." },
      { traitSlug: "discipline", weight: 18, isCritical: true, isReadinessTrait: readiness, isRiskTrait: true, rationale: "Consistent preparation is a core predictor input." },
      { traitSlug: "resilience", weight: 14, isReadinessTrait: readiness, rationale: "Recovery from performance dips matters." },
      { traitSlug: "confidence", weight: 12, isReadinessTrait: readiness, rationale: "Exam composure affects output." },
      { traitSlug: "physical-toughness", weight: 8, isReadinessTrait: readiness, rationale: "Integrated defence readiness includes fitness discipline." },
      { traitSlug: "service-orientation", weight: 6, isReadinessTrait: readiness, rationale: "Stable motivation reduces dropout risk." }
    ]
  }
];
