import type { LayoutProvider } from "../contracts/providers.js";

function lineCoordinates(index: number, total: number) {
  const safeTotal = Math.max(1, total);
  const lineHeight = Math.min(0.05, 0.86 / safeTotal);
  return {
    page: 1,
    x: 0.06,
    y: Math.min(0.94, 0.07 + index * lineHeight),
    width: 0.88,
    height: lineHeight,
    rotation: 0
  };
}

export class RuleBasedLayoutProvider implements LayoutProvider {
  readonly id = "layout.rule-based";
  readonly kind = "LAYOUT" as const;
  readonly displayName = "NDIE Rule-Based Layout Analyzer";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async analyze(input: {
    pageNumber: number;
    width?: number | null;
    height?: number | null;
    imageUrl?: string | null;
    ocrText?: string | null;
  }) {
    const lines = String(input.ocrText || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      const coordinates = { page: input.pageNumber, x: 0, y: 0, width: 1, height: 1, rotation: 0 };
      return {
        elements: [{
          elementType: "PAGE_REGION",
          normalizedText: "",
          coordinates,
          readingOrder: 0,
          confidence: input.imageUrl ? 0.65 : 0.35,
          metadata: {
            provider: this.id,
            reason: input.imageUrl ? "Rendered page image is available; OCR text is pending." : "Page placeholder exists; rendered image and OCR text are pending.",
            width: input.width ?? null,
            height: input.height ?? null
          }
        }],
        layoutJson: {
          provider: this.id,
          pageNumber: input.pageNumber,
          regions: 1,
          textLines: 0,
          hasImage: Boolean(input.imageUrl),
          readingOrder: "PAGE_PLACEHOLDER"
        },
        confidence: input.imageUrl ? 0.65 : 0.35
      };
    }

    return {
      elements: lines.map((line, index) => ({
        elementType: "TEXT_LINE",
        text: line,
        normalizedText: line.toLowerCase(),
        coordinates: { ...lineCoordinates(index, lines.length), page: input.pageNumber },
        readingOrder: index + 1,
        confidence: 0.78,
        metadata: {
          provider: this.id,
          source: "OCR_TEXT",
          likelyColumn: line.length > 80 ? "FULL_WIDTH" : "UNKNOWN"
        }
      })),
      layoutJson: {
        provider: this.id,
        pageNumber: input.pageNumber,
        regions: lines.length,
        textLines: lines.length,
        hasImage: Boolean(input.imageUrl),
        readingOrder: "TOP_TO_BOTTOM_ESTIMATED"
      },
      confidence: 0.78
    };
  }
}
