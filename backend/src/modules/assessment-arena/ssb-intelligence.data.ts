export const ssbOlqSeed = [
  ["effective-intelligence", "Effective Intelligence", "Practical intelligence used to solve real problems with available resources.", "Essential for field judgment and practical command decisions.", "Measured through OLQ Master, Psychological Suitability and Leadership DNA contexts.", "Low signal can indicate poor practical judgment under SSB pressure."],
  ["reasoning-ability", "Reasoning Ability", "Ability to understand, connect and evaluate information logically.", "Supports operational analysis and tactical thinking.", "Measured through OLQ Master, Psychological Suitability and Group Dynamics contexts.", "Weak reasoning can reduce performance in planning tasks and interviews."],
  ["organizing-ability", "Organizing Ability", "Ability to arrange people, time and resources toward an objective.", "Critical for mission planning and team execution.", "Measured through OLQ Master, Leadership DNA and Group Dynamics contexts.", "Weak organising ability can create command and execution risk."],
  ["power-of-expression", "Power of Expression", "Ability to communicate thoughts clearly and confidently.", "Important for command, coordination and briefing.", "Measured through OLQ Master, Group Dynamics and Leadership DNA contexts.", "Weak expression can hide potential and reduce group influence."],
  ["social-adaptability", "Social Adaptability", "Ability to adjust behaviour across people and situations.", "Defence life requires fast adaptation to teams and hierarchy.", "Measured through OLQ Master, Group Dynamics and Psychological Suitability contexts.", "Weak adaptability can create team friction."],
  ["cooperation", "Cooperation", "Ability to work with others toward a shared goal.", "Military effectiveness depends on unit cooperation.", "Measured through OLQ Master and Group Dynamics contexts.", "Weak cooperation can indicate group-task risk."],
  ["sense-of-responsibility", "Sense of Responsibility", "Commitment to duty, accountability and reliable conduct.", "Core to defence service, trust and leadership.", "Measured through OLQ Master, Soldier Readiness and Leadership DNA contexts.", "Weak responsibility can create discipline and reliability risk."],
  ["initiative", "Initiative", "Ability to take useful action without waiting for instruction.", "Officers and soldiers must act when situations change.", "Measured through OLQ Master, Leadership DNA and Psychological Suitability contexts.", "Low initiative can indicate passivity under pressure."],
  ["self-confidence", "Self Confidence", "Stable belief in one's ability without arrogance.", "Supports command presence and pressure performance.", "Measured through OLQ Master, Psychological Suitability and Leadership DNA contexts.", "Low confidence creates hesitation; inflated confidence creates overclaim risk."],
  ["speed-of-decision", "Speed of Decision", "Ability to decide quickly and sensibly under time limits.", "Vital in operational and SSB pressure tasks.", "Measured through OLQ Master, Psychological Suitability and Leadership DNA contexts.", "Weak speed creates hesitation and task failure risk."],
  ["ability-to-influence-group", "Ability to Influence Group", "Ability to guide group direction constructively.", "Important for command, teamwork and group tasks.", "Measured through OLQ Master, Group Dynamics and Leadership DNA contexts.", "Weak influence can reduce leadership visibility."],
  ["liveliness", "Liveliness", "Positive energy, alertness and constructive enthusiasm.", "Supports morale, group participation and resilience.", "Measured through OLQ Master and Group Dynamics contexts.", "Low liveliness can signal low engagement or social withdrawal."],
  ["determination", "Determination", "Sustained commitment despite difficulty.", "Defence preparation and service require persistence.", "Measured through OLQ Master, Soldier Readiness and Performance Growth contexts.", "Weak determination creates dropout and consistency risk."],
  ["courage", "Courage", "Ability to face fear, uncertainty or difficulty responsibly.", "Essential for defence service and field pressure.", "Measured through OLQ Master, Psychological Suitability and Soldier Readiness contexts.", "Weak courage can affect pressure response and command readiness."],
  ["stamina", "Stamina", "Physical and mental endurance over sustained effort.", "Required for military training and long selection processes.", "Measured through OLQ Master, Physical Readiness and Soldier Readiness contexts.", "Weak stamina can create fitness, consistency and pressure risks."]
].map(([slug, name, definition, defenceRelevance, assessmentRelevance, riskRelevance]) => ({
  slug,
  name,
  definition,
  defenceRelevance,
  assessmentRelevance,
  riskRelevance
}));

export const ssbOlqBandSeed = [
  { band: "RED", minScore: 0, maxScore: 44, interpretation: "OLQ signal is weak and requires mentor-led correction.", mentorGuidance: "Do not push advanced SSB practice until this OLQ stabilizes." },
  { band: "ORANGE", minScore: 45, maxScore: 59, interpretation: "OLQ is visible but unreliable under pressure.", mentorGuidance: "Assign focused behavioural drills and review weekly." },
  { band: "YELLOW", minScore: 60, maxScore: 74, interpretation: "OLQ is developing and can improve with structured practice.", mentorGuidance: "Use guided SSB tasks and monitor consistency." },
  { band: "GREEN", minScore: 75, maxScore: 89, interpretation: "OLQ is dependable for current preparation level.", mentorGuidance: "Move into pressure simulations and group tasks." },
  { band: "ELITE", minScore: 90, maxScore: 100, interpretation: "OLQ is a strong SSB readiness signal.", mentorGuidance: "Use advanced leadership and officer-like task exposure." }
];

export const ssbMappingSeed: Array<[string, string[]]> = [
  ["Leadership", ["Initiative", "Sense of Responsibility", "Ability to Influence Group", "Organizing Ability"]],
  ["Confidence", ["Self Confidence", "Power of Expression", "Courage", "Liveliness"]],
  ["Discipline", ["Sense of Responsibility", "Determination", "Stamina"]],
  ["Focus", ["Effective Intelligence", "Reasoning Ability", "Determination"]],
  ["Resilience", ["Determination", "Courage", "Stamina"]],
  ["Communication", ["Power of Expression", "Social Adaptability", "Ability to Influence Group"]],
  ["Teamwork", ["Cooperation", "Social Adaptability", "Liveliness"]],
  ["Decision Making", ["Speed of Decision", "Reasoning Ability", "Effective Intelligence"]],
  ["Physical Toughness", ["Stamina", "Determination", "Courage"]],
  ["Service Orientation", ["Sense of Responsibility", "Courage", "Cooperation"]]
];
