import { env } from "../../../config/env.js";
import { ndieComplianceService } from "../security/compliance.service.js";

type WorkerRecord = {
  workerId: string;
  pool: "IMPORT" | "REPLAY" | "PUBLISH" | "DELIVERY" | "INTELLIGENCE";
  pid: number;
  startedAt: string;
  heartbeatAt: string;
  currentJobId?: string | null;
  currentStage?: string | null;
  shuttingDown: boolean;
};

const workers = new Map<string, WorkerRecord>();

function staleCutoff() {
  return Date.now() - env.NDIE_WORKER_HEARTBEAT_TTL_MS;
}

export const ndieWorkerRegistryService = {
  register(input: Pick<WorkerRecord, "workerId" | "pool"> & Partial<Pick<WorkerRecord, "currentJobId" | "currentStage">> & { sharedSecret?: string | null }) {
    const secret = ndieComplianceService.validateWorkerSecret(input.sharedSecret);
    if (!secret.valid) throw Object.assign(new Error("NDIE worker heartbeat rejected."), { statusCode: 403 });
    const now = new Date().toISOString();
    const current = workers.get(input.workerId);
    const record: WorkerRecord = {
      workerId: input.workerId,
      pool: input.pool,
      pid: process.pid,
      startedAt: current?.startedAt ?? now,
      heartbeatAt: now,
      currentJobId: input.currentJobId ?? current?.currentJobId ?? null,
      currentStage: input.currentStage ?? current?.currentStage ?? null,
      shuttingDown: current?.shuttingDown ?? false
    };
    workers.set(input.workerId, record);
    return record;
  },

  heartbeat(workerId: string, update: Partial<Pick<WorkerRecord, "currentJobId" | "currentStage">> = {}) {
    const current = workers.get(workerId);
    const pool = current?.pool ?? "INTELLIGENCE";
    return this.register({
      workerId,
      pool,
      currentJobId: update.currentJobId ?? current?.currentJobId ?? null,
      currentStage: update.currentStage ?? current?.currentStage ?? null
    });
  },

  gracefulShutdown(workerId: string) {
    const current = workers.get(workerId);
    if (!current) return null;
    const updated = { ...current, shuttingDown: true, heartbeatAt: new Date().toISOString() };
    workers.set(workerId, updated);
    return updated;
  },

  health() {
    const cutoff = staleCutoff();
    const rows = Array.from(workers.values());
    const active = rows.filter((worker) => new Date(worker.heartbeatAt).getTime() >= cutoff && !worker.shuttingDown);
    const stale = rows.filter((worker) => new Date(worker.heartbeatAt).getTime() < cutoff);
    return {
      registered: rows.length,
      active: active.length,
      stale: stale.length,
      shuttingDown: rows.filter((worker) => worker.shuttingDown).length,
      heartbeatTtlMs: env.NDIE_WORKER_HEARTBEAT_TTL_MS,
      pools: {
        import: active.filter((worker) => worker.pool === "IMPORT").length,
        replay: active.filter((worker) => worker.pool === "REPLAY").length,
        publish: active.filter((worker) => worker.pool === "PUBLISH").length,
        delivery: active.filter((worker) => worker.pool === "DELIVERY").length,
        intelligence: active.filter((worker) => worker.pool === "INTELLIGENCE").length
      },
      workers: rows.map((worker) => ({
        workerId: worker.workerId,
        pool: worker.pool,
        heartbeatAt: worker.heartbeatAt,
        currentStage: worker.currentStage,
        stale: new Date(worker.heartbeatAt).getTime() < cutoff,
        shuttingDown: worker.shuttingDown
      }))
    };
  }
};
