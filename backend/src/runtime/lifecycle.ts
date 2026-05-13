type RuntimePhase = "BOOTING" | "READY" | "DEGRADED" | "SHUTTING_DOWN";

const startedAt = new Date();
let phase: RuntimePhase = "BOOTING";
let lastError: string | null = null;

export function markRuntimeReady() {
  phase = "READY";
  lastError = null;
}

export function markRuntimeDegraded(error: unknown) {
  phase = "DEGRADED";
  lastError = error instanceof Error ? error.message : String(error);
}

export function markRuntimeShuttingDown() {
  phase = "SHUTTING_DOWN";
}

export function getRuntimeState() {
  return {
    phase,
    ready: phase === "READY",
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    lastError
  };
}
