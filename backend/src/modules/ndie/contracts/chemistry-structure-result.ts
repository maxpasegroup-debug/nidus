import type { NdieNormalizedFormula } from "./formula-result.js";
import type { NdieNormalizedVisual } from "./visual-result.js";

export type NdieChemistryObjectType =
  | "CHEMICAL_EQUATION"
  | "ORGANIC_STRUCTURE"
  | "LEWIS_STRUCTURE"
  | "REACTION_MECHANISM"
  | "IONIC_EQUATION"
  | "REDOX_REACTION"
  | "COORDINATION_COMPLEX"
  | "PERIODIC_TABLE_REFERENCE"
  | "LABORATORY_SETUP"
  | "GENERIC_CHEMISTRY_OBJECT";

export type NdieChemistryNotation = {
  formulaText: string;
  normalizedText: string;
  latex: string | null;
  mathml: string | null;
  reactants: string[];
  products: string[];
  arrows: Array<"FORWARD" | "REVERSIBLE" | "EQUILIBRIUM" | "UNKNOWN">;
  charges: string[];
  states: Array<"SOLID" | "LIQUID" | "GAS" | "AQUEOUS">;
  catalysts: string[];
};

export type NdieChemistryStructureRisk =
  | "MISSING_STRUCTURE_IMAGE"
  | "LOW_CONFIDENCE_STRUCTURE"
  | "REACTION_ARROW_AMBIGUOUS"
  | "CHARGE_AMBIGUOUS"
  | "STATE_SYMBOL_AMBIGUOUS"
  | "ORGANIC_STRUCTURE_REQUIRES_REVIEW"
  | "MECHANISM_REQUIRES_REVIEW";

export type NdieChemistryStructureObject = {
  schemaVersion: "ndie-chemistry-structure-v1";
  chemistryId: string;
  objectType: NdieChemistryObjectType;
  sourceFormulaIds: string[];
  sourceVisualIds: string[];
  sourcePageNumbers: number[];
  notation: NdieChemistryNotation;
  concepts: string[];
  relationships: Array<{ from: string; to: string; type: "USES_VISUAL" | "USES_FORMULA" | "REACTS_TO" | "HAS_CHARGE" | "HAS_STATE"; confidence: number }>;
  confidence: number;
  risks: NdieChemistryStructureRisk[];
  teacherReviewRequired: boolean;
  canAutoPublish: boolean;
  guarantees: {
    originalFormulaPreserved: boolean;
    sourceVisualPreservedOrRequired: boolean;
    noChemistryObjectDiscarded: true;
    noInventedStructure: true;
  };
};

export type NdieChemistryStructureInput = {
  importJobId: string;
  formulas: NdieNormalizedFormula[];
  visuals: NdieNormalizedVisual[];
  pageUnderstanding?: unknown;
};

export type NdieChemistryStructureResult = {
  schemaVersion: "ndie-chemistry-structure-document-v1";
  engineVersion: "ndie-chemistry-structure-v1";
  importJobId: string;
  objects: NdieChemistryStructureObject[];
  summary: {
    objectCount: number;
    equations: number;
    organicStructures: number;
    lewisStructures: number;
    reactionMechanisms: number;
    ionicEquations: number;
    redoxReactions: number;
    coordinationComplexes: number;
    teacherReviewRequired: number;
    autoPublishSafe: number;
    averageConfidence: number;
  };
};
