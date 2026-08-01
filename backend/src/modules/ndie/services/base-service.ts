import { logger } from "../../../utils/logger.js";

export type NdieServiceHealth = {
  name: string;
  status: "READY" | "DISABLED";
  responsibility: string;
};

export class NdieFoundationService {
  constructor(
    public readonly name: string,
    public readonly responsibility: string,
    private readonly enabled: boolean
  ) {}

  health(): NdieServiceHealth {
    return {
      name: this.name,
      status: this.enabled ? "READY" : "DISABLED",
      responsibility: this.responsibility
    };
  }

  logReady() {
    logger.info("NDIE service registered", { component: "ndie", service: this.name, enabled: this.enabled });
  }
}
