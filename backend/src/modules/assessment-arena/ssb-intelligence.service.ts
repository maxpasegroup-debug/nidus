import { ssbGroupDynamicsService } from "./ssb-group-dynamics.service.js";
import { ssbLeadershipService } from "./ssb-leadership.service.js";
import { ssbOlqService } from "./ssb-olq.service.js";
import { ssbPsychologyService } from "./ssb-psychology.service.js";
import { ssbReadinessService } from "./ssb-readiness.service.js";
import { average, type SsbScoreInput } from "./ssb-engine.types.js";

export const ssbIntelligenceService = {
  seed: () => ssbOlqService.seed(),
  olqs: () => ssbOlqService.list(),
  mappings: () => ssbOlqService.mappings(),
  counts: () => ssbOlqService.counts(),

  calculate(input: { olqScores: SsbScoreInput[] }) {
    const olqScore = average(input.olqScores, input.olqScores.map((score) => score.name));
    const psychology = ssbPsychologyService.calculate(input.olqScores);
    const group = ssbGroupDynamicsService.calculate(input.olqScores);
    const leadership = ssbLeadershipService.calculate(input.olqScores);
    const readiness = ssbReadinessService.calculate({ olqScore, psychology, group, leadership });
    return {
      olqScore,
      psychology,
      group,
      leadership,
      readiness
    };
  },

  interpretableProfile(input: { olqScores: SsbScoreInput[] }) {
    const result = this.calculate(input);
    return {
      summary: `SSB readiness is ${result.readiness.ssbReadinessBand} at ${result.readiness.ssbReadinessScore}/100.`,
      strengthAreas: result.readiness.strengthAreas,
      developmentAreas: result.readiness.developmentAreas,
      mentorAttentionAreas: result.readiness.mentorAttentionAreas,
      engines: {
        psychology: result.psychology,
        groupDynamics: result.group,
        leadership: result.leadership
      }
    };
  }
};
