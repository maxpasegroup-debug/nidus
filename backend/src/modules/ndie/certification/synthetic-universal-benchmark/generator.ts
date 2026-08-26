import {
  BENCHMARK_DIFFICULTIES, BENCHMARK_DOMAINS, BENCHMARK_LAYOUT_TYPES, BENCHMARK_QUESTION_TYPES,
  SYNTHETIC_BENCHMARK_SOURCE_TYPE, SYNTHETIC_BENCHMARK_VERSION,
  type BenchmarkDomain, type BenchmarkLayoutType, type BenchmarkQuestionType, type SyntheticBenchmarkCase
} from "./contracts.js";
import { FORMULA_STRUCTURES, TOPICS, VISUAL_STRUCTURES } from "./catalogs.js";

export const SYNTHETIC_CASES_PER_DOMAIN = 500;
export const SYNTHETIC_BENCHMARK_TARGET = BENCHMARK_DOMAINS.length * SYNTHETIC_CASES_PER_DOMAIN;

const subjectByDomain: Record<BenchmarkDomain, SyntheticBenchmarkCase["subject"]> = {
  MATHEMATICS: "MATHEMATICS", PHYSICS: "PHYSICS", CHEMISTRY: "CHEMISTRY", BIOLOGY: "BIOLOGY", ENGLISH: "LANGUAGES",
  UNIVERSAL_ASSESSMENT: "HUMANITIES", FORMULA_RECOGNITION: "MATHEMATICS", VISUAL_RECOGNITION: "ENGINEERING",
  DOCUMENT_LAYOUT: "HUMANITIES", ANSWER_MAPPING: "MATHEMATICS", FAILURE_HANDLING: "ENGINEERING"
};

const optionQuestionTypes = new Set<BenchmarkQuestionType>(["SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "ASSERTION_REASON"]);
const manualQuestionTypes = new Set<BenchmarkQuestionType>(["LONG_ANSWER", "DESCRIPTIVE", "DRAWING", "FILE_RESPONSE", "VOICE_RESPONSE", "UNKNOWN_FUTURE"]);

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mathMl(body: string) {
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>${body}</mrow></math>`;
}

function formulaExpectation(structureType: typeof FORMULA_STRUCTURES[number], variant: number, formulaId: string) {
  const a = variant % 9 + 2;
  const b = variant % 7 + 3;
  const standard = (originalExpression: string, latex: string, body: string, operation: string, renderingExpectation: "INLINE" | "DISPLAY" | "MULTILINE" | "SOURCE_CROP_FALLBACK" = "DISPLAY") => ({
    formulaId, structureType, originalExpression, latex, mathML: mathMl(body), semanticRepresentation: { operation, operands: [a, b], variant }, plainTextFallback: originalExpression, renderingExpectation
  });
  switch (structureType) {
    case "SIMPLE_FRACTION": return standard(`${a}/${b}`, `\\frac{${a}}{${b}}`, `<mfrac><mn>${a}</mn><mn>${b}</mn></mfrac>`, "divide");
    case "NESTED_FRACTION": return standard(`(${a}/${b})/(${b}/${a + b})`, `\\frac{\\frac{${a}}{${b}}}{\\frac{${b}}{${a + b}}}`, `<mfrac><mfrac><mn>${a}</mn><mn>${b}</mn></mfrac><mfrac><mn>${b}</mn><mn>${a + b}</mn></mfrac></mfrac>`, "nested-divide");
    case "MIXED_FRACTION": return standard(`${a} ${b}/${a + b}`, `${a}\\frac{${b}}{${a + b}}`, `<mn>${a}</mn><mfrac><mn>${b}</mn><mn>${a + b}</mn></mfrac>`, "mixed-number");
    case "SUPERSCRIPT": return standard(`x^${a}`, `x^{${a}}`, `<msup><mi>x</mi><mn>${a}</mn></msup>`, "power", "INLINE");
    case "SUBSCRIPT": return standard(`a_${a}`, `a_{${a}}`, `<msub><mi>a</mi><mn>${a}</mn></msub>`, "subscript", "INLINE");
    case "ROOT": return standard(`sqrt(${a})`, `\\sqrt{${a}}`, `<msqrt><mn>${a}</mn></msqrt>`, "root");
    case "NESTED_ROOT": return standard(`sqrt(${a}+sqrt(${b}))`, `\\sqrt{${a}+\\sqrt{${b}}}`, `<msqrt><mrow><mn>${a}</mn><mo>+</mo><msqrt><mn>${b}</mn></msqrt></mrow></msqrt>`, "nested-root");
    case "ABSOLUTE_VALUE": return standard(`|x-${a}|`, `\\left|x-${a}\\right|`, `<mo>|</mo><mi>x</mi><mo>-</mo><mn>${a}</mn><mo>|</mo>`, "absolute-value", "INLINE");
    case "PIECEWISE_FUNCTION": return standard(`f(x)={x^2 if x>=0; -x if x<0}`, `f(x)=\\begin{cases}x^2&x\\ge0\\\\-x&x<0\\end{cases}`, `<mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfenced><mtable><mtr><mtd><msup><mi>x</mi><mn>2</mn></msup></mtd><mtd><mi>x</mi><mo>≥</mo><mn>0</mn></mtd></mtr><mtr><mtd><mo>-</mo><mi>x</mi></mtd><mtd><mi>x</mi><mo>&lt;</mo><mn>0</mn></mtd></mtr></mtable></mfenced>`, "piecewise", "MULTILINE");
    case "LIMIT": return standard(`lim(x->0) sin(${a}x)/x`, `\\lim_{x\\to0}\\frac{\\sin(${a}x)}{x}`, `<munder><mi>lim</mi><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mfrac><mrow><mi>sin</mi><mo>(</mo><mn>${a}</mn><mi>x</mi><mo>)</mo></mrow><mi>x</mi></mfrac>`, "limit");
    case "INTEGRAL": return standard(`integral_0^${a} x^2 dx`, `\\int_0^{${a}}x^2\\,dx`, `<msubsup><mo>∫</mo><mn>0</mn><mn>${a}</mn></msubsup><msup><mi>x</mi><mn>2</mn></msup><mi>d</mi><mi>x</mi>`, "integral");
    case "DOUBLE_INTEGRAL": return standard(`double integral_R (${a}x+${b}y)dA`, `\\iint_R(${a}x+${b}y)\\,dA`, `<munderover><mo>∬</mo><mi>R</mi><mrow></mrow></munderover><mo>(</mo><mn>${a}</mn><mi>x</mi><mo>+</mo><mn>${b}</mn><mi>y</mi><mo>)</mo><mi>dA</mi>`, "double-integral");
    case "TRIPLE_INTEGRAL": return standard(`triple integral_V xyz dV`, `\\iiint_V xyz\\,dV`, `<munderover><mo>∭</mo><mi>V</mi><mrow></mrow></munderover><mi>x</mi><mi>y</mi><mi>z</mi><mi>dV</mi>`, "triple-integral");
    case "SUMMATION": return standard(`sum(k=1..${a}) k^2`, `\\sum_{k=1}^{${a}}k^2`, `<munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mn>${a}</mn></munderover><msup><mi>k</mi><mn>2</mn></msup>`, "sum");
    case "PRODUCT": return standard(`product(k=1..${a}) (${b}+k)`, `\\prod_{k=1}^{${a}}(${b}+k)`, `<munderover><mo>∏</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mn>${a}</mn></munderover><mo>(</mo><mn>${b}</mn><mo>+</mo><mi>k</mi><mo>)</mo>`, "product");
    case "MATRIX": return standard(`[[${a},${b}],[${b},${a + b}]]`, `\\begin{bmatrix}${a}&${b}\\\\${b}&${a + b}\\end{bmatrix}`, `<mfenced><mtable><mtr><mtd><mn>${a}</mn></mtd><mtd><mn>${b}</mn></mtd></mtr><mtr><mtd><mn>${b}</mn></mtd><mtd><mn>${a + b}</mn></mtd></mtr></mtable></mfenced>`, "matrix");
    case "DETERMINANT": return standard(`det[[${a},${b}],[1,${a + b}]]`, `\\begin{vmatrix}${a}&${b}\\\\1&${a + b}\\end{vmatrix}`, `<mo>|</mo><mtable><mtr><mtd><mn>${a}</mn></mtd><mtd><mn>${b}</mn></mtd></mtr><mtr><mtd><mn>1</mn></mtd><mtd><mn>${a + b}</mn></mtd></mtr></mtable><mo>|</mo>`, "determinant");
    case "VECTOR": return standard(`v=<${a},${b},${a + b}>`, `\\vec v=\\langle${a},${b},${a + b}\\rangle`, `<mover><mi>v</mi><mo>→</mo></mover><mo>=</mo><mfenced><mn>${a}</mn><mn>${b}</mn><mn>${a + b}</mn></mfenced>`, "vector");
    case "DOT_PRODUCT": return standard(`a dot b=${a}`, `\\vec a\\cdot\\vec b=${a}`, `<mover><mi>a</mi><mo>→</mo></mover><mo>·</mo><mover><mi>b</mi><mo>→</mo></mover><mo>=</mo><mn>${a}</mn>`, "dot-product");
    case "CROSS_PRODUCT": return standard(`a cross b=<${a},${b},1>`, `\\vec a\\times\\vec b=\\langle${a},${b},1\\rangle`, `<mover><mi>a</mi><mo>→</mo></mover><mo>×</mo><mover><mi>b</mi><mo>→</mo></mover><mo>=</mo><mfenced><mn>${a}</mn><mn>${b}</mn><mn>1</mn></mfenced>`, "cross-product");
    case "PARTIAL_DERIVATIVE": return standard(`partial f/partial x=${a}x`, `\\frac{\\partial f}{\\partial x}=${a}x`, `<mfrac><mrow><mo>∂</mo><mi>f</mi></mrow><mrow><mo>∂</mo><mi>x</mi></mrow></mfrac><mo>=</mo><mn>${a}</mn><mi>x</mi>`, "partial-derivative");
    case "GRADIENT": return standard(`grad f=<${a}x,${b}y>`, `\\nabla f=\\langle${a}x,${b}y\\rangle`, `<mo>∇</mo><mi>f</mi><mo>=</mo><mfenced><mrow><mn>${a}</mn><mi>x</mi></mrow><mrow><mn>${b}</mn><mi>y</mi></mrow></mfenced>`, "gradient");
    case "LAPLACIAN": return standard(`laplacian f=${a}+${b}`, `\\nabla^2f=${a + b}`, `<msup><mo>∇</mo><mn>2</mn></msup><mi>f</mi><mo>=</mo><mn>${a + b}</mn>`, "laplacian");
    case "DIFFERENTIAL_EQUATION": return standard(`dy/dx+${a}y=${b}`, `\\frac{dy}{dx}+${a}y=${b}`, `<mfrac><mrow><mi>d</mi><mi>y</mi></mrow><mrow><mi>d</mi><mi>x</mi></mrow></mfrac><mo>+</mo><mn>${a}</mn><mi>y</mi><mo>=</mo><mn>${b}</mn>`, "differential-equation");
    case "PROBABILITY_NOTATION": return standard(`P(A|B)=${a}/${a + b}`, `P(A\\mid B)=\\frac{${a}}{${a + b}}`, `<mi>P</mi><mo>(</mo><mi>A</mi><mo>|</mo><mi>B</mi><mo>)</mo><mo>=</mo><mfrac><mn>${a}</mn><mn>${a + b}</mn></mfrac>`, "conditional-probability");
    case "SET_NOTATION": return standard(`A union B subseteq U`, `A\\cup B\\subseteq U`, `<mi>A</mi><mo>∪</mo><mi>B</mi><mo>⊆</mo><mi>U</mi>`, "set-relation");
    case "GREEK_SYMBOLS": return standard(`alpha+beta=${a}pi`, `\\alpha+\\beta=${a}\\pi`, `<mi>α</mi><mo>+</mo><mi>β</mi><mo>=</mo><mn>${a}</mn><mi>π</mi>`, "greek-symbols");
    case "SPECIAL_SYMBOLS": return standard(`forall x in R, x^2>=0`, `\\forall x\\in\\mathbb R,\\ x^2\\ge0`, `<mo>∀</mo><mi>x</mi><mo>∈</mo><mi>ℝ</mi><mo>,</mo><msup><mi>x</mi><mn>2</mn></msup><mo>≥</mo><mn>0</mn>`, "logical-relation");
    case "CHEMICAL_FORMULA": return standard(`H2SO4`, `\\mathrm{H_2SO_4}`, `<msub><mi>H</mi><mn>2</mn></msub><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub>`, "chemical-formula");
    case "IONIC_CHARGE": return standard(`SO4^2-`, `\\mathrm{SO_4^{2-}}`, `<msubsup><mi>SO</mi><mn>4</mn><mrow><mn>2</mn><mo>-</mo></mrow></msubsup>`, "ionic-charge");
    case "OXIDATION_STATE": return standard(`Fe(+${a})`, `\\mathrm{Fe^{+${a}}}`, `<msup><mi>Fe</mi><mrow><mo>+</mo><mn>${a}</mn></mrow></msup>`, "oxidation-state");
    case "REACTION_ARROW": return standard(`2H2+O2 -> 2H2O`, `2\\mathrm{H_2}+\\mathrm{O_2}\\rightarrow2\\mathrm{H_2O}`, `<mn>2</mn><msub><mi>H</mi><mn>2</mn></msub><mo>+</mo><msub><mi>O</mi><mn>2</mn></msub><mo>→</mo><mn>2</mn><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>`, "reaction");
    case "EQUILIBRIUM_ARROW": return standard(`N2+3H2 <=> 2NH3`, `\\mathrm{N_2+3H_2\\rightleftharpoons2NH_3}`, `<msub><mi>N</mi><mn>2</mn></msub><mo>+</mo><mn>3</mn><msub><mi>H</mi><mn>2</mn></msub><mo>⇌</mo><mn>2</mn><mi>N</mi><msub><mi>H</mi><mn>3</mn></msub>`, "equilibrium");
    case "CATALYST_CONDITIONS": return standard(`A -[${a}K,Pt]-> B`, `\\mathrm{A\\xrightarrow[Pt]{${a}K}B}`, `<mi>A</mi><mover><mo>→</mo><mrow><mn>${a}</mn><mi>K</mi><mo>,</mo><mi>Pt</mi></mrow></mover><mi>B</mi>`, "conditioned-reaction");
    case "ORGANIC_NOTATION": return standard(`CH3-CH2-OH`, `\\mathrm{CH_3-CH_2-OH}`, `<mi>C</mi><msub><mi>H</mi><mn>3</mn></msub><mo>-</mo><mi>C</mi><msub><mi>H</mi><mn>2</mn></msub><mo>-</mo><mi>OH</mi>`, "organic-structure");
    case "COORDINATION_COMPLEX": return standard(`[Cu(NH3)4]^2+`, `\\mathrm{[Cu(NH_3)_4]^{2+}}`, `<msup><mfenced open="[" close="]"><mi>Cu</mi><msub><mfenced><mi>N</mi><msub><mi>H</mi><mn>3</mn></msub></mfenced><mn>4</mn></msub></mfenced><mrow><mn>2</mn><mo>+</mo></mrow></msup>`, "coordination-complex");
    case "PHYSICS_EQUATION": return standard(`F=${a}ma`, `F=${a}ma`, `<mi>F</mi><mo>=</mo><mn>${a}</mn><mi>m</mi><mi>a</mi>`, "physics-equation");
    case "UNIT_EXPRESSION": return standard(`${a} m s^-2`, `${a}\\,\\mathrm{m\\,s^{-2}}`, `<mn>${a}</mn><mi>m</mi><msup><mi>s</mi><mrow><mo>-</mo><mn>2</mn></mrow></msup>`, "unit-expression");
    case "VECTOR_QUANTITY": return standard(`F=<${a},${b}> N`, `\\vec F=\\langle${a},${b}\\rangle\\,\\mathrm N`, `<mover><mi>F</mi><mo>→</mo></mover><mo>=</mo><mfenced><mn>${a}</mn><mn>${b}</mn></mfenced><mi>N</mi>`, "vector-quantity");
  }
}

function domainFormulaStructure(domain: BenchmarkDomain, index: number) {
  if (domain === "CHEMISTRY") return FORMULA_STRUCTURES[28 + index % 8];
  if (domain === "PHYSICS") return FORMULA_STRUCTURES[36 + index % 3];
  return FORMULA_STRUCTURES[index % FORMULA_STRUCTURES.length];
}

function hasFormula(domain: BenchmarkDomain, index: number) {
  return ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "FORMULA_RECOGNITION"].includes(domain) || (domain === "ANSWER_MAPPING" && index % 3 === 0) || (domain === "FAILURE_HANDLING" && index % 7 === 0);
}

function hasVisual(domain: BenchmarkDomain, index: number) {
  return ["VISUAL_RECOGNITION", "PHYSICS", "BIOLOGY"].includes(domain) || (domain === "CHEMISTRY" && index % 2 === 0) || (domain === "MATHEMATICS" && index % 4 === 0) || domain === "DOCUMENT_LAYOUT" || (domain === "FAILURE_HANDLING" && index % 5 === 0);
}

function stemFor(domain: BenchmarkDomain, topic: string, index: number, a: number, b: number) {
  const variant = index + 1;
  if (domain === "MATHEMATICS") return `Variant ${variant}: For ${topic}, determine the required value when a=${a} and b=${b}; preserve every mathematical symbol.`;
  if (domain === "PHYSICS") return `Variant ${variant}: Analyze the ${topic} situation with measured values ${a} and ${b}, including units and vector direction where applicable.`;
  if (domain === "CHEMISTRY") return `Variant ${variant}: Interpret the ${topic} representation for quantities ${a} and ${b}, preserving charges, conditions, arrows and notation.`;
  if (domain === "BIOLOGY") return `Variant ${variant}: Use the supplied ${topic} evidence to identify and relate structures ${a} and ${b}.`;
  if (domain === "ENGLISH") return `Variant ${variant}: Read the ${topic} item carefully—retain “quoted text”, apostrophes, punctuation, numbers ${a}/${b}, and special characters.`;
  if (domain === "FAILURE_HANDLING") return topic === "Empty document" ? "" : `Variant ${variant}: Deliberately degraded ${topic} evidence; preserve visible content and do not infer what is absent.`;
  return `Variant ${variant}: Reconstruct the ${topic} assessment structure using parameters ${a} and ${b} without inventing missing content.`;
}

function failureFor(topic: string) {
  const block = ["Corrupted PDF", "Empty document", "Password-protected PDF", "Broken encoding"].includes(topic);
  return { code: slug(topic).toUpperCase().replace(/-/g, "_"), disposition: block ? "BLOCK" as const : "PRESERVE_AND_REVIEW" as const, preserveOriginal: true as const, inventedContentAllowed: false as const };
}

function generateCase(domain: BenchmarkDomain, index: number): SyntheticBenchmarkCase {
  const topic = TOPICS[domain][index % TOPICS[domain].length];
  const questionType = BENCHMARK_QUESTION_TYPES[(index * 7 + BENCHMARK_DOMAINS.indexOf(domain)) % BENCHMARK_QUESTION_TYPES.length];
  const layoutType = BENCHMARK_LAYOUT_TYPES[(index * 3 + BENCHMARK_DOMAINS.indexOf(domain)) % BENCHMARK_LAYOUT_TYPES.length];
  const difficulty = BENCHMARK_DIFFICULTIES[(index + Math.floor(index / 17)) % BENCHMARK_DIFFICULTIES.length];
  const benchmarkId = `sub-v1-${slug(domain)}-${String(index + 1).padStart(4, "0")}`;
  const questionId = `${benchmarkId}-q1`;
  const a = index % 17 + 2;
  const b = index % 13 + 3;
  const negative = domain === "FAILURE_HANDLING";
  const formula = hasFormula(domain, index) ? [formulaExpectation(domainFormulaStructure(domain, index), index, `${benchmarkId}-f1`)] : [];
  const visual = hasVisual(domain, index) ? [{
    visualId: `${benchmarkId}-v1`, boundingBox: { page: 1, x: 0.08 + (index % 5) * 0.01, y: 0.18 + (index % 7) * 0.01, width: 0.35, height: 0.28 },
    objectType: VISUAL_STRUCTURES[(index * 5 + BENCHMARK_DOMAINS.indexOf(domain)) % VISUAL_STRUCTURES.length], labels: [`L${a}`, `L${b}`],
    relationships: [{ type: "SUPPORTS_QUESTION", targetId: questionId }], expectedCrop: { required: true, description: `Preserve the complete synthetic visual boundary for ${topic}.` }, expectedReadingOrder: 1 + formula.length
  }] : [];
  const optionIds = optionQuestionTypes.has(questionType) ? ["A", "B", "C", "D"].map((label) => `${questionId}-option-${label.toLowerCase()}`) : [];
  const failure = negative ? failureFor(topic) : null;
  const missingAnswer = negative && ["Missing answer", "Conflicting answer key"].includes(topic);
  const expectedAnswer = missingAnswer ? null : {
    answerId: `${benchmarkId}-a1`, kind: manualQuestionTypes.has(questionType) ? "MANUAL" : questionType === "NUMERICAL" ? "NUMERIC_TOLERANCE" : "STRUCTURED",
    value: manualQuestionTypes.has(questionType) ? `Rubric-grounded response ${a}-${b}` : questionType === "MULTIPLE_CORRECT_MCQ" ? ["A", "C"] : questionType === "TRUE_FALSE" ? index % 2 === 0 : questionType === "NUMERICAL" ? a / b : optionIds[0] ?? a + b,
    tolerance: questionType === "NUMERICAL" ? 0.01 : null, unit: domain === "PHYSICS" ? "SI_UNIT_REQUIRED" : null,
    status: negative ? "MANUAL_REVIEW" as const : manualQuestionTypes.has(questionType) ? "MANUAL_REVIEW" as const : "KNOWN" as const
  };
  const expectedSolution = negative ? null : { solutionId: `${benchmarkId}-s1`, kind: manualQuestionTypes.has(questionType) ? "RUBRIC" : "WORKED", steps: [`Identify ${topic}.`, `Apply parameters ${a} and ${b}.`, "Verify the result against the source evidence."], status: manualQuestionTypes.has(questionType) ? "MANUAL_REVIEW" as const : "KNOWN" as const };
  const relationships = [
    ...formula.map((item) => ({ relationshipId: `${benchmarkId}-r-formula`, sourceId: questionId, targetId: item.formulaId, type: "USES_FORMULA", required: true })),
    ...visual.map((item) => ({ relationshipId: `${benchmarkId}-r-visual`, sourceId: questionId, targetId: item.visualId, type: "USES_VISUAL", required: true })),
    ...(expectedAnswer ? [{ relationshipId: `${benchmarkId}-r-answer`, sourceId: questionId, targetId: expectedAnswer.answerId, type: "HAS_ANSWER", required: !negative }] : []),
    ...(expectedSolution ? [{ relationshipId: `${benchmarkId}-r-solution`, sourceId: questionId, targetId: expectedSolution.solutionId, type: "HAS_SOLUTION", required: false }] : [])
  ];
  const degradation = negative ? [slug(topic).toUpperCase().replace(/-/g, "_")] : layoutType.includes("SCAN") || layoutType === "MOBILE_PHOTOGRAPH" || layoutType === "ROTATED_CONTENT" ? [layoutType] : [];
  const pageCount = topic === "Empty document" ? 0 : layoutType.startsWith("MULTI_PAGE") || layoutType === "PAGE_BREAK" ? 2 + index % 3 : 1;
  const stem = stemFor(domain, topic, index, a, b);
  return {
    schemaVersion: SYNTHETIC_BENCHMARK_VERSION, benchmarkId, sourceType: SYNTHETIC_BENCHMARK_SOURCE_TYPE, certificationContribution: false,
    benchmarkDomain: domain, subject: subjectByDomain[domain], topic, difficulty, questionType,
    inputRepresentation: {
      format: topic === "Corrupted PDF" ? "CORRUPT_BINARY_MODEL" : hasVisual(domain, index) ? "SYNTHETIC_PAGE_MODEL" : "STRUCTURED_TEXT",
      content: [stem, ...formula.map((item) => item.originalExpression), ...optionIds.map((id, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. option ${a + optionIndex}`)].join("\n"),
      layoutType, languageCodes: topic === "Mixed languages" ? ["en", "hi"] : ["en"], pageCount,
      features: [questionType, topic, ...formula.map((item) => item.structureType), ...visual.map((item) => item.objectType)], degradation
    },
    expectedQuestionStructure: {
      questionId, stem, optionIds, childQuestionIds: questionType === "MULTI_PART" ? [`${questionId}-part-a`, `${questionId}-part-b`] : [],
      sourcePages: pageCount ? Array.from({ length: pageCount }, (_, page) => page + 1) : [], preserveIncompleteContent: negative
    },
    expectedFormula: formula, expectedMathML: formula.flatMap((item) => item.mathML ? [item.mathML] : []), expectedVisualStructure: visual,
    expectedAnswer, expectedSolution, expectedRelationships: relationships,
    expectedReadingOrder: [questionId, ...formula.map((item) => item.formulaId), ...visual.map((item) => item.visualId), ...optionIds],
    expectedConfidenceRules: negative
      ? { minimum: 0, maximum: 0.69, requiredReasons: ["DEGRADED_OR_INCOMPLETE_SOURCE", "NO_ACADEMIC_INVENTION"], outcome: failure?.disposition === "BLOCK" ? "BLOCK" : "NEEDS_REVIEW", neverInvent: true }
      : { minimum: 0.7, maximum: 1, requiredReasons: ["STRUCTURE_PRESERVED", "SOURCE_RELATIONSHIPS_PRESERVED"], outcome: manualQuestionTypes.has(questionType) ? "NEEDS_REVIEW" : "AUTO_CONTINUE", neverInvent: true },
    expectedFailureMode: failure
  };
}

export function generateSyntheticUniversalBenchmark() {
  return BENCHMARK_DOMAINS.flatMap((domain) => Array.from({ length: SYNTHETIC_CASES_PER_DOMAIN }, (_, index) => generateCase(domain, index)));
}

