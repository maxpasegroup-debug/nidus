import PDFDocument from "pdfkit";
import { assessmentReportRendererService } from "./assessment-report-renderer.service.js";

type RenderedReport = ReturnType<typeof assessmentReportRendererService.render>;

function collectPdf(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function addHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0b1b35").text("NIDUS Defence Assessment Arena", 48, 34, { width: 500 });
  doc.font("Helvetica").fontSize(9).fillColor("#42526e").text(subtitle, 48, 54, { width: 500 });
  doc.moveTo(48, 74).lineTo(547, 74).strokeColor("#d8dee9").stroke();
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text(title, 48, 92, { width: 500 });
}

function addFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc.moveTo(48, 780).lineTo(547, 780).strokeColor("#d8dee9").stroke();
    doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(`Page ${index + 1} of ${range.count}`, 48, 789, { width: 500, align: "right" });
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 80) {
  if (doc.y + needed > 760) doc.addPage();
}

function addSection(doc: PDFKit.PDFDocument, section: RenderedReport["sections"][number]) {
  ensureSpace(doc, 90);
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0b1b35").text(section.title, { width: 500 });
  doc.moveDown(0.4);

  if ("rows" in section && section.rows?.length) {
    for (const row of section.rows) {
      ensureSpace(doc, 26);
      const cells = row.map((cell) => String(cell));
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text(cells[0] ?? "", { continued: false, width: 190 });
      doc.font("Helvetica").fontSize(9).fillColor("#374151").text(cells.slice(1).join("  |  "), 250, doc.y - 11, { width: 295 });
      doc.moveDown(0.35);
    }
  }

  if ("bullets" in section && section.bullets?.length) {
    for (const bullet of section.bullets) {
      ensureSpace(doc, 28);
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(`- ${String(bullet)}`, { width: 500, lineGap: 2 });
    }
  }
}

export const assessmentReportPdfService = {
  async generate(snapshot: { id: string; audience: string; report: unknown; createdAt: Date }) {
    const rendered = assessmentReportRendererService.render(snapshot);
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      bufferPages: true,
      autoFirstPage: true
    });
    const done = collectPdf(doc);

    addHeader(doc, rendered.title, rendered.subtitle);
    doc.y = 135;
    for (const section of rendered.sections) addSection(doc, section);
    addFooter(doc);
    doc.end();

    return done;
  }
};
