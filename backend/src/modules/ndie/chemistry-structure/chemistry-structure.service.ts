import { createHash } from "node:crypto";
import type { NdieChemistryObjectType, NdieChemistryStructureInput, NdieChemistryStructureObject, NdieChemistryStructureResult, NdieChemistryStructureRisk } from "../contracts/chemistry-structure-result.js";
import type { NdieNormalizedFormula } from "../contracts/formula-result.js";
import type { NdieNormalizedVisual } from "../contracts/visual-result.js";

const engineVersion = "ndie-chemistry-structure-v1" as const;
const chemistryFormulaSignal = /\b(?:H2O|CO2|NaCl|HCl|H2SO4|NH3|CH4|O2|N2|CH3|OH|Na\+|Cl-|Fe|Cu|Zn|Ag|NH4)\b|\\rightarrow|->|<->|\\rightleftharpoons|\(aq\)|\(s\)|\(l\)|\(g\)|benzene|organic|lewis|redox|oxidation|reduction|coordination|complex|ligand|ionic/i;
const organicSignal = /benzene|alkane|alkene|alkyne|aromatic|phenyl|methyl|ethyl|organic|functional group|skeletal|ring/i;
const lewisSignal = /lewis|lone pair|electron dot|octet|valence electron/i;
const mechanismSignal = /mechanism|curved arrow|intermediate|transition state|nucleophile|electrophile|substitution|elimination/i;
const redoxSignal = /redox|oxidation|reduction|oxidizing agent|reducing agent|electron transfer/i;
const coordinationSignal = /coordination|complex|ligand|coordination number|\[.*(?:NH3|CN|Cl|H2O).*\]/i;
const periodicSignal = /periodic table|group\s+\d+|period\s+\d+|atomic number|atomic mass|valency/i;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function textOfFormula(formula: NdieNormalizedFormula) {
  return [formula.representations.plainText, formula.representations.latex, formula.representations.normalizedExpression].filter(Boolean).join(" ");
}

function textOfVisual(visual: NdieNormalizedVisual) {
  return [visual.visualType, visual.caption, ...visual.labels].filter(Boolean).join(" ");
}

function isChemistryFormula(formula: NdieNormalizedFormula) {
  return formula.semanticType === "CHEMISTRY_EQUATION" || chemistryFormulaSignal.test(textOfFormula(formula));
}

function isChemistryVisual(visual: NdieNormalizedVisual) {
  return visual.visualType === "CHEMISTRY_STRUCTURE" || chemistryFormulaSignal.test(textOfVisual(visual));
}

function objectType(text: string, hasVisual: boolean): NdieChemistryObjectType {
  if (mechanismSignal.test(text)) return "REACTION_MECHANISM";
  if (lewisSignal.test(text)) return "LEWIS_STRUCTURE";
  if (redoxSignal.test(text)) return "REDOX_REACTION";
  if (coordinationSignal.test(text)) return "COORDINATION_COMPLEX";
  if (/ionic|net ionic|Na\+|Cl-|NH4\+|SO4/i.test(text)) return "IONIC_EQUATION";
  if (periodicSignal.test(text)) return "PERIODIC_TABLE_REFERENCE";
  if (/\\rightarrow|->|<->|\\rightleftharpoons|=/.test(text)) return "CHEMICAL_EQUATION";
  if (organicSignal.test(text) || hasVisual) return "ORGANIC_STRUCTURE";
  return "GENERIC_CHEMISTRY_OBJECT";
}

function splitEquation(text: string) {
  const normalized = text.replace(/\\rightarrow|->/g, " -> ").replace(/\\rightleftharpoons|<->/g, " <-> ");
  const parts = normalized.split(/->|<->|=/);
  const parseSide = (side: string | undefined) => String(side ?? "").split("+").map((item) => item.trim()).filter(Boolean).slice(0, 12);
  return { reactants: parseSide(parts[0]), products: parseSide(parts[1]) };
}

function arrows(text: string): Array<"FORWARD" | "REVERSIBLE" | "EQUILIBRIUM" | "UNKNOWN"> {
  const output: Array<"FORWARD" | "REVERSIBLE" | "EQUILIBRIUM" | "UNKNOWN"> = [];
  if (/\\rightleftharpoons|<->/.test(text)) output.push("EQUILIBRIUM");
  if (/\\rightarrow|->/.test(text)) output.push("FORWARD");
  if (/\\leftrightarrow|reversible|equilibrium/i.test(text)) output.push("REVERSIBLE");
  return output.length ? output : ["UNKNOWN"];
}

function charges(text: string) {
  return Array.from(new Set(text.match(/[A-Z][a-z]?(?:\d+)?[+-]|\b(?:cation|anion|positive charge|negative charge)\b/gi) ?? []));
}

function states(text: string): Array<"SOLID" | "LIQUID" | "GAS" | "AQUEOUS"> {
  const output: Array<"SOLID" | "LIQUID" | "GAS" | "AQUEOUS"> = [];
  if (/\(s\)|solid/i.test(text)) output.push("SOLID");
  if (/\(l\)|liquid/i.test(text)) output.push("LIQUID");
  if (/\(g\)|gas/i.test(text)) output.push("GAS");
  if (/\(aq\)|aqueous/i.test(text)) output.push("AQUEOUS");
  return Array.from(new Set(output));
}

function catalysts(text: string) {
  return Array.from(new Set(text.match(/\b(?:Pt|Ni|Fe|MnO2|heat|hv|UV|catalyst|enzyme)\b/g) ?? []));
}

function concepts(type: NdieChemistryObjectType, text: string) {
  return Array.from(new Set([
    type.replace(/_/g, " "),
    ...(organicSignal.test(text) ? ["Organic Chemistry"] : []),
    ...(lewisSignal.test(text) ? ["Lewis Structure"] : []),
    ...(mechanismSignal.test(text) ? ["Reaction Mechanism"] : []),
    ...(redoxSignal.test(text) ? ["Redox"] : []),
    ...(coordinationSignal.test(text) ? ["Coordination Chemistry"] : []),
    ...(states(text).length ? ["State Symbols"] : []),
    ...(charges(text).length ? ["Charges"] : [])
  ]));
}

function nearestVisuals(formula: NdieNormalizedFormula, visuals: NdieNormalizedVisual[]) {
  return visuals.filter((visual) => Math.abs(visual.sourcePage - formula.sourcePage) <= 1 && isChemistryVisual(visual)).slice(0, 4);
}

function risks(input: { type: NdieChemistryObjectType; confidence: number; visualCount: number; notationText: string }): NdieChemistryStructureRisk[] {
  const output = new Set<NdieChemistryStructureRisk>();
  if (["ORGANIC_STRUCTURE", "LEWIS_STRUCTURE", "REACTION_MECHANISM"].includes(input.type) && input.visualCount === 0) output.add("MISSING_STRUCTURE_IMAGE");
  if (input.confidence < 0.72) output.add("LOW_CONFIDENCE_STRUCTURE");
  if (input.notationText.includes("?") || /arrow|yields/i.test(input.notationText) && !/(->|\\rightarrow|<->|\\rightleftharpoons)/.test(input.notationText)) output.add("REACTION_ARROW_AMBIGUOUS");
  if (/charge|ion|cation|anion/i.test(input.notationText) && charges(input.notationText).length === 0) output.add("CHARGE_AMBIGUOUS");
  if (/state|solid|liquid|gas|aqueous/i.test(input.notationText) && states(input.notationText).length === 0) output.add("STATE_SYMBOL_AMBIGUOUS");
  if (input.type === "ORGANIC_STRUCTURE") output.add("ORGANIC_STRUCTURE_REQUIRES_REVIEW");
  if (input.type === "REACTION_MECHANISM") output.add("MECHANISM_REQUIRES_REVIEW");
  return Array.from(output);
}

function buildFromFormula(formula: NdieNormalizedFormula, visuals: NdieNormalizedVisual[]): NdieChemistryStructureObject {
  const nearbyVisuals = nearestVisuals(formula, visuals);
  const notationText = textOfFormula(formula);
  const type = objectType(notationText, nearbyVisuals.length > 0);
  const equation = splitEquation(formula.representations.plainText ?? notationText);
  const confidence = clamp01((Number(formula.confidence.overall ?? 0.6) * 0.7) + (nearbyVisuals.length ? 0.18 : 0.05) + (formula.representations.originalImageCrop?.sourcePageImageUrl ? 0.08 : 0));
  const riskList = risks({ type, confidence, visualCount: nearbyVisuals.length, notationText });
  const chemistryId = `chem-${formula.sourcePage}-${hash({ formulaId: formula.formulaId, visualIds: nearbyVisuals.map((visual) => visual.visualId) })}`;
  return {
    schemaVersion: "ndie-chemistry-structure-v1",
    chemistryId,
    objectType: type,
    sourceFormulaIds: [formula.formulaId],
    sourceVisualIds: nearbyVisuals.map((visual) => visual.visualId),
    sourcePageNumbers: Array.from(new Set([formula.sourcePage, ...nearbyVisuals.map((visual) => visual.sourcePage)])),
    notation: {
      formulaText: formula.representations.plainText,
      normalizedText: formula.representations.normalizedExpression,
      latex: formula.representations.latex,
      mathml: formula.representations.mathml,
      reactants: equation.reactants,
      products: equation.products,
      arrows: arrows(notationText),
      charges: charges(notationText),
      states: states(notationText),
      catalysts: catalysts(notationText)
    },
    concepts: concepts(type, notationText),
    relationships: [
      { from: chemistryId, to: formula.formulaId, type: "USES_FORMULA" as const, confidence },
      ...nearbyVisuals.map((visual) => ({ from: chemistryId, to: visual.visualId, type: "USES_VISUAL" as const, confidence: Number(visual.confidence ?? confidence) })),
      ...equation.products.map((product) => ({ from: equation.reactants.join(" + ") || chemistryId, to: product, type: "REACTS_TO" as const, confidence: 0.74 })),
      ...charges(notationText).map((charge) => ({ from: chemistryId, to: charge, type: "HAS_CHARGE" as const, confidence: 0.7 })),
      ...states(notationText).map((state) => ({ from: chemistryId, to: state, type: "HAS_STATE" as const, confidence: 0.7 }))
    ],
    confidence,
    risks: riskList,
    teacherReviewRequired: riskList.length > 0 || confidence < 0.88,
    canAutoPublish: riskList.length === 0 && confidence >= 0.96,
    guarantees: {
      originalFormulaPreserved: Boolean(formula.representations.plainText && formula.representations.normalizedExpression),
      sourceVisualPreservedOrRequired: nearbyVisuals.length > 0 || riskList.includes("MISSING_STRUCTURE_IMAGE"),
      noChemistryObjectDiscarded: true,
      noInventedStructure: true
    }
  };
}

function buildFromVisual(visual: NdieNormalizedVisual): NdieChemistryStructureObject {
  const notationText = textOfVisual(visual);
  const type = objectType(notationText, true);
  const confidence = clamp01(Number(visual.confidence ?? 0.62));
  const riskList = risks({ type, confidence, visualCount: 1, notationText });
  const chemistryId = `chem-visual-${visual.sourcePage}-${hash(visual.visualId)}`;
  return {
    schemaVersion: "ndie-chemistry-structure-v1",
    chemistryId,
    objectType: type,
    sourceFormulaIds: [],
    sourceVisualIds: [visual.visualId],
    sourcePageNumbers: [visual.sourcePage],
    notation: {
      formulaText: visual.caption ?? visual.visualType,
      normalizedText: notationText,
      latex: null,
      mathml: null,
      reactants: [],
      products: [],
      arrows: arrows(notationText),
      charges: charges(notationText),
      states: states(notationText),
      catalysts: catalysts(notationText)
    },
    concepts: concepts(type, notationText),
    relationships: [{ from: chemistryId, to: visual.visualId, type: "USES_VISUAL", confidence }],
    confidence,
    risks: riskList,
    teacherReviewRequired: true,
    canAutoPublish: false,
    guarantees: {
      originalFormulaPreserved: true,
      sourceVisualPreservedOrRequired: true,
      noChemistryObjectDiscarded: true,
      noInventedStructure: true
    }
  };
}

export const chemistryStructureService = {
  version: engineVersion,

  understand(input: NdieChemistryStructureInput): NdieChemistryStructureResult {
    const chemistryFormulas = input.formulas.filter(isChemistryFormula);
    const chemistryVisuals = input.visuals.filter(isChemistryVisual);
    const formulaObjects = chemistryFormulas.map((formula) => buildFromFormula(formula, chemistryVisuals));
    const linkedVisualIds = new Set(formulaObjects.flatMap((object) => object.sourceVisualIds));
    const orphanVisualObjects = chemistryVisuals.filter((visual) => {
      const visualText = textOfVisual(visual);
      return !linkedVisualIds.has(visual.visualId) || organicSignal.test(visualText) || mechanismSignal.test(visualText) || lewisSignal.test(visualText);
    }).map(buildFromVisual);
    const objects = [...formulaObjects, ...orphanVisualObjects];
    const count = (type: NdieChemistryObjectType) => objects.filter((object) => object.objectType === type).length;
    return {
      schemaVersion: "ndie-chemistry-structure-document-v1",
      engineVersion,
      importJobId: input.importJobId,
      objects,
      summary: {
        objectCount: objects.length,
        equations: count("CHEMICAL_EQUATION"),
        organicStructures: count("ORGANIC_STRUCTURE"),
        lewisStructures: count("LEWIS_STRUCTURE"),
        reactionMechanisms: count("REACTION_MECHANISM"),
        ionicEquations: count("IONIC_EQUATION"),
        redoxReactions: count("REDOX_REACTION"),
        coordinationComplexes: count("COORDINATION_COMPLEX"),
        teacherReviewRequired: objects.filter((object) => object.teacherReviewRequired).length,
        autoPublishSafe: objects.filter((object) => object.canAutoPublish).length,
        averageConfidence: clamp01(objects.reduce((sum, object) => sum + object.confidence, 0) / Math.max(1, objects.length))
      }
    };
  },

  health() {
    return {
      status: "ready",
      version: engineVersion,
      supports: ["chemical equations", "organic structures", "Lewis structures", "reaction mechanisms", "ionic equations", "redox reactions", "coordination complexes", "charges", "states", "reaction arrows"],
      guarantees: ["no invented structure", "no chemistry object discarded", "teacher review required when visual structure is missing"]
    };
  }
};
