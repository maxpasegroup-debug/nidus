import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const npmCommand = "npm";
const backendEnv = readBackendEnv();
const backendPort = process.env.PORT ?? backendEnv.PORT ?? "5000";
const backendTarget = process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${backendPort}`;
const backendHealthUrl = `${backendTarget.replace(/\/$/, "")}/api/health`;
const processes = [];
let shuttingDown = false;

main().catch((error) => {
  console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
});

async function main() {
  const backend = startProcess("backend", ["run", "dev:backend"]);

  try {
    await waitForBackend();
  } catch (error) {
    console.error(`[backend] failed health check at ${backendHealthUrl}`);
    throw error;
  }

  startProcess("frontend", ["run", "dev:frontend"], {
    API_PROXY_TARGET: backendTarget,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "/api"
  });

  return backend;
}

function startProcess(name, args, extraEnv = {}) {
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv
    },
    shell: process.platform === "win32",
    stdio: "pipe"
  });

  processes.push(child);

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[${name}] exited ${signal ? `with signal ${signal}` : `with code ${code}`}`);
    shutdown(code ?? 1);
  });

  return child;
}

async function waitForBackend() {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(backendHealthUrl);

      if (response.ok) {
        console.log(`[backend] health check passed at ${backendHealthUrl}`);
        return;
      }
    } catch (_error) {
      // Backend is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Backend did not become ready within ${timeoutMs / 1000}s`);
}

function readBackendEnv() {
  const envPath = join(process.cwd(), "backend", ".env");

  if (!existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

function shutdown(code = 0) {
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
