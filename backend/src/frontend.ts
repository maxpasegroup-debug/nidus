import type { Express, NextFunction, Request, Response } from "express";
import next from "next";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

function frontendDir() {
  const candidates = [
    resolve(process.cwd(), "frontend"),
    resolve(process.cwd(), "..", "frontend")
  ];
  const found = candidates.find((candidate) => existsSync(resolve(candidate, "package.json")));
  if (!found) throw new Error("Frontend package not found. Build image must include /frontend.");
  return found;
}

export async function attachProductionFrontend(app: Express) {
  if (env.NODE_ENV !== "production" || process.env.SERVE_FRONTEND === "false") {
    return false;
  }

  const dir = frontendDir();
  const createNextApp = next as unknown as (options: {
    dev: boolean;
    dir: string;
    hostname: string;
    port: number;
  }) => {
    prepare: () => Promise<void>;
    getRequestHandler: () => (req: Request, res: Response) => Promise<void>;
  };
  const nextApp = createNextApp({
    dev: false,
    dir,
    hostname: "0.0.0.0",
    port: Number(process.env.PORT || env.PORT || 8080)
  });
  const handler = nextApp.getRequestHandler();
  await nextApp.prepare();

  app.use((req: Request, res: Response, nextMiddleware: NextFunction) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
      nextMiddleware();
      return;
    }
    void handler(req, res);
  });

  logger.info("NIDUS frontend attached to backend process", { dir });
  return true;
}
