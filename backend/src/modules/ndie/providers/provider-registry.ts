import type { NdieProvider, NdieProviderHealth, NdieProviderKind } from "../contracts/providers.js";

export class ProviderRegistry {
  private readonly providers = new Map<string, NdieProvider>();

  register(provider: NdieProvider) {
    this.providers.set(provider.id, provider);
  }

  get<T extends NdieProvider = NdieProvider>(id: string) {
    return this.providers.get(id) as T | undefined;
  }

  list(kind?: NdieProviderKind) {
    return Array.from(this.providers.values()).filter((provider) => !kind || provider.kind === kind);
  }

  health(): NdieProviderHealth[] {
    return this.list().map((provider) => provider.health());
  }
}

export function createDisabledProvider(id: string, kind: NdieProviderKind, displayName: string): NdieProvider {
  return {
    id,
    kind,
    displayName,
    isEnabled: () => false,
    health: () => ({
      id,
      kind,
      enabled: false,
      configured: false,
      status: "NOT_CONFIGURED"
    })
  };
}
