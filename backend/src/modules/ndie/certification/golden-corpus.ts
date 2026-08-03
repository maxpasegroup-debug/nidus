export type NdieGoldenFixtureKind =
  | "SIMPLE_TEXT"
  | "MULTI_COLUMN"
  | "SCANNED"
  | "ROTATED"
  | "LOW_QUALITY_SCAN"
  | "DOCX"
  | "OFFICE_MATH"
  | "TABLES"
  | "GRAPHS"
  | "DIAGRAMS"
  | "CHEMISTRY"
  | "PHYSICS"
  | "MATHEMATICS"
  | "ENGINEERING_MATHEMATICS"
  | "JEE"
  | "NEET"
  | "NDA"
  | "CDS"
  | "AFCAT"
  | "UNIVERSITY"
  | "ANSWER_KEY_FORMAT"
  | "SOLUTION_FORMAT"
  | "LEGACY";

export type NdieGoldenFixture = {
  id: string;
  title: string;
  kind: NdieGoldenFixtureKind;
  subject: string;
  originalDocument: string;
  expected: {
    ocr: { pages: number; textBlocks: number; accuracyTarget: number };
    layout: { regions: number; columns: number; tables: number; figures: number; accuracyTarget: number };
    formulas: { count: number; latexCount: number; accuracyTarget: number };
    visuals: { diagrams: number; graphs: number; tables: number; accuracyTarget: number };
    questions: { count: number; types: string[]; accuracyTarget: number };
    answers: { mapped: number; formats: string[]; accuracyTarget: number };
    confidence: { minimum: number; calibrated: boolean };
  };
};

export const NDIE_GOLDEN_CORPUS_VERSION = "golden-corpus-v1";

export const NDIE_GOLDEN_FIXTURES: NdieGoldenFixture[] = [
  {
    id: "simple-text-mcq-v1",
    title: "Simple text MCQ paper",
    kind: "SIMPLE_TEXT",
    subject: "General Knowledge",
    originalDocument: "fixtures/simple-text-mcq.pdf",
    expected: {
      ocr: { pages: 2, textBlocks: 80, accuracyTarget: 0.98 },
      layout: { regions: 20, columns: 1, tables: 0, figures: 0, accuracyTarget: 0.96 },
      formulas: { count: 0, latexCount: 0, accuracyTarget: 1 },
      visuals: { diagrams: 0, graphs: 0, tables: 0, accuracyTarget: 1 },
      questions: { count: 25, types: ["SINGLE_CORRECT_MCQ"], accuracyTarget: 0.98 },
      answers: { mapped: 25, formats: ["INLINE_KEY"], accuracyTarget: 0.99 },
      confidence: { minimum: 0.95, calibrated: true }
    }
  },
  {
    id: "multi-column-nda-v1",
    title: "NDA multi-column competitive paper",
    kind: "NDA",
    subject: "NDA",
    originalDocument: "fixtures/nda-multi-column.pdf",
    expected: {
      ocr: { pages: 12, textBlocks: 720, accuracyTarget: 0.96 },
      layout: { regions: 210, columns: 2, tables: 1, figures: 2, accuracyTarget: 0.94 },
      formulas: { count: 14, latexCount: 14, accuracyTarget: 0.92 },
      visuals: { diagrams: 2, graphs: 0, tables: 1, accuracyTarget: 0.93 },
      questions: { count: 120, types: ["SINGLE_CORRECT_MCQ", "PASSAGE_BASED"], accuracyTarget: 0.96 },
      answers: { mapped: 120, formats: ["SEPARATE_KEY_PDF"], accuracyTarget: 0.98 },
      confidence: { minimum: 0.9, calibrated: true }
    }
  },
  {
    id: "math-formula-heavy-v1",
    title: "Mathematics formula-heavy paper",
    kind: "MATHEMATICS",
    subject: "Mathematics",
    originalDocument: "fixtures/math-formula-heavy.pdf",
    expected: {
      ocr: { pages: 8, textBlocks: 260, accuracyTarget: 0.94 },
      layout: { regions: 120, columns: 1, tables: 0, figures: 6, accuracyTarget: 0.94 },
      formulas: { count: 92, latexCount: 92, accuracyTarget: 0.95 },
      visuals: { diagrams: 6, graphs: 2, tables: 0, accuracyTarget: 0.94 },
      questions: { count: 40, types: ["SINGLE_CORRECT_MCQ", "NUMERICAL", "INTEGER_TYPE"], accuracyTarget: 0.95 },
      answers: { mapped: 40, formats: ["ANSWER_KEY_WITH_EXPLANATIONS"], accuracyTarget: 0.98 },
      confidence: { minimum: 0.88, calibrated: true }
    }
  },
  {
    id: "physics-diagram-heavy-v1",
    title: "Physics diagram and graph paper",
    kind: "PHYSICS",
    subject: "Physics",
    originalDocument: "fixtures/physics-diagram-heavy.pdf",
    expected: {
      ocr: { pages: 10, textBlocks: 310, accuracyTarget: 0.94 },
      layout: { regions: 150, columns: 1, tables: 2, figures: 18, accuracyTarget: 0.93 },
      formulas: { count: 64, latexCount: 64, accuracyTarget: 0.93 },
      visuals: { diagrams: 14, graphs: 4, tables: 2, accuracyTarget: 0.95 },
      questions: { count: 50, types: ["SINGLE_CORRECT_MCQ", "ASSERTION_REASON", "DIAGRAM_BASED"], accuracyTarget: 0.95 },
      answers: { mapped: 50, formats: ["ANSWER_ONLY_KEY", "SOLUTION_PDF"], accuracyTarget: 0.98 },
      confidence: { minimum: 0.88, calibrated: true }
    }
  },
  {
    id: "chemistry-notation-v1",
    title: "Chemistry notation and reaction paper",
    kind: "CHEMISTRY",
    subject: "Chemistry",
    originalDocument: "fixtures/chemistry-notation.pdf",
    expected: {
      ocr: { pages: 6, textBlocks: 220, accuracyTarget: 0.95 },
      layout: { regions: 90, columns: 1, tables: 3, figures: 5, accuracyTarget: 0.94 },
      formulas: { count: 48, latexCount: 48, accuracyTarget: 0.93 },
      visuals: { diagrams: 5, graphs: 0, tables: 3, accuracyTarget: 0.93 },
      questions: { count: 35, types: ["SINGLE_CORRECT_MCQ", "MATCH_THE_FOLLOWING"], accuracyTarget: 0.95 },
      answers: { mapped: 35, formats: ["SEPARATE_KEY_PDF"], accuracyTarget: 0.98 },
      confidence: { minimum: 0.88, calibrated: true }
    }
  },
  {
    id: "legacy-import-v1",
    title: "Old legacy question paper",
    kind: "LEGACY",
    subject: "Legacy",
    originalDocument: "fixtures/legacy-paper.pdf",
    expected: {
      ocr: { pages: 4, textBlocks: 150, accuracyTarget: 0.9 },
      layout: { regions: 55, columns: 1, tables: 1, figures: 1, accuracyTarget: 0.9 },
      formulas: { count: 8, latexCount: 8, accuracyTarget: 0.88 },
      visuals: { diagrams: 1, graphs: 0, tables: 1, accuracyTarget: 0.9 },
      questions: { count: 30, types: ["SINGLE_CORRECT_MCQ"], accuracyTarget: 0.94 },
      answers: { mapped: 30, formats: ["LEGACY_KEY"], accuracyTarget: 0.96 },
      confidence: { minimum: 0.82, calibrated: true }
    }
  }
];
