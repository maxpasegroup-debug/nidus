export const defenceTraitLibrarySeed = [
  {
    slug: "leadership",
    name: "Leadership",
    definition: "Ability to guide self and others toward a mission with clarity, responsibility and courage.",
    defenceRelevance: "Defence candidates must lead under uncertainty, pressure and limited resources.",
    ssbRelevance: "Directly maps to initiative, influence, organising ability, responsibility and command presence.",
    topRankRelevance: "Supports disciplined exam preparation, peer influence and consistent execution.",
    riskRelevance: "Weak leadership can indicate avoidance, low initiative or poor responsibility under pressure.",
    assessmentRelevance: ["Officer Potential Index", "OLQ Master Assessment", "Leadership DNA Assessment"],
    dimensions: ["Initiative", "Responsibility", "Influence", "Accountability", "Command Presence"]
  },
  {
    slug: "confidence",
    name: "Confidence",
    definition: "Stable self-belief expressed through action, communication and decision making.",
    defenceRelevance: "Confidence helps candidates act decisively without arrogance.",
    ssbRelevance: "Maps to self confidence, power of expression, courage and liveliness.",
    topRankRelevance: "Improves mock-test recovery, interview performance and exam composure.",
    riskRelevance: "Low confidence increases hesitation; inflated confidence can create overclaim risk.",
    assessmentRelevance: ["Officer Potential Index", "Psychological Suitability Assessment", "Competitive Mindset Index"],
    dimensions: ["Self Belief", "Expression Confidence", "Decision Confidence", "Pressure Composure"]
  },
  {
    slug: "discipline",
    name: "Discipline",
    definition: "Ability to follow routine, standards and commitments without external pressure.",
    defenceRelevance: "Discipline is foundational to military training and academy life.",
    ssbRelevance: "Supports determination, stamina, responsibility and organised behaviour.",
    topRankRelevance: "Predicts study routine, revision discipline and attendance consistency.",
    riskRelevance: "Weak discipline creates high dropout, low attendance and poor completion risk.",
    assessmentRelevance: ["Soldier Readiness Index", "Lifestyle Discipline Index", "Exam Warrior Index"],
    dimensions: ["Routine Discipline", "Time Discipline", "Habit Discipline", "Rule Adherence"]
  },
  {
    slug: "focus",
    name: "Focus",
    definition: "Capacity to sustain attention and resist distractions during preparation and performance.",
    defenceRelevance: "Focus is required in training, exams, field tasks and SSB tasks.",
    ssbRelevance: "Supports effective intelligence, reasoning and task completion.",
    topRankRelevance: "Critical for mock analysis, revision, accuracy and long preparation cycles.",
    riskRelevance: "Poor focus creates exam risk, learning gaps and inconsistent execution.",
    assessmentRelevance: ["Focus & Concentration Index", "Exam Warrior Index", "Exam Muscle Memory Assessment"],
    dimensions: ["Attention Control", "Distraction Resistance", "Deep Work", "Task Completion"]
  },
  {
    slug: "resilience",
    name: "Resilience",
    definition: "Ability to recover from setbacks, pressure and failure without losing direction.",
    defenceRelevance: "Defence life requires sustained effort after physical, academic and emotional stress.",
    ssbRelevance: "Supports determination, courage, stamina and emotional stability.",
    topRankRelevance: "Improves recovery from low scores and repeated mock-test failures.",
    riskRelevance: "Low resilience increases abandonment risk and emotional drop-off.",
    assessmentRelevance: ["Defence Career Fit Index", "Soldier Readiness Index", "Performance Growth Assessment"],
    dimensions: ["Setback Recovery", "Stress Recovery", "Persistence", "Failure Response"]
  },
  {
    slug: "communication",
    name: "Communication",
    definition: "Ability to express ideas clearly, listen actively and influence constructively.",
    defenceRelevance: "Clear communication is essential for command, coordination and safety.",
    ssbRelevance: "Maps to power of expression, social adaptability and ability to influence.",
    topRankRelevance: "Supports interview readiness, doubt clearing and group learning.",
    riskRelevance: "Poor communication can reduce SSB performance despite academic strength.",
    assessmentRelevance: ["Command Communication Index", "Group Dynamics Assessment", "Leadership DNA Assessment"],
    dimensions: ["Power of Expression", "Listening", "Clarity", "Persuasion"]
  },
  {
    slug: "teamwork",
    name: "Teamwork",
    definition: "Ability to cooperate, adapt socially and contribute to group success.",
    defenceRelevance: "Military environments depend on unit cohesion and team trust.",
    ssbRelevance: "Maps to cooperation, social adaptability and group task behaviour.",
    topRankRelevance: "Supports peer learning and academy culture.",
    riskRelevance: "Weak teamwork can signal social friction or low adaptability.",
    assessmentRelevance: ["Group Dynamics Assessment", "OLQ Master Assessment", "Defence Career Fit Index"],
    dimensions: ["Cooperation", "Social Adaptability", "Group Contribution", "Conflict Handling"]
  },
  {
    slug: "decision-making",
    name: "Decision Making",
    definition: "Ability to choose timely, practical action with available information.",
    defenceRelevance: "Defence candidates must make choices under pressure and ambiguity.",
    ssbRelevance: "Maps to speed of decision, reasoning ability and effective intelligence.",
    topRankRelevance: "Improves exam time allocation, question selection and strategy.",
    riskRelevance: "Weak decision making causes hesitation, overthinking and poor time use.",
    assessmentRelevance: ["Officer Potential Index", "Psychological Suitability Assessment", "Rank Prediction Index"],
    dimensions: ["Speed of Decision", "Practical Judgment", "Risk Judgment", "Time Judgment"]
  },
  {
    slug: "physical-toughness",
    name: "Physical Toughness",
    definition: "Mindset and consistency required for defence physical readiness.",
    defenceRelevance: "Physical readiness is essential for selection, training and service.",
    ssbRelevance: "Supports stamina, courage, determination and field performance.",
    topRankRelevance: "Supports integrated exam and physical preparation for defence careers.",
    riskRelevance: "Low physical toughness creates medical, selection and consistency risk.",
    assessmentRelevance: ["Physical Readiness Index", "Warrior Fitness Mindset", "Soldier Readiness Index"],
    dimensions: ["Stamina Mindset", "Training Consistency", "Pain Tolerance", "Recovery Discipline"]
  },
  {
    slug: "service-orientation",
    name: "Service Orientation",
    definition: "Motivation to serve with duty, responsibility and national purpose.",
    defenceRelevance: "Service motivation separates career curiosity from genuine defence commitment.",
    ssbRelevance: "Supports responsibility, courage, cooperation and maturity of purpose.",
    topRankRelevance: "Sustains long preparation cycles and disciplined goal pursuit.",
    riskRelevance: "Weak service orientation may indicate unstable career motivation.",
    assessmentRelevance: ["Defence Career Fit Index", "Soldier Readiness Index", "Officer Potential Index"],
    dimensions: ["Duty Orientation", "Patriotic Purpose", "Service Motivation", "Maturity of Goal"]
  }
];

export const traitBandSeed = [
  { band: "RED", minScore: 0, maxScore: 44, interpretation: "Trait expression is currently weak and requires structured intervention.", recommendation: "Start mentor-guided correction before high-pressure evaluation." },
  { band: "ORANGE", minScore: 45, maxScore: 59, interpretation: "Trait is visible but unreliable under pressure.", recommendation: "Use short corrective drills and weekly review." },
  { band: "YELLOW", minScore: 60, maxScore: 74, interpretation: "Trait is developing and can support preparation with consistency.", recommendation: "Continue guided practice and monitor weak dimensions." },
  { band: "GREEN", minScore: 75, maxScore: 89, interpretation: "Trait is dependable for academy-level progression.", recommendation: "Maintain performance and add pressure-based practice." },
  { band: "ELITE", minScore: 90, maxScore: 100, interpretation: "Trait is a strong readiness signal.", recommendation: "Use advanced challenges and leadership opportunities." }
];

export const riskInterpretationSeed = [
  { riskLevel: "LOW", label: "Low Risk", interpretation: "No immediate intervention required.", actionGuidance: "Continue normal monitoring." },
  { riskLevel: "MODERATE", label: "Moderate Risk", interpretation: "Early warning signs are present.", actionGuidance: "Assign corrective action and monitor weekly." },
  { riskLevel: "HIGH", label: "High Risk", interpretation: "Risk can affect selection readiness or preparation continuity.", actionGuidance: "Academic Head or mentor intervention required." },
  { riskLevel: "CRITICAL", label: "Critical Risk", interpretation: "Immediate intervention is required.", actionGuidance: "Escalate to Academic Head and create recovery plan." }
];

export const readinessInterpretationSeed = [
  { band: "RED", minScore: 0, maxScore: 44, label: "Intervention Required", interpretation: "Candidate is not ready for high-pressure defence evaluation.", actionGuidance: "Begin structured correction before retesting." },
  { band: "ORANGE", minScore: 45, maxScore: 59, label: "Correction Required", interpretation: "Readiness is unstable and needs guided improvement.", actionGuidance: "Plan mentor-led correction and short-cycle review." },
  { band: "YELLOW", minScore: 60, maxScore: 74, label: "Developing Readiness", interpretation: "Candidate can progress with consistent training.", actionGuidance: "Continue preparation and strengthen weak dimensions." },
  { band: "GREEN", minScore: 75, maxScore: 89, label: "Ready", interpretation: "Candidate shows usable defence readiness.", actionGuidance: "Move to advanced practice and pressure simulations." },
  { band: "ELITE", minScore: 90, maxScore: 100, label: "Elite Readiness", interpretation: "Candidate shows strong readiness signals.", actionGuidance: "Use advanced mentoring and leadership tasks." }
];
