"use client";

import Link from "next/link";
import { BookOpen, Download, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { facultyManualText, facultyMenuManual } from "@/components/faculty/faculty-menu-manual";
import { Button } from "@/components/ui/button";

export function FacultyManualCard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const manualText = useMemo(() => facultyManualText(), []);

  function downloadManual() {
    const blob = new Blob([manualText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nidus-faculty-user-manual.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="premium-surface rounded-lg p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded bg-gold/15 p-3 text-gold-soft">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Faculty User Manual</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Application facilities and uses</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Open or download the complete faculty menu guide with facilities, benefits, and module paths.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsOpen((current) => !current)}>
            <ExternalLink className="h-4 w-4" />
            {isOpen ? "Close Manual" : "Open Manual"}
          </Button>
          <Button type="button" onClick={downloadManual}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-5 overflow-hidden rounded border border-white/10 bg-navy-deep/55">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-navy-deep text-xs uppercase tracking-[0.16em] text-gold-soft">
                <tr>
                  <th className="w-14 border-b border-white/10 px-4 py-3">No</th>
                  <th className="border-b border-white/10 px-4 py-3">Menu</th>
                  <th className="border-b border-white/10 px-4 py-3">Facilities</th>
                  <th className="border-b border-white/10 px-4 py-3">Benefits / Uses</th>
                  <th className="border-b border-white/10 px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {facultyMenuManual.map((item, index) => (
                  <tr key={item.menu} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-4 text-muted">{index + 1}</td>
                    <td className="px-4 py-4 font-semibold text-white">{item.menu}</td>
                    <td className="px-4 py-4 leading-6 text-muted">{item.facilities}</td>
                    <td className="px-4 py-4 leading-6 text-muted">{item.benefits}</td>
                    <td className="px-4 py-4">
                      <Link href={item.href} className="inline-flex min-h-10 items-center justify-center rounded border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/15">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
