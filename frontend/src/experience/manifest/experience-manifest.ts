/**
 * Declarative manifest for the NIDUS Experience V2 journey.
 * It centralizes chapter and scene metadata without importing or rendering scene components.
 */
import type { ExperienceManifest } from "../types";

export const experienceManifest = {
  id: "nidus-experience-v2",
  title: "NIDUS Experience V2",
  chapters: [
    {
      id: "chapter-01-awakening",
      title: "Awakening",
      description: "The visitor moves from first breath into personal purpose.",
      sceneIds: [
        "scene-01-first-breath",
        "scene-02-student-before-dream",
        "scene-03-dream-appears",
        "scene-04-why-this-dream-matters",
        "scene-05-question-of-identity",
        "scene-06-discipline-begins",
        "scene-07-enter-nidus"
      ],
      order: 1
    },
    {
      id: "chapter-02-the-system",
      title: "The System",
      description: "The visitor sees the complete NIDUS preparation model and the discipline around it.",
      sceneIds: [
        "scene-08-the-academy-system",
        "scene-09-the-written-battle",
        "scene-10-the-body-learns-discipline",
        "scene-11-the-mentor",
        "scene-12-the-formation"
      ],
      order: 2
    },
    {
      id: "chapter-03-trust-and-path",
      title: "Trust And Path",
      description: "The visitor sees measurable growth, quiet proof, parent reassurance, and the admission journey.",
      sceneIds: [
        "scene-13-the-progress-wall",
        "scene-14-proof-without-noise",
        "scene-15-the-parents-question",
        "scene-16-the-path-is-explained"
      ],
      order: 3
    },
    {
      id: "chapter-04-identity",
      title: "Identity",
      description: "The visitor moves from confidence into future self, defence pathways, academy culture, and pride.",
      sceneIds: [
        "scene-17-the-future-self",
        "scene-18-many-paths-one-mission",
        "scene-19-academy-culture",
        "scene-20-the-moment-of-pride"
      ],
      order: 4
    },
    {
      id: "chapter-05-first-step",
      title: "First Step",
      description: "The visitor crosses from inspiration into a clear, calm admission action.",
      sceneIds: [
        "scene-21-the-threshold",
        "scene-22-the-invitation",
        "scene-23-the-first-step",
        "scene-24-credits-of-trust"
      ],
      order: 5
    }
  ],
  scenes: [
    { id: "scene-01-first-breath", title: "The First Breath", chapterId: "chapter-01-awakening", order: 1, mode: "pinned", length: "long" },
    { id: "scene-02-student-before-dream", title: "The Student Before The Dream", chapterId: "chapter-01-awakening", order: 2, mode: "layered", length: "medium" },
    { id: "scene-03-dream-appears", title: "The Dream Appears", chapterId: "chapter-01-awakening", order: 3, mode: "immersive", length: "long" },
    { id: "scene-04-why-this-dream-matters", title: "Why This Dream Matters", chapterId: "chapter-01-awakening", order: 4, mode: "layered", length: "medium" },
    { id: "scene-05-question-of-identity", title: "The Question of Identity", chapterId: "chapter-01-awakening", order: 5, mode: "pinned", length: "medium" },
    { id: "scene-06-discipline-begins", title: "Discipline Begins", chapterId: "chapter-01-awakening", order: 6, mode: "layered", length: "medium" },
    { id: "scene-07-enter-nidus", title: "Enter NIDUS", chapterId: "chapter-01-awakening", order: 7, mode: "immersive", length: "long" },
    { id: "scene-08-the-academy-system", title: "The Academy System", chapterId: "chapter-02-the-system", order: 8, mode: "layered", length: "medium" },
    { id: "scene-09-the-written-battle", title: "The Written Battle", chapterId: "chapter-02-the-system", order: 9, mode: "split", length: "medium" },
    { id: "scene-10-the-body-learns-discipline", title: "The Body Learns Discipline", chapterId: "chapter-02-the-system", order: 10, mode: "parallax", length: "long" },
    { id: "scene-11-the-mentor", title: "The Mentor", chapterId: "chapter-02-the-system", order: 11, mode: "normal", length: "medium" },
    { id: "scene-12-the-formation", title: "The Formation", chapterId: "chapter-02-the-system", order: 12, mode: "immersive", length: "long" },
    { id: "scene-13-the-progress-wall", title: "The Progress Wall", chapterId: "chapter-03-trust-and-path", order: 13, mode: "layered", length: "medium" },
    { id: "scene-14-proof-without-noise", title: "Proof Without Noise", chapterId: "chapter-03-trust-and-path", order: 14, mode: "normal", length: "medium" },
    { id: "scene-15-the-parents-question", title: "The Parent's Question", chapterId: "chapter-03-trust-and-path", order: 15, mode: "sticky", length: "long" },
    { id: "scene-16-the-path-is-explained", title: "The Path Is Explained", chapterId: "chapter-03-trust-and-path", order: 16, mode: "layered", length: "long" },
    { id: "scene-17-the-future-self", title: "The Future Self", chapterId: "chapter-04-identity", order: 17, mode: "pinned", length: "long" },
    { id: "scene-18-many-paths-one-mission", title: "Many Paths, One Mission", chapterId: "chapter-04-identity", order: 18, mode: "layered", length: "medium" },
    { id: "scene-19-academy-culture", title: "Academy Culture", chapterId: "chapter-04-identity", order: 19, mode: "split", length: "medium" },
    { id: "scene-20-the-moment-of-pride", title: "The Moment of Pride", chapterId: "chapter-04-identity", order: 20, mode: "immersive", length: "long" },
    { id: "scene-21-the-threshold", title: "The Threshold", chapterId: "chapter-05-first-step", order: 21, mode: "immersive", length: "long" },
    { id: "scene-22-the-invitation", title: "The Invitation", chapterId: "chapter-05-first-step", order: 22, mode: "normal", length: "medium" },
    { id: "scene-23-the-first-step", title: "The First Step", chapterId: "chapter-05-first-step", order: 23, mode: "layered", length: "long" },
    { id: "scene-24-credits-of-trust", title: "Credits of Trust", chapterId: "chapter-05-first-step", order: 24, mode: "normal", length: "medium" }
  ]
} satisfies ExperienceManifest;

/**
 * Finds scene metadata by stable scene id.
 */
export function getExperienceSceneMetadata(sceneId: string) {
  return experienceManifest.scenes.find((scene) => scene.id === sceneId);
}
