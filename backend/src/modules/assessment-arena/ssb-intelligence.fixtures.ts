import { ssbIntelligenceService } from "./ssb-intelligence.service.js";

export const ssbIntelligenceFixture = {
  olqScores: [
    { name: "Effective Intelligence", score: 76 },
    { name: "Reasoning Ability", score: 72 },
    { name: "Organizing Ability", score: 68 },
    { name: "Power of Expression", score: 74 },
    { name: "Social Adaptability", score: 80 },
    { name: "Cooperation", score: 82 },
    { name: "Sense of Responsibility", score: 78 },
    { name: "Initiative", score: 64 },
    { name: "Self Confidence", score: 70 },
    { name: "Speed of Decision", score: 58 },
    { name: "Ability to Influence Group", score: 66 },
    { name: "Liveliness", score: 75 },
    { name: "Determination", score: 84 },
    { name: "Courage", score: 62 },
    { name: "Stamina", score: 79 }
  ]
};

export function simulateSsbFixture() {
  return ssbIntelligenceService.calculate(ssbIntelligenceFixture);
}
