"use client";

/**
 * Scene component registry for NIDUS Experience V2.
 * The registry maps stable manifest scene ids to isolated scene components without defining render order.
 */
import type { ComponentType } from "react";
import {
  AcademyCultureScene,
  AcademySystemScene,
  BodyLearnsDisciplineScene,
  CreditsOfTrustScene,
  DisciplineBeginsScene,
  DreamAppearsScene,
  EnterNidusScene,
  FirstBreathScene,
  FirstStepScene,
  FormationScene,
  FutureSelfScene,
  InvitationScene,
  ManyPathsOneMissionScene,
  MentorScene,
  MomentOfPrideScene,
  ParentsQuestionScene,
  PathExplainedScene,
  ProgressWallScene,
  ProofWithoutNoiseScene,
  QuestionOfIdentityScene,
  StudentBeforeDreamScene,
  ThresholdScene,
  WhyThisDreamMattersScene,
  WrittenBattleScene
} from "../scenes";

export type ExperienceSceneComponent = ComponentType;

export const experienceSceneRegistry: Record<string, ExperienceSceneComponent> = {
  "scene-01-first-breath": FirstBreathScene,
  "scene-02-student-before-dream": StudentBeforeDreamScene,
  "scene-03-dream-appears": DreamAppearsScene,
  "scene-04-why-this-dream-matters": WhyThisDreamMattersScene,
  "scene-05-question-of-identity": QuestionOfIdentityScene,
  "scene-06-discipline-begins": DisciplineBeginsScene,
  "scene-07-enter-nidus": EnterNidusScene,
  "scene-08-the-academy-system": AcademySystemScene,
  "scene-09-the-written-battle": WrittenBattleScene,
  "scene-10-the-body-learns-discipline": BodyLearnsDisciplineScene,
  "scene-11-the-mentor": MentorScene,
  "scene-12-the-formation": FormationScene,
  "scene-13-the-progress-wall": ProgressWallScene,
  "scene-14-proof-without-noise": ProofWithoutNoiseScene,
  "scene-15-the-parents-question": ParentsQuestionScene,
  "scene-16-the-path-is-explained": PathExplainedScene,
  "scene-17-the-future-self": FutureSelfScene,
  "scene-18-many-paths-one-mission": ManyPathsOneMissionScene,
  "scene-19-academy-culture": AcademyCultureScene,
  "scene-20-the-moment-of-pride": MomentOfPrideScene,
  "scene-21-the-threshold": ThresholdScene,
  "scene-22-the-invitation": InvitationScene,
  "scene-23-the-first-step": FirstStepScene,
  "scene-24-credits-of-trust": CreditsOfTrustScene
};

/**
 * Resolves a scene component by manifest id.
 */
export function getExperienceSceneComponent(sceneId: string): ExperienceSceneComponent | undefined {
  return experienceSceneRegistry[sceneId];
}
