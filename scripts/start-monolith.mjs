import { spawn } from "node:child_process";

const publicPort = process.env.PORT || "3000";
const apiPort = process.env.API_INTERNAL_PORT || "4000";
const shutdownSignals = ["SIGINT", "SIGTERM"];
const children = [];

function startProcess(name, command, args, env) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${name} stopped by ${signal}`);
      return;
    }

    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      stopAll();
      process.exit(code);
    }
  });

  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

for (const signal of shutdownSignals) {
  process.on(signal, () => {
    stopAll();
    process.exit(0);
  });
}

startProcess("backend-api", "node", ["backend/dist/server.js"], {
  PORT: apiPort,
  API_INTERNAL_PORT: apiPort
});

startProcess("frontend", "npm", ["run", "start", "--workspace", "frontend", "--", "-H", "0.0.0.0", "-p", publicPort], {
  PORT: publicPort,
  INTERNAL_API_URL: process.env.INTERNAL_API_URL || `http://127.0.0.1:${apiPort}`,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ""
});

console.log(`NIDUS monolith started: UI on :${publicPort}, API internally on :${apiPort}`);
