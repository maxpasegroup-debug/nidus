"use client";

import { BrainCircuit, ExternalLink, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/services/api";
import { createToprankAdminSession, createToprankSession, getToprankStatus, type ToprankExamSlug, toprankExamOptions } from "@/services/toprank";

export function ToprankLaunchCard({ adminLinks = false }: { adminLinks?: boolean }) {
  const { showToast } = useToast();
  const [examSlug, setExamSlug] = useState<ToprankExamSlug>("nda-army");
  const [isLaunching, setIsLaunching] = useState(false);
  const [adminTarget, setAdminTarget] = useState<"admin" | "ops" | null>(null);
  const status = useQuery({ queryKey: ["toprank", "status"], queryFn: getToprankStatus, retry: 1 });

  async function launchMission() {
    setIsLaunching(true);
    try {
      const { launchUrl } = await createToprankSession(examSlug);
      window.location.assign(launchUrl);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsLaunching(false);
    }
  }

  async function launchAdmin(target: "admin" | "ops") {
    setAdminTarget(target);
    try {
      const { launchUrl } = await createToprankAdminSession(target);
      window.location.assign(launchUrl);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setAdminTarget(null);
    }
  }

  return (
    <section className="premium-surface rounded-lg p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div>
          <div className="flex items-start gap-3">
            <div className="rounded border border-gold/25 bg-gold/10 p-3 text-gold">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">NDA Mission Engine</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">TOPRANK NDA AI Training</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Personal NDA performance coach for speed, accuracy, memory, discipline, and rank readiness.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Mission Route</span>
              <select
                value={examSlug}
                onChange={(event) => setExamSlug(event.target.value as ToprankExamSlug)}
                className="h-12 w-full rounded border border-white/10 bg-navy-deep/70 px-4 text-sm font-semibold text-white outline-none transition focus:border-gold/60"
              >
                {toprankExamOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="button" onClick={launchMission} disabled={isLaunching} className="w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" />
                {isLaunching ? "Launching..." : "Start NDA Mission"}
              </Button>
            </div>
          </div>

          {adminLinks ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => launchAdmin("admin")} disabled={Boolean(adminTarget)}>
                {adminTarget === "admin" ? "Opening..." : "TOPRANK NDA Admin"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => launchAdmin("ops")} disabled={Boolean(adminTarget)}>
                {adminTarget === "ops" ? "Opening..." : "TOPRANK Ops"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded border border-white/10 bg-navy-deep/55 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-gold" />
            NIDUS TOPRANK Status
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            {[
              ["Profile saved", status.data?.profileSaved],
              ["Diagnostic completed", status.data?.diagnosticCompleted],
              ["Roadmap approved", status.data?.roadmapApproved],
              ["Readiness score", typeof status.data?.readinessScore === "number" ? `${status.data.readinessScore}/100` : "--"],
              ["Next action", status.data?.nextAction ?? "TOPRANK status will appear after your first mission."]
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-start justify-between gap-3 rounded border border-white/10 bg-white/[0.035] px-3 py-2">
                <span className="text-muted">{String(label)}</span>
                <span className="max-w-[13rem] text-right font-semibold text-white">{typeof value === "boolean" ? (value ? "Yes" : "Pending") : String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
