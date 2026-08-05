import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "@jest/globals";
import { analyzeRealFileIntakeFile, realFileIntakeService } from "../modules/ndie/certification/real-file-intake.service.js";

const tempRoots: string[] = [];

function tempDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ndie-intake-"));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("NDIE Phase 4 - Real File Intake", () => {
  it("detects PDF signatures and suggests a matching mathematics slot", () => {
    const root = tempDir();
    const filePath = path.join(root, "nda-maths-paper.pdf");
    fs.writeFileSync(filePath, Buffer.from("%PDF-1.7\nrealistic test bytes"));

    const candidate = analyzeRealFileIntakeFile(filePath);

    expect(candidate.detectedFormat).toBe("PDF");
    expect(candidate.extensionMatchesSignature).toBe(true);
    expect(candidate.status).toBe("READY_FOR_SLOT");
    expect(candidate.suggestedSlots[0]?.slotId).toBe("nda-maths-pdf");
  });

  it("rejects files whose extension does not match their signature", () => {
    const root = tempDir();
    const filePath = path.join(root, "chemistry.pdf");
    fs.writeFileSync(filePath, Buffer.from([0xff, 0xd8, 0xff, 0x00]));

    const candidate = analyzeRealFileIntakeFile(filePath);

    expect(candidate.detectedFormat).toBe("JPG");
    expect(candidate.extensionMatchesSignature).toBe(false);
    expect(candidate.status).toBe("UNSUPPORTED");
  });

  it("detects duplicates during intake scanning", () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "jee-maths-1.pdf"), Buffer.from("%PDF-1.7\nsame"));
    fs.writeFileSync(path.join(root, "jee-maths-2.pdf"), Buffer.from("%PDF-1.7\nsame"));

    const report = realFileIntakeService.scan(root);

    expect(report.filesScanned).toBe(2);
    expect(report.duplicates).toBe(1);
    expect(report.candidates.some((candidate) => candidate.status === "DUPLICATE")).toBe(true);
  });
});
