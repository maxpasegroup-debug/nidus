import { average, resultFrom, type SsbScoreInput } from "./ssb-engine.types.js";

const groupOlqs = [
  "Cooperation",
  "Social Adaptability",
  "Ability to Influence Group",
  "Power of Expression",
  "Liveliness",
  "Organizing Ability"
];

export const ssbGroupDynamicsService = {
  calculate(inputs: SsbScoreInput[]) {
    const score = average(inputs, groupOlqs);
    return {
      ...resultFrom(score, inputs.filter((input) => groupOlqs.includes(input.name)), "GROUP_DYNAMICS_RISK"),
      measuredAreas: ["Cooperation", "Listening", "Influence", "Conflict Handling", "Adaptability", "Team Orientation"]
    };
  }
};
