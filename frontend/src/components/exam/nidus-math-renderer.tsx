"use client";

import katex from "katex";

type MathToken = {
  type: "text" | "math";
  value: string;
  display?: boolean;
};

const delimiterPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

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
    if (index > cursor) tokens.push({ type: "text", value: text.slice(cursor, index) });
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
  options?: Array<{ key?: string; text?: string; latex?: string }>;
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
        if (block.type === "paragraph") return <NidusMathText key={key} text={block.text} />;
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
