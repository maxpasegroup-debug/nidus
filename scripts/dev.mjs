import { spawn } from "node:child_process";

const npmCommand = "npm";
let shuttingDown = false;

const processes = [
  ["backend", ["run", "dev:backend"]],
  ["frontend", ["run", "dev:frontend"]]
].map(([name, args]) => {
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === "win32",
    stdio: "pipe"
  });

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
});

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
