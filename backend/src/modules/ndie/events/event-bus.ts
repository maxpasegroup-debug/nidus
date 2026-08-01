import { randomUUID } from "node:crypto";
import { logger } from "../../../utils/logger.js";
import type { NdiePipelineEvent, NdiePipelineEventName } from "../contracts/pipeline-events.js";

type EventHandler = (event: NdiePipelineEvent) => void | Promise<void>;

export class NdieEventBus {
  private readonly handlers = new Map<NdiePipelineEventName, EventHandler[]>();

  on(name: NdiePipelineEventName, handler: EventHandler) {
    const handlers = this.handlers.get(name) ?? [];
    handlers.push(handler);
    this.handlers.set(name, handlers);
  }

  async emit(name: NdiePipelineEventName, payload?: Record<string, unknown>, importJobId?: string) {
    const event: NdiePipelineEvent = {
      id: randomUUID(),
      importJobId,
      name,
      occurredAt: new Date().toISOString(),
      payload
    };
    logger.info("NDIE pipeline event emitted", { component: "ndie", event: name, importJobId });
    for (const handler of this.handlers.get(name) ?? []) await handler(event);
    return event;
  }
}
