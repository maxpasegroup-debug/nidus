import { average, resultFrom, type SsbScoreInput } from "./ssb-engine.types.js";

const leadershipOlqs = [
  "Initiative",
  "Sense of Responsibility",
  "Speed of Decision",
  "Organizing Ability",
  "Ability to Influence Group",
  "Self Confidence"
];

export const ssbLeadershipService = {
  calculate(inputs: SsbScoreInput[]) {
    const score = average(inputs, leadershipOlqs);
    return {
      ...resultFrom(score, inputs.filter((input) => leadershipOlqs.includes(input.name)), "LEADERSHIP_READINESS_RISK"),
      measuredAreas: ["Initiative", "Responsibility", "Decision Making", "Accountability", "Command Presence", "Influence"]
    };
  }
};
