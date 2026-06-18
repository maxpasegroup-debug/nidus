import { average, resultFrom, type SsbScoreInput } from "./ssb-engine.types.js";

const psychologyOlqs = [
  "Self Confidence",
  "Sense of Responsibility",
  "Speed of Decision",
  "Effective Intelligence",
  "Social Adaptability",
  "Determination",
  "Courage"
];

export const ssbPsychologyService = {
  calculate(inputs: SsbScoreInput[]) {
    const score = average(inputs, psychologyOlqs);
    return {
      ...resultFrom(score, inputs.filter((input) => psychologyOlqs.includes(input.name)), "PSYCHOLOGICAL_SUITABILITY_RISK"),
      measuredAreas: ["Emotional Stability", "Maturity", "Responsibility", "Stress Handling", "Social Awareness", "Judgement", "Self Awareness", "Behaviour Reliability"]
    };
  }
};
