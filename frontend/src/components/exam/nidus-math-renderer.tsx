"use client";

import katex from "katex";

type MathToken = {
  type: "text" | "math";
  value: string;
  display?: boolean;
};

export type NidusRichSegment =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; sourceText?: string; confidence?: number; origin?: string };

function renderPlainSegment(text: string) {
  return text.split("\n").map((line, index, lines) => (
    <span key={index}>{line}{index < lines.length - 1 ? <br /> : null}</span>
  ));
}

/** Render trusted backend segments without applying text heuristics. */
export function NidusRichSegments({ segments, className = "" }: { segments?: NidusRichSegment[]; className?: string }) {
  if (!Array.isArray(segments) || !segments.length) return null;
  return <span className={className}>{segments.map((segment, index) => segment.type === "math"
    ? <span key={index} className="inline-block align-middle"><NidusMathText text={`$${segment.latex}$`} /></span>
    : <span key={index}>{renderPlainSegment(segment.text)}</span>)}</span>;
}

const delimiterPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

const autoMathPattern = /(\[[^\[\]\n]*;[^\[\]\n]*\]|\|[^|\n;]+(?:;[^|\n;]+)+\||\b(?:log|ln|sin|cos|tan|cot|sec|cosec)(?:\s*(?:_|₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)\s*\{?[0-9]+\}?)\s*[A-Za-z0-9().]+|\blog10(?:\s*\d{2,}|\d{2,})\b|\b(?:log|ln|sin|cos|tan|cot|sec|cosec)[₀₁₂₃₄₅₆₇₈₉]+[A-Za-z0-9().]+|\b[A-Za-z][A-Za-z0-9]*[\^_][A-Za-z0-9]+|\b[A-Za-z0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾]+|√(?:\s*\([^\n)]*\)|\s*[A-Za-z0-9]+)|(?<![\w\/])\d+\s*\/\s*\d+(?![\/\d])|(?<!\w)[A-Za-zα-ωΑ-Ω0-9]+\s*(?:=|\+|−|×|÷|≤|≥|≠|≈|±|<|>|\s-\s)\s*[A-Za-zα-ωΑ-Ω0-9().]+(?:\s*(?:\+|−|×|÷|≤|≥|≠|≈|±|<|>|\s-\s)\s*[A-Za-zα-ωΑ-Ω0-9().]+)*(?!\w)|[√∫∑πθαβγΔΩ∞≈≤≥÷×±∈])/g;

const unicodeSubscript: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
const unicodeSuperscript: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-", "⁽": "(", "⁾": ")" };

function replaceUnicodePowers(value: string) {
  return value
    .replace(/([A-Za-z0-9])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾]+)/g, (_, base: string, power: string) => `${base}^{${[...power].map((char) => unicodeSuperscript[char] ?? char).join("")}}`)
    .replace(/([A-Za-z]+)([₀₁₂₃₄₅₆₇₈₉]+)/g, (_, base: string, subscript: string) => `${base}_{${[...subscript].map((char) => unicodeSubscript[char] ?? char).join("")}}`);
}

function autoMathLatex(value: string) {
  const trimmed = value.trim();
  const matrix = trimmed.match(/^\[([^\[\]]*(?:;[^\[\]]+)+)\]$/);
  if (matrix) {
    const rows = matrix[1].split(";").map((row) => row.trim().split(/\s+/).join(" & "));
    return `\\begin{bmatrix}${rows.join("\\\\")}\\end{bmatrix}`;
  }
  const determinant = trimmed.match(/^\|([^|]+(?:;[^|]+)+)\|$/);
  if (determinant) {
    const rows = determinant[1].split(";").map((row) => row.trim().split(/\s+/).join(" & "));
    return `\\begin{vmatrix}${rows.join("\\\\")}\\end{vmatrix}`;
  }
  const unicodeLogarithm = trimmed.match(/^(log|ln|sin|cos|tan|cot|sec|cosec)([₀₁₂₃₄₅₆₇₈₉]+)([A-Za-z0-9().]+)$/i);
  if (unicodeLogarithm) {
    const functionName = unicodeLogarithm[1].toLowerCase();
    const base = [...unicodeLogarithm[2]].map((char) => unicodeSubscript[char] ?? char).join("");
    const argument = unicodeLogarithm[3];
    return functionName === "log" ? `\\log_{${base}}${argument}` : `\\${functionName}${argument}`;
  }
  const compactLog = trimmed.match(/^log10(?:\s*)(\d{2,})$/i);
  if (compactLog) return `\\log_{10}${compactLog[1]}`;
  const logarithm = trimmed.match(/^(log|ln|sin|cos|tan|cot|sec|cosec)\s*(?:_\{?([0-9]+)\}?\s*)?([A-Za-z0-9().]+)$/i);
  if (logarithm) {
    const functionName = logarithm[1].toLowerCase();
    const base = logarithm[2];
    const argument = logarithm[3];
    if (functionName === "log" && base && argument) return `\\log_{${base}}${argument}`;
    return `\\${functionName}${argument}`;
  }
  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return `\\frac{${fraction[1]}}{${fraction[2]}}`;
  const root = trimmed.match(/^√\s*(?:\(([^)]*)\)|([A-Za-z0-9]+))$/);
  if (root) return `\\sqrt{${root[1] ?? root[2]}}`;
  return replaceUnicodePowers(trimmed)
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/±/g, "\\pm ")
    .replace(/−/g, "-")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
    .replace(/([A-Za-z0-9])\^([A-Za-z0-9]+)/g, "$1^{$2}")
    .replace(/([A-Za-z0-9])_([A-Za-z0-9]+)/g, "$1_{$2}");
}

function tokenizeAutoMathText(text: string): MathToken[] {
  const tokens: MathToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(autoMathPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ type: "text", value: text.slice(cursor, index) });
    const raw = match[0];
    const latex = autoMathLatex(raw);
    tokens.push({ type: "math", value: latex });
    cursor = index + raw.length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}

function stripDelimiter(value: string) {
  if (value.startsWith("$$") && value.endsWith("$$")) return { value: value.slice(2, -2), display: true };
  if (value.startsWith("\\[") && value.endsWith("\\]")) return { value: value.slice(2, -2), display: true };
  if (value.startsWith("\\(") && value.endsWith("\\)")) return { value: value.slice(2, -2), display: false };
  if (value.startsWith("$") && value.endsWith("$")) return { value: value.slice(1, -1), display: false };
  return { value, display: false };
}

function tokenizeMathText(text: string): MathToken[] {
  const tokens: MathToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(delimiterPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push(...tokenizeAutoMathText(text.slice(cursor, index)));
    const stripped = stripDelimiter(match[0]);
    tokens.push({ type: "math", value: stripped.value.trim(), display: stripped.display });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens.length ? tokens : [{ type: "text", value: text }];
}

function renderMath(value: string, displayMode: boolean) {
  try {
    return katex.renderToString(value, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: "html",
    });
  } catch {
    return "";
  }
}

export function NidusMathText({ text, className = "" }: { text?: string | null; className?: string }) {
  const safeText = text ?? "";
  const tokens = tokenizeMathText(safeText);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return token.value.split("\n").map((line, lineIndex, lines) => (
            <span key={`${index}-${lineIndex}`}>
              {line}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          ));
        }
        const html = renderMath(token.value, Boolean(token.display));
        if (!html) return <span key={index}>{token.value}</span>;
        return (
          <span
            key={index}
            className={token.display ? "my-3 block overflow-x-auto" : "inline-block align-middle"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}

type RichBlock = {
  id?: string;
  type?: string;
  text?: string;
  latex?: string;
  displayMode?: boolean;
  url?: string;
  alt?: string;
  caption?: string;
  description?: string;
  rows?: string[][];
  options?: Array<{ key?: string; text?: string; latex?: string; segments?: NidusRichSegment[] }>;
  segments?: NidusRichSegment[];
};

function richBlocks(value: unknown): RichBlock[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const blocks = (value as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) ? blocks.filter((block): block is RichBlock => Boolean(block && typeof block === "object" && !Array.isArray(block))) : [];
}

export function NidusQuestionContent({ content, fallbackText, imageUrl }: { content?: unknown; fallbackText?: string | null; imageUrl?: string | null }) {
  const blocks = richBlocks(content).filter((block) => block.type !== "options" && block.type !== "explanation");
  if (!blocks.length) {
    return (
      <>
        <NidusMathText text={fallbackText} />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mt-4 max-h-64 w-auto rounded border border-[#071d36]/10 object-contain" />
        ) : null}
      </>
    );
  }
  return (
    <div className="grid gap-3">
      {blocks.map((block, index) => {
        const key = block.id || `${block.type}-${index}`;
        if (block.type === "paragraph") return block.segments?.length ? <NidusRichSegments key={key} segments={block.segments} /> : <NidusMathText key={key} text={block.text} />;
        if (block.type === "formula") return <NidusMathText key={key} text={block.latex ? (block.displayMode ? `$$${block.latex}$$` : `$${block.latex}$`) : block.text} />;
        if (block.type === "image") {
          return block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={key} src={block.url} alt={block.alt || ""} className="max-h-64 w-auto rounded border border-[#071d36]/10 object-contain" />
          ) : null;
        }
        if (block.type === "table" && Array.isArray(block.rows)) {
          return (
            <div key={key} className="overflow-x-auto rounded border border-[#071d36]/10">
              <table className="min-w-full border-collapse text-sm">
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="border border-[#071d36]/10 px-3 py-2"><NidusMathText text={cell} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "diagram" || block.type === "graph") {
          return <p key={key} className="rounded border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{block.description}</p>;
        }
        return null;
      })}
    </div>
  );
}
