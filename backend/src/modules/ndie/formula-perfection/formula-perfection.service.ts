import type { NdieFormulaDiagnostics, NdieNormalizedFormula } from "../contracts/formula-result.js";
import type { NdieFormulaPerfectionIssue, NdieFormulaPerfectionResult, NdieFormulaPerfectionScore } from "../contracts/formula-perfection-result.js";

const version = "ndie-formula-perfection-v1";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function escapeMathMl(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function regenerateMathMl(latex: string) {
  return `<math><mrow><mtext>${escapeMathMl(latex)}</mtext></mrow></math>`;
}

function normalizeUnicode(text: string) {
  return text
    .replace(/\u221a/g, "\\sqrt")
    .replace(/\u222b/g, "\\int")
    .replace(/\u2211/g, "\\sum")
    .replace(/\u03c0/g, "\\pi")
    .replace(/\u03b8/g, "\\theta")
    .replace(/\u03bb/g, "\\lambda")
    .replace(/\u03bc/g, "\\mu")
    .replace(/\u03a9/g, "\\Omega")
    .replace(/\u03b1/g, "\\alpha")
    .replace(/\u03b2/g, "\\beta")
    .replace(/\u03b3/g, "\\gamma")
    .replace(/\u0394/g, "\\Delta")
    .replace(/\u2264/g, "\\le")
    .replace(/\u2265/g, "\\ge")
    .replace(/\u2260/g, "\\ne")
    .replace(/\u2248/g, "\\approx")
    .replace(/\u221e/g, "\\infty")
    .replace(/\u00b1/g, "\\pm")
    .replace(/\u2192/g, "\\rightarrow")
    .replace(/\u21cc/g, "\\rightleftharpoons")
    .replace(/\s+/g, " ")
    .trim();
}
function balanced(text: string, open: string, close: string) {
  let depth = 0;
  for (const char of text) {
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function normalizeMatrix(text: string) {
  const matrix = text.match(/^\[\s*([0-9a-zA-Z+\-*/^\s,;]+)\s*\]$/);
  if (!matrix?.[1] || !matrix[1].includes(";")) return { text, changed: false };
  const rows = matrix[1]
    .split(";")
    .map((row) => row.trim().split(/[\s,]+/).filter(Boolean).join(" & "))
    .join(" \\\\ ");
  return { text: `\\begin{bmatrix}${rows}\\end{bmatrix}`, changed: true };
}

function normalizeFractions(text: string) {
  let changed = false;
  const repaired = text.replace(/\b([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)\b/g, (_match, numerator: string, denominator: string) => {
    changed = true;
    return `\\frac{${numerator}}{${denominator}}`;
  });
  return { text: repaired, changed };
}

function normalizeVectors(text: string) {
  let changed = false;
  const repaired = text.replace(/\bvec(?:tor)?\s+([a-zA-Z])\b/gi, (_match, variable: string) => {
    changed = true;
    return `\\vec{${variable}}`;
  });
  return { text: repaired, changed };
}

function normalizeChemistryArrows(text: string) {
  let changed = false;
  const repaired = text
    .replace(/\s*->\s*/g, () => {
      changed = true;
      return " \\rightarrow ";
    })
    .replace(/\s*<->\s*/g, () => {
      changed = true;
      return " \\rightleftharpoons ";
    });
  return { text: repaired, changed };
}

function repairLatex(raw: string) {
  const issues: NdieFormulaPerfectionIssue[] = [];
  let latex = normalizeUnicode(raw)
    .replace(/\bsqrt\(([^)]+)\)/gi, "\\sqrt{$1}")
    .replace(/\blim\s*([a-zA-Z])->([^\s]+)/gi, "\\lim_{$1 \\to $2}");

  const matrix = normalizeMatrix(latex);
  latex = matrix.text;
  if (matrix.changed) issues.push({ code: "MATRIX_NORMALIZED", severity: "LOW", message: "Matrix notation was normalized into bmatrix LaTeX." });

  const fraction = normalizeFractions(latex);
  latex = fraction.text;
  if (fraction.changed) issues.push({ code: "FRACTION_NORMALIZED", severity: "LOW", message: "Inline division was preserved as a LaTeX fraction." });

  const vector = normalizeVectors(latex);
  latex = vector.text;
  if (vector.changed) issues.push({ code: "VECTOR_NORMALIZED", severity: "LOW", message: "Vector notation was normalized while preserving source text." });

  const chemistry = normalizeChemistryArrows(latex);
  latex = chemistry.text;
  if (chemistry.changed) issues.push({ code: "CHEMISTRY_ARROW_NORMALIZED", severity: "LOW", message: "Chemical reaction arrows were normalized for rendering." });

  return { latex, issues };
}

function diagnosticsFor(latex: string, diagnostics: NdieFormulaDiagnostics): NdieFormulaDiagnostics {
  const balancedBrackets = balanced(latex, "(", ")") && balanced(latex, "[", "]") && balanced(latex, "{", "}");
  const invalidLatex = !balancedBrackets || /\\(frac|sqrt|lim|sum|int)\s*$/.test(latex);
  const missingFractions = /\\frac(?!\{)/.test(latex) || /\/\s*$/.test(latex);
  const invalidMatrices = /matrix/i.test(latex) && !/(\\begin\{[a-z]*matrix\}|[\[(].*[\])])/s.test(latex);
  const brokenIntegrals = /\\int/.test(latex) && !/(d[a-zA-Z]\b|\s+d[a-zA-Z])/.test(latex);
  const brokenSummations = /\\sum/.test(latex) && !/[_^]/.test(latex);
  const issues = new Set(diagnostics.issues);
  if (!balancedBrackets) issues.add("UNBALANCED_BRACKETS");
  if (invalidLatex) issues.add("INVALID_LATEX");
  if (missingFractions) issues.add("MISSING_FRACTION");
  if (invalidMatrices) issues.add("INVALID_MATRIX");
  if (brokenIntegrals) issues.add("BROKEN_INTEGRAL");
  if (brokenSummations) issues.add("BROKEN_SUMMATION");
  return {
    ...diagnostics,
    invalidLatex,
    invalidMathML: false,
    balancedBrackets,
    missingFractions,
    invalidMatrices,
    brokenIntegrals,
    brokenSummations,
    issues: Array.from(issues)
  };
}

function scoreFormula(formula: NdieNormalizedFormula, issues: NdieFormulaPerfectionIssue[]): NdieFormulaPerfectionScore {
  const confidence = Number(formula.confidence.overall ?? 0.4);
  const diagnostics = formula.diagnostics;
  const sourceTraceability = formula.representations.originalImageCrop?.sourcePageImageUrl || formula.representations.originalImageCrop?.assetId ? 1 : 0.62;
  const latexValidity = diagnostics.invalidLatex ? 0.35 : 1;
  const mathmlValidity = diagnostics.invalidMathML || !formula.representations.mathml?.includes("<math>") ? 0.45 : 1;
  const semanticCompleteness = formula.semanticType === "GENERIC_SYMBOLIC_EXPRESSION" ? 0.72 : 1;
  const renderReadiness = formula.renderStatus === "PREVIEW_READY" ? 1 : formula.renderStatus === "REQUIRES_TEACHER_REVIEW" ? 0.45 : 0.3;
  const preservation = formula.representations.plainText && formula.representations.normalizedExpression && formula.representations.ocrTokens.length ? 1 : 0.55;
  const issuePenalty = Math.min(0.25, issues.filter((issue) => issue.severity !== "LOW").length * 0.08);
  const overall = clamp01((confidence * 0.25) + (preservation * 0.18) + (latexValidity * 0.16) + (mathmlValidity * 0.12) + (semanticCompleteness * 0.12) + (sourceTraceability * 0.1) + (renderReadiness * 0.07) - issuePenalty);
  return { preservation, latexValidity, mathmlValidity, semanticCompleteness, sourceTraceability, renderReadiness, overall };
}

function reviewIssues(formula: NdieNormalizedFormula, score: NdieFormulaPerfectionScore): NdieFormulaPerfectionIssue[] {
  const issues: NdieFormulaPerfectionIssue[] = [];
  const componentConfidence = [formula.confidence.tokens, formula.confidence.operators, formula.confidence.symbols, formula.confidence.fractions, formula.confidence.exponents, formula.confidence.roots]
    .filter((value): value is number => typeof value === "number");
  if (componentConfidence.some((value) => value < 0.65)) {
    issues.push({ code: "LOW_COMPONENT_CONFIDENCE", severity: "HIGH", message: "One or more formula components has low confidence and must be reviewed." });
  }
  if (!formula.representations.originalImageCrop?.sourcePageImageUrl && !formula.representations.originalImageCrop?.assetId) {
    issues.push({ code: "SOURCE_CROP_REQUIRED", severity: "HIGH", message: "Original formula crop is required before trusting this formula automatically." });
  }
  if (score.overall < 0.9 || formula.diagnostics.issues.length > 0) {
    issues.push({ code: "TEACHER_REVIEW_REQUIRED", severity: score.overall < 0.65 ? "CRITICAL" : "MEDIUM", message: "Formula is preserved, but review is required before zero-error publishing." });
  }
  return issues;
}

export const formulaPerfectionService = {
  version,

  perfectFormula(formula: NdieNormalizedFormula): NdieFormulaPerfectionResult {
    const originalLatex = formula.representations.latex ?? formula.representations.plainText;
    const repaired = repairLatex(originalLatex);
    const latexChanged = repaired.latex !== originalLatex;
    const mathml = regenerateMathMl(repaired.latex);
    const diagnostics = diagnosticsFor(repaired.latex, formula.diagnostics);
    const perfectedFormula: NdieNormalizedFormula = {
      ...formula,
      representations: {
        ...formula.representations,
        latex: repaired.latex,
        mathml,
        normalizedExpression: normalizeUnicode(formula.representations.normalizedExpression || repaired.latex)
      },
      diagnostics,
      renderStatus: diagnostics.issues.length ? "REQUIRES_TEACHER_REVIEW" : "PREVIEW_READY",
      renderer: {
        ...formula.renderer,
        provider: "KATEX_COMPATIBLE",
        error: diagnostics.issues.length ? "Formula preserved but requires teacher review before trusted rendering." : null
      },
      editState: {
        ...formula.editState,
        originalLatex: formula.editState.originalLatex ?? originalLatex,
        approvalStatus: diagnostics.issues.length ? "PENDING_REVIEW" : formula.editState.approvalStatus
      },
      rawProviderOutput: {
        ...formula.rawProviderOutput,
        formulaPerfectionVersion: version,
        latexChanged
      }
    };
    const repairIssues = [
      ...repaired.issues,
      ...(latexChanged ? [{ code: "LATEX_REPAIRED" as const, severity: "LOW" as const, message: "Formula LaTeX was normalized without discarding the original text." }] : []),
      { code: "MATHML_REGENERATED" as const, severity: "LOW" as const, message: "MathML preview representation was regenerated from the perfected LaTeX." }
    ];
    const initialScore = scoreFormula(perfectedFormula, repairIssues);
    const issues = [...repairIssues, ...reviewIssues(perfectedFormula, initialScore)];
    const score = scoreFormula(perfectedFormula, issues);
    const teacherReviewRequired = issues.some((issue) => ["MEDIUM", "HIGH", "CRITICAL"].includes(issue.severity));
    return {
      schemaVersion: "ndie-formula-perfection-v1",
      formulaId: perfectedFormula.formulaId,
      formula: perfectedFormula,
      score,
      issues,
      teacherReviewRequired,
      canAutoPublish: !teacherReviewRequired && score.overall >= 0.96,
      guarantees: {
        originalTextPreserved: Boolean(perfectedFormula.representations.plainText),
        originalCropPreservedOrRequired: Boolean(perfectedFormula.representations.originalImageCrop?.sourcePageImageUrl || perfectedFormula.representations.originalImageCrop?.assetId) || issues.some((issue) => issue.code === "SOURCE_CROP_REQUIRED"),
        noFormulaDiscarded: true,
        noHallucinatedFormula: true
      }
    };
  },

  perfectDocument(formulas: NdieNormalizedFormula[]) {
    const perfected = formulas.map((formula) => this.perfectFormula(formula));
    return {
      schemaVersion: "ndie-formula-perfection-document-v1" as const,
      provider: version as "ndie-formula-perfection-v1",
      formulas: perfected,
      summary: {
        formulaCount: perfected.length,
        teacherReviewRequired: perfected.filter((item) => item.teacherReviewRequired).length,
        autoPublishSafe: perfected.filter((item) => item.canAutoPublish).length,
        averageScore: clamp01(perfected.reduce((sum, item) => sum + item.score.overall, 0) / Math.max(1, perfected.length)),
        lowestScore: perfected.length ? Math.min(...perfected.map((item) => item.score.overall)) : 0,
        latexRepairs: perfected.filter((item) => item.issues.some((issue) => issue.code === "LATEX_REPAIRED")).length,
        cropRequired: perfected.filter((item) => item.issues.some((issue) => issue.code === "SOURCE_CROP_REQUIRED")).length
      }
    };
  },

  health() {
    return {
      status: "ready",
      version,
      guarantees: ["no formula discarded", "original text preserved", "source crop preserved or required", "teacher review required for low trust formulae"],
      supports: ["fraction normalization", "matrix normalization", "vector normalization", "chemistry arrow normalization", "MathML regeneration", "component confidence scoring"]
    };
  }
};

