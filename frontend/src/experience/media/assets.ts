/**
 * Central placeholder media registry for NIDUS Experience V2 scenes.
 * Final photography can replace these sources without changing scene components.
 */
import type { ExperienceMediaAsset } from "./index";

const wikiImage = (fileName: string, width = 1600) => `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=${width}`;

export const experienceSceneAssets = {
  firstBreathGround: {
    id: "first-breath-ground",
    role: "hero",
    src: wikiImage("Indian%20Armed%20Forces%20-%20Republic%20day%20parade%202024.jpg", 1800),
    alt: "A quiet defence parade ground atmosphere before sunrise, used as a placeholder for NIDUS dawn training photography."
  },
  studentBeforeDream: {
    id: "student-before-dream",
    role: "identity",
    src: wikiImage("Ncc%20cadets%20in%20India%20during%20parade.jpg", 1200),
    alt: "Indian cadets in disciplined preparation, used as a placeholder for future NIDUS student study-room photography."
  },
  dreamAppears: {
    id: "dream-appears",
    role: "dream",
    src: wikiImage("Indian%20Air%20Force%20Marching%20Contingent.jpg", 1800),
    alt: "Indian defence formation in ceremonial movement, representing the officer dream."
  },
  dreamMatters: {
    id: "dream-matters",
    role: "parent",
    src: wikiImage("Ncc%20cadets%20in%20India%20during%20parade.jpg", 1400),
    alt: "Indian cadets in disciplined preparation, used as a placeholder for parent and student purpose storytelling."
  },
  identityQuestion: {
    id: "identity-question",
    role: "identity",
    src: wikiImage("Indian%20soldiers%20at%20the%20Republic%20day%20parade.jpg", 1400),
    alt: "A disciplined Indian defence formation, used as a placeholder for the future NIDUS mirror identity composition."
  },
  disciplineBegins: {
    id: "discipline-begins",
    role: "discipline",
    src: wikiImage("Para%20contingent%20republic%20day%202022.jpg", 1400),
    alt: "Indian defence personnel in motion, used as a placeholder for future NIDUS morning routine photography."
  },
  enterNidus: {
    id: "enter-nidus",
    role: "commitment",
    src: wikiImage("Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg", 1800),
    alt: "Indian academy ceremonial setting, used as a placeholder for the future NIDUS academy threshold reveal."
  },
  academySystem: {
    id: "academy-system",
    role: "proof",
    src: wikiImage("NCC%20Cadets%20Preparing%20for%20Republic%20Day%20Parade.jpg", 1600),
    alt: "Cadets preparing in a structured environment, used as a placeholder for the NIDUS academy system scene."
  },
  writtenBattle: {
    id: "written-battle",
    role: "training",
    src: wikiImage("Students%20studying%20in%20a%20classroom.jpg", 1400),
    alt: "Students studying in a classroom, used as a placeholder for NIDUS academic preparation photography."
  },
  bodyLearnsDiscipline: {
    id: "body-learns-discipline",
    role: "training",
    src: wikiImage("NCC%20Republic%20Day%20Camp%202014%20-%20Drill%20Practice.jpg", 1800),
    alt: "Cadets moving in disciplined outdoor training, used as a placeholder for NIDUS physical preparation photography."
  },
  mentor: {
    id: "mentor",
    role: "mentor",
    src: wikiImage("National%20Cadet%20Corps%20India%20training.jpg", 1400),
    alt: "A training guidance moment, used as a placeholder for future NIDUS mentor and student review photography."
  },
  formation: {
    id: "formation",
    role: "commitment",
    src: wikiImage("Indian%20Navy%20cadets%20marching%20during%20passing%20out%20parade.jpg", 1800),
    alt: "Cadets in formation, used as a placeholder for the NIDUS belonging and formation scene."
  },
  progressWall: {
    id: "progress-wall",
    role: "proof",
    src: wikiImage("NCC%20cadets%20in%20training%20camp.jpg", 1600),
    alt: "Cadets in a training camp, used as a placeholder for NIDUS measurable progress storytelling."
  },
  proofWithoutNoise: {
    id: "proof-without-noise",
    role: "proof",
    src: wikiImage("Ncc%20cadets%20in%20India%20during%20parade.jpg", 1600),
    alt: "Disciplined cadets in formation, used as a placeholder for quiet NIDUS achievement proof."
  },
  parentsQuestion: {
    id: "parents-question",
    role: "parent",
    src: wikiImage("Indian%20Students%20in%20Classroom.jpg", 1400),
    alt: "Students in an Indian classroom, used as a placeholder for parent consultation and reassurance."
  },
  pathExplained: {
    id: "path-explained",
    role: "commitment",
    src: wikiImage("Indian%20Naval%20Academy%20Ezhimala.jpg", 1800),
    alt: "An Indian academy setting, used as a placeholder for the NIDUS admissions journey."
  },
  futureSelf: {
    id: "future-self",
    role: "identity",
    src: wikiImage("Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%284%29.jpg", 1800),
    alt: "A commissioning ceremony atmosphere, used as a placeholder for the NIDUS future officer identity scene."
  },
  manyPathsOneMission: {
    id: "many-paths-one-mission",
    role: "dream",
    src: wikiImage("Indian%20Air%20Force%20Marching%20Contingent.jpg", 1800),
    alt: "Indian defence formation, used as a placeholder for connected defence pathways after preparation."
  },
  academyCulture: {
    id: "academy-culture",
    role: "training",
    src: wikiImage("NCC%20cadets%20during%20training.jpg", 1600),
    alt: "Cadets training together, used as a placeholder for warm NIDUS academy culture storytelling."
  },
  momentOfPride: {
    id: "moment-of-pride",
    role: "commitment",
    src: wikiImage("Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg", 1800),
    alt: "A ceremonial academy moment, used as a placeholder for family pride and officer identity."
  },
  threshold: {
    id: "threshold",
    role: "commitment",
    src: wikiImage("Indian%20Naval%20Academy%20Ezhimala.jpg", 1800),
    alt: "An academy entrance and open pathway, used as a placeholder for the NIDUS threshold scene."
  },
  invitation: {
    id: "invitation",
    role: "parent",
    src: wikiImage("Indian%20Students%20in%20Classroom.jpg", 1400),
    alt: "A calm academic guidance atmosphere, used as a placeholder for the NIDUS invitation scene."
  },
  firstStep: {
    id: "first-step",
    role: "commitment",
    src: wikiImage("Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%284%29.jpg", 1800),
    alt: "A ceremonial academy pathway, used as a placeholder for the first admission step scene."
  },
  creditsOfTrust: {
    id: "credits-of-trust",
    role: "proof",
    src: wikiImage("Ncc%20cadets%20in%20India%20during%20parade.jpg", 1600),
    alt: "Disciplined cadets in a closing institutional frame, used as a placeholder for NIDUS trust credits."
  }
} satisfies Record<string, ExperienceMediaAsset>;
