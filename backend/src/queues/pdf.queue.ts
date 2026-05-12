import PDFDocument from "pdfkit";
import { addJob, createWorker, queueNames } from "./queue.config.js";
import { logger } from "../utils/logger.js";

export type PDFJob = { title: string; lines: string[]; storageKey?: string };

export function enqueuePDF(payload: PDFJob) {
  return addJob(queueNames.pdf, "generate-pdf", payload, { attempts: 2 });
}

export function startPDFWorker() {
  return createWorker<PDFJob>(queueNames.pdf, async (job) => {
    const doc = new PDFDocument();
    let bytes = 0;
    doc.on("data", (chunk: Buffer) => { bytes += chunk.length; });
    doc.text(job.data.title);
    job.data.lines.forEach((line) => doc.text(line));
    doc.end();
    logger.info("PDF generated in worker", { title: job.data.title, bytes });
    return { bytes };
  });
}
